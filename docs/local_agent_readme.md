# Local Agent System — Operator README

Your day-to-day guide to running the multi-agent workflow. This is the how-to, not the why. For architecture and interview context see [local_agent_project.md](local_agent_project.md). For scaffolding a new project see [project_starter.md](project_starter.md).

---

## The 5 Windows at a Glance

| Window | Boot message in | Open when | Never use it to |
|---|---|---|---|
| **MASTER** | `docs/agents/MASTER.md` | Start of every session — get your bearings | Write code, assign tasks |
| **PM** | `docs/agents/PM.md` | New feature cycle begins, or scope needs revision | Make tech decisions |
| **Senior SDE** | `docs/agents/SENIOR_SDE.md` | PRD is ready, devs are blocked, code needs review | Implement features |
| **Backend Dev** | `docs/agents/BACKEND.md` | Backend tasks are written and ready | Change architecture |
| **Frontend Dev** | `docs/agents/FRONTEND.md` | Frontend tasks are written and ready | Contact Backend Dev directly |

**Rule of thumb:** If you don't know which window to open, open MASTER first.

---

## Starting a Session

Every session starts the same way regardless of where you left off:

1. Open MASTER window (or use the existing one if still active)
2. Ask: *"What's the current state of the project?"*
3. MASTER reads `docs/status.md` and gives you a dashboard
4. Act on what it tells you

That's it. MASTER tells you who is up, who is blocked, and what should happen next.

---

## Quick Reference — Common Scenarios

### "I want to start a new feature cycle"
1. MASTER → describe the feature idea → get a PM directive
2. PM window → paste directive → PM updates `docs/pm/prd.md` and `docs/pm/decisions.md`
3. PM signals `DONE → senior-sde` in `docs/status.md`
4. Senior SDE window → reads PRD → writes tech-design + tasks
5. Senior SDE signals `DONE → backend + frontend`
6. Open Backend Dev and Frontend Dev windows

### "I'm picking up after a break"
1. MASTER window → *"What's the current state?"*
2. Read the dashboard — one of three situations:
   - Agent signalled `DONE → [next]` → boot that agent
   - Agent signalled `BLOCKED → senior-sde` → boot Senior SDE
   - Agent signalled `NEEDS REVIEW` → boot Senior SDE

### "A dev agent is blocked"
1. Dev has written an `OPEN` entry in their `questions.md`
2. Dev has written `BLOCKED → senior-sde` in `docs/status.md`
3. Boot Senior SDE → it reads questions.md on boot → appends `RESOLVED`
4. Senior SDE updates `docs/status.md` → dev knows to re-boot

### "Frontend found an API mismatch"
1. Frontend Dev writes OPEN entry in `docs/frontend/questions.md`
2. Frontend Dev writes `BLOCKED → senior-sde` in `docs/status.md`
3. Boot Senior SDE → reads the mismatch → decides who's wrong
4. Senior SDE either: adds a corrected task to backend-tasks.md, or adds a CHANGES REQUESTED to review-feedback.md
5. Senior SDE writes `RESOLVED` to frontend/questions.md
6. Frontend Dev re-boots → sees RESOLVED → resumes

### "Scope needs to change mid-cycle"
1. If you (ED) want to change scope → open PM window → describe the change → PM updates PRD
2. If Senior SDE flagged a technical infeasibility → Senior SDE wrote `BLOCKED → pm` in status.md → open PM window → PM reads it and revises scope
3. PM signals `DONE → senior-sde` when done → Senior SDE resumes

### "Code is ready for review"
1. Dev signalled `NEEDS REVIEW → senior-sde` in status.md
2. Boot Senior SDE → it reads impl-log + actual source files listed there
3. Senior SDE writes to `docs/senior-sde/review-feedback.md`
4. If APPROVED: Senior SDE updates CHANGELOG.md
5. If CHANGES REQUESTED: dev re-boots, reads review-feedback.md, fixes and re-submits

### "I want to pair-program with a dev agent"
1. Boot the relevant dev window (Backend or Frontend)
2. Agent reads its tasks and tells you which one it's picking up
3. Work through the task together — agent writes code, you review in real time
4. Agent logs completion to `impl-log.md` with exact file paths when done
5. Agent updates `docs/status.md`

---

## Reading status.md

`docs/status.md` has two parts. Check the table at the top first — it's your instant snapshot:

```
| Agent        | Status                    | Last Updated |
|--------------|---------------------------|--------------|
| PM           | DONE → senior-sde         | 2026-04-23   |  ← waiting for Senior SDE
| Senior SDE   | IN PROGRESS               | 2026-04-24   |  ← currently active
| Backend Dev  | WAITING                   | 2026-04-24   |  ← tasks not written yet
| Frontend Dev | NOT STARTED               | —            |  ← never activated
```

**Healthy state:** One agent is `IN PROGRESS` or `DONE →`, others are in a logical waiting state.

**Warning signs:**
- Two agents both `IN PROGRESS` — unusual; only valid if Backend and Frontend are working in parallel
- Any agent `BLOCKED` for more than one session with no RESOLVED entry — stuck, needs ED attention
- `WAITING` after Senior SDE is `DONE` — dev was activated but found empty inbox; Senior SDE didn't write tasks yet
- `IN PROGRESS` with a last-updated date more than a day old — agent may have stalled

---

## Your Role as ED

You are not a passive observer. You are the only one who can:

| ED action | When to do it |
|---|---|
| Activate an agent | When `status.md` shows a `DONE →` pointing to that agent |
| Unblock a PM ↔ Senior SDE disagreement | When you see `BLOCKED → pm` and PM can't resolve it alone |
| Override a scoping decision | Anytime — you have final authority |
| Approve shipping | After Senior SDE writes `APPROVED` in review-feedback |
| Adjust priorities | Paste a directive into the relevant agent window |
| Reset an agent | Clear its workspace files and re-boot |

**You should not:** Write code, assign individual tasks (that's Senior SDE), or resolve technical questions (that's Senior SDE).

---

## The ED Directive Pattern

When you want an agent to do something specific, use MASTER to draft it:

> *"Draft a directive telling Senior SDE to focus only on BE-01 through BE-03 this session and skip the frontend tasks for now."*

MASTER produces:
```
── DIRECTIVE FOR SENIOR SDE ───────────────────────────────
This session: focus only on BE-01, BE-02, BE-03.
Do not write frontend-tasks.md yet. Update status.md when done.
───────────────────────────────────────────────────────────
```

You paste this into the Senior SDE window as your first message. The agent reads it before its normal boot sequence.

---

## Agent Health Checks

Before trusting an agent's output, verify it did its job:

**PM is healthy if:**
- `docs/pm/prd.md` has user stories with acceptance criteria
- `docs/pm/decisions.md` has at least one entry
- Status shows `DONE → senior-sde` with a date

**Senior SDE is healthy if:**
- `docs/senior-sde/tech-design.md` is populated (not the "NOT STARTED" placeholder)
- `docs/senior-sde/backend-tasks.md` has tasks with the full spec format (What/Inputs/Output/Criteria/Dependencies/Notes)
- Both questions.md files have `RESOLVED` entries for any `OPEN` questions

**Backend/Frontend Dev is healthy if:**
- `docs/backend/impl-log.md` (or frontend) has entries with exact file paths
- Completed tasks match what was assigned in the task list
- No `OPEN` questions older than one session without a response

**Senior SDE review is healthy if:**
- `docs/senior-sde/review-feedback.md` lists actual source files read
- Review has all three sections: Approved, Must fix, Suggestions
- CHANGELOG.md was updated for any APPROVED tasks

---

## Pair Programming Tips

**Before starting a task with a dev agent:**
- Confirm it has read its task list — ask "which task are you picking up and why?"
- If it says "inbox is empty" or task list has NOT STARTED placeholder → stop, boot Senior SDE first

**During a task:**
- Let the agent drive implementation — don't overrule its code choices unless there's a bug
- If you disagree with an approach, ask "is there a reason you chose X over Y?" before redirecting
- The agent will flag spec ambiguities to questions.md — let it do so rather than making ad hoc decisions

**After a task:**
- Verify the impl-log entry has exact file paths (not just filenames)
- Check that status.md was updated (both table row and log entry)
- If tasks remain, the agent picks the next P0 automatically — no need to tell it

---

## Resetting an Agent

If an agent produced bad output or went off-track:

1. Clear its workspace files back to the placeholder state
2. Update `docs/status.md` table row to `NOT STARTED`
3. If it was Senior SDE: also reset `tech-design.md`, `backend-tasks.md`, `frontend-tasks.md`
4. Close the chat window
5. Re-boot from the AGENT.md boot message
6. If needed, paste an ED directive first to correct the course

Do not try to correct a badly-behaved agent in the same chat window — close it and start fresh. Agent files are stateless; the workspace files are the only state that matters.

---

## File Write Permissions Summary

A quick reference for which agent is allowed to write to which file. If you see an agent writing outside these boundaries, that's role drift.

| File | PM | Senior SDE | Backend Dev | Frontend Dev | MASTER/ED |
|---|---|---|---|---|---|
| `docs/pm/prd.md` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `docs/pm/decisions.md` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `docs/senior-sde/tech-design.md` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `docs/senior-sde/backend-tasks.md` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `docs/senior-sde/frontend-tasks.md` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `docs/senior-sde/review-feedback.md` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `docs/backend/impl-log.md` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `docs/backend/questions.md` | ❌ | ✅ (RESOLVED) | ✅ (OPEN) | ❌ | ❌ |
| `docs/frontend/impl-log.md` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `docs/frontend/questions.md` | ❌ | ✅ (RESOLVED) | ❌ | ✅ (OPEN) | ❌ |
| `docs/status.md` | ✅ | ✅ | ✅ | ✅ | read-only |
| `README.md` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `CHANGELOG.md` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `backend/README.md` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `frontend/README.md` | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Current Project State (AstroLens)

As of retiring the setup chat window:

| Agent | Status | Next action |
|---|---|---|
| PM | DONE — PRD v1.0 complete | No action needed |
| Senior SDE | NOT STARTED | **Boot this next** |
| Backend Dev | WAITING | Boot after Senior SDE writes tasks |
| Frontend Dev | WAITING | Boot after Senior SDE writes tasks |

**Your first move:** Open a new Claude chat window, paste the boot message from `docs/agents/SENIOR_SDE.md`, and let it read the PRD. It will write `tech-design.md`, `backend-tasks.md`, and `frontend-tasks.md` — then the devs are unblocked.
