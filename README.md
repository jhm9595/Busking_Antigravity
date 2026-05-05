# minimic

Street performance revolution - a platform for buskers and audiences.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (Next.js + realtime server)
npm run dev

# Build
npm run build

# Start production
npm run start

# Database
npx prisma generate
npx prisma db push
```

## Environment

Copy `.env.example` to `.env.local` and fill in required keys:
- Clerk (auth)
- PostgreSQL (via docker-compose or Supabase)
- Stripe (payments)
- Google Maps API
- AdSense Client ID

## Docs

All project documentation lives in [`docs/`](./docs/):

- **[docs/README.md](./docs/README.md)** - Documentation structure and policy
- **[docs/charter.md](./docs/charter.md)** - What this project is, scope, constraints
- **[docs/architecture.md](./docs/architecture.md)** - Tech stack, folder map, key patterns
- **[docs/tasks.md](./docs/tasks.md)** - Ordered task list (single source of truth)

## Stack

Next.js 16 (App Router) / TypeScript / Prisma + PostgreSQL / Socket.io / Clerk / Tailwind CSS 4 / Stripe / AdSense

## Support

support@busking.minibig.pw
