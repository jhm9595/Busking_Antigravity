## QA Charter

Use this only after `Pixel Design` finishes the eight-theme handoff.

Validation focus:
- Confirm each of the eight themes is visually distinct and still recognizably part of the same product.
- Confirm shared layout structure, spacing rhythm, and interaction patterns remain consistent across themes.
- Confirm text contrast, button states, form readability, chat readability, and map/live/dashboard usability remain acceptable in every theme.
- Confirm no hardcoded legacy colors or fonts remain on audited routes.
- Confirm theme switching, if implemented, does not break hydration, navigation, or responsive layout.

Priority routes:
- `/`
- `/dashboard`
- `/explore`
- `/live/[id]`
- `/singer/live`
- `/design-preview`
- `/design-flow`
- `/design-to-be`

Expected QA handoff shape:
- confirmed passes
- confirmed failures with repro steps
- screenshots or route references for each issue
- affected component or file when identifiable
