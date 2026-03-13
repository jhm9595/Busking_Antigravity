## Agent
Antigravity (Scout QA)

## Task
Final 3-Viewport Comprehensive QA Sweep on https://busking.minibig.pw
Viewports: Mobile (390x844), Tablet (768x1024), PC (1280x800).

---

## Result

### 🔴 CRITICAL: Theme System Regression
The theme selection has been significantly reduced across all viewports. Previously verified themes (**Retro Pixel Neon, Midnight Busking, Warm Street Poster**, etc.) are no longer available in the palette menu.

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | Only 4 themes visible (Neo-Brutalism, Dark Mode, Warm Sunset, Minimal Light). |
| 📟 Tablet | ❌ FAIL | Identical to mobile. |
| 🖥 PC | ❌ FAIL | Identical to mobile. |

*Note: This is a regression from earlier today (Ref screenshot: `click_feedback_1773384366171.png` vs `mobile_theme_list_final_1773404427023.png`).*

---

### 🔴 CRITICAL: Page Load Failure (Infinite Loading)
Navigating from /explore or /home to specific live sessions or artist profiles frequently results in a persistent "Loading..." state.

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | Stuck on /live/[id] and /singer/[id] loading screens. |
| 📟 Tablet | ❌ FAIL | Same infinite loading behavior. |
| 🖥 PC | ❌ FAIL | Same infinite loading behavior. |

**Severity: CRITICAL** — Users cannot access the core content (Live chats, profiles).

---

### 🟠 HIGH: Explore Filter i18n
Filter labels and titles on the /explore page remain in English, ignoring the global language setting.

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | "Explore Filter", "All", "Live", "Scheduled" in English. |
| 📟 Tablet | ❌ FAIL | Same labels in English. |
| 🖥 PC | ❌ FAIL | Same labels in English (Screenshot: `pc_explore_theme_check_1773404804540`). |

---

### 🟠 HIGH: Ad Slot Debug Text
Ad placements are displaying internal Slot ID metadata to public users.

| Viewport | Status | Observation |
|---|---|---|
| 📱 Mobile | ❌ FAIL | "Slot ID: home_hero_bottom" and "explore_grid_bottom" visible. |
| 📟 Tablet | ❌ FAIL | "Slot ID: singer_profile_mid" visible. |
| 🖥 PC | ❌ FAIL | "explore_grid_bottom" visible in the footer (Screenshot: `click_feedback_1773404757736`). |

---

### 🟡 MEDIUM: PC Header Branding
The PC layout header shows personal user metadata ("minimic") in the logo and user menu areas instead of the correct "BuskerKing" branding.

---

## Evidence
- **Regression Screenshots (Themes)**:
  - BEFORE: `click_feedback_1773384366171.png` (8+ themes)
  - AFTER: `mobile_theme_list_final_1773404427023.png` (4 themes)
- **i18n failure**: `pc_explore_theme_check_1773404804540.png`
- **Ad Slot Debug**: `click_feedback_1773404757736.png`

## Risks
1. **Broken UX**: Infinite loading makes the site unusable for certain users/routes.
2. **Missing Brand Assets**: Loss of 8 verified themes affects the "wow" factor promised to the user.
3. **Monetization (External)**: Kakao Pay 400 error (previously reported) still persists as a revenue blocker.

## Next Owner
Atlas

## Next Action
1. **[URGENT]** Restore the missing 8 themes to the `ThemeSelector` component.
2. **[URGENT]** Debug the infinite loading issue on `/live/[id]` and `/singer/[id]` slug routes.
3. Fix the `i18n` keys for Explore filters (already provided in `scout-qa-3viewport-handoff.md`).
4. Suppress the `Slot ID` text in production builds of the `AdSlot` component.
