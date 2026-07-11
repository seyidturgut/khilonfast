# khilonfast.com — Prioritized Action Plan

## Phase 1: Critical Fixes (Week 1)

- [ ] Flip Cloudflare AI Crawl Control / Bot Management to **Allow** for ClaudeBot, PerplexityBot, Perplexity-User, anthropic-ai, cohere-ai (dashboard-only, no deploy)
- [ ] Consolidate robots.txt into one directive group per user-agent — remove the Cloudflare-managed vs hand-written contradiction
- [ ] Fix site-wide soft-404 — return real HTTP 404 for unmatched SPA routes instead of homepage HTML
- [ ] Fix product-page BreadcrumbList bug — hardcoded Maestro AI URL appears as parent on every product page
- [ ] Fix BreadcrumbList mis-parenting Consulting under Trainings
- [ ] Remove deprecated HowTo schema (no SERP benefit since Sept 2023)
- [ ] Fix cookie-consent-banner/hero-CTA overlap (desktop + mobile)
- [ ] Fix 375px-viewport hamburger-menu button clipping

## Phase 2: High-Impact Improvements (Weeks 2-3)

- [ ] Diagnose and fix sectoral-page-template CLS failure (0.854) and 9MB/299-request payload
- [ ] Reduce LCP across service/sectoral templates (currently 8-22s vs ≤2.5s target)
- [ ] Add visible pricing to all training/course pages (currently CTA → empty #pricing anchor)
- [ ] Add /danismanlik, /en/consulting, /danismanlar, /en/consultants to the sitemap
- [ ] De-templatize sectoral-page FAQs — make genuinely vertical-specific (currently 5/6 copied verbatim)
- [ ] Fix hardcoded ASCII breadcrumb labels (Egitimler/Urunler → Eğitimler/Ürünler)
- [ ] Add offers/image to Product schema; hasCourseInstance/offers to Course schema
- [ ] Investigate TR-homepage TBT regression vs EN homepage (594ms vs 235ms)
- [ ] Add an upfront educational/definitional block to the content-strategy service page (currently losing to informational SERP intent)

## Phase 3: Content & Authority (Month 2)

- [ ] Add real named case studies with verifiable client metrics (service/sectoral/training pages)
- [ ] Build a credible author/expert bio page + Person schema for Bora Işık
- [ ] Add real client logos to build trust signals (currently absent sitewide)
- [ ] Unify info@khilon.com vs info@khilonfast.com contact email
- [ ] Promote CSP from Report-Only to enforced after a reporting burn-in period
- [ ] Add YouTube presence and reflect it in Organization sameAs
- [ ] Add SearchAction to WebSite schema; ContactPoint/PostalAddress to Organization schema
- [ ] Point service-page breadcrumbs at real canonical URLs instead of in-page anchors

## Phase 4: Monitoring & Iteration (Ongoing)

- [ ] Canonical-host redirect (http/www → https apex)
- [ ] Edge-cache prerendered HTML with purge-on-deploy
- [ ] Implement IndexNow for Bing/Yandex/Naver
- [ ] Derive dateModified/lastmod from real per-page edit history
- [ ] Re-run Lighthouse and AI-bot-UA spot checks monthly
- [ ] Re-verify the Cloudflare AI Crawl Control setting periodically — Cloudflare updates its managed rulesets over time and can silently reset per-bot allowances
- [ ] Validate Performance findings against real Google Search Console / CrUX field data once available
