# Schema.org / Structured Data Audit — khilonfast.com

Date: 2026-07-11
Method: Raw `curl` fetch of prerendered HTML (no JS execution) for 27 URLs (TR+EN) covering
home, about, contact, service, sectoral, product, training, consulting/consultants, and a
flow (HowTo-style) page. All JSON-LD parsed with Python `json.loads` (not regex/grep) to catch
pretty-printed multi-line blocks and syntax errors.

**Good news first:** schema is fully server-side rendered — it is present in the raw HTML
before any JS runs, on every page checked. The earlier "FAQPage read from DOM before mount"
bug does not reproduce here; FAQPage is present and non-empty on all 21 pages sampled.

---

## Critical

1. **Deprecated `HowTo` schema still in production.**
   `https://khilonfast.com/khilonfast-nasil-calisir-hizli-profesyonel-ve-sonuc-odakli-pazarlama-deneyimi`
   (and its EN counterpart) emits a `HowTo` node inside the `@graph`. Google removed HowTo rich
   results in September 2023. This block provides no SERP benefit and should be removed (the
   step content can stay in an Article/WebPage node instead).

2. **BreadcrumbList miscategorizes Consulting under Trainings.**
   Both `danismanlik.html` and `en_consulting.html` render a breadcrumb trail placing the
   Consulting/Programs pages one level below "Eğitimler"/"Programs" (`/egitimler`,
   `/en/trainings`):
   ```
   danismanlik.html: khilonfast → Egitimler (/egitimler) → Danışmanlık Hizmetleri (/danismanlik)
   en_consulting.html: khilonfast → Programs (/en/trainings) → Consulting Services (/en/consulting)
   ```
   Consulting is a distinct top-level offering (own nav item, own booking flow per project
   memory), not a child of Trainings. This sends Google an incorrect site-hierarchy signal and
   risks BreadcrumbList rich-result rejection if the crawled breadcrumb doesn't match the
   visible on-page breadcrumb/nav. Needs its own parent node (or should be flattened to
   position 2 = the page itself, as `danismanlar.html` correctly does).

3. **Product pages: BreadcrumbList has a duplicate-URL validation error.**
   On every `/urunler/*` product page, position 2 ("Urunler") and position 3 (the actual
   product) point to the **same URL** — the position-2 item is hardcoded to
   `/urunler/maestro-ai` regardless of which product is being viewed:
   ```
   urunler/maestro-ai:              pos2 item = /urunler/maestro-ai, pos3 item = /urunler/maestro-ai (same page, OK by accident)
   urunler/eye-tracking-reklam-analizi: pos2 item = /urunler/maestro-ai, pos3 item = /urunler/eye-tracking-reklam-analizi (WRONG — pos2 points to a different, unrelated product)
   ```
   This is a genuine bug (not just suboptimal): the Eye Tracking product's breadcrumb falsely
   claims Maestro AI's URL as its parent category. Google's structured-data testing tool will
   likely flag this as inconsistent, and it pollutes crawl/entity signals. There is no
   `/urunler` category listing page to link to, which is the root cause — either create one or
   drop the intermediate breadcrumb level entirely.

---

## High

4. **Turkish diacritics dropped in two hardcoded breadcrumb labels.**
   `"Egitimler"` (should be **Eğitimler**) and `"Urunler"` (should be **Ürünler**) appear
   verbatim, ASCII-only, in the BreadcrumbList `name` fields on every training and product
   subpage. This is not a general encoding failure — other category labels on the same pages
   render correct Turkish characters (e.g. "Hizmetlerimiz", "Sektörel Hizmetler" show ö/ü
   correctly), so this looks like two specific hardcoded English-transliterated strings in the
   breadcrumb-generation code. Low SEO risk on its own, but inconsistent brand-quality signal
   and worth a one-line fix.

5. **Product schema missing `offers` (price/availability) and `image`.**
   Both Maestro AI and Eye Tracking products are marked up as `Product` with only
   `name`/`description`/`url`/`brand`. Per Google's Product rich-result requirements, `offers`
   (with `price`, `priceCurrency`, `availability`) or `aggregateRating`/`review` is effectively
   required for the Product rich result to be eligible at all — without it this markup is
   inert for SERP purposes (though still useful for AI/entity understanding). Confirm current
   pricing model: if these are subscription/contact-for-price products, use
   `offers.priceSpecification` with `UnitPriceSpecification` or omit Product in favor of
   `Service`/`SoftwareApplication` if there's truly no fixed price to disclose.

6. **Course schema missing recommended/required-for-rich-result properties.**
   Course nodes only have `name`/`description`/`provider`/`url`. Google's Course rich result
   requires at least one `hasCourseInstance` (with `courseMode`, `startDate`/`endDate` or
   `courseWorkload`) OR `offers` to be eligible, and recommends `provider.sameAs`. Currently
   none of the training pages qualify for the Course rich snippet (price/rating badge) in
   search — this is a missed opportunity given "training/course page" is one of the site's
   core products.

---

## Medium

7. **No `SearchAction` on WebSite schema.** The `WebSite` node has no `potentialAction`
   (Sitelinks Searchbox). Low priority since this is a B2B agency site without visible on-site
   search, but worth confirming there's truly no search feature before ruling it out
   permanently.

8. **Organization schema has no `ContactPoint`/`address`/`telephone`**, despite the visible
   Contact page (`iletisim.html`) displaying a real phone number (+90 533 494 58 69) and
   "İstanbul, Türkiye" address text. Adding `ContactPoint` (telephone, contactType,
   areaServed, availableLanguage) and a `PostalAddress` would strengthen Organization
   entity/Knowledge Panel signals without requiring a full `LocalBusiness` type (which is
   probably not appropriate here — this is a service area business, not a walk-in location).

9. **`sameAs` array only has 2 profiles** (LinkedIn `linkedin.com/company/khilon/`, Instagram
   `instagram.com/khilonagency`) — both verified live (HTTP 200). Good: these are real
   profiles, not placeholders. Consider adding any other active official profiles (X/Twitter,
   YouTube, Crunchbase) if they exist, to strengthen entity disambiguation.

10. **Service pages: `BreadcrumbList` position-2 item points to an in-page anchor
    (`https://khilonfast.com/#services`, `#sectoral-services`), not a crawlable URL.** Google
    tolerates this but it's discouraged practice for BreadcrumbList — anchors aren't
    independently indexable pages. Low-to-medium priority; works today but fragile.

---

## Low / Informational

11. **FAQPage present sitewide and content-accurate.** Spot-checked Home, About, Contact,
    Maestro AI product, and two training pages — all Q/A pairs are non-empty, well-formed
    (`Question`/`acceptedAnswer.Answer`), and match the page's visible topic. Per current
    guidance, FAQPage produces no Google SERP feature (retired for all sites) but remains
    valuable for AI/LLM citation — correctly kept, no action needed. This is Info-severity per
    project policy, not a defect.

12. **`dateModified` present and ISO 8601-correct** on WebPage nodes (e.g.
    `"2026-07-10T20:50:25.442Z"` on home). Good practice, no issue.

13. **`@context` is `https://schema.org`** (not http) throughout — correct.

14. **No Microdata or RDFa found anywhere** — JSON-LD is the sole/consistent format site-wide,
    which is the preferred approach. No competing/duplicate schema blocks.

15. **VideoObject present on service/sectoral pages** (up to 5 per sectoral page) — not
    deep-audited for required fields (`thumbnailUrl`, `uploadDate`, `duration`,
    `contentUrl`/`embedUrl`) in this pass; recommend a follow-up spot-check since VideoObject
    has strict required-field enforcement for rich results.

---

## Missing Opportunities Summary

- Product: add `offers`/`image`/`aggregateRating` (or reconsider @type) to become rich-result eligible.
- Course: add `hasCourseInstance` or `offers` to become rich-result eligible.
- Organization: add `ContactPoint` + `PostalAddress` using real data already on the Contact page.
- Consider a `/urunler` (and `/en/products`) category/listing page so BreadcrumbList position-2 has a real, distinct URL to point to instead of duplicating the product's own URL.

## Validation Errors Found (syntax-level)

All 21 sampled `@graph` JSON-LD blocks parsed successfully as valid JSON — no syntax errors.
The errors found are semantic/logical (duplicate/incorrect breadcrumb URLs, wrong parent
category, deprecated type), not malformed JSON.

---

## Score: 72 / 100

**Rationale:** Strong foundation — consistent JSON-LD-only implementation, correct `@context`,
server-rendered (not JS-dependent), ISO 8601 dates, real (non-placeholder) `sameAs` profiles,
FAQPage correctly retained for AI visibility rather than removed. Points lost for: one
deprecated HowTo block still live (Critical), a genuine BreadcrumbList duplicate-URL bug on
every product page (Critical), a mis-parented Consulting breadcrumb on TR+EN (Critical), and
two commercially important schema types (Product, Course) that are present but incomplete
enough to miss Google's rich-result eligibility bar entirely.
