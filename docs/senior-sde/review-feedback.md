# Senior SDE — Code Review Feedback

**Review date:** 2026-04-24
**Scope:** BE-01–08 + bonus `GET /images/{nasa_id}`, FE-01–FE-12
**Reviewer:** Senior SDE agent
**Status:** Action required — 1 critical bug, 2 high, 3 medium, 4 low

---

## CRITICAL

### [CRIT-01] `generateBriefing` sends wrong field name → 422 on every call

**File:** `frontend/lib/api.ts:83`
**Impact:** `POST /briefings/generate` returns HTTP 422 on every call. The core AI briefing feature is completely non-functional end-to-end.

**Root cause:** The frontend sends `{ date: "..." }` but the backend Pydantic model expects `{ apod_date: "..." }`.

```typescript
// WRONG — lib/api.ts:81-86
export async function generateBriefing(date: string): Promise<Briefing> {
  return apiFetch<Briefing>('/briefings/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),   // ← sends "date", backend expects "apod_date"
  })
}
```

```python
# backend/schemas.py:35-36
class GenerateBriefingRequest(BaseModel):
    apod_date: str   # ← field name is "apod_date"
```

**Fix (Frontend Dev):** Change `JSON.stringify({ date })` to `JSON.stringify({ apod_date: date })`.

---

## HIGH

### [HIGH-01] Library detail page: description and keywords always blank

**File:** `backend/services/nasa_images.py:29-49`
**Impact:** `/library/{id}` page renders no description and no keyword tags, even when NASA provides them. The page looks empty and unhelpful.

**Root cause:** `get_nasa_image` queries the search endpoint with `nasa_id=X` and correctly gets a result, but only extracts 5 fields. It discards `description` and `keywords` which are present in `meta`:

```python
# services/nasa_images.py — current (missing fields)
return {
    "nasa_id": meta.get("nasa_id", ""),
    "title": meta.get("title", ""),
    "thumb_url": thumb,
    "date_created": ...,
    "media_type": ...,
    # "description" and "keywords" are in meta but never extracted
}
```

**Fix (Backend Dev):** Add the two fields to the return dict:
```python
return {
    "nasa_id": meta.get("nasa_id", ""),
    "title": meta.get("title", ""),
    "description": meta.get("description"),          # add
    "keywords": meta.get("keywords", []),            # add
    "thumb_url": thumb,
    "date_created": ...,
    "media_type": ...,
}
```

Also add `description` and `keywords` to the `NasaImage` schema in `backend/schemas.py`:
```python
class NasaImage(BaseModel):
    nasa_id: str
    title: str
    thumb_url: str | None = None
    date_created: str | None = None
    media_type: str = "image"
    description: str | None = None     # add
    keywords: list[str] = []           # add
```

### [HIGH-02] BriefingPanel spinner text references Reddit and YouTube (unavailable)

**File:** `frontend/components/BriefingPanel.tsx:73`
**Impact:** User sees "Searching the web, Reddit, and YouTube..." but those sources are unavailable (Q-02). Misleading and creates false expectations.

```tsx
// WRONG — BriefingPanel.tsx:73
<p className="text-slate-400">Searching the web, Reddit, and YouTube...</p>
```

**Fix (Frontend Dev):** Change to:
```tsx
<p className="text-slate-400">Searching the web for context...</p>
```

---

## MEDIUM

### [MED-01] Unhandled `asyncio.TimeoutError` from GPT-4o timeout → HTTP 500

**File:** `backend/agents/briefing_agent.py:58-69`
**Impact:** When GPT-4o takes longer than 8 seconds, the `asyncio.TimeoutError` propagates uncaught through `generate_briefing_route` and returns HTTP 500. The client sees a generic server error instead of a retry-friendly message.

**Fix (Backend Dev):** Wrap the `wait_for` call and raise an `HTTPException`:

In `routers/briefings.py`:
```python
import asyncio
from fastapi import HTTPException

@router.post("/briefings/generate", response_model=Briefing)
@limiter.limit("10/minute")
async def generate_briefing_route(body: GenerateBriefingRequest, request: Request):
    ...
    try:
        briefing_dict = await run_agent(apod["title"], apod["date"], apod["explanation"])
    except asyncio.TimeoutError:
        raise HTTPException(status_code=503, detail="Briefing generation timed out. Please try again.")
    except Exception as exc:
        logger.error("Agent error: %s", exc)
        raise HTTPException(status_code=503, detail="Briefing generation failed. Please try again.")
    ...
```

### [MED-02] `Source.type` is unvalidated `str` — icon lookup silently fails

**File:** `backend/schemas.py:29-31`, `frontend/components/SourceList.tsx:5-9`
**Impact:** GPT-4o occasionally returns `"website"` or `"article"` instead of `"web"`. Frontend `icons[s.type]` returns `undefined`, rendering the icon slot empty. No error, just broken UI.

**Fix (Backend Dev):** Add `Literal` validation:
```python
from typing import Literal

class Source(BaseModel):
    type: Literal["web", "reddit", "youtube"]
    title: str
    url: str
```

If GPT-4o returns an invalid type, Pydantic will raise a validation error before the briefing is persisted, surfacing the issue cleanly rather than silently corrupting data.

**Note:** With Reddit/YouTube removed, GPT-4o will only return `"web"`. Still worth locking down for correctness.

### [MED-03] TypeScript `NasaImage` types don't match backend nullability

**File:** `frontend/lib/api.ts:23-29`
**Impact:** `thumb_url` and `date_created` are typed as non-optional `string` in the frontend but the backend returns `str | None`. TypeScript will not catch null-dereference errors on these fields. `ImageGrid` protects via `if (image.thumb_url)` check, but the type contract is wrong and future code may not be as careful.

```typescript
// WRONG — lib/api.ts
export type NasaImage = {
  thumb_url: string        // backend: str | None
  date_created: string     // backend: str | None
}
```

**Fix (Frontend Dev):** Add `| null` to both:
```typescript
export type NasaImage = {
  nasa_id: string
  title: string
  thumb_url: string | null
  date_created: string | null
  media_type: string
  description?: string
  keywords?: string[]
}
```

(Also remove `NasaImageDetail` — it's redundant once `description` and `keywords` are added to `NasaImage`.)

---

## LOW

### [LOW-01] `@app.on_event` deprecated in FastAPI 0.95+

**File:** `backend/main.py:31,36`
**Impact:** Deprecation warning in logs. Will break in a future FastAPI version. No functional impact now.

**Fix (Backend Dev, non-urgent):** Migrate to `lifespan` context manager:
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    yield
    await close_pool(app.state.pool)

app = FastAPI(title="AstroLens API", version="1.0", lifespan=lifespan)
```

### [LOW-02] `request: Request = None` default is misleading

**Files:** `backend/routers/apod.py:58`, `backend/routers/images.py:11,23`
**Impact:** FastAPI always injects `request` — the `= None` default makes it look optional. No runtime impact but confuses readers.

**Fix (Backend Dev, non-urgent):** Remove the default: `request: Request` (no `= None`). FastAPI will still inject it.

### [LOW-03] `onError={undefined}` on library detail Image is a no-op

**File:** `frontend/app/library/[id]/page.tsx:53`
**Impact:** If `~orig.jpg` doesn't exist (some NASA assets use `.tif`, `.png`, or different naming), the image shows broken with no fallback. `onError={undefined}` does nothing.

**Fix (Frontend Dev, non-urgent):** Either remove the prop entirely (clean up), or add a real fallback to `thumb_url`:
```tsx
<Image
  src={origUrl}
  alt={image.title}
  width={1200}
  height={800}
  className="w-full object-contain max-h-[70vh]"
  unoptimized
/>
```
(Just remove `onError={undefined}` — it serves no purpose.)

### [LOW-04] APOD detail page makes two redundant API calls for the same APOD

**File:** `frontend/app/apod/[date]/page.tsx:11-19, 21-33`
**Impact:** `generateMetadata` calls `getApodByDate(date)` and then `ApodDetailPage` calls it again. Two identical fetch calls per page load. Minor performance waste.

**Fix (Frontend Dev, non-urgent):** Next.js `fetch` with the same URL is deduplicated automatically when using native `fetch` — this is actually already handled by Next.js request deduplication. Verify this is working and close the issue if it is. If not, refactor to call once.

---

## Positive Findings

These are done well and should be preserved:

- **Cache-first pattern** (`get_apod_by_date` → NASA API → `upsert`) is correct and NASA-rate-limit-safe
- **`_j()` JSONB parser** — clean fix for asyncpg pooler behavior
- **`statement_cache_size=0`** — correct PgBouncer fix for Neon
- **Full-text search SQL** — `ts_rank + plainto_tsquery` with GIN index is correct
- **`ON CONFLICT DO NOTHING` + fallback SELECT** — handles concurrent upserts safely
- **BriefingPanel state machine** — all 5 states (loading/ready/prompt/generating/error) implemented correctly; `initialBriefing` prop skips network fetch
- **`asyncio.wait_for` with 5s/8s timeouts** on search and GPT-4o — correct layered timeout approach
- **`response_format={"type": "json_object"}`** — prevents GPT-4o markdown-wrapping the JSON
- **Async `params`** in Next.js 15+ App Router pages — correct pattern
- **`<Suspense>` wrapping** for `useSearchParams` components — required and done correctly
- **`rel="noopener noreferrer"`** on all external links — security correct
- **`NasaImageDetail extends NasaImage`** type — idiomatic TypeScript
- **URL-based search state** — shareable, no global state store, correct

---

## Action Summary for Devs

| ID | Assignee | Priority | Action |
|---|---|---|---|
| CRIT-01 | Frontend Dev | **NOW** | Fix `generateBriefing` field name: `date` → `apod_date` |
| HIGH-01 | Backend Dev | **NOW** | Add `description`/`keywords` to `get_nasa_image` + `NasaImage` schema |
| HIGH-02 | Frontend Dev | **NOW** | Fix spinner text — remove "Reddit, and YouTube" |
| MED-01 | Backend Dev | This sprint | Wrap agent call in try/except in briefings router |
| MED-02 | Backend Dev | This sprint | Add `Literal` to `Source.type` |
| MED-03 | Frontend Dev | This sprint | Fix `NasaImage` type nullability; merge `NasaImageDetail` into `NasaImage` |
| LOW-01–04 | Both | Next sprint | Deprecation fixes and cleanup |
