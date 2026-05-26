// Prerender'lanacak public route listesi.
// Admin, dashboard, checkout, login gibi DİNAMİK / OTURUMLU sayfalar
// burada YOK — onlar SPA olarak render olmaya devam edecek.
//
// Build sırasında her route için dist/<route>/index.html üretilir.
// Crawler JS render etmeden de tam içeriği görebilir.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function loadJson(p) {
    return JSON.parse(await fs.readFile(p, 'utf8'))
}

const trCommon = await loadJson(path.join(rootDir, 'src/locales/tr/common.json'))
const enCommon = await loadJson(path.join(rootDir, 'src/locales/en/common.json'))
const trSlugs = trCommon.slugs || {}
const enSlugs = enCommon.slugs || {}

// Statik public route'lar (TR)
const trStaticRoutes = [
    '/',
    '/hakkimizda',
    '/iletisim',
    '/nasil-calisir',
    '/khilonfast-nasil-calisir-hizli-profesyonel-ve-sonuc-odakli-pazarlama-deneyimi',
    '/danismanlar',
    '/egitimler',
    '/hizmetlerimiz/maestro-ai',
    '/hizmetlerimiz/butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/go-to-market-stratejisi',
    '/hizmetlerimiz/icerik-stratejisi',
    '/hizmetlerimiz/google-ads',
    '/hizmetlerimiz/sosyal-medya-reklamciligi',
    '/hizmetlerimiz/seo-yonetimi',
    '/hizmetlerimiz/icerik-uretimi',
    '/hizmetlerimiz/b2b-email-pazarlama',
    '/hizmetlerimiz/b2b-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/fintech-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/uretim-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/enerji-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/filo-kiralama-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/ofis-tasarim-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/teknoloji-yazilim-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/endustriyel-gida-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/odeme-sistemleri-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/hediye-karti-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/akaryakit-butunlesik-dijital-pazarlama',
    '/hizmetlerimiz/buyume-odakli-pazarlama-egitimi',
    '/hizmetlerimiz/eye-tracking-reklam-analizi',
    '/sektorel-hizmetler/b2b-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/odeme-sistemleri-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/fintech-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/teknoloji-yazilim-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/enerji-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/filo-kiralama-firmalari-icin-360-pazarlama-yonetimi',
    '/sektorel-hizmetler/uretim-firmalari-icin-360-pazarlama-yonetimi',
    '/urunler/maestro-ai',
    '/urunler/maestro-ai-b2b',
    '/urunler/maestro-ai-odeme-sistemleri',
    '/urunler/maestro-ai-endustriyel-gida',
    '/urunler/maestro-ai-fintech',
    '/urunler/maestro-ai-enerji',
    '/urunler/maestro-ai-ofis-tasarim',
    '/urunler/maestro-ai-filo-kiralama',
    '/urunler/maestro-ai-teknoloji-yazilim',
    '/urunler/maestro-ai-uretim',
    '/urunler/maestro-ai-hediye-karti',
    '/urunler/maestro-ai-akaryakit',
    '/egitimler/buyume-odakli-pazarlama-egitimi'
]

// Statik public route'lar (EN)
const enStaticRoutes = [
    '/en',
    '/en/about',
    '/en/contact',
    '/en/products/maestro-ai',
    '/en/services/integrated-digital-marketing',
    '/en/services/go-to-market-strategy',
    '/en/services/content-strategy',
    '/en/services/google-ads',
    '/en/services/social-media-advertising',
    '/en/services/seo-management',
    '/en/services/content-production',
    '/en/services/b2b-email-marketing',
    '/en/services/b2b-integrated-digital-marketing',
    '/en/services/fintech-integrated-digital-marketing',
    '/en/services/manufacturing-integrated-digital-marketing',
    '/en/services/energy-integrated-digital-marketing',
    '/en/services/fleet-rental-integrated-digital-marketing',
    '/en/services/office-design-integrated-digital-marketing',
    '/en/services/tech-software-integrated-digital-marketing',
    '/en/services/industrial-food-integrated-digital-marketing',
    '/en/services/payment-systems-integrated-digital-marketing',
    '/en/services/corporate-gift-card-integrated-digital-marketing',
    '/en/services/corporate-fuel-integrated-digital-marketing',
    '/en/products/maestro-ai-technology-software',
    '/en/products/maestro-ai-manufacturing',
    '/en/products/maestro-ai-corporate-gift-card',
    '/en/products/maestro-ai-corporate-fuel',
    '/en/consultants',
    '/en/trainings'
]

// Setup flow sayfalarını da prerender et — SeoHead'in doğru canonical set etmesi için
// (Aksi takdirde Apache fallback /index.html sunar, canonical "/" olur — SEO bug)
const setupFlowRoutes = [
    '/google-analytics-kurulum-akisi',
    '/google-tag-manager-kurulum-akisi',
    '/linkedin-reklamlari-kurulum-akisi-khilonfast',
    '/meta-facebook-instagram-reklamlari-kurulum-akisi',
    '/search-ads-google-reklamlari-kurulum-akisi',
    '/tiktok-kurulum-akisi',
    '/butunlesik-pazarlama-kurulum-akisi',
    '/hizmetlerimiz/google-search-console-kurulum-akisi'
]

// slugValues içindeki dinamik route'ları da ekle (eksik olabilir)
const dynamicTrSlugRoutes = Object.values(trSlugs)
    .filter(Boolean)
    .map((slug) => `/${slug}`)
    .filter((route) => !trStaticRoutes.includes(route) && !route.includes(':') && !route.includes('*'))

const dynamicEnSlugRoutes = Object.values(enSlugs)
    .filter(Boolean)
    .map((slug) => `/en/${slug}`)
    .filter((route) => !enStaticRoutes.includes(route) && !route.includes(':') && !route.includes('*'))

// Final liste (duplikasız, sıralı)
export const prerenderRoutes = Array.from(new Set([
    ...trStaticRoutes,
    ...enStaticRoutes,
    ...dynamicTrSlugRoutes,
    ...dynamicEnSlugRoutes,
    ...setupFlowRoutes
])).sort()

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log(JSON.stringify(prerenderRoutes, null, 2))
    console.log(`\nToplam: ${prerenderRoutes.length} route prerender edilecek`)
}
