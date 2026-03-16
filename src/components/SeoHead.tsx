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
            tr: 'Hakkımızda | khilonfast',
            en: 'About | khilonfast'
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
            tr: 'İletişim | khilonfast',
            en: 'Contact | khilonfast'
        },
        description: {
            tr: trCommon.contact.hero.lead,
            en: enCommon.contact.hero.lead
        },
        kind: 'contact' as const,
        section: 'company'
    },
    {
        key: 'howItWorks',
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
        kind: 'howto' as const,
        section: 'company'
    },
    {
        key: 'trainings',
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
        kind: 'collection' as const,
        section: 'trainings'
    },
    {
        key: 'gtm',
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
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'contentStrategy',
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
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'idm',
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
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'googleAds',
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
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'socialAds',
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
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'seo',
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
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'contentProduction',
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
        kind: 'service' as const,
        section: 'services' as const
    },
    {
        key: 'b2bEmail',
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
        kind: 'service' as const,
        section: 'services' as const
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
        key,
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
        kind: 'service' as const,
        section: 'sectoral' as const
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
        key,
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
        kind: 'course' as const,
        section: 'trainings' as const
    })),
    {
        key: 'maestro',
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
        kind: 'product' as const,
        section: 'products' as const
    },
    {
        key: 'eyeTracking',
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
        kind: 'product' as const,
        section: 'products' as const
    },
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
        about: { '@id': `${SITE_URL}/#organization` }
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
    if (section === 'sectoral') return isEnglish ? 'Sectoral Services' : 'Sektörel Hizmetler'
    if (section === 'trainings') return isEnglish ? 'Trainings' : 'Egitimler'
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
            kind: matchedEntry?.kind || 'website',
            entry: matchedEntry
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

        if (import.meta.env.DEV && seoState.shouldIndex) {
            const h1Count = document.querySelectorAll('main h1').length
            if (h1Count !== 1) {
                console.warn('[seo] Expected exactly one <h1> on indexable page', {
                    pathname: location.pathname,
                    h1Count
                })
            }
        }
    }, [location.pathname, seoState])

    return null
}
