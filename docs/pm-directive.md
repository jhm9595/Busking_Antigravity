# PM Directive

This is the live assignment source. Read it after `AGENTS.md` and before starting work.

## Current Owner

- `Atlas`

## Current Priority

Keep the repository safe for multi-agent work and prevent repeated AI mistakes by using the canonical documentation set:

1. `AGENTS.md`
2. `README.md`
3. `docs/pm-directive.md`
4. `docs/qa-checklist.md`
5. `docs/handoff-template.md`
6. `test-suite/README.md`

## Operating Rules

- Check `git status --short --branch` before editing.
- Stop and ask before overwriting unrelated local changes.
- Keep generated artifacts out of the shared root checkout.
- Do not expose or request secret values.
- Prefer GitHub, repository docs, workflow summaries, and PR comments over chat memory.

## Acceptance Criteria

A task is complete only when:

- The requested behavior or document change is implemented.
- Relevant diagnostics, tests, build, or manual QA have been run.
- Skipped checks are explicitly justified.
- The handoff names the next owner.

## Next Owner Rule

- If implementation is complete, next owner is `Antigravity` for QA.
- If QA finds a confirmed bug, next owner returns to `Atlas`.
- If work is blocked, next owner is `Atlas` with the blocker stated clearly.