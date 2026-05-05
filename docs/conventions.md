# Project Conventions

> Standard patterns used in this project. Follow these to keep the codebase consistent.

---

## File & Folder Naming

| Type | Convention | Examples |
|------|------------|---------|
| Components | PascalCase.tsx | `AppHeader.tsx`, `ThemeSwitcher.tsx`, `BuskingMap.tsx` |
| Component Folders | kebab-case (route-based) | `src/components/audience/`, `src/components/singer/` |
| Hooks | camelCase with `use` prefix | `useSocket.ts`, `useCountdown.ts`, `useFetch.ts` |
| Utility/Service files | camelCase or kebab-case | `prisma.ts`, `demo-mode.ts`, `performance-lifecycle.ts` |
| API Routes | App Router convention | `src/app/api/performances/route.ts` |
| Pages | `page.tsx` in route folder | `src/app/explore/page.tsx`, `src/app/singer/live/page.tsx` |
| CSS Modules | `ComponentName.module.css` | `AppHeader.module.css`, `LandingPage.module.css` |
| Types | camelCase or `types.ts` | `src/types/index.ts`, `src/types/performance.ts` |

---

## Component Structure

```tsx
'use client'  // Add for client components, omit for server components

import Link from 'next/link'
import styles from './ComponentName.module.css'

export default function ComponentName() {
    return (
        <div className={styles.container}>
            ...
        </div>
    )
}
```

**Rules:**
- Server components by default. Add `'use client'` only when using hooks, event handlers, or browser APIs.
- Named exports preferred: `export default function ComponentName()`
- CSS Modules for component-specific styles; Tailwind for utility classes.

---

## Import Conventions

```typescript
// 1. Next.js core
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 2. Absolute imports (via @/ alias → src/)
import { prisma } from '@/lib/prisma'
import AppHeader from '@/components/common/AppHeader'
import { useSocket } from '@/hooks/useSocket'

// 3. Third-party (alphabetical)
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { z } from 'zod'

// 4. Relative imports (only within same folder or close parent)
import styles from './Component.module.css'
import { helper } from '../lib/helper'
```

**Order:** Next.js → Absolute (`@/`) → Third-party → Relative

---

## TypeScript Rules

```json
// tsconfig.json (current)
{
  "compilerOptions": {
    "strict": true,           // No implicit any
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] },
    "noEmit": true,
    "isolatedModules": true
  }
}
```

**Rules:**
- No `as any`, `@ts-ignore`, or `@ts-expect-error` to suppress errors.
- Use `type` keyword for type-only imports: `import type { Metadata } from "next"`
- Interfaces preferred over types for objects; types for unions/computed.
- Keep types in `src/types/` or co-located with usage.

---

## Styling

- **Tailwind CSS 4** via PostCSS: utility classes in JSX (`className="flex items-center"`)
- **CSS Modules**: component-specific styles in `*.module.css`
- **Global styles**: `src/app/globals.css`
- **Theming**: `next-themes` with `data-theme` attribute; Tailwind `dark:` variant
- **Animations**: Framer Motion for complex animations; CSS transitions for simple ones

```tsx
// Good: Tailwind + optional CSS module
<div className="flex items-center gap-2 p-4 bg-background text-foreground">
  <Component />
</div>

// Avoid: inline styles (except dynamic values)
<div style={{ marginLeft: dynamicValue }}>  // OK for dynamic
<div style={{ padding: '1rem' }}>           // Bad, use Tailwind
```

---

## API & Server Actions

```typescript
// App Router Route (src/app/api/performances/route.ts)
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const { userId } = await auth()  // Server-side identity
    // ...
}

export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    // ...
}
```

**Rules:**
- **Server-side auth only**: `auth()` from `@clerk/nextjs/server`, never trust client payload for identity.
- **Business logic in services**: `src/services/singer.ts`, not in route handlers.
- **GET = read-only**: No Prisma writes in GET handlers.
- **Error responses**: Use `Response.json({ error: '...' }, { status: N })`

---

## Database (Prisma)

```prisma
// Model naming: PascalCase, table mapping with @@map
model Performance {
  id         String   @id @default(uuid())
  singerId   String   @map("singer_id")
  createdAt  DateTime @default(now()) @map("created_at")

  singer     Singer   @relation(fields: [singerId], references: [id])

  @@map("performances")
}
```

**Rules:**
- Models: PascalCase (`Profile`, `Singer`, `Performance`)
- Fields: camelCase in Prisma, snake_case in DB via `@map`
- Relations: explicit `@relation` with `fields` and `references`
- Enums for fixed values (e.g., performance status)

---

## Environment Variables

```bash
# .env.example (reference only, never commit real secrets)

# Public (client-side)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Server-only (no NEXT_PUBLIC_ prefix)
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
```

**Rules:**
- `NEXT_PUBLIC_*` only for values safe to expose in browser
- Server secrets: no prefix, never import in client components
- Reference template in `.env.example`, real values in `.env.local`

---

## Git Commit Convention

```
type(scope): short summary (50 chars or less)

Optional longer body explaining why, not what.
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes nor adds feature |
| `test` | Adding or fixing tests |
| `chore` | Build process, tooling, deps |
| `style` | Formatting, missing semicolons, etc. |
| `perf` | Performance improvement |

**Examples:**
- `feat(auth): add server-side identity derivation`
- `fix(api): prevent GET handlers from mutating DB`
- `docs: restructure documentation for single-agent execution`
- `refactor(lifecycle): centralize live state resolver`

---

## Hooks Pattern

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useCountdown(targetDate: Date) {
    const [remaining, setRemaining] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(Math.max(0, targetDate.getTime() - Date.now()))
        }, 1000)
        return () => clearInterval(interval)
    }, [targetDate])

    return remaining
}
```

**Rules:**
- Always `'use client'` for hooks using React APIs
- Named export: `export function useHookName()`
- Clean up side effects in `useEffect` return
- Co-locate with related components or in `src/hooks/`

---

## Realtime (Socket.io)

```typescript
// Client: src/hooks/useSocket.ts
'use client'
import { io, Socket } from 'socket.io-client'

export function useSocket(roomId: string) {
    // Connect in useEffect, cleanup on unmount
}

// Server: realtime-server/server.js
// Privileged actions verified through Next.js API first, then broadcast
```

**Rules:**
- **Socket layer = non-authoritative transport**
- **Privileged emits** (`open_chat`, `performance_ended`): verify through Next.js API first
- **Redis**: transport/cache/history only, not authorization source

---

## Directory Responsibilities

| Directory | Responsibility |
|-----------|-----------------|
| `src/app/` | Routes, layouts, API routes (Next.js App Router) |
| `src/components/` | Reusable React components |
| `src/services/` | Server-side business logic |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Utilities, Prisma client, helpers |
| `src/types/` | TypeScript type definitions |
| `src/contexts/` | React contexts (Language, Theme) |
| `src/utils/` | Client-side utilities |
| `src/content/` | Static content (guides, i18n) |
| `prisma/` | Database schema and migrations |
| `realtime-server/` | Standalone Socket.io server |
| `docs/` | Project documentation |
| `test-suite/` | Node-based smoke/security tests |
| `tests/` | Playwright E2E tests |
