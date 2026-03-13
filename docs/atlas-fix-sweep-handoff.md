## Agent
Atlas

## Task
Address urgent bugs and i18n gaps identified in `docs/scout-qa-3viewport-handoff.md` and `docs/scout-qa-regression2-handoff.md`.

## Result
1. **Singer Profile 404:** Updated `src/app/api/singers/[id]/route.ts` to support lookup by `stageName` and `nickname` (slugs). Users can now access profiles via activity names.
2. **Kakao Pay 400 Error:** Enhanced `ready` and `approve` routes to handle both Legacy (Admin Key) and Open API (Secret Key). Dynamically switches URLs and headers based on key format.
3. **Explore Filter i18n:** Added `explore` locale section to all language files and implemented `useLanguage` in `BuskingMap.tsx`.
4. **Ad Placement Cleanup:** Removed raw `Slot ID` debug text from `GoogleAd.tsx`.
5. **Brand Alignment:** Ensured the brand name is consistently `miniMic` across `AppHeader.tsx` and all locale files (updated from `BuskerKing`). Confirmed with the user that `miniMic` is the intentional brand name.
6. **Theme Contrast:** Added `--color-primary-foreground` to all themes in `globals.css`. Fixed low contrast on `warm-sunset` buttons (now dark text on orange).

## Evidence
- files: 
    - `src/app/api/singers/[id]/route.ts`
    - `src/app/api/payment/kakao/ready/route.ts`
    - `src/app/api/payment/kakao/approve/route.ts`
    - `src/locales/*.ts`
    - `src/components/audience/BuskingMap.tsx`
    - `src/components/common/GoogleAd.tsx`
    - `src/components/common/AppHeader.tsx`
    - `src/app/globals.css`
- commands: `npm run lint` (verified files are clean of critical errors)
- branch/worktree: `main` (Shared root checkout as these were urgent hotfixes for QA reported issues)

## Risks
- **Kakao Pay:** Still depends on correct environment variables (`KAKAO_PAY_SECRET_KEY` vs `KAKAO_PAY_ADMIN_KEY`) being set in Cloud Run.
- **Map Filter:** Geolocation behavior needs live site testing to ensure `t()` splits and icon rendering are robust.

## Next Owner
Antigravity

## Next Action
Full QA sweep on the live site to verify:
1. Singer slugs (e.g., `/singer/형민부개`) resolve correctly.
2. Kakao Pay works with the appropriate key type.
3. Explore filter labels are translated in all languages.
4. Button contrast in Warm Sunset theme is acceptable.
