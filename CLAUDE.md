# AstroLens — Claude Code Project Instructions

## Dual Objectives

### Objective 1: Build AstroLens
An AI astronomy intelligence platform. FastAPI backend fetches imagery from NASA APIs (APOD + Image Library, 10,000+ assets) and triggers a GPT-4o agent that searches the web, Reddit, and YouTube to gather mission context, scientific background, and discovery history. The agent synthesizes multi-source findings into structured per-image briefings covering mission timeline, scientific significance, and key facts — delivered in under 15 seconds. Supports full-text search across NASA's APOD archive with AI-ranked results.

**Core stack:** FastAPI · GPT-4o · Next.js · PostgreSQL (Neon) · Docker

### Objective 2: Optimize Pair Programming with Claude Code
This project is also a live experiment in making Claude Code the fastest, safest, most correct way to ship software. Every tool, MCP, and service choice is made with that goal in mind. Free tiers are preferred. Decisions are documented here so they can be reused across other projects.

---

## MCP Toolkit

These MCPs are active globally (`~/.mcp.json`) and available in every session:

| MCP | What it unlocks for this project |
|---|---|
| **Neon** | Create and query the PostgreSQL database — APOD cache, briefings, search index |
| **GitHub** | Manage PRs, issues, branch protection; code review workflow |
| **Vercel** | Deploy Next.js frontend; monitor build logs and runtime errors |
| **Notion** | Project docs, research notes, architecture decisions |
| **Gmail** | Send briefing digests or alert emails from the app |
| **Calendar** | Schedule automated briefing runs or reminders |
| **Claude Preview** | Test the Next.js UI in-browser without leaving Claude Code |
| **Claude in Chrome** | Drive web/Reddit/YouTube searches the GPT-4o agent relies on |
| **WebSearch** | Research NASA missions, astronomical events, library docs |
| **Scheduled Tasks** | Set up recurring APOD fetch + briefing generation jobs |

---

## Free-Tier Infrastructure

All services used have a free tier sufficient for development and early production:

| Service | Purpose | Free tier |
|---|---|---|
| **Neon** | PostgreSQL | 0.5 GB storage, 1 project |
| **Vercel** | Next.js hosting | Unlimited hobby deploys |
| **GitHub** | Source control + CI | Unlimited public repos |
| **NASA APIs** | APOD + Image Library | Free, API key required (rate limited) |
| **OpenAI** | GPT-4o agent | Pay-per-use (no free tier, minimize calls) |
| **Docker Hub** | Container registry | 1 private repo free |

---

## Pair Programming Principles

1. **Check secrets first** — All API keys are in `C:\Users\parth\Claude\secrets.md`. Never ask for a key that's already stored there.
2. **Deploy via Vercel MCP** — Don't write deploy scripts manually; use the Vercel MCP to trigger and monitor deployments.
3. **Database via Neon MCP** — Write and test schema changes by querying Neon directly before touching migration files.
4. **Test UI with Claude Preview** — Before marking any frontend task done, screenshot and interact with the running app.
5. **One PR per feature** — Use GitHub MCP to create PRs; keep them small and reviewable.
6. **Free before paid** — Always exhaust free-tier options before introducing a paid service.
7. **Correct before fast** — Run type checks and tests before deploying. Speed comes from good tooling, not skipping safety.

---

## Project Structure (planned)

```
AstroLens/
├── backend/          # FastAPI app
│   ├── main.py
│   ├── routers/      # nasa, briefings, search
│   ├── agents/       # GPT-4o agent logic
│   └── db/           # Neon/SQLAlchemy models
├── frontend/         # Next.js dashboard
│   ├── app/
│   └── components/
├── docker-compose.yml
└── CLAUDE.md         # this file
```

---

## NASA API Keys
- API key required — get free at api.nasa.gov (rate limit: 1,000 req/day)
- Store in `C:\Users\parth\Claude\secrets.md` under `## NASA`
