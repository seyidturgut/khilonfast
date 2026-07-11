# khilonfast.com — Full SEO Audit Report

**Date:** 2026-07-11
**Business type:** B2B marketing agency — strategy/content/performance marketing services, ~18 sectoral solutions, productized subscription products, training/courses, and 1:1 consulting. Bilingual (TR/EN), React/Vite SPA with server-side prerendering (~146 pages), dual PHP+Node backend, served via Cloudflare.

## Overall SEO Health Score: 62 / 100

| Category | Score | Weight |
|---|---|---|
| Technical SEO | 68 | 22% |
| Content Quality | 61 | 23% |
| On-Page / Search Experience (SXO) | 61 | 20% |
| Schema / Structured Data | 72 | 10% |
| Performance (Core Web Vitals) | 47 | 10% |
| AI Search Readiness (GEO) | 48 | 10% |
| Visual/Images | 74 | 5% |
| *Sitemap Structure (sub-signal of Technical)* | *78* | — |

## Top 5 Critical Issues

1. **Cloudflare is blocking real AI-bot requests at the network edge.** Live requests spoofing ClaudeBot, PerplexityBot, Perplexity-User, anthropic-ai, and cohere-ai User-Agents returned HTTP 403 — before robots.txt is even read. This silently defeats the site's llms.txt / AI Answer Box / schema investment for several major AI platforms. GPTBot, OAI-SearchBot, and Google-Extended are unaffected.
2. **robots.txt contains a genuine self-contradiction** — a Cloudflare-managed `Disallow: /` block and a hand-written `Allow: /` block both target the same AI user-agent tokens in one file. Parser behavior differs by crawler (some use first-match-wins, others least-restrictive-wins).
3. **Site-wide soft-404.** Any unmatched path returns HTTP 200 with the TR homepage's HTML, `index,follow` meta robots, and a canonical pointing to the homepage — verified with random slugs, case-variants, and guessed EN URLs. Risks Search Console soft-404 flags at scale and wastes crawl budget.
4. **~85% of sectoral pages are templated boilerplate.** Nav/footer/service-training-product lists are identical across pages, and 5 of 6 FAQ Q&As are copied verbatim (only the first question is sector-customized). Unique content is ~250-400 words out of 1,100-1,580 total per page — a scaled/doorway-page risk.
5. **LCP fails Google's "Good" threshold on every page tested** (6.5s-22s vs the ≤2.5s target), worsening sharply with template depth; the sectoral-page template additionally has an outright CLS failure (0.854) and a 9MB/299-request payload (5x the homepage).

## Top 5 Quick Wins

1. Flip Cloudflare's AI Crawl Control / Bot Management managed rule to Allow for the blocked AI bots — a dashboard-only change, no code deploy needed.
2. Consolidate robots.txt into one directive block per user-agent.
3. Add the fully live, indexable consulting/consultants section to the sitemap (currently absent from all 6 sub-sitemaps).
4. Fix the product-page BreadcrumbList bug — a hardcoded Maestro AI URL appears as the parent breadcrumb on every product page regardless of the actual product.
5. Fix the cookie-consent-banner/hero-CTA overlap (the real first-clickable element on page load is currently the cookie banner, not the marketing CTA) and the 375px-viewport hamburger-menu clipping bug.

---

## Technical SEO — 68/100

**What works:** sitemap/hreflang reciprocity, self-referencing canonicals, clean URL structure, full baseline security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), viewport meta present, image width/height set, consistent 300-400ms TTFB.

**Findings:**
- **Critical** — Site-wide soft-404: any unmatched path returns the TR homepage with 200/index,follow/homepage-canonical. *Fix: return real 404s from the SPA fallback/edge.*
- **Critical** — robots.txt self-contradiction between Cloudflare-managed and hand-written blocks for the same AI user-agents. *Fix: adjust the Cloudflare AI Crawl Control dashboard toggle per-bot rather than hand-editing text around the auto-injected block.*
- **High** — CSP is Report-Only with no reporting endpoint — no real protection, no visibility. *Fix: add report-to, run a burn-in period, then enforce.*
- **Medium** — No canonical-host redirect (http/www serve 200 directly). *Fix: add a Cloudflare redirect rule.*
- **Medium** — Pages aren't edge-cached (`cf-cache-status: DYNAMIC`), inflating TTFB ~0.5-0.85s. *Fix: add a Cache Rule for prerendered HTML with purge-on-deploy.*
- **Medium** — No IndexNow support for Bing/Yandex/Naver.
- **Low** — Render-blocking, unrelated 9.2KB pdf-*.css loads on pages without a PDF viewer.
- **Low** — LCP hero images lack `fetchpriority="high"`.

Full detail: `findings/technical.md`

## Content Quality — 61/100

**What works:** prerendered SPA delivers full text (880-1,780 words/page, no JS needed); AI Answer Box present and well-formed sitewide; FAQPage/Question/Answer + BreadcrumbList JSON-LD correctly implemented.

**Findings:**
- **High** — Sectoral pages ~85% templated boilerplate; FAQ content copied verbatim across pages. *Fix: make FAQs genuinely vertical-specific; expand unique content per page.*
- **High** — Weak Experience/Authoritativeness signals: no verifiable case studies, testimonials swap names in lockstep with the template, "Bora Işık" invoked for training credibility with no bio/Person schema. *Fix: add real case studies with metrics; build an author bio page.*
- **Medium** — Contact email inconsistency (info@khilon.com vs info@khilonfast.com).
- **Medium** — Synthetic freshness signals: dateModified is a single sitewide build timestamp, not per-page edit history.
- **Low** — AI Answer Box isn't wrapped in Question/Answer schema and isn't a semantic heading.

Full detail: `findings/content.md`

## On-Page / Search Experience (SXO) — 61/100

**What works:** consulting drill-down pages are the strongest page type checked (clear pricing, 11-module curriculum, FAQ, testimonial).

**Findings:**
- **Critical** — Page-type/intent mismatch: the content-strategy service page is a pure sales page but its head term's SERP is 100% dominated by informational "nedir/nasıl oluşturulur" content. *Fix: add an upfront educational block or a separate informational pillar page.*
- **High** — No price shown anywhere on training/course pages (CTA links to an empty #pricing anchor), unlike competitor course pages and unlike khilonfast's own consulting pages. *Fix: add visible pricing to match the consulting-page pattern.*
- **Medium** — No named case studies or client logos on any sampled page type — the single highest-leverage trust fix.
- **Medium** — Homepage doesn't rank top-10 for its own head term "B2B pazarlama ajansı"; H1 is a slogan, not keyword-bearing.
- **Info** — Booking/checkout flow couldn't be exercised without a browser renderer in this environment; recommend manual QA.

Full detail: `findings/sxo.md`

## Schema / Structured Data — 72/100

**What works:** all schema server-rendered and valid JSON across 21+ pages sampled; correct context; real verified sameAs links; FAQPage correctly present sitewide (the previously-suspected lazy-mount empty-schema bug does not reproduce).

**Findings:**
- **Critical** — Deprecated HowTo schema still live (no SERP benefit since Sept 2023). *Fix: delete.*
- **Critical** — BreadcrumbList mis-parents Consulting under Trainings.
- **Critical** — Product-page breadcrumb hardcoded to Maestro AI's URL on every product page. *Fix: generate the parent URL dynamically per product.*
- **High** — Hardcoded ASCII breadcrumb labels lose Turkish diacritics ("Egitimler"/"Urunler").
- **High** — Product/Course schema missing offers/image/hasCourseInstance — not rich-result eligible.
- **Medium** — No SearchAction on WebSite schema; Organization missing ContactPoint/PostalAddress; service-page breadcrumbs point to in-page anchors instead of real URLs.

Full detail: `findings/schema.md`

## Sitemap Structure — 78/100

**What works:** all 6 sub-sitemaps + index well-formed, well under limits; 18 spot-checked URLs all returned clean 200s with unique titles; hreflang alternates fully reciprocal.

**Findings:**
- **High** — The entire consulting/consultants section is live, indexable content completely missing from every sitemap.
- **Medium** — Sitewide soft-404 (see Technical) undermines confidence in sitemap 200s generally.
- **Low** — All 73 URLs share the exact same millisecond-precision build timestamp as lastmod, not real per-page freshness.
- **Info** — flow-sitemap.xml's 5 URLs have no EN hreflang alternate — confirm intentional.

Full detail: `findings/sitemap.md`

## Performance (Core Web Vitals) — 47/100

Lab-only Lighthouse data (no CrUX/field data available in this environment — field validation recommended before final prioritization).

| Page | LCP | TBT | CLS | Weight |
|---|---|---|---|---|
| Home TR | 6.55s Poor | 594ms Poor | 0.000 Good | 1.7MB |
| Home EN | 14.46s Poor | 235ms N.I. | 0.000 Good | 1.6MB |
| Service page | 22.06s Poor | 203ms N.I. | 0.000 Good | 5.0MB |
| Sectoral page | 8.26s Poor | 187ms N.I. | 0.854 Poor | 9.0MB |

**Findings:**
- **Critical** — LCP fails on every page, worsening sharply with template depth; prior WebP/manualChunks optimizations clearly haven't propagated past the homepage.
- **Critical** — Sectoral-page template has an outright CLS failure (0.854) plus 9MB/299-request payload (5x homepage) — highest single-priority fix.
- **High** — TR homepage TBT (594ms, Poor) is far worse than EN homepage (235ms) — suggests a TR-specific script issue.
- **Medium** — ~650KB unused JavaScript ships on every page — shared vendor chunks (three.js/pdf/analytics) may be loading unconditionally.

Full detail: `findings/performance.md`

## AI Search Readiness (GEO) — 48/100

**What works:** llms.txt / llms-full.txt present, well-formed, current (170 pages, generated 2026-07-10); AI Answer Box content confirmed server-rendered; Content-Signal (ai-train=no, use=reference) doesn't block AI citation/RAG.

**Findings:**
- **Critical** — Cloudflare WAF blocks real requests from several major AI crawlers regardless of robots.txt content (see top issue #1 above) — the dominant, verified cause, more impactful than the robots.txt text contradiction itself.
- **Critical** — robots.txt duplicate/contradictory groups (compounding config smell alongside the WAF block).
- **Medium** — Organization sameAs missing YouTube/Reddit/Wikidata — YouTube correlates most strongly with AI brand-citation likelihood.
- **Low** — AI Answer Box content (~45 words) is shorter than the ideal ~134-167 word citation-passage length.

Full detail: `findings/geo.md`

## Visual / UX — 74/100

**What works:** homepage above-the-fold messaging is strong and clear with two visible CTAs; no JS console errors or obviously broken images; decent color contrast; mobile nav drawer itself is clean (consistent with prior compacting work).

**Findings:**
- **High** — Cookie-consent banner overlaps the primary hero CTA on first paint (desktop, mobile, and an interior service page) — the real first-clickable element is the cookie banner.
- **High** — At 375px viewport width, the mobile hamburger menu button is clipped ~25% off-screen.
- **Open item** — Nested submenu dropdowns (Hizmetler/Sektörel/Eğitimler/Ürünler) could not be fully verified before the audit session ended — flagged rather than confirmed fixed.
- **Low-confidence** — A service page shows an empty grey placeholder in a video section; could be a real bug or a sandbox network artifact — recommend manual re-check.
- No dark-mode toggle exists, so nothing to test there.

Full detail: `findings/visual.md`

---

## Methodology Notes

- Audit performed via direct HTTP/curl inspection of raw (prerendered) HTML, Lighthouse lab runs, live spoofed-User-Agent requests against production, and browser-driven visual checks — no CrUX, Google Search Console, or DataForSEO credentials were available in this environment, so Performance and ranking-position data are lab/observed estimates rather than field data. Recommend cross-referencing with Google Search Console and PageSpeed Insights field data before final resourcing decisions.
- Weighted score above uses the skill's standard category weights, with On-Page SEO represented by the SXO analysis (no separate keyword/meta-tag audit was run) and Images folded into the Visual score.
