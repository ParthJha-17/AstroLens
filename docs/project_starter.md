# Project Starter — LLM Agent Collaboration System

Drop this system into any project to run a structured multi-agent workflow where each Claude chat window is an LLM optimized for a specific role. Agents communicate asynchronously through markdown files. You are the Executive Director — you steer, unblock, and approve.

---

## Philosophy

These are not human role simulations. Each agent is an LLM configuration that exploits what language models are genuinely good at:

| Agent | LLM strength being used |
|---|---|
| PM | Requirements synthesis, gap detection, prioritization, structured spec writing |
| Senior SDE | Architecture reasoning, risk identification, task decomposition, code review |
| Backend Dev | Implementing from clear specs, API design, schema design |
| Frontend Dev | UI component implementation, responsive design, API integration |
| Master (ED) | Status summarization, blocker surfacing, directive drafting |

No agent makes decisions outside its scope. No agent implements what it hasn't been asked to build.

---

## Complete File Structure

This is the exact structure to create. Every file and folder listed below is required.

```
[project-root]/
│
├── README.md                           ← Senior SDE writes after tech-design (root setup guide)
├── CHANGELOG.md                        ← Senior SDE appends each time review is APPROVED
│
├── backend/
│   └── README.md                       ← Backend Dev writes after scaffold (how to run backend)
│
├── frontend/
│   └── README.md                       ← Frontend Dev writes after scaffold (how to run frontend)
│
└── docs/
    ├── project_starter.md              ← this file (copy to new projects)
    ├── local_agent_project.md          ← system architecture + interview guide
    │
    ├── status.md                       ← live dashboard: table + append-only log
    │
    ├── agents/
    │   ├── MASTER.md                   ← ED chief-of-staff identity + boot message
    │   ├── PM.md                       ← PM agent identity + boot message
    │   ├── SENIOR_SDE.md               ← Senior SDE identity + boot message
    │   ├── BACKEND.md                  ← Backend Dev identity + boot message
    │   └── FRONTEND.md                 ← Frontend Dev identity + boot message
    │
    ├── pm/
    │   ├── prd.md                      ← product requirements (PM writes)
    │   └── decisions.md                ← append-only scoping decisions (PM writes)
    │
    ├── senior-sde/
    │   ├── tech-design.md              ← architecture + data models (Senior SDE writes FIRST)
    │   ├── backend-tasks.md            ← backend task specs (Senior SDE writes after design)
    │   ├── frontend-tasks.md           ← frontend task specs (Senior SDE writes after design)
    │   └── review-feedback.md          ← code review results per task (Senior SDE writes)
    │
    ├── backend/
    │   ├── impl-log.md                 ← what was built + exact file paths (Backend Dev writes)
    │   └── questions.md                ← OPEN blockers + RESOLVED answers (Dev + Senior SDE)
    │
    └── frontend/
        ├── impl-log.md                 ← what was built + exact file paths (Frontend Dev writes)
        └── questions.md                ← OPEN blockers + RESOLVED answers (Dev + Senior SDE)
```

---

## Scaffold a New Project

Run these steps to instantiate the system from scratch. Each file is shown with its required initial content.

### Step 1 — Create folders

```
mkdir -p docs/agents docs/pm docs/senior-sde docs/backend docs/frontend
mkdir -p backend frontend
```

### Step 2 — Create `docs/status.md`

```markdown
# [Project Name] — Project Status Board

> Live dashboard. Every agent updates the table and appends a log entry after each session.

---

## Current Cycle State

| Agent | Status | Last Updated |
|---|---|---|
| PM | NOT STARTED | — |
| Senior SDE | NOT STARTED | — |
| Backend Dev | NOT STARTED | — |
| Frontend Dev | NOT STARTED | — |

---

## Status Log

_No entries yet._
```

### Step 3 — Create workspace placeholder files

**`docs/pm/prd.md`**
```markdown
# Product Requirements

_Waiting for PM agent to populate._
```

**`docs/pm/decisions.md`**
```markdown
# PM — Decisions Log

> Append-only. Do not edit existing decisions. Add new ones at the bottom.

_No decisions yet._
```

**`docs/senior-sde/tech-design.md`**
```markdown
# Senior SDE — Technical Design

> Written before any tasks are assigned. Devs read this for architectural context.

_Waiting for Senior SDE to boot and read PRD. Status: NOT STARTED._
```

**`docs/senior-sde/backend-tasks.md`**
```markdown
# Senior SDE — Backend Task List

> Backend Dev reads this as their primary inbox.

_Waiting for Senior SDE to write task specs. Status: NOT STARTED._
```

**`docs/senior-sde/frontend-tasks.md`**
```markdown
# Senior SDE — Frontend Task List

> Frontend Dev reads this as their primary inbox.

_Waiting for Senior SDE to write task specs. Status: NOT STARTED._
```

**`docs/senior-sde/review-feedback.md`**
```markdown
# Senior SDE — Code Review Feedback

> Populated after reviewing impl-logs and actual source files.

_No reviews yet._
```

**`docs/backend/impl-log.md`**
```markdown
# Backend Dev — Implementation Log

> Append an entry after each completed task. Include exact file paths for code review.

_Nothing built yet._
```

**`docs/backend/questions.md`**
```markdown
# Backend Dev — Questions & Blockers

> Dev writes OPEN entries. Senior SDE appends RESOLVED directly below each question.

_No open questions._
```

**`docs/frontend/impl-log.md`**
```markdown
# Frontend Dev — Implementation Log

> Append an entry after each completed task. Include exact file paths for code review.

_Nothing built yet._
```

**`docs/frontend/questions.md`**
```markdown
# Frontend Dev — Questions & Blockers

> Dev writes OPEN entries. Senior SDE appends RESOLVED directly below each question.

_No open questions._
```

**`README.md`** (root)
```markdown
# [Project Name]

_Written by Senior SDE after tech-design.md is complete._
```

**`CHANGELOG.md`**
```markdown
# Changelog

> Appended by Senior SDE each time a review is marked APPROVED.

_No entries yet._
```

**`backend/README.md`**
```markdown
# Backend

_Written by Backend Dev after project scaffold task (BE-01)._
```

**`frontend/README.md`**
```markdown
# Frontend

_Written by Frontend Dev after project scaffold task (FE-01)._
```

### Step 4 — Copy agent identity files

Copy all 5 files from a reference project's `docs/agents/` folder:
- `MASTER.md`, `PM.md`, `SENIOR_SDE.md`, `BACKEND.md`, `FRONTEND.md`

Then update the **Boot Message** section in each file:
- Replace the project name (`AstroLens` → your project name)
- Update the stack references in `BACKEND.md` and `FRONTEND.md`
- Update the secrets path if different from `C:\Users\parth\Claude\secrets.md`

### Step 5 — Boot the system

1. Open a new Claude chat window
2. Paste the Boot Message from `docs/agents/MASTER.md`
3. Describe your project idea to the Master agent
4. Master drafts a PM directive → paste into a PM chat window
5. PM writes the PRD → signals `DONE → senior-sde`

---

## The Work Cycle

```
ED seeds PM with project brief
        ↓
PM synthesizes → prd.md + decisions.md
        ↓  STATUS: DONE → senior-sde
        │
        │  ┌─── if technical infeasibility ──→ BLOCKED → pm ──→ PM revises scope
        │  │                                                           │
        ▼  │                                                           ▼
Senior SDE reads PRD                                        PM writes DONE → senior-sde
 1. Unblock any dev questions first
 2. Write tech-design.md
 3. Write backend-tasks.md + frontend-tasks.md
 4. Write README.md
        ↓  STATUS: DONE → backend + frontend
        │
   ┌────┴────┐
   ▼         ▼
Backend    Frontend
Dev        Dev
   │         │
   │         │  ←── if API mismatch: Frontend writes BLOCKED → senior-sde
   │         │      Senior SDE decides fault → fixes spec or backend task
   │         │      writes RESOLVED to frontend/questions.md
   │         │
   ▼         ▼
impl-log   impl-log
   │         │
   └────┬────┘
        ↓  STATUS: NEEDS REVIEW → senior-sde
        │
Senior SDE reads impl-log + actual source files
 → writes review-feedback.md
 → if APPROVED: appends to CHANGELOG.md
        ↓
STATUS: APPROVED or CHANGES REQUESTED → dev(s)
        ↓
ED reviews status.md → decides next cycle
```

---

## Status Vocabulary

Every agent **updates the Current Cycle State table** in `docs/status.md` AND **appends a log entry** after each session. Both parts are required.

**Table update** (top of status.md):
```markdown
| Backend Dev | NEEDS REVIEW → senior-sde | 2026-04-23 |
```

**Log append** (bottom of status.md):
```markdown
## [AGENT] | [DATE] | [STATUS]
- What was completed
- What is next / who is unblocked
```

**STATUS values:**

| Value | Meaning |
|---|---|
| `NOT STARTED` | Agent has never been activated for this cycle |
| `IN PROGRESS` | Agent is actively working |
| `WAITING` | Agent has been activated but inbox is empty |
| `DONE → [agent]` | Work complete, named agent should pick up |
| `BLOCKED → [agent]` | Waiting on named agent to unblock |
| `NEEDS REVIEW → senior-sde` | Dev submitted work for code review |
| `CHANGES REQUESTED → [agent]` | Review done, named agent must revise |
| `APPROVED` | Senior SDE signed off, work is shippable |

---

## questions.md Protocol (OPEN / RESOLVED)

Dev agents write blockers in OPEN format. Senior SDE appends RESOLVED directly below — in the same file, so context stays together.

**Dev writes:**
```markdown
### Q-01 | 2026-04-23 | OPEN
**Task:** BE-03
**Question:** Should the /apod/feed endpoint paginate or return all results?
**Blocking:** yes
**My assumption (if unblocked):** I'll default to returning last 30 if no answer.
```

**Senior SDE appends below it:**
```markdown
### Q-01 | 2026-04-24 | RESOLVED
**Task:** BE-03
**Question:** Should the /apod/feed endpoint paginate or return all results?
**Answer:** Paginate. Default page_size=20, max=100. Use offset-based pagination.
**Action required:** Re-attempt BE-03 with pagination added to the spec.
```

Dev checks questions.md on every boot. If their Q is now RESOLVED, they act on the answer.

---

## README and CHANGELOG Ownership

| Document | Owned by | Written when |
|---|---|---|
| `README.md` (root) | Senior SDE | After `tech-design.md` is written |
| `CHANGELOG.md` | Senior SDE | Appended each time a review is APPROVED |
| `backend/README.md` | Backend Dev | After the backend scaffold task (BE-01) |
| `frontend/README.md` | Frontend Dev | After the frontend scaffold task (FE-01) |

These are living documents — each owner keeps them updated as the project grows.

---

## Booting an Agent

Each `AGENT.md` file ends with a **Boot Message** block. To start a new agent:

1. Open a new Claude Code chat window (or any Claude interface)
2. Copy the Boot Message from the relevant `docs/agents/AGENT.md`
3. Paste it as your first message
4. The agent reads its files and tells you what it's working on

Setup time: ~30 seconds. No configuration beyond pasting.

---

## ED / Master Window

The Master window is your command center. Claude in that window acts as your chief of staff:
- **Proactively** surfaces blockers, stale statuses, silent agents, and what should happen next
- **Reactively** answers questions about any agent's current state on demand
- **On demand** drafts single or multi-agent directives you paste into agent windows

Status vocabulary is embedded in the MASTER.md Boot Message so it can interpret the dashboard correctly.

---

## Pair Programming Integration

When coding alongside an agent (e.g., Backend Dev):

1. Agent boots, reads its inbox, states which task it's picking up
2. Agent implements the task with you — one task at a time
3. On completion, agent writes to `impl-log.md` (with exact file paths) and updates `status.md`
4. If blocked mid-task, agent writes to `questions.md` and you paste a directive to Senior SDE

The exact file paths in impl-log matter — Senior SDE reads the actual source files for code review, not just the log summary.

---

## Adapting to a New Project

1. Complete Steps 1–4 from the scaffold section above
2. Write a one-paragraph project brief
3. Boot MASTER, paste the brief, ask for a PM directive
4. Paste the PM directive into a new PM window
5. PM writes the PRD — the cycle begins

The agent identity files (`docs/agents/*.md`) are project-agnostic and reusable. Only the Boot Messages need project name and stack updates.
