# Component Refactoring Plan for minimic

## Objective
Reorganize React components for reusability, theme consistency, and maintainability by:
1. Separating CSS for each component
2. Creating unified/combined components by role
3. Ensuring all components use semantic theme variables
4. Improving overall code organization

---

## Current Component Structure Analysis

### 34 Components Found:

#### Common Components (11)
- `AppHeader.tsx` - Global header with logo, language, theme, logout
- `LanguageSwitcher.tsx` - Language selection dropdown
- `ThemeSwitcher.tsx` - Theme selection dropdown
- `ThemeProvider.tsx` - Theme context provider
- `GoogleAd.tsx` - Ad placement component
- `AdSenseScript.tsx` - Global AdSense script loader
- `MapPicker.tsx` - Location selection map
- `PointChargeModal.tsx` - Point purchase modal
- `ClockWidget.tsx` - Time display widget
- `DateTimePicker.tsx` - Date/time picker
- `ConfirmationModal.tsx` - Generic confirmation modal

#### Singer Components (14)
- `SongManagement.tsx` - Song list management
- `SongList.tsx` - Song display list
- `SongItem.tsx` - Individual song item
- `SongInputForm.tsx` - Song input form
- `SongSelector.tsx` - Song selection modal
- `PerformanceManagement.tsx` - Performance list management
- `PerformanceList.tsx` - Performance display list
- `PerformanceItem.tsx` - Individual performance item
- `PerformanceForm.tsx` - Performance creation form
- `AddPerformanceModal.tsx` - Add performance modal
- `EditPerformanceModal.tsx` - Edit performance modal
- `SingerQRCard.tsx` - QR code card for singer
- `BookingRequestsList.tsx` - Booking requests display
- `FollowersList.tsx` - Followers/fans display

#### Audience Components (4)
- `LandingPage.tsx` - Home/landing page
- `BuskingMap.tsx` - Map showing buskers
- `BookingRequestModal.tsx` - Booking request form
- `SongRequestModal.tsx` - Song request modal
- `AvatarCreator.tsx` - Avatar creator
- `PixelAvatar.tsx` - Pixel art avatar

#### Chat Components (1)
- `ChatBox.tsx` - Chat room component

---

## Proposed Refactoring Tasks

### Phase 1: Create CSS Module Structure

```
src/
  components/
    common/
      AppHeader/
        AppHeader.tsx
        AppHeader.module.css
      LanguageSwitcher/
        LanguageSwitcher.tsx
        LanguageSwitcher.module.css
      ThemeSwitcher/
        ThemeSwitcher.tsx
        ThemeSwitcher.module.css
      ...
```

### Phase 2: Component Consolidation

**Unified Modal Components:**
- Create `src/components/common/Modal/Modal.tsx` - Base modal
- Create `src/components/common/Modal/ConfirmationModal.tsx` 
- Create `src/components/common/Modal/PointChargeModal.tsx`
- Create `src/components/common/Modal/BookingRequestModal.tsx`
- Create `src/components/common/Modal/SongRequestModal.tsx`

**Unified Form Components:**
- Create `src/components/common/Form/Input.tsx` - Reusable input
- Create `src/components/common/Form/Select.tsx` - Reusable select
- Create `src/components/common/Form/Button.tsx` - Themed button

**Unified Card Components:**
- Create `src/components/common/Card/Card.tsx` - Base card
- Create `src/components/common/Card/SingerCard.tsx` - Singer profile card
- Create `src/components/common/Card/PerformanceCard.tsx` - Performance card

### Phase 3: Theme System Enhancement

- Ensure ALL color usages use CSS variables
- Add `--color-primary-foreground` usage across all buttons
- Document theme variables in `globals.css`

### Phase 4: CSS Extraction

Extract inline styles from:
1. All button elements → Button.module.css
2. All card elements → Card.module.css  
3. All modal elements → Modal.module.css
4. All form elements → Form.module.css
5. All list elements → List.module.css

---

## Implementation Priority

### Priority 1 (High Impact)
1. Button component with CSS modules
2. Modal base component with CSS modules
3. Card base component with CSS modules

### Priority 2 (Common Usage)
4. Input/Select form components
5. AppHeader CSS extraction
6. LanguageSwitcher CSS extraction

### Priority 3 (Feature Specific)
7. Singer components CSS
8. Audience components CSS
9. Chat components CSS

---

## Success Criteria

- [ ] All components use CSS modules (`.module.css`)
- [ ] All components use semantic theme variables
- [ ] Button components work consistently across all themes
- [ ] Modal components have consistent styling
- [ ] No hardcoded colors in component files
- [ ] Build passes without errors
- [ ] Theme switching works for all components

---

## Estimated Work Items: 20+ tasks

This refactoring will be distributed between Claude Code and Gemini CLI for parallel execution.
