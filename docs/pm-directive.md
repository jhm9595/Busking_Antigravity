# PM Directive

This file is the current execution directive from `Atlas PM`.
Every agent must read this file after `git pull` and before starting new work.
If this file changed, treat it as the latest priority and routing source.

## Current Priority

1. Restore build stability.
2. Validate live chat and QA-critical flows.
3. Review i18n and UX consistency.

## Active Owner

- `Forge Dev`

## Current Assignments

### Forge Dev

- Fix the current build blocker first.
- Reproduce with `npm run build`.
- Remove or replace the external Google font dependency in `src/app/layout.tsx`.
- Leave a handoff with files touched, commands run, and final build status.

### Scout QA

- After the build blocker is addressed, validate singer and audience flows.
- Focus on chat state sync, duplicate join behavior, donation/system messages, and i18n visibility.
- Report only confirmed findings with repro steps, expected result, actual result, and affected files.

### Pixel Design

- Review live, chat, and dashboard UI for hardcoded strings, language gaps, and UX inconsistencies.
- Leave implementation-ready design notes tied to affected screens and components.

## Required Handoff Rule

- Every handoff must name exactly one next owner.
- If work is blocked, state the blocker explicitly and return ownership to `Atlas PM`.
- If `Scout QA` finds a confirmed bug, the handoff must return ownership to `Atlas PM` first.
- `Atlas PM` decides whether the next owner becomes `Forge Dev`, `Pixel Design`, or `Scout QA`.

## Next Review Point

- `Atlas PM` reviews again after `Forge Dev` submits the next build-status handoff.
