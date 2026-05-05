# minimic Documentation

> **SINGLE SOURCE OF TRUTH** for this project.
> Any AI (Sisyphus, Claude, GPT, etc.) or human must read this file FIRST before doing any work.

---

## MANDATORY READING ORDER (Do not skip)

1. **THIS FILE** (`docs/README.md`) - Rules, policy, what NOT to touch
2. **[docs/charter.md](./charter.md)** - What this project is, scope, constraints
3. **[docs/conventions.md](./conventions.md)** - Coding standards, naming, patterns (MUST FOLLOW)
4. **[docs/architecture.md](./architecture.md)** - Tech stack, folder map, known issues
5. **[docs/features.md](./features.md)** - Screen-by-screen features, user roles, permissions (Korean)
6. **[docs/tasks.md](./tasks.md)** - What to do next (respect LOCKED items)

**Rule**: If you haven't read all 6 files above, do not start any work.

---

## Structure

| File | Purpose | When to Read |
|------|---------|---------------|
| [README.md](./README.md) | Rules, reading order, what NOT to touch | **FIRST** |
| [charter.md](./charter.md) | Project definition, scope, constraints | Before any work |
| [conventions.md](./conventions.md) | Coding standards, naming, patterns | Before writing code |
| [architecture.md](./architecture.md) | Tech stack, folder map, known issues | Before modifying structure |
| [features.md](./features.md) | Screen features, user roles, permissions (Korean) | For guides, promo videos |
| [tasks.md](./tasks.md) | Ordered task list with LOCKED markers | To decide what to do next |

---

## Policy (NON-NEGOTIABLE)

### 1. NEVER Touch LOCKED or done Items
- Items marked `done` or `LOCKED` in `tasks.md` are **OFF-LIMITS**.
- If you think a completed feature needs "improvement", **ask first**, don't just change it.
- Stale docs are worse than missing docs - delete them, don't "fix" completed work.

### 2. Single Task Focus
- Work on **ONE** `pending` or `in_progress` item at a time.
- Mark it `in_progress` before starting, `done` after completing.
- Update `tasks.md` immediately after finishing (don't batch updates).

### 3. No Multi-Agent Concepts
- No "waves", "agent profiles", "oracle/deep/quick categories" in docs or commits.
- This is a single-AI project. Multi-agent jargon creates confusion.

### 4. Conventions MUST Be Followed
- Read `docs/conventions.md` before writing any code.
- File naming, import order, TypeScript rules - all defined there.
- If unsure about a pattern, check `src/components/` or `src/app/` for examples.

### 5. Writing Rules
- Every doc is under `docs/`. Root `README.md` is only for humans cloning the repo.
- Be concise. If a section doesn't help the AI/human do the next task, cut it.
- Delete outdated sections immediately.

---

## What NOT to Touch (Completed Work Protection)

**ALREADY COMPLETED** - Do NOT modify unless explicitly asked:

1. **Documentation Restructuring** (`docs/README.md`, `charter.md`, `architecture.md`, `tasks.md`, `conventions.md`)
   - Status: LOCKED (commit `a1e3008`)
   - Reason: Single-AI documentation structure is set

2. **Root README.md** - Quick start and docs links (commit `a1e3008`)
   - Status: LOCKED
   - Reason: Entry point for humans cloning the repo

**If you think something needs changing:**
1. Read `docs/tasks.md` to see if it's already planned
2. If not planned, ask the user first
3. Never silently "improve" completed work

---

## Task Management Rules

- `tasks.md` is the **ONLY** task board.
- **LOCKED** items = Do NOT touch, do NOT "refactor", do NOT "improve"
- **done** items = Completed, keep for context, do NOT modify
- **pending** items = Available to work on
- **in_progress** items = Currently being worked on (only ONE at a time)
- **blocked** items = Waiting on dependency, includes why and what unblocks it

---

## Architecture Notes

- Keep `architecture.md` up to date when adding new services, folders, or patterns.
- When adding a new feature, update `architecture.md` > "Known Issues to Address" section.
- Remove completed items from "Known Issues" immediately.

---

## Emergency Stop

If you find yourself about to:
- "Refactor" a completed feature because "it could be better"
- Change file naming conventions mid-project
- Add a new library "just because"
- Modify a `LOCKED` or `done` item

**STOP. Read this file again. Ask the user.**
