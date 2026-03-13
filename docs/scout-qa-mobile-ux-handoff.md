## Agent
Scout QA

## Task
Validate Mobile UX/UI responsive design and accessibility on the production environment (https://busking.minibig.pw).

## Result
Found several major layout and usability defects affecting mobile users:
1. **Theme Switcher Broken**: The floating theme switcher (palette icon) button is completely non-functional via touch interactions on mobile.
2. **Accessibility (Micro-text)**: Critical action buttons like "포인트 충전" (Point Charge), "새로고침" (Refresh), and "상세 보기" (View Details) use font sizes as small as 9px-10px (`text-[9px]`, `text-[10px]`), making them nearly unreadable and hard to tap on mobile.
3. **Double Scroll in Modals**: The Point Charge modal is too tall for standard mobile viewports and introduces an internal scrollbar, leading to a clunky double-scroll experience and partially hiding options like the "Gold" package at the bottom.
4. **Header/Map Control Crowding**: The header on the `/explore` Map view squeezes the toggle, "팔로잉", and "Logout" buttons together with insufficient padding. The Map filter card also obscures too much of the map canvas.

## Evidence
- files: `src/components/ThemeSwitcher.tsx`, `src/components/modals/PointChargeModal.tsx`, `src/app/explore/page.tsx`
- commands: `browser_subagent` configured for explicit 390x844 mobile viewport testing on production.
- logs: Visual screenshots captured (e.g., `mobile_explore_list_view`, `mobile_dashboard_point_modal`, `mobile_dashboard_bottom`).

## Risks
- Audience mobile users have a heavily degraded point caching and booking request experience.
- The 8-theme system cannot be accessed or toggled by mobile devices.

## Next Owner
Atlas PM

## Next Action
Review the reported Mobile UX/UI defects and route to Forge Dev (for CSS/layout fixes) or Pixel Design (for mobile component redesigns).
