# Frontend Dev — Questions & Blockers

> Frontend Dev writes here when blocked or finds an API mismatch. Senior SDE answers and marks RESOLVED.

---

## Q-FE-02 — Vercel token needed to complete FE-12 deployment

**Status:** OPEN — action required by user
**Blocking:** FE-12 (Vercel deploy)

Code is pushed to GitHub at `https://github.com/ParthJha-17/AstroLens`. To deploy:

**Option A (easiest):** Import directly on Vercel  
1. Go to `vercel.com/new` → "Import Git Repository" → select `ParthJha-17/AstroLens`
2. Set root directory to `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL` = `https://<backend-url>/api/v1` (placeholder ok for now)
4. Deploy — Vercel auto-detects Next.js

**Option B:** Get a Vercel token and add to `secrets.md` as `## Vercel → API Token: <token>`, then run `npx vercel deploy --token <token>` from `frontend/`

Once deployed, record the Vercel URL in `docs/frontend/impl-log.md`.

---

## Q-FE-01 — Library detail needs `GET /api/v1/images/{id}` backend endpoint

**Status:** OPEN
**Blocking:** FE-10 (`/library/[id]` detail page) live functionality

`lib/api.ts` has `getNasaImage(id)` calling `GET /api/v1/images/{id}`. The backend's `routers/images.py` needs a route for this. It should return a `NasaImageDetail` shape:

```json
{
  "nasa_id": "PIA12345",
  "title": "...",
  "thumb_url": "...",
  "date_created": "2015-01-01",
  "media_type": "image",
  "description": "...",
  "keywords": ["Mars", "rover"]
}
```

The page itself falls back to `{nasa_id}~orig.jpg` for the full-res image URL, so the endpoint only needs to return metadata. It can query the `nasa_images` table (populated by `searchImages`) or hit the NASA Images API directly at `https://images-api.nasa.gov/search?nasa_id={id}`.

**Not blocking the build** — TypeScript compiles. Only needed once backend deploys this route.
