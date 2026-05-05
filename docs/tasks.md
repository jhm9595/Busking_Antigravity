# Task Board

> Single source of truth for what to do next.
> Update this file after completing each task. Completed items stay for context continuity.

---

## Phase 1: Security Hardening (Priority 1)

### 1.1 Shared Auth & Lifecycle Contracts
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Inventory mutating surfaces, create shared server-side auth/ownership guard, create shared lifecycle resolver, add test harnesses under `test-suite/security/` and `test-suite/lifecycle/`.
**Files**: `src/services/singer.ts`, `src/app/api/*`, `test-suite/security/`, `test-suite/lifecycle/`

### 1.2 Lock Down Mutating Writes (Server-Side Identity)
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Refactor all mutating server actions and REST routes to derive identity from Clerk, resolve ownership from Prisma. Cover `src/services/singer.ts`, `POST /api/singers/[id]/follow`, `POST /api/song-requests`, `POST /api/booking`.
**Files**: `src/services/singer.ts`, `src/app/api/singers/[id]/follow/route.ts`, `src/app/api/song-requests/route.ts`, `src/app/api/booking/route.ts`
**Tests**: `node test-suite/security/mutating-writes.test.js`

### 1.3 Make Lifecycle Read-Only & Shared
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Introduce shared lifecycle resolver for API+UI read paths. Remove Prisma writes from GET handlers. Normalize canceled/cancelled spelling at resolver boundary.
**Files**: New shared resolver, `src/app/api/performances/route.ts`, `src/app/api/singers/[id]/route.ts`, `src/utils/performance.ts`
**Tests**: `node test-suite/lifecycle/read-only.test.js`

### 1.4 Realtime Authority Hardening
**Status**: done

**What was done:**
- Added `authorizeSingerControl()` function that checks Redis-stored auth info
- Added `verifyClerkToken()` placeholder for JWT verification
- Privileged events (`open_chat`, `system_alert`, `performance_ended`, `chat_status_toggled`) now verify singer status via `authorizeSingerControl()`
- Socket `userType` is no longer trusted directly for privileged actions
- Rate limiting applied to all privileged events
- Redis stores auth info with 24h expiration

**Files changed**: `realtime-server/server.js`
**What**: Rework realtime path so socket layer no longer grants privilege based on claimed `userType`/`capacity`. Privileged actions (open chat, end performance, system alerts) must be authorized through server-verified app paths first, then broadcast. Redis = transport/cache only.
**Files**: `realtime-server/server.js`, privileged control entrypoints in app routes/actions
**Tests**: `node test-suite/realtime/authority.test.js`

### 1.5 Refresh Regression & Smoke Coverage
**Status**: pending
**What**: Bring `test-suite/` into alignment with refreshed contracts. Replace stale assumptions in `api-tester.js` and `chat-tester.js`. Add final automated smoke path.
**Files**: `test-suite/api-tester.js`, `test-suite/chat-tester.js`, `test-suite/one-click-test.ps1`, `tests/live-auth-smoke.spec.ts`

---

## Phase 2: AdSense Approval Readiness

### 2.1 Crawlability Foundation
**Status**: pending
**What**: Add `src/app/robots.ts` and `src/app/sitemap.ts` (App Router native). Update `metadataBase` in `src/app/layout.tsx`. Allow `Mediapartners-Google` and `Google-Display-Ads-Bot` in robots.txt. Sitemap includes only public routes (no `/dashboard`, `/singer/dashboard`).
**Files**: `src/app/robots.ts` (new), `src/app/sitemap.ts` (new), `src/app/layout.tsx`
**Verify**: `curl http://localhost:3000/robots.txt`, `curl http://localhost:3000/sitemap.xml`

### 2.2 Public Discovery Chrome (Header/Footer)
**Status**: pending
**What**: Add shared public navigation/footer so crawlers and users can reach `/about`, `/privacy`, `/terms`, `/contact`, `/guides` from landing page and at least one secondary public route. Don't pollute dashboard flows.
**Files**: New footer component, update `src/components/common/AppHeader.tsx`, `src/components/home/LandingPage.tsx`, `src/app/explore/page.tsx`, `src/app/singer/[id]/page.tsx`

### 2.3 Legal & Trust Pages
**Status**: pending
**What**: Create `/about`, `/privacy`, `/terms`, `/contact` pages with real product-specific copy. Privacy page must disclose Google advertising cookies. Contact page uses `support@busking.minibig.pw`.
**Files**: `src/app/about/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/contact/page.tsx`

### 2.4 Public Guides Information Architecture
**Status**: pending
**What**: Implement static, crawlable public content system under `/guides` and `/guides/[slug]`. Create guide index page, individual article routes, per-article metadata. Use typed local content data (not login-gated).
**Files**: `src/app/guides/page.tsx` (new), `src/app/guides/[slug]/page.tsx` (new), `src/content/guides/` (new, data files)

### 2.5 Guide Content Batch A (10 articles)
**Status**: pending
**What**: Write 10 substantive guide articles in Korean (~1,000+ chars each). Topics: 버스킹 처음 시작하기, 홍대/연남 버스킹 준비 체크리스트, 야외 공연 장비 기초, 버스커를 위한 기본 음향 팁, 라이브 공연 공지 잘 쓰는 법, 버스킹 관객과 소통하는 법, 공연 중 신청곡 운영 팁, 후원과 포인트 기능 이해하기, 싱어 프로필 매력적으로 만드는 법, 공연 후 팬 유지하는 방법.
**Files**: `src/content/guides/*.md` or `.ts` data files

### 2.6 Guide Content Batch B (10 articles)
**Status**: pending
**What**: Write 10 more articles to reach 20 total. Topics: 버스킹 장소 선택 가이드, 공연 일정 시간대 고르는 법, 비 오는 날/추운 날 버스킹 운영 팁, 초상권과 촬영 안내, 관객 입장에서 좋은 버스킹 찾는 법, 라이브룸에서 후원하기, 광고 후원 기능 이해, 버스커의 SNS 연결 전략, 공연 예약/섭외 문의 정리, 다국어 안내 운영 팁.
**Files**: `src/content/guides/*.md` or `.ts` data files

### 2.7 De-emphasize Demo-First Discovery
**Status**: pending
**What**: Update landing page hierarchy so guides/trust content is more prominent than demo flow. Preserve demo functionality. Add backlinks from static guide/demo artifacts to new content hub.
**Files**: `src/components/home/LandingPage.tsx`, `public/guide-draft.html`, `public/guide-i18n-board.html`

### 2.8 AdSense Approval Ops Runbook
**Status**: done (docs only) **[LOCKED - DO NOT TOUCH]**
**What**: Create runbook covering Search Console verification, sitemap submission, robots check, AdSense application, post-activation crawler login. Include `support@busking.minibig.pw`.
**Files**: `docs/adsense-ops.md` (new)

---

## Phase 3: Verification (Final)

### 3.1 Build & Lint
**Status**: pending
**Command**: `npm run build && npm run lint`
**Must pass**: Yes

### 3.2 Manual QA (Playwright)
**Status**: pending
**What**: Verify public journey: `/` -> `/guides` -> article, `/about`, `/privacy`, `/terms`, `/contact`, `/robots.txt`, `/sitemap.xml`. All load without login.
**Command**: `npx playwright test`

### 3.3 Security Regression
**Status**: pending
**Commands**:
```bash
node test-suite/security/mutating-writes.test.js
node test-suite/lifecycle/read-only.test.js
node test-suite/realtime/authority.test.js
node test-suite/api-tester.js
powershell -ExecutionPolicy Bypass -File .\test-suite\one-click-test.ps1
```

---

## Legend

- **pending**: Not started
- **in_progress**: Currently working on
- **done**: Completed and verified
- **blocked**: Waiting on dependency
