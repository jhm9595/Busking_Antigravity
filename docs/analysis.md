# 프로젝트 전체 분석 리포트

> ULTRAWORK MODE 분석 결과 (2026-05-05)
> 분석자: Sisyphus (단일 AI 오케스트레이터)

---

## 1. 프로젝트 개요

**프로젝트명**: minimic (Busking_Antigravity)
**목적**: 버스킹(거리 공연) 플랫폼 - 싱어와 관객을 연결하는 실시간 인터랙티브 웹 서비스
**기술 스택**: Next.js 16 (App Router), TypeScript, Prisma + PostgreSQL, Socket.io, Clerk Auth, Stripe, Tailwind CSS 4, Framer Motion

---

## 2. 사용자 유형 및 권한 (User Types & Permissions)

### 2.1 사용자 유형 정의

| 유형 | 식별 방법 | DB 모델 | 설명 |
|------|------------|---------|------|
| **Guest (비로그인)** | `userId = null` | 없음 | 둘러보기만 가능 |
| **Audience (관객)** | Clerk 로그인 + `Profile.role = "audience"` | `Profile` | 팔로우, 후원, 채팅 가능 |
| **Singer (싱어)** | Clerk 로그인 + `Singer` 레코드 존재 | `Profile` + `Singer` | 공연 등록/진행, 대시보드 사용 |
| **Admin (관리자)** | (미구현) | - | - |

### 2.2 각 사용자별 가능한 기능

#### Guest (비로그인)
- [x] 랜딩 페이지 확인 (`/`)
- [x] 공연 둘러보기 (`/explore`) - 지도/리스트 뷰
- [x] 싱어 프로필 조회 (`/singer/[id]`)
- [x] 라이브 공연 시청 (`/live/[id]`) - 닉네임 입력 시 채팅 가능
- [x] 가이드 읽기 (`/guides`, `/guides/[slug]`)
- [x] 법적 페이지 (`/about`, `/privacy`, `/terms`, `/contact`)
- [ ] 로그인 필요: 팔로우, 후원, 요청곡, 공연 등록

#### Audience (관객 - 로그인)
- [x] Guest 기능 전체
- [x] Clerk 로그인 (`/sign-in`, `/sign-up`)
- [x] 싱어 팔로우/언팔로우 (API: `POST /api/singers/[id]/follow`)
- [x] 요청곡 보내기 (API: `POST /api/song-requests`, 소켓: `song_requested`)
- [x] 포인트 후원하기 (API: `POST /api/points`, 서비스: `sponsorSinger`)
- [x] Stripe 포인트 충전 (API: `POST /api/payment/kakao/...`)
- [x] 북킹 요청 (`POST /api/booking`)
- [x] 라이브 채팅 (소켓: `send_message`)
- [ ] 공연 등록/시작 (싱어 전용)

#### Singer (싱어 - 로그인 + Singer 레코드)
- [x] Audience 기능 전체
- [x] 싱어 대시보드 (`/singer/dashboard`)
- [x] 공연 등록 (`POST /api/performances` - 서버 인증됨 ✓)
- [x] 공연 시작/종료 (`/singer/live?performanceId=xxx`)
- [x] 세트리스트 관리 (곡 추가/삭제/순서 변경)
- [x] 요청곡 수락/거절 (`acceptSongRequest`, `rejectSongRequest`)
- [x] 라이브 채팅 열기/닫기 (포인트 소모, `usePointsForChat`)
- [x] 시스템 알림 발송 (`system_alert`)
- [x] QR 코드 생성 (팬 유입용)
- [x] 북킹 요청 관리 (`/singer/dashboard` - BookingRequestsList)
- [x] 프로필 수정 (bio, socialLinks, 색상 등)
- [x] 곡(레퍼토리) 관리 (`/singer/dashboard` - SongManagement)

---

## 3. 프로세스 플로우 (Process Flows)

### 3.1 공연 라이프사이클 (Performance Lifecycle)

```
[싱어] 공연 등록 (/singer/dashboard → POST /api/performances)
    ↓ (포인트 차감: 시간당 1000포인트)
[DB] status = 'scheduled'
    ↓ (시작 시간 도달 또는 싱어가 "시작" 클릭)
[GET /api/singers/[id]] → status 자동 변경 (scheduled → live) ← ⚠ 문제: GET 핸들러에서 DB 쓰기!
    ↓
[싱어] 라이브 시작 (/singer/live?performanceId=xxx)
    ↓ (Socket.io: join_room, userType='singer')
[실시간] 채팅 열기 (open_chat → Redis: live_status:xxx = 'open')
    ↓
[관객] 시청 (/live/[id]) → join_room (userType='audience')
    ↓
[실시간] 요청곡, 채팅, 후원 진행
    ↓
[싱어] 공연 종료 (performance_ended → DB: status='completed')
```

### 3.2 실시간 통신 플로우 (Realtime Flow)

```
[클라이언트] socket.emit('join_room', { performanceId, username, userType })
    ↓ (realtime-server/server.js)
[서버] 소켓 데이터 저장 (socket.data = { performanceId, userType, username })
    ↓
[서버] io.in(performanceId).emit('update_viewing_count')
    ↓
[서버] Redis에서 채팅 상태 확인 → 'chat_status' emit
    ↓
[서버] Redis에서 히스토리 로드 → 'load_history' emit
    
[싱어] socket.emit('open_chat', { performanceId })
    ↓ (authorizeSingerControl() 확인 - Redis 인증 정보)
[서버] Redis: live_status:xxx = 'open'
    ↓
[서버] io.in(performanceId).emit('chat_status', { status: 'open' })
    ↓
[서버] broadcastAndStore() → 시스템 메시지 방송

[관객] socket.emit('send_message', { message, username })
    ↓ (채팅 열려 있을 때만)
[서버] broadcastAndStore() → io.in(performanceId).emit('receive_message')

[싱어] socket.emit('performance_ended', { performanceId })
    ↓ (authorizeSingerControl() 확인)
[서버] io.in(performanceId).emit('performance_ended')
```

### 3.3 포인트 시스템 플로우 (Points System Flow)

```
[신규 가입] syncUserProfile() → Profile 생성 + 2000 포인트 지급
    ↓
[싱어] 공연 등록 → 포인트 차감 (시간당 1000)
    ↓ (prisma.transaction)
[DB] Profile.points 감소 + PointTransaction 기록 (type: 'PERFORMANCE_REGISTER')
    
[관객] 포인트 충전 → POST /api/payment/kakao/...
    ↓
[Stripe/KakaoPay] 결제 성공 → webhook → Profile.points 증가
    ↓
[DB] PointTransaction 기록 (type: 'CHARGE')
    
[관객] 후원하기 → sponsorSinger(fanId, singerId, amount)
    ↓ (prisma.transaction)
[DB] 팬 포인트 감소 + 싱어 포인트 증가
    ↓
[DB] PointTransaction 2건 기록 (type: 'SPONSORSHIP', 'REWARD')
    
[싱어] 채팅 열기 → usePointsForChat() → 100 포인트 차감
    ↓
[DB] Profile.points 감소 + PointTransaction 기록 (type: 'CHAT_OPEN')
```

### 3.4 인증 플로우 (Authentication Flow)

```
[방문자] / → 랜딩 페이지
    ↓ (데모 체험 버튼 클릭)
[클라이언트] POST /api/demo (action: 'ensure')
    ↓
[서버] 데모 데이터 설정 → form submit → /auth/demo
    ↓
[Clerk] 데모 계정으로 자동 로그인
    ↓
[콜백] /auth/callback → /singer/dashboard (싱어) 또는 / (비싱어)

[신규 가입] /sign-up → Clerk 회원가입
    ↓
[콜백] syncUserProfile() → Profile 생성 (role: 'audience', points: 2000)
    ↓
[싱어 등록] registerSinger() → Profile.role = 'singer', Singer 레코드 생성
```

---

## 4. 기능별 상세 매핑 (Feature Mapping)

### 4.1 페이지별 기능

| 페이지 경로 | 컴포넌트 | 기능 | 접근 권한 |
|------------|---------|------|----------|
| `/` (page.tsx) | LandingPage | 서비스 소개, 데모 체험, 로그인/회원가입 | 모두 |
| `/explore` (page.tsx) | ExplorePage | 지도/리스트 뷰, 필터링, 검색, 팔로우 | 모두 |
| `/singer/dashboard` (page.tsx) | SingerDashboard | 공연 관리, 곡 관리, 북킹 요청, QR코드, 팬 목록 | 싱어만 |
| `/singer/live` (page.tsx) | LivePerformanceContent | 3패널(세트리스트/요청곡/채팅), 공연 제어 | 해당 공연 싱어 |
| `/live/[id]` (page.tsx) | AudienceLivePage | 실시간 시청, 채팅, 요청곡, 후원 | 모두 |
| `/singer/[id]` (page.tsx) | (API: /api/singers/[id]) | 싱어 정보, 공연 이력, 팔로우, 북킹 | 모두 |
| `/about`, `/privacy`, `/terms`, `/contact` | (각 page.tsx) | 법적 페이지 (AdSense 승인용) | 모두 |
| `/guides`, `/guides/[slug]` | (page.tsx) | 가이드 아티클 (AdSense용) | 모두 |
| `/sign-in/*`, `/sign-up/*` | Clerk | 인증 페이지 | 비로그인 |
| `/auth/demo` | Clerk | 데모 로그인 처리 | 비로그인 |
| `/api/demo` (route.ts) | - | 데모 데이터 설정 | 비로그인 |

### 4.2 API 라우트별 기능

| API 경로 | 메서드 | 기능 | 인증 | 권한 |
|----------|--------|------|------|------|
| `/api/performances` | GET | 공연 목록 조회 (필터: live/scheduled/followed) | 불필요 | 모두 |
| `/api/performances` | POST | 공연 등록 | Clerk (서버 파생) | 싱어 (본인 확인 ✓) |
| `/api/performances/[id]` | GET | 공연 상세 조회 | 불필요 | 모두 |
| `/api/singers/[id]` | GET | 싱어 프로필 + 공연 목록 | 불필요 | 모두 (⚠ GET에서 DB 쓰기!) |
| `/api/singers/[id]` | PATCH | 싱어 프로필 수정 | Clerk (서버 파생) | 본인만 |
| `/api/singers/[id]/follow` | POST | 팔로우 토글 | Clerk (서버 파생) | 로그인 사용자 |
| `/api/singers/[id]/followers` | GET | 팔로워 목록 | Clerk (서버 파생) | 싱어 본인 |
| `/api/song-requests` | POST | 요청곡 생성 | ⚠ **없음!** (auth() 주석처리됨) | **익명 가능!** |
| `/api/booking` | POST | 북킹 요청 | ⚠ **없음!** | **익명 가능!** |
| `/api/points` | GET | 포인트 조회 | Clerk (서버 파생) | 본인만 |
| `/api/points` | POST | 포인트 충전 | Clerk (서버 파생) | 본인만 |
| `/api/setlist` | POST/PATCH | 세트리스트 관리 | Clerk (서버 파생) | 싱어 (본인 확인 필요) |
| `/api/payment/kakao/*` | POST | 카카오페이 결제 | Clerk (서버 파생) | 본인만 |
| `/api/ad/check`, `/api/ad/complete`, `/api/ad/reward` | POST | AdSense 보상 | Clerk (서버 파생) | 로그인 사용자 |

### 4.3 소켓 이벤트 (Socket.io)

| 이벤트 | 발신자 | 기능 | 권한 확인 |
|--------|--------|------|----------|
| `join_room` | 모두 | 공연 룸 참여 | userType 검증 (클라이언트 제공 - ⚠ 신뢰 문제) |
| `send_message` | 모두 | 메시지 전송 | 채팅 상태 확인 |
| `open_chat` | 싱어 | 채팅창 열기 | authorizeSingerControl() ✓ |
| `system_alert` | 싱어 | 시스템 알림 | authorizeSingerControl() ✓ |
| `song_requested` | 관객 | 요청곡 방송 | 없음 |
| `donation_received` | 싱어 | 후원 알림 | 금액 검증만 |
| `chat_status_toggled` | 싱어 | 채팅 상태 변경 | authorizeSingerControl() ✓ |
| `song_status_updated` | 싱어 | 곡 상태 변경 | 없음 |
| `performance_ended` | 싱어 | 공연 종료 | authorizeSingerControl() ✓ |

### 4.4 서비스 함수 (src/services/singer.ts)

| 함수명 | 기능 | 인증 방식 |
|--------|------|----------|
| `syncUserProfile()` | Clerk 사용자 → DB 동기화 | Clerk ID (서버 파생) ✓ |
| `registerSinger()` | 싱어 등록 | Clerk ID (서버 파생) ✓ |
| `updateSingerProfile()` | 싱어 프로필 수정 | singerId (함수 매개변수) - 서버 파생 가정 |
| `getPerformances()` | 공연 목록 조회 | singerId (함수 매개변수) |
| `addPerformance()` | 공연 등록 | singerId (함수 매개변수) - 서버 파생 확인 ✓ |
| `updatePerformanceStatus()` | 공연 상태 변경 | id (함수 매개변수) - 본인 확인 필요 |
| `usePointsForChat()` | 채팅 열기 포인트 차감 | singerId (함수 매개변수) ✓ |
| `sponsorSinger()` | 후원하기 | fanId, singerId (함수 매개변수) ✓ |
| `getSongs()` | 레퍼토리 곡 조회 | singerId (함수 매개변수) |
| `createSongRequest()` | 요청곡 생성 (서버용) | - |
| `acceptSongRequest()` | 요청곡 수락 → 곡 추가 | - |
| `updateSongStatus()` | 곡 상태 변경 | performanceId, songId ✓ |

---

## 5. 발견된 문제점 (Issues Found)

### 5.1 CRITICAL (즉시 수정 필요)

#### ISSUE-001: 익명 사용자가 요청곡 생성 가능
- **파일**: `src/app/api/song-requests/route.ts:7`
- **문제**: `const { userId } = await auth()` 가 주석처리되어 있음 → 익명 사용자도 요청곡 생성 가능
- **영향**: 스팸, 악의적 요청 가능
- **수정**: auth() 사용하여 userId 파생, DB에 requesterName과 함께 저장

#### ISSUE-002: 익명 사용자가 북킹 요청 가능
- **파일**: `src/app/api/booking/route.ts`
- **문제**: 인증 확인 없음 → 익명 사용자도 북킹 요청 가능
- **영향**: 스팸, 가짜 정보로 요청 가능
- **수정**: `auth()` 추가하여 userId 파생, contactInfo와 함께 저장

#### ISSUE-003: GET 핸들러에서 DB 쓰기 (라이프사이클 자동 변경)
- **파일**: `src/app/api/singers/[id]/route.ts:27-59`
- **문제**: GET 요청에서 Prisma로 performances.status 업데이트 (toComplete, toLive 배치 작업)
- **영향**: GET은 읽기 전용이어야 함, 부수 효과(Side Effect) 발생
- **수정**: 라이프사이클 계산은 읽기 전용 함수로, 상태 변경은 PATCH로

### 5.2 HIGH (우선 수정)

#### ISSUE-004: 실시간 서버 소켓 인증 취약점
- **파일**: `realtime-server/server.js:132-151`
- **문제**: `socket.on('join_room')`에서 `userType`을 클라이언트가 제공한 값 그대로 신뢰
- **영향**: 관객이 `userType: 'singer'`로 조작하여 가짜 싱어 행세 가능
- **수정**: Redis 또는 DB에서 실제 싱어 여부 확인 (authorizeSingerControl()은 권한 이벤트에서만 사용 중)

#### ISSUE-005: POST /api/performances에서 songIds 검증 부족
- **파일**: `src/app/api/performances/route.ts:139-141`
- **문제**: `songIds`가 실제 해당 싱어의 곡인지 확인 안 함
- **영향**: 다른 싱어의 곡 ID를 넘겨서 공연 생성 가능
- **수정**: songIds를 DB에서 조회하여 singerId 일치 확인

### 5.3 MEDIUM (수정 권장)

#### ISSUE-006: robots.txt가 너무 많은 경로 차단
- **파일**: `src/app/robots.ts:17-43`
- **문제**: `/dashboard`, `/login`, `/sign-in`, `/sign-up` 등을 차단하고 있으나, `/singer/[id]` (공연자 프로필)도 차단해야 할까? 현재는 allow됨.
- **영향**: SEO 및 AdSense 크롤링에 영향
- **수정**: `/singer/[id]`은 허용, `/dashboard`, `/singer/dashboard`, `/api/*` 등만 차단으로 유지

#### ISSUE-007: sitemap.ts가 guideEntries를 올바르게 로드하는지 확인 필요
- **파일**: `src/app/sitemap.ts:8`
- **문제**: `getAllGuides()` 함수가 실제 존재하는지, `src/content/guides/`에 데이터가 있는지 확인 필요
- **영향**: 사이트맵에 가이드 URL이 포함되지 않을 수 있음
- **수정**: `getAllGuides()` 구현 확인, 없다면 `src/content/guides/` 스캔 로직 추가

#### ISSUE-008: 콘솔 로그가 프로덕션에서 남아있음
- **파일**: 여러 파일 (`server.js`, `singer.ts`, `page.tsx` 등)
- **문제**: `console.error`, `console.log`가 프로덕션 코드에 남아있음
- **영향**: 성능 저하, 민감 정보 노출 가능
- **수정**: 제거 또는 환경 변수로 조건부 처리

### 5.4 LOW (참고)

#### ISSUE-009: Clerk 로그인 후 리다이렉트 로직 복잡
- **파일**: `src/app/page.tsx`, `src/app/singer/dashboard/page.tsx`
- **문제**: `isSinger` 확인을 위해 /api 호출 또는 DB 조회 → 클라이언트에서 처리
- **영향**: 초기 로드 지연
- **수정**: 세션 토큰에 singer 상태 포함 고려

#### ISSUE-010: localStorage 기반 데모 모드
- **파일**: `src/app/explore/page.tsx:74-76,99`
- **문제**: `busking_fan_id`를 localStorage에 저장하여 익명 사용자 추적
- **영향**: 브라우저 데이터 삭제 시 추적 불가
- **수정**: 데모 모드에서는 Clerk 익명 세션 또는 DB 기반 추적 권장

---

## 6. UI/UX 및 반응형 디자인 분석 (Design & Responsive Analysis)

### 6.1 현재 UI 패턴
- **스타일링**: Tailwind CSS 4 + CSS Modules (.module.css)
- **테마**: next-themes (data-theme 속성, dark: 변형)
- **애니메이션**: Framer Motion
- **아이콘**: lucide-react

### 6.2 반응형 디자인 상태

| 페이지/컴포넌트 | 모바일 | 태블릿 | PC | 비고 |
|--------------|--------|--------|----|------|
| LandingPage | ✓ | ✓ | ✓ | 반응형 기본 |
| ExplorePage (지도+리스트) | viewMode 토글 | ✓ | ✓ | Leaflet 지도 모바일 최적화 필요 |
| SingerDashboard | ✓ (세로 스크롤) | ✓ | ✓ | 복잡한 UI, 모바일에서 단순화 필요 |
| LivePerformanceContent (싱어) | ✓ (패널 리사이즈) | ✓ | ✓ | react-resizable-panels 사용 |
| AudienceLivePage | ✓ | ✓ | ✓ | 채팅창 모바일 최적화 필요 |
| AppHeader | ✓ (햄버거 메뉴?) | ✓ | ✓ | 모바일 네비게이션 확인 필요 |

### 6.3 일반적 규칙 준수 여부

| 규칙 | 준수 여부 | 비고 |
|------|----------|------|
| 터치 타겟 44x44px 이상 | ? | 버튼/링크 크기 확인 필요 |
| 텍스트 가독성 (모바일) | ? | 폰트 크기 16px 이상 권장 |
| 색상 대비 (WCAG AA) | ? | 다크 모드에서 확인 필요 |
| z-index 스태킹 컨택스트 | ? | 모달/드롭다운 레이어 확인 |
| 로딩 상태 표시 | 부분적 | 스켈레톤/스피너 일관성 필요 |
| 에러 상태 표시 | 부분적 | 일관된 에러 메시지 UI 필요 |

### 6.4 개선 필요 사항
1. **공통 푸터/푸터**: `docs/features.md`에서 언급했으나 실제 구현 미확인 (`AppFooter` 존재 여부 확인 필요)
2. **모바일 네비게이션**: 햄버거 메뉴 또는 하단 네비게이션 바 필요할 수 있음
3. **지도 반응형**: `BuskingMap.tsx` 모바일에서 height 100% 처리 확인 (explore/page.tsx에서 처리 중)
4. **폼 검증 UI**: 일관된 폼 에러 표시 필요

---

## 7. 데이터베이스 스키마 분석 (Prisma Schema)

### 7.1 모델 관계도
```
Profile (1) --- (1) Singer (1) --- (*) Performance (1) --- (*) PerformanceSong (*) --- (1) Song
Profile (1) --- (*) PointTransaction
Singer (1) --- (*) BookingRequest
Singer (1) --- (*) Follow (many-to-many via follower)
Performance (1) --- (*) SongRequest
```

### 7.2 인덱스 필요 여부
- `Performance.singerId` - 인덱스 필요 (자주 조회)
- `Performance.status` - 인덱스 필요 (필터링)
- `Profile.role` - 인덱스 필요 (사용자 유형 조회)
- `Follow.singerId, fanId` - 유니크 제약 있음 (충분)

### 7.3 누락된 관계 또는 필드
- `Performance`에 `actualEndTime` 필드 없음 (종료 시간 추적용)
- `SongRequest`에 `requesterId` (Profile FK) 없음 - 익명/로그인 구분 어려움
- `BookingRequest`에 `requesterId` 없음

---

## 8. 현재 작업 상태 (Based on docs/tasks.md)

### Phase 1: Security Hardening (Priority 1)
- [x] 1.1 Shared Auth & Lifecycle Contracts [LOCKED]
- [x] 1.2 Lock Down Mutating Writes [LOCKED]
- [x] 1.3 Make Lifecycle Read-Only & Shared [LOCKED]
- [x] 1.4 Realtime Authority Hardening [done]
- [x] 1.5 Refresh Regression & Smoke Coverage [done]

### Phase 2: AdSense Approval Readiness
- [ ] 2.1 Crawlability Foundation
- [ ] 2.2 Public Discovery Chrome (Header/Footer)
- [ ] 2.3 Legal & Trust Pages
- [ ] 2.4 Public Guides Information Architecture
- [ ] 2.5 Guide Content Batch A (10 articles)
- [ ] 2.6 Guide Content Batch B (10 articles)
- [ ] 2.7 De-emphasize Demo-First Discovery
- [x] 2.8 AdSense Approval Ops Runbook [LOCKED]

### Phase 3: Verification (Final)
- [ ] 3.1 Build & Lint
- [ ] 3.2 Manual QA (Playwright)
- [ ] 3.3 Security Regression

---

## 9. 요약 (Summary)

### 9.1 잘 구현된 부분
- [x] Clerk 기반 서버 사이드 인증 (대부분의 API)
- [x] Prisma를 활용한 타입 안정적인 DB 접근
- [x] Socket.io 실시간 통신 + Redis 어댑터
- [x] 포인트 시스템 (충전, 후원, 차감)
- [x] AdSense 크롤링 준비 (robots.ts, sitemap.ts)
- [x] 멀티 언어 지원 (i18n)

### 9.2 urgent 수정 필요
- [ ] **ISSUE-001**: `POST /api/song-requests` 인증 추가
- [ ] **ISSUE-002**: `POST /api/booking` 인증 추가
- [ ] **ISSUE-003**: `GET /api/singers/[id]` DB 쓰기 제거
- [ ] **ISSUE-004**: 소켓 `join_room`에서 userType 신뢰 문제 해결

### 9.3 일반적 규칙 준수 여부
- [x] 파일 명명 규칙 준수 (PascalCase.tsx, camelCase.ts)
- [x] Import 순서 규칙 (docs/conventions.md 참조)
- [ ] `GET = 읽기 전용` 규칙 위반 (ISSUE-003)
- [ ] 일부 API에서 클라이언트 제공 ID 신뢰 (부분적)
- [ ] UI/UX 일관성 부족 (로딩/에러 상태)

---

**분석 완료일**: 2026-05-05
**분석자**: Sisyphus (ULTRAWORK MODE)
