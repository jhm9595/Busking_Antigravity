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

## Phase2: Audience Experience (Priority 2 - LOW COST, HIGH UTILITY ⭐)

### 2.1 Countdown Timer (10s before switch)
**Status**: pending
**What**: Add JS timer to `src/app/live/[id]/page.tsx` to show countdown at 30min/10min/5min/10s before performance.
**Cost**: 0 (frontend only)
**Files**: `src/app/live/[id]/page.tsx`

### 2.2 Chat History Download
**Status**: pending
**What**: Connect existing `downloadChatAsText()` utility to UI button after performance ends.
**Cost**: 0 (already implemented in `src/utils/chatDownload.ts`)
**Files**: `src/app/live/[id]/page.tsx`

### 2.3 Explore Map/Grid Toggle
**Status**: pending
**What**: Add toggle button in `src/app/explore/page.tsx` to switch between grid view and Leaflet map view.
**Cost**: 0 (Leaflet already installed)
**Files**: `src/app/explore/page.tsx`

### 2.4 Avatar Selection UI (Audience)
**Status**: pending
**What**: Reuse Singer.hairColor/topColor/bottomColor fields for audience avatar selection UI.
**Cost**: Low (extend existing fields)
**Files**: New `src/components/audience/AvatarSelector.tsx`

### 2.5 Web Push Notifications
**Status**: pending
**What**: Service Worker + Web Push API for 30min/10min/5min before performance.
**Cost**: Medium (standard approach, skip FCM)
**Files**: `public/sw.js`, `src/hooks/usePush.ts`, `prisma/schema.prisma` (Profile.pushToken)

---

## Phase3: Singer Dashboard (Priority 3 - MEDIUM COST)

### 3.1 Pad Split View (CSS Responsive)
**Status**: pending
**What**: Improve `src/app/live/[id]/page.tsx` for Pad: left=setlist, right=reactions+chat.
**Cost**: Low (CSS media queries)
**Files**: `src/app/live/[id]/page.tsx`

### 3.2 Dashboard Config Storage
**Status**: pending
**What**: Add `dashboardConfig` JSON field to Singer model for layout preferences.
**Cost**: Medium (Prisma migration)
**Files**: `prisma/schema.prisma`, `src/app/singer/dashboard/page.tsx`

### 3.3 Team Features
**Status**: pending
**What**: Implement team formation, member management using Singer.teamId.
**Cost**: Medium
**Files**: `prisma/schema.prisma` (Team model?), `src/app/singer/team/`

---

## Phase4: AdSense Approval (Priority 4 - LOW COST)

### 4.1 Robots & Sitemap
**Status**: pending
**What**: Add `src/app/robots.ts`, `src/app/sitemap.ts`, allow Mediapartners-Google.
**Cost**: 0
**Files**: `src/app/robots.ts`, `src/app/sitemap.ts`

### 4.2 Public Pages (About/Privacy/Terms/Contact)
**Status**: pending
**What**: Create static pages with Korean content, disclose Google cookies.
**Cost**: Low
**Files**: `src/app/about/page.tsx`, etc.

### 4.3 Guide Content (20 articles)
**Status**: pending
**What**: Write 20 Korean guide articles, build `/guides` system.
**Cost**: Low (content only)
**Files**: `src/app/guides/`, `src/content/guides/`

---

## Phase5: Deferred to Future (Low Priority, High Cost)

### 5.1 Team Features (if not done in Phase3)
### 5.2 Streaming (activate `streamingEnabled`)
### 5.3 Admin Dashboard (if traffic grows)
### 5.4 Venue Provider (if needed later)

---

## Phase6: Dropped (Unnecessary per User Request)

- ❌ AWS Docker Chat Server (current Socket.io is fine)
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
