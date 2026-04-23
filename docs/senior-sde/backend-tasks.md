# Senior SDE — Backend Task List

**Last updated:** 2026-04-23
**Source of truth for Backend Dev.** Read `tech-design.md` first, then implement tasks in priority order.

---

## Start-of-session checklist

1. Read `C:\Users\parth\Claude\secrets.md` — all API keys are there; do not ask for them
2. Read `tech-design.md` — understand structure before touching any file
3. Write your progress to `docs/backend/impl-log.md`
4. Post blockers to `docs/backend/questions.md` (Senior SDE answers within the session)

---

## BE-01 — Project scaffold

**Priority:** P0 | **Milestone:** M1

**What to build:**
- `backend/` directory with full scaffold per `tech-design.md` directory layout
- `requirements.txt` with exact versions from tech-design Section 8
- `config.py` using `pydantic-settings` — reads env vars into `Settings` object
- `main.py` — FastAPI app factory: CORS, router mounting, startup/shutdown events
- `db/connection.py` — creates and closes an `asyncpg` connection pool; pool stored on `app.state.pool`
- `Dockerfile` as specified in tech-design Section 7
- `backend/.env` (gitignored) — populate from `secrets.md`

**File structure to create:**
```
backend/
├── main.py
├── config.py
├── schemas.py           # empty for now, fill in BE-02
├── requirements.txt
├── Dockerfile
├── .env                 # gitignored
├── routers/__init__.py
├── routers/apod.py      # empty router for now
├── routers/images.py    # empty router for now
├── routers/briefings.py # empty router for now
├── agents/__init__.py
├── agents/briefing_agent.py  # empty for now
├── db/__init__.py
├── db/connection.py
├── db/queries.py        # empty for now
├── services/__init__.py
├── services/nasa_apod.py     # empty for now
└── services/nasa_images.py   # empty for now
```

**CORS config:** `allow_origins=["http://localhost:3000"]` for dev; allow all in prod until Vercel URL is known.

**Acceptance criteria:**
- `uvicorn main:app --reload` starts with no errors
- `GET /` returns `{"status": "ok", "service": "AstroLens API"}`
- asyncpg pool connects to Neon on startup (check Neon dashboard for connection string in secrets.md)

---

## BE-02 — `GET /apod/today`

**Priority:** P0 | **Milestone:** M1

**What to build:**

`services/nasa_apod.py`:
```python
async def fetch_apod(date: str | None = None) -> dict:
    # GET https://api.nasa.gov/planetary/apod?api_key={key}&date={date}
    # httpx.AsyncClient, timeout=10s
    # Returns raw NASA response dict
```

`db/queries.py`:
```python
async def get_apod_by_date(pool, date: str) -> dict | None
async def upsert_apod(pool, data: dict) -> dict
    # INSERT INTO apod_cache (...) VALUES (...) ON CONFLICT (date) DO NOTHING RETURNING *
```

`schemas.py` — define `ApodItem`:
```python
class ApodItem(BaseModel):
    date: str
    title: str
    explanation: str
    url: str
    hdurl: str | None = None
    media_type: str
```

`routers/apod.py`:
```python
@router.get("/apod/today", response_model=ApodItem)
async def get_apod_today(request: Request):
    pool = request.app.state.pool
    today = date.today().isoformat()
    cached = await get_apod_by_date(pool, today)
    if cached:
        return cached
    data = await fetch_apod()
    await upsert_apod(pool, data)
    return data
```

**Schema note:** NASA APOD API returns `copyright` and other fields; only map the fields in `ApodItem` (ignore extras).

**Acceptance criteria:**
- `GET /api/v1/apod/today` returns today's APOD JSON
- Second call returns the cached version (verify via Neon: row exists in `apod_cache`)
- NASA API is NOT called on second request (add a log statement to confirm)

---

## BE-03 — `GET /apod/feed`

**Priority:** P1 | **Milestone:** M1

**What to build:**

`services/nasa_apod.py`:
```python
async def fetch_apod_range(start: str, end: str) -> list[dict]:
    # GET https://api.nasa.gov/planetary/apod?api_key={key}&start_date={start}&end_date={end}
    # NASA returns a JSON array when start_date + end_date are provided
```

`db/queries.py`:
```python
async def get_apods_by_date_range(pool, start: str, end: str) -> list[dict]
async def upsert_apods_batch(pool, items: list[dict]) -> list[dict]
    # Use executemany or a single multi-row INSERT ... ON CONFLICT DO NOTHING
```

`routers/apod.py`:
```python
@router.get("/apod/feed", response_model=list[ApodItem])
async def get_apod_feed(start: str, end: str, request: Request):
    # Validate: end - start <= 30 days; return 400 if exceeded
    # Fetch from DB first; for any missing dates, call NASA API
    # Cache new results; return all
```

**Constraint:** Max 30-day range. Enforce in the router and return HTTP 400 with message `"Date range must not exceed 30 days"` if violated.

**Acceptance criteria:**
- `GET /api/v1/apod/feed?start=2026-04-01&end=2026-04-07` returns 7 APOD items
- Second identical call hits DB only (no NASA API call)
- `GET /api/v1/apod/feed?start=2026-01-01&end=2026-04-23` returns HTTP 400

---

## BE-04 — `GET /apod/search`

**Priority:** P1 | **Milestone:** M4

**What to build:**

`db/queries.py`:
```python
async def search_apod(pool, q: str, limit: int = 20) -> list[dict]:
    # SQL:
    # SELECT date, title, url, media_type,
    #        ts_rank(to_tsvector('english', title || ' ' || explanation),
    #                plainto_tsquery('english', $1)) AS rank
    # FROM apod_cache
    # WHERE to_tsvector('english', title || ' ' || explanation)
    #       @@ plainto_tsquery('english', $1)
    # ORDER BY rank DESC LIMIT $2
```

`schemas.py` — define `SearchResult`:
```python
class SearchResult(BaseModel):
    date: str
    title: str
    url: str
    media_type: str
    rank: float
```

`routers/apod.py`:
```python
@router.get("/apod/search", response_model=list[SearchResult])
async def search_apod_route(q: str, limit: int = 20, request: Request = ...):
    # Validate: q non-empty, limit 1-100
    # Call search_apod(pool, q, limit)
```

**Note:** Search only works over what's been cached in `apod_cache`. For best results the feed endpoint should be pre-populated. The search index GIN index is created by the schema SQL — no extra work needed.

**Acceptance criteria:**
- `GET /api/v1/apod/search?q=black+hole` returns ranked results with `rank` field
- `GET /api/v1/apod/search?q=` returns HTTP 422 (Pydantic validation)
- Results are ordered by relevance (highest rank first)

---

## BE-05 — `GET /images/search`

**Priority:** P1 | **Milestone:** M5

**What to build:**

`services/nasa_images.py`:
```python
async def search_nasa_images(q: str, page: int = 1, limit: int = 20) -> list[dict]:
    # GET https://images-api.nasa.gov/search?q={q}&media_type=image&page={page}
    # No API key required
    # Parse nested response: data["collection"]["items"]
    # Each item: item["data"][0] for metadata, item["links"][0]["href"] for thumb_url
    # Return list of dicts matching NasaImage schema
```

NASA Image Library response structure:
```json
{
  "collection": {
    "items": [
      {
        "data": [{"nasa_id": "...", "title": "...", "description": "...", "keywords": [...], "date_created": "..."}],
        "links": [{"href": "thumb_url", "rel": "preview"}]
      }
    ]
  }
}
```

`schemas.py` — define `NasaImage`:
```python
class NasaImage(BaseModel):
    nasa_id: str
    title: str
    thumb_url: str | None = None
    date_created: str | None = None
    media_type: str = "image"
```

`routers/images.py`:
```python
@router.get("/images/search", response_model=list[NasaImage])
async def search_images(q: str, page: int = 1, limit: int = 20):
    # Validate: q non-empty, page >= 1, limit 1-50
    # NASA Image Library has its own pagination — pass page directly
    # Do NOT cache NASA Image Library results (too large for free Neon tier)
    return await search_nasa_images(q, page, limit)
```

**Acceptance criteria:**
- `GET /api/v1/images/search?q=hubble` returns NASA Image Library results
- Each result has `nasa_id`, `title`, `thumb_url`
- Empty `q` returns HTTP 422

---

## BE-06 — GPT-4o agent (web + Reddit + YouTube tools)

**Priority:** P0 | **Milestone:** M2

**What to build:** `agents/briefing_agent.py` — full implementation per tech-design Section 4.

**Tool implementations:**

```python
async def web_search(query: str) -> list[dict]:
    # from duckduckgo_search import DDGS
    # results = DDGS().text(query, max_results=3)
    # return [{"title": r["title"], "url": r["href"], "snippet": r["body"]} for r in results]

async def reddit_search(query: str) -> list[dict]:
    # import praw
    # reddit = praw.Reddit(client_id=..., client_secret=..., user_agent=...)
    # sub = reddit.subreddit("space+Astronomy")
    # results = list(sub.search(query, limit=3, sort="relevance"))
    # return [{"title": r.title, "url": f"https://reddit.com{r.permalink}", "score": r.score} for r in results]

async def youtube_search(query: str) -> list[dict]:
    # from googleapiclient.discovery import build
    # youtube = build("youtube", "v3", developerKey=settings.youtube_api_key)
    # resp = youtube.search().list(q=query, part="snippet", maxResults=3, type="video").execute()
    # items = resp.get("items", [])
    # return [{"title": i["snippet"]["title"], "url": f"https://youtube.com/watch?v={i['id']['videoId']}", "channel": i["snippet"]["channelTitle"]} for i in items]
```

**Important:** `praw` and `google-api-python-client` are synchronous libraries. Wrap calls with `asyncio.to_thread(...)` to avoid blocking the event loop:
```python
results = await asyncio.to_thread(lambda: list(sub.search(query, limit=3)))
```

**Agent entry point:**
```python
async def generate_briefing(title: str, date: str, explanation: str) -> dict:
    # Two-pass pattern from tech-design Section 4
    # Returns dict with keys: mission_context, scientific_significance, key_facts, sources
```

**Error handling:** If any tool raises an exception, catch it and return `[]` for that tool's results. The agent will synthesize with whatever data is available. Log the error.

**Acceptance criteria:**
- `generate_briefing("Pillars of Creation", "2026-04-23", "...")` returns valid dict with all 4 keys
- `sources` list contains at least 1 entry
- Function completes in under 30 seconds
- Failed tool calls do not crash the agent

---

## BE-07 — `POST /briefings/generate`

**Priority:** P0 | **Milestone:** M2

**What to build:**

`db/queries.py`:
```python
async def insert_briefing(pool, briefing: dict) -> dict:
    # INSERT INTO briefings (apod_date, mission_context, scientific_significance, key_facts, sources)
    # VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
    # ON CONFLICT (apod_date) DO NOTHING
    # RETURNING *
```

`schemas.py` — define `GenerateBriefingRequest` and `Briefing`:
```python
class GenerateBriefingRequest(BaseModel):
    apod_date: str   # format: YYYY-MM-DD

class Briefing(BaseModel):
    apod_date: str
    mission_context: str
    scientific_significance: str
    key_facts: list[str]
    sources: list[Source]
    generated_at: str

class Source(BaseModel):
    type: str   # "web" | "reddit" | "youtube"
    title: str
    url: str
```

`routers/briefings.py`:
```python
@router.post("/briefings/generate", response_model=Briefing)
async def generate_briefing(body: GenerateBriefingRequest, request: Request):
    pool = request.app.state.pool
    # 1. Check cache
    existing = await get_briefing(pool, body.apod_date)
    if existing:
        return existing
    # 2. Get APOD metadata
    apod = await get_apod_by_date(pool, body.apod_date)
    if not apod:
        apod_data = await fetch_apod(body.apod_date)
        await upsert_apod(pool, apod_data)
        apod = apod_data
    # 3. Generate
    briefing_dict = await generate_briefing_agent(apod["title"], apod["date"], apod["explanation"])
    briefing_dict["apod_date"] = body.apod_date
    # 4. Persist
    await insert_briefing(pool, briefing_dict)
    return briefing_dict
```

**Acceptance criteria:**
- `POST /api/v1/briefings/generate` with body `{"apod_date": "2026-04-23"}` returns a `Briefing` JSON
- Second call for same date returns cached result without calling GPT-4o (verify via logs)
- Response includes at least 3 sources
- `key_facts` has at least 3 items

---

## BE-08 — `GET /briefings/{date}`

**Priority:** P0 | **Milestone:** M2

**What to build:**

`db/queries.py`:
```python
async def get_briefing(pool, date: str) -> dict | None:
    # SELECT * FROM briefings WHERE apod_date = $1
    # Return None if no row found
```

`routers/briefings.py`:
```python
@router.get("/briefings/{date}", response_model=Briefing)
async def get_briefing_route(date: str, request: Request):
    pool = request.app.state.pool
    briefing = await get_briefing(pool, date)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found for this date")
    return briefing
```

**Acceptance criteria:**
- `GET /api/v1/briefings/2026-04-23` returns 200 + Briefing if it exists
- `GET /api/v1/briefings/1900-01-01` returns 404 with `{"detail": "Briefing not found for this date"}`

---

## BE-09 — Background job: daily APOD fetch

**Priority:** P2 | **Milestone:** M6

**What to build:**

`main.py` — add APScheduler job on startup:
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup():
    app.state.pool = await create_pool()
    scheduler.add_job(daily_apod_job, "cron", hour=0, minute=5, args=[app])
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
    await close_pool(app.state.pool)

async def daily_apod_job(app):
    pool = app.state.pool
    today = date.today().isoformat()
    if not await get_apod_by_date(pool, today):
        data = await fetch_apod()
        await upsert_apod(pool, data)
        # Generate briefing automatically
        briefing = await generate_briefing_agent(data["title"], data["date"], data["explanation"])
        briefing["apod_date"] = today
        await insert_briefing(pool, briefing)
```

**Acceptance criteria:**
- Scheduler starts on app boot without error
- Job runs at 00:05 UTC and adds today's APOD + briefing to DB
- If APOD already exists, job is a no-op (no duplicate insert, no extra GPT-4o call)

---

## BE-10 — Rate limiting + error handling

**Priority:** P1 | **Milestone:** M1 (add while building other routes)

**What to build:**

Add to `main.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

Apply to NASA-dependent routes:
```python
@router.get("/apod/today")
@limiter.limit("60/minute")
async def get_apod_today(request: Request): ...

@router.post("/briefings/generate")
@limiter.limit("10/minute")
async def generate_briefing(...): ...
```

Global error handling in `main.py`:
```python
@app.exception_handler(httpx.HTTPError)
async def nasa_api_error_handler(request, exc):
    return JSONResponse(status_code=503, content={"detail": "NASA API unavailable. Try again shortly."})
```

All `httpx` calls must use `timeout=httpx.Timeout(10.0)`. Wrap NASA API calls:
```python
try:
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()
except httpx.HTTPStatusError as e:
    if e.response.status_code == 429:
        raise HTTPException(503, "NASA API rate limit reached. Try again tomorrow.")
    raise
```

**Acceptance criteria:**
- More than 60 requests/minute to `/apod/today` returns HTTP 429
- NASA API 429 surfaces as HTTP 503 (not 500)
- All external calls timeout at 10 seconds (not hang indefinitely)
