# PRD: AI News Collector

## 1. 개요
해외 AI 뉴스를 RSS로 수집해 Claude가 한국어로 번역·요약하고, 카테고리별로 자동 분류해 카드 형태로 보여주는 개인용 웹 앱. 마음에 드는 뉴스는 Notion에 저장할 수 있다.

## 2. 목표
- 영어 AI 뉴스를 빠르게 훑어볼 수 있는 한국어 요약 카드 제공
- 사용자가 직접 관리하는 카테고리로 뉴스를 자동 분류
- 선택한 뉴스를 Notion 데이터베이스에 한 번에 보관

## 3. 범위
- **사용자**: 본인 한 명(개인용). 사용자별 데이터 분리 없음.
- **실행 환경**: 로컬(내 PC), `npm run dev`.
- **비범위**: 다중 사용자 데이터 분리, 배포, 자동 주기 수집(수집은 버튼 클릭 시에만), 한 기사에 복수 카테고리.

## 4. 기술 스택
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) |
| 로그인 | Clerk |
| DB | Neon (Postgres) + Drizzle ORM |
| 번역·요약·분류 | Claude API |
| Notion 저장 | Notion MCP 서버 (공식 `@notionhq/notion-mcp-server`, 자식 프로세스로 실행) |
| RSS 파싱 | rss-parser 등 |

## 5. 뉴스 소스
- TechCrunch AI: https://techcrunch.com/category/artificial-intelligence/feed/
- The Verge AI: https://www.theverge.com/rss/ai-artificial-intelligence/index.xml

## 6. 기능 요구사항

### 6.1 로그인
- 앱 실행 시 Clerk 로그인 필수. 모든 페이지와 API를 보호한다.
- 누구나 가입 가능(Clerk 기본 설정). 로컬 실행이라 외부 접근은 불가.
- 배포 시에는 가입 제한이 필요하다(데이터, Claude 키, Notion이 공용이므로).

### 6.2 뉴스 가져오기
- '뉴스 가져오기' 버튼 클릭 시 두 RSS 피드를 병렬 수집한다.
- 피드당 최신 10건(최대 20건)을 대상으로 한다.
- URL 기준으로 이미 저장된 기사는 건너뛰고 Claude를 호출하지 않는다.
- 신규 기사만 Claude에 배치로 보내 아래를 한 번에 받는다(JSON 구조화 출력).
  - 한국어 제목 번역
  - 3~4문장 한국어 요약
  - 카테고리 1개 선택
- 결과를 DB에 저장한다.

### 6.3 뉴스 카드 목록
- 카드 구성: 한국어 제목, 요약, 출처, 발행일, 카테고리 배지, 원문 링크, 'Notion 저장' 버튼.
- 상단 카테고리 필터로 특정 카테고리의 뉴스만 볼 수 있다(전체 / 카테고리별 / 미분류).

### 6.4 카테고리 관리
- 카테고리를 추가, 수정, 삭제할 수 있고 나중에도 변경 가능하다.
- 카테고리의 이름과 설명이 Claude 분류 프롬프트에 주입되므로 변경이 이후 분류에 바로 반영된다.
- 기사당 카테고리는 하나만 붙는다.
- 기본 카테고리 초기 제공(예: LLM/모델, 기업·투자, 정책·규제, 로봇·하드웨어, 연구, 기타).
- 삭제 시 해당 뉴스는 '미분류'로 이동한다.
- 수정 시 기존 뉴스는 유지하고, '재분류' 버튼으로 사용자가 원할 때만 재분류한다(API 비용 통제).

### 6.5 Notion 저장
- 카드의 'Notion 저장' 클릭 시 지정한 Notion 데이터베이스에 행(페이지)을 추가한다.
- 속성: 제목, 카테고리, 원문 URL, 날짜. 본문: 요약.
- 저장 후 `notionPageId`를 기록해 중복 저장을 막고, 저장된 카드는 버튼 상태로 표시한다.

## 7. 데이터 모델 (Drizzle)
- `categories`: id, name, description, createdAt
- `articles`: id, url (unique), source, originalTitle, titleKo, summaryKo, categoryId (nullable), publishedAt, notionPageId (nullable), createdAt

## 8. API
- `POST /api/news/fetch`: RSS 수집 + Claude 처리 + 저장
- `GET /api/news?category=`: 목록 조회
- `GET|POST|PATCH|DELETE /api/categories`: 카테고리 CRUD
- `POST /api/news/reclassify`: 재분류
- `POST /api/news/[id]/notion`: Notion 저장

## 9. 환경변수
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`

## 10. 구현 순서
1. Next.js 프로젝트 + Clerk 연동
2. Drizzle 스키마와 Neon 마이그레이션
3. RSS 수집 + Claude 번역·요약·분류 파이프라인
4. 카드 UI + 카테고리 필터
5. 카테고리 CRUD
6. Notion MCP 저장

## 11. 검증 기준
- 로그인하지 않으면 페이지와 API에 접근할 수 없다.
- '뉴스 가져오기' 후 두 피드의 기사가 한국어 카드로 표시되고, 다시 눌러도 중복 저장되지 않는다.
- 카테고리 추가·수정·삭제 후 필터와 분류가 올바르게 동작한다.
- 'Notion 저장' 후 Notion DB에 행이 생성되고, 다시 눌러도 중복 생성되지 않는다.
