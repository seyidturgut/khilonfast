import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'
import { setupFlows } from '../data/setupFlows'

type LocaleValue = {
    tr: string
    en: string
}

type SeoKind = 'website' | 'about' | 'contact' | 'service' | 'product' | 'course' | 'howto' | 'collection'

type SeoEntry = {
    tr: string
    en?: string
    title: LocaleValue
    description: LocaleValue
    kind: SeoKind
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

const pageEntries: SeoEntry[] = [
    {
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
            tr: 'Hakkımızda | khilonfast',
            en: 'About | khilonfast'
        },
        description: {
            tr: trCommon.aboutPage.hero.description,
            en: enCommon.aboutPage.hero.description
        },
        kind: 'about' as const
    },
    {
        tr: `/${trSlugs.contact}`,
        en: `/en/${enSlugs.contact}`,
        title: {
            tr: 'İletişim | khilonfast',
            en: 'Contact | khilonfast'
        },
        description: {
            tr: trCommon.contact.hero.lead,
            en: enCommon.contact.hero.lead
        },
        kind: 'contact' as const
    },
    {
        tr: `/${trSlugs.howItWorks}`,
        en: `/en/${enSlugs.howItWorks}`,
        title: {
            tr: 'Nasıl Çalışır? | khilonfast',
            en: 'How It Works | khilonfast'
        },
        description: {
            tr: trCommon.howItWorksPage.hero.description,
            en: enCommon.howItWorksPage.hero.description
        },
        kind: 'howto' as const
    },
    {
        tr: `/${trSlugs.trainings}`,
        en: `/en/${enSlugs.trainings}`,
        title: {
            tr: 'Eğitimler | khilonfast',
            en: 'Trainings | khilonfast'
        },
        description: {
            tr: 'Büyüme odaklı pazarlama eğitimleri ile satış, değer önerisi, dönüşüm ve ölçümleme süreçlerini güçlendirin.',
            en: 'Strengthen sales, value proposition, conversion, and measurement with growth-focused marketing trainings.'
        },
        kind: 'collection' as const
    },
    {
        tr: `/${trSlugs.gtm}`,
        en: `/en/${enSlugs.gtm}`,
        title: composeTitle({
            tr: 'Go To Market Stratejisi ve Pazara Giriş Planlaması',
            en: 'Go-To-Market Strategy and Market Entry Planning'
        }),
        description: {
            tr: trCommon.serviceGTM.videoShowcase.description,
            en: enCommon.serviceGTM.seo.description
        },
        kind: 'service' as const
    },
    {
        tr: `/${trSlugs.contentStrategy}`,
        en: `/en/${enSlugs.contentStrategy}`,
        title: composeTitle({
            tr: 'İçerik Stratejisi ve İçerik Planlama Hizmetleri',
            en: 'Content Strategy and Editorial Planning Services'
        }),
        description: {
            tr: trServiceMenu.content.desc,
            en: enServiceMenu.content.desc
        },
        kind: 'service' as const
    },
    {
        tr: `/${trSlugs.idm}`,
        en: `/en/${enSlugs.idm}`,
        title: composeTitle({
            tr: 'Bütünleşik Dijital Pazarlama ve Büyüme Yönetimi',
            en: 'Integrated Digital Marketing and Growth Management'
        }),
        description: {
            tr: trCommon.serviceIDM.videoShowcase.description,
            en: enCommon.serviceIDM.videoShowcase.description
        },
        kind: 'service' as const
    },
    {
        tr: `/${trSlugs.googleAds}`,
        en: `/en/${enSlugs.googleAds}`,
        title: composeTitle({
            tr: 'Google Ads Yönetimi ve Performans Reklamcılığı',
            en: 'Google Ads Management and Performance Advertising'
        }),
        description: {
            tr: trServiceMenu.ads.desc,
            en: enServiceMenu.ads.desc
        },
        kind: 'service' as const
    },
    {
        tr: `/${trSlugs.socialAds}`,
        en: `/en/${enSlugs.socialAds}`,
        title: composeTitle({
            tr: 'Sosyal Medya Reklamcılığı ve Performans Kampanyaları',
            en: 'Social Media Advertising and Performance Campaigns'
        }),
        description: {
            tr: trServiceMenu.social.desc,
            en: enServiceMenu.social.desc
        },
        kind: 'service' as const
    },
    {
        tr: `/${trSlugs.seo}`,
        en: `/en/${enSlugs.seo}`,
        title: composeTitle({
            tr: 'SEO Yönetimi ve Organik Büyüme Hizmetleri',
            en: 'SEO Management and Organic Growth Services'
        }),
        description: {
            tr: trServiceMenu.seo.desc,
            en: enServiceMenu.seo.desc
        },
        kind: 'service' as const
    },
    {
        tr: `/${trSlugs.contentProduction}`,
        en: `/en/${enSlugs.contentProduction}`,
        title: composeTitle({
            tr: 'İçerik Üretimi ve Dönüşüm Odaklı İçerik Hizmetleri',
            en: 'Content Production and Conversion-Focused Content Services'
        }),
        description: {
            tr: trServiceMenu.production.desc,
            en: enServiceMenu.production.desc
        },
        kind: 'service' as const
    },
    {
        tr: `/${trSlugs.b2bEmail}`,
        en: `/en/${enSlugs.b2bEmail}`,
        title: composeTitle({
            tr: 'B2B Email Pazarlama ve Lead Nurturing',
            en: 'B2B Email Marketing and Lead Nurturing'
        }),
        description: {
            tr: trServiceMenu.email.desc,
            en: enServiceMenu.email.desc
        },
        kind: 'service' as const
    },
    ...([
        { key: 'sectoralB2B', menu: 'b2b' },
        { key: 'sectoralPayment', menu: 'payment' },
        { key: 'sectoralFood', menu: 'food' },
        { key: 'sectoralFintech', menu: 'fintech' },
        { key: 'sectoralTech', menu: 'tech' },
        { key: 'sectoralEnergy', menu: 'energy' },
        { key: 'sectoralDesign', menu: 'design' },
        { key: 'sectoralFleet', menu: 'fleet' },
        { key: 'sectoralManufacturing', menu: 'manufacturing' }
    ] as const).map(({ key, menu }) => ({
        tr: `/${trSlugs[key]}`,
        en: `/en/${enSlugs[key]}`,
        title: composeTitle({
            tr: trSectoralMenu[menu].title,
            en: enSectoralMenu[menu].title
        }),
        description: {
            tr: trSectoralMenu[menu].desc,
            en: enSectoralMenu[menu].desc
        },
        kind: 'service' as const
    })),
    ...([
        { key: 'trainingGrowth', menu: 'growth' },
        { key: 'trainingPayment', menu: 'payment' },
        { key: 'trainingB2B', menu: 'b2b' },
        { key: 'trainingFintech', menu: 'fintech' },
        { key: 'trainingTech', menu: 'tech' },
        { key: 'trainingManufacturing', menu: 'manufacturing' },
        { key: 'trainingEnergy', menu: 'energy' },
        { key: 'trainingDesign', menu: 'design' },
        { key: 'trainingFleet', menu: 'fleet' },
        { key: 'trainingFood', menu: 'food' }
    ] as const).map(({ key, menu }) => ({
        tr: `/${trSlugs[key]}`,
        en: `/en/${enSlugs[key]}`,
        title: composeTitle({
            tr: trTrainingMenu[menu]?.title || trainingSeoFallbacks[menu]?.tr,
            en: enTrainingMenu[menu]?.title || trainingSeoFallbacks[menu]?.en
        }),
        description: {
            tr: trTrainingMenu[menu]?.desc || trainingSeoFallbacks[menu]?.trDesc,
            en: enTrainingMenu[menu]?.desc || trainingSeoFallbacks[menu]?.enDesc
        },
        kind: 'course' as const
    })),
    {
        tr: `/${trSlugs.maestro}`,
        en: `/en/${enSlugs.maestro}`,
        title: composeTitle({
            tr: 'Maestro AI B2B Pazarlama Stratejisti',
            en: 'Maestro AI B2B Marketing Strategist'
        }),
        description: {
            tr: trProductMenu.maestro.desc,
            en: enProductMenu.maestro.desc
        },
        kind: 'product' as const
    },
    {
        tr: `/${trSlugs.eyeTracking}`,
        en: `/en/${enSlugs.eyeTracking}`,
        title: composeTitle({
            tr: 'Eye Tracking Reklam Analizi ve Kreatif Performans Ölçümü',
            en: 'Eye Tracking Ad Analysis and Creative Performance Measurement'
        }),
        description: {
            tr: trProductMenu.eyeTracking.desc,
            en: enProductMenu.eyeTracking.desc
        },
        kind: 'product' as const
    },
    ...setupFlows.map((flow) => ({
        tr: flow.path,
        title: composeTitle({
            tr: flow.title,
            en: flow.title
        }),
        description: {
            tr: flow.purpose,
            en: flow.purpose
        },
        kind: 'howto' as const
    }))
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
    '/en/urunler/eye-tracking-reklam-analizi': `/en/${enSlugs.eyeTracking}`
}

const noIndexPaths = new Set([
    '/giris',
    '/kayil-ol',
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

const dynamicResolverPrefixes = ['/hizmetlerimiz/', '/sektorel-hizmetler/', '/en/services/', '/en/sectoral-services/']

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
    kind,
    title,
    description,
    canonicalUrl,
    inLanguage
}: {
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
        logo: `${SITE_URL}/fast-logo-big.svg`
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
        '@type': kind === 'about' ? 'AboutPage' : kind === 'contact' ? 'ContactPage' : 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        inLanguage,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` }
    }

    if (kind === 'service') {
        return [
            organization,
            website,
            webpageBase,
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
        return [
            organization,
            website,
            webpageBase,
            {
                '@type': 'HowTo',
                name: title.replace(' | khilonfast', ''),
                description,
                url: canonicalUrl,
                publisher: { '@id': `${SITE_URL}/#organization` }
            }
        ]
    }

    return [organization, website, webpageBase]
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
        const isDynamicResolverPath = dynamicResolverPrefixes.some(
            (prefix) => normalizedPath.startsWith(prefix) && normalizedPath.split('/').length > prefix.split('/').length
        )
        const title = matchedEntry
            ? matchedEntry.title[isEnglish ? 'en' : 'tr']
            : isEnglish
                ? 'Page Not Found | khilonfast'
                : 'Sayfa Bulunamadı | khilonfast'
        const description = matchedEntry
            ? matchedEntry.description[isEnglish ? 'en' : 'tr']
            : isEnglish
                ? 'This page could not be matched to an indexable khilonfast page.'
                : 'Bu URL indekslenebilir bir khilonfast sayfasıyla eşleşmedi.'
        const shouldIndex =
            Boolean(matchedEntry) &&
            !isAliasPath &&
            !resolvedPath.startsWith('/admin') &&
            !noIndexPaths.has(resolvedPath) &&
            !isDynamicResolverPath
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
            kind: matchedEntry?.kind || 'website'
        }
    }, [location.pathname])

    useEffect(() => {
        document.title = seoState.title

        ensureLink('canonical').href = seoState.canonicalUrl
        ensureLink('alternate', 'tr').href = seoState.alternateTr

        if (seoState.alternateEn) {
            ensureLink('alternate', 'en').href = seoState.alternateEn
        } else {
            document.head.querySelector('link[rel="alternate"][hreflang="en"]')?.remove()
        }

        ensureLink('alternate', 'x-default').href = seoState.alternateTr

        ensureMeta('robots').content = seoState.shouldIndex
            ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
            : 'noindex, nofollow, noarchive'

        ensureMeta('description').content = seoState.description
        ensureMeta('og:title', 'property').content = seoState.title
        ensureMeta('og:description', 'property').content = seoState.description
        ensureMeta('og:type', 'property').content = 'website'
        ensureMeta('og:url', 'property').content = seoState.canonicalUrl
        ensureMeta('og:site_name', 'property').content = SITE_NAME
        ensureMeta('og:locale', 'property').content = seoState.locale
        ensureMeta('og:locale:alternate', 'property').content = seoState.alternateLocale
        ensureMeta('og:image', 'property').content = DEFAULT_IMAGE
        ensureMeta('twitter:card').content = 'summary_large_image'
        ensureMeta('twitter:title').content = seoState.title
        ensureMeta('twitter:description').content = seoState.description
        ensureMeta('twitter:image').content = DEFAULT_IMAGE

        ensureJsonLd().textContent = JSON.stringify(
            {
                '@context': 'https://schema.org',
                '@graph': buildSchema({
                    kind: seoState.kind,
                    title: seoState.title,
                    description: seoState.description,
                    canonicalUrl: seoState.canonicalUrl,
                    inLanguage: seoState.inLanguage
                })
            },
            null,
            2
        )
    }, [seoState])

    return null
}
