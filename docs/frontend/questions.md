# Frontend Dev — Questions & Blockers

> Frontend Dev writes here when blocked or finds an API mismatch. Senior SDE answers and marks RESOLVED.

---

## Q-FE-02 — Vercel token needed to complete FE-12 deployment

**Status:** RESOLVED
**Resolved:** 2026-04-23 — token provided by user, deployment complete

Deployed to: https://frontend-rose-six-21.vercel.app
Project: `parthjhasoft-3712s-projects/frontend` (ID: `prj_ssg6SIAVfuVi7TS0ORPaIEyfUbeL`)
`NEXT_PUBLIC_API_URL` set to placeholder — update when backend deploys to production.

---

## Q-FE-01 — Library detail needs `GET /api/v1/images/{id}` backend endpoint

**Status:** RESOLVED
**Resolved:** 2026-04-23 — Backend Dev added `GET /api/v1/images/{nasa_id}` as a bonus task during BE-08 session

`getNasaImage(id)` in `lib/api.ts` calls `GET /api/v1/images/{id}` which now exists. Library detail page (`/library/[id]`) is fully unblocked.
