# PM Report: Source Code Audit & Recommendations

**Agent:** Atlas
**Date:** 2026-03-13
**Focus:** Security, Performance, Scalability, and UX Consistency

---

## 1. Security & Authorization

### 🔴 Critical Findings
- **Realtime CORS Policy:** `realtime-server/server.js` uses `origin: '*'`. This should be restricted to the production domain (`busking.minibig.pw`) in the live environment to prevent unauthorized cross-origin connections.
- **Middleware Gaps:** `src/middleware.ts` handles Clerk authentication but doesn't explicitly restrict private routes. While individual Server Actions/API routes have `evaluateTrustBoundary` checks, adding a layer of route-based protection in middleware would provide better "defense in depth".

### 🟡 Improved (Verified)
- **Trust Boundary Foundation:** The `security-contract.js` and `evaluateTrustBoundary` implementation in `src/services/singer.ts` is robust. It correctly checks for ownership before allowing write operations.
- **Realtime Tokens:** The transition to `ownerControlToken` for singer actions (opening chat, ending performance) is correctly implemented, preventing spoofing by audience members.

---

## 2. Performance & Reliability

### 🟡 Medium Priority
- **Sync Pattern:** `src/services/singer.ts` uses `require('@clerk/nextjs/server')` inside an ESM-style Server Action. While functional, this is non-standard and could cause issues with some bundlers or future Next.js versions. Recommend converting to standard `import`.
- **Client-side Points State:** The application often relies on `userPoints` state managed in multiple components. This can lead to desyncs (e.g., charging points in one tab doesn't update the Live page in another). Recommend a global state (Zustand) or SWR/React Query for point balance.
- **Image Optimization:** Many profile pictures and avatars use raw `<img>` tags. Switching to Next.js `<Image />` would provide automatic resizing and lazy loading, improving LCP performance.

---

## 3. UI/UX Consistency

### 🟢 Observation
- **Theming Stability:** The simplification from 8 themes to 4 robust themes has improved the visual stability of the application. The recent fix for `--color-primary-foreground` has resolved major accessibility (contrast) blockers.
- **i18n Gaps:** While the Explore filter is now translated, there are still sporadic hardcoded strings in smaller popups (e.g., some success/error alerts). A full sweep of `alert()` calls is recommended.

---

## 4. Database Integrity (Prisma)

### 🟢 Observation
- **Schema Design:** The relational structure between `Singer`, `Performance`, and `Song` is well-normalized. The use of `@map` for Snake Case consistency in PostgreSQL is good practice.
- **Cascade Deletes:** Delete cascades are correctly configured, ensuring that removing a singer also cleans up their follows and performances.

---

## 🏗️ Next Steps for Development
1.  **Refactor i18n:** Move all remaining hardcoded strings in components to `src/locales/`.
2.  **Environment Sync:** Ensure `KAKAO_PAY_ADMIN_KEY` vs `SECRET_KEY` logic is communicated to DevOps for proper secret injection.
3.  **Realtime Hardening:** Restrict Socket.io CORS origin to specific domains.
