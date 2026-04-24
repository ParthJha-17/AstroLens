# AstroLens — Project Status Board

> This is the live dashboard. Every agent appends a status block after completing work. The Master (ED) window reads this first.

---

## Current Cycle State

| Agent | Status | Last Updated |
|---|---|---|
| PM | DONE | 2026-04-23 |
| Senior SDE | REVIEW COMPLETE — fixes required | 2026-04-24 |
| Backend Dev | FIXES NEEDED: HIGH-01, MED-01, MED-02, LOW-01, LOW-02 | — |
| Frontend Dev | NEEDS REVIEW → senior-sde | 2026-04-24 |

---

## Status Log

## Frontend Dev | 2026-04-24 | Review fixes applied — NEEDS REVIEW

- **CRIT-01 ✅** `lib/api.ts:81` — `JSON.stringify({ date })` → `JSON.stringify({ apod_date: date })`; fixes 422 on every `POST /briefings/generate`
- **HIGH-02 ✅** `BriefingPanel.tsx:74` — spinner text changed to `"Searching the web for context..."` (removed Reddit/YouTube refs)
- **MED-03 ✅** `lib/api.ts` — `NasaImage.thumb_url`/`date_created` typed as `string | null`; `description?`/`keywords?` merged in; `NasaImageDetail` type removed; `getNasaImage` return type updated to `NasaImage`
- **LOW-03 ✅** `app/library/[id]/page.tsx` — removed no-op `onError={undefined}` prop
- **LOW-04 ✅** Verified — `generateMetadata` and page component call same URL; Next.js native `fetch` deduplication handles it; no code change needed
- `npm run build` clean (0 TypeScript errors) after all changes
- Commit: `3138373` — pushed to `main`

## Senior SDE | 2026-04-24 | Code review complete — fixes required

**Files reviewed:** All 12 backend files (main.py, config.py, limiter.py, schemas.py, db/connection.py, db/queries.py, services/nasa_apod.py, services/nasa_images.py, routers/apod.py, routers/briefings.py, routers/images.py, agents/briefing_agent.py) + all 14 frontend files (lib/api.ts, layout.tsx, page.tsx, TodayHero.tsx, RecentFeed.tsx, ImageViewer.tsx, BriefingPanel.tsx, SourceList.tsx, SearchBar.tsx, SearchResults.tsx, FilterBar.tsx, ImageGrid.tsx, apod/[date]/page.tsx, library/[id]/page.tsx)

**Findings written to:** `docs/senior-sde/review-feedback.md`

**Critical (1):**
- CRIT-01 — `frontend/lib/api.ts:83`: `generateBriefing` sends `{ date }` but backend expects `{ apod_date }` → 422 on every POST /briefings/generate. Core feature broken. **Frontend Dev must fix first.**

**High (2):**
- HIGH-01 — `services/nasa_images.py`: `get_nasa_image` discards `description`/`keywords` from NASA response → library detail page always blank
- HIGH-02 — `BriefingPanel.tsx:73`: spinner text says "Reddit, and YouTube" — those sources are unavailable (Q-02)

**Medium (3):**
- MED-01 — `routers/briefings.py`: `asyncio.TimeoutError` from 8s GPT-4o timeout unhandled → HTTP 500; should be 503
- MED-02 — `schemas.py`: `Source.type` is unvalidated `str`; should be `Literal["web","reddit","youtube"]`
- MED-03 — `lib/api.ts`: `NasaImage.thumb_url` and `date_created` typed non-nullable but backend returns `null`

**Low (4):** LOW-01 (`@app.on_event` deprecated), LOW-02 (`request: Request = None`), LOW-03 (`onError={undefined}` no-op), LOW-04 (double APOD fetch in detail page)

**Positive:** Cache-first pattern, `_j()` JSONB fix, `statement_cache_size=0`, full-text search SQL, BriefingPanel state machine, asyncio timeouts, `response_format=json_object`, async params pattern all solid.

**Also completed this session:** Deployed backend to Vercel, agent rewritten single-pass (~4s vs ~25s), `NEXT_PUBLIC_API_URL` updated, frontend redeployed. Both services live.

**Next:** Backend Dev addresses HIGH-01, MED-01, MED-02. Frontend Dev addresses CRIT-01 (blocking), HIGH-02, MED-03.

## Frontend Dev | 2026-04-23 | FE-01–08 complete

- **FE-01:** Scaffolded Next.js 16.2.4 + Tailwind v4; dark theme tokens via `@theme`; `app/layout.tsx` nav; `lib/api.ts` (7 typed wrappers); `.env.local`; `next.config.ts` with NASA image patterns
- **FE-02:** `TodayHero.tsx` — full-width hero, image/video, gradient overlay, CTA; `app/page.tsx` fetches APOD today
- **FE-03:** `RecentFeed.tsx` — 7-day feed, horizontal scroll mobile / 7-col grid desktop, video placeholders
- **FE-04:** `app/apod/[date]/page.tsx` — parallel fetch APOD + briefing; `ImageViewer.tsx` — large image, explanation, HD link, video iframe; 404 fallback
- **FE-05:** `BriefingPanel.tsx` — full state machine (LOADING → READY/PROMPT → GENERATING → READY/ERROR); 30s timeout; initialBriefing prop skips GET
- **FE-06:** `SourceList.tsx` — web/reddit/youtube pills, truncated titles, new tab links
- **FE-07/08:** `app/search/page.tsx` + `SearchBar.tsx` (300ms debounce, URL state) + `SearchResults.tsx` (loading skeleton, empty state, video placeholders)
- `npm run build` clean (0 TypeScript errors); all 5 routes generated
- **FE-09:** `app/library/page.tsx` + `FilterBar.tsx` (form-submit, URL state) + `ImageGrid.tsx` (client, 4-col grid, Load More, video placeholder, empty state)
- **FE-10:** `app/library/[id]/page.tsx` — orig-URL image, title/date/description/keyword tags, Back link; `getNasaImage` added to `api.ts`; `NasaImageDetail` type added; Q-FE-01 logged for backend (`GET /api/v1/images/{id}`)
- All 6 routes build clean (0 TypeScript errors): `/`, `/apod/[date]`, `/library`, `/library/[id]`, `/search`, `/_not-found`
- **FE-09:** `app/library/page.tsx` + `FilterBar.tsx` + `ImageGrid.tsx` (4-col grid, Load More, video placeholders)
- **FE-10:** `app/library/[id]/page.tsx` + `NasaImageDetail` type + `getNasaImage()` in `api.ts`; Q-FE-01 logged for `GET /api/v1/images/{id}`
- **FE-12 (partial):** Code pushed to GitHub at `https://github.com/ParthJha-17/AstroLens`; Vercel deploy blocked on browser OAuth — see Q-FE-02 in `docs/frontend/questions.md` for manual steps (vercel.com/new or add Vercel token to secrets.md)
- **FE-12:** Vercel deploy complete ✅ — https://frontend-rose-six-21.vercel.app — build: 23s, TypeScript clean, 6 routes; `NEXT_PUBLIC_API_URL` set (placeholder — update to real backend URL when BE deploys)

## Backend Dev | 2026-04-23 | BE-01–08 ✅ ALL COMPLETE

- **BE-01:** Scaffold + DB schema, all packages installed (Python 3.13)
- **BE-02:** `GET /apod/today` — cache-miss→NASA→Neon, cache-hit instant ✅
- **BE-03:** `GET /apod/feed` — 7-day range, 30-day guard (400), partial cache fill ✅
- **BE-04:** `GET /apod/search` — full-text ranked results, empty-q → 422 ✅
- **BE-05:** `GET /images/search` — NASA Image Library, 20 results ✅
- **BE-06:** GPT-4o agent — two-pass tool calling, DuckDuckGo web_search (`ddgs==9.14.1`), graceful tool failure ✅
- **BE-07:** `POST /briefings/generate` — agent+cache, 5 sources, 5 facts ✅
- **BE-08:** `GET /briefings/{date}` — 200 or 404 ✅
- **Bonus:** `GET /images/{nasa_id}` — added to unblock Q-FE-01 (Frontend library detail page) ✅
- Key fixes this session: asyncpg DATE binding, NASA timeout 10s→30s, JSONB `_j()` parser, `ddgs` upgrade, `parallel_tool_calls` removed (openai 1.30 unsupported)
- **Remaining:** BE-09 (APScheduler daily job, P2) and BE-10 (rate limiting inline — mostly done via slowapi)


## Senior SDE | 2026-04-23 | DONE → devs

- No dev blockers found (both questions files empty)
- PRD located at `docs/PRD.md` (not `docs/pm/prd.md` as agent template assumes — noted for future agents)
- Wrote `docs/senior-sde/tech-design.md` v1.0: directory structure, DB schema (SQL), FastAPI patterns, GPT-4o two-pass agent design, Next.js Server/Client split, dark theme palette, Docker setup, all library choices with versions, constraint table
- Wrote `docs/senior-sde/backend-tasks.md`: BE-01 through BE-10 with exact file paths, code patterns, SQL, acceptance criteria
- Wrote `docs/senior-sde/frontend-tasks.md`: FE-01 through FE-12 with Server/Client component specs, state machines, Tailwind class patterns, acceptance criteria
- Key decisions made: asyncpg (no ORM), raw SQL, duckduckgo-search (free, no key), PRAW for Reddit, YouTube Data API v3, `asyncio.to_thread` for sync libs, URL-based search state, no global state store
- **Next:** Backend Dev reads `backend-tasks.md` + `tech-design.md` and starts BE-01. Frontend Dev reads `frontend-tasks.md` + `tech-design.md` and starts FE-01 + FE-12 in parallel.

## PM | 2026-04-23 | DONE → senior-sde
- PRD v1.0 written: `docs/pm/prd.md`
- Covers: APOD browse, AI briefings, full-text search, NASA Image Library
- Stack defined: FastAPI + GPT-4o + Next.js + PostgreSQL (Neon)
- 10 backend tasks (BE-01–BE-10) and 12 frontend tasks (FE-01–FE-12) outlined in PRD
- No open product questions
- **Next:** Senior SDE to read PRD, write tech-design.md, and produce task specs in backend-tasks.md and frontend-tasks.md
