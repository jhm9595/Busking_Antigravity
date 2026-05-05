# Handoff Template

Copy this structure into the final report, PR comment, or issue comment. Do not create new handoff Markdown files unless explicitly requested.

```md
## Agent
<Atlas | Codex App | Antigravity>

## Task
<one sentence describing the assignment>

## Branch Or Worktree
<branch name and worktree path>

## Result
<what changed or what was verified>

## Changed Files
- <path>

## Verification
- `<command>`: <pass | fail | skipped, with reason>

## Manual QA
- <route or workflow>: <pass | fail | skipped, with reason>

## Risks
- <remaining risk or none>

## Blockers
- <blocker or none>

## Next Owner
<single owner>
```

## Rules

- Name exactly one next owner.
- If a check failed, include the key failure line and the suspected owner.
- If a check was skipped, explain why it was not applicable or not runnable.
- Do not include secrets, tokens, webhook values, or private credentials.