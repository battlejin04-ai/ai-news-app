import { inArray } from "drizzle-orm";
import Parser from "rss-parser";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { enrichPendingArticles } from "@/lib/ai/enrich-articles";

const FEEDS = [
  {
    source: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    source: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
] as const;

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_CONTENT_CHARS = 1500;

type FeedArticle = {
  url: string;
  source: string;
  originalTitle: string;
  content: string;
  publishedAt: Date | null;
};

export type FetchResult = {
  added: number;
  skipped: number;
  enriched: number;
  failed: number;
  feedErrors: string[];
};

const parser = new Parser({ timeout: 15_000 });

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function readFeed(feed: (typeof FEEDS)[number]): Promise<FeedArticle[]> {
  const parsed = await parser.parseURL(feed.url);
  const cutoff = Date.now() - WINDOW_MS;
  return parsed.items
    .filter((item) => item.link && item.title)
    .map((item) => {
      const date = item.isoDate ?? item.pubDate;
      const publishedAt = date ? new Date(date) : null;
      return {
        url: item.link!,
        source: feed.source,
        originalTitle: item.title!.trim(),
        content: stripHtml(
          item.contentSnippet ?? item.content ?? item.summary ?? "",
        ).slice(0, MAX_CONTENT_CHARS),
        publishedAt:
          publishedAt && !Number.isNaN(publishedAt.getTime())
            ? publishedAt
            : null,
      };
    })
    // 지난 24시간 안에 발행된 기사만 (발행일이 없으면 판단할 수 없으므로 제외)
    .filter((a) => a.publishedAt && a.publishedAt.getTime() >= cutoff);
}

export async function fetchAndStoreNews(): Promise<FetchResult> {
  // 1. 두 피드를 병렬로 수집 (한쪽이 실패해도 다른 쪽은 사용)
  const settled = await Promise.allSettled(FEEDS.map(readFeed));
  const feedErrors: string[] = [];
  const collected: FeedArticle[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") collected.push(...r.value);
    else feedErrors.push(`${FEEDS[i].source}: ${String(r.reason)}`);
  });

  if (collected.length === 0 && feedErrors.length > 0) {
    throw new Error(`RSS 피드를 가져오지 못했습니다. ${feedErrors.join("; ")}`);
  }

  // 같은 URL이 여러 번 나오면 하나만 남긴다
  const unique = [...new Map(collected.map((a) => [a.url, a])).values()];

  // 2. 이미 저장된 URL 제외
  const existing = unique.length
    ? await db
        .select({ url: articles.url })
        .from(articles)
        .where(
          inArray(
            articles.url,
            unique.map((a) => a.url),
          ),
        )
    : [];
  const existingUrls = new Set(existing.map((e) => e.url));
  const fresh = unique.filter((a) => !existingUrls.has(a.url));
  const skipped = unique.length - fresh.length;

  // 3. 저장. 동시 실행 대비 url 충돌은 무시
  let added = 0;
  if (fresh.length > 0) {
    const inserted = await db
      .insert(articles)
      .values(
        fresh.map((a) => ({
          url: a.url,
          source: a.source,
          originalTitle: a.originalTitle,
          contentSnippet: a.content || null,
          publishedAt: a.publishedAt,
        })),
      )
      .onConflictDoNothing({ target: articles.url })
      .returning({ id: articles.id });
    added = inserted.length;
  }

  // 4. 번역·요약·분류. titleKo가 비어 있는 기사(이전 실패분 포함)만 Claude로 보낸다.
  //    실패해도 기사는 이미 저장되어 있으므로 수집 자체는 성공으로 처리한다.
  let enriched = 0;
  let failed = 0;
  try {
    ({ enriched, failed } = await enrichPendingArticles());
  } catch (err) {
    console.error("[enrich] 처리 실패:", err);
    feedErrors.push(`Claude 처리 실패: ${String(err)}`);
  }

  return { added, skipped, enriched, failed, feedErrors };
}
