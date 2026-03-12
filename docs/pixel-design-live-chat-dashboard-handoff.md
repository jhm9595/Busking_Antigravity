## Agent
Pixel Design

## Task
Review live, chat, and dashboard UI for hardcoded strings, language gaps, and UX inconsistencies, then leave implementation-ready design notes tied to affected screens and components.

## Result
Reviewed the current singer dashboard, singer live mode, audience live mode, and shared chat UI. Found four priority design issues that will block a clean multilingual release:

1. Live and dashboard surfaces still contain English fallback strings and mixed-language labels in primary UI.
2. Donation and system messages in chat use inconsistent visual language, and the donation card copy is partially broken by encoding noise.
3. Audience live mode still exposes debug-style language such as `(TEST)` and generic fallback identities like `Guest` / `Anonymous`.
4. Singer live mode contains status and error text that is technically functional but not UX-complete for production.

Implementation-ready design notes:

- Screen: singer dashboard
  Component: [src/app/singer/dashboard/page.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/dashboard/page.tsx)
  Direction: remove English fallback copy from primary actions and destructive flows. Registration, withdrawal, follower heading, and failure alerts should all come from locale keys only. If a translation key is missing, the implementation should add the key rather than silently falling back to English.

- Screen: singer live mode
  Component: [src/app/singer/live/page.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/live/page.tsx)
  Direction: keep the new `HH:MM:SS` timer but align all surrounding microcopy to production tone. Error state, chat opening failure, dashboard button title, manual song defaults, and empty-state text should be localized. The end-performance modal should use a distinct title and body instead of repeating the same string twice.

- Screen: audience live mode
  Component: [src/app/live/[id]/page.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx)
  Direction: replace hardcoded metadata labels (`Date`, `Time`, `Venue`) with locale keys that already exist, and remove the `(TEST)` suffix from the charge CTA. Default anonymous identity should use the localized anonymous label rather than raw `Guest` or `Anonymous`. This screen should feel like a polished public entry point, not a staging surface.

- Screen: shared live chat
  Component: [src/components/chat/ChatBox.tsx](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/chat/ChatBox.tsx)
  Direction: localize the join-state panel, request card copy, and donation card copy. The donation event should appear as one clear premium event style only once in the feed:
  - donor name first
  - amount second
  - event meaning third
  Avoid decorative corrupted glyphs or emoji-like fallback markers in production UI. Request cards should also use locale keys for title, requester attribution, and accept CTA.

Priority UX inconsistencies to address:

- Hardcoded strings in production routes:
  - [src/app/singer/dashboard/page.tsx#L202](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/dashboard/page.tsx#L202)
  - [src/app/singer/dashboard/page.tsx#L301](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/dashboard/page.tsx#L301)
  - [src/app/singer/dashboard/page.tsx#L311](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/dashboard/page.tsx#L311)
  - [src/app/singer/dashboard/page.tsx#L319](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/dashboard/page.tsx#L319)
  - [src/app/live/[id]/page.tsx#L158](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L158)
  - [src/app/live/[id]/page.tsx#L164](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L164)
  - [src/app/live/[id]/page.tsx#L246](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L246)
  - [src/app/live/[id]/page.tsx#L268](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L268)
  - [src/app/live/[id]/page.tsx#L275](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L275)
  - [src/app/live/[id]/page.tsx#L283](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/live/[id]/page.tsx#L283)
  - [src/app/singer/live/page.tsx#L101](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/live/page.tsx#L101)
  - [src/app/singer/live/page.tsx#L144](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/live/page.tsx#L144)
  - [src/app/singer/live/page.tsx#L236](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/live/page.tsx#L236)
  - [src/app/singer/live/page.tsx#L341](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/live/page.tsx#L341)
  - [src/app/singer/live/page.tsx#L357](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/app/singer/live/page.tsx#L357)

- Chat copy and encoding problems:
  - [src/components/chat/ChatBox.tsx#L161](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/chat/ChatBox.tsx#L161)
  - [src/components/chat/ChatBox.tsx#L168](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/chat/ChatBox.tsx#L168)
  - [src/components/chat/ChatBox.tsx#L183](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/chat/ChatBox.tsx#L183)
  - [src/components/chat/ChatBox.tsx#L190](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/chat/ChatBox.tsx#L190)
  - [src/components/chat/ChatBox.tsx#L206](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/chat/ChatBox.tsx#L206)
  - [src/components/chat/ChatBox.tsx#L241](C:/secjob/Busking_Antigravity/Busking_Antigravity/src/components/chat/ChatBox.tsx#L241)

Design acceptance criteria:

- No primary user-facing copy in these surfaces should rely on English fallback literals.
- Donation events must read as a premium chat event and render exactly once.
- Anonymous/default identities must respect locale tone.
- Live metadata labels and CTA labels must match the selected app language.
- Error, empty, and destructive states must feel product-level, not debug-level.

## Evidence
- files:
  - `src/app/singer/dashboard/page.tsx`
  - `src/app/singer/live/page.tsx`
  - `src/app/live/[id]/page.tsx`
  - `src/components/chat/ChatBox.tsx`
  - `src/contexts/LanguageContext.tsx`
  - `src/locales/*.ts`
- commands:
  - reviewed route files and locale context with `Get-Content`
  - searched hardcoded strings with `Select-String`
- logs:
  - no runtime changes made; this is a design review and handoff note

## Risks
- If Forge Dev only patches isolated strings without standardizing locale keys, the same mixed-language drift will recur in future flows.
- Donation chat may still feel broken even after realtime delivery is fixed if the message card design and copy model remain inconsistent.

## Next Owner
Forge Dev

## Next Action
Implement the localized copy cleanup and chat-event presentation adjustments for dashboard, singer live, audience live, and ChatBox using this note as the UI/UX acceptance baseline.
