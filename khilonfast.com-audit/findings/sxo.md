# SXO (Search Experience Optimization) Findings — khilonfast.com

Method: pages fetched via `curl` (browser UA) against prerendered HTML (Vite prerender, no JS execution) for 5 page types; SERP-backwards analysis via live web search for the likely target keyword of each page; manual taxonomy/mismatch scoring (skill reference files/scripts referenced in the skill definition were not present on this machine, so taxonomy and scoring were applied manually using the same methodology).

**SXO Gap Score: 61 / 100** (separate from any technical SEO Health Score)

---

## 1. Homepage (`/`)
- Title: "khilonfast | B2B Pazarlamada Hızlı ve Ölçülebilir Büyüme" · H1: "Daha Az Zaman, Daha Fazla Sonuç!" · ~981 words · schema: Organization/WebSite/WebPage/FAQPage/BreadcrumbList.
- Target keyword (inferred): "B2B pazarlama ajansı".
- SERP consensus: top results (b2Target, 360 Stradigi, Ajans360, Kelime, roible) are almost all **commercial agency landing pages** — same page type as khilonfast's homepage. **Page type: ALIGNED.**
- **Finding (MEDIUM):** khilonfast.com did not appear in the top-10 organic results returned for its own core head term "B2B pazarlama ajansı" during this check — a visibility gap on the site's most competitive commercial keyword, not a page-type problem. Homepage content itself (H1 is a slogan, not a keyword-bearing statement) under-signals the "B2B pazarlama ajansı" intent compared to competitors whose H1s state the category directly.
- User stories:
  1. *"CMO caniyor hızlı doğrulama"* (decision stage) — signal: competitor listicle "En İyi B2B Pazarlama Ajansları 2026" ranking — wants proof (case studies, client logos) within first scroll. Homepage has no visible client logo strip or named case study in the prerendered HTML — **weak trust signal**.
  2. *"Ajans karşılaştıran pazarlama müdürü"* (consideration) — signal: "B2B Pazarlama Ajansı Nasıl Seçilir?" ranking guide — wants clear service list + differentiators. Homepage does have "Hizmetlerimizde Net ve Şeffaf Fiyatlandırma" section (good) but no visible price figures found in prerendered HTML for the homepage itself.
  3. *"İlk kez arayan karar verici"* (awareness) — wants to quickly understand "what does khilonfast actually do." H1 "Daha Az Zaman, Daha Fazla Sonuç" is a slogan, not descriptive — the first descriptive H2 ("Strateji, Yaratıcılık ve Teknolojiyi Birleştiren Pazarlama Çözümleri") does the real explaining. Minor clarity friction.

## 2. Sectoral page — Energy (`/sektorel-hizmetler/enerji-firmalari-icin-360-pazarlama-yonetimi`)
- Title: "Enerji — 360° Pazarlama | khilonfast" · H1: "Enerji için 360° Pazarlama Çözümleri" · ~1092 words · schema: Service/FAQPage/VideoObject/Organization.
- Target keyword: "enerji sektörü pazarlama stratejisi".
- SERP consensus: **mixed** — this khilonfast page itself ranks (#2 in this check), alongside informational blog explainers (Prix Studio, Protan, dijitalistmarketing "7 Adımda Pazarlama Stratejisi") and one competitor agency sector page (DİO). Dominant type leans **informational/how-to (60%) vs commercial (40%)**. **Mismatch severity: MEDIUM.**
- **Finding (MEDIUM):** the page is a pure sales/service page (CTA-heavy: "Size Özel Danışmanlık", closing H2 "Enerji Dünyasında Gücünüzü Gösterin!") but the query intent is partly consideration/informational — searchers want segmentation logic (public vs. industrial vs. investor decision-makers), channel guidance (LinkedIn), and content-marketing tactics before being sold to. The page would benefit from an upfront "what this looks like in practice" explainer block (data points, a mini case) ahead of the CTA stack, without removing the sales sections.
- User stories:
  1. *"Enerji şirketinde pazarlama sorumlusu araştırma yapıyor"* (awareness→consideration) — signal: competing informational articles about multi-stakeholder decision units in energy B2B — wants to see this addressed. Page does have "Enerji Sektöründe Başarıyı Getiren Büyüme Stratejileri" H2, reasonable coverage.
  2. *"Değerlendirme yapan karar verici"* (decision) — signal: agency-vs-agency competitor (DİO) — wants proof of sector expertise (case data, named energy clients). No visible sector-specific case study or logo in this page's prerendered content — **weak trust signal**, consistent with homepage.

## 3. Service page — Content Strategy (`/hizmetlerimiz/icerik-stratejisi`, canonical target of `/icerik-stratejisi/` which 301-redirects here)
- Target keyword: "içerik stratejisi nedir".
- SERP consensus: **100% informational** — every top-10 result is a "nedir + nasıl oluşturulur" educational blog post (İçerik Bulutu Akademi, Wibrit, pamircreative, Can Cankıran, GETWEB, Kriko, AcerCrea, Nesimi Ateş) explaining the concept step-by-step. Only one competitor result mixes in a sales page. **Dominant type: informational/definitional.**
- Target page: a **commercial service/sales page** ("üst düzey bir ajansla makul fiyatlarla çalışabilir" — generic price framing, no real numbers found) with an embedded AI-answer-box snippet ("İçerik Stratejisi hizmeti nedir?") but no full definitional/how-to content comparable to ranking competitors.
- **Mismatch severity: CRITICAL — this is the lead finding of the audit.** If khilonfast is targeting "içerik stratejisi nedir" (or is relying on this page to rank for that head term), a pure-sales page will structurally lose to 9+ pure-informational competitors. Either (a) retarget this page to a lower-funnel commercial variant ("içerik stratejisi hizmeti", "içerik stratejisi ajansı") where SERP is more mixed, or (b) add a genuinely educational top section (full definition + step framework) ahead of the sales pitch, and let a separate blog/resource asset own the "nedir" head term.
- User stories:
  1. *"İçerik stratejisi kavramını öğrenmeye çalışan pazarlama uzmanı"* (awareness) — signal: 9/10 SERP results are definitional guides — wants a clear definition + steps before any pitch. Page's AI-answer-box gives a one-line answer but the surrounding page is sales-first; this user bounces fast if this page ranks for the term. Also, `/icerik-stratejisi/` (no `hizmetlerimiz/` prefix) is a broken/redirected path found linked from search snippets — extra hop for the same intent.
  2. *"Ajans arayan pazarlama müdürü"* (decision) — signal: the sole competitor sales page in this SERP (Lugat) frames pricing/scope explicitly — wants scope + engagement model. Page mentions "makul fiyatlarla" (reasonable pricing) but shows no actual figure or package tiers, unlike the consulting drill-down pages (see §5) which do show a clear price. **Inconsistent pricing transparency across the site.**

## 4. Training/Course page (`/egitimler/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi`)
- Title: "Teknoloji & Yazılım — Büyüme Eğitimi | khilonfast" · H1 matches · ~1728 words, deepest page checked · schema: Course/FAQPage/VideoObject.
- Target keyword class: sector + "pazarlama eğitimi" (broad head term "pazarlama eğitimi kursu" checked as proxy).
- SERP consensus for the broad term: dominated by **course-catalog / certificate-program pages** (Yıldız SEM, BTK Akademi, Udemy, Boğaziçi BÜYEM) each showing curriculum + audience + price/certificate info. **Page type: ALIGNED** (khilonfast's page is structurally a course/curriculum page — 10+1 modules, "Bu Eğitim Kimler İçin?" section, learning outcomes per module).
- **Finding (HIGH — conversion friction):** the CTA ("Programa Katıl") links to `#pricing`, and a `<div class="service-hero-visual price-only">` placeholder exists, but **zero price text (₺/$/USD/fiyat/ücret) is present anywhere in the prerendered HTML** — unlike every competitor course page in this SERP set, which shows price/certificate cost up front, and unlike khilonfast's own consulting pages (§5), which do show a clear "5.000 USD /tek seferlik" price. This is an inconsistency: a JS-only or gated price presentation on the training page specifically. Whether the live price appears after client-side JS execution could not be confirmed in this pass (no browser-rendering tool was available in this environment) — flagged as a **limitation**, but worth verifying with a rendered (Playwright) fetch.
- Social proof: only 2 testimonial/review keyword hits, 0 case-study/logo mentions found in this page.
- User stories:
  1. *"SaaS pazarlama ekibi lideri program arıyor"* (decision) — signal: competitor course pages showing price/certificate prominently — wants price and format (in-person? online? group size?) within one scroll. Currently opaque on price; format is stated ("yüz yüze"/in-person implied via sibling consulting copy) but should be confirmed directly on this page too.
  2. *"Kurumsal eğitim bütçesi onaylayan yönetici"* (decision) — wants ROI proof (past cohort results, client logos). Not present in prerendered content — same authority gap as §1/§2.

## 5. Consulting hub + drill-down (`/danismanlik` hub, `/danismanlik/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-danismanligi` drill-down) and `/danismanlar` (consultants directory)
- Hub page (`/danismanlik`): CollectionPage/ItemList schema, ~958 words, lists 10 sector drill-down links — **no price teaser or consultant preview at hub level**.
- Drill-down page: title "Danışmanlık Hizmetleri | khilonfast" pattern; content is the deepest and most conversion-ready page type checked:
  - Clear price: **"5.000 USD / tek seferlik"**, format ("Yüz yüze, Şirketinizde"), audience ("CEO, CMO, CSO, Pazarlama ve Satış Profesyonelleri"), 11-module curriculum with per-module outcome, **1 testimonial quote**, FAQ (3 Q&A: how sessions run, who it's for, how many can attend).
  - CTA path: "Danışmanlığı Başlat" → anchors to `#pricing` → "Başlayın" button (JS-driven — actual checkout/booking flow could not be exercised without a browser; **cannot confirm number of steps, login requirement, or calendar-slot UX from static HTML alone — limitation**).
- SERP consensus for "pazarlama danışmanlığı hizmeti": mixed commercial pages (Albert Solino, York and Chapel, PwC, Smartmetrics, Digital Advice Lab) — **page type: ALIGNED**, and content depth (price + modules + FAQ + testimonial) is competitive or better than most SERP peers, several of which show no price at all.
- **Finding (MEDIUM):** only **one** testimonial, no client logos, no named case results (e.g., "X şirketi lead kalitesini %Y artırdı") on either the drill-down or hub page — trust signal is thin relative to the size of the commitment (5,000 USD, in-person, 10+1 sessions).
- **Finding (LOW-MEDIUM):** the hub page (`/danismanlik`) itself carries no price/social proof, forcing a user comparing sectors to click into each drill-down individually — reasonable for a directory page but a mini price range ("5.000–10.000 USD arası") at hub level would reduce friction for comparison-stage users.
- User stories:
  1. *"Danışmanlık bütçesi olan CMO fiyat karşılaştırıyor"* (decision) — signal: several SERP competitors hide pricing entirely — khilonfast's transparent price is a **competitive advantage**, well-executed here (contrast with training page in §4, which does NOT show price).
  2. *"Programın gerçek etkisini doğrulamak isteyen CEO"* (decision, trust) — signal: single generic testimonial ("khilonfast Danışmanlık Müşterisi / Program Mezunu" — no name/company/logo) — insufficient to de-risk a 5,000 USD in-person commitment. Named/quantified case studies recommended.
  3. *"Danışman profili inceleyen değerlendirici"* (consideration) — `/danismanlar` directory exists and is indexed (own title/meta/schema), reasonably aligned as a "team/expert" page type against competitor "who we are" pages, but only 825 words and 3 H3s — thin relative to the trust-building job it needs to do (bios, credentials, past client sectors).

---

## Cross-cutting patterns
1. **Pricing transparency is inconsistent across page types**: consulting drill-down pages show exact price; homepage, sector pages, service pages, and training pages do not (or only vaguely reference "reasonable pricing"). This inconsistency itself is a UX/trust signal problem — recommend a site-wide policy (either show price ranges everywhere or consistently gate all of them behind a quote CTA).
2. **Authority/trust content (case studies, named client logos, quantified results) is thin site-wide** — every page type checked had at most 1-2 generic testimonials and no visible named case studies in prerendered HTML. This is the single highest-leverage improvement across all 5 page types (see E-E-A-T note below).
3. **Page-type alignment is generally good** (4 of 5 checked page types were SERP-type-ALIGNED); the one clear mismatch is the content-strategy service page competing for a purely informational head term (§3), which is the primary finding of this audit.

## Limitations
- No headless-browser rendering tool (Playwright) was available in this environment; all pages were fetched via `curl` against prerendered/SSR HTML only. Any purely client-side-rendered content (e.g., a JS-injected price on the training page, the actual checkout/booking step count and UX for consulting/training purchase flows, live cart/login gating) could not be verified and is flagged inline above.
- SERP analysis used live WebSearch results (a proxy for Google's organic SERP) rather than a scraped, geo/device-matched Google SERP; exact ranking position, presence of a Featured Snippet/PAA/AI Overview, and SERP volatility over time could not be confirmed with certainty.
- Only 5 of ~40+ total page types on the site were sampled (homepage, 1 of 10 sector pages, 1 of 8 service pages, 1 of 9 training pages, 1 of 10 consulting drill-downs); findings on pricing/testimonial patterns are treated as directionally representative, not exhaustive.
- Skill reference files (`page-type-taxonomy.md`, `user-story-framework.md`, `persona-scoring.md`, `wireframe-templates.md`) and the `render_page.py`/`parse_html.py` scripts referenced in the skill instructions were not found on this machine; taxonomy classification and scoring were applied manually using equivalent judgment.
- No wireframe was generated (not requested).

## Cross-skill recommendations
- E-E-A-T gap (thin/generic testimonials, no named case studies across all page types) → recommend `/seo content` for a deeper E-E-A-T content audit.
- Content-strategy service page mismatch vs. informational SERP (§3) → recommend `/seo page` for a page-level audit and content-restructure plan.
- Consulting/training checkout flow could not be verified end-to-end → recommend a manual QA pass or a follow-up SXO run with browser rendering enabled.
