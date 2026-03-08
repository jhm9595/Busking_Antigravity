# Busking Antigravity Master Test Script 🚀 (PowerShell 한글판)

Write-Output "==============================================="
Write-Output "   🎸 Busking Antigravity 통합 테스트 스위트   "
Write-Output "==============================================="

# 1. 서버 연결 확인
Write-Output "[1/6] 서버 연결 확인 중 (localhost:3000)..."
$response = try { Invoke-WebRequest -Uri "http://localhost:3000/api/performances" -Method Head -ErrorAction Stop } catch { $null }

if ($response -and $response.StatusCode -eq 200) {
    Write-Output "✅ 서버 온라인 확인!"
} else {
    Write-Output "❌ 에러: localhost:3000에 연결할 수 없습니다."
    Write-Output "   먼저 'npm run dev'로 서버를 실행해 주세요."
    exit 1
}

# 2. 백엔드 API 스캔
Write-Output "[2/6] 백엔드 API 로직 스캔 중..."
try {
    node ./test-suite/api-tester.js
    Write-Output "✅ API 스캔 완료!"
} catch {
    Write-Output "❌ API 스캔 실패."
    exit 1
}

# 3. 채팅 서버 연결 확인
Write-Output "[3/6] WebSocket 채팅 서버 상태 점검..."
try {
    node ./test-suite/chat-tester.js
    Write-Output "✅ 채팅 서버 연결 확인 완료!"
} catch {
    Write-Output "❌ 채팅 서버 연결 실패."
    exit 1
}

# 4. DB 및 Prisma 동기화 체크
Write-Output "[4/6] 데이터베이스(DB) 및 Prisma 스키마 일치 여부 확인..."
node ./test-suite/health-check.js

# 5. 전체 서비스 생명주기 시뮬레이션
Write-Output "[5/6] 전체 프로세스 흐름 시뮬레이션 실행..."
try {
    node ./test-suite/full-lifecycle-test.js
    Write-Output "✅ 프로세스 시뮬레이션 완료!"
} catch {
    Write-Output "⚠️ 시뮬레이션 중 오류가 발생했습니다. (위의 DB 싱크 상태를 확인하세요)"
}

# 6. 비주얼 대시보드 실행
Write-Output "[6/6] 시각적 테스트 대시보드 실행 중..."
$dashboardPath = Join-Path $PSScriptRoot "visual-dashboard.html"
Start-Process $dashboardPath

Write-Output "==============================================="
Write-Output "   ✨ 모든 테스트 완료! 즐거운 코딩 되세요!    "
Write-Output "==============================================="
