# Performance / Core Web Vitals Audit — khilonfast.com

Date: 2026-07-11
Method: Lighthouse 13.4.0 (lab, mobile default config, simulated throttling, headless Chrome, single run per URL). No CrUX/PageSpeed API field data was available in this environment (no API credentials configured, no `pagespeed_check.py`/`render_page.py` scripts present in this checkout), so this audit is **lab-only**. Field data (CrUX 28-day) should be pulled separately before finalizing priority — lab runs under simulated throttling tend to overstate absolute LCP seconds, but the *relative* pattern (deeper pages far worse than homepage) and the CLS/JS findings below are real and actionable regardless.

## Core Web Vitals thresholds (reference)

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | ≤2.5s | 2.5–4.0s | >4.0s |
| INP | ≤200ms | 200–500ms | >500ms |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 |

(Lighthouse reports Total Blocking Time (TBT) as a lab proxy for INP — no lab tool measures INP directly since it requires real user interaction.)

## Results summary

| Page | Perf Score | LCP | TBT (INP proxy) | CLS | Page Weight | Requests |
|---|---|---|---|---|---|---|
| Homepage TR (`/`) | 47/100 | 6.55s — **Poor** | 594ms — **Poor** | 0.000 — Good | 1,732 KB | 53 |
| Homepage EN (`/en`) | 55/100 | 14.46s — **Poor** | 235ms — Needs Improvement | 0.000 — Good | 1,636 KB | 49 |
| Service page (`/hizmetlerimiz/go-to-market-stratejisi`) | 52/100 | 22.06s — **Poor** | 203ms — Needs Improvement | 0.000 — Good | 4,976 KB | 98 |
| Sectoral page (`/sektorel-hizmetler/b2b-firmalari-icin-360-pazarlama-yonetimi`) | 34/100 | 8.26s — **Poor** | 187ms — Needs Improvement | **0.854 — Poor** | 8,958 KB | 299 |

Supporting metrics:

| Page | TTFB | FCP | Speed Index | TTI | Main-thread work | Unused JS |
|---|---|---|---|---|---|---|
| Homepage TR | 406ms | 4.07s | 7.65s | 13.34s | 6.0s | 641 KB |
| Homepage EN | 302ms | 6.65s | 6.65s | 14.50s | 3.2s | 642 KB |
| Service page | 364ms | 12.90s | 12.90s | 22.27s | 2.3s | 572 KB |
| Sectoral page | 355ms | 5.93s | 5.93s | 35.41s | 7.1s | 691 KB |

TTFB is consistently **Good** (~300–400ms) across every page — Cloudflare edge + prerendered HTML is doing its job on server response time. The problem is entirely downstream of TTFB: render path, payload size, and CLS on the deepest page.

## Key bottlenecks identified

1. **LCP is Poor on every page tested, and gets dramatically worse the deeper you go.** Homepage LCP (6.5s) is already 2.6x the "good" threshold; the service page (22s) and sectoral page (8.3s under CPU/network throttling) are far worse. This does not match the "441KB→195KB gzip JS, 12.5MB→1.5MB image" optimization already done for the homepage — those wins have clearly not propagated to service/sectoral page templates.

2. **Page weight explodes on deeper templates.** Homepage is a reasonable 1.6–1.7MB. The service page is 5MB (98 requests) and the sectoral page is **9MB across 299 requests** — this is 5x the homepage weight and almost certainly the direct cause of both the LCP blowout and the CLS failure on that template.

3. **CLS is Poor (0.854) specifically on the sectoral page**, while every other page tested has a perfect 0.000. This points to a template-specific issue (likely late-injected content, un-dimensioned images/embeds, or web-font swap) unique to the sectoral-services layout — not a site-wide CLS problem. This is the single highest-priority fix since it's an outright CWV failure, not just "slow."

4. **TBT (594ms) is Poor on the homepage** despite it being the lightest page — main-thread work is 6.0s on TR home vs. only 2.3–3.2s on the lighter-scoring EN/service pages, suggesting a TR-specific script (likely a third-party tag, GTM container, or a hydration-heavy component) is monopolizing the main thread on first load.

5. **641–691 KB of unused JavaScript is shipped on every single page**, consistent regardless of template. This is on top of manualChunks/lazy-route work already done — it suggests either (a) chunks are being requested even when not needed for above-the-fold content, or (b) large shared vendor chunks (three.js, pdf lib, GTM/analytics bundle) are loaded on pages that don't use those features.

6. **Request count scales badly with template depth** (49 → 98 → 299). 299 requests on the sectoral page is very high for a single content page and is a strong signal of either an unbounded image gallery, uncapped third-party widget, or duplicate/uncached asset loading specific to that template.

## Prioritized recommendations

**P0 — fix the sectoral-page CLS regression (0.854, outright CWV failure)**
- Inspect the sectoral-services template DOM for elements lacking explicit `width`/`height` (or `aspect-ratio`) — especially hero/banner images, embedded videos, and any dynamically-injected sector-specific content blocks.
- Reserve space for web fonts (font-display: swap + size-adjust, or preload) if FOIT/FOUT is contributing.
- Audit for late-inserted ads/CTA banners or lazy-loaded widgets pushing content down after initial paint.
- Expected impact: moves CLS from Poor → Good; single largest CWV compliance win available.

**P0 — cut sectoral-page payload from 9MB / 299 requests**
- This page is 5x the homepage weight. Enumerate images/media on this template specifically — likely an uncompressed gallery or repeated sector-icon set not covered by the prior WebP conversion pass (which covered ~18 images sitewide, evidently not all templates).
- Apply the same WebP/AVIF + lazy-loading treatment already proven to work on the homepage (12.5MB→1.5MB) to this template's assets.
- Investigate whether the 299 requests include duplicate/uncached third-party or font requests that can be consolidated.

**P1 — reduce service-page and homepage LCP**
- Identify and preload the actual LCP element (hero image or heading) per page via `largest-contentful-paint-element` audit; ensure it's not blocked behind render-blocking CSS/JS or web font loading.
- Extend the manualChunks/lazy-route strategy that already improved the homepage to service/sectoral templates — confirm route-based code-splitting is actually being applied to the `/hizmetlerimiz/*` and `/sektorel-hizmetler/*` route trees, not just top-level routes.
- Consider serving a lighter/critical-path hero component for these deeper templates rather than the full page-builder bundle.

**P1 — reduce TR-homepage TBT (594ms) and main-thread work (6.0s)**
- Profile what differs between TR (6.0s main-thread) and EN (3.2s) homepage loads for the same template — check for a TR-only third-party script, duplicate GTM firing, or non-deferred inline script.
- Break up long tasks (>50ms) via `requestIdleCallback`/chunking, particularly around hydration of interactive homepage widgets.

**P2 — eliminate the consistent ~650KB unused JS on every page**
- Audit whether three.js/pdf vendor chunks (called out as separated via manualChunks) are still being eagerly imported on pages that don't render 3D content or PDFs.
- Re-verify lazy-route boundaries are tree-shaking correctly; 570–690KB unused JS per page suggests some shared chunk is loaded universally regardless of need.

## Caveats

- These are **single-run lab measurements** under Lighthouse's simulated throttling profile, not 28-day CrUX field percentiles. Google's actual pass/fail evaluation uses the 75th percentile of real Chrome user visits (CrUX), which is typically less punishing than simulated-throttle lab LCP numbers, especially given TTFB here is already Good. Recommend re-validating post-fix against CrUX/PageSpeed Insights field data once API access is available, and treating this report's *relative* findings (CLS regression on sectoral page, payload blowout on deeper templates, unused-JS on every page) as the actionable signal rather than the absolute LCP-in-seconds figures.
- Only one URL per template type was sampled; the sectoral-page CLS and 9MB payload issue should be spot-checked against 1-2 other sectoral pages to confirm it's systemic to the template rather than content-specific to this one page.
