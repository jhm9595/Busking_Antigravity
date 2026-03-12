# AI Orchestra

This repository uses a four-agent operating model. Every agent reads this file first before starting work.

## Agent Names

- `Atlas PM`: Codex CLI. Owns planning, routing, prioritization, risk framing, and final integration decisions.
- `Forge Dev`: Gemini CLI on the MacBook. Owns implementation, refactors, debugging, migrations, and code-level delivery.
- `Pixel Design`: Codex App for Figma design work. Owns UI concepts, layout variants, component visuals, and design-to-code handoff notes.
- `Scout QA`: Antigravity in the browser. Owns end-to-end validation, regression checks, repro steps, UX defects, and release-readiness notes.

## Source Of Truth

- GitHub is the only handoff system of record.
- Every agent should prefer GitHub workflow summaries, workflow artifacts, PR comments, and repository docs over chat copy-paste.
- iCloud Notes should not be required for normal handoff.
- `docs/pm-directive.md` is the current PM instruction file and should be treated as the live execution directive.

## Workspace Model

- Agents must not share one live worktree for active work.
- `main` is the integration branch and PM reference branch. It is not the default place for concurrent implementation, QA, or design edits.
- Each agent must work in its own branch and its own git worktree when making changes or generating agent-specific artifacts.
- Recommended branch names:
  - `atlas/<task>`
  - `forge/<task>`
  - `pixel/<task>`
  - `scout/<task>`
- Recommended local worktree folders:
  - `..\wt-atlas-pm`
  - `..\wt-forge-dev`
  - `..\wt-pixel-design`
  - `..\wt-scout-qa`
- If an agent is not prepared to create a branch/worktree, that agent should stay read-only and leave a handoff instead of editing in the shared root checkout.

## Shared Root Checkout Rule

- The repository root checkout should be treated as a coordination view, not a multi-agent scratch workspace.
- Only `Atlas PM` may update shared directive docs in the root checkout by default:
  - `docs/ai-orchestra.md`
  - `docs/pm-directive.md`
  - `docs/ai-handoff-template.md`
- Other agents should not leave temporary files, test outputs, or agent-specific notes in the shared root checkout.
- If a shared-root file already has unrelated local changes, do not overwrite them blindly. Route the conflict to `Atlas PM`.

## Notifications And Secrets

- GitHub Actions may send notifications through the repository secret `DISCORD_WEBHOOK_URL`.
- Agents may assume Discord notification is enabled only when the workflow references `secrets.DISCORD_WEBHOOK_URL`.
- Agents must never print, request, expose, or attempt to recover the webhook value.
- Agents can know the secret name and usage from repository code, but not the secret value.
- To verify delivery, agents should check the `ai-handoff` workflow run and its Discord notification step instead of asking for the webhook URL.

## Core Rules

1. `Atlas PM` decides which agent should act next.
2. `Forge Dev` changes code unless the task is strictly design-only or QA-only.
3. `Pixel Design` never invents product requirements. It translates product intent into design options.
4. `Scout QA` reports defects with repro steps, expected behavior, actual behavior, and affected files when possible.
5. Any agent that finds a blocker must write it in the standard handoff format.
6. All agents must keep outputs concise, structured, and directly reusable by another AI.

## Standard Handoff Format

Every agent should write handoffs using this structure:

```md
## Agent
<Atlas PM | Forge Dev | Pixel Design | Scout QA>

## Task
<what was attempted>

## Result
<what changed, what was learned, or what failed>

## Evidence
- files:
- commands:
- logs:

## Risks
- <open risk 1>
- <open risk 2>

## Next Owner
<which agent should act next>

## Next Action
<single clear next step>
```

## Role-Specific Rules

### Atlas PM

- Triage requests and split work by agent.
- Prefer one next owner at a time.
- Convert vague requests into executable tasks.
- Maintain the release perspective: correctness, priority, and scope.
- Keep `docs/pm-directive.md` current when ownership or operating rules change.
- Decide when a task needs a new branch/worktree before assigning implementation.

### Forge Dev

- Read current code before changing it.
- Prefer repository docs and workflow reports before asking for context.
- When finishing implementation, leave a handoff that QA can execute without guessing.
- When blocked by environment or secrets, say exactly which dependency is missing.
- Do implementation work in the Forge branch/worktree, not in the shared root checkout.

### Pixel Design

- Preserve established design language unless asked to explore.
- Provide named variants, intended usage, and handoff notes for implementation.
- Document which screens, flows, or components are affected.
- If design work touches repository files, use the Pixel branch/worktree or stay read-only.

### Scout QA

- Validate both happy path and obvious edge cases.
- Report only actionable findings.
- Include exact repro steps and affected route or component.
- Separate confirmed bugs from assumptions.
- If a confirmed bug is found, set `Next Owner` to `Atlas PM`.
- Do not assign implementation work directly unless `Atlas PM` has already delegated that path.
- Put QA logs, screenshots, and temporary artifacts in the Scout branch/worktree, not the shared root checkout.

## Required Reading Order For Any Agent

After every `git pull`, every agent must read `docs/ai-orchestra.md` before analysis, coding, design, or QA.
If this file changed, the new rules override prior working assumptions immediately.

1. `docs/ai-orchestra.md`
2. `docs/pm-directive.md`
3. `git status --short --branch` and confirm the current branch/worktree matches the assigned role
4. Latest GitHub workflow artifact from `ai-handoff`
5. Relevant PR comments or workflow summary
6. Code

Before editing, each agent must confirm all of the following:

1. I am not on the shared root checkout unless I am updating PM coordination docs.
2. My branch name matches my role.
3. My worktree does not contain unrelated local changes I do not understand.
4. My handoff target is a single next owner.

## Escalation Policy

- If two agents disagree, `Atlas PM` resolves it.
- If a workflow report is stale, generate a fresh one before major work.
- Confirmed QA findings always route back to `Atlas PM` before implementation is reassigned.
- If a task spans design, code, and QA, the order is:
  1. `Atlas PM`
  2. `Pixel Design` or `Forge Dev`
  3. `Forge Dev`
  4. `Scout QA`
  5. `Atlas PM`
- If a shared-root checkout becomes dirty from multiple agents, stop new edits there, create clean role-specific worktrees, and resume from those worktrees.
