# Content Quality Audit — khilonfast.com
Audited per Google Sept 2025 QRG. Method: raw HTML fetch (curl, no JS) of 12 real URLs pulled from the site's own sitemaps (page/service/sectoral/training/product), confirming the SPA is properly prerendered — full text content (881–1780 words per page) is present in raw HTML with no JS execution required. Pages sampled: homepage TR/EN, /hakkimizda + /en/about, /iletisim + /en/contact, 2 service pages (go-to-market-stratejisi, seo-yonetimi), 3 sectoral pages (b2b, fintech, ödeme-sistemleri), 2 training pages (buyume-odakli-pazarlama-egitimi general + fintech variant), 2 product pages (Maestro AI, Eye Tracking), 1 "how it works" page.

## Content Quality Score: 61/100

E-E-A-T breakdown (weighted): Experience 12/20, Expertise 15/25, Authoritativeness 12/25, Trustworthiness 22/30 → weighted composite ≈ 61.

## E-E-A-T Breakdown

**Experience — 12/20 (Medium risk)**
- No visible first-hand case studies with real client names/logos/metrics on any sampled page (sectoral pages carry only a single one-line testimonial quote, no result data, no before/after numbers, no linked case-study page).
- Named human expert "Bora Işık" appears repeatedly as the training-course instructor ("Türkiye'nin sayılı uzmanlarından Bora Işık") — a positive experience/authority signal, but there is no author bio page, no credentials, no LinkedIn/portfolio link for this person anywhere in the sampled HTML.
- Testimonial quotes on sectoral pages are attributed to different named people/companies per page (e.g., "Emre Güzer, CEO, Lidio" on the B2B page vs "Hakan Erdoğan, CMO, FinPay" on the FinTech page) with no way to verify authenticity (no LinkedIn link, no case-study backup, no video/photo). Because these swap in lockstep with the templated sector variable, they read as plausible-but-unverifiable placeholder testimonials rather than documented experience.

**Expertise — 15/25 (Medium risk)**
- Organization schema is present sitewide (Organization/WebSite/WebPage graph) but contains no `Person`/`author` entity anywhere sampled — no bylines, no author credentials on any page, despite training pages naming an instructor.
- FAQPage schema (Question/Answer) is implemented correctly and present on every sampled page type (home, sectoral, service, training, about) — a genuine technical-expertise/structured-data positive.
- Copy is heavy on generic marketing-agency phrasing ("360° pazarlama yönetimi", "uçtan uca", "veri analitiği bilimi ve yaratıcılık sanatı") repeated near-verbatim across page types, which reads as templated rather than domain-expert insight specific to each vertical.

**Authoritativeness — 12/25 (High risk)**
- `sameAs` in Organization schema lists only LinkedIn company page + Instagram — no press mentions, no third-party citations, no industry awards/certifications, no partner/client logo wall found in sampled HTML.
- No backlinked case studies, no bylined guest content, no evidence of external recognition anywhere in the sample.
- The recurring FAQ question "Neden yüz yüze veya online toplantı yapmıyoruz?" (explaining an async, email-only service model) is honest but also signals limited direct-verification opportunities for prospects, which weakens third-party trust building.

**Trustworthiness — 22/30 (Low-Medium risk)**
- Positive: /iletisim has an email and a phone number (`+90 533 494 58 69`), legal footer links present sitewide (Gizlilik Politikası/KVKK, Çerez Politikası, Hizmet Şartları, Mesafeli Satış Sözleşmesi, Kurumsal/B2B Ek Şartlar), cookie-consent UI present.
- **Inconsistency found:** two different contact domains appear in the footer/contact area — `info@khilon.com` and `info@khilonfast.com`. Mixed brand domains in contact info is a minor but real trust/consistency flag (looks unmaintained or like a legacy rebrand artifact).
- No physical address, no company registration/tax number, no team page with real photos/names found in the sampled pages (About page text was not fully broken down for legal-entity details — recommend explicit check by whoever owns /hakkimizda for a registered company name + address, which QRG explicitly rewards for YMYL-adjacent B2B service pages).

## Thin / Duplicate Content Findings

**[HIGH] Sectoral pages are ~85% templated boilerplate with only variable-swapping, not genuine differentiation.**
Diffed full extracted text of 3 sectoral pages (B2B, FinTech, Ödeme Sistemleri). Findings:
- Global nav, service list, sector list, training list, product list, footer, legal links, cookie banner: 100% identical across all three (and by construction, likely across all ~18 sectoral pages).
- Section structure is identical line-for-line: hero → AI-answer-box → video showcase → "360° Stratejik Çözümler" grid → Maestro AI block → dijital pazarlama block → "İhtiyaca Özel Çözümler" 4-card grid → strateji/danışmanlık block → reklam görsel analizi (eye-tracking) bullet block → 1 testimonial → SSS (FAQ) → footer.
- **FAQ block: 5 of 6 questions and answers are copied verbatim across pages, word-for-word** ("Neden yüz yüze veya online toplantı yapmıyoruz?", "khilonfast ile kimler çalışmamalı?", "khilonfast kimler için ideal bir iş ortağıdır?", "khilonfast ile iletişimi nasıl sağlayabilirim?", "Hizmet satın alımdan sonra süreç nasıl ilerleyecek?" — identical text on both B2B and FinTech pages). Only the first FAQ question/answer is sector-customized.
- Genuinely unique content per sectoral page is limited to: H1/title, the ~2-sentence AI-answer-box paragraph, ~4-6 short one-line value props, the testimonial quote/name, and light industry-noun substitution inside otherwise identical sentence templates (e.g. "B2B'de büyümek..." → "Finansal teknolojilerde liderliğe oynamak..."). Estimated unique text per sectoral page: roughly 250-400 words out of the ~1,100-1,580 total words counted — the rest is repeated site chrome/FAQ.
- Risk: with ~18 sectoral pages (and a structurally parallel ~10 training pages using the same "Büyüme Odaklı Pazarlama Eğitimi" template with only the sector noun swapped, per the sitemap listing), this is a classic doorway-page / near-duplicate pattern that the Sept 2025 QRG explicitly flags as low-value "scaled content" if it lacks substantive unique value per page. Since this falls under programmatic-style page generation, cross-reference with the `seo-programmatic` sub-skill for a full page-count-scaled duplication assessment.

**[MEDIUM] Training pages likely follow the same pattern.** Not fully diffed line-by-line, but titles/URLs follow an identical formula (`{Sektör} Sektöründe Büyüme Odaklı Pazarlama Eğitimi`) for ~10 sectors, and the two sampled training pages (general + fintech) share the same instructor bio block, same "Bora Işık" credibility paragraph, and same surrounding site chrome — spot check strongly suggests the same templating ratio as the sectoral pages.

**[LOW] Word counts meet or exceed QRG floors on all sampled page types** — sectoral pages (1,100-1,580 words) exceed the location/service-page floor even after chrome is subtracted; About (1,503-1,717 words) and Home (981-1,060 words) meet homepage minimums; product pages (882-1,292 words) meet the complex-product floor. Word count is not the binding constraint here — differentiation is.

## Readability

- Turkish body copy paragraphs are generally short (1-3 sentences) in hero/value-prop sections — good scannability.
- **[MEDIUM] FAQ answers are long, jargon-dense single-paragraph run-ons.** Example: the "khilonfast ile kimler çalışmamalı?" answer is a single ~100+ word sentence packed with subordinate clauses ("...sadece bir yüz yüze görüşmeyle kendini güvende hisseden, metrikler ve analizlerle arası iyi olmayan, gelişmeleri anlamlı bir şekilde takip edemeyen, yeni nesil pazarlama araçlarına mesafeli olan..."). This hurts readability scores and is also harder for AI systems to extract a clean quotable fact from, compared to the crisp AI-answer-box paragraphs.
- Marketing buzzword density is high and repetitive across pages ("360° pazarlama yönetimi", "uçtan uca", "veriye dayalı", "sonuç odaklı") — natural for the industry but repeated near-identically across dozens of pages reduces perceived expertise/originality per the Sept 2025 AI-content quality markers ("generic phrasing, lack of specificity").

## AI Citation Readiness — Score: 68/100

- **Confirmed present and correctly structured:** the "AI Answer Box" (`<div class="ai-answer-box" role="note">`) sits immediately after the H1/hero on every sampled page (home, sectoral, service, training, product) with a clear "X nedir?" question label and a 2-3 sentence direct-answer paragraph. This matches the prior memory note that 146/170 pages received this treatment — verified present and well-formed on all sampled pages.
- **Gap:** the answer-box question is marked up as a `<div class="ai-answer-eyebrow">`/`<span>`, not a semantic heading (`<h2>`/`<h3>`) and not wrapped in `Question`/`Answer` schema itself (the FAQPage schema further down the page is separate and not linked to this box). Adding a heading tag + a small QAPage/Question schema around the answer-box would strengthen extraction reliability for AI crawlers that weight heading hierarchy.
- FAQPage + Question/Answer JSON-LD schema is correctly implemented sitewide (verified on home, sectoral, about, training pages) — strong positive for AI citation and rich-result eligibility.
- BreadcrumbList schema also present — good for hierarchy clarity.
- **Duplication undermines citation value:** since 5/6 FAQ Q&As are copied verbatim across the sectoral page set, an AI system indexing multiple khilonfast pages will encounter the same "answer" attributed to different URLs/contexts, diluting uniqueness and potentially causing an AI engine to only ever cite one canonical version.

## Freshness Signals

- **[MEDIUM] `dateModified` in JSON-LD is not a genuine per-page edit timestamp.** Per prior project memory, this value is generated from a global `__BUILD_DATE__` Vite define at build time, so every page on the site reports the same "modified" timestamp regardless of whether that page's content actually changed. Confirmed independently here: the sitemap `<lastmod>` for multiple distinct sectoral URLs (b2b, payment-systems, etc.) is identical to the second (`2026-07-02T11:59:54.715Z`), consistent with a single batch export rather than real per-page edit history.
- Risk: this is a low-to-medium risk pattern — it is not deceptive in intent, but if scrutinized it is a non-differentiated freshness signal that provides no real information to search engines about which pages were actually recently updated. Recommend deriving `dateModified` from actual CMS/content last-edited timestamps if the underlying data model supports it (or falling back to `datePublished`-only for pages that don't track edits, rather than a synthetic sitewide "modified" stamp).

## Recommendations (priority order)

1. **[HIGH]** Rewrite/expand the shared FAQ block on sectoral pages so at least 4-5 of the 6 Q&As are genuinely sector-specific (regulatory concerns for FinTech, seasonal/procurement cycles for Enerji, tender-based sales for Kurumsal Akaryakıt, etc.) rather than reusing the identical generic company-process FAQ verbatim across ~18 URLs.
2. **[HIGH]** Add at least one real, verifiable case study per major vertical (client name with permission + concrete metric, e.g., "CAC'i %34 düşürdük" with a linked full case study) rather than single-line unverified testimonial quotes — this is the single highest-leverage E-E-A-T/Experience fix available.
3. **[MEDIUM]** Fix the `info@khilon.com` vs `info@khilonfast.com` inconsistency — standardize on one contact domain across footer, contact page, and any transactional email templates.
4. **[MEDIUM]** Create a real author/expert profile for "Bora Işık" (credentials, LinkedIn, photo, Person schema) and link it from the training pages that already invoke his name as a trust signal — cheap to do, currently a claimed-but-unverified expertise signal.
5. **[MEDIUM]** Break up long single-sentence FAQ answers into 2-3 shorter sentences or a short bullet list to improve readability and make individual claims more independently quotable by AI systems.
6. **[LOW]** Promote the AI-answer-box question text into a semantic heading and wrap it in its own `Question`/`Answer` (or `DefinedTerm`) schema block distinct from the page's general FAQ schema, to make it independently extractable.
7. **[LOW]** Replace the synthetic sitewide `dateModified`/sitemap `lastmod` batch-timestamp with genuine per-page last-edited dates where the CMS can support it.

## Cross-reference
Given the scale of near-identical sectoral/training pages (~18 + ~10 respectively) built from one template with keyword substitution, this audit should be read alongside the `seo-programmatic` sub-skill's assessment for a full duplication/thin-content-at-scale verdict, and alongside `seo-competitor-pages` if/when comparison-style pages are added.
