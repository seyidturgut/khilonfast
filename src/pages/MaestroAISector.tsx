import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import {
    HiStar,
    HiBolt,
    HiCpuChip,
    HiDocumentMagnifyingGlass,
    HiArrowsPointingIn,
    HiSparkles,
    HiAcademicCap,
    HiChartBar,
    HiCloudArrowUp,
    HiQueueList,
    HiCommandLine,
    HiUserGroup,
    HiRocketLaunch
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'
import { productsAPI } from '../services/api'
import { pickLocalizedPriceAndCurrency, formatLocalizedPrice } from '../utils/price'

/**
 * Frontend route'undaki sectorKey, DB'deki product_key ile birebir eşleşmiyor.
 * DB'de bazı sektörler kısaltılmış kaydedilmiş (örn. "odeme-sistemleri" → "odeme").
 * Burada route key'ini DB'deki kısa key'e çeviriyoruz.
 */
const sectorToDbKey: Record<string, string> = {
    'b2b': 'b2b',
    'odeme-sistemleri': 'odeme',
    'endustriyel-gida': 'gida',
    'fintech': 'fintech',
    'enerji': 'enerji',
    'ofis-tasarim': 'ofis',
    'filo-kiralama': 'filo',
    'teknoloji-yazilim': 'teknoloji',
    'uretim': 'uretim',
    'hediye-karti': 'hediye',
    'akaryakit': 'akaryakit'
};

interface MaestroAISectorProps {
    sectorKey: 'b2b' | 'odeme-sistemleri' | 'endustriyel-gida' | 'fintech' | 'enerji' | 'ofis-tasarim' | 'filo-kiralama' | 'teknoloji-yazilim' | 'uretim' | 'hediye-karti' | 'akaryakit'
}

export default function MaestroAISector({ sectorKey }: MaestroAISectorProps) {
    const { t, i18n } = useTranslation('common')
    const currentLang = useRouteLocale()
    const contactPath = getLocalizedPathByKey(currentLang, 'contact')
    const homePath = getLocalizedPathByKey(currentLang, 'home')
    const isEn = currentLang === 'en'

    // Backend ürünlerinden bu sektöre ait fiyatları çek (admin'de güncellenebilir)
    const dbSectorKey = sectorToDbKey[sectorKey] || sectorKey
    const kredliKey = `maestro-${dbSectorKey}-kredili`
    const sinirsizKey = `maestro-${dbSectorKey}-sinirsiz`
    type RawProduct = { price?: number | string; currency?: string; display_price_try?: number; display_price_usd?: number }
    const [productPrices, setProductPrices] = useState<Record<string, RawProduct>>({})

    useEffect(() => {
        let cancelled = false
        Promise.all([
            productsAPI.getByKey(kredliKey).catch(() => null),
            productsAPI.getByKey(sinirsizKey).catch(() => null)
        ]).then(([kredliRes, sinirsizRes]) => {
            if (cancelled) return
            const map: Record<string, RawProduct> = {}
            const kredli = kredliRes?.data?.product || kredliRes?.data
            const sinirsiz = sinirsizRes?.data?.product || sinirsizRes?.data
            if (kredli?.price !== undefined) map[kredliKey] = kredli
            if (sinirsiz?.price !== undefined) map[sinirsizKey] = sinirsiz
            setProductPrices(map)
        })
        return () => { cancelled = true }
    }, [kredliKey, sinirsizKey])

    const localePicker = (raw?: RawProduct): string => {
        if (!raw) return '—'
        const { price, currency } = pickLocalizedPriceAndCurrency(raw, isEn ? 'en' : 'tr')
        return formatLocalizedPrice(price, currency, isEn ? 'en' : 'tr')
    }
    const kredliPriceLabel = localePicker(productPrices[kredliKey])
    const sinirsizPriceLabel = localePicker(productPrices[sinirsizKey])

    const sk = `maestroAISectors.${sectorKey}`
    const sectorLabel = t(`${sk}.sectorLabel`)
    const heroTitle = currentLang === 'en'
        ? `Maestro AI for ${sectorLabel}`
        : `Maestro AI — ${sectorLabel}`
    const sectorText = (suffix: string, fallback: string) => (
        i18n.exists(`${sk}.${suffix}`)
            ? t(`${sk}.${suffix}`)
            : fallback
    )
    const sectorObjects = <T,>(suffix: string, fallback: T) => (
        i18n.exists(`${sk}.${suffix}`)
            ? (t(`${sk}.${suffix}`, { returnObjects: true }) as T)
            : fallback
    )
    const videoTitle = sectorText('videoShowcase.title', t('maestroAI.videoShowcase.title'))
    const [videoTitleBefore, videoTitleAfter = ''] = videoTitle.split('Maestro AI')
    const faqs = sectorObjects<any[]>('faqs', t('maestroAI.faqs', { returnObjects: true }) as any[])

    const maestroConfig = {
        hero: {
            title: heroTitle,
            subtitle: '',
            description: sectorText('hero.description', t('maestroAI.hero.description')),
            buttonText: t('pricing.buyNow'),
            buttonLink: '#pricing',
            image: '/img/maestro-ai-hero.png',
            videoUrl: '',
            hideBadge: true,
            badgeText: t('maestroAI.hero.badge'),
            badgeIcon: <HiBolt />,
            themeColor: '#f9fafb'
        },
        breadcrumbs: [
            { label: t('header.home'), path: homePath },
            { label: t('header.products'), path: '#' },
            { label: 'Maestro AI' },
            { label: sectorLabel }
        ],
        videoShowcase: {
            tag: sectorText('videoShowcase.tag', sectorText('videoTag', t('maestroAI.videoShowcase.tag'))),
            title: (
                <>
                    {videoTitleBefore}
                    <span className="highlight"> Maestro AI</span>
                    {videoTitleAfter}
                </>
            ),
            description: sectorText('videoShowcase.description', t('maestroAI.videoShowcase.description')),
            videoUrl: ''
        },
        featuresSection: {
            tag: t('maestroAI.features.tag'),
            title: t('maestroAI.features.title'),
            description: sectorText('features.description', sectorText('featuresDescription', t('maestroAI.features.description'))),
            features: [
                {
                    title: sectorText('features.items.disciplines.title', t('maestroAI.features.items.disciplines.title')),
                    description: sectorText('features.items.disciplines.desc', t('maestroAI.features.items.disciplines.desc')),
                    icon: <HiArrowsPointingIn />
                },
                {
                    title: sectorText('features.items.speed.title', t('maestroAI.features.items.speed.title')),
                    description: sectorText('features.items.speed.desc', t('maestroAI.features.items.speed.desc')),
                    icon: <HiBolt />
                },
                {
                    title: sectorText('features.items.strategist.title', t('maestroAI.features.items.strategist.title')),
                    description: sectorText('features.items.strategist.desc', sectorText('strategistDesc', t('maestroAI.features.items.strategist.desc'))),
                    icon: <HiAcademicCap />
                },
                {
                    title: sectorText('features.items.results.title', t('maestroAI.features.items.results.title')),
                    description: sectorText('features.items.results.desc', t('maestroAI.features.items.results.desc')),
                    icon: <HiChartBar />
                },
                {
                    title: sectorText('features.items.memory.title', t('maestroAI.features.items.memory.title')),
                    description: sectorText('features.items.memory.desc', t('maestroAI.features.items.memory.desc')),
                    icon: <HiCpuChip />
                },
                {
                    title: sectorText('features.items.guidance.title', t('maestroAI.features.items.guidance.title')),
                    description: sectorText('features.items.guidance.desc', t('maestroAI.features.items.guidance.desc')),
                    icon: <HiSparkles />
                },
                {
                    title: sectorText('features.items.analysis.title', t('maestroAI.features.items.analysis.title')),
                    description: sectorText('features.items.analysis.desc', t('maestroAI.features.items.analysis.desc')),
                    icon: <HiDocumentMagnifyingGlass />
                },
                {
                    title: sectorText('features.items.learning.title', t('maestroAI.features.items.learning.title')),
                    description: sectorText('features.items.learning.desc', t('maestroAI.features.items.learning.desc')),
                    icon: <HiStar />
                }
            ]
        },
        processSection: {
            tag: t('maestroAI.process.tag'),
            title: t('maestroAI.process.title'),
            description: sectorText('process.description', sectorText('processDescription', t('maestroAI.process.description'))),
            steps: [
                {
                    stepNumber: 1,
                    title: sectorText('process.steps.question.title', t('maestroAI.process.steps.question.title')),
                    description: sectorText('process.steps.question.desc', t('maestroAI.process.steps.question.desc')),
                    icon: <HiCloudArrowUp />
                },
                {
                    stepNumber: 2,
                    title: sectorText('process.steps.analysis.title', t('maestroAI.process.steps.analysis.title')),
                    description: sectorText('process.steps.analysis.desc', t('maestroAI.process.steps.analysis.desc')),
                    icon: <HiQueueList />
                },
                {
                    stepNumber: 3,
                    title: sectorText('process.steps.suggestion.title', t('maestroAI.process.steps.suggestion.title')),
                    description: sectorText('process.steps.suggestion.desc', t('maestroAI.process.steps.suggestion.desc')),
                    icon: <HiSparkles />
                },
                {
                    stepNumber: 4,
                    title: sectorText('process.steps.experience.title', t('maestroAI.process.steps.experience.title')),
                    description: sectorText('process.steps.experience.desc', t('maestroAI.process.steps.experience.desc')),
                    icon: <HiCommandLine />
                }
            ]
        },
        pricingSection: {
            tag: t('maestroAI.pricing.tag'),
            title: t('maestroAI.pricing.title'),
            description: t('maestroAI.pricing.description'),
            packages: [
                {
                    id: `kredili-maestro-${dbSectorKey}`,
                    productKey: `maestro-${dbSectorKey}-kredili`,
                    name: t('maestroAI.pricing.plans.kredili.name'),
                    price: kredliPriceLabel,
                    period: t('pricing.monthly'),
                    description: t('maestroAI.pricing.plans.kredili.desc'),
                    icon: <HiChartBar />,
                    isPopular: true,
                    details: [
                        {
                            title: t('maestroAI.pricing.plans.kredili.for.title'),
                            description: t('maestroAI.pricing.plans.kredili.for.desc'),
                            icon: <HiUserGroup />
                        },
                        {
                            title: t('maestroAI.pricing.plans.kredili.why.title'),
                            description: t('maestroAI.pricing.plans.kredili.why.desc'),
                            icon: <HiRocketLaunch />
                        }
                    ],
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    buttonLink: contactPath
                },
                {
                    id: `sinirsiz-maestro-${dbSectorKey}`,
                    productKey: `maestro-${dbSectorKey}-sinirsiz`,
                    name: t('maestroAI.pricing.plans.growth.name'),
                    price: sinirsizPriceLabel,
                    period: t('pricing.monthly'),
                    description: t('maestroAI.pricing.plans.growth.desc'),
                    icon: <HiSparkles />,
                    isPremium: true,
                    details: [
                        {
                            title: t('maestroAI.pricing.plans.growth.for.title'),
                            description: t('maestroAI.pricing.plans.growth.for.desc'),
                            icon: <HiUserGroup />
                        },
                        {
                            title: t('maestroAI.pricing.plans.growth.why.title'),
                            description: t('maestroAI.pricing.plans.growth.why.desc'),
                            icon: <HiRocketLaunch />
                        }
                    ],
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    buttonLink: contactPath
                }
            ]
        },
        testimonial: {
            quote: sectorText('testimonial.quote', t('maestroAI.testimonial.quote')),
            author: sectorText('testimonial.author', t('maestroAI.testimonial.author')),
            role: sectorText('testimonial.role', t('maestroAI.testimonial.role'))
        },
        faqs
    }

    return <ServicePageTemplate {...maestroConfig} />
}
