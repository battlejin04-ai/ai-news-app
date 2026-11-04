# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드를 제공합니다.

## 현재 상태

현재는 create-next-app 스캐폴드(`src/app/` 템플릿 파일)만 존재합니다. 앱의 명세는 `PRD.md`(한글)에 있으며, §10에 명시된 순서대로 구현합니다. 무엇이든 구현하기 전에 `PRD.md`를 먼저 읽으세요. 데이터 모델, API 라우트, 검증 기준이 정의되어 있습니다.

## UI 가이드

UI(대시보드 레이아웃, 카테고리 바, 뉴스 카드, 컴포넌트 스타일, 반응형, 접근성)를 구현하거나 수정하기 전에 `ui.md`를 먼저 읽고 따르세요. 스타일링은 Tailwind CSS 유틸리티 클래스를 사용합니다.

## 명령어

- `npm run dev` — 개발 서버 (로컬 전용, 개인 단일 사용자 앱)
- `npm run build` / `npm start` — 프로덕션 빌드 / 실행
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- 테스트 러너는 설정되어 있지 않습니다.
- `drizzle-kit`은 설치되어 있으나(dev 의존성) `drizzle.config.ts`는 아직 없습니다.

## Next.js 버전 경고

`AGENTS.md`에 따르면 이 Next.js(16.x)는 일반적인 학습 데이터와 비교해 호환되지 않는 변경 사항이 있습니다. Next.js 코드를 작성하기 전에 `node_modules/next/dist/docs/` 아래의 관련 가이드를 읽으세요. `@clerk/nextjs`(v7)와 `@anthropic-ai/sdk`(v1)도 마찬가지입니다. 기억에 의존하지 말고 설치된 패키지의 문서/타입을 확인하세요.

## 아키텍처 (PRD 기준 계획)

- **스택**: Next.js App Router, Clerk 인증, Drizzle ORM을 통한 Neon Postgres(`@neondatabase/serverless`), 번역/요약/분류용 Claude API, 피드용 `rss-parser`, Notion은 공식 `@notionhq/notion-mcp-server`를 **자식 프로세스**로 실행하고 `@modelcontextprotocol/sdk`로 제어 (Notion REST SDK 사용 안 함).
- **인증**: 모든 페이지와 API 라우트는 `/api/*`를 포함해 Clerk(미들웨어)로 보호해야 합니다.
- **수집 파이프라인** (`POST /api/news/fetch`): 두 RSS 피드를 병렬로 가져옴(각 최신 10개, 최대 20개) → `url`이 이미 존재하는 기사는 제외(해당 기사는 Claude 호출 안 함) → 새 기사만 한 번의 배치로 Claude에 전달하여 JSON 구조화 출력 요청(한글 제목, 3~4문장 한글 요약, 카테고리 정확히 하나) → 저장. Claude 출력은 `zod`로 검증합니다.
- **카테고리**: 이름과 설명이 분류 프롬프트에 주입되므로, 수정하면 이후 분류에 즉시 반영됩니다. 기사당 카테고리는 하나입니다. 카테고리를 삭제하면 해당 기사의 `categoryId`가 null("미분류")이 됩니다. 카테고리를 수정해도 기존 기사는 재분류되지 않으며, 오직 `POST /api/news/reclassify`만 재분류합니다(비용 통제).
- **Notion 저장** (`POST /api/news/[id]/notion`): `NOTION_DATABASE_ID`에 행을 생성하고(속성: 제목, 카테고리, URL, 날짜 / 본문: 요약), `notionPageId`를 저장합니다. `notionPageId`가 null이 아니면 중복 저장을 막아야 합니다.
- **데이터 모델**: `categories`, `articles`(`url` 고유, `categoryId` nullable, `notionPageId` nullable) — PRD §7 참조.
- 수집은 버튼 클릭으로만 실행되며, cron/백그라운드 수집은 없습니다.

## 환경 변수

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID` (`.env.local`에 설정).

## 환경 참고 사항

- Windows 환경입니다. 디렉터리 이름에 대문자가 있어 `create-next-app`을 해당 위치에서 실행할 수 없었기 때문에 `package.json`의 name은 `ai-news-collector`입니다.
- `package.json`에 템플릿에서 포함된 `@tailwindcss/turbopack`이 있으나, 실제로 필요한지는 확인되지 않았습니다.
