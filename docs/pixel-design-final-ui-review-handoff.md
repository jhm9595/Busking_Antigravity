## Agent
Pixel Design

## Task
Perform the final visual review of the recently refactored live, chat, profile, map, and dashboard-adjacent audience surfaces for remaining i18n leaks and UX gaps.

## Result
Reviewed the latest implementation after the UX/i18n refactor and found four remaining UI issues that still block a clean Pixel Design signoff.

1. Singer profile live-entry logic currently conflicts with the approved profile design.
- File: `src/app/singer/[id]/page.tsx`
- The page now auto-redirects to `/live/{id}` when any performance is live at lines 58-63.
- The same file still contains a fully designed live-entry module at lines 288-339.
- Resulting UX problem: the designed singer-profile live-entry module is effectively unreachable, so users never experience the intended “profile first, then enter live” visual moment. This creates a product-direction conflict between PM’s routing note and the Pixel Design brief.
- Required decision: either keep auto-redirect and remove the unreachable profile live module, or keep the profile live module and stop redirecting instantly. Do not ship both behaviors together.

2. Explore map still exposes hardcoded English copy in primary audience UI.
- File: `src/components/audience/BuskingMap.tsx`
- Remaining strings:
  - `Loading Map...` at lines 141 and similar loading copy elsewhere
  - `You are Here` at line 163
  - `Live Now` at line 187
  - `View Artist` at line 200
  - `Explore Filter` at line 224
  - `Followed Only` at line 248
  - `Distance Radius` at line 265
  - `All` and `50km` labels at lines 266-279
  - `Click ... to enable filtering` at line 284
- Design impact: this route is one of the main audience entry points, so mixed-language map chrome makes the product feel unfinished immediately.
- Required fix: move all map popup and filter-panel copy to locale keys before signoff.

3. Audience live still contains staging/debug language and an English fallback identity.
- File: `src/app/live/[id]/page.tsx`
- Remaining issues:
  - `Charge (TEST)` still appears at line 239.
  - `username={username || 'Guest'}` still appears at line 295.
  - song-request failure still throws raw English `Request failed` earlier in the file.
- Design impact: this route now has stronger setlist hierarchy, but the remaining staging language breaks trust at the exact moment users are asked to pay or join chat.
- Required fix:
  - remove `(TEST)` from the live payment CTA
  - replace raw `Guest` sentinel handling with a localized anonymous/default identity flow
  - remove raw English error fallbacks from audience-facing interaction paths

4. Donation chat card still contains broken decorative text treatment.
- File: `src/components/chat/ChatBox.tsx`
- The donation banner at lines 209-216 still renders corrupted decorative glyphs and relies on brittle fallback parsing for donor naming.
- Design impact: donation is now a premium event visually, but the broken glyph treatment makes the message feel unstable and undermines the monetization moment.
- Required fix:
  - remove corrupted glyph decorations entirely
  - use a stable donor-name source instead of message-string parsing
  - keep one clean premium event style only once in the feed

Secondary note:
- `src/app/singer/[id]/page.tsx` still places follow/booking actions before the live-entry module at lines 260-285.
- If the team decides to keep the profile live-entry model instead of auto-redirect, this order should be reversed so live entry becomes the dominant action during an active performance.

Pixel Design acceptance criteria before signoff:
- No primary audience-facing route should expose hardcoded English in map/live/profile chrome.
- No payment or chat entry surface should expose `(TEST)`, `Guest`, or similar staging language.
- Donation and request event cards should feel production-grade and text-stable in every locale.
- Singer-profile live behavior must be singular and intentional: either direct redirect or profile entry module, not both.

## Evidence
- files:
  - `src/app/singer/[id]/page.tsx`
  - `src/app/live/[id]/page.tsx`
  - `src/components/audience/BuskingMap.tsx`
  - `src/components/chat/ChatBox.tsx`
  - `src/locales/en.ts`
  - `src/locales/ja.ts`
  - `src/locales/ko.ts`
  - `src/locales/zh-tw.ts`
  - `src/locales/zh.ts`
- commands:
  - `git status --short --branch`
  - `Get-Content` on touched audience/live/profile/chat files
  - `Select-String` search for `(TEST)`, `Guest`, `Anonymous`, and hardcoded English map labels
- logs:
  - review only; no runtime changes or browser captures performed in this pass

## Risks
- If the redirect-vs-profile-live decision is not resolved explicitly, future UI polish work on the singer profile will continue to be wasted on a route users never see while live.
- If map and live surfaces keep English copy while other routes are localized, the app will still feel partially translated despite the larger i18n refactor landing successfully.

## Next Owner
Atlas PM

## Next Action
Resolve the singer-profile live routing direction and route the remaining map/live/chat polish items to `Forge Dev` as the final implementation pass before QA signoff.
