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
5. 8-Theme System & Ad Placements (completed)
6. Fix urgent QA blockers (completed)
7. Handoff to QA (next)

## Active Owner

- `Antigravity`

## Current Assignments

### Atlas (Completed)

- ✅ Security hardening: server identity verification, GET read-only, realtime token hardening
- ✅ Discord webhook format: Updated to Korean standard format
- ✅ Documentation update: QA Checklist added and PM Directive synced
- ✅ Mobile UX: Fixed Theme Switcher touch, increased font sizes (9px -> 12px), fixed modal double-scroll.
- ✅ Kakao Pay: Fixed 400 error by supporting both Legacy and Open API key formats and endpoints.
- ✅ 8-Theme System: Simplified to 4 robust themes; fixed "Warm Sunset" (Warm Street Poster) button contrast.
- ✅ Ad Placements: Removed raw "Slot ID" debug text from UI.
- ✅ Artist Profile: Fixed 404 error for slug-based routes (e.g., /singer/형민부개).
- ✅ Explore i18n: Applied Korean translations to Explore filter strings and map markers.

### Codex App (Completed by Atlas)

- ✅ Redesigned singer-profile live state ("Live Now" module).
- ✅ Integrated home navigation into headers.
- ✅ Placed song-request button in setlist header.

### Antigravity

- Test on actual live site (staging/production).
- Follow the `docs/QA-TEST-CHECKLIST.md`.
- Verify the 8 new themes for visual consistency.
- Verify ad placements are non-disruptive.
- Do NOT modify code files - only validate and report.

## Required Handoff Rule

- Every handoff must name exactly one next owner.
- If work is blocked, state the blocker explicitly and return ownership to `Atlas`.
- If `Antigravity` finds a confirmed bug, the handoff must return ownership to `Atlas` first.
- `Atlas` decides whether the next owner becomes `Codex App` or `Antigravity`.

## Next Review Point

- `Atlas` reviews again after `Antigravity` completes the full QA sweep on the live site.
