import Link from "next/link";
import { categoryColor } from "./category-color";

type CategoryChip = { id: number; name: string; count: number };

const base =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
const active = `${base} bg-indigo-600 text-white`;
const idle = `${base} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`;

export function CategoryBar({
  categories,
  total,
  uncategorizedCount,
  activeKey,
}: {
  categories: CategoryChip[];
  total: number;
  uncategorizedCount: number;
  activeKey: string;
}) {
  const chips: {
    key: string;
    label: string;
    href: string;
    count: number;
    dot?: string;
  }[] = [
    { key: "all", label: "전체", href: "/dashboard", count: total },
    ...categories.map((c) => ({
      key: String(c.id),
      label: c.name,
      href: `/dashboard?category=${c.id}`,
      count: c.count,
      dot: categoryColor(c.id).dot,
    })),
  ];

  // 미분류는 기사가 있거나 현재 선택된 경우에만 보여준다.
  if (uncategorizedCount > 0 || activeKey === "uncategorized") {
    chips.push({
      key: "uncategorized",
      label: "미분류",
      href: "/dashboard?category=uncategorized",
      count: uncategorizedCount,
      dot: categoryColor(null).dot,
    });
  }

  return (
    <div>
      {/* 모바일은 한 줄 가로 스크롤, sm 이상은 줄바꿈 */}
      <nav
        aria-label="카테고리"
        className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            aria-current={chip.key === activeKey ? "page" : undefined}
            className={chip.key === activeKey ? active : idle}
          >
            {chip.dot && (
              <span
                aria-hidden="true"
                className={`mr-2 size-2 rounded-full ${chip.dot} ${
                  chip.key === activeKey ? "ring-2 ring-white/70" : ""
                }`}
              />
            )}
            {chip.label}
            <span className="ml-1.5 text-xs opacity-70">{chip.count}</span>
          </Link>
        ))}
        {/* 카테고리 추가는 PRD 구현 순서 5단계(카테고리 CRUD)에서 연결한다. */}
        <button
          type="button"
          disabled
          title="준비 중"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">+</span> 카테고리 추가
        </button>
      </nav>
      {categories.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">
          카테고리를 추가하면 Claude가 그 이름과 설명을 기준으로 새 기사를
          자동 분류합니다. 지금은 모든 기사가 &lsquo;미분류&rsquo;로 표시돼요.
        </p>
      )}
    </div>
  );
}
