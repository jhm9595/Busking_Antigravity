# minimic Documentation

> Single-AI project (Sisyphus). All work is executed by one agent end-to-end.

## Structure

| File | Purpose |
|------|---------|
| [charter.md](./charter.md) | What this project is, scope, constraints |
| [architecture.md](./architecture.md) | Tech stack, folder map, key patterns |
| [tasks.md](./tasks.md) | Ordered task list (what to do next) |

## Policy

### Writing Rules
- Every doc is under `docs/`. Root `README.md` is only for humans cloning the repo.
- No multi-agent concepts: no "waves", "agent profiles", "oracle/deep/quick categories".
- Be concise. If a section doesn't help the AI do the next task, cut it.
- Update `tasks.md` after completing each item. Keep it the single source of truth for "what's next".

### Task Management
- `tasks.md` is the only task board. Update it in real-time as work progresses.
- Completed items stay in the file (marked `done`) for context continuity.
- Blocked items include why they're blocked and what unblocks them.

### Architecture Notes
- Keep `architecture.md` up to date when adding new services, folders, or patterns.
- Delete outdated sections; stale docs are worse than missing docs.
