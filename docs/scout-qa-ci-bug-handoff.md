## Agent
Scout QA

## Task
Diagnose why Kakao Pay keys added to GitHub Secrets are not working in the application.

## Result
Identified two critical environment configuration gaps:
1. **Production Defect**: The `.github/workflows/deploy.yml` file lacks the required mapping to inject Kakao Pay secrets (e.g., `KAKAO_PAY_SECRET_KEY`) into the Google Cloud Run `env_vars`. GitHub Secrets exist, but are not passed to the production container.
2. **Local Defect**: The local development server lacks these keys in `.env.local`.

## Evidence
- files: `.github/workflows/deploy.yml` (missing KAKAO_PAY_SECRET_KEY mapping in `env_vars: |-` block)
- commands: Manual review of deploy pipeline YAML.
- logs: N/A

## Risks
- Payment flow cannot be tested either locally or in production until the configurations are properly mapped and injected.

## Next Owner
Forge Dev

## Next Action
1. Modify `.github/workflows/deploy.yml` to inject the Kakao Pay secrets into the Cloud Run deployment securely.
2. Provide a mock or `.env.local` setup instruction to allow local Scout QA E2E validation.
