# AI News Collector

해외 AI 뉴스를 RSS로 수집해 Claude가 한국어로 번역·요약하고 카테고리별로 자동 분류해 카드로 보여주는 **개인용** 웹 앱입니다. 마음에 드는 뉴스는 버튼 한 번으로 Notion 데이터베이스에 저장할 수 있습니다.

명세는 [`PRD.md`](./PRD.md), UI 가이드는 [`ui.md`](./ui.md)를 참고하세요.

## 주요 기능

- **뉴스 가져오기** — 버튼을 누르면 TechCrunch AI, The Verge AI 두 피드를 병렬로 수집합니다(지난 24시간 이내 기사만). 이미 저장된 URL은 건너뛰고 Claude도 호출하지 않습니다.
- **번역·요약·분류** — 새 기사만 한 번의 배치로 Claude에 보내 한글 제목, 3~4문장 요약, 카테고리 1개를 JSON으로 받고 `zod`로 검증한 뒤 저장합니다.
- **카드 목록** — 카테고리 필터(전체 / 카테고리별 / 미분류)와 페이지네이션을 제공합니다.
- **뉴스 저장 (Notion)** — 카드의 `뉴스 저장`을 누르면 Notion 데이터베이스에 행이 생성되고, 저장이 끝나면 버튼이 `저장됨`으로 바뀝니다. 중복 저장은 막습니다.
- **로그인** — 모든 페이지와 `/api/*`는 Clerk로 보호됩니다.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack), React 19 |
| 스타일 | Tailwind CSS 4 |
| 인증 | Clerk |
| DB | Neon Postgres + Drizzle ORM |
| AI | Claude API (`@anthropic-ai/sdk`) |
| RSS | `rss-parser` |
| Notion | 공식 `@notionhq/notion-mcp-server`를 자식 프로세스로 실행, `@modelcontextprotocol/sdk`로 제어 |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채웁니다.

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
ANTHROPIC_API_KEY=
NOTION_TOKEN=
NOTION_DATABASE_ID=
```

### 3. Notion 데이터베이스 준비

Notion 통합(integration)을 만들어 `NOTION_TOKEN`을 발급받고, 저장할 데이터베이스를 그 통합에 연결(공유)하세요. 데이터베이스에는 아래 속성이 **정확히 이 이름과 종류로** 있어야 합니다.

| 속성 | 종류 |
|---|---|
| 제목 | Title |
| 카테고리 | Select |
| 출처 | URL |
| 날짜 | Date |
| 요약 | Text (rich text) |

요약은 페이지 본문에도 함께 들어갑니다.

### 4. DB 마이그레이션

```bash
npm run db:migrate
```

### 5. 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에 접속해 로그인한 뒤 `/dashboard`에서 사용합니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (로컬 전용) |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm run db:generate` | 스키마 변경으로부터 마이그레이션 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:push` | 스키마를 DB에 직접 반영 |

## API

| 엔드포인트 | 설명 |
|---|---|
| `POST /api/news/fetch` | RSS 수집 + Claude 처리 + 저장 |
| `POST /api/news/[id]/notion` | 기사를 Notion에 저장 (이미 저장됐으면 409) |

로그인하지 않은 `/api/*` 요청에는 401 JSON을 돌려줍니다.

## 프로젝트 구조

```
src/
├─ app/
│  ├─ dashboard/          대시보드 페이지, 뉴스 카드, 카테고리 바, 버튼들
│  └─ api/news/           수집·Notion 저장 API
├─ db/                    Drizzle 스키마와 DB 클라이언트
├─ lib/
│  ├─ ai/                 Claude 클라이언트, 번역·요약·분류, zod 스키마
│  ├─ news/               RSS 수집과 저장
│  └─ notion/             Notion MCP 서버를 통한 저장
└─ proxy.ts               Clerk 미들웨어
drizzle/                  마이그레이션
```

## 진행 상황

PRD §10 순서 기준입니다.

- [x] Next.js + Clerk
- [x] Drizzle 스키마, Neon 마이그레이션
- [x] RSS 수집 + Claude 번역·요약·분류
- [x] 카드 UI + 카테고리 필터
- [ ] 카테고리 추가·수정·삭제 및 재분류 (`POST /api/news/reclassify`)
- [x] Notion 저장

## 참고

- 개인 단일 사용자용이며 로컬 실행을 전제로 합니다. 배포하려면 가입 제한이 필요합니다(데이터, Claude 키, Notion이 공용이기 때문).
- 수집은 버튼 클릭으로만 실행되며 cron·백그라운드 수집은 없습니다.
- Notion 저장은 호출할 때마다 MCP 서버 프로세스를 띄웠다가 닫으므로 한 건당 몇 초가 걸릴 수 있습니다.
- 개발 서버에서 동적 라우트(`/api/news/[id]/...`) 요청이 500으로 실패하면 `.next` 폴더를 지우고 서버를 다시 시작해 보세요.
