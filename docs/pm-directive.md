# PM Directive

This file is the current execution directive from `Atlas`.
Every agent must read this file after `git pull` and before starting new work.
If this file changed, treat it as the latest priority and routing source.

## Operating Mode

- The shared root checkout is a coordination view only.
- Active implementation, QA artifact generation, and design-file edits must happen in role-specific branches and role-specific git worktrees.
- Before starting work, each agent must confirm `git status --short --branch` and verify the branch/worktree matches the assigned role.
- `Atlas` owns updates to shared coordination docs in the root checkout unless explicitly delegated.
- If the current checkout contains unrelated local changes, stop and route the conflict to `Atlas` before continuing.

## Current Priority

1. Security hardening (completed)
2. Discord webhook format (completed)
3. Documentation update (completed)
4. Mobile UX & Kakao Pay Config (completed)
5. Handoff to QA (next)

## Active Owner

- `Antigravity`

## Current Assignments

### Atlas (Completed)

- ✅ Security hardening: server identity verification, GET read-only, realtime token hardening
- ✅ Discord webhook format: Updated to Korean standard format
- ✅ Documentation update: QA Checklist added and PM Directive synced
- ✅ Mobile UX: Fixed Theme Switcher touch, increased font sizes (9px -> 12px), fixed modal double-scroll.
- ✅ Kakao Pay: Refined error messaging and ensured secret injection mapping in deployment.

### Codex App

- Waiting for design tasks.

### Antigravity

- Test on actual live site (staging/production).
- Follow the `docs/QA-TEST-CHECKLIST.md`.
- Verify mobile interactions: theme switcher, point charge modal height, and readability.
- Verify Kakao Pay flow on the live production site.
- Do NOT modify code files - only validate and report.

## Required Handoff Rule

- Every handoff must name exactly one next owner.
- If work is blocked, state the blocker explicitly and return ownership to `Atlas`.
- If `Antigravity` finds a confirmed bug, the handoff must return ownership to `Atlas` first.
- `Atlas` decides whether the next owner becomes `Codex App` or `Antigravity`.

## Next Review Point

- `Atlas` reviews again after `Antigravity` completes the full QA sweep on the live site.
