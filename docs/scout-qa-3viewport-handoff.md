## Agent
Antigravity (Scout QA)

## Task
3-Viewport simultaneous QA sweep on https://busking.minibig.pw.
Viewports tested: Mobile (390x844), Tablet (768x1024), PC (1280x800).

---

## Result

### Issue 1: Explore Filter i18n (hardcoded English)

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | "Explore Filter / All / Live / Scheduled / Followed Only" in English |
| 📟 Tablet | ❌ FAIL | Identical — "Explore Filter / All / Live / Scheduled" in English (screenshot: `tablet_explore_filters_i18n`) |
| 🖥 PC | ❌ FAIL | Even after manually switching language to 한국어, filter labels remain English (screenshot: `explore_filters_pc_i18n_failure`) |

**Severity: MEDIUM** — The language switcher applies KO to most UI but the Explore filter strings are hardcoded.

---

### Issue 2: Ad Slot — "Slot ID" debug text visible to users

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | "Slot ID: explore_grid_bottom", "Slot ID: singer_profile_mid" visible |
| 📟 Tablet | ❌ FAIL | Confirmed on Home, Explore, and Singer Profile routes |
| 🖥 PC | ❌ FAIL | Singer Profile page shows plain "Ad" placeholder + Slot ID text (screenshot: `singer_profile_ad_slot_pc`) |

**Severity: LOW** — No functional impact but looks like unfinished/broken UI to users.

---

### Issue 3: Kakao Pay 400 Error (persistent monetization blocker)

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | 400 Bad Request on POST /api/payment/kakao/ready. Console: "Kakao Pay preparation failed" |
| 📟 Tablet | Not tested (same endpoint) | — |
| 🖥 PC | Not tested (not logged in) | — |

**Severity: CRITICAL** — Revenue blocked for all users on all devices.

---

### Issue 4: Singer Profile 404 ("형민부개" slug)

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | "아티스트를 찾을 수 없습니다" when navigating to /singer/형민부개 |
| 📟 Tablet | ❌ FAIL | Same 404 on same URL |
| 🖥 PC | ❌ FAIL | Same 404 (screenshot: `singer_profile_not_found_pc`) |

Note: Clerk userId-based URLs (e.g., /singer/user_38M...) still work. Only display name/slug routes broken.

**Severity: HIGH** — Fans cannot link to artists by name. Share links likely broken.

---

### PASS items

| Item | Mobile | Tablet | PC |
|---|---|---|---|
| Point Charge Modal layout | ✅ | ✅ | N/A (auth required) |
| Homepage layout | ✅ | ✅ | ✅ |
| Explore list view layout | ✅ | ✅ | ✅ |
| "광고 보기" free-point option visible in modal | ✅ | ✅ | N/A |
| Header nav / home button placement | ✅ | ✅ | ✅ |

**NEW PC FINDING:** On PC, the homepage hero section shows "ANTIGRAVITY." in the brand logo (not "miniMic"), and the Navbar shows the user's Clerk username ("minimic") instead of a profile icon — possible Clerk session leak to the brand name area. Needs investigation.

---

## Evidence
- screenshots:
  - Mobile: `click_feedback_1773397948461.png` (filter i18n), `click_feedback_1773398131499.png` (point modal)
  - Tablet: `tablet_explore_filters_i18n_1773398310905.png`, `tablet_point_charge_modal_layout_1773398355696.png`, `tablet_homepage_layout_check_1773398658175.png`
  - PC: `homepage_layout_pc_1773398837071.png`, `explore_filters_pc_i18n_failure_1773399028280.png`, `singer_profile_ad_slot_pc_1773399081584.png`
- branch/worktree: shared root (read-only)

## Risks
1. **Kakao Pay CRITICAL** — monetization completely blocked
2. **Singer slug 404 HIGH** — share/bookmark links broken for all named-URL artists
3. **Filter i18n MEDIUM** — language switcher incomplete, affects Korean UX
4. **Ad debug text LOW** — professional appearance affected

## Next Owner
Atlas

## Next Action
1. **[URGENT]** Fix /singer/[slug] route — slug lookup must resolve display-name slugs (e.g., "형민부개") to userId, not fail with 404.
2. **[URGENT]** Investigate Kakao Pay API env vars in Cloud Run prod (`gcloud run services describe --format=json`).
3. Add i18n keys for Explore filter: `explore.filter.title`, `explore.filter.all`, `explore.filter.live`, `explore.filter.scheduled`, `explore.filter.followedOnly`.
4. Remove or hide `Slot ID: ...` text from ad placement component (show only in dev/admin mode).
