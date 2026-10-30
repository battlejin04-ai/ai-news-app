# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Only the create-next-app scaffold exists so far (`src/app/` template files). The app is specified in `PRD.md` (Korean) and is to be built in the order given in its §10. Read `PRD.md` before implementing anything; it defines the data model, API routes, and verification criteria.

## Commands

- `npm run dev` — dev server (local only; this is a personal, single-user app)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test runner is configured.
- `drizzle-kit` is installed (dev dep) but no `drizzle.config.ts` exists yet.

## Next.js version warning

`AGENTS.md` states this Next.js (16.x) has breaking changes versus common training data. Before writing Next.js code, read the relevant guide under `node_modules/next/dist/docs/`. Same caution applies to `@clerk/nextjs` (v7) and `@anthropic-ai/sdk` (v1): check the installed package docs/types rather than relying on memory.

## Architecture (planned, per PRD)

- **Stack**: Next.js App Router, Clerk auth, Neon Postgres via Drizzle ORM (`@neondatabase/serverless`), Claude API for translate/summarize/classify, `rss-parser` for feeds, Notion via the official `@notionhq/notion-mcp-server` run as a **child process** driven by `@modelcontextprotocol/sdk` (not the Notion REST SDK).
- **Auth**: every page and API route must be protected by Clerk (middleware), including `/api/*`.
- **Fetch pipeline** (`POST /api/news/fetch`): fetch both RSS feeds in parallel (10 latest each, max 20) → drop articles whose `url` already exists (no Claude call for them) → send only new ones to Claude in one batch, requesting JSON structured output (Korean title, 3–4 sentence Korean summary, exactly one category) → insert. Validate Claude output with `zod`.
- **Categories**: name + description are injected into the classification prompt, so edits affect future classification immediately. One category per article. Deleting a category sets its articles' `categoryId` to null ("미분류"). Editing a category does NOT reclassify existing articles; only `POST /api/news/reclassify` does (cost control).
- **Notion save** (`POST /api/news/[id]/notion`): creates a row in `NOTION_DATABASE_ID` (properties: title, category, URL, date; body: summary), then stores `notionPageId`; a non-null `notionPageId` must block duplicate saves.
- **Data model**: `categories` and `articles` (`url` unique, `categoryId` nullable, `notionPageId` nullable) — see PRD §7.
- Collection is button-triggered only; no cron/background fetching.

## Environment variables

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID` (in `.env.local`).

## Environment notes

- Windows; the directory name has uppercase letters, so `create-next-app` can't run in place — the `package.json` name is `ai-news-collector`.
- `package.json` contains `@tailwindcss/turbopack` from the template; unverified whether it's needed.
