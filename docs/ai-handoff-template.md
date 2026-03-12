# AI Handoff Template

Copy this template when an agent needs to hand work to another agent.

```md
## Agent
<Atlas PM | Forge Dev | Pixel Design | Scout QA>

## Task
<what was requested>

## Result
<what changed or what was discovered>

## Evidence
- files:
- commands:
- logs:
- branch/worktree:

## Risks
- <risk>

## Next Owner
<single agent name>

## Next Action
<single next step>
```

## Required Header Check Before Work

Every agent should record the branch/worktree they used in `Evidence`.
If the work happened in the shared root checkout, the handoff must say why that was allowed.

## Minimal Examples

### Dev To QA

```md
## Agent
Forge Dev

## Task
Fix duplicate socket join in chat flow.

## Result
Removed duplicate `join_room` emit path and added idempotent join guard.

## Evidence
- files: `src/components/chat/ChatBox.tsx`
- commands: `npm.cmd run lint`, `npx.cmd tsc --noEmit`
- logs: typecheck passed for touched file path; repo-wide lint still has unrelated failures
- branch/worktree: `forge/fix-chat-join` in `..\wt-forge-dev`

## Risks
- Full live room count should still be validated in browser.

## Next Owner
Scout QA

## Next Action
Verify room count does not double-increment when audience joins chat.
```

### QA To PM

```md
## Agent
Scout QA

## Task
Validate live audience chat after duplicate join fix.

## Result
Happy path passed. One remaining issue: donation banner text is still English-only.

## Evidence
- files: `src/components/chat/ChatBox.tsx`, `realtime-server/server.js`
- commands: browser manual test
- logs: reproduced on `/live/[id]`
- branch/worktree: `scout/qa-live-chat` in `..\wt-scout-qa`

## Risks
- i18n is still incomplete in realtime system messages.

## Next Owner
Atlas PM

## Next Action
Route i18n cleanup to Forge Dev.
```
