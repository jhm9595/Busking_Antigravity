# QA Testing Checklist - Busking Antigravity

## Branch: fix/button-debouncing

### 1. Chat Room Test (채팅방 열기)
**Expected:** Chat should open when performance has `chatEnabled: true`
**Test:**
- Go to a live performance page (e.g., /live/[performance-id])
- If performance has chat enabled, chat box should appear below the setlist
- Verify chat messages can be sent/received

### 2. Button Debouncing Test (버튼 중복 클릭 방지)
**Expected:** Buttons should be disabled while processing to prevent double clicks

**Test - Singer Dashboard:**
- Go to /singer/dashboard
- Click "공연 시작" (Start Mode) button
- Button should show loading spinner and become disabled
- Button should re-enable after action completes

**Test - Audience Live Page:**
- Go to /live/[performance-id]
- Click "후원하기" (Sponsor) button
- Button should show loading state and become disabled
- Button should re-enable after sponsorship completes

---

## Branch: fix/i18n-lang

### 3. Theme Switcher Test (테마 전환기)
**Expected:** Theme switcher should work on both desktop and mobile

**Test:**
- Click theme toggle button (top-right corner)
- Dropdown menu should appear on click (not hover)
- Select any theme (e.g., Neo-Brutalism)
- UI should update immediately to reflect the selected theme
- Theme should persist on page reload
- Test on mobile: tap should open dropdown

### 4. Dynamic Language Attribute Test
**Expected:** HTML lang attribute should match selected language

**Test:**
- Change language to Korean (한국어)
- Inspect browser DevTools → <html> element
- lang attribute should be "ko" or "ko-KR"
- Change to English → lang should be "en"

---

## Branch: fix/kakao-pay

### 5. Kakao Pay Integration Test
**Expected:** Payment flow should work with correct API keys

**Test:**
- Go to /singer/dashboard
- Click Points charge button
- Select Kakao Pay method
- Complete payment flow
- Verify redirect to approval URL works
- Verify points are added to account

---

## Branch: feat/8-themes

### 6. Visual Theme Test (시각적 테마)
**Expected:** All 8 themes should apply correctly

**Test:**
- Switch through all themes:
  1. System (auto)
  2. Light
  3. Dark
  4. Neo-Brutalism
  5. Bento Grids
  6. Glassmorphism
  7. Spatial UI
  8. Kinetic Typography
  9. New Naturalism
  10. Minimalist Maximalism
  11. Claymorphism

- Verify colors, borders, shadows update correctly per theme
- Verify text remains readable
- Verify buttons and cards use theme styles

---

## Success Criteria
- [ ] All tests pass
- [ ] No console errors
- [ ] No visual regressions
- [ ] Mobile responsive works correctly
