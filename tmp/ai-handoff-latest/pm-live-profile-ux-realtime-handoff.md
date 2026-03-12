## Agent
Atlas PM

## Task
Route the following UX, realtime, and i18n fixes so another AI can implement them without ambiguity.

## Result
Execution plan prepared for `Forge Dev` as the next owner. Scope is intentionally grouped by feature area, not by file, so implementation can stay coherent.

Implementation scope for `Forge Dev`:

1. Time formatting consistency
- Fix singer performance time display so start and end use the same format.
- Do not mix `오후 9시` style with `22:00` style in the same surface.
- Use one consistent display format per surface, preferably `HH:mm` for start/end ranges where precision matters.

2. Map and home navigation
- On map-heavy audience surfaces, stop relying on a floating home button that covers content awkwardly.
- Move the home action into the page chrome so it stays fixed above the map instead of floating over it.
- Review the current global floating home button and replace it with a less intrusive pattern where appropriate.

3. Audience live action layout
- Move the song request button into the “today setlist” area, aligned to the upper-right of that section.
- Remove the booking CTA from live mode.
- Keep booking only on the singer profile.

4. Audience live information hierarchy
- Remove performance title and performance meta block from audience live mode if it competes with the live experience.
- Move performance title and core meta information onto the singer profile, placed above the live-entry button for active performances.

5. Realtime setlist synchronization
- When the singer marks a setlist item complete, other audience clients must see the change in realtime.
- When the singer reorders the setlist, other audience clients must see the updated order in realtime.
- Treat both item status and list order as authoritative realtime state changes.

6. Singer profile live-entry routing
- When an audience user opens a singer URL and that singer is already performing live, route directly into the live room.
- If no performance is currently live, keep the user on the singer profile.

7. Visual polish requests that still require implementation support
- Improve the audience-facing “Live Now” treatment on the singer profile so it looks intentionally designed rather than like a raw status badge.
- Review the current floating home button approach and adopt a better integrated navigation treatment.

8. i18n pass
- Recheck touched audience, singer-profile, live, map, and dashboard flows for raw keys, hardcoded English, and incomplete translation behavior.
- Add safe fallback behavior so missing localized keys do not surface raw key paths in the UI.

Acceptance criteria:
- No mixed 12-hour/24-hour time range on the same performance card or live screen.
- Audience live mode no longer shows booking CTA.
- Song request CTA appears at the setlist section header, upper-right.
- Audience clients update in realtime on setlist completion and reorder.
- Singer URL opens live room directly when a live performance exists.
- Home navigation no longer visually fights with map or live UI.
- Touched flows do not expose raw translation keys.

## Evidence
- files: `docs/ai-orchestra.md`, `docs/pm-directive.md`
- commands: repo inspection of live/profile/map/realtime/i18n files before routing
- logs: no new code was changed in this PM turn; instructions only

## Risks
- Auto-redirecting from singer profile to live can remove intentional profile discovery during a live session, so Dev should keep the logic explicit and predictable.
- Home-button changes affect multiple routes and should avoid creating duplicated navigation controls.
- Realtime setlist updates may require both client and socket-server changes.

## Next Owner
Forge Dev

## Next Action
Implement items 1 through 8 as a single coherent pass, then hand off to `Pixel Design` for visual review and `Scout QA` for verification.
