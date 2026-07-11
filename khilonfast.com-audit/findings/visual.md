# Visual / UX Audit — khilonfast.com
Date: 2026-07-11
Method: Playwright (Chromium headless), viewports 1280x800 (desktop) and 375x812 (mobile), device_scale_factor=2. Live production site.

Screenshots saved to `/Users/seyidturgut/Works/Khilon/khilonfast.com/web2026/khilonfast.com-audit/screenshots/`:
- `homepage-desktop.png` (full page), `homepage-desktop-atf.png` (above-the-fold only)
- `homepage-mobile.png`
- `mobile-nav-closed.png`, `mobile-nav-open.png`
- `service-page-desktop.png`, `service-page-mobile.png` (Go-to-Market Strategy service page)

---

## 1. Homepage — Desktop (1280x800 effective / captured at higher DPR)

**Value proposition:** Clear. H1 "Daha Az Zaman, Daha Fazla Sonuç!" with eyebrow "KHILONFAST PAZARLAMA ÇÖZÜMLERİ" and a one-sentence supporting paragraph are all visible without scrolling. Two CTAs present above the fold: primary "Hemen Başlayın" (filled lime) and secondary "Hizmetler" (outline).

**Finding V-1 (High severity):** The cookie-consent banner renders as a large dark panel that overlaps and visually competes with the primary CTA area on first load, spanning nearly the full page width at the bottom of the hero. On both desktop and mobile it appears **before any user interaction** and sits directly under/over the CTA buttons, meaning the true "immediately visible, immediately clickable" CTA is arguably the cookie banner's own buttons ("Tümünü Kabul Et"), not the marketing CTA. This dilutes the primary conversion action on first paint. Recommend: reduce banner height, dock it as a slim bottom bar, or delay its layout impact so it doesn't collide with hero CTAs.

Evidence: `homepage-desktop-atf.png`, `service-page-desktop.png` (crop `/tmp/crop_service_top.png` shows the same overlap on an interior page, confirming it's a global component, not homepage-only).

## 2. Homepage — Mobile (375x812)

**Finding V-2 (High severity, reproducible bug):** The mobile hamburger menu button is clipped by the viewport edge. Measured via DOM: button bounding box `left=343.7, right=385.7` while `window.innerWidth=375`. This means ~11px (≈25%) of the 42x42px tap target is rendered **off-screen** and effectively unclickable/unreadable at exactly 375px width (iPhone SE/older iPhone width, still a common breakpoint). Visually confirmed in `homepage-mobile.png` — the hamburger icon is visibly cut off at the right edge (see crop). No horizontal scrollbar is introduced (`scrollWidth == clientWidth == 375`), so the icon is being clipped by an ancestor `overflow:hidden`/container padding math rather than a full layout overflow — likely a fixed-width/negative-margin header container tuned for a slightly wider breakpoint. Recommend: audit header container right-padding/positioning specifically at the 375px breakpoint.

**Finding V-3 (Resolved / positive, per prior work referenced in memory):** Once opened, the mobile nav drawer itself (`mobile-nav-open.png`) is clean, legible, generously spaced (Ana Sayfa / Hizmetler / Sektörel / Eğitimler / Ürünler / Hakkımızda / İletişim, plus Giriş Yap + Nasıl Çalışır? CTAs) with no visible cramping or internal scrollbar — consistent with the compacting work noted in project memory (v36, mobil menü kompakt).

**Caveat / not fully verified:** I was not able to complete verification of the **second-level dropdowns** (Hizmetler → 8 items, Sektörel → 9, Eğitimler → 9, Ürünler → 2) within this session — click automation on the expanded submenus did not complete before time constraints. The top-level drawer is confirmed clean; the density of the nested category lists (the specific thing prior work targeted) should be re-verified in a follow-up pass before considering V-3 fully closed.

Cookie banner on mobile (`homepage-mobile.png`) covers effectively the entire viewport below the fold text, including the CTA buttons and part of the hero paragraph — same issue as V-1, more severe on mobile due to limited vertical space.

## 3. Service Page (Go-to-Market Strategy) — Desktop & Mobile

- Page structure is solid: hero → "what is GTM" definition callout (AEO-style answer box, consistent with memory note on AI Answer Box work) → pricing tiers (Core/Growth/Ultimate) → comparison table → "Nasıl Çalışır?" steps → testimonial → "khilonfast Yaklaşımı" feature grid → FAQ (SSS) → footer. No obvious broken layout in the full-page screenshot.
- **Finding V-4 (Medium severity, low-confidence — possible sandbox artifact):** A section labeled "İZLEYİN & ÖĞRENİN" ("Watch & Learn") contains what appears to be an empty grey placeholder box where a video/media player should be (see crop of `service-page-desktop.png` around the "Doğru Go To Market Stratejisiyle..." heading). This could indicate (a) a video embed that failed to load a poster/thumbnail, or (b) simply third-party video iframe domains being blocked in this sandboxed test environment (analytics/ad requests were also blocked here — see below). **Recommend manual re-check in a normal browser** before treating this as a live bug.
- Same cookie-banner overlap issue as homepage (V-1) reproduced here, confirming it's a shared layout component issue site-wide.
- No obvious text-contrast issues found: navy-on-lime and white-on-dark-navy combinations both read cleanly at a glance.
- No obviously broken `<img>` (alt-text boxes/broken icons) spotted in either full-page capture.

## 4. Layout Shift / Network / Console Notes

- Zero JS console errors on either homepage capture (desktop or mobile).
- Several analytics/ad beacon requests failed in this sandboxed environment (`google.com/ccm/collect`, `google-analytics.com/g/collect`, `doubleclick.net`, `googlesyndication.com`, `px.ads.linkedin.com`) — these are expected to fail under sandboxed/offline-ish network egress rules and are **not** evidence of a live-site problem; they align with the previously-documented GTM/GA4/Meta/LinkedIn analytics stack in project memory. Not counted as a finding.
- No full-page layout shift was visually detected comparing early vs. settled screenshots (cookie banner aside, which is an intentional consent UI, not a shift bug).

## 5. Dark Mode / Theme

- The entire site uses a single fixed dark-navy + lime brand theme (not a light/dark toggle based on OS `prefers-color-scheme`); no separate "dark mode" exists to test, and none is expected for a B2B marketing site of this type. No theme-switching bug to report.

---

## Severity Summary

| ID | Finding | Severity | Confidence |
|----|---------|----------|------------|
| V-1 | Cookie consent banner overlaps/competes with primary CTA above the fold (desktop + mobile + interior pages) | High | High (directly observed) |
| V-2 | Mobile hamburger menu button clipped ~25% off-screen at 375px viewport width | High | High (DOM-measured + visually confirmed) |
| V-3 | Nested nav dropdowns (Hizmetler/Sektörel/Eğitimler/Ürünler) density — top-level drawer confirmed clean; nested lists unverified this session | N/A (informational) | Incomplete — needs follow-up |
| V-4 | Possible empty video/media placeholder on service page "İzleyin & Öğrenin" section | Medium | Low (may be sandbox network artifact) |

---

## Score: 74 / 100

The core brand/UX foundation is strong — clear value prop, fast-reading hero, clean pricing/FAQ/testimonial structure, a genuinely decluttered mobile nav drawer, and no console errors or broken images. Points were deducted for two concrete, reproducible issues: the cookie-consent banner physically colliding with the primary CTA on first paint (a real conversion-risk UX bug across desktop, mobile, and inner pages), and a clipped/partially-off-screen mobile menu button at the 375px breakpoint (a real, DOM-measured bug affecting a primary navigation tap target). The video-placeholder observation is noted but flagged low-confidence pending a non-sandboxed re-check, and the nested-submenu density claim from prior work could not be re-verified in this session and should be spot-checked again.
