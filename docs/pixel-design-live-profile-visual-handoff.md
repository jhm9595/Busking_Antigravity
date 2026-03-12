## Agent
Pixel Design

## Task
Backfill the missed `pixel-design-live-profile-visual-brief.md` review by leaving implementation-ready visual guidance for the audience singer-profile live state, audience live setlist action placement, and home-navigation treatment.

## Result
Reviewed the brief, PM routing note, and the current implementation on the affected audience routes. The earlier Pixel Design handoff covered `live/chat/dashboard` copy and i18n issues, but it did not close the visual-placement work requested for profile/live/navigation. This handoff fills that gap.

Approved placement decisions:

1. Singer profile live-entry module
- Route: [src/app/singer/[id]/page.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/[id]/page.tsx)
- Current issue: the live state is split between a tiny avatar badge at [src/app/singer/[id]/page.tsx#L194](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/[id]/page.tsx#L194) and a separate highlight card starting at [src/app/singer/[id]/page.tsx#L275](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/[id]/page.tsx#L275). That makes the live state feel secondary until the user scrolls past follow and booking actions.
- Approved direction: when at least one performance is live, the live-entry module becomes the first content block under the hero and before bio or booking/follow actions.
- Module order:
  1. compact `Live Now` eyebrow with pulse dot
  2. performance title
  3. one-line meta stack: date/time/location
  4. primary CTA: `Enter Live`
  5. optional secondary text link: `View full schedule`
- Visual weight rule: the CTA should be the strongest object in the module. The live status chip should support the CTA, not compete with it.

2. Performance title and meta placement on singer profile
- Route: [src/app/singer/[id]/page.tsx#L295](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/[id]/page.tsx#L295)
- Approved direction: performance title and core meta stay inside the same live-entry module, directly above the CTA. Do not split title above and metadata below the button.
- Meta hierarchy:
  - mobile: one vertical stack with date/time first and venue second
  - tablet/desktop: date, time, venue may sit in a horizontal row if all three remain readable without truncating the title
- Keep the title to two lines max on mobile. If venue is long, truncate venue first, not title.

3. Audience live setlist song-request placement
- Route: [src/app/live/[id]/page.tsx#L292](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L292)
- Current issue: song request lives in the fixed bottom action bar at [src/app/live/[id]/page.tsx#L348](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L348), which makes the live surface feel CTA-heavy and competes with sponsor/chat focus.
- Approved direction: move `Song Request` into the setlist section header, aligned to the upper-right of the section title/count.
- Header pattern:
  - left: setlist title + track count
  - right: one compact secondary button for `Song Request`
- Button style rule: outlined or tinted secondary treatment only. Do not make it visually stronger than sponsor or current-song emphasis.
- Bottom action bar rule: remove booking from live mode entirely. Keep sponsor as the only persistent monetization CTA. If a second fixed action is required, use a compact request button only on narrow mobile where header actions wrap poorly.

4. Audience live information hierarchy
- Route: [src/app/live/[id]/page.tsx#L262](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L262)
- Current issue: the top info card makes title and meta visually dominant before the setlist and chat, even though this route should feel like an in-session experience.
- Approved direction: reduce the top card to a lightweight session header.
- Keep:
  - singer identity
  - live/sync state
  - minimal location/time context if needed
- Demote or remove:
  - large underlined performance title block
  - oversized date/time/location card styling
- The detailed performance title/meta should do their main job on the singer profile, not here.

5. Floating home button replacement pattern
- Global control: [src/components/common/GlobalHomeButton.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/common/GlobalHomeButton.tsx)
- Map surface: [src/components/audience/BuskingMap.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/audience/BuskingMap.tsx)
- Live surface: [src/app/live/[id]/page.tsx#L210](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L210)
- Approved direction: do not use the global floating home button on map-heavy or live-heavy routes. Home/navigation actions should be part of page chrome.
- Route-specific rule:
  - `/explore`: home belongs in the header row or as a branded back-to-home item in the top chrome, never as floating overlap above the map
  - `/live/[id]`: keep the local header navigation and remove floating global chrome
  - `/singer/[id]`: if home is needed, integrate it into a small top bar or hero chrome rather than a fixed orb over the artwork
- Minimality rule: the only persistent floating control allowed over the map should be geolocation or map utility controls.

Route-specific visual notes:

- `Audience singer profile` `[src/app/singer/[id]/page.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/[id]/page.tsx)`
  - Reorder content to: hero -> live-entry module when active -> primary actions -> bio -> upcoming schedule.
  - When live is active, booking should visually step down one level. It remains available, but live entry is the dominant decision.
  - The small red avatar badge can stay as a supporting cue, but only if the larger live-entry module is present below.

- `Audience live` `[src/app/live/[id]/page.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx)`
  - The top header already carries singer identity and live state; use that as the main orientation anchor.
  - Setlist should become the first actionable content block.
  - Chat should remain visually heavier than request UI, because live participation depends on chat continuity and audience energy.
  - Booking should not appear anywhere on this route.

- `Explore map` `[src/app/explore/page.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/explore/page.tsx)` and [src/components/audience/BuskingMap.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/audience/BuskingMap.tsx)
  - Replace raw `Live Now` popup badge copy with localized UI.
  - Keep map popups compact: status, title, start time, one profile CTA.
  - Header chrome should own global navigation so the map remains unobstructed.

Spacing and responsive guidance:

- Mobile
  - singer profile live-entry module: 20-24px internal padding, 16px gap between meta stack and CTA
  - setlist header action: single compact button, same row only if title does not wrap past two lines
  - avoid more than two fixed bottom actions in live mode

- Tablet
  - singer profile live-entry module may switch to a two-column footer row: meta left, CTA right
  - live route can place setlist header action inline without reducing scan speed
  - keep home/navigation in the top bar; never float over central content

- Desktop
  - singer profile may use a wider card with title/meta on the left and CTA on the right
  - audience live may keep a slim session summary rail, but chat and setlist must stay primary
  - map header can support richer chrome, but the map viewport should stay visually clear of home affordances

Placements that should remain minimal:

- Avatar-level live badge on singer profile: supporting only
- Realtime sync label in live header: status cue only, not a hero element
- Home affordance on map/live: utility-level, not promotional
- Song request CTA in live setlist: secondary action, not a primary conversion block

Design acceptance criteria:

- A first-time audience user can identify the live-entry CTA on the singer profile within one viewport without scrolling past booking.
- Audience live mode no longer feels like a profile/details page with chat appended below it.
- Song request reads as part of the setlist experience, not as a competing bottom-bar campaign.
- No floating home control obscures map pins, live headers, or singer-profile artwork.

## Evidence
- files:
  - `tmp/ai-handoff-latest/pixel-design-live-profile-visual-brief.md`
  - `tmp/ai-handoff-latest/pm-live-profile-ux-realtime-handoff.md`
  - `src/app/singer/[id]/page.tsx`
  - `src/app/live/[id]/page.tsx`
  - `src/components/common/GlobalHomeButton.tsx`
  - `src/components/audience/BuskingMap.tsx`
  - `src/app/explore/page.tsx`
- commands:
  - `Get-Content` on the brief, PM handoff, and affected route files
  - `Select-String` repo search for live/profile/home-navigation references
- logs:
  - no runtime change made; this is a backfilled Pixel Design review and approval note

## Risks
- If Dev keeps both the global floating home button and route-level header navigation, map and live routes will continue to feel duplicated and visually noisy.
- If the singer profile keeps booking above the live-entry module during active performances, the product will bury the highest-intent audience action.

## Next Owner
Forge Dev

## Next Action
Implement the approved live-entry, setlist-action, and navigation placements on `/singer/[id]`, `/live/[id]`, and map-related audience surfaces, then return the build for Pixel Design visual verification.
