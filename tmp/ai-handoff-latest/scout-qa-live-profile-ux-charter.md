## QA Charter

Use this after `Forge Dev` finishes implementation.

Validation focus:
- Singer performance time shows a consistent format on the same surface.
- Home navigation no longer awkwardly overlays the map or live UI.
- Song request CTA is in the setlist header area on audience live.
- Booking CTA is absent from audience live and remains available on singer profile only.
- Performance title/meta no longer clutter audience live and appear on singer profile above live entry when appropriate.
- Setlist completion status updates across separate audience clients in realtime.
- Setlist reorder updates across separate audience clients in realtime.
- Singer URL opens live directly when an active performance exists, and opens profile when none exists.
- The revised “Live Now” profile treatment looks intentional and does not visually regress mobile or desktop layouts.
- Touched routes do not expose raw translation keys or obvious hardcoded English gaps.

Priority routes:
- `/explore`
- `/live/[id]`
- `/singer/[id]`
- `/singer/live`
- `/singer/dashboard`

Expected QA output:
- confirmed passes
- confirmed failures with repro steps
- affected route or component
- screenshots when layout or visual hierarchy is involved
