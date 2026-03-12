# PM Directive

This file is the current execution directive from `Atlas PM`.
Every agent must read this file after `git pull` and before starting new work.
If this file changed, treat it as the latest priority and routing source.

## Operating Mode

- The shared root checkout is a coordination view only.
- Active implementation, QA artifact generation, and design-file edits must happen in role-specific branches and role-specific git worktrees.
- Before starting work, each agent must confirm `git status --short --branch` and verify the branch/worktree matches the assigned role.
- `Atlas PM` owns updates to shared coordination docs in the root checkout unless explicitly delegated.
- If the current checkout contains unrelated local changes, stop and route the conflict to `Atlas PM` before continuing.

## Current Priority

1. Validate live chat and payment flows (Scout QA).
2. Review final UI for i18n and UX consistency (Pixel Design).
3. Set up production payment secrets (Atlas PM).

## Active Owner

- `Scout QA`

## Current Assignments

### Forge Dev (Completed)

- ✅ Fixed build blocker (removed external Google font dependency).
- ✅ Updated singer live remaining-time display to `HH:MM:SS`.
- ✅ Fixed audience donation surfacing (realtime author identification & i18n rendering).
- ✅ Implemented direct Kakao Pay API (Ready/Approve flow).

### Scout QA

- Validate singer and audience flows.
- Confirm singer live remaining time shows `HH:MM:SS` for sub-hour and multi-hour cases.
- Confirm audience donation produces the expected chat entry exactly once.
- Test the new Kakao Pay flow (using test CID `TC0ONETIME`).
- Focus on chat state sync, duplicate join behavior, and i18n visibility.

### Pixel Design

- Final review of live, chat, and dashboard UI for any remaining hardcoded strings or UX gaps.
- The UI has been heavily refactored for i18n across 5 locales; confirm visual integrity.

### Atlas PM (Action Required)

- Forge Dev has completed the assigned technical priorities.
- **Payment Setup**: To enable production payments, please add `KAKAO_PAY_ADMIN_KEY` to GitHub Secrets.
- Review the automated build status and handoff logs.

## Required Handoff Rule

- Every handoff must name exactly one next owner.
- If work is blocked, state the blocker explicitly and return ownership to `Atlas PM`.
- If `Scout QA` finds a confirmed bug, the handoff must return ownership to `Atlas PM` first.
- `Atlas PM` decides whether the next owner becomes `Forge Dev`, `Pixel Design`, or `Scout QA`.

## Next Review Point

- `Atlas PM` reviews again after `Forge Dev` submits the next build and live-chat handoff.
