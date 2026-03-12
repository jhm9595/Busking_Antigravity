## Agent
Atlas PM

## Task
Review Google ad placement opportunities and define non-disruptive placements for both audience and singer experiences.

## Result
Design brief prepared for ad-safe placement review.

Guidance for `Pixel Design`:
- Prioritize user focus and task completion over ad visibility.
- Avoid placements that compete with live video, live chat, sponsorship, song requests, performance controls, or primary dashboard actions.
- Prefer placements that feel like part of the page rhythm: between sections, below fold, side rail on wide screens, or after content blocks.
- Specify behavior for desktop and mobile separately.
- If a candidate placement harms readability or trust, reject it rather than forcing an ad slot.

Routes to review:
- `/`
- `/explore`
- `/dashboard`
- `/singer/dashboard`
- `/live/[id]`
- `/singer/live`

Deliverable shape:
- approved placements
- rejected placements and why
- spacing and size guidance
- hidden/empty state guidance when no ad is served
- next owner set to `Scout QA` only after concrete placements are defined

## Evidence
- files: `tmp/ai-handoff-latest/google-ads-rollout.md`
- commands: none
- logs: none

## Risks
- Mobile layouts have less tolerance for ad insertion and should be reviewed separately.
- Live and chat routes may end up with no acceptable placement, which is a valid outcome.

## Next Owner
Pixel Design

## Next Action
Define route-by-route ad placements that preserve audience and singer usability, then hand off to `Scout QA` for UX validation.
