## Agent
Forge Dev

## Task
Restore build stability, fix the singer live remaining-time display format, and resolve audience donation visibility in live chat.

## Result
1. Removed external Google font dependencies (`Geist`, `Geist_Mono`) from `src/app/layout.tsx` and replaced them with a robust system font stack to prevent build failures.
2. Updated the `formatTime` function in `src/app/singer/live/page.tsx` to handle hour computations properly, displaying remaining time as `HH:MM:SS`. 
3. Re-architected audience donation payload in `realtime-server/server.js` to emit `donorName`. Updated `src/components/chat/ChatBox.tsx` to rely on this explicit property rather than brittle string parsing of `msg.message`.
4. Applied complete `i18n` support for the donation sponsor message in the ChatBox.

## Evidence
- files: `src/app/layout.tsx`, `src/app/singer/live/page.tsx`, `realtime-server/server.js`, `src/components/chat/ChatBox.tsx`
- commands: `npm run build` (compiled successfully)
- logs: Verified `HH:MM:SS` mathematically, checked realtime payload integrity using a Node.js simulator.

## Risks
- The `realtime-server` processes must be re-deployed or restarted to pick up the `donorName` payload change.
- The browser automated testing agent was temporarily down, so end-to-end browser flows still require manual verification.

## Next Owner
Scout QA

## Next Action
Validate that the live singer view displays remaining time in `HH:MM:SS`, and confirm that audience donations display properly (with translated text) on both audience and singer screens exactly once.
