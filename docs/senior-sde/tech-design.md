# Senior SDE — Technical Design

**Version:** 1.0
**Date:** 2026-04-23
**Status:** Ready for implementation

---

## 1. Directory Structure

```
AstroLens/
├── backend/
│   ├── main.py                    # App factory, CORS, router mounting
│   ├── config.py                  # pydantic-settings, reads .env
│   ├── schemas.py                 # All Pydantic request/response models
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── apod.py               # /api/v1/apod/* routes
│   │   ├── images.py             # /api/v1/images/* routes
│   │   └── briefings.py         # /api/v1/briefings/* routes
│   ├── agents/
│   │   ├── __init__.py
│   │   └── briefing_agent.py    # GPT-4o agent with tool calling
│   ├── db/
│   │   ├── __init__.py
│   │   ├── connection.py        # asyncpg pool lifecycle
│   │   └── queries.py           # All raw SQL query functions
│   ├── services/
│   │   ├── __init__.py
│   │   ├── nasa_apod.py         # NASA APOD API HTTP client
│   │   └── nasa_images.py       # NASA Image Library HTTP client
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout, dark theme globals
│   │   ├── page.tsx              # Homepage (Server Component)
│   │   ├── search/
│   │   │   └── page.tsx          # Search page (Server shell)
│   │   ├── apod/
│   │   │   └── [date]/
│   │   │       └── page.tsx      # APOD detail (Server Component)
│   │   └── library/
│   │       ├── page.tsx          # Library browse (Server shell)
│   │       └── [id]/
│   │           └── page.tsx      # Image detail (Server Component)
│   ├── components/
│   │   ├── TodayHero.tsx         # Server Component
│   │   ├── RecentFeed.tsx        # Server Component
│   │   ├── BriefingPanel.tsx     # 'use client' — polls for briefing
│   │   ├── SourceList.tsx        # Server Component (pure display)
│   │   ├── ImageViewer.tsx       # Server Component
│   │   ├── SearchBar.tsx         # 'use client' — debounced input
│   │   ├── SearchResults.tsx     # 'use client' — renders results
│   │   ├── ImageGrid.tsx         # Server Component
│   │   └── FilterBar.tsx         # 'use client' — filter state
│   ├── lib/
│   │   └── api.ts                # Typed fetch wrappers, all API calls
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
└── docker-compose.yml
```

---

## 2. Backend Architecture

**Runtime:** Python 3.11+
**Framework:** FastAPI with uvicorn
**HTTP client:** `httpx` (async, used for all external API calls)
**Database driver:** `asyncpg` (PostgreSQL async, no ORM)
**Config:** `pydantic-settings` (reads env vars into typed `Settings` object)
**Rate limiting:** `slowapi`

### `config.py` pattern
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    nasa_api_key: str
    openai_api_key: str
    database_url: str          # asyncpg-compatible: postgresql://...
    reddit_client_id: str
    reddit_client_secret: str
    reddit_user_agent: str = "AstroLens/1.0"
    youtube_api_key: str

    class Config:
        env_file = ".env"

settings = Settings()
```

### `main.py` pattern
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.connection import create_pool, close_pool
from routers import apod, images, briefings

app = FastAPI(title="AstroLens API", version="1.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

app.include_router(apod.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(briefings.router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    app.state.pool = await create_pool()

@app.on_event("shutdown")
async def shutdown():
    await close_pool(app.state.pool)
```

### Request lifecycle — `POST /briefings/generate`
1. Router checks: `GET briefing FROM briefings WHERE apod_date = $1` — if hit, return immediately
2. Router fetches: `GET apod FROM apod_cache WHERE date = $1` — if miss, call NASA APOD API and cache
3. Router calls `briefing_agent.generate(title, date, explanation)`
4. Agent runs 3 tools in parallel (`asyncio.gather`)
5. Agent sends results back to GPT-4o for synthesis → returns `Briefing` dict
6. Router persists briefing to Neon, returns to client

### NASA API constraints
- APOD API: `https://api.nasa.gov/planetary/apod` — requires `api_key`, supports `date`, `start_date`/`end_date`
- Image Library: `https://images-api.nasa.gov/search` — **no API key required**
- Rate limit: 1,000 req/day total. All APOD responses must be cached. Never call NASA APOD if data is already in `apod_cache`.

---

## 3. Database Schema

Run via Neon MCP before any backend code is tested. Schema is idempotent (`IF NOT EXISTS`).

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS apod_cache (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date        DATE UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    explanation TEXT NOT NULL,
    url         TEXT NOT NULL,
    hdurl       TEXT,
    media_type  TEXT NOT NULL DEFAULT 'image',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apod_fts ON apod_cache
    USING GIN(to_tsvector('english', title || ' ' || explanation));

CREATE TABLE IF NOT EXISTS briefings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apod_date               DATE UNIQUE NOT NULL REFERENCES apod_cache(date) ON DELETE CASCADE,
    mission_context         TEXT NOT NULL,
    scientific_significance TEXT NOT NULL,
    key_facts               JSONB NOT NULL DEFAULT '[]',
    sources                 JSONB NOT NULL DEFAULT '[]',
    generated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nasa_images (
    nasa_id      TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT,
    keywords     TEXT[],
    date_created DATE,
    thumb_url    TEXT,
    media_type   TEXT,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_nasa_images_fts ON nasa_images USING GIN(search_vector);
```

### Full-text search query pattern (APOD)
```sql
SELECT date, title, url, media_type,
       ts_rank(to_tsvector('english', title || ' ' || explanation),
               plainto_tsquery('english', $1)) AS rank
FROM apod_cache
WHERE to_tsvector('english', title || ' ' || explanation)
      @@ plainto_tsquery('english', $1)
ORDER BY rank DESC
LIMIT $2;
```

---

## 4. GPT-4o Agent Design

**File:** `backend/agents/briefing_agent.py`
**Library:** `openai` (async client)
**Pattern:** Two-pass tool calling — first call triggers parallel tool use, second synthesizes

### Tool definitions (pass to OpenAI)
```python
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for NASA mission context and scientific background",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "reddit_search",
            "description": "Search r/space and r/Astronomy for posts about this image or topic",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "youtube_search",
            "description": "Find YouTube explainer videos about this astronomical subject",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        }
    }
]
```

### Tool implementations

| Tool | Library | Returns |
|---|---|---|
| `web_search(query)` | `duckduckgo-search` (`DDGS().text()`) | Top 3 `{title, url, body}` |
| `reddit_search(query)` | `praw` — search `r/space+r/Astronomy` | Top 3 `{title, url, score}` |
| `youtube_search(query)` | `google-api-python-client` YouTube Data API v3 | Top 3 `{title, url, channel}` |

YouTube quota: 100 units/search, 10,000 free units/day → 100 searches/day max.

### Agent system prompt
```
You are an astronomy briefing agent for AstroLens. You will receive a NASA image title, date, and NASA's own caption.

Use ALL THREE search tools before writing your response. Craft specific queries based on the image title and subject matter.

Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{
  "mission_context": "2-3 sentences about the mission, spacecraft, telescope, or event depicted",
  "scientific_significance": "2-3 sentences about why this is scientifically important",
  "key_facts": ["concise fact 1", "concise fact 2", "concise fact 3", "concise fact 4", "concise fact 5"],
  "sources": [
    {"type": "web|reddit|youtube", "title": "source title", "url": "source url"}
  ]
}

Include all sources that were useful. Minimum 3 sources total.
```

### Two-pass execution pattern
```python
async def generate(title: str, date: str, explanation: str) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Title: {title}\nDate: {date}\nNASA Caption: {explanation}"}
    ]

    # Pass 1: GPT-4o decides tool calls (all 3 in parallel)
    r1 = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=TOOLS,
        tool_choice="required",
        parallel_tool_calls=True,
    )

    tool_calls = r1.choices[0].message.tool_calls
    messages.append(r1.choices[0].message)

    # Execute all tools concurrently
    results = await asyncio.gather(
        *[_dispatch_tool(tc) for tc in tool_calls],
        return_exceptions=True
    )

    # Append tool results to messages
    for tc, result in zip(tool_calls, results):
        content = json.dumps(result) if not isinstance(result, Exception) else "[]"
        messages.append({"role": "tool", "tool_call_id": tc.id, "content": content})

    # Pass 2: synthesize into Briefing JSON
    r2 = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        response_format={"type": "json_object"},
    )

    return json.loads(r2.choices[0].message.content)
```

---

## 5. Frontend Architecture

**Framework:** Next.js 14+ with App Router
**Styling:** Tailwind CSS v3
**HTTP:** Native `fetch` only — no Axios, no React Query
**State:** `useState`/`useEffect` in Client Components only; no global store

### Server vs Client Component split

| Component | Type | Reason |
|---|---|---|
| `app/page.tsx` | Server | Fetches today's APOD at render time |
| `TodayHero` | Server | Pure display, receives APOD as prop |
| `RecentFeed` | Server | Fetches last 7 APODs server-side |
| `app/apod/[date]/page.tsx` | Server | Fetches APOD + existing briefing server-side |
| `BriefingPanel` | **Client** | Must call POST and manage loading state |
| `SourceList` | Server | Pure display, receives sources as prop |
| `ImageViewer` | Server | Pure display |
| `app/search/page.tsx` | Server | Shell only; children are Client |
| `SearchBar` | **Client** | User input, debouncing |
| `SearchResults` | **Client** | Rendered from SearchBar state |
| `app/library/page.tsx` | Server | Initial grid server-side |
| `FilterBar` | **Client** | Filter state drives re-fetches |
| `ImageGrid` | Server | Pure display grid |

### `lib/api.ts` interface

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export type ApodItem = {
  date: string; title: string; explanation: string;
  url: string; hdurl?: string; media_type: 'image' | 'video';
}

export type Briefing = {
  apod_date: string; mission_context: string;
  scientific_significance: string; key_facts: string[];
  sources: { type: 'web' | 'reddit' | 'youtube'; title: string; url: string }[];
  generated_at: string;
}

export type SearchResult = Pick<ApodItem, 'date' | 'title' | 'url' | 'media_type'> & { rank: number }
export type NasaImage = { nasa_id: string; title: string; thumb_url: string; date_created: string; media_type: string }

export async function getApodToday(): Promise<ApodItem>
export async function getApodFeed(start: string, end: string): Promise<ApodItem[]>
export async function searchApod(q: string, limit?: number): Promise<SearchResult[]>
export async function searchImages(q: string, page?: number, limit?: number): Promise<NasaImage[]>
export async function getBriefing(date: string): Promise<Briefing | null>   // null on 404
export async function generateBriefing(date: string): Promise<Briefing>
```

### BriefingPanel state machine

```
IDLE ──(mount, GET /briefings/date)──► LOADING
LOADING ──(briefing exists)──────────► READY (display briefing)
LOADING ──(404)──────────────────────► PROMPT (show "Generate Briefing" button)
PROMPT ──(user clicks)───────────────► GENERATING (POST /briefings/generate, spinner)
GENERATING ──(response)──────────────► READY
GENERATING ──(>30s or error)─────────► ERROR (show retry button)
```

### Dark theme — Tailwind config extensions

```typescript
// tailwind.config.ts
extend: {
  colors: {
    space: {
      950: '#020617',   // page background
      900: '#0f172a',   // section background
      800: '#1e293b',   // card background
    }
  }
}
```

Default palette usage:
- Page bg: `bg-space-950`
- Cards: `bg-space-800 border border-slate-700`
- Primary text: `text-slate-100`
- Muted text: `text-slate-400`
- Accent: `text-blue-400` / `bg-blue-500`
- Secondary accent: `text-purple-400`
- Skeleton: `animate-pulse bg-slate-800`

---

## 6. Environment Variables

```bash
# backend/.env
NASA_API_KEY=...
OPENAI_API_KEY=...
DATABASE_URL=postgresql://user:pass@host/dbname   # Neon connection string
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=AstroLens/1.0
YOUTUBE_API_KEY=...

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

All secrets are stored in `C:\Users\parth\Claude\secrets.md`. Backend Dev must read that file before asking for any key.

---

## 7. Docker Setup (local dev)

No local PostgreSQL — all DB traffic goes to Neon cloud directly.

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    volumes: [./backend:/app]
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    env_file: ./frontend/.env.local
    volumes: [./frontend:/app, /app/node_modules]
    command: npm run dev
    depends_on: [backend]
```

Backend `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 8. Required Libraries

### Backend (`requirements.txt`)
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
httpx==0.27.0
asyncpg==0.29.0
pydantic-settings==2.2.1
openai==1.30.0
duckduckgo-search==5.3.0
praw==7.7.1
google-api-python-client==2.131.0
slowapi==0.1.9
python-dotenv==1.0.1
apscheduler==3.10.4
```

### Frontend (`package.json` deps)
```json
{
  "next": "^14.2.3",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "tailwindcss": "^3.4.3",
  "typescript": "^5.4.5"
}
```

---

## 9. Key Constraints

| Constraint | Limit | Mitigation |
|---|---|---|
| NASA APOD rate limit | 1,000 req/day | Cache every response in `apod_cache`; never re-fetch |
| OpenAI cost | ~$0.01–0.03/briefing | Generate only on demand; cache forever once generated |
| YouTube API quota | 10,000 units/day (100/search) = 100 searches/day | Per-date cache means each image triggers YouTube once maximum |
| Neon storage | 0.5 GB | APOD archive ~20 MB; briefings ~30 MB; well within limit |
| P95 latency target | 15s | 3 parallel tool calls (3–5s) + GPT-4o synthesis (5–8s) = ~10–13s |
| Reddit API | 60 req/min (personal app) | Not a concern at this scale |
