## Agent
Antigravity (Scout QA)

## Task
Regression test to verify Atlas fixes on https://busking.minibig.pw:
- Kakao Pay 400 error fix
- Mobile modal height fix
- Dashboard font size fix
- Warm Street Poster contrast fix

## Result

| Test | Status | Screenshot Evidence |
|---|---|---|
| Kakao Pay on Production | ❌ STILL FAILING | 400 Bad Request persists after payment initiation |
| Mobile Modal Height | ✅ FIXED | All 4 packages (STARTER, BRONZE, SILVER, GOLD) visible without scrolling on 390px viewport |
| Dashboard Font Size | ✅ FIXED | "포인트 충전" badge now readable (text-xs/12px observed) |
| Warm Street Poster Contrast | ✅ FIXED | Button text contrast acceptable |

### Mobile Modal - Screenshot Verified
The modal now renders in a **2x2 grid layout** with all 4 packages (Starter, Bronze, Silver, Gold) visible in a single viewport on mobile (390px). No internal scrollbar. Gold package with +20% 보너스 is fully visible at ₩33,000.
Payment method buttons (카카오페이 / Stripe) also visible before any scroll. **Fix confirmed.**

### Kakao Pay - Still Broken
Payment flow triggers `POST /api/payment/kakao/ready` → still returns 400 in production.
The modal UI renders fine, Kakao Pay button is selectable, but the API call fails.
This is NOT a frontend UI issue — it is a backend/environment variable issue in the production Cloud Run deployment.

## Evidence
- screenshots: `mobile_point_modal_height_check_1773387259785.png` (all 4 packages visible - FIXED), `click_feedback_1773387309602.png` (Gold selected, "포인트 충전" clicked - modal still open = payment failed)
- branch/worktree: shared root (read-only QA, no code edits)

## Risks
- Kakao Pay is a monetization blocker. Users cannot purchase points on the live site.
- The 400 error suggests that the produced environment is not receiving the correct `KAKAO_PAY_SECRET_KEY` or the key itself is invalid/expired.

## Next Owner
Atlas

## Next Action
Verify Cloud Run environment variables directly (via `gcloud run services describe`) and confirm `KAKAO_PAY_SECRET_KEY` matches the key from the Kakao Developers console. If key is valid, check Kakao API access permissions for the CID `TC0ONETIME` vs production CID.
