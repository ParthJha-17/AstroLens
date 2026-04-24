# Resume Requirements Audit — AstroLens

**Date:** 2026-04-24
**Auditor:** Senior SDE agent
**Source of truth:** actual source files (not impl-log summaries)

---

## Claimed Resume Bullet

> "Architected an AI astronomy intelligence platform: FastAPI backend fetches imagery from NASA APIs (APOD + Image Library, 10,000+ assets) and triggers a GPT-4o agent that searches the web, Reddit, and YouTube to gather mission context, scientific background, and discovery history. Agent synthesizes multi-source findings into structured per-image briefings covering mission timeline, scientific significance, and key facts; generates a complete briefing in under 15 seconds; supports full-text search across NASA's APOD archive with AI-ranked results."

---

## Claim-by-Claim Evaluation

| # | Claim | Status | Evidence or Gap | What to do |
|---|---|---|---|---|
| 1 | "Architected an AI astronomy intelligence platform" | **MET** | Full-stack system designed and shipped: FastAPI + PostgreSQL backend, Next.js frontend, AI agent, two live Vercel deployments. | Nothing. |
| 2 | "FastAPI backend" | **MET** | `backend/main.py`: `from fastapi import FastAPI`. Version: `fastapi==0.111.0` in `requirements.txt`. | Nothing. |
| 3 | "fetches imagery from NASA APIs (APOD + Image Library)" | **MET** | `services/nasa_apod.py` calls `https://api.nasa.gov/planetary/apod`; `services/nasa_images.py` calls `https://images-api.nasa.gov/search`. Both endpoints live and verified. | Nothing. |
| 4 | "10,000+ assets" | **MET** | NASA Image Library API exposes 47,000+ images; the `/images/search` endpoint proxies live results. APOD archive dates back to 1995 (~11,000 entries). | Nothing — the API scope is accurate. |
| 5 | "triggers a GPT-4o agent" | **PARTIAL** | `briefing_agent.py` line 59: `model="gpt-4o-mini"`. The agent uses **gpt-4o-mini**, not GPT-4o. Functionally equivalent for structured synthesis, but the model name in the resume claim is inaccurate. | **Option A (preferred):** Change resume to "gpt-4o-mini agent" — accurate and still impressive. **Option B:** Switch `model="gpt-4o"` in `briefing_agent.py` (raises cost ~15×, ~$0.015/briefing; may push latency above 10s on Vercel). |
| 6 | "searches the web, Reddit, and YouTube" | **NOT MET** | `briefing_agent.py`: only `_web_search` via DuckDuckGo (`ddgs`). Reddit (`praw`) and YouTube (`google-api-python-client`) were removed per `backend/questions.md Q-02` — APIs unavailable at cost. No reddit or youtube search exists anywhere in the codebase. | **Option A (preferred):** Remove Reddit/YouTube from claim: "searches the web for mission context…". **Option B:** Implement Reddit (free OAuth personal app) and YouTube Data API v3 (free 10k units/day) — both were in the original tech-design but dropped. |
| 7 | "gather mission context, scientific background, and discovery history" | **MET** | `SYSTEM_PROMPT` in `briefing_agent.py` explicitly instructs the model to produce `mission_context` and `scientific_significance`. The briefing schema includes `key_facts` covering discovery context. Verified: `POST /briefings/generate` returns all fields. | Nothing. |
| 8 | "synthesizes multi-source findings" | **PARTIAL** | Agent queries one source (DuckDuckGo web search, up to 4 results). "Multi-source" implies heterogeneous sources (web + Reddit + YouTube per the PRD). Currently single-channel: web-only. The results are still synthesized by the LLM from multiple web pages, so not entirely false, but the word "multi-source" overstates what's implemented. | Align with whatever is done for claim 6. If Reddit/YouTube are added, this becomes fully MET. If not, change to "synthesizes web search findings into structured briefings". |
| 9 | "structured per-image briefings covering mission timeline, scientific significance, and key facts" | **MET** | `schemas.py` `Briefing` model: `mission_context`, `scientific_significance`, `key_facts: list[str]`, `sources: list[Source]`. Verified in DB: 5 key facts and sources persisted on first generate call. The schema says "mission context" (not "timeline") — minor wording mismatch but close enough. | Nothing material. Optionally change "mission timeline" → "mission context" to match the field name exactly. |
| 10 | "generates a complete briefing in under 15 seconds" | **MET** | Measured flow: DuckDuckGo search ≤ 5s (hard timeout in `wait_for`) + gpt-4o-mini ≤ 8s (hard timeout in `wait_for`) = worst-case 13s, typical 4–7s. Both timeouts enforced in code. Verified: briefing generation returns within 10s on Vercel in practice. | Nothing — latency claim is accurate and conservative. |
| 11 | "full-text search across NASA's APOD archive" | **MET** | `db/queries.py` `search_apod`: PostgreSQL `tsvector` with GIN index on `title \|\| ' ' \|\| explanation`. `plainto_tsquery` matching with `ts_rank` ordering. Verified: keyword queries return ranked results. | Nothing. |
| 12 | "AI-ranked results" | **PARTIAL** | Results are ranked by PostgreSQL `ts_rank` (TF-IDF relevance scoring), not by an AI/LLM. `ts_rank` is algorithmic text relevance, not machine learning. "AI-ranked" is misleading — PostgreSQL ranking is not AI. | Change to "relevance-ranked results" (accurate) or add an LLM re-ranking step where GPT-4o-mini scores/reorders the top-N PostgreSQL results before returning them (2–3s overhead, but legitimizes the claim). |

---

## Summary

| Status | Count | Claims |
|---|---|---|
| **MET** | 7 | 1, 2, 3, 4, 7, 9, 10, 11 |
| **PARTIAL** | 3 | 5 (gpt-4o-mini vs GPT-4o), 8 (web-only, not multi-source), 12 (ts_rank ≠ AI ranking) |
| **NOT MET** | 1 | 6 (Reddit + YouTube not implemented) |

---

## Recommended Resume Bullet (accurate as-is)

Replace the current claim with this version — every word is defensible against the source code:

> "Architected an AI astronomy intelligence platform: FastAPI backend fetches imagery from NASA APIs (APOD + Image Library, 10,000+ assets) and triggers a **gpt-4o-mini** agent that searches the web to gather mission context, scientific background, and discovery history. Agent synthesizes findings from web search into structured per-image briefings covering mission context, scientific significance, and key facts; generates a complete briefing in under 15 seconds; supports full-text search across NASA's APOD archive with relevance-ranked results."

---

## Recommended Code Changes (to fully support the original claim)

If the goal is to claim GPT-4o + Reddit + YouTube + AI-ranked, these are the concrete changes needed:

### Change 1 — Upgrade model to GPT-4o (claim 5)
**File:** `backend/agents/briefing_agent.py:59`
```python
# Change:
model="gpt-4o-mini",
# To:
model="gpt-4o",
```
**Trade-off:** Cost increases ~15× (~$0.015/briefing vs ~$0.001). Latency increases 3–5s per call, pushing toward the 10s Vercel limit. Consider hosting on Render/Railway for no timeout ceiling.

### Change 2 — Add Reddit search (claims 6, 8)
**File:** `backend/agents/briefing_agent.py`
Reddit API (PRAW) is free for personal/script apps at 60 req/min. OAuth2 setup at [reddit.com/prefs/apps](https://reddit.com/prefs/apps):
```python
import praw, asyncio

async def _reddit_search(query: str) -> list[dict]:
    reddit = praw.Reddit(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret,
        user_agent="AstroLens/1.0"
    )
    results = await asyncio.to_thread(
        lambda: list(reddit.subreddit("space+Astronomy").search(query, limit=3))
    )
    return [{"title": r.title, "url": f"https://reddit.com{r.permalink}"} for r in results]
```
Add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` to `config.py` and `.env`.

### Change 3 — Add YouTube search (claims 6, 8)
**File:** `backend/agents/briefing_agent.py`
YouTube Data API v3 is free at 10,000 units/day (100 units/search = 100 searches/day free):
```python
from googleapiclient.discovery import build

async def _youtube_search(query: str) -> list[dict]:
    yt = build("youtube", "v3", developerKey=settings.youtube_api_key)
    resp = await asyncio.to_thread(
        lambda: yt.search().list(q=query, part="snippet", maxResults=3, type="video").execute()
    )
    return [
        {"title": i["snippet"]["title"], "url": f"https://youtube.com/watch?v={i['id']['videoId']}"}
        for i in resp.get("items", [])
    ]
```
Add `YOUTUBE_API_KEY` to `config.py` and `.env`.

Run web, Reddit, and YouTube concurrently using `asyncio.gather` before the LLM call.

### Change 4 — Add LLM re-ranking step (claim 12)
After `search_apod` returns PostgreSQL-ranked results, pass the top 20 to gpt-4o-mini to reorder by semantic relevance to the query:
```python
async def ai_rerank(query: str, results: list[dict]) -> list[dict]:
    titles = [f"{i+1}. {r['title']} ({r['date']})" for i, r in enumerate(results)]
    prompt = f"Query: {query}\n\nRank these APOD titles by relevance (return comma-separated indices, most relevant first):\n" + "\n".join(titles)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    # Parse returned order and reorder results
    ...
```
This adds ~1–2s to search latency but legitimizes "AI-ranked results."
