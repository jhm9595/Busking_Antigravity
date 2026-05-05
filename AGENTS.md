# Agent Rules

This file is the first document every AI agent must read before doing work in this repository.

## Reading Order

1. Read this file.
2. Read `README.md` for project context and commands.
3. Read `docs/pm-directive.md` for the current assignment.
4. For QA or handoff work, also read `docs/qa-checklist.md` and `docs/handoff-template.md`.

## Hard Rules

- Do not overwrite unrelated local changes. Check `git status --short --branch` before editing.
- Do not treat the shared root checkout as a scratch workspace. Use a role or task branch/worktree for active implementation unless the user explicitly assigns the root checkout.
- Do not commit secrets, `.env` files, credentials, tokens, webhook values, logs, generated reports, screenshots, or temporary files.
- Do not create new Markdown reports or handoff files unless explicitly requested. Use `docs/handoff-template.md` instead.
- Keep changes scoped to the assigned task. Do not perform opportunistic refactors.
- Never delete or weaken failing tests to make verification pass.
- Never use destructive git commands or rewrite history unless explicitly requested.

## Work Protocol

1. Confirm the objective, owner, and non-goals from `docs/pm-directive.md`.
2. Inspect relevant files before making claims or edits.
3. Prefer the smallest correct change that satisfies the task.
4. Use tests first when practical; otherwise identify the closest regression check before editing.
5. After edits, run targeted diagnostics/tests, then broader build or lint when applicable.
6. If a check is skipped, record the exact reason in the handoff.

## Required Final Handoff

Every completion report must include:

- Changed files
- Commands run and results
- Checks skipped with reasons
- Remaining risks or blockers
- Next owner

## Agent Roles

- `Atlas`: PM, implementation, integration, final routing.
- `Codex App`: design concepts, visual variants, design-to-code handoff only.
- `Antigravity`: live-site QA, regression checks, repro steps, release-readiness notes.

`Atlas` decides the next owner when a task is blocked or when agents disagree.