// GET 폼이라 '검색' 버튼 클릭과 Enter 키 모두 /dashboard?q=... 로 이동한다.
// 검색어가 바뀌면 페이지는 1로 돌아가고(page 필드 없음), 선택된 카테고리는 유지한다.
export function SearchBar({
  query,
  category,
}: {
  query: string;
  category: string;
}) {
  return (
    <form
      action="/dashboard"
      method="get"
      role="search"
      className="mb-4 flex items-center gap-2"
    >
      {category !== "all" && (
        <input type="hidden" name="category" value={category} />
      )}
      <label htmlFor="news-search" className="sr-only">
        뉴스 검색
      </label>
      <input
        id="news-search"
        type="search"
        name="q"
        // 검색어가 바뀌면 입력창을 새 값으로 다시 만든다
        key={query}
        defaultValue={query}
        maxLength={100}
        placeholder="키워드로 뉴스 검색"
        autoComplete="off"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:max-w-sm"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        검색
      </button>
    </form>
  );
}
