## Agent
Antigravity (Scout QA)

## Task
Full production QA sweep per `docs/QA-TEST-CHECKLIST.md`.
Site: https://busking.minibig.pw

## Result

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Theme Switcher (desktop) | ✅ PASS | Dropdown opens correctly, all themes selectable (screenshot: theme menu open with Neo-Brutalism visible). Theme persists after reload. |
| 2 | Theme Switcher (mobile) | ✅ PASS | Atlas fix confirmed. Toggle button opens menu at 390px via JS click. Previously broken - now working. |
| 3 | HTML lang attribute | ✅ PASS | `document.documentElement.lang` correctly changes between `ko` and `en` on language switch. |
| 4 | Kakao Pay on Production | ❌ FAIL | `POST /api/payment/kakao/ready` returns **400 Bad Request**. Error: "Kakao Pay preparation failed". The payment flow is broken on production. |
| 5 | Mobile Point Charge Modal | ❌ FAIL | Modal still has internal scrollbar on mobile (390px). The "Gold" package is hidden below the fold. User must scroll inside the modal to see all options. (screenshot confirms). |
| 6 | Button Debouncing (Singer Dashboard) | ❌ FAIL | "공연 모드 시작" button does not visually disable or show a loading state on click. Double-submit risk confirmed. Screenshot shows the button UI - "포인트 충전" badge also displays as tiny, cut-off text on the mobile dashboard card. |

## Evidence
- screenshots: `click_feedback_1773376331451.png` (theme dropdown), `click_feedback_1773376445223.png` (kakao pay modal before failure), `click_feedback_1773376469270.png` (singer dashboard mobile - crowded)
- commands: browser_subagent QA sweep on production
- branch/worktree: shared root checkout (read-only, no code edits)

## Risks
- Kakao Pay broken on production: users cannot charge points at all.
- Mobile modal UX still degraded post-fix: bottom package options hidden.
- Button debouncing absent: potential double-submission on "Start Performance".

## Next Owner
Atlas

## Next Action
1. Investigate why `KAKAO_PAY_SECRET_KEY` is not being applied in production (400 vs 500 suggests key exists but auth handshake fails with Kakao).
2. Fix Point Charge Modal height for mobile (use bottom sheet / `max-h-screen overflow-y-auto` with proper padding).
3. Add loading state & `disabled` to "공연 모드 시작" button during async action.
