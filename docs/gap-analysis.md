# 최초 요건 vs 현재 구현 - 우선순위 개선안

> **기준**: 비용 최소화, 일반적 방식 채택, 불필요한 요건은 과감히 제외
> **작성**: Sisyphus (단일 AI)
> **날짜**: 2026-05-05

---

## 1. 이미 잘 구현된 것 (손대지 않음)

| 항목 | 현재 구현 | 비고 |
|------|----------|------|
| **채팅 서버** | Socket.io + Redis, Docker 없이도 안정적 작동 | AWS/Docker 요건 삭제, 일반적 방식으로 충분 |
| **결제 시스템** | Stripe + KakaoPay 연동 | ApplePay/NaverPay 추가는 비용 대비 효용 낮음 |
| **포인트 시스템** | Profile.points + PointTransaction | 일반적이고 깔끔한 구조 |
| **인증** | Clerk (Gmail/Kakao/Naver) | 요건 충족, 별도 구현 불필요 |
| **QR 코드** | Singer.qrCodePattern + SingerQRCard 컴포넌트 | `@/lib/qrcode` 라이브러리 활용 |
| **라이브 대시보드** | ChatBox + SongRequestModal + PerformanceSong 상태 토글 | Pad/Phone 분할은 CSS 반응형으로 대체 |

---

## 2. 다른 방식으로 구현되어 있으나 유지 가능 (Acceptable)

| 최초 요건 | 현재 구현 | 판단 |
|------------|----------|------|
| AWS Docker (채팅 서버) | 단일 Socket.io 서버 + Redis | **유지**: 초기 트래픽엔 충분, 추후 scale-up 시에만 AWS 이주 검토 |
| AWS Auto Scale-up | 미구현 | **유지**: 현재 단일 서버로 커버 가능, 과금 로직 복잡도 낮음 → 삭제 |
| 30분 단위 장소 대여 | 미구현 | **유지**: 현재는 가수가 직접 위치+시간 등록, 장소 제공자 기능은 추후 검토 |
| 채팅 참여자 예약 큐 | 미구현 | **유지**: 현재 인원 초과 시 입장 차단, 예약 큐는 복잡도 대비 효용 낮음 |

---

## 3. 우선 구현 (비용 ↓, 효용 ↑)

### Phase 1: 보안 및 기본 완성 (진행 중) ✅

| 항목 | 내용 | 비용 | 파일 |
|------|------|------|------|
| ✅ Auth 하드닝 | POST /api/booking, /song-requests 인증 추가 | 거의 0 | 완료 |
| ✅ Realtime 권한 | `join_room`의 userType 클라이언트 신뢰 제거 | 거의 0 | 완료 |
| ✅ Pre-deploy 파이프라인 | `npm run predeploy` 로 모든 검증 | 거의 0 | 완료 |
| 🔲 AdSense 준비 | robots.txt, sitemap.xml, guide 콘텐츠 | 낮음 | `src/app/robots.ts` 등 |

### Phase 2: 관객 경험 개선 (비용 효율 최상) ⭐

| 항목 | 내용 | 비용 | 구현 방식 |
|------|------|------|----------|
| **아바타 선택** | 관객용 모자/헤어스타일/피부색/바지 선택 UI | 낮음 | Singer 모델의 hairColor/topColor/bottomColor 재활용, 관객용으로 확장 |
| **알림 시스템** | Web Push API (30분/10분/5분/10초 전) | 중간 | Service Worker + Clerk Web Push, FCM은 추후 |
| **채팅 내역 다운로드** | `downloadChatAsText()` 이미 구현됨 → UI만 연결 | 거의 0 | `src/utils/chatDownload.ts` 활성화 |
| **지도/그리드 전환** | explore 페이지 지도 ↔ 그리드 토글 | 낮음 | Leaflet 지도 이미 있음, 뷰 토글만 추가 |

### Phase 3: 가수 대시보드 개선 (비용 효율 중간) ⭐

| 항목 | 내용 | 비용 | 구현 방식 |
|------|------|------|----------|
| **Pad 화면 분할** | CSS 미디어 쿼리로 Pad 이상 2열 레이아웃 | 낮음 | `src/app/live/[id]/page.tsx` 반응형 개선 |
| **공연화면 설정 저장** | 가수별 대시보드 레이아웃 설정 | 중간 | `Singer` 모델에 `dashboardConfig` JSON 필드 추가 |
| **팀 기능** | 팀 결성/탈퇴, 팀원 관리 | 중간 | `Team` 모델 신설 vs `Singer.teamId` 활용 |

---

## 4. 삭제 또는 추후로 미루기 (비용 대비 효용 낮음)

| 최초 요건 | 삭제/지연 사유 |
|------------|---------------------|
| **AWS Docker 채팅** | 현재 Socket.io로 충분, 추후 트래픽 증가 시 |
| **AWS Scale-up 자동 과금** | 복잡도 높음, 수동 모니터링으로 대체 가능 |
| **ApplePay, NaverPay** | Stripe + KakaoPay로 충분 |
| **AirDrop 공유 (iOS)** | 이용률 낮음, 일반 링크/QR 공유로 충분 |
| **장소 제공자 (Venue)** | 초기엔 가수가 직접 등록하는 방식 유지 |
| **기업 광고 (Advertiser)** | AdSense로 대체, 별도 광고 시스템은 과다 |
| **관리자 시스템** | 초기엔 DB 직접 관리, 트래픽 발생 후 구현 |
| **스트리밍 기능** | 준비 중 필드만 있고 비활성화, 추후 검토 |
| **채팅 예약 큐** | 인원 초과 시 입장 차단으로 대체 가능 |
| **등급 시스템 (Tier)** | 초기엔 단일 등급, 복잡한 분배 로직 삭제 |

---

## 5. 수정 제안 (비일반적 → 일반적 방식)

| 현재 문제 | 제안 | 이유 |
|----------|------|------|
| **BookingRequest** 비회원 접근 모호 | `POST /api/booking` 익명 허용 (최초 요건) vs 인증 필수 (현재) | **현재 유지**: 일반적으로 예약은 로그인 필수, 보안상 익명 예약은 피함 |
| **performance_ended** 시점 불분명 | DB status만 믿고 있음 | **Webhook/알림 추가**: 10초 전 카운트다운 + performance_ended 이벤트 명확히 |
| **카운트다운 10초 전 전환** | 미구현 | **간단 구현**: 프론트 JS 타이머 (`startTime - now` 계산), 10초 남으면 전환 |
| **팀 탈퇴 시 경고** | 미구현 | **간단 구현**: 팀원 수 조회 후 2명 이하면 경고 모달 |

---

## 6. 최종 권장 실행 순서 (비용 최소화)

### 즉시 (비용 0 ~ 낮음)
1. **카운트다운 알림** - 프론트 JS 타이머 (`src/app/live/[id]/page.tsx`)
2. **채팅 내역 다운로드** - 기존 `downloadChatAsText` 연결
3. **explore 지도/그리드 전환** - 뷰 토글 버튼
4. **아바타 선택 UI** - 기존 hairColor/topColor/bottomColor 활용

### 단기 (비용 중간)
5. **Web Push 알림** - Service Worker + Push API (10분/5분/30분 전)
6. **Pad 화면 분할** - CSS 반응형 개선
7. **공연화면 설정** - `dashboardConfig` JSON 필드

### 중기 (비용 높음, 트래픽 발생 후)
8. **팀 기능** - Team 모델 + UI
9. **스트리밍** - `streamingEnabled` 활성화
10. **관리자 대시보드** - Admin 페이지

### 삭제 또는 무기한 연기
- AWS Docker/Scale-up → 현재 방식 유지
- 장소 제공자 (Venue) → 초기 불필요
- 기업 광고 (Advertiser) → AdSense로 대체
- 등급 시스템/수익 분배 → 초기 단일 등급

---

## 7. Prisma schema 수정 제안 (최소 변경)

```prisma
model Singer {
  // 기존 필드 유지
  hairColor     String?  // 관객 아바타용으로 재활용
  topColor      String?
  bottomColor   String?
  
  // 추가 제안 (Phase 3)
  dashboardConfig Json? @map("dashboard_config") // 공연화면 레이아웃 설정
}

model Profile {
  // 기존 필드 유지
  pushToken      String? @map("push_token") // Web Push 구독 토큰 (Phase 2)
  preferredKm    Int      @default(5) @map("preferred_km") // 주변 공연 알림 반경
}
```

---

## 8. 요약: 변경된 판단

| 구분 | 최초 요건 | 현재/제안 | 판단 근거 |
|------|-----------|----------|----------|
| 채팅 서버 | AWS Docker | Socket.io | 초기엔 과금 복잡도 불필요, 일반적 방식 |
| 알림 | Push (30/10/5분, 10초) | Web Push API | FCM보다 가볍고 표준 |
| 결제 | 카카오/네이버/애플/QR/생체 | Stripe + 카카오 | 일반적 조합, 나머지 비용 대비 효용 낮음 |
| 장소 제공자 | 별도 모델+UI | 가수 직접 등록 유지 | 초기엔 불필요, 추후 검토 |
| 기업 광고 | 텍스트/이미지/영상 | AdSense로 대체 | 별도 시스템 구축 비용 과다 |
| 관리자 | 수익분배/모니터링 | DB 직접 관리 | 트래픽 발생 후 구현, 초기 복잡도 낮춤 |

---

**업데이트**: 2026-05-05 Sisyphus  
**다음**: Phase 2 (관객 경험 개선) 시작 시 `docs/tasks.md` 업데이트
