# AstroLens — Changelog

---

## [0.2.0] — Review fixes + backend deploy
**Date:** 2026-04-24

### Added
- `render.yaml` — zero-config Render deployment blueprint
- `backend/api/index.py` — Vercel Python ASGI entry point
- `backend/vercel.json` — Vercel routing config
- `GET /images/{nasa_id}` bonus endpoint (unblocks library detail page)
- Backend deployed to Vercel: `https://astrolens-backend-7c6ya8mt5-parthjhasoft-3712s-projects.vercel.app`

### Changed
- **Agent rewritten** from two-pass GPT-4o tool-calling (~15–30s) to single-pass: DuckDuckGo search + one `gpt-4o-mini` call (~4s). Fits Vercel 10s function limit.
- `backend/Dockerfile` — CMD now uses `${PORT:-8000}` for Render compatibility
- `backend/db/connection.py` — Added `statement_cache_size=0` for Neon PgBouncer
- `backend/main.py` — CORS updated: explicit origins (localhost + Vercel), removed wildcard + credentials conflict
- `frontend/` — `NEXT_PUBLIC_API_URL` updated to live backend URL and redeployed

### Fixed (from code review — all 10 issues resolved)
- **CRIT-01** `lib/api.ts` — `generateBriefing` now sends `{ apod_date }` (was `{ date }`); POST /briefings/generate works end-to-end
- **HIGH-01** `services/nasa_images.py` + `schemas.py` — library detail page now shows NASA description and keyword tags
- **HIGH-02** `BriefingPanel.tsx` — spinner text no longer references Reddit/YouTube
- **MED-01** `routers/briefings.py` — GPT-4o timeout raises HTTP 503 (was unhandled 500)
- **MED-02** `schemas.py` — `Source.type` validated with `Literal["web","reddit","youtube"]`
- **MED-03** `lib/api.ts` — `NasaImage` types corrected (`thumb_url`/`date_created` nullable; `description`/`keywords` added; `NasaImageDetail` removed)
- **LOW-01** `main.py` — `@app.on_event` replaced with `lifespan` context manager
- **LOW-02** `routers/apod.py`, `routers/images.py` — `request: Request = None` defaults removed
- **LOW-03** `app/library/[id]/page.tsx` — `onError={undefined}` no-op removed
- **LOW-04** — confirmed handled by Next.js `fetch` deduplication; no change required

---

## [0.1.0] — Full stack initial implementation
**Date:** 2026-04-23

### Backend (BE-01–08 + bonus)
- FastAPI scaffold with asyncpg, pydantic-settings, slowapi, httpx
- `GET /apod/today` — NASA APOD API with Neon cache
- `GET /apod/feed?start=&end=` — date range APOD, 30-day guard
- `GET /apod/search?q=` — PostgreSQL full-text search (tsvector + ts_rank)
- `GET /images/search?q=` — NASA Image Library proxy
- `GET /images/{nasa_id}` — NASA Image Library single asset
- `POST /briefings/generate` — GPT-4o agent with DuckDuckGo, cache-on-generate
- `GET /briefings/{date}` — cached briefing lookup, 404 if missing
- Rate limiting via slowapi (60/min APOD, 10/min generate)
- Neon PostgreSQL: `apod_cache`, `briefings`, `nasa_images` tables with GIN full-text indexes

### Frontend (FE-01–12)
- Next.js 16.2.4 + Tailwind v4 + App Router
- Dark space theme (`space-950/900/800` tokens via `@theme`)
- Homepage: `TodayHero` (full-width APOD hero) + `RecentFeed` (7-day grid)
- APOD detail `/apod/[date]`: `ImageViewer` + `BriefingPanel` (5-state machine)
- Search `/search`: debounced `SearchBar` + ranked `SearchResults`
- Library `/library`: `FilterBar` + `ImageGrid` (4-col, Load More)
- Library detail `/library/[id]`: full image, description, keyword tags
- Responsive: 320px–1440px, horizontal scroll on mobile
- Deployed: `https://frontend-rose-six-21.vercel.app`

### Infrastructure
- GitHub: `https://github.com/ParthJha-17/AstroLens`
- Neon PostgreSQL (free tier): DB schema applied
- Vercel frontend: deployed via Vercel CLI
- Docker: `docker-compose.yml` for local dev
