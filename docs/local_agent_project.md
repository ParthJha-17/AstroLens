# Local LLM Agent Orchestration System

A file-based multi-agent coordination framework where each Claude chat window operates as a specialized LLM agent. Agents communicate asynchronously through markdown files — no APIs, no servers, no automation required. The human (Executive Director) steers the system from a master window.

Built alongside AstroLens as a first-class project in its own right.

---

## The Core Idea

Most multi-agent frameworks solve the orchestration problem with code: a central controller dispatches tasks, routes messages, and manages state in a database. This system takes a different approach:

**The files ARE the message bus. The markdown files ARE the agent state.**

Each agent is a stateless LLM session. It has no memory between chat windows. But it doesn't need memory — all state is persisted in files. Every boot reads from files. Every completion writes to files. The agent is just the compute layer.

This means:
- Any Claude interface works (Claude Code, claude.ai, API)
- State is human-readable, diffable, and version-controllable in git
- The ED can read, edit, or override any agent's state at any time
- No infrastructure to maintain

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Executive Director                     │
│                  (MASTER chat window)                    │
│     reads status.md · drafts directives · approves      │
└──────────────────────┬──────────────────────────────────┘
                       │ directives (pasted manually)
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼────┐ ┌─────▼──────┐    │
    │    PM    │◄►│ Senior SDE │    │  ← back-channel via status.md
    │  agent   │ │   agent    │    │    (BLOCKED → pm / BLOCKED → senior-sde)
    └─────┬────┘ └──┬─────┬───┘    │
          │         │     │        │
      prd.md    tasks│  tasks│     │
    decisions   │     │        │
          │     ▼     ▼        │
          │  ┌────────┐ ┌──────┐  │
          │  │Backend │ │Front-│  │
          │  │  Dev   │◄►│ end  │  │  ← 3-way mismatch via Senior SDE
          │  └───┬────┘ └───┬──┘  │
          │      │          │     │
          └──────┴────┬─────┘     │
                      │           │
                 status.md ───────┘
              (shared dashboard +
               event log)
```

**Communication is always file-mediated.** No agent calls another agent directly. The only shared broadcast channel is `docs/status.md`. Point-to-point communication uses workspace files (questions.md, tasks.md, etc.).

---

## Complete File Map

### Root-level living docs (agents write as they build)

| File | Owned by | Written when | Purpose |
|---|---|---|---|
| `README.md` | Senior SDE | After tech-design.md | Project setup guide: architecture, env vars, how to run |
| `CHANGELOG.md` | Senior SDE | Each time review is APPROVED | Append-only log of what shipped per cycle |
| `backend/README.md` | Backend Dev | After scaffold task BE-01 | How to run backend, env vars, migrations, tests |
| `frontend/README.md` | Frontend Dev | After scaffold task FE-01 | How to run frontend, env vars, build steps |

### Orchestration layer (`docs/`)

| File | Written by | Read by | Purpose |
|---|---|---|---|
| `docs/status.md` | All agents | All agents + MASTER | Two-part dashboard: Current Cycle State table (updated each session) + append-only status log |
| `docs/project_starter.md` | (template) | New projects | Portable scaffold guide with exact file structure and initial content |
| `docs/local_agent_project.md` | (this file) | ED, interviewers | System architecture, design decisions, interview guide |

### Agent identity files (`docs/agents/`)

These define what each agent is, what it reads, what it produces, and how to behave. Stable across the project lifecycle — they don't change as work progresses. Each ends with a **Boot Message**: paste it into a new chat window to activate the agent in ~30 seconds.

| File | Agent | Core responsibility |
|---|---|---|
| `docs/agents/MASTER.md` | ED chief of staff | Reads status.md, surfaces blockers, drafts directives |
| `docs/agents/PM.md` | Product Manager | Synthesizes requirements, writes PRD and decisions log |
| `docs/agents/SENIOR_SDE.md` | Tech Lead | Architecture, task decomposition, code review, README + CHANGELOG |
| `docs/agents/BACKEND.md` | Backend Dev | Implements backend tasks, writes impl-log, owns backend/README |
| `docs/agents/FRONTEND.md` | Frontend Dev | Implements frontend tasks, writes impl-log, owns frontend/README |

### PM workspace (`docs/pm/`)

| File | Purpose |
|---|---|
| `docs/pm/prd.md` | Living product requirements. PM writes, Senior SDE reads before writing tasks. |
| `docs/pm/decisions.md` | Append-only scoping decisions log. Prevents re-litigating closed questions across sessions. |

### Senior SDE workspace (`docs/senior-sde/`)

| File | Purpose |
|---|---|
| `docs/senior-sde/tech-design.md` | Architecture decisions, data models, API contracts. Written **before** any tasks. |
| `docs/senior-sde/backend-tasks.md` | Self-contained task specs: What/Inputs/Output/Criteria/Dependencies/Notes. |
| `docs/senior-sde/frontend-tasks.md` | Same format as backend tasks. |
| `docs/senior-sde/review-feedback.md` | Per-task review: files read, approved items, must-fix items, suggestions. |

### Dev workspaces

| File | Written by | Purpose |
|---|---|---|
| `docs/backend/impl-log.md` | Backend Dev | Per-task log: what was built, **exact file paths**, how tested. Senior SDE reads actual source files listed here for review. |
| `docs/backend/questions.md` | Dev (OPEN) + Senior SDE (RESOLVED) | Blocker queue. OPEN and RESOLVED entries live in the same file, side by side. |
| `docs/frontend/impl-log.md` | Frontend Dev | Same as backend impl-log. |
| `docs/frontend/questions.md` | Dev (OPEN) + Senior SDE (RESOLVED) | Same as backend questions. |

---

## The Agent Protocol

Every agent file follows the same 8-section structure:

```
1. Role identity        — what the LLM is optimized for in this role
2. Decision scope       — explicit YOU DECIDE / YOU DO NOT DECIDE table
3. Files read on boot   — ordered list: highest-priority first
4. Files written        — what the agent produces and when
5. Output formats       — precise templates (impl-log, task spec, review, questions)
6. Working rules        — numbered constraints (priority order, one-task-at-a-time, empty inbox, etc.)
7. Handoff protocol     — update Current Cycle State table + append status log entry
8. Boot Message         — copy-paste activation block
```

The **Boot Message** is the activation key. It tells the agent:
- What project it's on
- Which files to read in what order
- What to report back before starting work
- What stack/tools to use

---

## The Communication Protocols

### 1. Async Handoff (primary pattern)
```
Agent A completes work
  → writes output to its workspace file
  → updates Current Cycle State table in status.md
  → appends dated log entry to status.md
  → ED sees it in MASTER window → activates Agent B
```

### 2. Blocker Resolution (OPEN / RESOLVED)
```
Dev hits a blocker
  → writes OPEN entry to questions.md (Task, Question, Blocking, Assumption)
  → writes BLOCKED → senior-sde in status.md
  → Senior SDE boots, reads questions.md
  → appends RESOLVED entry directly below the question (Answer, Action required)
  → updates status.md so dev knows to re-check
  → Dev boots next session, sees RESOLVED, acts on answer
```

The OPEN and RESOLVED entries stay co-located in the same file. No cross-referencing needed.

### 3. PM ↔ Senior SDE Back-Channel
```
Senior SDE finds technical infeasibility in PRD
  → writes BLOCKED → pm in status.md with precise explanation
  → PM boots, reads BLOCKED → pm entry
  → PM revises prd.md, logs new decision in decisions.md
  → PM writes DONE → senior-sde
  → Senior SDE resumes from updated PRD
```

This is the only way scope can change mid-cycle. All changes flow through status.md — never through direct edits to each other's files.

### 4. 3-Way API Mismatch (Frontend ↔ Senior SDE ↔ Backend)
```
Frontend Dev finds API mismatch (response shape, missing field, wrong status code)
  → writes OPEN entry to frontend/questions.md
  → writes BLOCKED → senior-sde in status.md
  → Senior SDE reads the mismatch
  → decides: was the spec wrong, or did Backend implement incorrectly?
    → If spec was wrong:
        - adds corrected task to backend-tasks.md
        - writes RESOLVED to frontend/questions.md
    → If backend implemented incorrectly:
        - writes CHANGES REQUESTED to review-feedback.md targeting the BE task
        - writes RESOLVED to frontend/questions.md with "wait for backend fix"
  → Updates status.md with coordination action
  → Frontend Dev resumes once backend fix is confirmed
```

Frontend Dev never contacts Backend Dev directly. All cross-dev coordination is Senior SDE's job.

---

## status.md as Two-Part Dashboard

`status.md` has a strict two-part structure:

**Part 1 — Current Cycle State table** (top of file, updated in-place by each agent):
```markdown
| Agent | Status | Last Updated |
|---|---|---|
| PM | DONE → senior-sde | 2026-04-23 |
| Senior SDE | IN PROGRESS | 2026-04-24 |
| Backend Dev | WAITING | 2026-04-24 |
| Frontend Dev | WAITING | — |
```

**Part 2 — Status Log** (append-only below the table):
```markdown
## SENIOR SDE | 2026-04-24 | DONE → backend + frontend
- tech-design.md: FastAPI + Neon PostgreSQL + Next.js
- backend-tasks.md: 10 tasks (BE-01 through BE-10)
- frontend-tasks.md: 12 tasks (FE-01 through FE-12)
- README.md: updated
```

The table gives an instant snapshot. The log is the full audit trail — MASTER uses dated log entries to detect agents that have gone silent.

**Status vocabulary:**

| Value | Meaning |
|---|---|
| `NOT STARTED` | Agent has never been activated this cycle |
| `IN PROGRESS` | Agent is actively working |
| `WAITING` | Agent activated but inbox is empty — tasks not written yet |
| `DONE → [agent]` | Work complete, named agent picks up |
| `BLOCKED → [agent]` | Waiting on named agent to unblock |
| `NEEDS REVIEW → senior-sde` | Dev submitted work for review |
| `CHANGES REQUESTED → [agent]` | Review done, named agent must revise |
| `APPROVED` | Senior SDE signed off, work is shippable |

---

## MCP Integration

MCPs give agents capabilities beyond reading/writing files. They can interact with real infrastructure directly from the chat window.

| MCP | Used by | How |
|---|---|---|
| **Neon** | Backend Dev | Run queries against real PostgreSQL to verify schema before committing migration files |
| **Vercel** | Frontend Dev | Deploy via `mcp__claude_ai_Vercel__deploy_to_vercel` — no manual deploy scripts |
| **GitHub** | Senior SDE + ED | Create PRs after review approval; one PR per feature |
| **Context7** | Backend Dev, Frontend Dev | Fetch current library docs (FastAPI, Next.js, SQLAlchemy) — prevents outdated API usage |
| **WebSearch** | PM, Senior SDE | Research feasibility, check NASA API docs, find implementation references |
| **Gmail / Calendar** | ED (MASTER window) | Send briefing digests, schedule automated runs |

---

## How This Relates to Production Agent Frameworks

| Concept | This system | LangChain / AutoGen equivalent |
|---|---|---|
| Agent identity | AGENT.md file | System prompt / agent config |
| Message passing | Markdown files | Message queue / shared memory |
| State persistence | impl-log.md, status.md | Vector store / database |
| Blocker queue | questions.md (OPEN/RESOLVED) | Interrupt handling / callback |
| Orchestrator | MASTER window (human-in-loop) | Central controller agent |
| Boot/activation | Paste Boot Message | Agent instantiation |
| Tool use | MCPs (Neon, Vercel, GitHub) | LangChain tools / function calling |
| Observability | status.md table + log + CHANGELOG | Logging / tracing |
| Handoff | Status vocabulary + table update | Message routing |

**Key architectural difference:** Production frameworks favor automation — agents spawn sub-agents, route messages programmatically. This system favors human control. The ED decides when to activate each agent. This is slower for fully autonomous tasks but much safer when agents touch production systems, cost money (GPT-4o calls, Vercel deploys), or require judgment calls.

---

## Design Decisions and Tradeoffs

**Why markdown files instead of a database?**
Files are readable in the IDE, diffable in git, and require zero infrastructure. An agent reads and writes them with the same tools it uses for code. Tradeoff: no querying — you read the whole file. Acceptable at project scale.

**Why no automated triggers?**
Automation between agents requires a polling loop or file watcher — infrastructure and failure modes. Manual activation is slower but reliable and transparent. The MASTER window makes activation decisions fast enough that the latency cost is low.

**Why separate AGENT.md from workspace files?**
AGENT.md files define role identity — stable across the project lifecycle. Workspace files accumulate project state — dynamic and project-specific. Separating them means agent identity files are fully reusable: copy to a new project, clear workspace files, update boot messages with new stack name.

**Why the decision scope tables?**
LLMs are prone to role drift — a Backend Dev given enough context will start making architecture decisions. Explicit "you do NOT decide" tables act as guardrails baked into the identity file. They also make it clear to the ED when an agent is acting outside its scope.

**Why RESOLVED inline in questions.md?**
Without a RESOLVED format, devs have no signal that their blocker was addressed. Appending in-place keeps question and answer co-located — the dev sees full context when they re-boot. No cross-referencing required.

**Why the two-part status.md structure?**
The table gives the MASTER window an O(1) snapshot without reading the full log. The append-only log provides the full audit trail and allows MASTER to detect silent agents by checking whether there are recent dated entries. Agents that only appended to the log (old design) left the table stale — both parts are now required on every handoff.

**Why did code review initially miss source files?**
First iteration: Senior SDE was told to read impl-log only. Code review from summaries is too shallow — it misses logic errors, security issues, and edge cases that only appear in actual code. Fixed by requiring Senior SDE to read the source files listed in impl-log's "Files changed" field, and by adding a "Files reviewed" field to the review format.

---

## Interview Talking Points

**"What is this project?"**
A file-based multi-agent orchestration system for software development. Each LLM session acts as a specialized role — PM, Tech Lead, Backend Dev, Frontend Dev. They communicate by reading and writing markdown files. No automation framework, no servers — just well-structured files and clear protocols.

**"Why build this instead of using LangChain or AutoGen?"**
Those frameworks are optimized for fully autonomous agents. This system is optimized for human-in-the-loop workflows where the human (ED) wants final say on when work proceeds. It's also zero infrastructure — runs entirely in Claude Code chat windows with MCP integrations already available.

**"What's the hardest coordination problem you solved?"**
The 3-way API mismatch: when Frontend Dev finds the backend API doesn't match the spec, who has the authority to resolve it? Neither dev agent can instruct the other — that would bypass the authority hierarchy. Senior SDE is the coordination point: they read the mismatch, determine fault (spec wrong vs. impl wrong), and write to both agents' files. The protocol makes this explicit rather than leaving it undefined.

**"How did you validate the system before using it?"**
Ran a mock simulation: 10 verification checks per agent per step in the work cycle, checking for gaps in protocol coverage. First run found 11 failures — including no RESOLVED format (devs couldn't tell when unblocked), status table going stale (agents appended to log but never updated the table), code review based only on log summaries, and no back-channel between PM and Senior SDE. Fixed all 11 and re-ran to confirm 50/50 pass.

**"How does this scale?"**
Adding a new agent (QA Agent, DevOps Agent) is adding one AGENT.md, one workspace folder, and one row in the status table. The MASTER window and status board work for any number of agents. The constraint is ED bandwidth — more windows to manage. The system compensates by making each activation decision fast (30 seconds to boot, MASTER tells you exactly who to activate next).

**"What would you automate if you had more time?"**
File watching on questions.md to push a notification to the MASTER window when a new OPEN blocker appears. CHANGELOG generation from impl-logs via a script. A lightweight web UI rendering status.md as a Kanban board. Possibly a scheduled task (via Claude Scheduled Tasks MCP) to auto-boot Senior SDE when devs signal NEEDS REVIEW.

---

## Quickstart for a New Project

1. Copy `docs/agents/` folder (all 5 AGENT.md files) into the new project
2. Create all workspace files using the scaffold in `docs/project_starter.md`
3. Update Boot Messages with new project name and stack
4. Open MASTER window, paste Boot Message from `docs/agents/MASTER.md`
5. Describe project idea → MASTER drafts PM directive
6. Paste PM directive into new PM window → PM writes PRD
7. PM signals `DONE → senior-sde` → boot Senior SDE window
8. Cycle proceeds
