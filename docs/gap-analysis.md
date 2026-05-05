# 최초 요건 vs 현재 구현 상태 갭 분석 (Gap Analysis)

> **목적**: 최초 요건(`최초요건.txt`)과 현재 시스템을 비교하여, 구현된 것/미구현된 것/변경 필요한 것을 정리한다.
> **기준일**: 2026-05-05
> **담당**: Sisyphus (단일 AI)

---

## 1. 사용자 유형별 구현 상태

| 사용자 유형 | 최초 요건 | 현재 상태 | 비고 |
|------------|-----------|----------|------|
| **가수 (Singer)** | 필수 회원가입, 로그인 | ✅ IMPLEMENTED | Clerk 인증, Profile.role='singer' |
| **관객 (Audience)** | 회원가입 선택, 비회원도 일부 가능 | ✅ IMPLEMENTED | Profile.role='audience' |
| **장소 제공자 (Venue)** | 장소/시간/연락처 등록, 대여 | ❌ NOT IMPLEMENTED | Venue 모델 Prisma 스키마에 없음 |
| **기업 (Advertiser)** | 광고 노출, 승인/결제 | ⚠️ PARTIAL | API 라우트 있으나 UI/승인 플로우 미흡 |
| **관리자 (Admin)** | 수익 분배, 승인, 모니터링 | ❌ NOT IMPLEMENTED | Admin 모델/UI 없음 |

---

## 2. 가수(Singer) 기능별 상세

### ✅ 구현됨 (IMPLEMENTED)

| 요건 | 설명 | 현재 구현 | 파일/API |
|------|------|----------|---------|
| 회원가입/로그인 | Gmail, Kakao, Naver | Clerk 인증 | `src/app/api/auth/` |
| 공연 등록 | 시간, 장소, 노래 순서, 채팅 여부 | POST /api/performances | `src/app/api/performances/route.ts` |
| YouTube URL | 노래당 유튜브 링크 선택적 추가 | Song.youtubeUrl 필드 존재 | `prisma/schema.prisma` |
| SNS 등록 | 유튜브/인스타그램 등 | Singer.socialLinks | `src/app/singer/dashboard/` |
| 실시간 채팅 | 공연 중 관객과 채팅 | realtime-server | `realtime-server/server.js` |
| 채팅 유료화 | 시간당 금액 지불, pay-as-you-go | performance.chatEnabled, chatCostPerHour | `src/app/api/performances/route.ts` |
| 곡 완료 표시 | 부른 노래 완료 표시 | PerformanceSong.status = 'completed' | `src/app/live/[id]/page.tsx` |
| 실시간 추천곡 | 관객 신청곡 실시간 목록 | POST /api/song-requests | `src/app/api/song-requests/route.ts` |
| 카드/QR/생체결제 | 사전 카드 등록, 간편 결제 | Stripe + KakaoPay | `src/app/api/payment/kakao/` |
| 팀 멤버 등록 | 공연 시 팀원 등록 | Singer.teamId (필드만 존재) | `prisma/schema.prisma` |
| QR 코드 | 가수별 고유 QR, @활동명 포함 | Singer.qrCodePattern, SingerQRCard 컴포넌트 | `src/components/singer/SingerQRCard.tsx` |
| 공연 대시보드 | Pad: 화면 분할, Phone: 탭 기반 | `src/app/live/[id]/page.tsx` (단일 뷰) | ⚠️ 미흡 - 분할 뷰 미구현 |
| 포인트 시스템 | 후원, 채팅료 차감/적립 | Profile.points, PointTransaction | `prisma/schema.prisma` |

### ⚠️ 부분 구현 (PARTIAL)

| 요건 | 설명 | 현재 상태 | 개선 필요 |
|------|------|----------|----------|
| **공연 대시보드 (분할 뷰)** | Pad: 왼쪽 곡목록/오른쪽 반응+채팅, Phone: 탭 기반 | 현재 단일 스크롤 뷰만 구현 | Pad/Phone 분기 처리 필요 |
| **팀 멤버 기능** | 팀 결성, 팀원 관리, 2명 남은 경우 탈퇴 경고 | teamId 필드만 존재, 팀 모델/UI 없음 | Team 모델 + UI 구현 필요 |
| **카운트다운 알림** | 30분, 10분, 5분 전 푸시, 10초 전 카운트다운 | 구현되지 않음 | Phantom/Web Push API 필요 |
| **현재 공연자 변경** | 팀 멤버가 돌아가며 공연, 다중 선택 | 구현되지 않음 | 팀 기능 선행 필요 |
| **노래 관리 커스터마이징** | 숙련도, 공연여부 등 본인 필드 추가, select box 커스터마이징 | 기본 곡 관리만 가능 | Song 모델 확장 + UI 필요 |
| **공연화면 커스터마이징** | Pad: 위치/크기/show-hide, 팀원별 개별 설정 | 구현되지 않음 | 설정 UI + 저장 로직 필요 |
| **채팅 참여 예약** | 인원 초과 시 예약 버튼, 알림 | '채팅 인원 찼음' 메시지만 | 예약 큐 시스템 필요 |
| **특정 관객 등급 승인** | 관객 등급 지정 요청/승인 | 등급 시스템 없음 | Grade/Tier 모델 필요 |

### ❌ 미구현 (NOT IMPLEMENTED)

| 요건 | 설명 | 추후 구현 여부 |
|------|------|----------------|
| **채팅 서버 Docker 형태** | 요청 시에만 열리는 Docker 기반 채팅 | ⚠️ 추후 (AWS Scale-out 대신 Socket.io 사용 중) |
| **채팅 서버 Scale-up** | AWS 기반 자동 스케일업, 추가 과금 | ⚠️ 추후 (현재 단일 서버) |
| **공연 1분 전 채팅 참여자 변경** | 변경 시 추가 결제 | ❌ 미구현 |
| **알림 설정 메뉴** | 푸시 알림 수신 방법 선택 | ❌ 미구현 |
| **iOS AirDrop 공유** | QR 코드 공유 시 AirDrop 옵션 | ❌ 미구현 |
| **채팅 내역 다운로드** | 공연 종료 후 텍스트 다운로드 | ❌ 미구현 (UI만 있음: `downloadChatAsText`) |
| **다중 공연자 표시** | 팀_members별 현재 공연자 표시 | ❌ 미구현 (팀 기능 선행 필요) |
| **관객 메시지 (비회원 가능)** | 연락처/이메일 필수, 비회원도 가능 | ⚠️ PARTIAL (BookingRequest는 있으나 비회원 접근 불명확) |

---

## 3. 관객(Audience) 기능별 상세

### ✅ 구현됨 (IMPLEMENTED)

| 요건 | 설명 | 현재 구현 |
|------|------|----------|
| QR/링크로 가수 정보 조회 | `/singer/[id]` 페이지 |
| 채팅 참여 | `realtime-server` 연결, `join_room` |
| 신청곡/공연 요청 | POST /api/song-requests, POST /api/booking |
| 닉네임 설정 | audience username in `join_room` |
| 가수 SNS 클릭 시 이동 | `src/app/singer/[id]/page.tsx` |
| 회원가입 유도 | 로그인 안 한 경우도 일부 기능 이용 가능 |

### ⚠️ 부분 구현 (PARTIAL)

| 요건 | 설명 | 현재 상태 |
|------|------|----------|
| **아바타 선택** | 모자/헤어스타일, 피부색, 옷색깔, 바지 선택 → 이모티콘 생성 | Singer 모델에 hairColor, topColor, bottomColor 있으나 **관객용은 없음**, UI 미구현 |
| **닉네임+일련번호** | 누구나 겹칠 수 있지만 내부 일련번호 관리 | username만 구현, 일련번호 없음 |
| **즐겨찾기** | 가수 즐겨찾기, 알림 수신 | Follow 시스템은 있으나 알림 미구현 |
| **등급 시스템** | 특정 등급=빠른 알림, 특정 정보 노출 | ❌ NOT IMPLEMENTED (Grade 모델 없음) |
| **광고 제거 구매** | 광고 안 보게 하기, 미구매 시 텍스트/영상 광고 | GoogleAd 컴포넌트 있으나 구매 로직 미구현 |

### ❌ 미구현 (NOT IMPLEMENTED)

| 요건 | 설명 |
|------|------|
| **등급별 알림 차등** | 일반: 1시간 전, 등급자: 즉시 + 변경 내역 상세 |
| **구독료 분배** | 등급자 구독료 → 5:5 분배 (플랫폼:가수) |
| **지도/그리드 전환** | explore 페이지 그리드/지도 뷰 전환 |
| **주변 Nkm 공연 알림** | 위치 기반 푸시 알림 |

---

## 4. 장소 제공자(Venue Provider) - ❌ NOT IMPLEMENTED

| 요건 | 설명 | 상태 |
|------|------|------|
| 장소 등록 | 지도+텍스트, 대여 비용, 시간 | ❌ Prisma에 Venue 모델 없음 |
| 대여 내역 조회 | 간단한 목록 UI | ❌ 미구현 |
| 30분 단위 대여 | 시간 단위 예약 | ❌ 미구현 |
| 장비 정보 | 드럼, 건반, 마이크, 스피커 체크박스 | ❌ 미구현 |
| 채팅 예약 | 관객과 채팅하여 예약 | ❌ 미구현 (추후) |

---

## 5. 기업(Advertiser) - ⚠️ PARTIAL

| 요건 | 설명 | 상태 |
|------|------|------|
| 텍스트 광고 | 채팅창 1회 올라오는 텍스트 | ⚠️ API만 있음 (`/api/ad/`) |
| 이미지 광고 | 사이트 내 이미지 노출 | ⚠️ API만 있음 |
| 영상 광고 | 버튼 클릭 시 동영상 | ⚠️ API만 있음 |
| 광고 신청/승인 | 문구, 이미지, 영상 업로드 + 승인 | ⚠️ API + 관리자 승인 플로우 없음 |
| 입금 계좌/실시간 결제 | 승인 후 결제 | ❌ 미구현 |

---

## 6. 관리자(Admin) - ❌ NOT IMPLEMENTED

| 요건 | 설명 | 상태 |
|------|------|------|
| 광고 승인/결제 완료 처리 | 입금 확인 후 승인 | ❌ Admin 모델/UI 없음 |
| 구독료 수익 분배 비율 변경 | 기본 5:5, 관리자 조정 가능 | ❌ 미구현 |
| 공연 등록 현황 | 현재 공연 목록 모니터링 | ❌ 미구현 |
| 지역별 등록 현황 | 지역별 통계 | ❌ 미구현 |
| 광고 문의 답변/승인 | 광고 관련 문의 처리 | ❌ 미구현 |
| 쿠폰 이벤트 | 무료 사용 시간 쿠폰 | ❌ 미구현 |
| 공연 취소/삭제 | 가수/기업 직접 취소 + 관리자 강제 취소 | ❌ 미구현 |
| 실시간 수익 현황 | 대시보드 | ❌ 미구현 |
| 관리자 권한 위임 | 특정 유저에게 일부 기능 위임 | ❌ 미구현 |
| 실시간 채팅 모니터링 | 진행 중인 채팅 모니터링 | ❌ 미구현 |
| 인기 가수 모니터링 | 가장 많은 참여자 가수 목록 | ❌ 미구현 |

---

## 7. 추후 추가 기능 (준비중으로 표시)

| 기능 | 상태 | 비고 |
|------|------|------|
| **실시간 스트리밍** | ❌ 준비중 (streamingEnabled 필드만 있음) | `Performance.streamingEnabled` |
| **등급별 스트리밍 시청** | ❌ 준비중 | 스트리밍 선행 필요 |
| **장소 대여 시 채팅 예약** | ❌ 준비중 | 장소 제공자 기능 선행 |
| **스트리밍 중 영상 광고** | ❌ 준비중 | 스트리밍 + 광고 선행 |

---

## 8. 변경된 구현 방식 (Original vs Current)

| 요건 | 최초 방식 | 현재 방식 | 비고 |
|------|-----------|----------|------|
| **채팅 서버** | AWS Docker, 요청 시 열림, Scale-up | Socket.io 단일 서버, Redis 캐시 | AWS 대신 기본 구현 |
| **알림** | Push 알림 (30분, 10분, 5분, 10초 전) | 구현되지 않음 | Web Push API 필요 |
| **결제** | 카카오페이, 네이버페이, 애플페이, QR, 생체인증 | Stripe + 카카오페이 | 네이버페이/애플페이 미구현 |
| **채팅 인원scale** | 예상 인원 사전 결제, 과금 | chatCapacity 필드 있으나 자동 과금 로직 미흡 | |

---

## 9. 권장 실행 순서 (Priority)

### Phase 1: 보안 및 기본 완성 (현재 진행 중)
- ✅ 보안 강화 (Auth, Realtime authority) - 진행 중
- ✅ Pre-deploy 파이프라인 - 완료
- ⏳ AdSense 준비 (robots, sitemap, guide 콘텐츠) - pending

### Phase 2: 가수/관객 필수 기능
1. **공연 대시보드 분할 뷰** (Pad/Phone 대응) - `src/app/live/[id]/page.tsx`
2. **아바타 선택 UI** (관객용) - `src/components/audience/AvatarSelector.tsx`
3. **푸시 알림 시스템** - Web Push API 또는 FCM 연동
4. **채팅 내역 다운로드** - `downloadChatAsText` 활성화

### Phase 3: 등급/수익 분배 시스템
1. **Grade/Tier 모델** - `prisma/schema.prisma` 확장
2. **등급별 알림 차등** - 알림 시스템 연동
3. **구독료 분배 (5:5)** - Admin UI + 정산 로직
4. **광고 제거 구매** - 결제 플로우

### Phase 4: 팀 기능
1. **Team 모델** - `prisma/schema.prisma`
2. **팀 결성/탈퇴 UI** - `src/app/singer/team/`
3. **현재 공연자 변경** - `src/app/live/[id]/page.tsx`
4. **공연화면 커스터마이징** - 설정 UI

### Phase 5: 장소 제공자 (Venue)
1. **Venue 모델** - `prisma/schema.prisma`
2. **장소 등록 UI** - `src/app/venue/`
3. **대여 예약 시스템** - API + 채팅 예약

### Phase 6: 기업 광고 (Advertiser)
1. **광고 신청 UI** - `src/app/advertiser/`
2. **관리자 승인 플로우** - Admin 시스템 선행 필요
3. **광고 노출 로직** - 채팅창, 사이트, 영상

### Phase 7: 관리자 (Admin)
1. **Admin 모델 + 로그인** - `prisma/schema.prisma`
2. **관리자 대시보드** - `src/app/admin/`
3. **수익/통계/모니터링** - 각종 현황 UI
4. **권한 위임** - Admin delegation

### Phase 8: 추후 기능 (스트리밍 등)
- 실시간 스트리밍 (준비중 필드 활성화)
- 스트리밍 중 광고 삽입

---

## 10. 즉시 조치 필요 (High Priority within Current Scope)

| 항목 | 이유 | 관련 파일 |
|------|------|----------|
| **푸시 알림 시스템** | 최초 요건의 핵심, 현재 없음 | 신규 구현 필요 |
| **explore 페이지 지도/그리드 전환** | 관객 유형의 주요 기능 | `src/app/explore/page.tsx` |
| **프로필 사진/아바타** | Singer.hairColor 등 필드는 있으나 UI 없음 | `src/components/` |
| **GoogleAd 실제 노출** | AdSense 승인용, 현재 placeholder | `src/components/common/GoogleAd.tsx` |
| **BookingRequest 비회원 접근** | 최초 요건: 비회원도 메시지 가능 | `src/app/api/booking/route.ts` |

---

**작성일**: 2026-05-05  
**작성자**: Sisyphus (단일 AI)  
**다음 업데이트**: Phase 2 시작 시
