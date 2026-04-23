# AstroLens — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-04-23  
**Status:** Ready for Engineering

---

## 1. Overview

AstroLens is an AI-powered astronomy intelligence platform. It surfaces NASA imagery alongside AI-synthesized briefings that give each image context: mission history, scientific significance, and discovery background — pulled in real time from NASA APIs, the web, Reddit, and YouTube.

**Target users:** Space enthusiasts, students, science communicators, and educators who want depth beyond a caption.

---

## 2. Goals

| # | Goal | Metric |
|---|---|---|
| G1 | Deliver a briefing for any NASA image in under 15 seconds | P95 latency ≤ 15s |
| G2 | Make the full APOD archive searchable with AI-ranked results | Search returns results in ≤ 2s |
| G3 | Surface at least 3 independent sources per briefing (web + Reddit + YouTube) | Avg source count ≥ 3 |
| G4 | Zero cost during development and early production | All infra on free tiers |

---

## 3. Non-Goals

- No user authentication or accounts in v1
- No mobile app (responsive web only)
- No real-time streaming data (e.g., live telescope feeds)
- No social features (likes, comments, sharing) in v1

---

## 4. User Stories

### Browse
- As a user, I can see today's NASA Astronomy Picture of the Day with its AI briefing on the homepage.
- As a user, I can scroll through a feed of recent APOD images.

### Search
- As a user, I can type a keyword (e.g., "black hole", "Hubble", "Mars") and get ranked APOD results.
- As a user, I can see a relevance-ranked list of matching images with thumbnail and title.

### Briefing
- As a user, I can click any image to see a full briefing page.
- As a user, the briefing shows: mission context, scientific significance, key facts, and source links.
- As a user, I can see which sources (web articles, Reddit threads, YouTube videos) the briefing was synthesized from.

### Image Library
- As a user, I can browse the NASA Image and Video Library (10,000+ assets) filtered by keyword, year, or category.

---

## 5. System Architecture

```
Browser (Next.js)
      │
      │  REST / JSON
      ▼
FastAPI Backend
      │
      ├── GET /apod/today          → NASA APOD API
      ├── GET /apod/feed           → NASA APOD API (date range)
      ├── GET /apod/search?q=      → PostgreSQL full-text search
      ├── GET /images/search?q=    → NASA Image Library API
      └── POST /briefings/generate → GPT-4o Agent
                                        ├── WebSearch
                                        ├── Reddit search
                                        └── YouTube search
      │
      ▼
PostgreSQL (Neon)
  ├── apod_cache       (images + metadata)
  ├── briefings        (generated briefings + sources)
  └── search_index     (full-text search vectors)
```

---

## 6. Data Models

### `apod_cache`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| date | DATE UNIQUE | APOD date |
| title | TEXT | |
| explanation | TEXT | NASA caption |
| url | TEXT | Image/video URL |
| hdurl | TEXT | HD image URL |
| media_type | TEXT | `image` or `video` |
| created_at | TIMESTAMPTZ | |

### `briefings`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| apod_date | DATE FK → apod_cache.date | |
| mission_context | TEXT | |
| scientific_significance | TEXT | |
| key_facts | JSONB | Array of strings |
| sources | JSONB | Array of `{type, title, url}` |
| generated_at | TIMESTAMPTZ | |

### `nasa_images`
| Column | Type | Notes |
|---|---|---|
| nasa_id | TEXT PK | NASA asset ID |
| title | TEXT | |
| description | TEXT | |
| keywords | TEXT[] | |
| date_created | DATE | |
| thumb_url | TEXT | |
| media_type | TEXT | |
| search_vector | TSVECTOR | For full-text search |

---

## 7. API Specification

### Backend (FastAPI) — Base URL: `/api/v1`

| Method | Path | Description | Response |
|---|---|---|---|
| GET | `/apod/today` | Fetch today's APOD (cached) | `ApodItem` |
| GET | `/apod/feed?start=&end=` | APOD images for a date range | `ApodItem[]` |
| GET | `/apod/search?q=&limit=` | Full-text search over APOD archive | `SearchResult[]` |
| GET | `/images/search?q=&page=&limit=` | NASA Image Library search | `NasaImage[]` |
| GET | `/briefings/{apod_date}` | Get existing briefing for an APOD date | `Briefing` |
| POST | `/briefings/generate` | Trigger GPT-4o agent to generate briefing | `Briefing` |

### Key Response Schemas

**`ApodItem`**
```json
{
  "date": "2026-04-23",
  "title": "string",
  "explanation": "string",
  "url": "string",
  "hdurl": "string",
  "media_type": "image | video"
}
```

**`Briefing`**
```json
{
  "apod_date": "2026-04-23",
  "mission_context": "string",
  "scientific_significance": "string",
  "key_facts": ["string"],
  "sources": [
    { "type": "web | reddit | youtube", "title": "string", "url": "string" }
  ],
  "generated_at": "ISO 8601"
}
```

---

## 8. GPT-4o Agent Logic

The agent is triggered via `POST /briefings/generate`. It receives the image title, date, and NASA explanation as input and executes the following tool calls in parallel:

1. **WebSearch** — Search `"{title} NASA mission site:nasa.gov OR site:esa.int OR site:space.com"`
2. **RedditSearch** — Search `r/space` and `r/Astronomy` for the image title
3. **YouTubeSearch** — Find explainer videos matching the title + year

The agent synthesizes results into the `Briefing` schema and persists to Neon. Subsequent requests for the same date return the cached briefing without re-calling GPT-4o.

---

## 9. Frontend Pages

| Route | Page | Key Components |
|---|---|---|
| `/` | Homepage | `TodayHero`, `RecentFeed` |
| `/search` | Search | `SearchBar`, `SearchResults` |
| `/apod/[date]` | APOD Detail | `ImageViewer`, `BriefingPanel`, `SourceList` |
| `/library` | NASA Image Library | `ImageGrid`, `FilterBar` |
| `/library/[id]` | Image Detail | `ImageViewer`, `MetadataPanel` |

### UI/UX Requirements
- Dark space-themed design (dark backgrounds, accent colors from nebula palettes)
- Responsive: mobile-first, works on 320px–1440px+
- Image lazy loading with skeleton placeholders
- Briefing panel shows a loading spinner + streaming text while GPT-4o runs
- Source pills link out to original articles/videos

---

## 10. Engineering Tasks

### Backend

| ID | Task | Priority | Notes |
|---|---|---|---|
| BE-01 | Project scaffold: FastAPI app, Docker, Neon connection | P0 | |
| BE-02 | `GET /apod/today` — fetch + cache in Neon | P0 | |
| BE-03 | `GET /apod/feed` — date range APOD fetch | P1 | |
| BE-04 | `GET /apod/search` — full-text search over APOD cache | P1 | PostgreSQL `tsvector` |
| BE-05 | `GET /images/search` — NASA Image Library proxy | P1 | |
| BE-06 | GPT-4o agent: WebSearch + Reddit + YouTube tool calls | P0 | Minimize token usage |
| BE-07 | `POST /briefings/generate` — agent trigger + Neon persist | P0 | |
| BE-08 | `GET /briefings/{date}` — return cached briefing | P0 | |
| BE-09 | Background job: daily APOD fetch + auto-briefing | P2 | |
| BE-10 | Rate limiting + error handling on all NASA API calls | P1 | 1,000 req/day limit |

### Frontend

| ID | Task | Priority | Notes |
|---|---|---|---|
| FE-01 | Next.js scaffold: App Router, Tailwind, dark theme | P0 | |
| FE-02 | Homepage: TodayHero component — APOD + briefing CTA | P0 | |
| FE-03 | Homepage: RecentFeed — last 7 APODs in a grid | P1 | |
| FE-04 | APOD Detail page `/apod/[date]` — image + briefing panel | P0 | |
| FE-05 | BriefingPanel: loading state + streaming text reveal | P1 | |
| FE-06 | SourceList: source pills (web/reddit/youtube icons) | P1 | |
| FE-07 | Search page: SearchBar + debounced API calls | P1 | |
| FE-08 | SearchResults: ranked list with thumbnail + title | P1 | |
| FE-09 | Library page: ImageGrid + FilterBar | P2 | |
| FE-10 | Library Detail page `/library/[id]` | P2 | |
| FE-11 | Responsive design audit (320px–1440px) | P1 | |
| FE-12 | Deploy to Vercel via Vercel MCP | P0 | |

---

## 11. Environment Variables

| Variable | Used By | Where to Get |
|---|---|---|
| `NASA_API_KEY` | Backend | api.nasa.gov (free) |
| `OPENAI_API_KEY` | Backend (GPT-4o agent) | platform.openai.com |
| `DATABASE_URL` | Backend | Neon dashboard |
| `NEXT_PUBLIC_API_URL` | Frontend | Set to backend URL |

> All keys are stored in `C:\Users\parth\Claude\secrets.md`.

---

## 12. Milestones

| Milestone | Includes | Target |
|---|---|---|
| M1 — Backend Core | BE-01 through BE-05, BE-08 | Week 1 |
| M2 — AI Briefings | BE-06, BE-07 | Week 1 |
| M3 — Frontend Core | FE-01 through FE-06, FE-12 | Week 2 |
| M4 — Search | BE-04, FE-07, FE-08 | Week 2 |
| M5 — Library + Polish | BE-05, FE-09, FE-10, FE-11 | Week 3 |
| M6 — Automation | BE-09, BE-10 | Week 3 |

---

## 13. Out of Scope (v2 candidates)

- User accounts and saved briefings
- Email digest subscription (daily APOD briefing to inbox)
- Social sharing cards (OG image generation)
- Multi-language briefings
- Slack/Discord bot integration
