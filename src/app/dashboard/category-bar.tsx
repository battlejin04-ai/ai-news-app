import Link from "next/link";

type CategoryChip = { id: number; name: string; count: number };

const base =
  "rounded-full px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
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
  const chips = [
    { key: "all", label: "전체", href: "/dashboard", count: total },
    ...categories.map((c) => ({
      key: String(c.id),
      label: c.name,
      href: `/dashboard?category=${c.id}`,
      count: c.count,
    })),
    {
      key: "uncategorized",
      label: "미분류",
      href: "/dashboard?category=uncategorized",
      count: uncategorizedCount,
    },
  ];

  return (
    <nav aria-label="카테고리" className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-current={chip.key === activeKey ? "page" : undefined}
          className={chip.key === activeKey ? active : idle}
        >
          {chip.label}
          <span className="ml-1.5 text-xs opacity-70">{chip.count}</span>
        </Link>
      ))}
      {/* 카테고리 추가는 PRD 구현 순서 5단계(카테고리 CRUD)에서 연결한다. */}
      <button
        type="button"
        disabled
        title="준비 중"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">+</span> 카테고리 추가
      </button>
    </nav>
  );
}
