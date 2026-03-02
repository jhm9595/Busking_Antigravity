---
description: Test end-to-end live chat functionality for a performance
---
# Live Chat End-to-End Test Scenario

이 워크플로우 문서는 버스킹 어플리케이션의 실시간 채팅 기능(Socket.io + Redis)이 정상적으로 동작하는지 검증하기 위한 테스트 절차입니다. 

## 테스트 환경 준비
1. 테스트할 대상 URL(예: `http://localhost:3000` 또는 `https://busking.minibig.pw`) 접속
2. 가수 계정으로 로그인 (세션이 없다면)

## 테스트 진행 절차
1. **공연 생성 단계 (`/singer/dashboard`)**
   - 대시보드의 공연 등록 패널에서 제목(Title), 위치(Location)를 입력합니다.
   - **중요**: 시작 시간(Start Time)을 **현재 시간보다 과거 또는 현재 시간**으로 설정합니다. (공연 시작 10분 전부터 채팅창 오픈이 가능한 제약사항을 우회하기 위함입니다.)
   - '실시간 채팅 활성화(Enable Chat)' 체크박스를 클릭합니다.
   - '공연 등록(Register)'을 클릭합니다.

2. **라이브 모드 진입**
   - 대시보드의 '공연 모드 시작(Start Performance Mode)' 버튼을 클릭합니다.
   - 방금 생성한 테스트 공연을 선택해 라이브 대시보드로 진입합니다.

3. **채팅창 오픈 및 연결 검증**
   - '실시간 채팅' 탭으로 이동합니다.
   - '채팅창 열기(Open Chat Room)' 버튼을 클릭합니다.
   - (이때 브라우저 콘솔을 열어 `NEXT_PUBLIC_CHAT_SERVER_URL is not set` 에러나 WebSocket 연결 에러가 없는지 확인합니다.)

4. **메시지 전송 테스트**
   - 하단 채팅 입력창이 활성화되면 텍스트를 입력하고 전송합니다.
   - 내가 보낸 메시지가 정상적으로 화면에 렌더링되는지 확인합니다.
   - 서버에서 전달받은 최초 시스템 메시지("채팅창이 열렸습니다!")가 떠 있는지 확인합니다.

5. **클린업 (정리)**
   - 우측 상단의 '공연 종료(End)' 버튼을 눌러 테스트용 방을 종료합니다.
