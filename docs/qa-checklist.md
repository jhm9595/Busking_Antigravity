# QA Checklist

Use this checklist for regression and release-readiness checks. Keep evidence concise and reproducible.

## Before QA

- Confirm branch/worktree with `git status --short --branch`.
- Confirm the assignment in `docs/pm-directive.md`.
- Identify the changed files and affected routes.
- Verify no secrets, temp files, logs, screenshots, or generated reports are staged.

## Standard Verification

Run the narrowest relevant checks first, then widen if the change is user-facing or risky.

```bash
npm run lint
npm run build
```

For database or Prisma changes:

```bash
npx prisma generate
```

For browser-visible changes, perform manual QA on desktop and mobile widths.

## Core Regression Areas

### Explore

- Map loads without console errors.
- Live, scheduled, and all filters work.
- Map/list view switching works.
- Following-only behavior works for authenticated users.
- Mobile header controls are reachable and do not overflow.

### Live Performance

- Setlist state updates correctly.
- Chat opens only when enabled.
- Song requests can be submitted and reflected.
- Sponsorship and rewarded-ad paths do not block the live experience.

### Singer Dashboard

- Performance start/end controls debounce repeated clicks.
- Schedule creation uses the selected map location.
- Setlist and repertoire management remain usable on mobile.
- QR/profile surfaces render correctly.

### Payments

- Kakao Pay initialization reaches the approval URL.
- Success, cancel, and failure redirects behave correctly.
- Points update only after confirmed approval.

### Themes And I18n

- Theme switcher works on click/tap.
- Text remains readable across themes.
- Selected language updates visible copy and `html lang`.

## Handoff Evidence

Record:

- Environment and URL tested
- Browser/device or viewport
- Commands run
- Pass/fail result
- Screenshots only if explicitly requested or needed for a bug report
- Repro steps for every confirmed bug