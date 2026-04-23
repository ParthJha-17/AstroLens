# Frontend Dev — Implementation Log

> Frontend Dev appends an entry here after completing each task.

---

## FE-01 — Next.js scaffold ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/app/globals.css` — Tailwind v4 `@theme` with `space-950/900/800` color tokens; Geist font variable
- `frontend/app/layout.tsx` — Dark root layout (`bg-space-950`), nav: AstroLens logo + Home / Search / Library links
- `frontend/lib/api.ts` — All 7 typed fetch wrappers: `getApodToday`, `getApodFeed`, `getApodByDate`, `searchApod`, `searchImages`, `getBriefing`, `generateBriefing`
- `frontend/next.config.ts` — Remote image patterns for `*.nasa.gov`; turbopack root configured
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
- `frontend/components/` — Directory created

**Acceptance criteria:**
- [x] `npm run build` succeeds — TypeScript compiled cleanly, zero errors
- [x] Dev server starts on port 3000 (HTTP 200 confirmed)
- [x] Dark-background layout with nav rendered

**Notes:**
- `create-next-app` installed Next.js 16.2.4 + Tailwind v4 (spec said v14/v3). App Router and all class names work identically. v4 uses `@theme` in CSS instead of `tailwind.config.ts` for custom colors.
- React 19 `useRef` requires an explicit initial value — adjusted throughout.
- Data-fetching pages use `export const dynamic = "force-dynamic"` so `npm run build` succeeds without a live backend.

---

## FE-02 — TodayHero ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/app/page.tsx` — Server Component; fetches `getApodToday()`, renders `<TodayHero>` + `<RecentFeed>`
- `frontend/components/TodayHero.tsx` — Full-width 600px hero; image (`object-cover`) or iframe for video; dark gradient overlay; date badge top-left; title + excerpt bottom-left; "Read Full Briefing →" CTA button

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] Homepage shows today's APOD — requires live backend

---

## FE-03 — RecentFeed ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/components/RecentFeed.tsx` — Server Component; fetches last 7 days; horizontal scroll on mobile, 7-col grid on desktop; video entries show play icon placeholder

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] 7 image cards visible — requires live backend

---

## FE-04 — APOD Detail page ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/app/apod/[date]/page.tsx` — Server Component; fetches APOD + existing briefing in parallel; invalid date shows 404 message; page `<title>` set via `generateMetadata`
- `frontend/components/ImageViewer.tsx` — Large image (100% width, max 70vh, object-contain); title h1, date, explanation, HD link; video iframe

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] Live render — requires backend

---

## FE-05 — BriefingPanel ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/components/BriefingPanel.tsx` — `'use client'`; full state machine: LOADING → READY/PROMPT → GENERATING → READY/ERROR; 30s AbortController timeout via `setTimeout`; skips GET if `initialBriefing` prop provided

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] Live state transitions — requires backend

---

## FE-06 — SourceList ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/components/SourceList.tsx` — Pill links with web 🌐 / reddit 🔴 / youtube ▶️ icons; `max-w-[200px] truncate`; opens in new tab

**Acceptance criteria:**
- [x] TypeScript compiles cleanly

---

## FE-07 — SearchBar ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/app/search/page.tsx` — Server shell; wraps `<SearchBar>` + `<SearchResults>` in `<Suspense>` (required for `useSearchParams`)
- `frontend/components/SearchBar.tsx` — `'use client'`; 300ms debounce; URL-based state via `router.replace`

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] Live search — requires backend

---

## FE-08 — SearchResults ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/components/SearchResults.tsx` — `'use client'`; reads `?q=` from `useSearchParams`; loading skeleton; empty-state message; video placeholder

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] Live results — requires backend

---

## FE-09 — Library page ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/app/library/page.tsx` — Server shell; wraps `<FilterBar>` + `<ImageGrid initialImages={[]} />` in `<Suspense>`
- `frontend/components/FilterBar.tsx` — `'use client'`; form with search input; submit (Enter or button) updates `?q=` param via `router.replace`
- `frontend/components/ImageGrid.tsx` — `'use client'`; reads `?q=`; calls `searchImages`; `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4`; hover zoom + gradient overlay; "Load More" button increments page

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] Live grid — requires backend

---

## FE-10 — Library Detail page ✓

**Date:** 2026-04-23

**Files created/modified:**
- `frontend/app/library/[id]/page.tsx` — Server Component; calls `getNasaImage(id)`; displays orig-URL image, title, date, description, keyword tags; "Back to Library" link; not-found fallback
- `frontend/lib/api.ts` — Added `NasaImageDetail` type (extends `NasaImage` with `description?`, `keywords?`) and `getNasaImage(id)` calling `GET /api/v1/images/{id}`

**Open question:** Backend needs `GET /api/v1/images/{id}` — logged in `docs/frontend/questions.md` as Q-FE-01.

**Acceptance criteria:**
- [x] TypeScript compiles cleanly
- [ ] Live render — requires `GET /api/v1/images/{id}` backend endpoint (Q-FE-01)
