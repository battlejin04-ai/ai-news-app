# UI 가이드 — AI 뉴스 수집기

메인 화면은 뉴스를 카드로 보여주는 대시보드입니다. 스타일링은 Tailwind CSS 유틸리티 클래스만 사용합니다(별도 CSS 파일 작성 지양). 기능 명세는 `PRD.md`를 따릅니다.

## 1. 디자인 원칙

- **깔끔함**: 여백을 넉넉히, 장식은 최소화. 흰 카드 + 옅은 회색 배경.
- **가독성**: 본문 `text-sm`~`text-base`, 줄간격 `leading-relaxed`. 한글 요약은 한 줄 길이를 제한한다.
- **일관성**: 둥근 모서리 `rounded-xl`(카드) / `rounded-lg`(버튼) / `rounded-full`(배지·칩), 옅은 테두리 `border-slate-200`.
- **한 가지 강조색**: indigo 하나만 주 색상으로 사용한다.
- 라이트 모드 기준. 다크 모드는 범위 밖.

## 2. 디자인 토큰

| 용도 | 클래스 |
|---|---|
| 페이지 배경 | `bg-slate-50` |
| 카드/표면 | `bg-white border border-slate-200` |
| 본문 텍스트 | `text-slate-900` |
| 보조 텍스트 | `text-slate-500` |
| 주 강조색 | `indigo-600` (hover `indigo-700`, 연한 배경 `indigo-50`) |
| 위험(삭제) | `red-600` / `red-50` |
| 성공(저장됨) | `emerald-600` / `emerald-50` |
| 폰트 | 시스템 sans (`font-sans`), 제목 `font-semibold` |
| 그림자 | 카드 `shadow-sm`, hover `shadow-md` |
| 포커스 링 | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` |

## 3. 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ 헤더: AI 뉴스 수집기            [뉴스 가져오기] [유저] │
├──────────────────────────────────────────────────────┤
│ [전체] [LLM/모델] [기업·투자] [미분류] ... [+ 카테고리]│
├──────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐                     │
│ │  카드  │ │  카드  │ │  카드  │                     │
│ └────────┘ └────────┘ └────────┘                     │
└──────────────────────────────────────────────────────┘
```

- 페이지: `min-h-screen bg-slate-50`
- 콘텐츠 컨테이너: `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`
- 섹션 간격: 헤더 → 카테고리 `py-4`, 카테고리 → 카드 `mt-6`
- 카드 그리드: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`

## 4. 헤더

```html
<header class="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <h1 class="text-lg font-semibold text-slate-900">AI 뉴스 수집기</h1>
    <div class="flex items-center gap-3">
      <button class="...primary button...">뉴스 가져오기</button>
      <!-- Clerk UserButton -->
    </div>
  </div>
</header>
```

- 앱 이름은 항상 **AI 뉴스 수집기**.
- '뉴스 가져오기'는 화면의 유일한 주(primary) 버튼. 로딩 중에는 비활성화하고 스피너 + "가져오는 중…" 표시.

## 5. 카테고리 바 (카드 목록 위)

카드 목록 바로 위에 가로로 나열한다. 맨 앞에 **전체**, 이어서 사용자 카테고리, 마지막에 **미분류**, 그 끝에 **+ 카테고리 추가** 버튼을 둔다.

```html
<nav aria-label="카테고리" class="flex flex-wrap items-center gap-2">
  <!-- 선택됨 -->
  <button aria-pressed="true"
    class="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white">전체</button>
  <!-- 기본 -->
  <button aria-pressed="false"
    class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">LLM/모델</button>
  <!-- 카테고리 추가 (목록 끝) -->
  <button
    class="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600">
    <span aria-hidden="true">+</span> 카테고리 추가
  </button>
</nav>
```

- 칩에 기사 수를 작게 병기 가능: `<span class="ml-1.5 text-xs opacity-70">12</span>`.
- 칩이 많으면 줄바꿈(`flex-wrap`)한다. 모바일에서는 `overflow-x-auto` 가로 스크롤로 대체해도 된다.
- 추가 버튼은 점선 테두리로 일반 칩과 구분한다. 항상 목록의 **마지막**에 위치.
- 카테고리 추가/수정은 모달(`fixed inset-0 bg-slate-900/40` 오버레이 + `rounded-2xl bg-white p-6 shadow-xl` 패널)로 처리: 이름(필수), 설명(분류 프롬프트에 쓰인다는 안내 문구 포함). 수정·삭제는 칩 hover 시 나타나는 작은 메뉴 또는 칩 우클릭 대신 칩 옆 `⋯` 버튼.
- 삭제 시 확인 문구: "이 카테고리의 기사는 '미분류'로 이동합니다."

## 6. 뉴스 카드

```html
<article class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
  <div class="flex items-center justify-between gap-2">
    <span class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">LLM/모델</span>
    <time class="text-xs text-slate-500">2026.11.05</time>
  </div>
  <h2 class="mt-3 text-base font-semibold leading-snug text-slate-900">한국어 제목</h2>
  <p class="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600">3~4문장 한국어 요약</p>
  <div class="mt-auto flex items-center justify-between pt-4">
    <a class="text-sm text-slate-500 hover:text-indigo-600" href="..." target="_blank" rel="noopener noreferrer">출처명 ↗</a>
    <button class="...secondary button...">Notion 저장</button>
  </div>
</article>
```

구성 순서: 카테고리 배지 + 발행일 → 제목 → 요약 → 출처 링크 + Notion 저장 버튼.

- 제목은 최대 2줄(`line-clamp-2`), 요약은 최대 4줄(`line-clamp-4`).
- 카드 높이를 맞추기 위해 하단 영역에 `mt-auto`.
- 원문 링크는 새 탭으로 열고 `rel="noopener noreferrer"`.
- 미분류 배지: `bg-slate-100 text-slate-600`.
- **Notion 저장 상태**
  - 기본: `rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50`
  - 저장 중: 비활성 + "저장 중…"
  - 저장됨(`notionPageId` 존재): `bg-emerald-50 text-emerald-700` + "✓ 저장됨", 클릭 불가(`disabled`)

## 7. 공통 컴포넌트 스타일

| 컴포넌트 | 클래스 |
|---|---|
| Primary 버튼 | `rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed` |
| Secondary 버튼 | `rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50` |
| Danger 버튼 | `rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700` |
| 입력창 | `w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200` |
| 라벨 | `mb-1 block text-sm font-medium text-slate-700` |

## 8. 상태 화면

- **로딩(목록)**: 카드 모양 스켈레톤 6개 — `animate-pulse` + `bg-slate-200 rounded` 막대.
- **빈 상태**: 중앙 정렬 `py-20 text-center`, 제목 "아직 수집된 뉴스가 없어요", 보조 문구 `text-slate-500` "상단의 '뉴스 가져오기'를 눌러 시작하세요."
- **카테고리 결과 없음**: "이 카테고리에는 뉴스가 없어요."
- **오류/알림**: 상단 토스트 또는 인라인 배너 — 오류 `border-red-200 bg-red-50 text-red-700`, 성공 `border-emerald-200 bg-emerald-50 text-emerald-700`. 가져오기 결과는 "새 기사 N건 추가" 형태로 안내.

## 9. 반응형

| 구간 | 카드 열 | 비고 |
|---|---|---|
| 기본(모바일) | 1열 | 헤더 버튼은 텍스트 축소, 카테고리 바는 줄바꿈 또는 가로 스크롤 |
| `sm` (≥640px) | 2열 | |
| `lg` (≥1024px) | 3열 | 컨테이너 `max-w-6xl` |

## 10. 접근성

- 클릭 가능한 모든 요소는 `button`/`a`를 사용하고 포커스 링을 유지한다.
- 선택된 카테고리는 `aria-pressed`로 표시한다. 색상에만 의존하지 않는다.
- 텍스트 대비는 WCAG AA 이상: 본문 `slate-600` 이상, 보조 `slate-500`은 흰 배경에서만 사용.
- 모달은 포커스를 가두고 `Esc`로 닫으며, `role="dialog"` `aria-modal="true"` `aria-labelledby`를 지정한다.
- 아이콘만 있는 버튼에는 `aria-label`을 붙인다.
