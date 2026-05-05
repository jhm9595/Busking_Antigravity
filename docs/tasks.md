# Task Board

> Single source of truth for what to do next.
> Update this file after completing each task. Completed items stay for context continuity.

---

## Phase1: Security & Basics (Priority 1 - DONE ✅)

### 1.1 Shared Auth & Lifecycle Contracts
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Inventory mutating surfaces, create shared server-side auth/ownership guard.
**Files**: `src/services/singer.ts`, `src/app/api/*`

### 1.2 Lock Down Mutating Writes
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Refactor all mutating routes to derive identity from Clerk.
**Files**: `src/app/api/booking/route.ts`, `src/app/api/song-requests/route.ts`

### 1.3 Make Lifecycle Read-Only
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Remove Prisma writes from GET handlers, use shared `resolvePerformanceStatus`.
**Files**: `src/app/api/singers/[id]/route.ts`, `src/lib/performance-lifecycle.ts`
**Commit**: 80cbe2c

### 1.4 Realtime Authority Hardening
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Stop trusting client-supplied userType, use Redis auth instead.
**Files**: `realtime-server/server.js`
**Commit**: 3d74f19, e410d56

### 1.5 Refresh Regression & Smoke Coverage
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Align test-suite/ with current contracts.
**Files**: `test-suite/api-tester.js`, `test-suite/chat-tester.js`

### 1.6 Fix Anonymous Writes
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Add auth check to POST /api/song-requests and /api/booking.
**Commit**: db6cb20, 80cbe2c

### 1.7 Pre-Deploy Pipeline
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: `npm run predeploy` runs lint, build, security, lifecycle, API smoke.
**Files**: `test-suite/pre-deploy.ps1`, `package.json`
**Commit**: 3a77a84

---

## Phase2: Demo Mode & AdSense (Priority 2 - DONE ✅)

### 2.1 Demo Mode Infrastructure
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: `/demo` route with env-controlled demo mode (NEXT_PUBLIC_DEMO_MODE).
**Files**: `src/lib/demo-mode.ts`, `src/app/demo/`, `src/api/demo/route.ts`
**Commit**: b094e5e

### 2.2 Demo Pages (Singer/Live/Explore)
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: All features visible to crawlers with zero impact on real users.
**Files**: `src/app/demo/layout.tsx`, `src/app/demo/page.tsx`, `src/app/demo/singer/[id]/page.tsx`, `src/app/demo/live/[id]/page.tsx`, `src/app/demo/explore/page.tsx`
**Commit**: b094e5e

### 2.3 Robots.txt & Sitemap
**Status**: done **[LOCKED - DO NOT TOUCH]**
**What**: Allow Mediapartners-Google, disallow /dashboard, /live, /api/.
**Files**: `src/app/robots.ts`, `src/app/sitemap.ts`
**Commit**: e04d7ed

### 2.4 Why AdSense Keeps Rejecting Us
**Status**: analyzed **[LOCKED - DO NOT TOUCH]**
**Reason**: **Low-value content** - not enough unique, substantial pages.
**Fix**: Write 20+ Korean guide articles (each 1,000+ chars) → Phase 3.

---

## Phase3: Content for AdSense (Priority 3 - IN PROGRESS ⭐)

### 3.1 Write Guide Articles Batch A (10 articles)
**Status**: done ✅
**What**: Write 10 Korean guide articles (~1,000+ chars each).
**Topics**: 버스킹 처음 시작하기, 홍대/연남 준비 체크리스트, 야외 공연 장비 기초, 버스커 음향 팁, 라이브 공연 공지 잘 쓰는 법, 버스킹 관객과 소통하는 법, 공연 중 신청곡 운영 팁, 후원과 포인트 기능 이해하기, 싱어 프로필 매력적으로, 공연 후 팬 유지하는 방법.
**Cost**: Low (content only)
**Files**: `src/content/guides/guides-ko.md`
**Commit**: (uncommitted)

### 3.2 Write Guide Articles Batch B (10 articles)
**Status**: done ✅
**What**: Write 10 more articles to reach 20 total.
**Topics**: 버스킹 장소 선택 가이드, 공연 일정 시간대 고르는 법, 비 오는 날/추운 날 운영 팁, 초상권과 촬영 안내, 관객이 좋은 버스킹 찾는 법, 라이브룸 후원하기, 광고 후원 기능, 버스커 SNS 연결 전략, 공연 예약/섭외 정리, 다국어 안내.
**Cost**: Low (content only)
**Files**: `src/content/guides/guides-ko.md`
**Commit**: (uncommitted)

### 3.3 Build Guides Directory
**Status**: done ✅
**What**: Create `/guides` page and `/guides/[slug]` pages using static content.
**Cost**: Low
**Files**: `src/app/guides/page.tsx`, `src/app/guides/[slug]/page.tsx`, `src/content/guides/`
**Commit**: (uncommitted)

### 3.4 Public Pages (About/Privacy/Terms/Contact)
**Status**: done ✅
**What**: Create static pages with Korean content, disclose Google cookies.
**Cost**: Low
**Files**: `src/app/about/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/contact/page.tsx`
**Commit**: (uncommitted)

---

## Phase4: Audience Experience (Priority 4 - LOW COST)

### 4.1 Countdown Timer (10s before switch)
**Status**: pending
**What**: Add JS timer to `src/app/live/[id]/page.tsx` for 30min/10min/5min/10s alerts.
**Cost**: 0 (frontend only)

### 4.2 Chat History Download
**Status**: pending
**What**: Connect `downloadChatAsText()` utility to UI button.
**Cost**: 0 (already implemented)

### 4.3 Explore Map/Grid Toggle
**Status**: pending
**What**: Toggle button in explore page.
**Cost**: 0 (Leaflet already installed)

### 4.4 Avatar Selection UI
**Status**: pending
**What**: Reuse Singer.hairColor/topColor/bottomColor for audience.
**Cost**: Low

---

## Phase5: Singer Dashboard (Priority 5 - MEDIUM COST)

### 5.1 Pad Split View (CSS Responsive)
**Status**: pending
**What**: Improve live page for Pad: left=setlist, right=reactions+chat.
**Cost**: Low (CSS)

### 5.2 Dashboard Config Storage
**Status**: pending
**What**: Add `dashboardConfig` JSON field to Singer model.
**Cost**: Medium (Prisma migration)

### 5.3 Team Features
**Status**: pending
**What**: Implement team formation using Singer.teamId.
**Cost**: Medium

---

## Phase6: Deferred to Future (Low Priority, High Cost)

- ❌ Team Features (if not done in Phase5)
- ❌ Streaming (activate `streamingEnabled`)
- ❌ Admin Dashboard (if traffic grows)
- ❌ Venue Provider (if needed later)

---

## Phase7: Dropped (Unnecessary per User Request)

- ❌ AWS Docker Chat Server (Socket.io is fine)
- ❌ AWS Scale-up (manual monitoring sufficient)
- ❌ ApplePay, NaverPay (Stripe+KakaoPay sufficient)
- ❌ AirDrop share (iOS usage low)
- ❌ Venue Provider (singer self-registration is fine)
- ❌ Corporate Ads (AdSense instead)
- ❌ Grade/Tier System (complex, low initial need)
- ❌ 30-min Venue Booking Unit (unnecessary)

---

## Legend

- **pending**: Not started
- **in_progress**: Currently working on
- **done**: Completed and verified
- **blocked**: Waiting on dependency
- **[LOCKED - DO NOT TOUCH]**: Do NOT modify completed work
