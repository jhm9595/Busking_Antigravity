# Security Hardening Priorities 1-3

## TL;DR
> **Summary**: Lock down the highest-risk trust boundaries in the BuskerKing app by making writes server-authoritative, removing realtime client authority, and consolidating live lifecycle state ownership.
> **Deliverables**:
> - Authenticated, owner-checked mutating surfaces
> - Non-authoritative socket transport with verified control path
> - Read-only GET routes with one shared lifecycle resolver
> - Refreshed regression scripts for priorities 1-3
> **Effort**: Large
> **Parallel**: YES - 4 waves
> **Critical Path**: Task 1 -> Task 2 -> Task 4 -> Task 5

## Context
### Original Request
- Break the top three improvement priorities into implementation tickets.

### Interview Summary
- Scope is limited to priorities 1-3 only.
- Output should be execution-ready tickets, not a prose-only recommendation.
- Default assumptions applied where not explicitly answered: Clerk is the authoritative identity source; public anonymous access stays read-only; all write/control actions require authenticated identity; only the owning singer controls a performance.

### Metis Review (gaps addressed)
- Preserve anonymous read-only access, but treat audience writes as explicit policy decisions and default them to authenticated unless already proven safe.
- Make Prisma the authority for persisted lifecycle state and `chatEnabled`; Redis remains transport/cache/history only.
- Do not trust existing `test-suite` scripts as-is; refresh targeted coverage before using them as acceptance evidence.
- Keep scheduler/cron, auth-provider migration, and broad modularization out of scope.

## Work Objectives
### Core Objective
- Eliminate spoofable write/control paths and state drift in the current live-performance architecture without expanding scope into broader refactors.

### Deliverables
- Shared server-side auth/ownership guard for in-scope mutators
- Locked-down mutating server actions and REST routes
- Shared lifecycle resolver consumed by read paths without DB writes in GET handlers
- Realtime authority model where privileged control flows only through verified app-side paths
- Updated smoke/regression scripts with machine-readable artifacts

### Definition of Done (verifiable conditions with commands)
- `node test-suite/security/mutating-writes.test.js`
- `node test-suite/lifecycle/read-only.test.js`
- `node test-suite/realtime/authority.test.js`
- `node test-suite/api-tester.js`
- `node test-suite/chat-tester.js`
- `powershell -ExecutionPolicy Bypass -File .\test-suite\one-click-test.ps1`
- `npm run lint`
- `npm run build`

### Must Have
- Server-derived identity for all in-scope writes/control events
- Owner checks based on authoritative DB ownership, not client payload
- No Prisma mutations from GET routes
- Single lifecycle-resolution rule consumed by API and UI
- Realtime layer treated as non-authoritative transport

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No auth-provider migration
- No scheduler/cron/event-bus introduction
- No trust in client-supplied `userId`, `fanId`, `singerId`, `userType`, or capacity for authorization
- No UI redesign or unrelated service-layer decomposition
- No manual-only acceptance steps

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after using targeted Node scripts plus final smoke scripts
- QA policy: Every task includes happy-path and attack-path scenarios
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}` and `test-suite/results/*.json`

## Execution Strategy
### Parallel Execution Waves
> Target: keep shared security/lifecycle foundations in Wave 1, then parallelize only where contracts are already fixed.

Wave 1: foundation contracts and targeted test harnesses
Wave 2: mutating-surface auth lock-down + lifecycle read-path consolidation
Wave 3: realtime authority hardening
Wave 4: regression/smoke alignment

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks | Notes |
|---|---|---|---|
| 1 | None | 2, 3, 4, 5 | Establishes contracts and test harnesses |
| 2 | 1 | 4, 5 | Reuses auth/ownership foundation |
| 3 | 1 | 4, 5 | Reuses lifecycle foundation |
| 4 | 2, 3 | 5 | Needs verified auth and lifecycle rules |
| 5 | 2, 3, 4 | None | Final regression alignment |

### Agent Dispatch Summary (wave -> task count -> categories)
- Wave 1 -> 1 task -> `deep`
- Wave 2 -> 2 tasks -> `deep`, `deep`
- Wave 3 -> 1 task -> `ultrabrain`
- Wave 4 -> 1 task -> `unspecified-high`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Establish Trust-Boundary Foundation

  **What to do**: Inventory every in-scope mutating surface for priorities 1-3, then introduce one shared server-side auth/ownership contract and one shared lifecycle contract that later tickets must consume. Create targeted Node-based regression scripts under `test-suite/security/` and `test-suite/lifecycle/` that accept `--case` and `--out` arguments and emit JSON artifacts under `test-suite/results/`.
  **Must NOT do**: Do not migrate auth providers, do not split `src/services/singer.ts` by domain yet, and do not reuse stale `api-tester.js` or `chat-tester.js` as authoritative coverage without refreshing them.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: shared security and lifecycle contracts affect all later tickets
  - Skills: `[]` - no browser, git, or UI specialization is needed
  - Omitted: [`playwright`, `git-master`, `frontend-ui-ux`] - not useful for backend contract scaffolding

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4, 5 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `src/app/page.tsx:6` - current server-side Clerk identity lookup to mirror when deciding canonical auth source
  - Pattern: `src/app/layout.tsx:24` - confirms Clerk is already global app auth provider
  - Pattern: `src/middleware.ts:12` - existing middleware boundary and current lack of auth enforcement for writes
  - Pattern: `src/services/singer.ts:207` - example of a high-value mutating action currently taking caller-provided IDs
  - Pattern: `src/app/api/performances/route.ts:56` - example of read path performing DB writes that must be covered in lifecycle tests
  - Pattern: `src/app/api/singers/[id]/route.ts:27` - second read path mutating DB state
  - Test: `test-suite/api-tester.js:35` - existing stale API assumptions to replace, not emulate
  - Test: `test-suite/chat-tester.js:36` - stale socket contract assumptions to replace, not emulate

  **Acceptance Criteria** (agent-executable only):
  - [ ] `node test-suite/security/foundation.test.js --case anonymous-read-allowed --out test-suite/results/security-foundation-anon-read.json`
  - [ ] `node test-suite/security/foundation.test.js --case anonymous-write-rejected --out test-suite/results/security-foundation-anon-write.json`
  - [ ] `node test-suite/security/foundation.test.js --case cross-owner-write-forbidden --out test-suite/results/security-foundation-cross-owner.json`
  - [ ] `node test-suite/lifecycle/foundation.test.js --case no-get-writes-contract --out test-suite/results/lifecycle-foundation.json`
  - [ ] `npm run lint`

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```text
  Scenario: Foundation contract passes for public read and protected write
    Tool: Bash
    Steps: Run `node test-suite/security/foundation.test.js --case anonymous-read-allowed --out test-suite/results/security-foundation-anon-read.json` and `node test-suite/security/foundation.test.js --case anonymous-write-rejected --out test-suite/results/security-foundation-anon-write.json`
    Expected: First artifact reports HTTP 200/read allowed; second artifact reports HTTP 401 or explicit rejection with no mutation performed
    Evidence: .sisyphus/evidence/task-1-trust-boundary-foundation.txt

  Scenario: Lifecycle contract rejects DB writes in GET handlers
    Tool: Bash
    Steps: Run `node test-suite/lifecycle/foundation.test.js --case no-get-writes-contract --out test-suite/results/lifecycle-foundation.json`
    Expected: Artifact reports zero Prisma write side effects for inspected GET routes and marks contract pass true
    Evidence: .sisyphus/evidence/task-1-trust-boundary-foundation-error.txt
  ```

  **Commit**: YES | Message: `test(core): add trust boundary foundation coverage` | Files: `test-suite/security/*`, `test-suite/lifecycle/*`, shared auth/lifecycle helper files

- [x] 2. Derive Identity Server-Side for All In-Scope Writes

  **What to do**: Refactor every mutating server action and REST route in scope so the server derives the acting user from Clerk, resolves ownership from Prisma, and rejects cross-user payload spoofing. Cover at minimum the mutating exports in `src/services/singer.ts` used by dashboard/live screens, plus `POST /api/singers/[id]/follow`, `POST /api/song-requests`, and `POST /api/booking`. Keep public GET access anonymous.
  **Must NOT do**: Do not secure read-only endpoints as authenticated-only, do not accept fallback identity from request body/query string, and do not change product UI in this ticket.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: this is a cross-cutting security refactor across server actions and routes
  - Skills: `[]` - backend/domain work only
  - Omitted: [`playwright`, `frontend-ui-ux`, `git-master`] - not needed for implementation or verification here

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `src/services/singer.ts:62` - profile nickname write taking `userId` directly
  - Pattern: `src/services/singer.ts:117` - singer profile mutation taking `singerId` directly
  - Pattern: `src/services/singer.ts:161` - sponsorship transfer trusting `fanId` and `singerId`
  - Pattern: `src/services/singer.ts:207` - chat-open purchase trusting `singerId` and `performanceId`
  - Pattern: `src/services/singer.ts:298` - performance status mutation with no ownership guard
  - Pattern: `src/services/singer.ts:407` - performance creation currently trusting caller-supplied `singerId`
  - Pattern: `src/services/singer.ts:507` - chat toggle mutation with no explicit auth boundary
  - Pattern: `src/services/singer.ts:576` - request moderation path that must be owner-only
  - Pattern: `src/app/api/singers/[id]/follow/route.ts:44` - REST write path trusting body `fanId`
  - Pattern: `src/app/api/song-requests/route.ts:4` - anonymous write surface to reclassify as authenticated-by-default in this plan
  - Pattern: `src/app/api/booking/route.ts:4` - anonymous write surface to reclassify as authenticated-by-default in this plan
  - API/Type: `prisma/schema.prisma:79` - performance ownership pivots on `Performance.singerId`
  - API/Type: `prisma/schema.prisma:145` - follow uniqueness and ownership constraints

  **Acceptance Criteria** (agent-executable only):
  - [ ] `node test-suite/security/mutating-writes.test.js --case follow-route-derives-identity --out test-suite/results/mutating-follow.json`
  - [ ] `node test-suite/security/mutating-writes.test.js --case owner-performance-update-succeeds --out test-suite/results/mutating-owner-performance.json`
  - [ ] `node test-suite/security/mutating-writes.test.js --case unauthenticated-write-returns-401 --out test-suite/results/mutating-unauthenticated.json`
  - [ ] `node test-suite/security/mutating-writes.test.js --case foreign-performance-update-returns-403 --out test-suite/results/mutating-cross-owner.json`
  - [ ] `npm run build`

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```text
  Scenario: Owner can perform an authorized performance mutation
    Tool: Bash
    Steps: Run `node test-suite/security/mutating-writes.test.js --case owner-performance-update-succeeds --out test-suite/results/mutating-owner-performance.json`
    Expected: Artifact reports authenticated owner context, HTTP 200/success payload, and changed row owned by the acting singer only
    Evidence: .sisyphus/evidence/task-2-server-derived-identity.txt

  Scenario: Spoofed or missing identity cannot mutate protected state
    Tool: Bash
    Steps: Run `node test-suite/security/mutating-writes.test.js --case unauthenticated-write-returns-401 --out test-suite/results/mutating-unauthenticated.json` and `node test-suite/security/mutating-writes.test.js --case foreign-performance-update-returns-403 --out test-suite/results/mutating-cross-owner.json`
    Expected: First artifact reports `401`; second reports `403`; both show zero unauthorized row changes
    Evidence: .sisyphus/evidence/task-2-server-derived-identity-error.txt
  ```

  **Commit**: YES | Message: `fix(auth): derive write identity and enforce ownership server-side` | Files: `src/services/singer.ts`, in-scope API routes, shared auth helper files, targeted security tests

- [x] 3. Make Lifecycle Resolution Read-Only and Shared

  **What to do**: Introduce one shared lifecycle resolver used by API and UI read paths, then remove all Prisma writes from GET handlers. `status` and `chatEnabled` remain authoritative in Prisma as persisted state, while the shared resolver computes effective public lifecycle for reads. Normalize canceled/cancelled spelling at the resolver boundary without adding scheduler infrastructure.
  **Must NOT do**: Do not add cron jobs or background workers, do not leave duplicate lifecycle rules in API and UI, and do not persist status changes from GET requests.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: the ticket changes a core cross-cutting domain rule with multiple consumers
  - Skills: `[]` - domain/backend work only
  - Omitted: [`playwright`, `frontend-ui-ux`, `git-master`] - not needed for this task

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `src/app/api/performances/route.ts:56` - GET path currently auto-updating `performance.status`
  - Pattern: `src/app/api/singers/[id]/route.ts:27` - second GET path currently auto-updating `performance.status`
  - Pattern: `src/utils/performance.ts:1` - current client-side effective status helper and spelling drift source
  - Pattern: `src/app/singer/live/page.tsx:217` - UI consumer currently using `getEffectiveStatus`
  - API/Type: `prisma/schema.prisma:79` - persisted performance fields available to the shared lifecycle resolver
  - Test: `test-suite/README.md:32` - existing test suite claims auto-status coverage; update implementation to match refreshed contract

  **Acceptance Criteria** (agent-executable only):
  - [ ] `node test-suite/lifecycle/read-only.test.js --case get-performances-no-db-write --out test-suite/results/lifecycle-performances-no-write.json`
  - [ ] `node test-suite/lifecycle/read-only.test.js --case get-singer-no-db-write --out test-suite/results/lifecycle-singer-no-write.json`
  - [ ] `node test-suite/lifecycle/read-only.test.js --case stale-scheduled-exposed-consistently --out test-suite/results/lifecycle-consistency.json`
  - [ ] `node test-suite/lifecycle/read-only.test.js --case canceled-status-normalized --out test-suite/results/lifecycle-canceled-normalized.json`
  - [ ] `npm run build`

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```text
  Scenario: Repeated GET requests do not mutate persisted data
    Tool: Bash
    Steps: Run `node test-suite/lifecycle/read-only.test.js --case get-performances-no-db-write --out test-suite/results/lifecycle-performances-no-write.json` and `node test-suite/lifecycle/read-only.test.js --case get-singer-no-db-write --out test-suite/results/lifecycle-singer-no-write.json`
    Expected: Both artifacts report identical effective lifecycle classification before/after repeated reads and unchanged persisted fixture status metadata
    Evidence: .sisyphus/evidence/task-3-lifecycle-read-only.txt

  Scenario: Lifecycle output stays consistent for stale and canceled records
    Tool: Bash
    Steps: Run `node test-suite/lifecycle/read-only.test.js --case stale-scheduled-exposed-consistently --out test-suite/results/lifecycle-consistency.json` and `node test-suite/lifecycle/read-only.test.js --case canceled-status-normalized --out test-suite/results/lifecycle-canceled-normalized.json`
    Expected: Scheduled-in-the-past fixtures resolve consistently across API/UI consumers; canceled/cancelled inputs normalize to one public contract without DB writes
    Evidence: .sisyphus/evidence/task-3-lifecycle-read-only-error.txt
  ```

  **Commit**: YES | Message: `refactor(lifecycle): centralize live state and remove GET mutations` | Files: `src/app/api/performances/route.ts`, `src/app/api/singers/[id]/route.ts`, shared lifecycle helper files, `src/utils/performance.ts`, lifecycle tests

- [ ] 4. Remove Client Authority from the Realtime Control Plane

  **What to do**: Rework the realtime path so the socket layer no longer grants privilege based on claimed `userType`, `capacity`, or direct control events from the browser. Privileged actions such as open chat, end performance, system alerts, and donation/system event emission must be authorized through server-verified app paths first, then broadcast through sockets. Redis stores ephemeral history/cache only and must not become the authorization source.
  **Must NOT do**: Do not leave `open_chat`, `performance_ended`, or `system_alert` callable as privileged actions from arbitrary socket clients; do not keep closed-chat history visible to unauthorized viewers; do not use client payload capacity as the room limit source.

  **Recommended Agent Profile**:
  - Category: `ultrabrain` - Reason: this is cross-process authority redesign with race and reconnection edge cases
  - Skills: `[]` - backend/realtime reasoning is the focus
  - Omitted: [`playwright`, `frontend-ui-ux`, `git-master`] - not primary tools for socket hardening

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 5 | Blocked By: 2, 3

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `realtime-server/server.js:42` - current join flow trusting claimed `userType`
  - Pattern: `realtime-server/server.js:74` - `open_chat` currently accepted from socket payload
  - Pattern: `realtime-server/server.js:91` - `send_message` currently trusts payload context
  - Pattern: `realtime-server/server.js:102` - `system_alert` currently spoofable
  - Pattern: `realtime-server/server.js:132` - `donation_received` currently spoofable
  - Pattern: `realtime-server/server.js:147` - `chat_status_toggled` currently payload-driven
  - Pattern: `realtime-server/server.js:172` - `performance_ended` currently payload-driven
  - Pattern: `src/app/singer/live/page.tsx:93` - current client emits `open_chat`
  - Pattern: `src/app/singer/live/page.tsx:226` - current client emits system alerts directly
  - Pattern: `src/app/singer/live/page.tsx:251` - current client emits `performance_ended`
  - Pattern: `src/app/singer/live/page.tsx:321` - current client emits song-status updates straight to sockets
  - API/Type: `prisma/schema.prisma:79` - authoritative performance state remains in Prisma

  **Acceptance Criteria** (agent-executable only):
  - [ ] `node test-suite/realtime/authority.test.js --case audience-open-chat-denied --out test-suite/results/realtime-audience-open-chat.json`
  - [ ] `node test-suite/realtime/authority.test.js --case audience-end-performance-denied --out test-suite/results/realtime-audience-end.json`
  - [ ] `node test-suite/realtime/authority.test.js --case forged-system-alert-rejected --out test-suite/results/realtime-forged-alert.json`
  - [ ] `node test-suite/realtime/authority.test.js --case owner-open-chat-allowed --out test-suite/results/realtime-owner-open-chat.json`
  - [ ] `node test-suite/realtime/authority.test.js --case owner-end-performance-allowed --out test-suite/results/realtime-owner-end.json`
  - [ ] `npm run build`

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```text
  Scenario: Owning singer can trigger an authorized realtime control action
    Tool: Bash
    Steps: Run `node test-suite/realtime/authority.test.js --case owner-open-chat-allowed --out test-suite/results/realtime-owner-open-chat.json` and `node test-suite/realtime/authority.test.js --case owner-end-performance-allowed --out test-suite/results/realtime-owner-end.json`
    Expected: Both artifacts show server-verified owner context, successful control transition, and corresponding broadcast observed by subscribed test clients
    Evidence: .sisyphus/evidence/task-4-realtime-authority.txt

  Scenario: Forged audience socket cannot escalate privilege
    Tool: Bash
    Steps: Run `node test-suite/realtime/authority.test.js --case audience-open-chat-denied --out test-suite/results/realtime-audience-open-chat.json`, `node test-suite/realtime/authority.test.js --case audience-end-performance-denied --out test-suite/results/realtime-audience-end.json`, and `node test-suite/realtime/authority.test.js --case forged-system-alert-rejected --out test-suite/results/realtime-forged-alert.json`
    Expected: All artifacts show rejected privileged actions, no unauthorized state change, and no privileged broadcast emitted to room subscribers
    Evidence: .sisyphus/evidence/task-4-realtime-authority-error.txt
  ```

  **Commit**: YES | Message: `fix(realtime): enforce authoritative live-control boundaries` | Files: `realtime-server/server.js`, privileged control entrypoints in app routes/actions, realtime tests, any shared auth handshake helpers

- [ ] 5. Refresh Regression and Smoke Coverage for the New Trust Model

  **What to do**: Bring the existing `test-suite` into alignment with the refreshed contracts so that the final smoke path actually verifies priorities 1-3. Replace stale assumptions in `api-tester.js` and `chat-tester.js`, keep JSON result artifacts under `test-suite/results/`, and add one final automated smoke path that exercises authenticated singer control and anonymous audience read access.
  **Must NOT do**: Do not leave outdated event names or response shapes in place, do not rely on browser clicking as the only validation path, and do not expand this into a full new test framework rollout.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: this is primarily regression/tooling alignment after the core behavior is fixed
  - Skills: [`playwright`] - useful for one final scripted browser smoke across singer/audience flows
  - Omitted: [`frontend-ui-ux`, `git-master`] - not relevant to regression alignment

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: none | Blocked By: 2, 3, 4

  **References** (executor has NO interview context — be exhaustive):
  - Test: `test-suite/api-tester.js:35` - currently assumes `data.items`, which does not match `/api/performances`
  - Test: `test-suite/chat-tester.js:36` - currently listens for `join_room_success` and `new_message`, which the current server does not emit
  - Test: `test-suite/README.md:13` - current claimed one-click flow to keep updated after contract changes
  - Pattern: `src/app/api/performances/route.ts:112` - actual performance API response shape to match in refreshed smoke tests
  - Pattern: `realtime-server/server.js:33` - actual message fanout event used by the realtime server
  - Pattern: `src/app/singer/live/page.tsx:540` - chat component contract to preserve during smoke coverage

  **Acceptance Criteria** (agent-executable only):
  - [ ] `node test-suite/api-tester.js`
  - [ ] `node test-suite/chat-tester.js`
  - [ ] `powershell -ExecutionPolicy Bypass -File .\test-suite\one-click-test.ps1`
  - [ ] `npx playwright test tests/live-auth-smoke.spec.ts`
  - [ ] `npm run lint`
  - [ ] `npm run build`

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```text
  Scenario: Updated smoke scripts validate backend and realtime contracts
    Tool: Bash
    Steps: Run `node test-suite/api-tester.js`, `node test-suite/chat-tester.js`, and `powershell -ExecutionPolicy Bypass -File .\test-suite\one-click-test.ps1`
    Expected: All commands exit `0`, and `test-suite/results/one-click-summary.json` reports `pass: true` with auth, lifecycle, and realtime sections marked passed
    Evidence: .sisyphus/evidence/task-5-regression-smoke.txt

  Scenario: Browser smoke preserves owner control and anonymous read-only access
    Tool: Playwright
    Steps: Run `npx playwright test tests/live-auth-smoke.spec.ts` against a seeded local stack where one singer owns the target performance and one anonymous viewer opens the public live page
    Expected: Singer flow can perform authorized control actions; anonymous viewer can read the live page but cannot trigger protected mutations; report artifacts are generated
    Evidence: .sisyphus/evidence/task-5-regression-smoke-error.txt
  ```

  **Commit**: YES | Message: `test(qa): refresh smoke coverage for auth realtime and lifecycle` | Files: `test-suite/*`, `tests/live-auth-smoke.spec.ts`, supporting result helpers

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Manual QA - unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check - deep

## Commit Strategy
- One atomic commit per task after its QA passes; do not commit red checkpoints.
- Recommended sequence: foundation -> auth -> lifecycle -> realtime -> regression.
- Keep security/lifecycle/realtime work reviewable and revertable independently.

## Success Criteria
- Anonymous public reads still work for discovery and live viewing.
- Unauthenticated writes fail with `401`; authenticated non-owners fail with `403`; owners succeed.
- GET routes no longer mutate Prisma state.
- Socket clients cannot gain control by claiming a privileged role in payloads.
- Redis is not used as an authorization or canonical lifecycle source.
- Final verification commands exit `0` and emit expected evidence artifacts.
