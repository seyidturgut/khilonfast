# Technical SEO Audit — khilonfast.com
Date: 2026-07-11
Scope: robots.txt, sitemap_index.xml (6 sub-sitemaps, ~73 URL pairs / ~146 pages TR+EN), 10+ sampled URLs (homepage TR/EN, service TR/EN, sectoral, product, training, flow, 404/soft-404 probes, www/http/case/trailing-slash variants).

## Technical Score: 68 / 100

Strong foundation (sitemaps, hreflang, security headers, prerendering, structured data, image dimensions) undercut by one severe crawlability defect (universal soft-404) and a genuine robots.txt logic conflict that could silently block the AI-crawler allow-listing the site already invested in.

---

## 1. Crawlability

### CRITICAL — Site-wide soft-404: every unmatched path returns HTTP 200 with homepage content, `index,follow`, and canonical to homepage
Verified with multiple probes, all returning **HTTP 200** (not 404):
- `https://khilonfast.com/nonexistent-page-test-123` → full TR homepage HTML, `<title>khilonfast | B2B Pazarlamada Hızlı ve Ölçülebilir Büyüme</title>`, `<meta name="robots" content="index, follow, ...">`, `<link rel="canonical" href="https://khilonfast.com">`
- `https://khilonfast.com/hizmetlerimiz/Go-To-Market-Stratejisi` (case-variant of a real slug) → same TR homepage clone, not the real service page, not a redirect. Route matching is case-sensitive, so any capitalization or typo variant of a real URL silently serves the homepage instead of 404ing or 301ing.
- `https://khilonfast.com/en/google-analytics-setup-flow` (a plausible-sounding but nonexistent EN flow URL — flow content is TR-only) → also returns the **TR** homepage (not even the EN homepage), HTTP 200, `<html lang="tr">`, canonical to apex.

Root cause: this is a client-side-routed SPA; the server (Cloudflare/host) is not returning a real 404 for unmatched paths, and the SPA fallback (or the prerendered artifact for `/`) is being served for literally any unrecognized path with a 200 status and the homepage's own indexable meta tags/canonical.

Impact:
- Any broken inbound link, old backlink, typo, case variant, or GSC-discovered URL gets crawled, returns 200, and looks to Google like a duplicate of the homepage — this is the textbook definition of a soft-404, one of the most common triggers for Google Search Console's "Duplicate, Google chose different canonical" and "Soft 404" coverage issues.
- Crawl budget waste: bots cannot distinguish real content from noise; at scale (thousands of possible typo'd/old URLs) this can dilute crawl frequency to the ~146 real pages.
- No 404 page exists, so there's no chance to redirect users/bots to useful content or trigger proper `X-Robots-Tag`/status-code signals.

Recommendation (Critical, fix first):
1. At the web-server/Cloudflare level, or in the SPA fallback handler, detect unmatched routes and return **HTTP 404** (or 410 for permanently removed) with a real "page not found" HTML template — `noindex` on that template, not `index,follow`.
2. Do NOT let the fallback reuse the homepage's prerendered HTML/canonical for arbitrary paths.
3. Make route matching case-insensitive-aware where reasonable, but any genuinely invalid path must 404, not silently render `/`.
4. Once fixed, resubmit affected URLs (if any got indexed) via GSC Removals/URL inspection, and monitor GSC Coverage → "Soft 404" report for the following weeks.

### Medium — HTTP and `www` are both served directly as 200 without redirecting to the canonical host/protocol
- `http://khilonfast.com` → `HTTP/1.1 200 OK` (no redirect to https). HSTS preload is set (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`), which mitigates repeat-visit risk for browsers that already have the HSTS pin or are on the preload list, but first-touch crawlers/tools/non-preloaded clients (and anything hitting `http://` directly, e.g. old backlinks, print media, some bots) get a plain-HTTP 200 response instead of a 301 to https.
- `https://www.khilonfast.com` → `HTTP/2 200` (no redirect to apex). The self-referencing canonical tag on the www response does correctly point to `https://khilonfast.com`, which prevents outright duplicate indexing, but Google/Bing still have to crawl and evaluate the www copy every time, and any external links built to `www.` never consolidate their link equity via a redirect — they rely entirely on canonical-tag interpretation.

Recommendation: Add explicit 301 redirects — `http://` → `https://` (apex) and `www.` → apex — at the Cloudflare edge (Page Rules / Redirect Rules / "Always Use HTTPS" + a www→apex redirect rule). This is a 10-minute Cloudflare config change and removes reliance on canonical-tag-only consolidation.

### Pass — Trailing slash handling
`https://khilonfast.com/hizmetlerimiz/go-to-market-stratejisi/` → clean single-hop `301` to the non-trailing-slash canonical URL. No redirect chains detected on any sampled URL (0-1 hops max).

### CRITICAL (confirmed, expanded) — robots.txt has genuinely contradictory directives for the same AI-crawler user-agents in one file
Full file fetched and reviewed. Structure is:
```
# BEGIN Cloudflare Managed content
User-agent: Amazonbot          → Disallow: /
User-agent: Applebot-Extended  → Disallow: /
User-agent: Bytespider         → Disallow: /
User-agent: CCBot              → Disallow: /
User-agent: ClaudeBot          → Disallow: /
User-agent: CloudflareBrowserRenderingCrawler → Disallow: /
User-agent: Google-Extended    → Disallow: /
User-agent: GPTBot             → Disallow: /
User-agent: meta-externalagent → Disallow: /
# END Cloudflare Managed Content

User-agent: *  (custom section, standard path exclusions)

User-agent: GPTBot             → Allow: /
User-agent: ClaudeBot          → Allow: /
User-agent: anthropic-ai       → Allow: /
User-agent: PerplexityBot      → Allow: /
User-agent: Perplexity-User    → Allow: /
User-agent: Google-Extended    → Allow: /
User-agent: Applebot-Extended  → Allow: /
User-agent: Amazonbot          → Allow: /
User-agent: Meta-ExternalAgent → Allow: /
User-agent: cohere-ai          → Allow: /
User-agent: OAI-SearchBot      → Allow: /
```
Six tokens (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `Amazonbot`, `Meta-ExternalAgent`/`meta-externalagent`) appear **twice with opposite directives** in the same file — a Cloudflare-injected block near the top says `Disallow: /`, a hand-written block further down says `Allow: /`.

How this actually resolves is parser-dependent, and that ambiguity is the real risk:
- **Google's documented algorithm** (per Google's robots.txt spec docs) merges all groups sharing an identical user-agent token into one logical group, then applies the *most specific matching path* rule, and on an exact-length tie (`/` vs `/`, both length 1) picks the **least restrictive** rule. Under this algorithm, `Allow: /` would win for Google-Extended — but this is Google-specific tie-break behavior, not something every crawler implements.
- **Many other parsers (and the original 1996 robots.txt convention, still followed by a number of simpler/naive crawler implementations)** use "first matching record for this user-agent wins" — i.e., once a `Disallow: /` group for `ClaudeBot` is found, later `Allow: /` groups for the same token are never even read. Under this interpretation, the Cloudflare-managed `Disallow: /` block **wins outright** and the site's entire AI-crawler allow-listing effort (which the AI-bot-tier-1 SEO work explicitly added) is silently negated for exactly the tokens it was meant to allow.
- Net effect: depending on which crawler's parser is in play, `GPTBot`/`ClaudeBot`/`Google-Extended`/`Applebot-Extended`/`Amazonbot`/`Meta-ExternalAgent` may be blocked, may be allowed, or may behave inconsistently release-to-release as vendors update their parsers. This is not a theoretical concern — it is an active, unresolved conflict sitting in production robots.txt right now.

Recommendation (Critical):
1. **Do not maintain two rule sets for the same tokens.** Consolidate to exactly one group per user-agent, in the final desired state (`Allow: /` for the AI bots the site wants indexed/trained-on/referenced, per the Content-Signal directives already declared at the top of the file).
2. The duplicate `Disallow: /` block is injected by Cloudflare's managed "AI Bots" / "AI Crawl Control" feature (visible as `# BEGIN Cloudflare Managed content` / `# END Cloudflare Managed Content`). This is very likely auto-generated by a Cloudflare dashboard toggle (Security → Bots → AI Crawl Control, or a legacy "Block AI Bots" managed rule) and re-injected on every serve — hand-editing the raw file to remove it may get silently overwritten.
3. Fix at the source: go to the Cloudflare dashboard's AI Crawl Control / Bot Management section and set the **per-bot allow/block state there** (Cloudflare now supports per-crawler granularity: GPTBot, ClaudeBot, Google-Extended, etc. can each be individually toggled). Turn off the blanket "block all AI bots" managed rule and explicitly allow the specific tokens the site wants (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Amazonbot, Meta-ExternalAgent, cohere-ai, OAI-SearchBot), leaving disallowed only the ones genuinely unwanted (e.g., Bytespider, CCBot if the site truly wants to block TikTok/Common Crawl re-use — currently disallowed with no later override, which is consistent and fine).
4. After the dashboard change, re-fetch `/robots.txt` and confirm each user-agent token appears **exactly once** in the file, with no orphaned Cloudflare block contradicting it.
5. Validate with Google Search Console's robots.txt tester and, where available, each AI vendor's own robots.txt validation tool (e.g. OpenAI's GPTBot documentation includes guidance on ambiguity resolution — do not rely on it, fix the file instead).

### Pass — robots.txt custom disallow paths
`/admin`, `/dashboard`, `/checkout`, `/payment-*`, `/login`, `/register`, `/api/`, `/legacy-pages/`, `/en/dashboard` etc. and their EN equivalents are all correctly excluded. `/home`, `/elementor-696` (legacy WP artifacts) also blocked — sensible cleanup of historic paths.

### Pass — Content-Signal declarations
`Content-Signal: search=yes,ai-train=no,use=reference` under the wildcard group is a reasonable, forward-looking declaration (2026 content-signal convention) distinct from the crawl-access Allow/Disallow directives — this is fine and unaffected by the conflict above (it's a usage-rights signal, not a fetch-permission signal).

---

## 2. Indexability

### Pass — Canonicals
All 8 sampled URLs (homepage TR/EN, service TR/EN, sectoral, product, training, flow) have correct **self-referencing** canonical tags matching the actual requested URL, in both the sitemap and the rendered HTML `<head>`. No cross-language or cross-slug canonical errors found in the sample.

### Pass — Meta robots
Every real page sampled emits `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`. No unintended `noindex` found on any of the sampled real content pages. No `X-Robots-Tag` HTTP header is sent (meta tag only) — not a defect, just worth knowing if a future need arises to noindex via header (e.g., for non-HTML resources where meta tags aren't possible).

### Pass — hreflang reciprocity
Checked in both sitemap XML and in-page `<link rel="alternate">` tags for homepage, service, sectoral, product, and training pairs:
- TR page → hreflang tr (self) + en (correct EN counterpart) + x-default (= TR URL)
- EN page → hreflang tr (correct TR counterpart) + en (self) + x-default (= TR URL)
Fully reciprocal in the sample checked, x-default consistently points at the TR version. (Full corpus of 73 URL pairs not individually verified — recommend running a dedicated hreflang audit per the `seo-hreflang` sub-skill across all sitemap entries to be exhaustive, especially since a manual site can drift over time as new pages are added without their EN/TR sibling.)

### Medium — Flow sitemap has no EN entries, but the site returns HTTP 200 (soft-404 homepage) rather than a clean signal for `/en/<flow-slug>` guesses
The `flow-sitemap.xml` only lists TR URLs (`hreflang="tr"` + `x-default"`, no `en` alternate) — this is likely intentional (flow/how-to guides may be TR-only content). However, because of the soft-404 bug (Section 1), any bot or user attempting an EN flow URL gets a 200 TR-homepage clone rather than a proper 404 or a clear "this content isn't available in English" signal. Once the soft-404 issue is fixed, this resolves itself as a side effect, but the site should also decide whether flow pages should get real EN translations or intentionally remain TR-only with hreflang correctly reflecting that.

---

## 3. Security

### Pass — HTTPS/TLS and header baseline
Confirmed via curl response headers on all 8 sampled URLs:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` ✓
- `X-Frame-Options: SAMEORIGIN` ✓
- `X-Content-Type-Options: nosniff` ✓
- `Referrer-Policy: strict-origin-when-cross-origin` ✓
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` ✓ (blocking FLoC/interest-cohort is a good, still-relevant privacy touch)
- Served via Cloudflare edge (`server: cloudflare`, NEL/Report-To present)

### High — CSP is Report-Only, not enforced
`Content-Security-Policy-Report-Only` is sent on every page (confirmed identical on homepage, service, product, training, flow). No enforcing `Content-Security-Policy` header exists. The policy itself is broad but reasonable (`script-src 'self' 'unsafe-inline' 'unsafe-eval' <GTM/GA/YouTube/Vimeo/Cloudflare Insights allowlist>`, `object-src 'none'`, `frame-ancestors 'self'`). Running Report-Only indefinitely means:
- Zero actual protection against XSS/injection/clickjacking-via-script vectors — the header is purely observational.
- If this has been Report-Only for a long period without a monitoring endpoint (`report-to`/`report-uri` directive is not declared in the CSP itself, only the unrelated Cloudflare NEL `report-to` group is present), there's likely no one even reviewing violation reports, meaning the org gets none of the benefit (visibility) or protection (enforcement) that CSP is supposed to provide.

Recommendation: Add a `report-uri`/`report-to` endpoint to actually collect violation data, monitor for 1-2 weeks for false positives given the GTM/GA/YouTube/Vimeo third-party script surface, then promote from `Content-Security-Policy-Report-Only` to enforced `Content-Security-Policy`. This is a High item because it's a "half-finished" security control — it costs the same to serve but currently provides none of the protection.

### Note — HTTP not force-redirected
See Section 1 (duplicated here since it's also a security posture issue, not just SEO): `http://khilonfast.com` returns 200 rather than a 301 to https. Combine the fix with the redirect work above.

---

## 4. URL Structure & Redirects

- URL structure is clean and semantic: `/hizmetlerimiz/<slug>`, `/en/services/<slug>`, `/sektorel-hizmetler/<slug>`, `/en/sectoral-services/<slug>`, `/urunler/<slug>`, `/en/products/<slug>`, `/egitimler/<slug>`, `/en/trainings/<slug>` — good, human-readable, keyword-relevant, no query-string parameters or ID-based paths observed in the sitemap sample.
- Trailing-slash normalization works correctly (single 301 hop, confirmed above).
- No redirect chains detected in any sampled URL (max 1 hop).
- Case-sensitivity and soft-404 issues are covered in Section 1 (Critical) — the URL structure itself is fine, the *handling of invalid variants of it* is the defect.

---

## 5. Mobile-Friendliness

- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` present and correctly configured (no `user-scalable=no`, no fixed max-width) on every sampled page.
- Images consistently carry explicit `width`/`height` attributes (e.g. `width="1200" height="800"` on hero images, `width="600" height="400"` on approach-images with `loading="lazy"`), which is good practice for both mobile layout stability and CLS (see Section 6).
- Fonts are self-hosted via `@font-face` (36 declarations found in the main CSS bundle) rather than a render-blocking third-party Google Fonts `<link>` — no additional DNS/connection round-trip for typography, which helps first-paint on mobile networks.
- Full tap-target/overlap analysis requires rendered-viewport inspection (Lighthouse mobile emulation or a real device pass) which is out of scope for static HTML/CSS review — recommend running Lighthouse mobile or PageSpeed Insights mobile as a follow-up to confirm no small tap targets in the mega-menu (per prior mobile-menu work noted in project history).

---

## 6. Core Web Vitals (lab estimate from source/timing inspection only — no real CrUX field data pulled)

- **TTFB**: measured 0.53s–0.85s across 8 requests to homepage and a product page from this environment (single geographic vantage point, Cloudflare edge). This is within a reasonable range but on the higher side of "good" (<0.8s target for TTFB is a common budget); Cloudflare edge caching shows `cf-cache-status: DYNAMIC` on every page, meaning the prerendered HTML is **not being served from Cloudflare's cache** — every request round-trips to origin. For static prerendered HTML this is a missed opportunity.
  - **Recommendation (Medium-High)**: configure a Cloudflare Cache Rule / Page Rule to cache the prerendered HTML at the edge (with a short TTL and cache-tag/purge-on-deploy invalidation), turning `DYNAMIC` into `HIT` for repeat crawls and visits. This directly improves TTFB → LCP for both bots and users, especially international visitors.
- **LCP risk**: hero images use `<img ... width="1200" height="800" class="hero-main-img ...">` without `loading="lazy"` (correct — LCP image should NOT be lazy-loaded, and it isn't here) and without a visible `fetchpriority="high"` attribute. Adding `fetchpriority="high"` to the LCP hero image would give browsers an earlier priority hint, likely tightening LCP without any other code change.
- **CLS risk**: explicit width/height on all sampled images is the single biggest CLS-prevention lever and it's already done correctly. No inline `<style>` layout-shifting patterns detected in the static HTML. Client-hydration (React taking over the prerendered DOM) is a common CLS risk if the hydrated component tree renders different dimensions than the prerendered snapshot — this can't be fully verified via source inspection alone; recommend a real Lighthouse/PageSpeed pass to get an actual field/lab CLS number, particularly checking whether any of the lazy-loaded route chunks (see Section 8) shift layout on hydration.
- **Unrelated render-blocking CSS**: the service page (`/hizmetlerimiz/go-to-market-stratejisi`) loads `pdf-QCQEGvBO.css` (9.2KB) as a render-blocking `<link rel="stylesheet">` in `<head>`, despite the page having no PDF viewer. This looks like a manualChunks/code-splitting side effect where a shared CSS chunk is being pulled in unnecessarily on pages that don't use it — small (9KB) but pure waste on the critical rendering path.
  - **Recommendation (Low-Medium)**: audit the Vite `manualChunks` / CSS chunking config so `pdf-*.css` only loads on pages that actually render the PDF component (or defer/inline it non-blocking).
- **INP**: cannot be measured from static source inspection (requires real interaction timing/RUM). No obvious main-thread-blocking anti-patterns (e.g., huge inline scripts) were found in the sampled HTML — the JS bundle is a single `type="module"` entry (`/assets/index-D8b2qwIx.js`) loaded with `crossorigin`, which is standard Vite output. Recommend pulling real INP numbers from CrUX/GSC Core Web Vitals report or field RUM rather than lab-estimating further here.

---

## 7. Structured Data

- **Organization / WebSite / AboutPage / BreadcrumbList / FAQPage** JSON-LD `@graph` confirmed present and correctly prerendered into the raw HTML (not just client-injected) on the About page — `sameAs` links point to real LinkedIn/Instagram profiles (consistent with prior SEO work noted in project history).
- Homepage, service pages, and training pages each carry one `<script type="application/ld+json" id="seo-json-ld">` block, confirmed present in raw curl output (initial grep miss was a regex artifact from an `id="seo-json-ld"` attribute between `type=` and `>` — corrected and re-verified).
- **Not independently re-validated with Google's Rich Results Test / Schema.org validator in this pass** — recommend running the sampled URLs through Google's Rich Results Test to confirm no property-level validation errors (e.g., required FAQPage `mainEntity` fields), since this audit only confirmed *presence* and *type* of schema blocks, not full spec conformance.

---

## 8. JavaScript Rendering / Prerendering Parity

### Pass — Prerendered HTML contains real content, not an empty SPA shell
Extracted and stripped visible text from the raw (non-JS-executed) HTML of the service page: **13,195 characters** of real Turkish marketing copy present directly in the initial HTML response (menu items, headings, body copy) — this is not an empty `<div id="root"></div>` shell. Confirms the puppeteer prerendering step (renderAfterTime: 2000ms, per project history) is successfully baking rendered content into the static HTML that bots relying on raw HTML fetches (not JS execution) would see.

### Not fully verified — lazy-loaded route chunk parity
Given the ~49-page route-lazy-loading optimization noted in project history (initial bundle 441KB→195KB gzip via route-level code splitting), there is a real risk that content which depends on a lazy-loaded child component (e.g., below-the-fold sections, tab panels, or modals loaded only after a user interaction/route match) might render correctly in the prerendered snapshot (since puppeteer executes the full JS and waits 2000ms) but could differ from what a simpler crawler using `--mode never` / raw-fetch-only would see if that crawler doesn't wait for hydration. Since raw curl fetches already showed full content (13K+ chars, matching what a human would see), this appears to be working as intended for the sampled pages — but the note is: **this is inherently a spot-check, not exhaustive**; any page template not included in the 8-page sample (all 165 prerendered artifacts) should be spot-checked periodically, especially after adding new lazy-loaded sections, since a regression here (e.g., a puppeteer timeout, a component that fetches data client-side post-mount without SSR-safe fallback) would be invisible in the rendered DOM screenshot but very visible to a `curl`/raw-HTML-only crawler.

Recommendation: add the `render_page.py --mode auto --json` / raw vs rendered diff check to a periodic (e.g., monthly or post-deploy) CI-style spot-check across a rotating sample of the 165 prerendered pages, specifically comparing `extracted_text` length between raw-fetch and Playwright-rendered modes — a large delta on any given page is the signal to investigate that page's lazy-loading behavior.

---

## 9. IndexNow Protocol

### Medium — Not implemented
- No IndexNow key file found at the site root (`/<key>.txt` pattern returns 404, as expected without a key on file).
- No references to IndexNow in the codebase (`backend/`, `api/`, frontend) — confirmed via search, no IndexNow client/ping logic exists in either the Node or PHP backend.
- Given the site's frequent content changes (CRM campaigns, new service/sectoral/product pages, the fast-moving deploy cadence evident in project history), IndexNow would let the site actively push Bing/Yandex/Naver near-real-time notifications on publish/update rather than waiting for their crawlers' own discovery cycle — currently Bing/Yandex only find changes via their own crawl schedule + the sitemap's `lastmod`.

Recommendation (Medium, low-effort/high-value): generate an IndexNow key, host the key file at `/<key>.txt`, and add a simple ping (`https://api.indexnow.org/indexnow?url=<changed-url>&key=<key>`) triggered on page publish/update in whichever backend (Node or PHP) handles content changes — per the "Dual Backend Rule" in project history, if this is implemented it needs to be added to **both** backends, or explicitly noted as an intentional asymmetry if only implemented in one. Google is not part of IndexNow, so this doesn't help GoogleBot, but Bing/Yandex/Naver directly benefit.

---

## Prioritized Issue Summary

| Priority | Issue | Section |
|---|---|---|
| Critical | Site-wide soft-404: any unmatched path (typos, case variants, old links, EN-guess URLs) returns HTTP 200 with homepage content + index,follow + canonical-to-homepage instead of a real 404 | 1 |
| Critical | robots.txt has duplicate/contradictory Allow vs Disallow rules for the same AI-bot tokens (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, Amazonbot, Meta-ExternalAgent) — resolution is parser-dependent and may silently block bots the site intends to allow | 1 |
| High | Content-Security-Policy sent only as Report-Only, never enforced, and has no report-uri/report-to endpoint configured to collect violation data | 3 |
| Medium | http:// and www. both serve HTTP 200 directly instead of 301-redirecting to the canonical https://khilonfast.com apex (canonical tag mitigates but doesn't replace a redirect) | 1, 3 |
| Medium | Prerendered pages served with `cf-cache-status: DYNAMIC` — not cached at Cloudflare edge, full origin round-trip on every request/crawl, inflating TTFB | 6 |
| Medium | IndexNow protocol not implemented for Bing/Yandex/Naver instant-indexing | 9 |
| Low | Unrelated `pdf-*.css` (9.2KB) loaded as render-blocking resource on pages without a PDF component | 6 |
| Low | LCP hero images lack `fetchpriority="high"` hint | 6 |
| Low | Flow sitemap is TR-only; combined with the soft-404 bug, EN-guess flow URLs return misleading 200s (resolves once soft-404 is fixed) | 2 |
| Info | JSON-LD/hreflang/canonicals/meta robots/viewport/security headers/image dimensions all confirmed correct on sampled pages — no action needed | 2, 3, 5, 6, 7 |

## Score Rationale (68/100)
Deductions: -15 site-wide soft-404 (crawl-budget and duplicate-content risk at scale), -10 robots.txt AI-bot contradiction (directly undermines prior SEO investment), -5 CSP Report-Only-only, -2 no HTTP/www redirect enforcement. Everything else (sitemaps, hreflang, canonicals, meta robots, structured data, prerendering fidelity, mobile viewport, image CLS hygiene, URL structure, security header baseline) is solid and holds the score up from what the two Critical items alone would suggest.
