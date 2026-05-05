# 개선 계획표 (Improvement Plan)

> ULTRAWORK MODE 분석 기반 (2026-05-05)
> 작성자: Sisyphus
> 실행자: Sisyphus (단일 AI)

---

## 실행 원칙

1. **보안 수정 먼저** (Critical → High → Medium → Low)
2. **ULTRAWORK MODE**: 모든 작업은 100% 확실성으로 실행, 검증 필수
3. **병렬 실행 가능한 작업은 동시 실행** (의존성 없는 경우)
4. **각 작업 완료 후 즉시 `docs/tasks.md` 업데이트 + 커밋**

---

## Phase 1: 보안 수정 (Security Fixes - CRITICAL)

### Task 1.1: POST /api/song-requests 인증 추가 ⚠️

**상태**: pending  
**우선순위**: CRITICAL  
**의존성**: 없음

**문제**:
- `src/app/api/song-requests/route.ts:7` - `const { userId } = await auth()` 가 주석처리됨
- 익명 사용자가 곡 요청 가능 → 스팸, 악의적 요청 가능

**수정 파일**: `src/app/api/song-requests/route.ts`

**수정 내용**:
```typescript
// LINE 7 주석 해제:
const { userId } = await auth()

// LINE 7-15 수정:
if (!userId) {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
}

// LINE 11: requesterName 처리 개선
const requesterName = userId ? (body.requesterName || 'Anonymous') : (body.requesterName || 'Guest')
```

**검증 방법**:
```bash
# 익명 요청 테스트
curl -X POST http://localhost:3000/api/song-requests \
  -H "Content-Type: application/json" \
  -d '{"performanceId":"test-id","title":"Test","artist":"Test"}'
# 기대 결과: 401 Unauthorized

# 로그인 사용자 요청 테스트
# (브라우저에서 로그인 후 테스트)
```

**성공 기준**:
- [ ] 익명 POST 요청 시 401 반환
- [ ] 로그인 사용자만 곡 요청 가능
- [ ] `requesterName`이 적절히 저장됨

---

### Task 1.2: POST /api/booking 인증 추가 ⚠️

**상태**: pending  
**우선순위**: CRITICAL  
**의존성**: 없음

**문제**:
- `src/app/api/booking/route.ts` - 인증 확인 없음
- 익명 사용자가 북킹 요청 가능

**수정 파일**: `src/app/api/booking/route.ts`

**수정 내용**:
```typescript
// LINE 1 import 추가:
import { auth } from '@clerk/nextjs/server'

// LINE 5-6 사이에 인증 추가:
export async function POST(request: Request) {
  try {
    const { userId } = await auth()  // 추가
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const { singerId, contactInfo, eventType, eventDate, location, budget, message, requesterName } = body

    // LINE 9 수정:
    if (!singerId || !contactInfo || !eventType || !requesterName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // userId도 저장 (선택적):
    // BookingRequest 모델에 requesterId 필드 추가 권장 (향후)
```

**검증 방법**:
```bash
# 익명 요청 테스트
curl -X POST http://localhost:3000/api/booking \
  -H "Content-Type: application/json" \
  -d '{"singerId":"test","requesterName":"Test","contactInfo":"test@test.com","eventType":"Busking"}'
# 기대 결과: 401 Unauthorized
```

**성공 기준**:
- [ ] 익명 POST 요청 시 401 반환
- [ ] 로그인 사용자만 북킹 요청 가능

---

### Task 1.3: GET /api/singers/[id] DB 쓰기 제거 ⚠️

**상태**: pending  
**우선순위**: CRITICAL  
**의존성**: 없음 (단, 라이프사이클 리졸버 함수 필요)

**문제**:
- `src/app/api/singers/[id]/route.ts:27-59` - GET 핸들러에서 Prisma 쓰기 (`prisma.performance.update`)
- "GET = 읽기 전용" 규칙 위반
- 부수 효과 (side effect) 발생

**수정 파일**: `src/app/api/singers/[id]/route.ts`, `src/lib/performance-lifecycle.ts` (또는 `src/utils/performance.ts`)

**수정 내용**:
```typescript
// 1. src/lib/performance-lifecycle.ts (또는 src/utils/performance.ts) 에 함수 추가:
export function resolvePerformanceStatus(startTime: Date, endTime: Date | null, dbStatus: string) {
  const now = new Date()
  
  // 취소된 것은 그대로
  if (dbStatus === 'canceled') return 'canceled'
  
  // 종료 시간이 지났으면
  if (endTime && new Date(endTime) < now) return 'completed'
  
  // 시작 시간이 지났고 종료 시간이 안 지났으면
  if (new Date(startTime) <= now && (!endTime || new Date(endTime) >= now)) {
    return 'live'
  }
  
  // 아직 시작 안 함
  return dbStatus // 'scheduled' 유지
}

// 2. GET 핸들러 수정 (src/app/api/singers/[id]/route.ts):
// LINE 27-59 삭제 또는 주석 처리 → Prisma 쓰기 제거

// LINE 62-69 대신 resolvePerformanceStatus 사용:
import { resolvePerformanceStatus } from '@/lib/performance-lifecycle'

// performances.map 내에서:
const resolvedPerformances = singer.performances.map(p => {
  const status = resolvePerformanceStatus(new Date(p.startTime), p.endTime ? new Date(p.endTime) : null, p.status)
  return { ...p, status }
})
```

**검증 방법**:
```bash
# GET 요청 후 DB 상태 변경 없음 확인
# 1. 브라우저에서 /api/singers/[id] 호출
# 2. DB에서 해당 공연의 status 확인 (Prisma Studio)
# 3. GET 다시 호출해도 status 변경 없어야 함
```

**성공 기준**:
- [ ] GET 핸들러에서 Prisma 쓰기 없음
- [ ] `resolvePerformanceStatus`가 올바르게 작동
- [ ] `npm run build` 통과
- [ ] `npm run lint` 통과

---

### Task 1.4: 실시간 서버 join_room userType 신뢰 수정 ⚠️

**상태**: pending  
**우선순위**: HIGH  
**의존성**: Task 1.1 (song-requests auth 수정 권장)

**문제**:
- `realtime-server/server.js:132-151` - `join_room`에서 클라이언트가 제공한 `userType`을 그대로 믿고 있음
- 관객이 `userType: 'singer'`로 조작하여 가짜 권한 획득 가능

**수정 파일**: `realtime-server/server.js`

**수정 내용**:
```javascript
// authorizeSingerControl 함수 개선 (LINE 117-127):
async function authorizeSingerControl(socketId, performanceId) {
  try {
    const authKey = `auth:${socketId}`
    const authData = await redisClient.get(authKey)
    if (!authData) return false
    
    const parsed = JSON.parse(authData)
    if (parsed.performanceId !== performanceId) return false
    
    // 추가: Redis에 singerId가 저장되어 있는지 확인
    if (!parsed.singerId) return false
    
    // (선택적) Prisma로 실제 소유권 확인:
    // const perf = await prisma.performance.findUnique({ where: { id: performanceId } })
    // return perf && perf.singerId === parsed.singerId
    
    return true
  } catch (err) {
    console.error('Auth check failed:', err)
    return false
  }
}

// join_room 이벤트 수정 (LINE 132-169):
socket.on('join_room', async (data) => {
  const { performanceId, username, userType, capacity = 50 } = data
  
  // userType 검증 로직 변경:
  // 1. 허용된 값만 허용
  const validUserType = ['singer', 'audience'].includes(userType) ? userType : 'audience'
  
  // 2. Redis에 인증 정보 저장 (singerId는 나중에 API 호출로 채움)
  const authKey = `auth:${socket.id}`
  await redisClient.set(authKey, JSON.stringify({
    performanceId,
    userType: validUserType,
    username,
    singerId: null  // 싱어가 join할 때 API로 인증 후 채움
  }), 'EX', 86400)
  
  socket.data = { performanceId, userType: validUserType, username }
  
  // ... 나머지 로직
})
```

**참고**: 권한 필요 이벤트 (`open_chat`, `system_alert`, `performance_ended`, `chat_status_toggled`)은 이미 `authorizeSingerControl()`을 사용하고 있으므로 부분적으로 해결됨. 하지만 `join_room`에서의 초기 신뢰가 여전히 문제.

**검증 방법**:
```bash
# test-suite/chat-tester.js 실행
node test-suite/chat-tester.js --case unauthorized-singer-claim --out test-suite/results/security-join-room.json
# 기대: 관객이 userType='singer'로 조작해도 권한 없음
```

**성공 기준**:
- [ ] `join_room`에서 `userType` 조작 불가
- [ ] Redis 인증 정보가 권한 확인에 사용됨
- [ ] 권한 필요 이벤트가 적절히 보호됨

---

## Phase 2: UI/UX 개선 (Design & Responsive)

### Task 2.1: AppFooter 컴포넌트 생성 및 적용

**상태**: pending  
**우선순위**: MEDIUM  
**의존성**: 없음

**목표**: `docs/features.md`에서 언급했으나 실제 구현 여부 불확실한 푸터 추가

**생성/수정 파일**:
- `src/components/common/AppFooter.tsx` (신규)
- `src/components/home/LandingPage.tsx`
- `src/components/common/AppHeader.tsx`
- 기타 공개 페이지들

**구현 내용**:
```tsx
// src/components/common/AppFooter.tsx
'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import styles from './AppFooter.module.css'

export default function AppFooter() {
  const { t } = useLanguage()
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <Link href="/about">{t('footer.about')}</Link>
          <Link href="/privacy">{t('footer.privacy')}</Link>
          <Link href="/terms">{t('footer.terms')}</Link>
          <Link href="/contact">{t('footer.contact')}</Link>
          <Link href="/guides">{t('footer.guides')}</Link>
        </div>
        <div className={styles.copy}>
          © {new Date().getFullYear()} miniMic. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
```

**CSS 모듈**: `src/components/common/AppFooter.module.css`

**적용 대상**:
- `/` (LandingPage)
- `/explore` (ExplorePage)
- `/live/[id]` (AudienceLivePage)
- `/singer/[id]` (싱어 프로필)

**주의**: 대시보드 (`/singer/dashboard`), 라이브 제어 (`/singer/live`)에는 추가하지 말 것 (`docs/tasks.md` 2.2 참조)

**검증 방법**:
- 브라우저에서 각 페이지 방문하여 푸터 표시 확인
- 모바일 뷰에서 푸터 레이아웃 확인

**성공 기준**:
- [ ] 푸터가 공개 페이지들에 표시됨
- [ ] 푸터 링크가 `/about`, `/privacy`, `/terms`, `/contact`, `/guides` 가리킴
- [ ] 모바일에서 레이아웃 깨지지 않음
- [ ] 대시보드/라이브 제어 페이지에는 푸터 없음

---

### Task 2.2: 모바일 반응형 검증 및 수정

**상태**: pending  
**우선순위**: MEDIUM  
**의존성**: Task 2.1 (푸터 완료 후)

**검증 대상 페이지**:
1. **LandingPage** (`src/components/home/LandingPage.tsx`)
   - 모바일: 히어로 섹션, 버튼 크기 (44x44px 이상)
   - 태블릿/PC: 멀티 칼럼 레이아웃
  
2. **ExplorePage** (`src/app/explore/page.tsx`)
   - 지도 컨테이너 모바일에서 `height: 100%` 또는 `height: 50vh` 처리
   - 리스트/지도 토글 버튼 크기 확인
   
3. **AudienceLivePage** (`src/app/live/[id]/page.tsx`)
   - 채팅창 모바일에서 전체화면 또는 드래그 가능한 패널
   - 버튼/입력 필드 터치 타겟 크기
   
4. **LivePerformanceContent** (`src/app/singer/live/page.tsx`)
   - react-resizable-panels 모바일에서 비활성화 또는 스택형 레이아웃
   - 탭 버튼 크기

**확인 사항**:
- [ ] 터치 타겟 44x44px 이상
- [ ] 폰트 크기 16px 이상 (모바일)
- [ ] 색상 대비 WCAG AA 준수
- [ ] z-index 스태킹 컨텍스트 문제 없음

**수정 방법**:
- CSS Modules 또는 Tailwind 클래스에 미디어 쿼리 추가
- `sm:`, `md:`, `lg:` 브레이크포인트 활용

**성공 기준**:
- [ ] Chrome DevTools 모바일 시뮬레이터에서 모든 페이지 정상 표시
- [ ] 테블릿 (768px), PC (1024px+) 해상도에서 정상 표시
- [ ] `npm run build` 통과

---

### Task 2.3: 일관성 검증 (Component Consistency)

**상태**: pending  
**우선순위**: LOW  
**의존성**: 없음

**검증 항목**:
1. **버튼 스타일**: 모든 버튼이 일관된 스타일 사용하는지
2. **폼 입력**: 입력 필드 스타일 일관성
3. **로딩 상태**: 스피너/스켈톤 일관성
4. **에러 상태**: 에러 메시지 표시 일관성
5. **모달**: ConfirmationModal, PointChargeModal 등 일관성

**수정 내용**:
- `src/components/common/` 에 공통 버튼/입력 컴포넌트 생성 (선택적)
- 기존 컴포넌트들을 일관성 있게 정리

**성공 기준**:
- [ ] 버튼, 입력, 모달이 일관된 스타일 사용
- [ ] `npm run lint` 통과

---

## Phase 3: 일반적 규칙 준수 (Convention Compliance)

### Task 3.1: Prisma Schema 인덱스 추가

**상태**: pending  
**우선순위**: MEDIUM  
**의존성**: 없음

**수정 파일**: `prisma/schema.prisma`

**추가할 인덱스**:
```prisma
model Performance {
  // ... 기존 필드
  
  @@index([singerId])  // 성능 최적화
  @@index([status])    // 필터링 최적화
  @@index([startTime]) // 정렬 최적화
}

model SongRequest {
  // ... 기존 필드
  
  @@index([performanceId]) // 조회 최적화
}

model BookingRequest {
  // ... 기존 필드
  
  @@index([singerId]) // 조회 최적화
}

model Follow {
  // ... 기존 필드
  
  @@index([fanId]) // 팔로워 조회 최적화
}
```

**실행 후**:
```bash
npx prisma db push
# 또는
npx prisma migrate dev --name add_indexes
```

**성공 기준**:
- [ ] 인덱스 추가 후 `npx prisma db push` 성공
- [ ] 기존 기능 정상 작동

---

### Task 3.2: 콘솔 로그 제거

**상태**: pending  
**우선순위**: LOW  
**의존성**: 없음

**작업**:
- `src/` 내 모든 `.ts`, `.tsx` 파일에서 `console.log`, `console.error` 검색
- 프로덕션 빌드에서 제거하거나 환경 변수로 조건부 처리

**검색 명령**:
```bash
# PowerShell
Select-String -Path "C:\secjob\Busking_Antigravity\Busking_Antigravity\src\**\*.ts*" -Pattern "console\.(log|error|warn)" | Select-Object FileName, Line
```

**수정 원칙**:
- 디버깅용 `console.log`는 제거
- 에러 로깅은 유지하되 프로덕션에서 조건부 처리:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('Error:', error)
}
```

**성공 기준**:
- [ ] 불필요한 `console.log` 제거
- [ ] `npm run build` 통과 (타입 에러 없음)

---

### Task 3.3: GET = 읽기 전용 규칙 준수 확인

**상태**: pending  
**우선순위**: HIGH  
**의존성**: Task 1.3 완료 필요

**확인 대상**: 모든 `src/app/api/**/route.ts` 파일들

**검색**: GET 핸들러 내 `prisma.create`, `prisma.update`, `prisma.delete` 사용 여부

**명령**:
```bash
# PowerShell
Select-String -Path "C:\secjob\Busking_Antigravity\Busking_Antigravity\src\app\api\**\route.ts" -Pattern "export async function GET" -Context 20 | Select-String -Pattern "prisma\.(create|update|delete)"
```

**수정**: 발견된 모든 GET 핸들러에서 DB 쓰기 제거

**성공 기준**:
- [ ] 모든 GET 핸들러가 DB 쓰기 없음
- [ ] `npm run build` 통과

---

## Phase 4: AdSense 준비 (Phase 2 from docs/tasks.md)

### Task 4.1: robots.txt 개선

**상태**: pending  
**우선순위**: HIGH (AdSense)  
**의존성**: 없음

**문제**: `src/app/robots.ts`가 너무 많은 경로 차단 (/sign-in, /sign-up 등)

**수정 파일**: `src/app/robots.ts`

**수정 내용**:
```typescript
// LINE 17-43 수정:
{
  userAgent: "*",
  allow: [
    "/",
    "/explore",
    "/singer/",  // 싱어 프로필은 공개
    "/live/",    // 라이브 시청은 공개
    "/about",
    "/privacy",
    "/terms",
    "/contact",
    "/guides",
  ],
  disallow: [
    "/api/",
    "/auth/",
    "/singer/dashboard",
    "/singer/live",
    "/dashboard",
    "/login",
    "/sign-in",
    "/sign-up",
    "/design-flow",
    "/design-review",
    "/design-to-be",
    "/test-perf-flow",
  ],
},
```

**검증**:
```bash
curl http://localhost:3000/robots.txt
# 기대: Mediapartners-Google, Google-Display-Ads-Bot 허용 확인
```

**성공 기준**:
- [ ] `curl http://localhost:3000/robots.txt` 응답 200
- [ ] `Mediapartners-Google` 및 `Google-Display-Ads-Bot` 허용
- [ ] `/singer/[id]`는 허용, `/singer/dashboard`는 차단

---

### Task 4.2~4.7: docs/tasks.md Phase 2 작업들

이 작업들은 이미 `docs/tasks.md`에 정의되어 있으므로, 해당 파일의 지침을 따름:

- **4.2**: Public Discovery Chrome (Header/Footer) → Task 2.1과 중복되므로 함께 실행
- **4.3**: Legal & Trust Pages → 이미 구현됨 (`/about`, `/privacy`, `/terms`, `/contact` in `src/app/`)
- **4.4**: Public Guides Information Architecture → `src/app/guides/` 이미 구현됨 (sitemap.ts 참조)
- **4.5**: Guide Content Batch A (10 articles) → `src/content/guides/` 에 한국어 아티클 작성
- **4.6**: Guide Content Batch B (10 articles) → 추가 아티클 작성
- **4.7**: De-emphasize Demo-First Discovery → 랜딩 페이지에서 가이드/신뢰 콘텐츠 강조

**주의**: 이 작업들은 `docs/tasks.md`에 `pending` 상태로 남아있으므로, 해당 파일 업데이트 필요.

---

## Phase 5: 최종 검증 (Phase 3 from docs/tasks.md)

### Task 5.1: Build & Lint

**상태**: pending  
**우선순위**: HIGH (최종)  
**의존성**: 모든 작업 완료 후

**명령**:
```bash
npm run build
npm run lint
```

**성공 기준**:
- [ ] `npm run build` exit 0
- [ ] `npm run lint` exit 0

---

### Task 5.2: Manual QA (Playwright)

**상태**: pending  
**우선순위**: HIGH (최종)  
**의존성**: Task 5.1 완료 후

**명령**:
```bash
npx playwright test
```

**검증 경로** (docs/features.md 참조):
1. `/` → 가이드/법적 페이지 링크 확인
2. `/explore` → 지도/리스트, 팔로우, 라이브 진입
3. `/singer/dashboard` → 공연 관리, 곡 관리 (싱어만)
4. `/singer/live?performanceId=xxx` → 라이브 제어 (싱어만)
5. `/live/[id]` → 시청, 채팅, 후원 (모두)
6. `/about`, `/privacy`, `/terms`, `/contact` → 법적 페이지 로드
7. `/guides`, `/guides/[slug]` → 가이드 아티클

**성공 기준**:
- [ ] 모든 공개 페이지 로드됨
- [ ] `/robots.txt`, `/sitemap.xml` 접근 가능
- [ ] 보안 수정 검증 (401, 403 응답)

---

### Task 5.3: Security Regression

**상태**: pending  
**우선순위**: HIGH (최종)  
**의존성**: Task 5.1 완료 후

**명령**:
```bash
node test-suite/security/mutating-writes.test.js
node test-suite/lifecycle/read-only.test.js
node test-suite/realtime/authority.test.js
node test-suite/api-tester.js
powershell -ExecutionPolicy Bypass -File .\test-suite\one-click-test.ps1
```

**성공 기준**:
- [ ] 모든 보안 테스트 통과
- [ ] `test-suite/results/` 에 JSON 아티팩트 생성됨

---

## 실행 순서 (Execution Order)

### Wave 1 (병렬 실행 가능):
1. Task 1.1: POST /api/song-requests 인증 추가
2. Task 1.2: POST /api/booking 인증 추가
3. Task 1.3: GET /api/singers/[id] DB 쓰기 제거
4. Task 3.3: GET = 읽기 전용 규칙 준수 확인 (1.3 완료 후)
5. Task 3.1: Prisma Schema 인덱스 추가
6. Task 3.2: 콘솔 로그 제거

### Wave 2:
1. Task 1.4: 실시간 서버 join_room userType 신뢰 수정 (1.1 완료 후 권장)
2. Task 2.1: AppFooter 컴포넌트 생성 및 적용
3. Task 4.1: robots.txt 개선

### Wave 3:
1. Task 2.2: 모바일 반응형 검증 및 수정 (2.1 완료 후)
2. Task 2.3: 일관성 검증 (선택적)

### Wave 4 (Phase 2 작업들):
1. Task 4.2~4.7: AdSense 준비 작업 (docs/tasks.md 따름)

### Wave 5 (최종):
1. Task 5.1: Build & Lint
2. Task 5.2: Manual QA (Playwright)
3. Task 5.3: Security Regression

---

## 작업 트래킹 방법

**ULTRAWORK MODE 프로토콜**:
1. 각 Task 시작 전: `docs/tasks.md`에서 해당 항목 `in_progress`로 변경
2. 작업 실행: 100% 확실성으로 구현
3. 검증: 위의 "성공 기준" 및 "검증 방법" 따름
4. 완료 후: `docs/tasks.md` `done`으로 변경 (LOCKED 추가 고려)
5. 커밋: 규칙에 맞는 커밋 메시지 (`feat:`, `fix:`, `docs:` 등)
6. 푸시: `git push origin main`

**참고**: `docs/conventions.md` 의 코딩 규칙 준수, `docs/README.md` 의 LOCKED 정책 준수.

---

**계획 완료일**: 2026-05-05  
**실행 시작**: 지금부터  
**예상 소요 시간**: ULTRAWORK MODE (인간 개입 없이 지속 진행)
