# AdSense Approval Readiness

## TL;DR
> **Summary**: Re-orient AdSense readiness away from expanding the interactive demo and toward crawlable public value: legal pages, public editorial content, crawler-friendly discovery, and approval operations.
> **Deliverables**:
> - Crawlability foundation (`robots.txt`, sitemap, metadata/discovery checks)
> - Public legal pages (`/about`, `/privacy`, `/terms`, `/contact`)
> - Public content hub with 20 substantive articles
> - Landing/header/footer internal linking that surfaces approval-relevant content ahead of demo-only flows
> - Search Console + AdSense application runbook, including post-activation crawler-login setup
> **Effort**: Large
> **Parallel**: YES - 2 waves
> **Critical Path**: 1 -> 3 -> 4 -> 5/6 -> 7 -> 8

## Context
### Original Request
Evaluate whether recent AdSense-related work was actually useful, read `docs/adsense-approval-strategy.md`, derive additional required work, reconsider whether the recent demo-experience work is necessary, and produce an execution plan.

### Interview Summary
- The strategy document frames approval as a crawlable-public-content problem first.
- Existing repo work already includes AdSense script wiring, public demo guide artifacts, and an interactive demo login/bootstrap flow.
- Repo exploration confirms public routes already exist (`/`, `/explore`, `/singer/[id]`, `/live/[id]`), but required legal/editorial surfaces are missing.
- `public/robots.txt` and sitemap generation are both absent.
- Decision made for planning: keep the existing demo as optional support content; do not expand it on the approval-critical path.

### Metis Review (gaps addressed)
- Elevated `robots.txt`, sitemap, Search Console verification, and public policy/support pages to approval-critical prerequisites.
- Added explicit guardrail that crawler-login work is post-activation and must not delay approval-first public work.
- Added measurable editorial threshold so “existing public pages” are not mistaken for sufficient approval value.
- Added QA expectations for crawlability, discoverability, and legal-page linking.

## Work Objectives
### Core Objective
Make the product materially more likely to pass AdSense review by ensuring Google can crawl meaningful public content without login and by adding the required legal/discovery infrastructure that the current repo lacks.

### Deliverables
- Public crawlability baseline implemented and verified.
- Legal/public trust pages exposed from the main public navigation.
- A public article library with at least 20 substantive, indexable, domain-relevant pages.
- Landing-page information architecture adjusted so editorial/public value is easier to discover than the demo-login flow.
- Operational checklist for Search Console verification, AdSense submission, and post-approval crawler login.

### Definition of Done (verifiable conditions with commands)
- `npm run build` succeeds without route-generation or type errors.
- `curl http://localhost:3000/robots.txt` returns `200` content that includes `Mediapartners-Google` and `Google-Display-Ads-Bot` allow rules.
- `curl http://localhost:3000/sitemap.xml` returns `200` and lists legal pages plus the public content hub/article URLs.
- `curl -I http://localhost:3000/privacy`, `curl -I http://localhost:3000/terms`, `curl -I http://localhost:3000/contact`, `curl -I http://localhost:3000/about`, and `curl -I http://localhost:3000/guides` all return `200`.
- Browser QA confirms public navigation exposes legal/content routes from `/` and at least one secondary public page.
- Browser QA confirms the demo CTA still works if retained, but no longer dominates approval-relevant public discovery.

### Must Have
- Explicit robots allowance for AdSense crawlers.
- XML sitemap for public routes.
- Public `About`, `Privacy`, `Terms`, and `Contact` pages.
- Public guide/article hub under `/guides` plus 20 substantive articles.
- Internal links from landing/shared chrome to the new public pages.
- Search Console submission and AdSense application checklist.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- Must NOT expand demo-mode product behavior beyond what already exists unless required to preserve current UX.
- Must NOT rely on screenshot-only guide boards as the primary evidence of site value.
- Must NOT ship placeholder/lorem-ipsum legal or editorial pages.
- Must NOT gate legal pages, guides, sitemap, or robots behind auth.
- Must NOT block approval on crawler login for authenticated pages; that work comes after account activation.
- Must NOT broaden scope into unrelated product polish, dashboard features, or ad-reward logic changes.

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: tests-after + Next.js build checks + browser and HTTP verification.
- QA policy: Every task includes agent-executed happy-path and failure/edge scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: 1) crawlability foundation, 2) public navigation/footer surfacing, 3) legal-page set, 4) guides information architecture, 5) guide content batch A.
Wave 2: 6) guide content batch B, 7) landing/demo de-emphasis and cross-linking, 8) Search Console + AdSense ops runbook.

### Dependency Matrix (full, all tasks)
- Task 1 blocks Tasks 7 and 8.
- Task 2 blocks Tasks 3, 4, and 7.
- Task 3 blocks Task 8.
- Task 4 blocks Tasks 5, 6, and 7.
- Tasks 5 and 6 block Task 8.
- Task 7 depends on Tasks 1, 2, 4, 5, and 6.
- Task 8 depends on Tasks 1, 3, 5, 6, and 7.

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 -> 5 tasks -> `unspecified-high`, `writing`
- Wave 2 -> 3 tasks -> `writing`, `unspecified-high`
- Final Verification -> 4 tasks -> `oracle`, `unspecified-high`, `deep`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Implement crawlability foundation for AdSense approval

  **What to do**: Add App Router-native crawlability primitives using `src/app/robots.ts` and `src/app/sitemap.ts`; update global metadata in `src/app/layout.tsx` to include a real `metadataBase`/canonical-ready configuration derived from the production site domain; ensure sitemap includes `/`, `/about`, `/privacy`, `/terms`, `/contact`, `/guides`, guide detail pages, and other intentionally public routes; explicitly allow `Mediapartners-Google` and `Google-Display-Ads-Bot`.
  **Must NOT do**: Do not block crawlers via wildcard disallow rules; do not include auth-only dashboard URLs in the sitemap; do not add `noindex` to approval-relevant public routes.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: touches routing, metadata, and crawlability behavior across the app.
  - Skills: `[]` — no extra skill is required.
  - Omitted: `['/playwright']` — browser automation is for QA, not implementation.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 7, 8 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `src/app/layout.tsx` — existing site-wide metadata and global script loading.
  - Pattern: `src/middleware.ts` — current auth/public-route behavior to avoid sitemap or robots assumptions that contradict middleware.
  - Pattern: `public/ads.txt` — existing AdSense-related public file already exposed successfully.
  - External: `https://support.google.com/adsense/answer/10532?hl=en` — robots rules for AdSense crawler allowance.
  - External: `https://developers.google.com/crawling/docs/crawlers-fetchers/google-special-case-crawlers` — crawler identity reference.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run build` succeeds with generated `robots.txt` and `sitemap.xml` routes.
  - [ ] `curl http://localhost:3000/robots.txt` includes `User-agent: Mediapartners-Google` and `User-agent: Google-Display-Ads-Bot` with `Allow: /`.
  - [ ] `curl http://localhost:3000/sitemap.xml` includes `/`, `/guides`, and no `/dashboard` or `/singer/dashboard` URLs.
  - [ ] Public legal/content pages added later can be surfaced in the sitemap without manual file duplication.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Crawlability endpoints resolve correctly
    Tool: Bash
    Steps: Start the app locally; run `curl http://localhost:3000/robots.txt`; run `curl http://localhost:3000/sitemap.xml`.
    Expected: Both endpoints return 200; robots body explicitly allows AdSense crawlers; sitemap contains only intended public URLs.
    Evidence: .sisyphus/evidence/task-1-crawlability.txt

  Scenario: Auth-only routes are excluded from discovery
    Tool: Bash
    Steps: Run `curl http://localhost:3000/sitemap.xml | grep dashboard` after the app starts.
    Expected: No auth-only dashboard URLs appear in the sitemap output.
    Evidence: .sisyphus/evidence/task-1-crawlability-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 1 commit

- [ ] 2. Add shared public discovery chrome for legal and guide pages

  **What to do**: Introduce a shared public navigation/discovery pattern so users and crawlers can reach `/about`, `/privacy`, `/terms`, `/contact`, and `/guides` from the main public experience; implement a reusable public footer component and wire it into the landing page plus at least one secondary public route (`/explore`, `/singer/[id]`, or `/live/[id]`), while keeping auth dashboards/live-control surfaces free of unrelated clutter.
  **Must NOT do**: Do not inject a bulky footer into singer-dashboard or venue-dashboard flows; do not hide the links behind drawers or JS-only disclosure controls.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: shared UI integration across multiple public routes without polluting protected flows.
  - Skills: `[]` — existing patterns are sufficient.
  - Omitted: `['/frontend-ui-ux']` — preserve the current app language instead of redesigning the brand system.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4, 7 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `src/components/common/AppHeader.tsx` — current shared public header and route awareness.
  - Pattern: `src/components/home/LandingPage.tsx` — current landing-page CTA structure.
  - Pattern: `src/app/explore/page.tsx` — public secondary route already accessible without login.
  - Pattern: `src/app/singer/[id]/page.tsx` — public detail route where lightweight discovery links can appear.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `/` renders visible discovery links targeting `/about`, `/privacy`, `/terms`, `/contact`, and `/guides`.
  - [ ] At least one secondary public route also exposes the same discovery-link targets.
  - [ ] Dashboard-only flows do not render the public discovery footer.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Public link targets are wired into the landing page
    Tool: Playwright
    Steps: Open `/`; verify visible links named About, Privacy, Terms, Contact, and Guides in the public chrome/footer; inspect each link target.
    Expected: Each link points to the intended public route target even before content-page tasks complete.
    Evidence: .sisyphus/evidence/task-2-public-chrome.png

  Scenario: Dashboard flow stays uncluttered
    Tool: Playwright
    Steps: Authenticate as a demo user if needed; open `/singer/dashboard`; inspect the bottom of the page for public footer links.
    Expected: Dashboard view does not render the public discovery footer intended for approval-facing pages.
    Evidence: .sisyphus/evidence/task-2-public-chrome-error.png
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 1 commit

- [ ] 3. Publish required legal and trust pages

  **What to do**: Create first-class public pages for `/about`, `/privacy`, `/terms`, and `/contact`; write real product-specific copy tied to miniMic’s busking platform, analytics/advertising usage, and account model; the privacy page must explicitly disclose Google advertising cookies and user options; the contact page should expose the default public support destination `support@busking.minibig.pw` with response expectations. If the organization later chooses another monitored alias, update only the contact copy and runbook references.
  **Must NOT do**: Do not use generic legal boilerplate that mentions unrelated products; do not ship placeholder values like `example@example.com`; do not require login to submit or view contact instructions.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: the main work is precise public/legal copywriting grounded in the product.
  - Skills: `[]` — no extra skill is required.
  - Omitted: `['/playwright']` — browser automation belongs in QA.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 8 | Blocked By: 2

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `README.md` — product description, feature set, and terminology for accurate public copy.
  - Pattern: `docs/adsense-approval-strategy.md` — PM-level approval requirements, especially legal-page priority.
  - Pattern: `docs/rewarded-ads-guide.md` — ad/reward behavior and monetization terminology to disclose accurately.
  - Pattern: `src/app/layout.tsx` — existing global metadata context.
  - External: `https://support.google.com/adsense/answer/161351?hl=en` — crawler-login and Search Console context.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `/about`, `/privacy`, `/terms`, and `/contact` all render publicly with meaningful headings and body copy.
  - [ ] `/privacy` explicitly mentions Google advertising cookies / AdSense-related disclosure and opt-out language.
  - [ ] `/contact` contains the explicit public support destination `support@busking.minibig.pw` or the later confirmed replacement alias.
  - [ ] Each page is linked from the shared public discovery chrome.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Legal pages are reachable and complete
    Tool: Playwright
    Steps: Open `/privacy`, `/terms`, `/about`, and `/contact`; capture the main heading and first visible body section on each page.
    Expected: Each route renders product-specific copy; Privacy includes ad/cookie disclosure; Contact includes a real contact destination.
    Evidence: .sisyphus/evidence/task-3-legal-pages.png

  Scenario: Contact page does not ship placeholder data
    Tool: Bash
    Steps: Request `/contact` HTML and search for `example.com`, `todo`, `tbd`, or `placeholder` strings.
    Expected: None of those placeholder markers appear in the response body.
    Evidence: .sisyphus/evidence/task-3-legal-pages-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 1 commit

- [ ] 4. Build the public guides information architecture

  **What to do**: Implement a static, crawlable public content system under `/guides` and `/guides/[slug]` using typed local content data (not login-gated data); create a guide index page, individual article routes, per-article metadata, and structured internal linking between related articles and the legal/trust pages; choose evergreen busking/service topics rather than news-only content so articles remain valid during approval review.
  **Must NOT do**: Do not use client-only fetched content for the guide body; do not hide article text behind tabs or accordions that reduce crawlable visible content; do not route guides through `/api/demo` or any auth middleware bypass hack.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: combines route architecture, static content modeling, and SEO-focused metadata.
  - Skills: `[]` — existing repo patterns are enough.
  - Omitted: `['/refactor']` — no broad refactor is needed; this is additive route work.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 6, 7 | Blocked By: 2

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `src/app/page.tsx` — root App Router page pattern.
  - Pattern: `src/app/explore/page.tsx` — public route pattern already accessible to anonymous users.
  - Pattern: `public/guide-draft.html` — existing feature-guide artifact showing relevant public product topics.
  - Pattern: `public/guide-i18n/en.html` — existing public guide presentation that can inform topic scope, not architecture.
  - Pattern: `README.md` — canonical product capabilities to turn into article topics.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `/guides` renders a server-discoverable article index with titles, excerpts, and links.
  - [ ] `/guides/[slug]` pages are statically discoverable and expose unique page metadata.
  - [ ] Related-article and legal-page links appear within the guide experience.
  - [ ] Guide pages render meaningful article body text without login.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Guide index and detail routes are crawlable
    Tool: Playwright
    Steps: Open `/guides`; click the first article card; confirm URL changes to `/guides/<slug>` and the article body contains multiple text sections.
    Expected: Index and detail routes both render without login; article pages show substantial visible copy.
    Evidence: .sisyphus/evidence/task-4-guides-ia.png

  Scenario: Guide detail does not rely on client-only fetch failures
    Tool: Bash
    Steps: Request a guide detail route with `curl`; inspect the response for the article heading and opening paragraph text.
    Expected: Server-rendered HTML contains article content rather than an empty shell or loading state.
    Evidence: .sisyphus/evidence/task-4-guides-ia-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 1 commit

- [ ] 5. Publish guide content batch A to establish real public value

  **What to do**: Write and publish the first 10 substantive guide articles in Korean for the new `/guides` system, each with at least ~1,000 Korean characters of original body text plus summary/SEO description; use evergreen topics closely tied to the product and busking domain. Required topics for this batch: `버스킹 처음 시작하기`, `홍대/연남 버스킹 준비 체크리스트`, `야외 공연 장비 기초`, `버스커를 위한 기본 음향 팁`, `라이브 공연 공지 잘 쓰는 법`, `버스킹 관객과 소통하는 법`, `공연 중 신청곡 운영 팁`, `후원과 포인트 기능 이해하기`, `싱어 프로필을 매력적으로 만드는 법`, `공연 후 팬을 유지하는 방법`.
  **Must NOT do**: Do not reuse the same introduction/conclusion pattern for all articles; do not produce thin FAQ stubs; do not mention features the app does not actually support.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: this is high-volume, domain-specific editorial work.
  - Skills: `[]` — no extra skill is required.
  - Omitted: `['/frontend-ui-ux']` — layout work should already be handled by the guides IA task.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 7, 8 | Blocked By: 4

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `README.md` — product capabilities and terminology to reference accurately.
  - Pattern: `docs/adsense-approval-strategy.md` — content-volume requirement that motivates article count/length.
  - Pattern: `public/guide-draft.html` — feature-guide framing and user-facing vocabulary.
  - Pattern: `src/lib/demo-mode.ts` — concrete domain nouns (performances, songs, live sessions, locations) to keep copy grounded.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Ten unique guide entries exist and are reachable from `/guides`.
  - [ ] Each article body is original, domain-relevant, and roughly 1,000+ Korean characters.
  - [ ] Each article includes a distinct title, excerpt, and SEO description.
  - [ ] No article claims features absent from `README.md` and current public surfaces.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Batch A articles are visible from the guides hub
    Tool: Playwright
    Steps: Open `/guides`; verify the 10 required titles appear in the list; open 3 randomly chosen articles.
    Expected: All sampled articles render long-form Korean copy with unique headings and summaries.
    Evidence: .sisyphus/evidence/task-5-guides-batch-a.png

  Scenario: Batch A does not collapse into thin content
    Tool: Bash
    Steps: Inspect the source content file or rendered HTML for the 10 batch-A slugs; verify body length exceeds the target threshold and titles are unique.
    Expected: No batch-A article is a short stub or duplicate title.
    Evidence: .sisyphus/evidence/task-5-guides-batch-a-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 1 commit

- [ ] 6. Publish guide content batch B to clear the approval content threshold

  **What to do**: Write and publish the second 10 substantive guide articles in Korean, again targeting at least ~1,000 Korean characters each, to bring the public library to 20 articles total. Required topics for this batch: `버스킹 장소 선택 가이드`, `공연 일정 시간대 고르는 법`, `비 오는 날/추운 날 버스킹 운영 팁`, `초상권과 촬영 안내 기본 원칙`, `관객 입장에서 좋은 버스킹 찾는 법`, `라이브룸에서 후원하기 가이드`, `광고 후원 기능을 이해하는 법`, `버스커의 SNS 연결 전략`, `공연 예약/섭외 문의를 정리하는 법`, `다국어 안내가 필요한 이유와 운영 팁`.
  **Must NOT do**: Do not copy batch-A structure verbatim; do not over-optimize for keywords with unnatural repetition; do not pad with repetitive filler.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: high-volume editorial production with quality constraints.
  - Skills: `[]` — no extra skill is required.
  - Omitted: `['/playwright']` — browser checks are already covered in QA.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7, 8 | Blocked By: 4

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `README.md` — product surface area and user flows to keep content grounded.
  - Pattern: `docs/rewarded-ads-guide.md` — ad-reward terminology for the ad-support article.
  - Pattern: `src/app/explore/page.tsx` — public audience/explore vocabulary.
  - Pattern: `src/app/singer/[id]/page.tsx` — singer profile, follow, booking, and live-entry vocabulary.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Ten additional unique guide entries exist, bringing the total public guide count to 20.
  - [ ] Each batch-B article is roughly 1,000+ Korean characters with distinct titles and descriptions.
  - [ ] At least one internal related-article link connects batch-A and batch-B topics.
  - [ ] The guides hub and sitemap expose all 20 guide URLs.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: The guide library reaches 20 public articles
    Tool: Bash
    Steps: Query the guide content source or rendered guide index and count article entries; request the sitemap and count guide URLs.
    Expected: Both the content source and the sitemap show 20 public guide entries.
    Evidence: .sisyphus/evidence/task-6-guides-batch-b.txt

  Scenario: Batch B maintains quality and cross-linking
    Tool: Playwright
    Steps: Open 3 batch-B articles; check for visible related-article links and substantial multi-section content.
    Expected: Each sampled article has long-form copy and at least one related internal link.
    Evidence: .sisyphus/evidence/task-6-guides-batch-b-error.png
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 2 commit

- [ ] 7. De-emphasize demo-first discovery in favor of approval-relevant public content

  **What to do**: Update the landing-page hierarchy so the demo remains available but no longer acts as the strongest proof of site value; surface the new `/guides` and trust/legal destinations prominently on `/`; add lightweight cross-links from the existing static guide/demo artifacts to the new public content hub where appropriate; preserve current demo functionality for users who intentionally want to try it.
  **Must NOT do**: Do not remove the existing demo flow unless it is broken; do not keep the home page focused only on login/demo CTAs after public content has been added; do not add more demo seeding or auth complexity.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: adjusts public information architecture and CTA priority without rewriting product behavior.
  - Skills: `[]` — no extra skill is required.
  - Omitted: `['/frontend-ui-ux']` — this is hierarchy tuning, not a full visual redesign.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8 | Blocked By: 1, 2, 4, 5, 6

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `src/components/home/LandingPage.tsx` — current CTA order and demo flow.
  - Pattern: `src/app/page.tsx` — root landing route entry.
  - Pattern: `src/components/explore/DemoBanner.tsx` — current demo positioning/vocabulary.
  - Pattern: `public/guide-draft.html` — existing public artifact that can link out to the new guides hub instead of acting as a dead-end.
  - Pattern: `public/guide-i18n-board.html` — multilingual guide board that may need a clear hub/backlink.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `/` visibly promotes the public guides/trust content alongside, and ahead of, the demo flow.
  - [ ] The demo CTA still functions if clicked.
  - [ ] Existing static guide/demo artifacts link back to the main crawlable public content hub if they remain published.
  - [ ] A user can navigate from `/` to `/guides` and then to a guide article without hitting auth.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Landing page prioritizes public value before demo
    Tool: Playwright
    Steps: Open `/`; capture the hero and first fold; verify a visible path to Guides/About/Privacy exists before triggering demo login.
    Expected: Public content/trust links are obvious on first view; demo remains secondary but available.
    Evidence: .sisyphus/evidence/task-7-landing-priority.png

  Scenario: Demo path is preserved while no longer dominating discovery
    Tool: Playwright
    Steps: Click the demo CTA from `/`; confirm the existing demo flow still starts; then return to `/` and navigate to `/guides` without any login prompt.
    Expected: Demo still works, but the public-content path remains fully accessible and auth-free.
    Evidence: .sisyphus/evidence/task-7-landing-priority-error.png
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 2 commit

- [x] 8. Create the approval operations runbook and submission checklist

  **What to do**: Add a concrete ops/runbook document for final approval submission covering Search Console site verification, sitemap submission, robots verification, AdSense application prerequisites, domain/HTTPS checks, and the explicit post-activation crawler-login setup for authenticated surfaces; include the exact public URLs to verify, the support email destination `support@busking.minibig.pw`, and the rule that initial approval targets public pages first, not dashboards.
  **Must NOT do**: Do not present crawler login as an initial approval blocker; do not leave Search Console steps vague; do not omit the final contact-destination dependency from the checklist.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: this is operational documentation with external-policy grounding.
  - Skills: `[]` — no extra skill is required.
  - Omitted: `['/git-master']` — no git-specific workflow is needed for the document content itself.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: none | Blocked By: 1, 3, 5, 6, 7

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `docs/adsense-approval-strategy.md` — current PM-facing strategy baseline.
  - Pattern: `public/ads.txt` — existing publisher declaration already in place.
  - External: `https://support.google.com/adsense/answer/161351?hl=en` — crawler login and Search Console prerequisite.
  - External: `https://support.google.com/adsense/answer/2381908?hl=en` — crawler issues guidance.
  - External: `https://support.google.com/adsense/answer/10532?hl=en` — robots guidance.

  **Acceptance Criteria** (agent-executable only):
  - [ ] The runbook lists exact verification URLs for `/robots.txt`, `/sitemap.xml`, `/about`, `/privacy`, `/terms`, `/contact`, and `/guides`.
  - [ ] The runbook clearly separates initial approval steps from post-activation crawler-login steps.
  - [ ] The runbook includes Search Console ownership verification and sitemap submission steps.
  - [ ] The runbook records `support@busking.minibig.pw` as the default public support destination and flags it as the only value to update if ops chooses a different monitored alias.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Runbook supports an end-to-end submission rehearsal
    Tool: Bash
    Steps: Open the runbook file; verify it contains a checklist for Search Console verification, robots check, sitemap submission, legal-page review, and AdSense application readiness.
    Expected: All required ops steps are present in a sequenced checklist.
    Evidence: .sisyphus/evidence/task-8-runbook.txt

  Scenario: Runbook does not conflate approval with post-activation auth crawling
    Tool: Bash
    Steps: Search the runbook for both `initial approval` and `post-activation crawler login` sections.
    Expected: The document clearly separates those phases and does not require crawler login before initial application.
    Evidence: .sisyphus/evidence/task-8-runbook-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: included in Wave 2 commit

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle

  **QA Scenario**:
  ```
  Scenario: Implementation matches planned scope and ordering
    Tool: Bash
    Steps: Compare completed work against `.sisyphus/plans/adsense-approval-readiness.md`; verify all eight tasks have corresponding code/docs artifacts and evidence files.
    Expected: Oracle finds no missing planned deliverables, skipped guardrails, or out-of-order omissions that break the critical path.
    Evidence: .sisyphus/evidence/f1-plan-compliance.txt
  ```

- [ ] F2. Code Quality Review — unspecified-high

  **QA Scenario**:
  ```
  Scenario: Public-content and SEO code changes meet repository quality expectations
    Tool: Bash
    Steps: Review changed files for duplication, placeholder copy, broken imports, and brittle route logic; run `npm run build`.
    Expected: Review passes with no blocking code-quality or build issues.
    Evidence: .sisyphus/evidence/f2-code-quality.txt
  ```

- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)

  **QA Scenario**:
  ```
  Scenario: Public approval journey works end-to-end
    Tool: Playwright
    Steps: Open `/`; navigate to `/guides`, a guide detail page, `/about`, `/privacy`, `/terms`, and `/contact`; open `/robots.txt` and `/sitemap.xml` in separate tabs.
    Expected: All public routes load without login, legal/content links are discoverable, and crawlability endpoints return expected content.
    Evidence: .sisyphus/evidence/f3-manual-qa.png
  ```

- [ ] F4. Scope Fidelity Check — deep

  **QA Scenario**:
  ```
  Scenario: AdSense-readiness work does not sprawl into unrelated product changes
    Tool: Bash
    Steps: Inspect the diff and categorize every changed file as crawlability, legal/public content, landing/discovery, or approval ops.
    Expected: No unrelated dashboard, realtime, payment, or ad-reward behavior changes appear beyond preserving existing demo behavior.
    Evidence: .sisyphus/evidence/f4-scope-fidelity.txt
  ```

## Commit Strategy
- Commit after Wave 1 foundation is complete and verified: `feat(adsense): add public approval foundation`
- Commit after Wave 2 public content and ops work is complete and verified: `feat(content): add public approval guides and submission prep`
- If ops artifacts are kept outside code changes, include them with the Wave 2 commit rather than creating a docs-only empty follow-up.

## Success Criteria
- The site exposes clear public value without requiring login.
- AdSense crawlers are explicitly allowed and can discover public routes.
- A reviewer can navigate from `/` to legal pages and substantive content in 1-2 clicks.
- The existing demo remains optional support content, not the primary proof of value.
- Search Console and AdSense submission steps are executable without additional product decisions, using `support@busking.minibig.pw` as the default public contact destination.
