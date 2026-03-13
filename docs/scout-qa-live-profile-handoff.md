## Agent
Antigravity (Scout QA)

## Task
Live Profile UX Charter validation on https://busking.minibig.pw per `tmp/ai-handoff-latest/scout-qa-live-profile-ux-charter.md`.

## Result

| # | Charter Item | Status | Screenshot |
|---|---|---|---|
| 1 | Home nav overlay on map | ✅ PASS | `explore_home_nav_check` - Home button (square icon) floats top-left, does not overlap map controls or zoom. |
| 2 | Song request CTA in setlist header | ✅ PASS | `live_page_audience_view` - "신청곡 보내기" button confirmed in setlist header (top-right of setlist section). |
| 3 | Booking CTA absent from audience live | ✅ PASS | `live_page_audience_view` - Only "후원하기 (500P)" button at bottom. No "예약하기" button found. |
| 4 | Singer URL redirects to live when active | ❌ FAIL | Navigating to /singer/[id] for a singer with active performance does NOT redirect to /live. Lands on profile page. |
| 5 | Singer profile "Live Now" indicator | ❌ FAIL | `singer_profile_mobile_check` - Profile shows "다가올 공연: 예정된 공연이 없습니다" and no "라이브 중" visual badge, even when performer is actively live. |
| 6 | i18n / raw keys in UI | ❌ FAIL | Explore page shows hardcoded English: "Explore Filter", "All", "Live", "Scheduled", "Followed Only". Ad slots expose raw debug text "Slot ID: audience_live_mid". |

### Screenshot Evidence (verified directly)

**live_page_audience_view**: Confirms song request button in header, 후원하기 at bottom, NO booking CTA. Ad slot "Ad" label between setlist and chat.

**singer_profile_mobile_check**: Profile page loaded instead of redirecting to live. Shows "다가올 공연 / 예정된 공연이 없습니다" — profile does not reflect that singer is currently live.

**explore_home_nav_check**: Home button (square icon, top-left) is well-placed. Filter panel at bottom uses English labels ("Explore Filter", "All", "Live", "Scheduled", "Followed Only") — these should be translated.

## Evidence
- screenshots: `live_page_audience_view_1773388143085.png`, `singer_profile_mobile_check_1773388010472.png`, `explore_home_nav_check_1773387851230.png`
- commands: browser_subagent QA sweep on production (mobile 390px viewport)
- branch/worktree: shared root (read-only)

## Risks
- Singer URL not redirecting to live = fans miss active performances. Discovery failure.
- No "Live Now" badge on singer profile = fans see "no upcoming shows" even when singer is live. Major UX gap.
- Explore filter labels in English = inconsistent i18n experience for Korean users.
- Ad slot debug text ("Slot ID: audience_live_mid") exposed to end users = looks broken/unprofessional.

## Next Owner
Atlas

## Next Action
1. Fix /singer/[id] redirect to check for active live performance and redirect to /live/[id] if found.
2. Add "라이브 중" status badge to singer profile when performance is active.
3. Translate Explore filter labels: "Explore Filter" → "탐색 필터", "All" → "전체", "Live" → "라이브 중", "Scheduled" → "예정", "Followed Only" → "팔로잉만".
4. Hide raw "Slot ID: ..." text from ad placements — only show to admins or remove entirely from frontend render.
