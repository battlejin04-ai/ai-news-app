import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { desc, eq, isNull, sql } from "drizzle-orm";
import { AuthGate } from "../auth-gate";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { CategoryBar } from "./category-bar";
import { FetchNewsButton } from "./fetch-news-button";
import { NewsCard } from "./news-card";
import { Pagination } from "./pagination";

export const metadata = { title: "대시보드 · AI 뉴스 수집기" };

const PAGE_SIZE = 9;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// searchParams / auth()는 요청 시점 데이터라서, Suspense 안쪽 컴포넌트에서만 읽는다.
// 바깥(헤더·스켈레톤)은 정적 셸로 미리 렌더링된다.
export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold">AI 뉴스 수집기</h1>
            <div className="flex items-center gap-3">
              <FetchNewsButton />
              <UserButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </AuthGate>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // 데이터는 서버에서 렌더링되므로, 로그인되지 않은 요청에는 조회 자체를 하지 않는다.
  const { userId } = await auth();
  if (!userId) return null;

  const raw = (await searchParams).category;
  const selected = Array.isArray(raw) ? raw[0] : raw;
  const selectedId =
    selected && /^\d+$/.test(selected) ? Number(selected) : null;
  const onlyUncategorized = selected === "uncategorized";

  const rawPage = (await searchParams).page;
  const pageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const requestedPage =
    pageParam && /^\d+$/.test(pageParam) ? Math.max(1, Number(pageParam)) : 1;

  // 카운트는 카테고리 필터와 무관하게 전체 기준으로 먼저 계산해 페이지 수를 구한다.
  const [categoryRows, countRows] = await Promise.all([
    db.select().from(categories).orderBy(categories.id),
    db
      .select({
        categoryId: articles.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(articles)
      .groupBy(articles.categoryId),
  ]);

  const counts = new Map(countRows.map((r) => [r.categoryId, r.count]));
  const total = countRows.reduce((sum, r) => sum + r.count, 0);

  const filteredTotal = onlyUncategorized
    ? (counts.get(null) ?? 0)
    : selectedId !== null
      ? (counts.get(selectedId) ?? 0)
      : total;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const items = await db
    .select({
      id: articles.id,
      url: articles.url,
      source: articles.source,
      originalTitle: articles.originalTitle,
      contentSnippet: articles.contentSnippet,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      notionPageId: articles.notionPageId,
      categoryId: articles.categoryId,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      onlyUncategorized
        ? isNull(articles.categoryId)
        : selectedId !== null
          ? eq(articles.categoryId, selectedId)
          : undefined,
    )
    // 발행일이 없으면 수집 시각을 기준으로 최신순 정렬
    .orderBy(
      desc(sql`coalesce(${articles.publishedAt}, ${articles.createdAt})`),
      desc(articles.id),
    )
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const activeKey = onlyUncategorized
    ? "uncategorized"
    : selectedId !== null
      ? String(selectedId)
      : "all";

  return (
    <>
      <CategoryBar
        categories={categoryRows.map((c) => ({
          id: c.id,
          name: c.name,
          count: counts.get(c.id) ?? 0,
        }))}
        total={total}
        uncategorizedCount={counts.get(null) ?? 0}
        activeKey={activeKey}
      />

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base font-semibold">
            {activeKey === "all"
              ? "아직 수집된 뉴스가 없어요"
              : "이 카테고리에는 뉴스가 없어요."}
          </p>
          {activeKey === "all" && (
            <p className="mt-1 text-sm text-slate-500">
              상단의 &lsquo;뉴스 가져오기&rsquo;를 눌러 시작하세요.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => {
          const params = new URLSearchParams();
          if (activeKey !== "all") params.set("category", activeKey);
          if (p > 1) params.set("page", String(p));
          const qs = params.toString();
          return qs ? `/dashboard?${qs}` : "/dashboard";
        }}
      />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="불러오는 중">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-slate-200"
          />
        ))}
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
