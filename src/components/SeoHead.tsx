import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'
import { setupFlows } from '../data/setupFlows'
import { consultingProgramCatalog } from '../data/consultingPrograms'
import { productProgramCatalog } from '../data/productPrograms'
import { legalContent } from '../content/legalContent'

type LocaleValue = {
    tr: string
    en: string
}

type SeoKind = 'website' | 'about' | 'contact' | 'service' | 'product' | 'course' | 'howto' | 'collection'
type SeoSection = 'company' | 'services' | 'sectoral' | 'trainings' | 'products' | 'flows'

type SeoEntry = {
    key?: string
    tr: string
    en?: string
    title: LocaleValue
    description: LocaleValue
    kind: SeoKind
    section?: SeoSection
}

type TitleOptions = {
    tr: string
    en: string
}

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://khilonfast.com').replace(/\/+$/, '')
const DEFAULT_IMAGE = `${SITE_URL}/hero-image.png`
const SITE_NAME = 'khilonfast'

const trSlugs = trCommon.slugs as Record<string, string>
const enSlugs = enCommon.slugs as Record<string, string>
const trTrainingMenu = trCommon.header.menuItems.trainings as Record<string, { title: string; desc: string }>
const enTrainingMenu = enCommon.header.menuItems.trainings as Record<string, { title: string; desc: string }>
const trProductMenu = trCommon.header.menuItems.products as Record<string, { title: string; desc: string }>
const enProductMenu = enCommon.header.menuItems.products as Record<string, { title: string; desc: string }>
const trServiceMenu = trCommon.header.menuItems.services as Record<string, { title: string; desc: string }>
const enServiceMenu = enCommon.header.menuItems.services as Record<string, { title: string; desc: string }>
const trSectoralMenu = trCommon.header.menuItems.sectoral as Record<string, { title: string; desc: string }>
const enSectoralMenu = enCommon.header.menuItems.sectoral as Record<string, { title: string; desc: string }>
const trainingSeoFallbacks: Record<string, LocaleValue & { trDesc: string; enDesc: string }> = {
    growth: {
        tr: 'Büyüme Odaklı Pazarlama Eğitimi',
        en: 'Growth-Focused Marketing Training',
        trDesc: 'Büyüme odaklı pazarlama eğitimi ile satış, değer önerisi, huniler ve ölçümleme süreçlerini yapılandırın.',
        enDesc: 'Structure sales, value proposition, funnels, and measurement with a growth-focused marketing training.'
    }
}

function composeTitle({ tr, en }: TitleOptions): LocaleValue {
    return {
        tr: `${tr} | khilonfast`,
        en: `${en} | khilonfast`
    }
}

// SEO audit: menu başlıkları ≤60 char limitine sığmıyor; navigation UX'i bozmadan
// meta title için kısaltılmış sürüm. Anahtar = menu key (b2b, fintech, vs.).
const shortSectoralTitle: Record<string, { tr: string; en: string }> = {
    b2b:           { tr: 'B2B için 360° Pazarlama',                  en: 'B2B 360° Marketing' },
    fintech:       { tr: 'FinTech için 360° Pazarlama',              en: 'FinTech 360° Marketing' },
    food:          { tr: 'Endüstriyel Gıda — 360° Pazarlama',        en: 'Industrial Food — 360° Marketing' },
    payment:       { tr: 'Ödeme Sistemleri — 360° Pazarlama',        en: 'Payment Systems — 360° Marketing' },
    tech:          { tr: 'Teknoloji & Yazılım — 360° Pazarlama',     en: 'Tech & Software — 360° Marketing' },
    energy:        { tr: 'Enerji — 360° Pazarlama',                  en: 'Energy — 360° Marketing' },
    design:        { tr: 'Ofis & İç Tasarım — 360° Pazarlama',       en: 'Office Design — 360° Marketing' },
    fleet:         { tr: 'Filo Kiralama — 360° Pazarlama',           en: 'Fleet Rental — 360° Marketing' },
    manufacturing: { tr: 'Üretim — 360° Pazarlama',                  en: 'Manufacturing — 360° Marketing' },
    giftCard:      { tr: 'Kurumsal Hediye Kartı — 360° Pazarlama',   en: 'Corporate Gift Card — 360° Marketing' },
    fuel:          { tr: 'Kurumsal Akaryakıt — 360° Pazarlama',      en: 'Corporate Fuel — 360° Marketing' }
}

const shortTrainingTitle: Record<string, { tr: string; en: string }> = {
    growth:        { tr: 'Büyüme Odaklı Pazarlama Eğitimi — Bora Işık', en: 'Growth-Focused Marketing Training with Bora Işık' },
    payment:       { tr: 'Ödeme Sistemleri — Büyüme Eğitimi',        en: 'Payment Systems — Growth Training' },
    b2b:           { tr: 'B2B — Büyüme Odaklı Pazarlama Eğitimi',    en: 'B2B — Growth Marketing Training' },
    fintech:       { tr: 'Fintech — Büyüme Odaklı Eğitim',           en: 'Fintech — Growth Training' },
    tech:          { tr: 'Teknoloji & Yazılım — Büyüme Eğitimi',     en: 'Tech & Software — Growth Training' },
    manufacturing: { tr: 'Üretim — Büyüme Odaklı Eğitim',            en: 'Manufacturing — Growth Training' },
    energy:        { tr: 'Enerji — Büyüme Odaklı Eğitim',            en: 'Energy — Growth Training' },
    design:        { tr: 'Ofis & İç Tasarım — Büyüme Eğitimi',       en: 'Office Design — Growth Training' },
    fleet:         { tr: 'Filo Kiralama — Büyüme Eğitimi',           en: 'Fleet Rental — Growth Training' },
    food:          { tr: 'Endüstriyel Gıda — Büyüme Eğitimi',        en: 'Industrial Food — Growth Training' }
}

// SEO audit: consulting program başlıkları ≤60 char limitine sığmıyor.
// Path slug substring eşleştirmesiyle bulunur (programın path.tr içinden).
const shortConsultingTitle: Array<{ match: string; tr: string; en: string }> = [
    { match: 'odeme-sistemleri',  tr: 'Ödeme Sistemleri — Büyüme Danışmanlığı',     en: 'Payment Systems — Growth Consulting' },
    { match: 'b2b-sektorunde',    tr: 'B2B — Büyüme Odaklı Pazarlama Danışmanlığı', en: 'B2B — Growth Marketing Consulting' },
    { match: 'fintech',           tr: 'FinTech — Büyüme Odaklı Danışmanlık',        en: 'FinTech — Growth Consulting' },
    { match: 'teknoloji-yazilim', tr: 'Teknoloji & Yazılım — Büyüme Danışmanlığı',  en: 'Tech & Software — Growth Consulting' },
    { match: 'uretim',            tr: 'Üretim — Büyüme Odaklı Danışmanlık',         en: 'Manufacturing — Growth Consulting' },
    { match: 'enerji',            tr: 'Enerji — Büyüme Odaklı Danışmanlık',         en: 'Energy — Growth Consulting' },
    { match: 'ofis-kurumsal',     tr: 'Ofis & İç Tasarım — Büyüme Danışmanlığı',    en: 'Office Design — Growth Consulting' },
    { match: 'filo-kiralama',     tr: 'Filo Kiralama — Büyüme Danışmanlığı',        en: 'Fleet Rental — Growth Consulting' },
    { match: 'endustriyel-gida',  tr: 'Endüstriyel Gıda — Büyüme Danışmanlığı',     en: 'Industrial Food — Growth Consulting' },
    { match: 'hediye-karti',      tr: 'Hediye Kartı — Büyüme Danışmanlığı',         en: 'Gift Card — Growth Consulting' },
    { match: 'akaryakit',         tr: 'Kurumsal Akaryakıt — Büyüme Danışmanlığı',   en: 'Corporate Fuel — Growth Consulting' }
]
function getShortConsultingTitle(pathTr: string): { tr: string; en: string } | null {
    for (const entry of shortConsultingTitle) {
        if (pathTr.includes(entry.match)) return { tr: entry.tr, en: entry.en }
    }
    return null
}

const productSeoEntries: SeoEntry[] = productProgramCatalog
    .filter((program) => program.path.tr !== `/${trSlugs.maestro}` && program.path.tr !== `/${trSlugs.eyeTracking}`)
    .map((program) => ({
        key: program.path.tr,
        tr: program.path.tr,
        en: program.path.en,
        title: composeTitle({
            tr: program.title.tr,
            en: program.title.en
        }),
        description: {
            tr: program.summary.tr,
            en: program.summary.en
        },
        kind: 'product' as const,
        section: 'products' as const
    }))

const pageEntries: SeoEntry[] = [
    {
        key: 'home',
        tr: '/',
        en: '/en',
        title: {
            tr: trCommon.pages.home.seo.title,
            en: enCommon.pages.home.seo.title
        },
        description: {
            tr: trCommon.pages.home.seo.description,
            en: enCommon.pages.home.seo.description
        },
        kind: 'website' as const
    },
    {
        tr: `/${trSlugs.about}`,
        en: `/en/${enSlugs.about}`,
        title: {
            tr: 'Hakkımızda — Khilonfast B2B Pazarlama Ajansı',
            en: 'About — Khilonfast B2B Marketing Agency'
        },
        description: {
            tr: trCommon.aboutPage.hero.description,
            en: enCommon.aboutPage.hero.description
        },
        kind: 'about' as const,
        section: 'company'
    },
    {
        key: 'contact',
        tr: `/${trSlugs.contact}`,
        en: `/en/${enSlugs.contact}`,
        title: {
            tr: 'İletişim — Khilonfast Pazarlama Danışmanlığı',
            en: 'Contact — Khilonfast Marketing Consulting'
        },
        description: {
            tr: trCommon.contact.hero.lead,
            en: enCommon.contact.hero.lead
        },
        kind: 'contact' as const,
        section: 'company'
    },
    {
        key: 'privacyPolicy',
        tr: `/${trSlugs.privacyPolicy}`,
        en: `/en/${enSlugs.privacyPolicy}`,
        title: {
            tr: legalContent.tr.privacyPolicy.seoTitle,
            en: legalContent.en.privacyPolicy.seoTitle
        },
        description: {
            tr: legalContent.tr.privacyPolicy.seoDescription,
            en: legalContent.en.privacyPolicy.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'cookiePolicy',
        tr: `/${trSlugs.cookiePolicy}`,
        en: `/en/${enSlugs.cookiePolicy}`,
        title: {
            tr: legalContent.tr.cookiePolicy.seoTitle,
            en: legalContent.en.cookiePolicy.seoTitle
        },
        description: {
            tr: legalContent.tr.cookiePolicy.seoDescription,
            en: legalContent.en.cookiePolicy.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'termsOfService',
        tr: `/${trSlugs.termsOfService}`,
        en: `/en/${enSlugs.termsOfService}`,
        title: {
            tr: legalContent.tr.termsOfService.seoTitle,
            en: legalContent.en.termsOfService.seoTitle
        },
        description: {
            tr: legalContent.tr.termsOfService.seoDescription,
            en: legalContent.en.termsOfService.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'refundPolicy',
        tr: `/${trSlugs.refundPolicy}`,
        en: `/en/${enSlugs.refundPolicy}`,
        title: {
            tr: legalContent.tr.refundPolicy.seoTitle,
            en: legalContent.en.refundPolicy.seoTitle
        },
        description: {
            tr: legalContent.tr.refundPolicy.seoDescription,
            en: legalContent.en.refundPolicy.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'distanceSale',
        tr: `/${trSlugs.distanceSale}`,
        en: `/en/${enSlugs.distanceSale}`,
        title: {
            tr: legalContent.tr.distanceSale.seoTitle,
            en: legalContent.en.distanceSale.seoTitle
        },
        description: {
            tr: legalContent.tr.distanceSale.seoDescription,
            en: legalContent.en.distanceSale.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'preInformation',
        tr: `/${trSlugs.preInformation}`,
        en: `/en/${enSlugs.preInformation}`,
        title: {
            tr: legalContent.tr.preInformation.seoTitle,
            en: legalContent.en.preInformation.seoTitle
        },
        description: {
            tr: legalContent.tr.preInformation.seoDescription,
            en: legalContent.en.preInformation.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'corporateB2B',
        tr: `/${trSlugs.corporateB2B}`,
        en: `/en/${enSlugs.corporateB2B}`,
        title: {
            tr: legalContent.tr.corporateB2B.seoTitle,
            en: legalContent.en.corporateB2B.seoTitle
        },
        description: {
            tr: legalContent.tr.corporateB2B.seoDescription,
            en: legalContent.en.corporateB2B.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'acceptableUse',
        tr: `/${trSlugs.acceptableUse}`,
        en: `/en/${enSlugs.acceptableUse}`,
        title: {
            tr: legalContent.tr.acceptableUse.seoTitle,
            en: legalContent.en.acceptableUse.seoTitle
        },
        description: {
            tr: legalContent.tr.acceptableUse.seoDescription,
            en: legalContent.en.acceptableUse.seoDescription
        },
        kind: 'website' as const,
        section: 'company'
    },
    {
        key: 'checkout',
        tr: `/${trSlugs.checkout}`,
        en: `/en/${enSlugs.checkout}`,
        title: {
            tr: 'Checkout | khilonfast',
            en: 'Checkout | khilonfast'
        },
        description: {
            tr: 'Siparis ve odeme bilgilerinizi tamamlayarak kaydinizi bitirin.',
            en: 'Complete your order and payment details to finish your enrollment.'
        },
        kind: 'website' as const
    },
    {
        key: 'paymentSuccess',
        tr: `/${trSlugs.paymentSuccess}`,
        en: `/en/${enSlugs.paymentSuccess}`,
        title: {
            tr: 'Odeme Basarili | khilonfast',
            en: 'Payment Successful | khilonfast'
        },
        description: {
            tr: 'Odemeniz basariyla alindi ve kaydiniz tamamlandi.',
            en: 'Your payment has been received successfully and your registration is complete.'
        },
        kind: 'website' as const
    },
    {
        key: 'paymentCallback',
        tr: `/${trSlugs.paymentCallback}`,
        en: `/en/${enSlugs.paymentCallback}`,
        title: {
            tr: 'Ödeme Sonucu | khilonfast',
            en: 'Payment Status | khilonfast'
        },
        description: {
            tr: 'Ödeme işleminizin durumu kontrol ediliyor.',
            en: 'Your payment transaction status is being checked.'
        },
        kind: 'website' as const
    },
    {
        key: 'howItWorks',
        tr: `/${trSlugs.howItWorks}`,
        en: `/en/${enSlugs.howItWorks}`,
        title: {
            tr: 'Nasıl Çalışır? — Khilonfast Pazarlama Süreci',
            en: 'How It Works — Khilonfast Marketing Process'
        },
        description: {
            tr: 'Gereksiz toplantı yükünü azaltan, hızlı ve sonuç odaklı pazarlama süreci. Khilonfast ile doğru brief, net süreç ve ölçülebilir sonuçlar.',
            en: 'Cut meeting overhead with a fast, reliable marketing process. Khilonfast delivers clear briefs, structured workflows, and measurable results.'
        },
        kind: 'howto' as const,
        section: 'company'
    },
    {
        key: 'trainings',
        tr: `/${trSlugs.trainings}`,
        en: `/en/${enSlugs.trainings}`,
        title: {
            tr: 'Eğitimler — Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Trainings — Growth-Focused Marketing Courses'
        },
        description: {
            tr: 'Büyüme odaklı pazarlama eğitimleri ile satış, değer önerisi, dönüşüm ve ölçümleme süreçlerini güçlendirin.',
            en: 'Strengthen sales, value proposition, conversion, and measurement with growth-focused marketing trainings.'
        },
        kind: 'collection' as const,
        section: 'trainings'
    },
    {
        key: 'consulting',
        tr: `/${trSlugs.consulting}`,
        en: `/en/${enSlugs.consulting}`,
        title: {
            tr: 'Danışmanlık Hizmetleri | khilonfast',
            en: 'Consulting Services | khilonfast'
        },
        description: {
            tr: 'Sektörünüze özel, uygulamalı ve sonuç odaklı danışmanlık programları ile markanızı büyütün.',
            en: 'Grow your brand with industry-specific, hands-on, and results-oriented consulting programs.'
        },
        kind: 'collection' as const,
        section: 'trainings' // Grouped with trainings for breadcrumbs
    },
    {
        key: 'consultants',
        tr: '/danismanlar',
        en: '/en/consultants',
        title: {
            tr: 'Danışmanlarımız — Uzman B2B Pazarlama Danışmanları',
            en: 'Our Consultants — Expert B2B Marketing Advisors'
        },
        description: {
            tr: 'Uzman danışmanlarımızla tanışın ve işinizi büyütmek için profesyonel destek alın.',
            en: 'Meet our expert consultants and get professional support to grow your business.'
        },
        kind: 'collection' as const
    },
    {
        key: 'gtm',
        tr: `/${trSlugs.gtm}`,
        en: `/en/${enSlugs.gtm}`,
        title: composeTitle({
            tr: 'Go To Market Stratejisi',
            en: 'Go-To-Market Strategy'
        }),
        description: {
            tr: 'Hedef kitlenizi netleştirin, konumlanmanızı keskinleştirin ve pazara ölçülebilir bir Go To Market stratejisiyle güçlü giriş yapın.',
            en: 'Clarify your audience, sharpen positioning, and launch a measurable go-to-market strategy with khilonfast for sustainable growth.'
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'contentStrategy',
        tr: `/${trSlugs.contentStrategy}`,
        en: `/en/${enSlugs.contentStrategy}`,
        title: composeTitle({
            tr: 'İçerik Stratejisi Hizmeti',
            en: 'Content Strategy Services'
        }),
        description: {
            tr: 'Khilonfast ile marka hikayenizi güçlendiren içerik stratejisi: hedef kitle analizi, mesaj çerçevesi ve editoryal planlama ile dönüşüm sağlayın.',
            en: 'Khilonfast content strategy that strengthens your brand narrative: audience research, message framework, and editorial planning for measurable conversion.'
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'idm',
        tr: `/${trSlugs.idm}`,
        en: `/en/${enSlugs.idm}`,
        title: composeTitle({
            tr: 'Bütünleşik Dijital Pazarlama',
            en: 'Integrated Digital Marketing'
        }),
        description: {
            tr: trCommon.serviceIDM.videoShowcase.description,
            en: enCommon.serviceIDM.videoShowcase.description
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'googleAds',
        tr: `/${trSlugs.googleAds}`,
        en: `/en/${enSlugs.googleAds}`,
        title: composeTitle({
            tr: 'Google Ads Yönetimi',
            en: 'Google Ads Management'
        }),
        description: {
            tr: 'Khilonfast ile arama ağı, görüntülü ve YouTube reklamlarınızı performans odaklı yönetin. Doğru anahtar kelime, doğru bütçe, ölçülebilir dönüşüm.',
            en: 'Performance-driven Google Ads management with khilonfast: search, display, and YouTube campaigns built for conversion and measurable ROI.'
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'socialAds',
        tr: `/${trSlugs.socialAds}`,
        en: `/en/${enSlugs.socialAds}`,
        title: composeTitle({
            tr: 'Sosyal Medya Reklamcılığı Hizmeti',
            en: 'Social Media Advertising Services'
        }),
        description: {
            tr: 'Meta, LinkedIn, TikTok ve X reklamlarınızı khilonfast ile hedef kitleye uygun, yüksek etkileşim ve dönüşüm getiren kampanyalarla yönetin.',
            en: 'Manage Meta, LinkedIn, TikTok, and X campaigns with khilonfast to reach the right audience and drive higher engagement, leads, and conversions.'
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'seo',
        tr: `/${trSlugs.seo}`,
        en: `/en/${enSlugs.seo}`,
        title: composeTitle({
            tr: 'SEO Yönetimi Hizmeti',
            en: 'SEO Management Services'
        }),
        description: {
            tr: 'Khilonfast SEO yönetimi ile teknik altyapı, içerik ve link otoritesini birleştirin; arama sonuçlarında üst sıralarda kalıcı organik büyüme elde edin.',
            en: 'Khilonfast SEO management combines technical SEO, content strategy, and link authority to rank higher and grow organic traffic sustainably.'
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'contentProduction',
        tr: `/${trSlugs.contentProduction}`,
        en: `/en/${enSlugs.contentProduction}`,
        title: composeTitle({
            tr: 'İçerik Üretimi ve Dönüşüm Hizmetleri',
            en: 'Content Production & Conversion Services'
        }),
        description: {
            tr: 'Blog, sosyal medya, e-posta ve reklam içerikleri tek elden. Khilonfast ile dönüşüm odaklı, marka tonunuza uygun ve özgün içerik üretimi.',
            en: 'Blog, social, email, and ad content under one roof. Khilonfast produces high-impact, brand-aligned, conversion-focused creative content.'
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'b2bEmail',
        tr: `/${trSlugs.b2bEmail}`,
        en: `/en/${enSlugs.b2bEmail}`,
        title: composeTitle({
            tr: 'B2B Email Pazarlama Hizmeti',
            en: 'B2B Email Marketing Services'
        }),
        description: {
            tr: 'Khilonfast B2B e-posta pazarlama hizmeti ile segmentasyon, otomasyon ve lead nurturing süreçlerinizi profesyonelce yönetin, satış döngüsünü hızlandırın.',
            en: 'Khilonfast B2B email marketing: segmentation, automation, and lead nurturing workflows that shorten the sales cycle and drive measurable pipeline.'
        },
        kind: 'service' as const,
        section: 'services' as const
    },
    // Sector-specific Integrated Digital Marketing pages
    ...([
        {
            tr: '/hizmetlerimiz/b2b-butunlesik-dijital-pazarlama',
            en: '/en/services/b2b-integrated-digital-marketing',
            titleTr: 'B2B Bütünleşik Pazarlama',
            titleEn: 'B2B Integrated Marketing',
            descTr: 'B2B markaların satış döngüsünü kısaltan bütünleşik dijital pazarlama. Khilonfast ile içerik, reklam, e-posta ve SEO\'yu tek stratejide yönetin.',
            descEn: 'Integrated digital marketing that shortens B2B sales cycles. Khilonfast unifies content, ads, email, and SEO into one measurable growth strategy.'
        },
        {
            tr: '/hizmetlerimiz/fintech-butunlesik-dijital-pazarlama',
            en: '/en/services/fintech-integrated-digital-marketing',
            titleTr: 'FinTech Bütünleşik Pazarlama',
            titleEn: 'FinTech Integrated Marketing',
            descTr: 'FinTech şirketlerinde lead kalitesi ve dönüşümü artıran sektör odaklı bütünleşik dijital pazarlama. Khilonfast ile uyumlu, ölçülebilir kampanyalar.',
            descEn: 'Sector-focused integrated digital marketing that lifts lead quality and conversion for fintech brands. Khilonfast runs compliant, measurable campaigns.'
        },
        {
            tr: '/hizmetlerimiz/uretim-butunlesik-dijital-pazarlama',
            en: '/en/services/manufacturing-integrated-digital-marketing',
            titleTr: 'Üretim — Bütünleşik Pazarlama',
            titleEn: 'Manufacturing — Integrated Marketing',
            descTr: 'Üretim ve endüstri firmalarına özel bütünleşik dijital pazarlama. Khilonfast ile teklif sürecini hızlandıran içerik, reklam ve teknik SEO yönetimi.',
            descEn: 'Integrated digital marketing built for manufacturing and industry. Khilonfast accelerates quote workflows with content, ads, and technical SEO.'
        },
        {
            tr: '/hizmetlerimiz/enerji-butunlesik-dijital-pazarlama',
            en: '/en/services/energy-integrated-digital-marketing',
            titleTr: 'Enerji — Bütünleşik Pazarlama',
            titleEn: 'Energy — Integrated Marketing',
            descTr: 'Enerji ve yeşil teknoloji firmalarına yönelik bütünleşik dijital pazarlama. Khilonfast ile B2B karar vericilere ulaşan ölçülebilir kampanyalar yönetin.',
            descEn: 'Integrated digital marketing for energy and clean-tech companies. Khilonfast delivers measurable campaigns that reach B2B decision-makers.'
        },
        {
            tr: '/hizmetlerimiz/filo-kiralama-butunlesik-dijital-pazarlama',
            en: '/en/services/fleet-rental-integrated-digital-marketing',
            titleTr: 'Filo Kiralama — Bütünleşik Pazarlama',
            titleEn: 'Fleet Rental — Integrated Marketing',
            descTr: 'Filo kiralama firmaları için kurumsal mobilite odaklı bütünleşik dijital pazarlama. Khilonfast ile lead kalitesi ve müşteri elde tutmayı artırın.',
            descEn: 'Integrated digital marketing for fleet rental companies focused on corporate mobility. Khilonfast lifts lead quality and customer retention.'
        },
        {
            tr: '/hizmetlerimiz/ofis-tasarim-butunlesik-dijital-pazarlama',
            en: '/en/services/office-design-integrated-digital-marketing',
            titleTr: 'Ofis & İç Tasarım — Bütünleşik Pazarlama',
            titleEn: 'Office Design — Integrated Marketing',
            descTr: 'Ofis ve kurumsal iç tasarım firmaları için referans odaklı bütünleşik dijital pazarlama. Khilonfast ile satış hattınızı sürdürülebilir biçimde besleyin.',
            descEn: 'Integrated digital marketing for office and corporate interior design firms. Khilonfast feeds your sales pipeline with referral-led demand.'
        },
        {
            tr: '/hizmetlerimiz/teknoloji-yazilim-butunlesik-dijital-pazarlama',
            en: '/en/services/tech-software-integrated-digital-marketing',
            titleTr: 'Teknoloji & Yazılım — Bütünleşik Pazarlama',
            titleEn: 'Tech & Software — Integrated Marketing',
            descTr: 'SaaS ve yazılım şirketleri için ürün-pazar uyumunu hızlandıran bütünleşik dijital pazarlama. Khilonfast ile MQL hacmini ve aktivasyonu büyütün.',
            descEn: 'Integrated digital marketing for SaaS and software companies. Khilonfast accelerates product-market fit, MQL volume, and activation rates.'
        },
        {
            tr: '/hizmetlerimiz/endustriyel-gida-butunlesik-dijital-pazarlama',
            en: '/en/services/industrial-food-integrated-digital-marketing',
            titleTr: 'Endüstriyel Gıda — Bütünleşik Pazarlama',
            titleEn: 'Industrial Food — Integrated Marketing',
            descTr: 'Endüstriyel gıda ve şef çözümleri için B2B kanal pazarlamasını güçlendiren bütünleşik dijital strateji. Khilonfast ile satış noktası başına büyüyün.',
            descEn: 'Integrated digital marketing for industrial food and chef solutions. Khilonfast strengthens B2B channel marketing and per-location growth.'
        },
        {
            tr: '/hizmetlerimiz/odeme-sistemleri-butunlesik-dijital-pazarlama',
            en: '/en/services/payment-systems-integrated-digital-marketing',
            titleTr: 'Ödeme Sistemleri — Bütünleşik Pazarlama',
            titleEn: 'Payment Systems — Integrated Marketing',
            descTr: 'Ödeme sistemleri firmalarına özel B2B bütünleşik dijital pazarlama. Khilonfast ile uyumlu, dönüşüm odaklı kampanya ve içerik stratejisi yönetin.',
            descEn: 'Integrated digital marketing for payment systems firms. Khilonfast runs compliant, conversion-driven campaigns for B2B audiences.'
        },
        {
            tr: '/hizmetlerimiz/hediye-karti-butunlesik-dijital-pazarlama',
            en: '/en/services/corporate-gift-card-integrated-digital-marketing',
            titleTr: 'Hediye Kartı — Bütünleşik Pazarlama',
            titleEn: 'Gift Card — Integrated Marketing',
            descTr: 'Kurumsal hediye kartı firmaları için B2B müşteri kazandıran bütünleşik dijital pazarlama. Khilonfast ile satış kanalını ölçülebilir biçimde besleyin.',
            descEn: 'Integrated digital marketing for corporate gift card programs. Khilonfast nurtures B2B buying centers with measurable, predictable demand.'
        },
        {
            tr: '/hizmetlerimiz/akaryakit-butunlesik-dijital-pazarlama',
            en: '/en/services/corporate-fuel-integrated-digital-marketing',
            titleTr: 'Kurumsal Akaryakıt — Bütünleşik Pazarlama',
            titleEn: 'Corporate Fuel — Integrated Marketing',
            descTr: 'Kurumsal akaryakıt çözümleri için filo yöneticilerine yönelik bütünleşik dijital pazarlama. Khilonfast ile B2B müşteri yaşam değerini artırın.',
            descEn: 'Integrated digital marketing for corporate fuel solutions and fleet managers. Khilonfast increases B2B customer lifetime value.'
        }
    ] as const).map(({ tr, en, titleTr, titleEn, descTr, descEn }) => ({
        tr,
        en,
        title: composeTitle({ tr: titleTr, en: titleEn }),
        description: { tr: descTr, en: descEn },
        kind: 'service' as const,
        section: 'services' as const
    })),
    ...([
        { key: 'sectoralB2B', menu: 'b2b', descTr: 'B2B firmalar için 360° pazarlama yönetimi: stratejiden uygulamaya tek elden, marka, dijital ve performans pazarlamasını ölçülebilir hale getirin.', descEn: '360° marketing management for B2B firms: from strategy to execution, unifying brand, digital, and performance under one measurable program.' },
        { key: 'sectoralPayment', menu: 'payment', descTr: 'Ödeme sistemleri firmaları için 360° pazarlama yönetimi. Khilonfast ile uyumlu, dönüşüm odaklı marka ve performans stratejisini tek elden yönetin.', descEn: '360° marketing management for payment systems firms. Khilonfast aligns compliant brand, performance, and content strategies under one program.' },
        { key: 'sectoralFood', menu: 'food', descTr: 'Endüstriyel gıda ve şef çözümleri için 360° pazarlama yönetimi. Khilonfast ile B2B kanal stratejisi, içerik ve performans pazarlamasını birleştirin.', descEn: '360° marketing management for industrial food and chef solutions. Khilonfast unifies B2B channel strategy, content, and performance marketing.' },
        { key: 'sectoralFintech', menu: 'fintech', descTr: 'FinTech firmaları için 360° pazarlama yönetimi. Khilonfast ile düzenlemeye uygun marka, içerik ve performans pazarlama stratejisi yönetin.', descEn: '360° marketing management for fintech firms. Khilonfast runs a compliance-aware brand, content, and performance marketing program.' },
        { key: 'sectoralTech', menu: 'tech', descTr: 'SaaS ve yazılım şirketleri için 360° pazarlama yönetimi. Khilonfast ile ürün-pazar uyumu, talep yaratma ve aktivasyon kanallarını ölçeklendirin.', descEn: '360° marketing management for SaaS and software firms. Khilonfast scales product-market fit, demand generation, and activation channels.' },
        { key: 'sectoralEnergy', menu: 'energy', descTr: 'Enerji ve yeşil teknoloji firmaları için 360° pazarlama yönetimi. Khilonfast ile B2B karar vericilere ulaşan stratejik kampanya altyapısı kurun.', descEn: '360° marketing management for energy and clean-tech firms. Khilonfast builds a strategic campaign engine reaching B2B decision-makers.' },
        { key: 'sectoralDesign', menu: 'design', descTr: 'Ofis ve kurumsal iç tasarım firmaları için 360° pazarlama yönetimi. Khilonfast ile portföy temelli, referans odaklı talep yaratma stratejisi yönetin.', descEn: '360° marketing management for office and corporate interior design firms. Khilonfast runs portfolio-led, referral-focused demand strategy.' },
        { key: 'sectoralFleet', menu: 'fleet', descTr: 'Filo kiralama firmaları için 360° pazarlama yönetimi. Khilonfast ile kurumsal mobilite teklif sürecini hızlandıran içerik ve performans stratejisi.', descEn: '360° marketing management for fleet rental firms. Khilonfast accelerates corporate mobility quote workflows with content and performance.' },
        { key: 'sectoralManufacturing', menu: 'manufacturing', descTr: 'Üretim firmaları için 360° pazarlama yönetimi. Khilonfast ile B2B alıcı yolculuğunu içerik, teknik SEO ve performans reklamlarıyla yapılandırın.', descEn: '360° marketing management for manufacturing firms. Khilonfast structures the B2B buyer journey with content, technical SEO, and ads.' },
        { key: 'sectoralGiftCard', menu: 'giftCard', descTr: 'Kurumsal hediye kartı firmaları için 360° pazarlama yönetimi. Khilonfast ile B2B satın alma merkezlerini besleyen ölçülebilir kampanyalar yönetin.', descEn: '360° marketing management for corporate gift card programs. Khilonfast runs measurable campaigns nurturing B2B buying centers.' },
        { key: 'sectoralFuel', menu: 'fuel', descTr: 'Kurumsal akaryakıt firmaları için 360° pazarlama yönetimi. Khilonfast ile filo yöneticilerini hedefleyen içerik ve performans stratejisi kurun.', descEn: '360° marketing management for corporate fuel solutions. Khilonfast designs content and performance strategy targeting fleet managers.' }
    ] as const).map(({ key, menu, descTr, descEn }) => ({
        key,
        tr: `/${trSlugs[key]}`,
        en: `/en/${enSlugs[key]}`,
        title: composeTitle({
            tr: shortSectoralTitle[menu]?.tr || trSectoralMenu[menu].title,
            en: shortSectoralTitle[menu]?.en || enSectoralMenu[menu].title
        }),
        description: {
            tr: descTr,
            en: descEn
        },
        kind: 'service' as const,
        section: 'sectoral' as const
    })),
    ...([
        { key: 'trainingGrowth', menu: 'growth', descTr: 'Khilonfast büyüme odaklı pazarlama eğitim programı: hedef kitle analizi, satış hunisi, değer önerisi ve ölçümleme süreçlerini uygulamalı öğrenin.', descEn: 'Khilonfast growth-focused marketing training: audience analysis, sales funnel, value proposition, and measurement — all with hands-on practice.' },
        { key: 'trainingPayment', menu: 'payment', descTr: 'Ödeme sistemleri sektörüne özel büyüme odaklı pazarlama eğitimi: dönüşüm, lead kalitesi ve ölçümleme süreçlerini uygulamalı yapılandırın.', descEn: 'Growth-focused marketing training for payment systems: structure conversion, lead quality, and measurement processes with practical exercises.' },
        { key: 'trainingB2B', menu: 'b2b', descTr: 'B2B firmalar için pazarlama ve satış entegrasyonu eğitimi. Khilonfast ile alıcı yolculuğu, MQL/SQL yönetimi ve içerik stratejisi uygulamalı öğretilir.', descEn: 'B2B marketing & sales integration training. Khilonfast covers buyer journey, MQL/SQL handoff, and content strategy through practical case work.' },
        { key: 'trainingFintech', menu: 'fintech', descTr: 'FinTech sektöründe büyüme odaklı pazarlama eğitimi: uyumlu kampanya tasarımı, dönüşüm optimizasyonu ve karar verici hedeflemesi uygulamalı işlenir.', descEn: 'Growth-focused marketing training for fintech: compliant campaign design, conversion optimization, and decision-maker targeting in practice.' },
        { key: 'trainingTech', menu: 'tech', descTr: 'SaaS ve teknoloji markaları için büyüme odaklı pazarlama eğitimi: ürün-pazar uyumu, talep yaratma ve aktivasyon süreçleri uygulamalı işlenir.', descEn: 'Growth-focused marketing training for SaaS and tech: product-market fit, demand generation, and activation processes — all hands-on.' },
        { key: 'trainingManufacturing', menu: 'manufacturing', descTr: 'Üretim sektörüne özel büyüme odaklı pazarlama eğitimi: B2B alıcı yolculuğu, teklif süreci hızlandırma ve içerik stratejisi uygulamalı işlenir.', descEn: 'Growth-focused marketing training for manufacturing: B2B buyer journey, quote workflow acceleration, and content strategy in practice.' },
        { key: 'trainingEnergy', menu: 'energy', descTr: 'Enerji sektöründe karar verici odaklı büyüme odaklı pazarlama eğitimi: stratejik kampanya planlama ve ölçümleme süreçleri uygulamalı işlenir.', descEn: 'Growth-focused marketing training for the energy sector: strategic campaign planning and measurement targeting decision-makers — hands-on.' },
        { key: 'trainingDesign', menu: 'design', descTr: 'Ofis ve kurumsal iç tasarım firmaları için büyüme odaklı pazarlama eğitimi: portföy temelli içerik, referans yönetimi ve teklif süreci uygulamalı işlenir.', descEn: 'Growth-focused marketing training for interior design firms: portfolio-led content, referral management, and quote workflows in practice.' },
        { key: 'trainingFleet', menu: 'fleet', descTr: 'Filo kiralama firmaları için büyüme odaklı pazarlama eğitimi: kurumsal mobilite lead kalitesi, dönüşüm yönetimi ve elde tutma uygulamalı işlenir.', descEn: 'Growth-focused marketing training for fleet rental firms: corporate mobility lead quality, conversion management, and retention hands-on.' },
        { key: 'trainingFood', menu: 'food', descTr: 'Endüstriyel gıda sektörüne özel büyüme odaklı pazarlama eğitimi: B2B kanal pazarlaması, içerik stratejisi ve satış noktası performansı uygulamalı işlenir.', descEn: 'Growth-focused marketing training for industrial food: B2B channel marketing, content strategy, and per-location performance in practice.' }
    ] as const).map(({ key, menu, descTr, descEn }) => ({
        key,
        tr: `/${trSlugs[key]}`,
        en: `/en/${enSlugs[key]}`,
        title: composeTitle({
            tr: shortTrainingTitle[menu]?.tr || trTrainingMenu[menu]?.title || trainingSeoFallbacks[menu]?.tr,
            en: shortTrainingTitle[menu]?.en || enTrainingMenu[menu]?.title || trainingSeoFallbacks[menu]?.en
        }),
        description: {
            tr: descTr,
            en: descEn
        },
        kind: 'course' as const,
        section: 'trainings' as const
    })),
    {
        key: 'trainingGiftCard',
        tr: `/${trSlugs.trainingGiftCard}`,
        en: `/en/${enSlugs.trainingGiftCard}`,
        title: composeTitle({
            tr: 'Hediye Kartı — Büyüme Odaklı Eğitim',
            en: 'Gift Card — Growth Marketing Training'
        }),
        description: {
            tr: 'Kurumsal hediye kartı sektörüne özel büyüme odaklı pazarlama eğitimi ile satış, değer önerisi ve dönüşüm süreçlerini güçlendirin.',
            en: 'Strengthen sales, value proposition, and conversion processes with a growth-focused marketing training tailored to the corporate gift card sector.'
        },
        kind: 'course' as const,
        section: 'trainings' as const
    },
    {
        key: 'trainingFuel',
        tr: `/${trSlugs.trainingFuel}`,
        en: `/en/${enSlugs.trainingFuel}`,
        title: composeTitle({
            tr: 'Kurumsal Akaryakıt — Büyüme Eğitimi',
            en: 'Corporate Fuel — Growth Marketing Training'
        }),
        description: {
            tr: 'Kurumsal akaryakıt çözümleri sektörüne özel büyüme odaklı pazarlama eğitimi ile satış, müşteri edinimi ve ölçümleme süreçlerini yapılandırın.',
            en: 'Structure sales, customer acquisition, and measurement processes with a growth-focused marketing training tailored to the corporate fuel solutions sector.'
        },
        kind: 'course' as const,
        section: 'trainings' as const
    },
    {
        key: 'maestro',
        tr: `/${trSlugs.maestro}`,
        en: `/en/${enSlugs.maestro}`,
        title: composeTitle({
            tr: 'Maestro AI — Sektörel Yapay Zeka Pazarlama Stratejisti',
            en: 'Maestro AI — Industry AI Marketing Strategist'
        }),
        description: {
            tr: 'B2B sektörü için özelleştirilmiş Maestro AI pazarlama stratejisti. Khilonfast ile içerik, kampanya ve dönüşüm planlamasını yapay zeka ile hızlandırın.',
            en: 'Customized AI marketing strategist for the B2B sector. Khilonfast accelerates content, campaign, and conversion planning with Maestro AI.'
        },
        kind: 'product' as const,
        section: 'products' as const
    },
    {
        key: 'eyeTracking',
        tr: `/${trSlugs.eyeTracking}`,
        en: `/en/${enSlugs.eyeTracking}`,
        title: composeTitle({
            tr: 'Eye Tracking ile Reklam Kreatif Analizi',
            en: 'Eye Tracking Ad Creative Analysis'
        }),
        description: {
            tr: trProductMenu.eyeTracking.desc,
            en: enProductMenu.eyeTracking.desc
        },
        kind: 'product' as const,
        section: 'products' as const
    },
    ...productSeoEntries,
    ...setupFlows.map((flow) => ({
        key: flow.path,
        tr: flow.path,
        title: composeTitle({
            tr: flow.title,
            en: flow.title
        }),
        description: {
            tr: flow.purpose,
            en: flow.purpose
        },
        kind: 'howto' as const,
        section: 'flows' as const
    })),
    ...consultingProgramCatalog.map((program) => {
        const shortTitle = getShortConsultingTitle(program.path.tr)
        return ({
        key: program.path.tr,
        tr: program.path.tr,
        en: program.path.en, // ÖNEMLİ: '/danismanlik/...' yerine doğru '/en/consulting/...' EN URL'i
        title: composeTitle({
            tr: shortTitle?.tr || program.title.tr,
            en: shortTitle?.en || program.title.en
        }),
        description: {
            tr: program.summary.tr,
            en: program.summary.en
        },
        kind: 'service' as const,
        section: 'trainings' as const
        })
    }),
    {
        tr: '/dashboard',
        en: '/en/dashboard',
        title: { tr: 'Hesabım | khilonfast', en: 'My Account | khilonfast' },
        description: { tr: 'Hesap bilgileriniz, siparişleriniz ve satın aldığınız içerikler.', en: 'Your account details, orders and purchased content.' },
        kind: 'website' as const
    },
    {
        tr: '/onboarding-formu',
        en: '/en/onboarding-form',
        title: { tr: 'Onboarding Formu | khilonfast', en: 'Onboarding Form | khilonfast' },
        description: { tr: 'Hizmet başlangıç bilgilerini doldurun.', en: 'Fill in your service onboarding details.' },
        kind: 'website' as const
    },
    {
        tr: '/sifre-belirle',
        en: '/en/set-password',
        title: { tr: 'Şifre Belirle | khilonfast', en: 'Set Password | khilonfast' },
        description: { tr: 'Hesabınız için yeni şifre belirleyin.', en: 'Set a new password for your account.' },
        kind: 'website' as const
    },
    {
        tr: '/giris',
        en: '/en/login',
        title: { tr: 'Giriş Yap | khilonfast', en: 'Login | khilonfast' },
        description: { tr: 'Khilonfast hesabınıza giriş yapın.', en: 'Sign in to your Khilonfast account.' },
        kind: 'website' as const
    },
    {
        tr: '/kayit-ol',
        en: '/en/register',
        title: { tr: 'Kayıt Ol | khilonfast', en: 'Register | khilonfast' },
        description: { tr: 'Khilonfast hesabı oluşturun.', en: 'Create your Khilonfast account.' },
        kind: 'website' as const
    },
    {
        tr: '/sifremi-unuttum',
        en: '/en/forgot-password',
        title: { tr: 'Şifremi Unuttum | khilonfast', en: 'Forgot Password | khilonfast' },
        description: { tr: 'Şifre sıfırlama bağlantısı isteyin.', en: 'Request a password reset link.' },
        kind: 'website' as const
    },
    {
        tr: '/payment-success',
        en: '/en/payment-success',
        title: { tr: 'Ödeme Başarılı | khilonfast', en: 'Payment Successful | khilonfast' },
        description: { tr: 'Ödemeniz başarıyla alındı.', en: 'Your payment was received successfully.' },
        kind: 'website' as const
    }
]

const aliasMap: Record<string, string> = {
    '/nasil-calisir': `/${trSlugs.howItWorks}`,
    '/hizmetlerimiz/buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingGrowth}`,
    '/courses/odeme-sistemlerinde-buyume-odakli-pazarlama': `/${trSlugs.trainingPayment}`,
    '/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingPayment}`,
    '/b2b-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingB2B}`,
    '/fintech-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingFintech}`,
    '/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingTech}`,
    '/uretim-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingManufacturing}`,
    '/enerji-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingEnergy}`,
    '/ofis-kurumsal-ic-tasarim-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingDesign}`,
    '/filo-kiralama-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingFleet}`,
    '/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi': `/${trSlugs.trainingFood}`,
    '/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi-copy': `/${trSlugs.trainingFood}`,
    '/hizmetlerimiz/maestro-ai': `/${trSlugs.maestro}`,
    '/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy': `/${trSlugs.maestro}`,
    '/hizmetlerimiz/eye-tracking-reklam-analizi': `/${trSlugs.eyeTracking}`,
    '/hizmetler/eye-tracking-reklam-analizi': `/${trSlugs.eyeTracking}`,
    '/en/urunler/maestro-ai': `/en/${enSlugs.maestro}`,
    '/en/urunler/eye-tracking-reklam-analizi': `/en/${enSlugs.eyeTracking}`,
    ...Object.fromEntries(
        productProgramCatalog
            .filter((program) => program.path.en.startsWith('/en/products/'))
            .map((program) => [
                program.path.en.replace('/en/products/', '/en/urunler/'),
                program.path.en
            ])
    )
}

const noIndexPaths = new Set([
    '/giris',
    '/kayit-ol',
    '/login',
    '/register',
    '/dashboard',
    '/checkout',
    '/payment-success',
    '/payment-callback',
    '/en/login',
    '/en/register',
    '/en/dashboard',
    '/en/checkout',
    '/en/payment-success',
    '/en/payment-callback'
])

// dynamicResolverPrefixes kept for reference only (no longer used in shouldIndex)
// const dynamicResolverPrefixes = ['/hizmetlerimiz/', '/sektorel-hizmetler/', '/en/services/', '/en/sectoral-services/']

function normalizePath(pathname: string) {
    const [cleanPath] = pathname.split(/[?#]/)
    const normalized = cleanPath.replace(/\/+$/, '')
    return normalized || '/'
}

function ensureLink(rel: string, hreflang?: string) {
    const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`
    let element = document.head.querySelector(selector) as HTMLLinkElement | null
    if (!element) {
        element = document.createElement('link')
        element.setAttribute('rel', rel)
        if (hreflang) element.setAttribute('hreflang', hreflang)
        document.head.appendChild(element)
    }
    return element
}

function ensureMeta(name: string, attribute: 'name' | 'property' = 'name') {
    const selector = `meta[${attribute}="${name}"]`
    let element = document.head.querySelector(selector) as HTMLMetaElement | null
    if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
    }
    return element
}

function ensureJsonLd() {
    const id = 'seo-json-ld'
    let element = document.getElementById(id) as HTMLScriptElement | null
    if (!element) {
        element = document.createElement('script')
        element.type = 'application/ld+json'
        element.id = id
        document.head.appendChild(element)
    }
    return element
}

function buildSchema({
    entry,
    kind,
    title,
    description,
    canonicalUrl,
    inLanguage
}: {
    entry?: SeoEntry
    kind: SeoKind
    title: string
    description: string
    canonicalUrl: string
    inLanguage: string
}) {
    const organization = {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/fast-logo-big.svg`,
        // AI/arama motorlarının markayı doğru entity olarak tanıması için gerçek sosyal profiller.
        sameAs: [
            'https://www.linkedin.com/company/khilon/',
            'https://www.instagram.com/khilonagency'
        ]
    }

    const website = {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ['tr-TR', 'en-US'],
        publisher: { '@id': `${SITE_URL}/#organization` }
    }

    const webpageBase = {
        '@type':
            kind === 'about'
                ? 'AboutPage'
                : kind === 'contact'
                    ? 'ContactPage'
                    : kind === 'collection'
                        ? 'CollectionPage'
                        : 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        inLanguage,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        // AI arama motorları (Google AI Overviews, Perplexity) "güncellik" sinyaline önem verir.
        // __BUILD_DATE__ vite.config.ts'te build anında sabitlenir (her deploy'da güncellenir).
        dateModified: __BUILD_DATE__
    }
    const breadcrumbList = {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: buildBreadcrumbItems(entry, canonicalUrl, inLanguage)
    }

    if (kind === 'service') {
        return [
            organization,
            website,
            webpageBase,
            breadcrumbList,
            {
                '@type': 'Service',
                name: title.replace(' | khilonfast', ''),
                description,
                url: canonicalUrl,
                provider: { '@id': `${SITE_URL}/#organization` },
                areaServed: 'TR'
            }
        ]
    }

    if (kind === 'product') {
        return [
            organization,
            website,
            webpageBase,
            breadcrumbList,
            {
                '@type': 'Product',
                name: title.replace(' | khilonfast', ''),
                description,
                url: canonicalUrl,
                brand: {
                    '@type': 'Brand',
                    name: SITE_NAME
                }
            }
        ]
    }

    if (kind === 'course') {
        return [
            organization,
            website,
            webpageBase,
            breadcrumbList,
            {
                '@type': 'Course',
                name: title.replace(' | khilonfast', ''),
                description,
                provider: { '@id': `${SITE_URL}/#organization` },
                url: canonicalUrl
            }
        ]
    }

    if (kind === 'howto') {
        const relatedFlow = setupFlows.find((flow) => canonicalUrl === `${SITE_URL}${flow.path}`)
        return [
            organization,
            website,
            webpageBase,
            breadcrumbList,
            {
                '@type': 'HowTo',
                name: title.replace(' | khilonfast', ''),
                description,
                url: canonicalUrl,
                publisher: { '@id': `${SITE_URL}/#organization` },
                ...(relatedFlow
                    ? {
                        step: relatedFlow.paths.flatMap((path, pathIndex) =>
                            path.steps.map((step, stepIndex) => ({
                                '@type': 'HowToStep',
                                position: pathIndex * 10 + stepIndex + 1,
                                name: step.title,
                                text: step.description
                            }))
                        )
                    }
                    : {})
            }
        ]
    }

    if (kind === 'collection') {
        return [
            organization,
            website,
            webpageBase,
            breadcrumbList,
            {
                '@type': 'ItemList',
                '@id': `${canonicalUrl}#itemlist`,
                itemListElement: buildCollectionItems(entry, inLanguage)
            }
        ]
    }

    return [organization, website, webpageBase, breadcrumbList]
}

function localizedSectionLabel(section: SeoSection | undefined, inLanguage: string) {
    const isEnglish = inLanguage === 'en-US'
    if (section === 'services') return isEnglish ? 'Services' : 'Hizmetlerimiz'
    if (section === 'sectoral') return isEnglish ? 'Industries' : 'Sektörel Hizmetler'
    if (section === 'trainings') return isEnglish ? 'Programs' : 'Egitimler'
    if (section === 'products') return isEnglish ? 'Products' : 'Urunler'
    if (section === 'flows') return isEnglish ? 'Setup Flows' : 'Kurulum Akislari'
    if (section === 'company') return isEnglish ? 'Company' : 'Kurumsal'
    return isEnglish ? 'Pages' : 'Sayfalar'
}

function localizedSectionPath(section: SeoSection | undefined, inLanguage: string) {
    const isEnglish = inLanguage === 'en-US'
    if (section === 'services') return isEnglish ? `/en/${enSlugs.home || ''}#services`.replace(/\/+#/, '/#') : '/#services'
    if (section === 'sectoral') return isEnglish ? `/en/${enSlugs.home || ''}#sectoral-services`.replace(/\/+#/, '/#') : '/#sectoral-services'
    if (section === 'trainings') return isEnglish ? `/en/${enSlugs.trainings}` : `/${trSlugs.trainings}`
    if (section === 'products') return isEnglish ? `/en/${enSlugs.maestro}` : `/${trSlugs.maestro}`
    if (section === 'company') return isEnglish ? '/en/about' : `/${trSlugs.about}`
    return '/'
}

function buildBreadcrumbItems(entry: SeoEntry | undefined, canonicalUrl: string, inLanguage: string) {
    const items = [
        {
            '@type': 'ListItem',
            position: 1,
            name: SITE_NAME,
            item: SITE_URL
        }
    ]

    const shouldAddSectionCrumb =
        entry?.section &&
        entry.tr !== '/' &&
        !((entry.key === 'trainings' && entry.section === 'trainings') || (entry.key === 'home'))

    if (shouldAddSectionCrumb) {
        items.push({
            '@type': 'ListItem',
            position: 2,
            name: localizedSectionLabel(entry.section, inLanguage),
            item: `${SITE_URL}${localizedSectionPath(entry.section, inLanguage).replace(/\/+$/, '') || '/'}`
        })
    }

    if (entry?.tr !== '/') {
        items.push({
            '@type': 'ListItem',
            position: items.length + 1,
            name: entry ? entry.title[inLanguage === 'en-US' ? 'en' : 'tr'].replace(' | khilonfast', '') : SITE_NAME,
            item: canonicalUrl
        })
    }

    return items
}

function buildCollectionItems(entry: SeoEntry | undefined, inLanguage: string) {
    if (entry?.key !== 'trainings') return []

    const isEnglish = inLanguage === 'en-US'
    const menu = isEnglish ? enTrainingMenu : trTrainingMenu
    const localeSlugs = isEnglish ? enSlugs : trSlugs
    const routeKeys = [
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
    ] as const
    const menuKeys = ['growth', 'payment', 'b2b', 'fintech', 'tech', 'manufacturing', 'energy', 'design', 'fleet', 'food'] as const

    return routeKeys.map((key, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}${isEnglish ? `/en/${localeSlugs[key]}` : `/${localeSlugs[key]}`}`,
        name: menu[menuKeys[index]]?.title || key
    }))
}

function extractFaqSchema(canonicalUrl: string) {
    const faqItems = Array.from(document.querySelectorAll('.faq-item'))
        .map((item) => {
            const question = item.querySelector('.faq-question span')?.textContent?.trim()
            const answer = item.querySelector('.faq-answer p')?.textContent?.trim()
            return question && answer
                ? {
                    '@type': 'Question',
                    name: question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: answer
                    }
                }
                : null
        })
        .filter(Boolean)

    if (!faqItems.length) return []

    return [
        {
            '@type': 'FAQPage',
            '@id': `${canonicalUrl}#faq`,
            mainEntity: faqItems
        }
    ]
}

function extractVideoSchema(canonicalUrl: string, title: string, description: string) {
    const seen = new Set<string>()
    const videos = Array.from(document.querySelectorAll('iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo.com/video"]'))
        .map((iframe, index) => {
            const embedUrl = (iframe.getAttribute('src') || '').trim()
            if (!embedUrl || seen.has(embedUrl)) return null
            seen.add(embedUrl)
            const videoTitle = iframe.getAttribute('title')?.trim() || `${title.replace(' | khilonfast', '')} Video ${index + 1}`

            return {
                '@type': 'VideoObject',
                '@id': `${canonicalUrl}#video-${index + 1}`,
                name: videoTitle,
                description,
                embedUrl,
                url: canonicalUrl,
                thumbnailUrl: DEFAULT_IMAGE,
                publisher: { '@id': `${SITE_URL}/#organization` }
            }
        })
        .filter(Boolean)

    return videos
}

export default function SeoHead() {
    const location = useLocation()

    const seoState = useMemo(() => {
        const normalizedPath = normalizePath(location.pathname)
        const resolvedPath = aliasMap[normalizedPath] || normalizedPath
        const isAliasPath = normalizedPath !== resolvedPath
        const matchedEntry = pageEntries.find((item) => item.tr === resolvedPath || item.en === resolvedPath)
        const isEnglish = resolvedPath === '/en' || resolvedPath.startsWith('/en/')
        const canonicalPath = matchedEntry
            ? isEnglish
                ? matchedEntry.en || resolvedPath
                : matchedEntry.tr || resolvedPath
            : resolvedPath
        const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '' : canonicalPath}`
        const alternateTr = matchedEntry ? `${SITE_URL}${matchedEntry.tr === '/' ? '' : matchedEntry.tr}` : canonicalUrl
        const alternateEn = matchedEntry?.en ? `${SITE_URL}${matchedEntry.en}` : null
        const isConsultantDetail = resolvedPath.startsWith('/danismanlar/') || resolvedPath.startsWith('/en/consultants/')
        const isAdmin = resolvedPath.startsWith('/admin')
        const isTrainingContent = resolvedPath.startsWith('/egitimllerim/') || resolvedPath.startsWith('/en/egitimllerim/')
        // Bilinen utility/dynamic path prefix'leri için generic title fallback (kullanıcıya
        // asla "Sayfa Bulunamadı" gösterme — sadece gerçek 404 durumda RouteNotFound
        // component'i kendi başlığını set eder).
        const title = matchedEntry
            ? matchedEntry.title[isEnglish ? 'en' : 'tr']
            : isAdmin
                ? 'Admin Panel | khilonfast'
                : isConsultantDetail
                    ? isEnglish ? 'Consultant Profile | khilonfast' : 'Danışman Profili | khilonfast'
                    : isTrainingContent
                        ? isEnglish ? 'Training | khilonfast' : 'Eğitim İçeriği | khilonfast'
                        : isEnglish
                            ? 'khilonfast'
                            : 'khilonfast'
        const description = matchedEntry
            ? matchedEntry.description[isEnglish ? 'en' : 'tr']
            : isEnglish
                ? 'Khilonfast — Growth-focused marketing platform.'
                : 'Khilonfast — Büyüme odaklı pazarlama platformu.'
        const shouldIndex =
            Boolean(matchedEntry) &&
            !isAliasPath &&
            !resolvedPath.startsWith('/admin') &&
            !noIndexPaths.has(resolvedPath)
        return {
            title,
            description,
            canonicalUrl,
            alternateTr,
            alternateEn,
            locale: isEnglish ? 'en_US' : 'tr_TR',
            inLanguage: isEnglish ? 'en-US' : 'tr-TR',
            alternateLocale: isEnglish ? 'tr_TR' : 'en_US',
            shouldIndex,
            kind: matchedEntry?.kind || 'website',
            entry: matchedEntry
        }
    }, [location.pathname])

    useEffect(() => {
        document.title = seoState.title

        ensureLink('canonical').href = seoState.canonicalUrl

        // SEO audit fix: noindex sayfalardan hreflang alternate link'i KALDIR
        // (Aksi takdirde "Hreflang: Noindex Return Links" sorunu üretir — Screaming Frog)
        if (seoState.shouldIndex) {
            ensureLink('alternate', 'tr').href = seoState.alternateTr
            if (seoState.alternateEn) {
                ensureLink('alternate', 'en').href = seoState.alternateEn
            } else {
                document.head.querySelector('link[rel="alternate"][hreflang="en"]')?.remove()
            }
            ensureLink('alternate', 'x-default').href = seoState.alternateTr
        } else {
            // noindex sayfa → tüm hreflang'ları kaldır
            document.head.querySelector('link[rel="alternate"][hreflang="tr"]')?.remove()
            document.head.querySelector('link[rel="alternate"][hreflang="en"]')?.remove()
            document.head.querySelector('link[rel="alternate"][hreflang="x-default"]')?.remove()
        }

        ensureMeta('robots').content = seoState.shouldIndex
            ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
            : 'noindex, nofollow, noarchive'

        ensureMeta('description').content = seoState.description
        ensureMeta('og:title', 'property').content = seoState.title
        ensureMeta('og:description', 'property').content = seoState.description
        ensureMeta('og:type', 'property').content =
            seoState.kind === 'product' ? 'product' : 'website'
        ensureMeta('og:url', 'property').content = seoState.canonicalUrl
        ensureMeta('og:site_name', 'property').content = SITE_NAME
        ensureMeta('og:locale', 'property').content = seoState.locale
        ensureMeta('og:locale:alternate', 'property').content = seoState.alternateLocale
        ensureMeta('og:image', 'property').content = DEFAULT_IMAGE
        ensureMeta('twitter:card').content = 'summary_large_image'
        ensureMeta('twitter:title').content = seoState.title
        ensureMeta('twitter:description').content = seoState.description
        ensureMeta('twitter:image').content = DEFAULT_IMAGE

        const writeJsonLd = () => {
            const baseGraph = buildSchema({
                entry: seoState.entry,
                kind: seoState.kind,
                title: seoState.title,
                description: seoState.description,
                canonicalUrl: seoState.canonicalUrl,
                inLanguage: seoState.inLanguage
            })
            const domFaqGraph = extractFaqSchema(seoState.canonicalUrl)
            const domVideoGraph = extractVideoSchema(seoState.canonicalUrl, seoState.title, seoState.description)

            ensureJsonLd().textContent = JSON.stringify(
                {
                    '@context': 'https://schema.org',
                    '@graph': [...baseGraph, ...domFaqGraph, ...domVideoGraph]
                },
                null,
                2
            )
        }

        // FAQ/Video şeması DOM'dan (.faq-item, iframe) okunuyor. Sayfa içeriği lazy-loaded
        // route chunk'ı içinde bu effect'ten BİR SÜRE SONRA (chunk indirme/parse süresi,
        // tek bir rAF'tan çok daha uzun olabilir) mount oluyor — hemen okursak FAQPage
        // şeması boş çıkar. Birkaç kademeli retry, DOM'un ne zaman hazır olduğundan
        // bağımsız olarak JSON-LD'yi tazeler; son çağrı en güncel DOM'u yakalar.
        // Tüm gecikmeler prerender'ın renderAfterTime (2000ms) penceresi içinde kalır;
        // canlı kullanıcıda görünmez (JSON-LD script'i sayfa görünümünü etkilemez).
        writeJsonLd()
        const retryTimers = [50, 200, 600, 1500].map((delay) => setTimeout(writeJsonLd, delay))

        if (import.meta.env.DEV && seoState.shouldIndex) {
            const h1Count = document.querySelectorAll('main h1').length
            if (h1Count !== 1) {
                console.warn('[seo] Expected exactly one <h1> on indexable page', {
                    pathname: location.pathname,
                    h1Count
                })
            }
        }

        return () => retryTimers.forEach(clearTimeout)
    }, [location.pathname, seoState])

    return null
}
