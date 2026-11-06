// Tailwind는 클래스 문자열을 정적으로 스캔하므로, 조합하지 않고 전체 문자열을 적어 둔다.
const PALETTE = [
  { badge: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  { badge: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  { badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  { badge: "bg-teal-50 text-teal-700", dot: "bg-teal-500" },
  { badge: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
] as const;

const NONE = { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };

// 카테고리 id로 색을 고정한다. 칩 바와 카드 배지가 같은 id를 쓰므로 항상 같은 색이 나온다.
export function categoryColor(categoryId: number | null) {
  return categoryId === null ? NONE : PALETTE[categoryId % PALETTE.length];
}
