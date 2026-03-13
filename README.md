This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.


---

# 🎤 miniMic (미니믹) - Street Performance Revolution

**miniMic**는 거리 공연자(Busker)와 팬(Audience)을 실시간으로 연결하는 차세대 버스킹 플랫폼입니다. 위치 기반 기술과 실시간 소통 기능을 통해 거리의 감동을 디지털로 확장합니다.

## 🌟 서비스 개요
본 서비스는 단순한 정보 제공을 넘어, 공연 예약부터 실시간 후원, 신청곡, 섭외 요청에 이르는 모든 버스킹 생태계를 하나의 앱에서 해결할 수 있도록 설계되었습니다.

---

## 🏠 주요 화면 및 기능 상세 안내

### 1. 랜딩 페이지 (Landing Page)
앱의 첫 관문으로, 사용자의 역할(가수/관객)에 따라 최적화된 초기 경험을 제공합니다.
- **가수 모드:** 로그인한 가수는 즉시 '내 대시보드'로 이동하여 공연을 관리할 수 있습니다.
- **관객 모드:** 서비스 탐색(Explore) 버튼을 통해 현재 진행 중인 라이브 공연을 한눈에 확인할 수 있습니다.
- **브랜드 아이덴티티:** `miniMic`의 정체성을 담은 미니멀하고 세련된 UI를 제공합니다.

### 📺 실시간 공연 시청 (Audience Live)
공연장에 직접 가지 않아도 현장의 열기를 그대로 느낄 수 있습니다.
- **실시간 셋리스트 (Real-time Setlist):** 가수가 현재 부르고 있는 곡이 무엇인지, 다음 곡은 무엇인지 실시간으로 동기화되어 표시됩니다.
- **신청곡 보내기 (Song Request):** 가수의 레퍼토리 중에서 혹은 직접 입력하여 신청곡을 보낼 수 있습니다. (가수가 수락 시 알림 제공)
- **후원 및 포인트 (Sponsorship):** 
    - **다이렉트 후원:** 보유한 포인트를 사용하여 가수에게 즉시 응원의 메시지와 함께 후원할 수 있습니다.
    - **광고 보고 후원하기:** 포인트가 부족할 경우 광고를 시청하여 무료로 가수에게 후원금을 전달할 수 있는 독특한 시스템을 제공합니다.
- **실시간 채팅:** 다른 팬들과 소통하며 공연의 감동을 나눕니다. 공연 종료 시 채팅 기록을 소장할 수 있는 다운로드 기능을 제공합니다.

---

### 🗺️ 관객(Audience)을 위한 탐색 및 참여 (Explore)
관객은 지도를 기반으로 주변의 버스킹 공연을 찾고 참여할 수 있습니다.
- **위치 기반 버스킹 맵 (Busking Map):** Leaflet 기반 지도를 통해 내 주변에서 열리는 실시간(Live) 및 예정된(Scheduled) 공연을 핀으로 확인합니다.
- **스마트 필터 (Explore Filter):**
    - '전체', '라이브 중', '공연 예정' 필터링.
    - '팔로잉만' 필터를 통해 내가 좋아하는 가수의 공연만 따로 보기.
    - **거리 반경 설정:** 내 위치를 기준으로 5km ~ 50km까지 공연 검색 범위를 조절할 수 있습니다.
- **아티스트 프로필 탐색:** 지도 핀이나 목록에서 가수를 클릭하면 해당 가수의 상세 프로필, 과거 공연 이력, 대표 레퍼토리를 확인할 수 있습니다.

---

### ⚙️ 핵심 시스템 기능

#### 1. 다국어 지원 (Global i18n)
전 세계 어디서든 버스킹을 즐길 수 있도록 5개 언어를 지원합니다.
- 🇰🇷 한국어 (Korean)
- 🇺🇸 English
- 🇯🇵 日本語 (Japanese)
- 🇨🇳 简体中文 (Simplified Chinese)
- 🇹🇼 繁體中文 (Traditional Chinese)

#### 2. 다채로운 테마 시스템 (8-Theme System)
사용자의 취향이나 공연 분위기에 맞춰 UI 테마를 변경할 수 있습니다.
- **Neo-Brutalism:** 강렬한 대비와 파격적인 디자인.
- **Dark Mode:** 야간 공연 시청에 최적화된 어두운 테마.
- **Warm Sunset:** 노을 지는 거리의 감성을 담은 따뜻한 테마.
- **Minimal Light:** 깔끔하고 정돈된 기본 화이트 테마.
- *(그 외 Retro Pixel Neon, Midnight Busking 등 다양한 스타일 지원)*

---

### 🎸 가수(Singer)를 위한 올인원 관리 (Dashboard)
아티스트는 복잡한 절차 없이 자신만의 공연 브랜드를 구축하고 관리할 수 있습니다.

#### 1. 아티스트 프로필 및 QR 명함
- **디지털 명함:** 가수 전용 QR 코드를 생성하여 오프라인 현장에서 팬들이 즉시 내 프로필로 접속하게 유도합니다.
- **소셜 연동:** 인스타그램, 유튜브, 사운드클라우드 등 개인 채널을 통합 관리합니다.
- **커스텀 아바타:** 나를 표현하는 픽셀 아트 스타일의 아바타를 설정할 수 있습니다.

#### 2. 공연 관리 (Performance Management)
- **스케줄링:** 공연 장소(지도 선택), 시간, 상세 설명을 입력하여 공연을 예약합니다.
- **셋리스트 구성:** 내가 부를 수 있는 곡들을 미리 저장해두고, 각 공연에 맞춰 리스트를 구성합니다.
- **섭외 관리 (Booking):** 기업이나 개인으로부터 들어온 축가, 행사 섭외 요청을 한눈에 확인하고 상태(검토 중/연락 완료 등)를 관리합니다.

#### 3. 실시간 라이브 모드 (Singer Live Mode)
공연 중 가수가 사용하는 컨트롤 타워입니다.
- **진행 제어:** 곡의 시작과 종료를 버튼 하나로 조작하여 팬들의 화면에 실시간으로 반영합니다.
- **신청곡 관리:** 실시간으로 들어오는 팬들의 신청곡을 확인하고 수락/거절할 수 있습니다.
- **채팅방 개설:** 공연 10분 전부터 채팅방을 열어 팬들과 미리 교감할 수 있습니다. (포인트를 사용하여 즉시 개설 가능)
- **시청자 통계:** 현재 실시간으로 몇 명의 팬이 내 공연을 지켜보고 있는지 실시간으로 확인합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.0
- **State Management:** Zustand
- **Real-time:** Socket.io-client
- **Maps:** React Leaflet / Leaflet.js
- **Auth:** Clerk (Authentication & User Management)

### Backend & Database
- **Database:** PostgreSQL (Hosted on Supabase/Prisma Postgres)
- **ORM:** Prisma
- **Server:** Next.js Server Actions & API Routes
- **Real-time Server:** Node.js + Socket.io (Separate service for high-concurrency chat)

---

## ❓ 자주 묻는 질문 (FAQ)

### 관객 관련
- **Q: 포인트는 어떻게 충전하나요?**
  - A: 내 프로필이나 라이브 공연 창에서 '충전' 버튼을 눌러 카카오페이로 간편하게 충전할 수 있습니다.
- **Q: 가수가 내 신청곡을 받았는지 어떻게 아나요?**
  - A: 가수가 신청곡을 수락하면 실시간 채팅창과 셋리스트에 알림 메시지가 표시됩니다.
- **Q: 공연이 끝났는데 채팅 내용을 다시 볼 수 있나요?**
  - A: 공연 종료 직후 나타나는 팝업에서 '채팅 다운로드'를 누르면 텍스트 파일로 저장할 수 있습니다.

### 가수 관련
- **Q: 공연 장소는 어떻게 설정하나요?**
  - A: 대시보드에서 '공연 등록' 시 지도를 클릭하여 정확한 버스킹 위치를 핀으로 찍을 수 있습니다.
- **Q: 채팅방은 언제 열 수 있나요?**
  - A: 기본적으로 공연 시작 10분 전부터 무료로 열 수 있으며, 그 이전이라도 포인트를 소모하여 즉시 개설이 가능합니다.
- **Q: 내 QR 코드는 어디서 확인하나요?**
  - A: 대시보드 우측의 'Singer QR Card' 영역에서 확인 및 이미지 저장이 가능합니다.

---

## 🚀 개발 및 기여 가이드

본 프로젝트는 `Atlas`, `Codex App`, `Antigravity` 세 명의 AI 에이전트 협업 체계로 관리됩니다.

### 로컬 실행 방법
1. 의존성 설치: `npm install`
2. 데이터베이스 설정: `npx prisma generate`
3. 개발 서버 실행: `npm run dev` (프론트엔드 및 실시간 서버 동시 실행)

### 환경 변수 (.env)
- `DATABASE_URL`: PostgreSQL 연결 주소
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk 인증 키
- `KAKAO_PAY_SECRET_KEY`: 카카오페이 결제 키
- `NEXT_PUBLIC_REALTIME_SERVER_URL`: 실시간 채팅 서버 주소





