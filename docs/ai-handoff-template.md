# AI Handoff Template

Copy this template when an agent needs to hand work to another agent.

```md
## Agent
<Atlas | Codex App | Antigravity>

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

### Atlas To Antigravity

```md
## Agent
Atlas

## Task
Validate security hardening changes on staging.

## Result
Implemented server identity verification, GET read-only, realtime token hardening.

## Evidence
- files: `src/services/singer.ts`, `src/app/api/*/route.ts`, `realtime-server/server.js`
- commands: `bun test`, `npm run build`
- logs: All tests passed
- branch/worktree: `atlas/security-hardening` in `..\wt-atlas`

## Risks
- Full realtime token validation should be tested on live site.

## Next Owner
Antigravity

## Next Action
Test realtime control on staging - verify only valid tokens can control.
```

### Antigravity To Atlas

```md
## Agent
Antigravity

## Task
Validate realtime token hardening on staging.

## Result
Happy path passed. One remaining issue: invalid token still allows partial control.

## Evidence
- files: `realtime-server/server.js`
- commands: Manual test on staging
- logs: Reproduced on staging
- branch/worktree: `antigravity/qa-token` in `..\wt-antigravity`

## Risks
- Invalid token validation is incomplete.

## Next Owner
Atlas

## Next Action
Fix token validation logic in realtime-server.
```
