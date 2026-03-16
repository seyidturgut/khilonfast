import { useTranslation } from 'react-i18next'
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

interface MaestroAISectorProps {
    sectorKey: 'b2b' | 'odeme-sistemleri' | 'endustriyel-gida' | 'fintech' | 'enerji' | 'ofis-tasarim' | 'filo-kiralama'
}

export default function MaestroAISector({ sectorKey }: MaestroAISectorProps) {
    const { t } = useTranslation('common')
    const currentLang = useRouteLocale()
    const contactPath = getLocalizedPathByKey(currentLang, 'contact')
    const homePath = getLocalizedPathByKey(currentLang, 'home')

    const sk = `maestroAISectors.${sectorKey}`

    const maestroConfig = {
        hero: {
            title: t('maestroAI.hero.title'),
            subtitle: '',
            description: t('maestroAI.hero.description'),
            buttonText: t('pricing.buyNow'),
            buttonLink: '#pricing',
            image: '/img/maestro-ai-hero.png',
            videoUrl: 'https://www.youtube.com/embed/fiHpDDF440M',
            hideBadge: true,
            badgeText: t('maestroAI.hero.badge'),
            badgeIcon: <HiBolt />,
            themeColor: '#f9fafb'
        },
        breadcrumbs: [
            { label: t('header.home'), path: homePath },
            { label: t('header.products'), path: '#' },
            { label: 'Maestro AI' },
            { label: t(`${sk}.sectorLabel`) }
        ],
        videoShowcase: {
            tag: t(`${sk}.videoTag`),
            title: (
                <>
                    {t('maestroAI.videoShowcase.title').split('Maestro AI')[0]}
                    <span className="highlight"> Maestro AI</span>
                    {t('maestroAI.videoShowcase.title').split('Maestro AI')[1]}
                </>
            ),
            description: t('maestroAI.videoShowcase.description'),
            videoUrl: 'https://www.youtube.com/embed/fiHpDDF440M'
        },
        featuresSection: {
            tag: t('maestroAI.features.tag'),
            title: t('maestroAI.features.title'),
            description: t(`${sk}.featuresDescription`),
            features: [
                {
                    title: t('maestroAI.features.items.disciplines.title'),
                    description: t('maestroAI.features.items.disciplines.desc'),
                    icon: <HiArrowsPointingIn />
                },
                {
                    title: t('maestroAI.features.items.speed.title'),
                    description: t('maestroAI.features.items.speed.desc'),
                    icon: <HiBolt />
                },
                {
                    title: t('maestroAI.features.items.strategist.title'),
                    description: t(`${sk}.strategistDesc`),
                    icon: <HiAcademicCap />
                },
                {
                    title: t('maestroAI.features.items.results.title'),
                    description: t('maestroAI.features.items.results.desc'),
                    icon: <HiChartBar />
                },
                {
                    title: t('maestroAI.features.items.memory.title'),
                    description: t('maestroAI.features.items.memory.desc'),
                    icon: <HiCpuChip />
                },
                {
                    title: t('maestroAI.features.items.guidance.title'),
                    description: t('maestroAI.features.items.guidance.desc'),
                    icon: <HiSparkles />
                },
                {
                    title: t('maestroAI.features.items.analysis.title'),
                    description: t('maestroAI.features.items.analysis.desc'),
                    icon: <HiDocumentMagnifyingGlass />
                },
                {
                    title: t('maestroAI.features.items.learning.title'),
                    description: t('maestroAI.features.items.learning.desc'),
                    icon: <HiStar />
                }
            ]
        },
        processSection: {
            tag: t('maestroAI.process.tag'),
            title: t('maestroAI.process.title'),
            description: t(`${sk}.processDescription`),
            steps: [
                {
                    stepNumber: 1,
                    title: t('maestroAI.process.steps.question.title'),
                    description: t('maestroAI.process.steps.question.desc'),
                    icon: <HiCloudArrowUp />
                },
                {
                    stepNumber: 2,
                    title: t('maestroAI.process.steps.analysis.title'),
                    description: t('maestroAI.process.steps.analysis.desc'),
                    icon: <HiQueueList />
                },
                {
                    stepNumber: 3,
                    title: t('maestroAI.process.steps.suggestion.title'),
                    description: t('maestroAI.process.steps.suggestion.desc'),
                    icon: <HiSparkles />
                },
                {
                    stepNumber: 4,
                    title: t('maestroAI.process.steps.experience.title'),
                    description: t('maestroAI.process.steps.experience.desc'),
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
                    id: `kredili-maestro-${sectorKey}`,
                    productKey: `maestro-${sectorKey}-kredili`,
                    name: t('maestroAI.pricing.plans.kredili.name'),
                    price: '1.200TL',
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
                    id: `sinirsiz-maestro-${sectorKey}`,
                    productKey: `maestro-${sectorKey}-sinirsiz`,
                    name: t('maestroAI.pricing.plans.growth.name'),
                    price: '2.000TL',
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
            quote: t('maestroAI.testimonial.quote'),
            author: t('maestroAI.testimonial.author'),
            role: t('maestroAI.testimonial.role')
        },
        faqs: t('maestroAI.faqs', { returnObjects: true }) as any
    }

    return <ServicePageTemplate {...maestroConfig} />
}
