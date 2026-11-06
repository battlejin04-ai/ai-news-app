import { categoryColor } from "./category-color";

export type NewsCardItem = {
  id: number;
  url: string;
  source: string;
  originalTitle: string;
  contentSnippet: string | null;
  titleKo: string | null;
  summaryKo: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  notionPageId: string | null;
  categoryId: number | null;
  categoryName: string | null;
};

function formatDate(date: Date) {
  return date
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export function NewsCard({ item }: { item: NewsCardItem }) {
  const date = item.publishedAt ?? item.createdAt;
  const saved = item.notionPageId !== null;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(item.categoryId).badge}`}
        >
          {item.categoryName ?? "미분류"}
        </span>
        <time dateTime={date.toISOString()} className="text-xs text-slate-500">
          {formatDate(date)}
        </time>
      </div>

      <h2 className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-slate-900">
        {item.titleKo ?? item.originalTitle}
      </h2>
      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600">
        {item.summaryKo ?? item.contentSnippet}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm text-slate-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {item.source} ↗
        </a>
        {saved ? (
          <button
            type="button"
            disabled
            className="shrink-0 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
          >
            ✓ 저장됨
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="준비 중"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Notion 저장
          </button>
        )}
      </div>
    </article>
  );
}
