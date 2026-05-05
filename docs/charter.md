# Project Charter

## What is minimic?

A Next.js platform for street performers ("busking") to manage live performances, interact with audiences via realtime chat, and monetize through points, sponsorship, and ads.

**URL**: https://busking.minibig.pw
**Support**: support@busking.minibig.pw

---

## Core Domains

| Domain | Description |
|--------|-------------|
| **Auth** | Clerk (server-side auth, no client-side identity trust) |
| **Performances** | CRUD, lifecycle (scheduled/active/ended/canceled), geolocation |
| **Live** | Realtime server (Socket.io), chat, song requests, donations |
| **Monetization** | Points system, Stripe rewards, AdSense integration |
| **Discovery** | Public explore page, singer profiles, maps (Google Maps / Leaflet) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | PostgreSQL (Prisma ORM) |
| Realtime | Socket.io (separate `realtime-server/`) |
| Styling | Tailwind CSS 4, Framer Motion |
| State | Zustand, React contexts |
| Payments | Stripe |
| Ads | Google AdSense |
| Deploy | Docker, docker-compose |

---

## Key Constraints

1. **Single AI execution**: All work done by Sisyphus in one session. No multi-agent orchestration.
2. **Server-authoritative writes**: No client-supplied `userId`, `singerId`, `userType` for authorization. Always derive identity from Clerk server-side.
3. **Realtime is non-authoritative**: Socket layer is transport only. Privileged actions (end performance, open chat) must go through server-verified app paths first.
4. **GET routes are read-only**: No Prisma writes from GET handlers. Lifecycle state is computed, not persisted, on reads.
5. **Anonymous read allowed**: Discovery, live viewing, and public pages work without login. Writes require auth.
6. **Redis is ephemeral**: Used for realtime transport/cache/history only. Not an authorization source.

---

## Scope Boundaries

**In Scope:**
- Security hardening (auth, lifecycle, realtime authority)
- AdSense approval readiness (robots.txt, sitemap, legal pages, public content)
- Bug fixes and stability
- Realtime server hardening

**Out of Scope:**
- Auth provider migration (Clerk stays)
- Scheduler/cron/event-bus introduction
- Broad service-layer modularization / refactoring
- UI redesign unrelated to security or AdSense readiness

---

## Success Criteria

- `npm run build` passes with zero errors
- `npm run lint` passes
- Unauthenticated writes return 401; non-owner writes return 403
- GET handlers don't mutate DB state
- Socket clients can't escalate privilege via payload claims
- AdSense crawlers can discover public pages (robots.txt, sitemap.xml)
- At least 20 substantive public guide articles exist
