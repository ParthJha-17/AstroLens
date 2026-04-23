# Frontend Dev — Questions & Blockers

> Frontend Dev writes here when blocked or finds an API mismatch. Senior SDE answers and marks RESOLVED.

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
