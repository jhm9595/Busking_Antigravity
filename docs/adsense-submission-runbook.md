# AdSense Submission Runbook

This document provides a sequenced checklist for submitting the miniMic (busking.minibig.pw) platform for Google AdSense approval. It separates the initial public-facing approval requirements from post-activation crawler configurations.

## Core Information
- **Production Domain:** `https://busking.minibig.pw`
- **Public Support Email:** `support@busking.minibig.pw`
- **Contact Maintenance Rule:** If operations later changes the public support alias, update `support@busking.minibig.pw` in the contact page and this runbook together.
- **Primary Strategy:** Lead with high-quality public content (Guides) and mandatory legal pages to satisfy the "Site Value" requirement before attempting to monetize authenticated dashboard areas.

---

## Phase 1: Pre-Submission Content Readiness
Before applying, ensure the site has sufficient "original, high-quality content" that is accessible without login.

- [ ] **Legal Pages:** Verify that `/about`, `/privacy`, `/terms`, and `/contact` are live and contain product-specific copy (not placeholders).
- [ ] **Privacy Disclosure:** Confirm the `/privacy` page explicitly mentions Google advertising cookies and provides opt-out information.
- [ ] **Content Volume:** Ensure the `/guides` hub contains at least 20 substantive articles (1,000+ characters each) related to busking, performance tips, and platform usage.
- [ ] **Public Navigation:** Verify that the footer or header on the landing page (`/`) provides clear, crawlable links to all legal and guide pages.
- [ ] **No Placeholders:** Scan all public pages for "Lorem Ipsum," "TBD," or "example.com" strings.

## Phase 2: Technical Crawlability Checks
AdSense crawlers must be able to access and index the public content.

- [ ] **Robots.txt Verification:** Access `https://busking.minibig.pw/robots.txt` and confirm it explicitly allows `Mediapartners-Google` and `Google-Display-Ads-Bot`.
- [ ] **Sitemap Verification:** Access `https://busking.minibig.pw/sitemap.xml` and confirm it includes `/about`, `/privacy`, `/terms`, `/contact`, `/guides`, and the public guide detail URLs.
- [ ] **Ads.txt Check:** Confirm `https://busking.minibig.pw/ads.txt` is present and contains the correct publisher ID (`pub-3509429679243965`).
- [ ] **Domain + HTTPS Check:** Confirm the canonical production host resolves at `https://busking.minibig.pw`, redirects are stable, and there are no mixed-content or certificate warnings on public pages.

## Phase 3: Search Console Verification
Google Search Console (GSC) is the foundation for proving site ownership and monitoring crawl health.

- [ ] **Ownership Verification:** Add `https://busking.minibig.pw` as a property in GSC. Use DNS record verification (recommended) or the HTML tag method.
- [ ] **Sitemap Submission:** Submit the `sitemap.xml` URL in GSC. Monitor for "Success" status and ensure the number of discovered URLs matches the expected public page count.
- [ ] **Crawl Stats Review:** Check the "Crawl Stats" report in GSC to ensure Googlebot is not hitting 403 or 5xx errors on public routes.

## Phase 4: AdSense Application Submission
Once GSC is verified and content is live, proceed with the application.

- [ ] **Site Addition:** Add `busking.minibig.pw` to the "Sites" list in the AdSense Dashboard.
- [ ] **Ad Code Integration:** Ensure the AdSense `<script>` tag is present in the root `layout.tsx` (already implemented in the codebase).
- [ ] **Review Request:** Click "Request Review" in the AdSense dashboard.

## Phase 5: Post-Submission Monitoring
- [ ] **Email Alerts:** Monitor `support@busking.minibig.pw` and the primary AdSense account email for "Site Review" updates.
- [ ] **Policy Center:** Check the AdSense "Policy Center" for any "Valuable Inventory: No Content" or "Site Down" flags during the 2-4 week review period.

---

## Post-Activation: Crawler Login for Authenticated Pages
**DO NOT attempt this before initial account activation.** This step is only for showing ads inside the singer/venue dashboards after the site is already approved.

1. **Wait for Approval:** Ensure the site status is "Ready" in AdSense.
2. **Create Test Account:** Create a dedicated demo/test user in the production environment.
3. **Configure Crawler Access:**
   - Go to AdSense > Account > Access and authorization > Crawler access.
   - Add a new login for `https://busking.minibig.pw/sign-in`.
   - Provide the test account credentials.
4. **Verify Access:** Monitor the "Crawler Issues" report to ensure the bot can now reach `/singer/dashboard` and other protected routes.

---

## Verification URL Checklist
Use these links to perform a final manual check before clicking "Request Review":

- [ ] [Robots.txt](https://busking.minibig.pw/robots.txt)
- [ ] [Sitemap.xml](https://busking.minibig.pw/sitemap.xml)
- [ ] [About Us](https://busking.minibig.pw/about)
- [ ] [Privacy Policy](https://busking.minibig.pw/privacy)
- [ ] [Terms of Service](https://busking.minibig.pw/terms)
- [ ] [Contact Support](https://busking.minibig.pw/contact)
- [ ] [Guides Hub](https://busking.minibig.pw/guides)
- [ ] [Ads.txt](https://busking.minibig.pw/ads.txt)
