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

### Forge Dev

- Read current code before changing it.
- Prefer repository docs and workflow reports before asking for context.
- When finishing implementation, leave a handoff that QA can execute without guessing.
- When blocked by environment or secrets, say exactly which dependency is missing.

### Pixel Design

- Preserve established design language unless asked to explore.
- Provide named variants, intended usage, and handoff notes for implementation.
- Document which screens, flows, or components are affected.

### Scout QA

- Validate both happy path and obvious edge cases.
- Report only actionable findings.
- Include exact repro steps and affected route or component.
- Separate confirmed bugs from assumptions.

## Required Reading Order For Any Agent

1. `docs/ai-orchestra.md`
2. Latest GitHub workflow artifact from `ai-handoff`
3. Relevant PR comments or workflow summary
4. Code

## Escalation Policy

- If two agents disagree, `Atlas PM` resolves it.
- If a workflow report is stale, generate a fresh one before major work.
- If a task spans design, code, and QA, the order is:
  1. `Atlas PM`
  2. `Pixel Design` or `Forge Dev`
  3. `Forge Dev`
  4. `Scout QA`
  5. `Atlas PM`
