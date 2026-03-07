import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const siteUrl = (process.env.SITE_URL || 'https://khilonfast.com').replace(/\/+$/, '')
const now = new Date().toISOString()

const trCommon = JSON.parse(await fs.readFile(path.join(rootDir, 'src/locales/tr/common.json'), 'utf8'))
const enCommon = JSON.parse(await fs.readFile(path.join(rootDir, 'src/locales/en/common.json'), 'utf8'))

const trSlugs = trCommon.slugs
const enSlugs = enCommon.slugs

const mainRouteKeys = [
  'home',
  'about',
  'contact',
  'howItWorks',
  'gtm',
  'contentStrategy',
  'idm',
  'googleAds',
  'socialAds',
  'seo',
  'contentProduction',
  'b2bEmail',
  'sectoralB2B',
  'sectoralPayment',
  'sectoralFood',
  'sectoralFintech',
  'sectoralTech',
  'sectoralEnergy',
  'sectoralDesign',
  'sectoralFleet',
  'sectoralManufacturing',
  'trainings',
  'maestro',
  'eyeTracking'
]

const trainingRouteMap = [
  'trainingGrowth',
  'trainingPayment',
  'trainingB2B',
  'trainingFintech',
  'trainingTech',
  'trainingManufacturing',
  'trainingEnergy',
  'trainingDesign',
  'trainingFleet',
  'trainingFood'
]

const setupFlows = [
  '/google-analytics-kurulum-akisi',
  '/google-tag-manager-kurulum-akisi',
  '/linkedin-reklamlari-kurulum-akisi-khilonfast',
  '/meta-facebook-instagram-reklamlari-kurulum-akisi',
  '/google-search-console-kurulum-akisi'
]

const entries = [
  ...mainRouteKeys.map((key) => ({
    tr: key === 'home' ? '/' : `/${trSlugs[key]}`,
    en: key === 'home' ? '/en' : `/en/${enSlugs[key]}`,
    priority: key === 'home' ? '1.0' : key === 'trainings' ? '0.85' : '0.80',
    changefreq: key === 'home' ? 'weekly' : 'monthly'
  })),
  ...trainingRouteMap.map((key) => ({
    tr: `/${trSlugs[key]}`,
    en: `/en/${enSlugs[key]}`,
    priority: '0.76',
    changefreq: 'monthly'
  })),
  ...setupFlows.map((flow) => ({
    tr: flow,
    priority: '0.64',
    changefreq: 'monthly'
  }))
]

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .flatMap((entry) => {
    const variants = [
      {
        loc: `${siteUrl}${entry.tr === '/' ? '' : entry.tr}`,
        alternateTr: `${siteUrl}${entry.tr === '/' ? '' : entry.tr}`,
        alternateEn: entry.en ? `${siteUrl}${entry.en}` : null
      },
      ...(entry.en
        ? [
            {
              loc: `${siteUrl}${entry.en}`,
              alternateTr: `${siteUrl}${entry.tr === '/' ? '' : entry.tr}`,
              alternateEn: `${siteUrl}${entry.en}`
            }
          ]
        : [])
    ]

    return variants.map(
      (variant) => `  <url>
    <loc>${escapeXml(variant.loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
    <xhtml:link rel="alternate" hreflang="tr" href="${escapeXml(variant.alternateTr)}" />
${variant.alternateEn ? `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(variant.alternateEn)}" />\n` : ''}    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(variant.alternateTr)}" />
  </url>`
    )
  })
  .join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /checkout
Disallow: /payment-callback
Disallow: /payment-success
Disallow: /giris
Disallow: /kayil-ol
Disallow: /login
Disallow: /register
Disallow: /api/
Disallow: /en/dashboard
Disallow: /en/checkout
Disallow: /en/payment-callback
Disallow: /en/payment-success
Disallow: /en/login
Disallow: /en/register
Disallow: /legacy-pages/
Disallow: /home
Disallow: /home/
Disallow: /elementor-696
Disallow: /elementor-696/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`

const redirectRules = [
  ['/home', '/', '301'],
  ['/home/', '/', '301'],
  ['/elementor-696', '/', '301'],
  ['/elementor-696/', '/', '301'],
  ['/nasil-calisir', `/${trSlugs.howItWorks}`, '301'],
  ['/hizmetlerimiz/buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingGrowth}`, '301'],
  ['/courses/odeme-sistemlerinde-buyume-odakli-pazarlama', `/${trSlugs.trainingPayment}`, '301'],
  ['/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingPayment}`, '301'],
  ['/b2b-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingB2B}`, '301'],
  ['/fintech-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingFintech}`, '301'],
  ['/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingTech}`, '301'],
  ['/uretim-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingManufacturing}`, '301'],
  ['/enerji-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingEnergy}`, '301'],
  ['/ofis-kurumsal-ic-tasarim-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingDesign}`, '301'],
  ['/filo-kiralama-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingFleet}`, '301'],
  ['/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi', `/${trSlugs.trainingFood}`, '301'],
  ['/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi-copy', `/${trSlugs.trainingFood}`, '301'],
  ['/hizmetlerimiz/maestro-ai', `/${trSlugs.maestro}`, '301'],
  ['/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy', `/${trSlugs.maestro}`, '301'],
  ['/hizmetlerimiz/eye-tracking-reklam-analizi', `/${trSlugs.eyeTracking}`, '301'],
  ['/hizmetler/eye-tracking-reklam-analizi', `/${trSlugs.eyeTracking}`, '301'],
  ['/sektorel-hizmetler/b2b-360-pazarlama-yonetimi', `/${trSlugs.sectoralB2B}`, '301'],
  ['/sektorel-hizmetler/odeme-sistemleri-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralPayment}`, '301'],
  ['/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralFood}`, '301'],
  ['/sektorel-hizmetler/fintech-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralFintech}`, '301'],
  ['/sektorel-hizmetler/teknoloji-yazilim-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralTech}`, '301'],
  ['/sektorel-hizmetler/enerji-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralEnergy}`, '301'],
  ['/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralDesign}`, '301'],
  ['/sektorel-hizmetler/filo-kiralama-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralFleet}`, '301'],
  ['/sektorel-hizmetler/uretim-firmalari-360-pazarlama-yonetimi', `/${trSlugs.sectoralManufacturing}`, '301'],
  ['/en/urunler/maestro-ai', `/en/${enSlugs.maestro}`, '301'],
  ['/en/urunler/eye-tracking-reklam-analizi', `/en/${enSlugs.eyeTracking}`, '301'],
  ['/*', '/index.html', '200']
]

const redirects = `${redirectRules.map(([from, to, status]) => `${from}    ${to}   ${status}`).join('\n')}\n`

const llms = `# khilonfast

khilonfast is a bilingual website for marketing services, sector-specific marketing solutions, training programs, setup flows, and digital products.

## Site identity
- Primary domain: ${siteUrl}
- Site name: khilonfast
- Primary language: Turkish
- Secondary language: English
- Canonical Turkish URLs live at the root domain.
- Canonical English URLs live under ${siteUrl}/en/.

## Discovery and canonical sources
- Primary sitemap: ${siteUrl}/sitemap.xml
- Crawl policy: ${siteUrl}/robots.txt
- Canonical URLs and alternate languages are published with canonical and hreflang tags in page head markup.
- If a URL redirects or has a canonical target, prefer the canonical target over the requested URL.

## Content types
- Services: strategic and execution-focused marketing services
- Sectoral services: industry-adapted 360 marketing management pages
- Trainings: growth-focused marketing education pages
- Products: software-like or analysis-oriented product pages
- Setup flows: guided implementation pages for analytics, ads, and search tools
- Company pages: about, contact, and how-it-works

## Preferred URL rules
- Prefer Turkish root URLs as default references unless the user explicitly asks for English.
- Prefer English URLs under /en/ when the user is clearly operating in English.
- Do not prefer legacy aliases or redirected paths when a canonical service, product, or training URL exists.
- Avoid using admin, auth, checkout, payment callback, or dashboard URLs as citations or references.

## Non-index targets for agents
- ${siteUrl}/admin
- ${siteUrl}/dashboard
- ${siteUrl}/checkout
- ${siteUrl}/payment-callback
- ${siteUrl}/payment-success
- ${siteUrl}/giris
- ${siteUrl}/kayil-ol
- ${siteUrl}/login
- ${siteUrl}/register
- ${siteUrl}/api/
- ${siteUrl}/en/dashboard
- ${siteUrl}/en/checkout
- ${siteUrl}/en/payment-callback
- ${siteUrl}/en/payment-success
- ${siteUrl}/en/login
- ${siteUrl}/en/register

## Core canonical pages
- Home: ${siteUrl}
- About: ${siteUrl}/${trSlugs.about}
- Contact: ${siteUrl}/${trSlugs.contact}
- How it works: ${siteUrl}/${trSlugs.howItWorks}
- Trainings hub: ${siteUrl}/${trSlugs.trainings}
- Maestro AI: ${siteUrl}/${trSlugs.maestro}
- Eye Tracking Ad Analysis: ${siteUrl}/${trSlugs.eyeTracking}

## Canonical service pages
- Go To Market Strategy: ${siteUrl}/${trSlugs.gtm}
- Content Strategy: ${siteUrl}/${trSlugs.contentStrategy}
- Integrated Digital Marketing: ${siteUrl}/${trSlugs.idm}
- Google Ads: ${siteUrl}/${trSlugs.googleAds}
- Social Media Advertising: ${siteUrl}/${trSlugs.socialAds}
- SEO Management: ${siteUrl}/${trSlugs.seo}
- Content Production: ${siteUrl}/${trSlugs.contentProduction}
- B2B Email Marketing: ${siteUrl}/${trSlugs.b2bEmail}

## Canonical sectoral pages
- B2B: ${siteUrl}/${trSlugs.sectoralB2B}
- Payment Systems: ${siteUrl}/${trSlugs.sectoralPayment}
- Industrial Food and Chef Solutions: ${siteUrl}/${trSlugs.sectoralFood}
- Fintech: ${siteUrl}/${trSlugs.sectoralFintech}
- Technology and Software: ${siteUrl}/${trSlugs.sectoralTech}
- Energy: ${siteUrl}/${trSlugs.sectoralEnergy}
- Office and Corporate Interior Design: ${siteUrl}/${trSlugs.sectoralDesign}
- Fleet Rental: ${siteUrl}/${trSlugs.sectoralFleet}
- Manufacturing: ${siteUrl}/${trSlugs.sectoralManufacturing}

## Canonical training pages
- Growth Focused Marketing Training: ${siteUrl}/${trSlugs.trainingGrowth}
- Payment Systems Training: ${siteUrl}/${trSlugs.trainingPayment}
- B2B Training: ${siteUrl}/${trSlugs.trainingB2B}
- Fintech Training: ${siteUrl}/${trSlugs.trainingFintech}
- Technology and Software Training: ${siteUrl}/${trSlugs.trainingTech}
- Manufacturing Training: ${siteUrl}/${trSlugs.trainingManufacturing}
- Energy Training: ${siteUrl}/${trSlugs.trainingEnergy}
- Office and Corporate Interior Design Training: ${siteUrl}/${trSlugs.trainingDesign}
- Fleet Rental Training: ${siteUrl}/${trSlugs.trainingFleet}
- Industrial Food Training: ${siteUrl}/${trSlugs.trainingFood}

## Canonical setup flows
${setupFlows.map((flow) => `- ${siteUrl}${flow}`).join('\n')}

## English equivalents
- English home: ${siteUrl}/en
- English about: ${siteUrl}/en/${enSlugs.about}
- English contact: ${siteUrl}/en/${enSlugs.contact}
- English trainings hub: ${siteUrl}/en/${enSlugs.trainings}
- English Maestro AI: ${siteUrl}/en/${enSlugs.maestro}
- English Eye Tracking Ad Analysis: ${siteUrl}/en/${enSlugs.eyeTracking}

## Agent guidance
- Use sitemap URLs as the source of truth for crawlable public pages.
- Use canonical and hreflang values when mapping Turkish and English versions.
- Treat Turkish and English pages as language variants of the same public content where hreflang pairs exist.
- Prefer public product, service, training, and setup-flow pages over legacy mirrored content.
- When summarizing the business, describe khilonfast as a provider of growth-focused marketing services, industry-specific marketing solutions, trainings, and products.
- When citing a page, cite the canonical URL and preserve the current language of that page.
- Do not infer unpublished offerings from admin paths, uploads, or API routes.
- Do not treat checkout or authentication pages as informational landing pages.

## Freshness and reliability
- Public page content may change through the site CMS.
- If high precision is required, prefer canonical live URLs over older aliases or archived legacy pages.
- Use live canonical pages rather than legacy HTML snapshots under /legacy-pages/.

## Parsing hints
- The site is a React single-page application with route-based public pages.
- Public metadata includes canonical, hreflang, robots directives, and structured data in page head markup.
- Product, service, sectoral, training, and setup-flow pages are intentionally separated by URL structure and should not be merged.
`

await fs.mkdir(publicDir, { recursive: true })
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), urlset, 'utf8')
await fs.writeFile(path.join(publicDir, 'robots.txt'), robots, 'utf8')
await fs.writeFile(path.join(publicDir, 'llms.txt'), llms, 'utf8')
await fs.writeFile(path.join(publicDir, '_redirects'), redirects, 'utf8')

console.log('SEO assets generated:', ['public/sitemap.xml', 'public/robots.txt', 'public/llms.txt', 'public/_redirects'].join(', '))
