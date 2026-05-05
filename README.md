# miniMic Busking Antigravity

miniMic is a Next.js application for connecting street performers and audiences through live performance discovery, real-time chat, song requests, sponsorship, points, artist profiles, and location-based explore flows.

## Start Here

AI agents must read `AGENTS.md` before doing any work.

Human and AI reference docs:

- `AGENTS.md`: mandatory operating rules for AI agents
- `docs/pm-directive.md`: current priority, owner, and acceptance criteria
- `docs/qa-checklist.md`: regression and release QA checklist
- `docs/handoff-template.md`: standard handoff format
- `test-suite/README.md`: executable test-suite reference

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma with PostgreSQL
- Clerk authentication
- Socket.io realtime server
- React Leaflet maps
- Zustand state management

## Common Commands

```bash
npm install
npx prisma generate
npm run dev
npm run lint
npm run build
```

Use the most targeted command first, then widen verification when confidence grows.

## Environment Variables

Required names vary by environment. Never commit values.

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `KAKAO_PAY_SECRET_KEY`
- `NEXT_PUBLIC_REALTIME_SERVER_URL`
- `DISCORD_WEBHOOK_URL` for workflow notifications only

## Repository Discipline

The root checkout is a coordination view. Active implementation, QA artifacts, and design artifacts should use task branches or role-specific worktrees unless the user explicitly says otherwise.