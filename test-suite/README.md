# Busking Antigravity Test Suite

This folder contains smoke and regression checks for API contracts, lifecycle read paths, and realtime authorization hardening.

## Core commands

Run these with the app stack running (`npm run dev`):

```bash
node test-suite/api-tester.js
node test-suite/chat-tester.js
powershell -ExecutionPolicy Bypass -File .\test-suite\one-click-test.ps1
npx playwright test tests/live-auth-smoke.spec.ts
```

## Smoke coverage

- `api-tester.js`
  - Verifies `/api/performances` now returns an array payload (not legacy `data.items`).
  - Verifies singer profile lookup shape from `/api/singers/:id`.
  - Verifies anonymous `POST /api/song-requests` is rejected with `401`.
- `chat-tester.js`
  - Verifies current socket events (`chat_status`, `load_history`, `receive_message`, `authorization_error`).
  - Verifies anonymous audience cannot call owner controls (`open_chat`, `chat_status_toggled`).
  - Verifies audience messages are blocked while chat is closed.
- `one-click-test.ps1` / `one-click-test.sh`
  - Runs API/chat smoke plus security/lifecycle/realtime regression suites from Tasks 1-4.
  - Writes aggregate machine-readable summary to `test-suite/results/one-click-smoke-summary.json`.

## Result artifacts

Smoke and regression scripts write JSON artifacts under `test-suite/results/`.
Key outputs include:

- `api-smoke.json`
- `chat-smoke.json`
- `one-click-smoke-summary.json`
