import Link from "next/link";

const base =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
const active = `${base} bg-indigo-600 text-white`;
const idle = `${base} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const disabled = `${base} cursor-not-allowed border border-slate-200 bg-white text-slate-700 opacity-50`;

// 1 … 48 49 [50] 51 52 … 100 형태로 처음/끝과 현재 페이지 앞뒤 2개만 보여준다.
function pageList(current: number, total: number): (number | "gap")[] {
  const pages = new Set([
    1,
    total,
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2,
  ]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0) {
      const diff = p - sorted[i - 1];
      if (diff === 2)
        result.push(p - 1); // 숨길 페이지가 1개뿐이면 …대신 번호를 보여준다
      else if (diff > 2) result.push("gap");
    }
    result.push(p);
  });
  return result;
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="페이지"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={hrefFor(1)} className={idle}>
          처음
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          처음
        </span>
      )}

      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={idle}>
          이전
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          이전
        </span>
      )}

      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="px-1 text-slate-500"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`${p}페이지`}
            className={p === page ? active : idle}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={idle}>
          다음
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          다음
        </span>
      )}

      {page < totalPages ? (
        <Link href={hrefFor(totalPages)} className={idle}>
          끝
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          끝
        </span>
      )}
    </nav>
  );
}
