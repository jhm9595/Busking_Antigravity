# Architecture Context

> Updated as the project evolves. Stale sections should be deleted.

---

## Folder Map

```
Busking_Antigravity/
├── src/
│   ├── app/              # Next.js App Router (routes, API routes, layouts)
│   │   ├── api/          # REST API routes (performances, singers, song-requests, booking)
│   │   ├── singer/       # Singer dashboard, live control, profile
│   │   ├── live/         # Public live-view pages
│   │   ├── explore/      # Public discovery page
│   │   └── (public)/     # About, Privacy, Terms, Contact, Guides
│   ├── components/       # React components (home, explore, singer, live, common)
│   ├── services/         # Server-side business logic (singer.ts, etc.)
│   ├── lib/              # Utilities, Prisma client, demo mode
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts (Language, Theme)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Client-side utilities (performance helpers, etc.)
│   ├── content/          # Static content (guides, i18n)
│   ├── locales/          # i18n translation files
│   └── styles/          # Global CSS
├── prisma/
│   └── schema.prisma     # DB schema (PostgreSQL)
├── realtime-server/      # Standalone Socket.io server (server.js)
├── chat-server/          # (Minimal / unused)
├── public/               # Static assets (images, ads.txt, guide drafts)
├── docs/                 # Project documentation (this folder)
├── test-suite/           # Node-based smoke/security tests
├── tests/                # Playwright E2E tests
├── scripts/              # Utility scripts
├── supabase/             # Supabase config (partially used)
└── output/               # Build artifacts / temp
```

---

## Key Patterns

### Auth & Identity
- **Source of truth**: Clerk server-side (`auth()` from `@clerk/nextjs/server`)
- **Never trust**: `userId`, `singerId`, `fanId`, `userType` from client payloads
- **Ownership check**: Resolve from Prisma (`Performance.singerId`, `Singer.id`)

### Performance Lifecycle
- **Persisted state**: `prisma schema: Performance.status` (scheduled/active/ended/canceled)
- **Computed state**: Shared resolver in `src/services/singer.ts` or `src/utils/performance.ts`
- **No GET writes**: Lifecycle resolution is read-only in API/UI handlers

### Realtime Authority
- **Server**: `realtime-server/server.js` (Socket.io)
- **Client emits**: `join_room`, `send_message`, `song_request`, `open_chat`, `performance_ended`, `system_alert`
- **Rule**: Privileged emits (`open_chat`, `performance_ended`, `system_alert`) must be verified through app API first, then broadcast
- **Redis**: Transport/cache/history only, not authorization source

### Database (Prisma + PostgreSQL)
- Core models: `Profile`, `Singer`, `Performance`, `Song`, `BookingRequest`, `Follow`, `PointTransaction`, `ChatMessage`
- Auth model: `Profile` linked to Clerk ID (`id` = Clerk user ID)
- Ownership: `Performance.singerId` references `Singer.id`

---

## Data Flow (Live Performance)

```
[Singer] --API--> [Next.js /api] --Prisma--> [PostgreSQL]
   |                                           |
   +--emit open_chat/ended--> [realtime-server] --broadcast--> [Audience]
                                               ^
[Audience] --emit message/request--> [realtime-server] --------+

Privileged actions: Singer --> Next.js API (auth check) --> realtime broadcast
```

---

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (via docker-compose or Supabase) |
| `DIRECT_URL` | Prisma direct connection |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client |
| `CLERK_SECRET_KEY` | Clerk server |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps |
| `STRIPE_SECRET_KEY` | Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | AdSense |

---

## Build & Run

```bash
# Dev (Next.js + realtime server)
npm run dev

# Build
npm run build

# Start production
npm run start

# Prisma
npx prisma generate
npx prisma db push

# Docker
docker-compose up -d   # postgres + redis
```

---

## Known Issues to Address

- [ ] GET handlers in `app/api/performances/route.ts` and `app/api/singers/[id]/route.ts` mutate DB state
- [ ] `src/services/singer.ts` accepts caller-provided IDs for writes (no ownership check)
- [ ] Realtime server trusts `userType` and `capacity` from socket payload
- [ ] `test-suite/api-tester.js` and `chat-tester.js` have stale assumptions
- [ ] AdSense crawlability (robots.txt, sitemap.xml) not yet implemented
- [ ] Public legal pages (/about, /privacy, /terms, /contact) missing
- [ ] Public guide articles (20+) not yet created
