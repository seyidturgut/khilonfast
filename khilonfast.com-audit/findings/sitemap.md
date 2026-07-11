# Sitemap Audit — khilonfast.com

Audited: sitemap_index.xml + 6 sub-sitemaps (page/service/sectoral/product/training/flow), 73 URLs total.
Date: 2026-07-11

## Summary Score: 78/100

Technically clean, well-formed sitemaps with correct reciprocal hreflang and no broken/redirected URLs — but the
consulting/consultants page cluster (a whole business line per project memory) is entirely absent from the
sitemap, and the site has no real 404 handling (soft-404s return 200), which undermines the reliability of "200
OK" as a signal across the wider site.

## Validation Results

| Check | Result | Severity |
|---|---|---|
| XML well-formedness (all 6 files + index) | PASS — `xmllint --noout` clean on all 6 sub-sitemaps and index | — |
| URL count per file vs 50k limit | PASS — max file is training-sitemap.xml at 20 URLs, index total 73 | — |
| Non-200 URLs (18 spot-checked: homepage, about, contact, 4 services, 2 sectoral, 2 products, 2 trainings, 2 flow, /en/trainings) | PASS — all 18 returned HTTP 200, no redirects (url_effective == requested URL) | — |
| Noindexed URLs in sitemap | Not directly checked (would require rendering meta tags per page); no indication of noindex on spot-checked pages | Info |
| hreflang reciprocity (TR↔EN↔x-default) | PASS on all 4 checked sitemaps (service/sectoral/training/product) — every TR entry lists the matching EN `loc` and vice versa, x-default consistently points to the TR canonical | — |
| flow-sitemap.xml hreflang | **Only `tr` + `x-default`, no `en` alternate** — these 5 "kurulum akışı" (setup flow) pages appear to be TR-only content with no EN equivalent. This is likely intentional (no EN version exists) but should be confirmed; not a defect if by design. | Info |
| lastmod accuracy | **FAIL (Low)** — all 73 URLs across all 6 sitemaps share the exact identical timestamp `2026-07-02T11:59:54.715Z` (down to the millisecond). This is a build/generation timestamp, not a true per-page last-modified date. Google explicitly discounts lastmod signals it can't verify against real change history; identical timestamps across unrelated pages (some clearly older, e.g. flow pages) is a classic tell of generated-not-tracked lastmod. | Low |
| priority / changefreq tags | Present on every URL (priority 0.64–1.0, changefreq weekly/monthly) | Info — both are ignored by Google since 2019+; harmless but dead weight, safe to remove |
| Sitemap completeness vs crawlable site | **FAIL (High)** — see "Missing Pages" below | High |
| Soft-404 handling | **FAIL (Medium)** — see below | Medium |

## Missing Pages (crawlable/live but NOT in any sitemap)

Confirmed via direct fetch — each returns HTTP 200 with a unique, real `<title>` (i.e., genuine indexable content,
not the SPA fallback):

| URL | Title | In sitemap? |
|---|---|---|
| `https://khilonfast.com/danismanlik` | "Danışmanlık Hizmetleri \| khilonfast" | No |
| `https://khilonfast.com/en/consulting` | "Consulting Services \| khilonfast" | No |
| `https://khilonfast.com/danismanlar` | "Danışmanlarımız — Uzman B2B Pazarlama Danışmanları" | No |
| `https://khilonfast.com/en/consultants` | "Our Consultants — Expert B2B Marketing Advisors" | No |

**Severity: High.** These are not thin or duplicate pages — they represent a distinct, actively developed business
line (per project history: consultant booking system, dedicated services, dedicated pricing in USD, dedicated
mail flows). Their complete absence from `page-sitemap.xml` (where `/hakkimizda`, `/iletisim`, `/egitimler` etc.
live) means Google has no sitemap-driven discovery/priority signal for this section at all — it relies entirely on
internal-link crawling. Recommend adding all 4 URLs (with reciprocal hreflang TR↔EN) to `page-sitemap.xml` or a
new `consulting-sitemap.xml` referenced from the index.

No blog or case-studies section was found to be missing — `/blog`, `/en/blog`, `/case-studies`, and
`/basari-hikayeleri` all resolve to the generic homepage-fallback title (see Soft-404 finding below), indicating
these sections do not actually exist as real content yet. Not a sitemap gap.

## Soft-404 Handling (Medium)

The site (React SPA) returns **HTTP 200 for any arbitrary/non-existent path**, e.g.
`https://khilonfast.com/this-page-definitely-does-not-exist-xyz123` returns 200 with the generic homepage
`<title>`. This means:
- Google Search Console will classify these as "soft 404s" once crawled, which is a quality signal problem site-wide.
- It also means "200 status" alone is not sufficient evidence a sitemap URL is genuinely valid content — each of
  the 73 sitemap URLs was checked to have a *unique, page-specific* `<title>` (not the generic fallback) as an
  additional confidence check; all 18 spot-checked passed this check.
- Recommend: client-side router should render a true 404 component AND the server/edge (Cloudflare Worker or
  prerender step) should return an actual `404` status for unmatched routes, or at minimum inject
  `<meta name="robots" content="noindex">` on the fallback view.

## Sitemap Index / Structure

- `sitemap_index.xml`: well-formed, all 6 `<sitemap>` entries resolve, each sub-sitemap under the 50k limit by a
  huge margin — no splitting needed for years at current growth rate.
- `xmlns:xhtml` declared correctly in all sub-sitemaps for hreflang support.
- `<?xml-stylesheet href="/sitemap.xsl">` present for human-readable rendering — good UX for manual audits, no SEO impact either way.

## Per-Sitemap Breakdown

| Sitemap | URLs | TR/EN pairs | Notes |
|---|---|---|---|
| page-sitemap.xml | 10 | 5 pairs (home, about, contact, "how it works", trainings hub) | Clean |
| service-sitemap.xml | 16 | 8 pairs | Clean, all reciprocal |
| sectoral-sitemap.xml | 18 | 9 pairs | Clean, all reciprocal |
| product-sitemap.xml | 4 | 2 pairs (Maestro AI, Eye Tracking) | Clean |
| training-sitemap.xml | 20 | 10 pairs (sector-specific trainings) | Clean |
| flow-sitemap.xml | 5 | TR-only, no EN alternate | Likely by design (setup-guide content); confirm with content team |

## Recommendations (priority order)

1. **High** — Add the 4 consulting/consultants URLs (TR+EN, reciprocal hreflang) to the sitemap.
2. **Medium** — Implement true HTTP 404 (or noindex) for unmatched SPA routes; verify GSC "Page indexing" report for soft-404 accumulation.
3. **Low** — Generate real per-page `lastmod` values (from CMS/git content update time) instead of a single global build timestamp, or omit `lastmod` entirely if not tracked accurately — a wrong/fake lastmod is worse than none.
4. **Info** — Remove `priority` and `changefreq` tags; both are ignored by Google and add no value (cosmetic cleanup only).
5. **Info** — Confirm whether flow-sitemap.xml pages are intentionally TR-only; if EN versions exist elsewhere on the site, add hreflang alternates.

## Score Rationale

- Technical XML/structure/status-code hygiene: excellent (would be ~95/100 alone).
- Deducted for: missing consulting section (High, -12), lastmod not trustworthy (Low, -3), site-wide soft-404 risk affecting sitemap trust (Medium, -5), priority/changefreq cruft (Info, -2).
- Net: **78/100**.
