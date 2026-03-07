# SEO Checkpoint

Last updated: 2026-03-08

## Completed

- `src/components/SeoHead.tsx`
  - Service/product/course titles were made more specific.
  - Alias URLs, unknown fallback URLs, and dynamic resolver URLs were set to `noindex`.
  - Canonical handling was tightened for known routes.
- `src/App.tsx`
  - Added direct redirects for `/home` and `/elementor-696` to `/`.
- `scripts/generate-seo-assets.mjs`
  - Added generation of `public/_redirects`.
  - Added `robots.txt` disallow rules for `/legacy-pages/`, `/home`, and `/elementor-696`.
  - Added 301 redirect rules for legacy training, product, sectoral, and test URLs.

## Generated Files

- `public/robots.txt`
- `public/_redirects`
- `public/sitemap.xml`

## Verified

- `npm run build` passed successfully after the SEO changes.

## Next Priority

Server/CDN level SEO cleanup:

1. Cloudflare challenge screen must be removed for crawlable public pages.
2. A single canonical host must be enforced with 301 redirects.
3. Apache/cPanel `.htaccess` rules should be aligned with canonical host and SPA fallback order.
4. Live checks should be run with:
   - `curl -I https://khilonfast.com/home`
   - `curl -I https://khilonfast.com/elementor-696`
   - `curl -I https://www.khilonfast.com/`

## Reminder Prompt

If you reopen this workspace, say:

`SEO checkpoint'ten devam et`

and continue from this file.
