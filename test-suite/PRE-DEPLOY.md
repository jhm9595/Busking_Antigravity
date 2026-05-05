# Pre-Deploy Verification Pipeline

> **목적**: 배포 전 모든 테스트를 한 번에 실행하여, 기존 기능이 깨지지 않았는지 확인한다.
> 모든 검증이 통과해야만 배포가 허용된다.

## 원칙

1. **ALL-OR-NOTHING**: 하나라도 실패하면 배포 중단
2. **독립적 실행**: 각 검증 단계는 독립적으로 실행되며, 실패해도 다음 단계를 진행하여 전체 상황 파악
3. **아티팩트 보존**: `test-suite/results/` 에 모든 실행 결과 JSON 보존
4. **CI-FRIENDLY**: exit code 0 = 배포 가능, exit code 1 = 배포 금지

## 실행 방법

```powershell
# 전체 검증 + 배포 (모두 통과 시 자동 배포)
.\test-suite\pre-deploy.ps1 -Deploy

# 검증만 실행 (배포하지 않음)
.\test-suite\pre-deploy.ps1

# 개별 검증 단계만 실행
node test-suite/api-tester.js
node test-suite/chat-tester.js
npx playwright test
npm run build
```

## 검증 단계 (순서대로)

| 단계 | 설명 | 실패 시 |
|------|------|---------|
| 1. Lint | ESLint 규칙 준수 확인 | 배포 금지 |
| 2. Build | Next.js 프로덕션 빌드 | 배포 금지 |
| 3. Security Contract | 인증/권한 경계 검증 | 배포 금지 |
| 4. Lifecycle Read-Only | GET 핸들러 DB 쓰기 여부 | 배포 금지 |
| 5. API Smoke | 주요 API 엔드포인트 응답 확인 | 배포 금지 |
| 6. Realtime Auth | 소켓 권한 검증 확인 | 배포 금지 |
| 7. Playwright E2E | 브라우저 기반 E2E 테스트 | 배포 금지 |

## 결과 아티팩트

`test-suite/results/` 디렉토리에 JSON 형태로 저장:

- `pre-deploy-summary.json`: 전체 요약
- `lint-result.json`: Lint 결과
- `build-result.json`: Build 결과
- `security-*.json`: 보안 검증 결과
- `lifecycle-*.json`: 생명주기 검증 결과
- `api-smoke.json`: API 스모크 결과
- `playwright-results/`: Playwright 리포트

## CI/CD 통합

```yaml
# .github/workflows/deploy.yml (예시)
- name: Pre-deploy checks
  run: .\test-suite\pre-deploy.ps1

- name: Deploy
  if: success()
  run: npm run deploy
```

## 주의사항

- 로컬에서 `next dev` 가 실행 중이어야 API 스모크 테스트가 통과함
- 테스트용 DB가 설정되어 있어야 함
- Clerk 인증 키가 환경변수에 설정되어 있어야 함
