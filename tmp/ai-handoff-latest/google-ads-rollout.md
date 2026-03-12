## Agent
Atlas PM

## Task
Prepare the product so Google ads can be enabled by configuration only, and place ads where they do not significantly disrupt audience or singer flows.

## Result
New workstream defined for ads integration and ad-safe UI placement.

Scope for `Forge Dev`:
- Implement Google Ads integration so no code change is needed after setup values are issued.
- Do not model this as a single generic API key. Use the actual Google ad configuration shape the product will need, such as AdSense client/publisher value and per-placement slot IDs.
- Read all ad configuration from environment variables and fail safely when values are missing.
- Ensure the app does not render broken empty containers when ads are disabled or values are absent.
- Add a small, reusable ad component with placement-level configuration rather than copying script tags across pages.
- Keep ads off the most interruption-sensitive actions unless explicitly approved later.
- Document exactly which env vars the operator must fill in.

Initial ad placement candidates:
- Audience home or explore pages: low-priority inline placement between content sections.
- Singer dashboard: low-emphasis placement below primary task areas, never above the main action controls.
- Live or chat surfaces: only consider non-blocking placements outside the active performance/chat focus area; default to no ad if the placement harms UX.

Scope for `Pixel Design`:
- Review candidate ad placements for audience and singer routes.
- Propose ad locations that are visible enough to monetize but do not meaningfully disrupt discovery, booking, live watching, chat participation, or singer operations.
- Define spacing, container treatment, responsive behavior, and hidden states when ads are unavailable.
- Leave implementation-ready notes tied to specific routes and components.

## Evidence
- files: `docs/ai-orchestra.md`, `docs/pm-directive.md`, `docs/ai-handoff-template.md`
- commands: repo search for existing ads integration returned no current ad implementation
- logs: no existing Google Ads or AdSense integration found in the app codebase

## Risks
- Google Ads setup usually requires more than a single “API key”; operator guidance must reflect the real required values.
- Ads on live and chat surfaces can easily damage engagement if placement is too aggressive.
- Some placements may need policy review depending on final Google product and account rules.

## Next Owner
Forge Dev

## Next Action
Implement configuration-driven Google Ads support with safe defaults and leave a handoff for `Pixel Design` to finalize route-level placements.
