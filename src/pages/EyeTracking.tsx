import { useTranslation } from 'react-i18next'
import {
    HiBolt,
    HiChartBar,
    HiCloudArrowUp,
    HiSparkles,
    HiArrowTrendingUp,
    HiOutlineEye,
    HiOutlineLightBulb,
    HiOutlineAcademicCap,
    HiClock,
    HiMegaphone,
    HiUsers,
    HiRocketLaunch,
    HiBriefcase
} from 'react-icons/hi2'
import ServicePageTemplate, { ServicePageProps } from './templates/ServicePageTemplate'
import { useRouteLocale } from '../utils/locale'

export default function EyeTracking() {
    const { t } = useTranslation('common')
    const isEn = useRouteLocale() === 'en'

    const eyeTrackingConfig: ServicePageProps = {
        hero: {
            title: t('eyeTracking.hero.title'),
            subtitle: '',
            description: t('eyeTracking.hero.description'),
            buttonText: t('pricing.buyNow'),
            buttonLink: '#pricing',
            image: '/img/eye-tracking-hero.png',
            videoUrl: 'https://www.youtube.com/embed/fiHpDDF440M?autoplay=1&mute=1&playsinline=1&rel=0',
            hideBadge: true,
            badgeText: t('eyeTracking.hero.badge'),
            badgeIcon: <HiBolt />,
            themeColor: '#f9fafb'
        },
        breadcrumbs: [
            { label: t('header.home'), path: '/' },
            { label: t('header.products'), path: '#' },
            { label: t('eyeTracking.hero.title') }
        ],
        videoShowcase: {
            tag: t('eyeTracking.videoShowcase.tag'),
            title: (
                <>
                    {t('eyeTracking.videoShowcase.title').split('AI ve Eye Tracking')[0]}
                    <span className="highlight"> AI ve Eye Tracking</span>
                    {t('eyeTracking.videoShowcase.title').split('AI ve Eye Tracking')[1]}
                </>
            ),
            description: t('eyeTracking.videoShowcase.description'),
            videoUrl: 'https://player.vimeo.com/video/1131181115'
        },
        approachSection: {
            tag: t('eyeTracking.approach.tag'),
            title: t('eyeTracking.approach.title'),
            description: t('eyeTracking.approach.description'),
            items: [
                {
                    title: t('eyeTracking.approach.items.roi.title'),
                    subtitle: t('eyeTracking.approach.items.roi.subtitle'),
                    description: t('eyeTracking.approach.items.roi.desc'),
                    icon: <HiChartBar />
                },
                {
                    title: t('eyeTracking.approach.items.creative.title'),
                    subtitle: t('eyeTracking.approach.items.creative.subtitle'),
                    description: t('eyeTracking.approach.items.creative.desc'),
                    icon: <HiMegaphone />
                },
                {
                    title: t('eyeTracking.approach.items.tests.title'),
                    subtitle: t('eyeTracking.approach.items.tests.subtitle'),
                    description: t('eyeTracking.approach.items.tests.desc'),
                    icon: <HiClock />
                },
                {
                    title: t('eyeTracking.approach.items.cmo.title'),
                    subtitle: t('eyeTracking.approach.items.cmo.subtitle'),
                    description: t('eyeTracking.approach.items.cmo.desc'),
                    icon: <HiBriefcase />
                },
                {
                    title: t('eyeTracking.approach.items.growth.title'),
                    subtitle: t('eyeTracking.approach.items.growth.subtitle'),
                    description: t('eyeTracking.approach.items.growth.desc'),
                    icon: <HiRocketLaunch />
                },
                {
                    title: t('eyeTracking.approach.items.ceo.title'),
                    subtitle: t('eyeTracking.approach.items.ceo.subtitle'),
                    description: t('eyeTracking.approach.items.ceo.desc'),
                    icon: <HiUsers />
                }
            ]
        },
        featuresSection: {
            tag: t('eyeTracking.pricing.tag'),
            title: t('eyeTracking.hero.title'),
            description: t('eyeTracking.hero.description'),
            features: [
                {
                    title: t('eyeTracking.features.focus.title'),
                    description: t('eyeTracking.features.focus.desc'),
                    icon: <HiOutlineEye />
                },
                {
                    title: t('eyeTracking.features.cognitive.title'),
                    description: t('eyeTracking.features.cognitive.desc'),
                    icon: <HiOutlineLightBulb />
                },
                {
                    title: t('eyeTracking.features.engagement.title'),
                    description: t('eyeTracking.features.engagement.desc'),
                    icon: <HiSparkles />
                },
                {
                    title: t('eyeTracking.features.memory.title'),
                    description: t('eyeTracking.features.memory.desc'),
                    icon: <HiOutlineAcademicCap />
                }
            ]
        },
        processSection: {
            tag: t('eyeTracking.process.tag'),
            title: t('eyeTracking.process.title'),
            description: t('eyeTracking.process.description'),
            steps: [
                {
                    stepNumber: 1,
                    title: t('eyeTracking.process.steps.upload.title'),
                    description: t('eyeTracking.process.steps.upload.desc'),
                    icon: <HiCloudArrowUp />
                },
                {
                    stepNumber: 2,
                    title: t('eyeTracking.process.steps.ai.title'),
                    description: t('eyeTracking.process.steps.ai.desc'),
                    icon: <HiBolt />
                },
                {
                    stepNumber: 3,
                    title: t('eyeTracking.process.steps.result.title'),
                    description: t('eyeTracking.process.steps.result.desc'),
                    icon: <HiChartBar />
                }
            ]
        },
        authorizationSection: {
            title: t('eyeTracking.authorization.title'),
            description: t('eyeTracking.authorization.description'),
            cards: [
                {
                    title: t('eyeTracking.authorization.card.title'),
                    description: t('eyeTracking.authorization.card.desc'),
                    highlightText: t('eyeTracking.authorization.card.highlight'),
                    buttonText: t('eyeTracking.authorization.card.button'),
                    buttonLink: '/Gorsel_Reklam_Analiz_raporu.pdf',
                    theme: 'light'
                }
            ]
        },
        pricingSection: {
            tag: t('eyeTracking.pricing.tag'),
            title: t('eyeTracking.pricing.title'),
            description: t('eyeTracking.pricing.description'),
            packages: [
                {
                    id: 'starter',
                    productKey: 'eye-starter',
                    name: 'Starter',
                    price: '1.000TL',
                    period: t('pricing.monthly'),
                    description: isEn
                        ? 'An ideal starting point for single-creative analysis.'
                        : 'Tekli gorsel analizi icin ideal baslangic.',
                    icon: <HiBolt />,
                    features: [
                        isEn ? '1 Creative Analysis' : '1 Gorsel Analizi',
                        isEn ? 'Detailed Score Report' : 'Detayli Skor Raporu',
                        isEn ? 'Heatmap View' : 'Heatmap Gorunumu',
                        isEn ? 'Baseline Optimization Recommendations' : 'Temel Iyilestirme Onerileri'
                    ],
                    buttonText: t('pricing.buyNow'),
                    buttonLink: isEn ? '/en/contact' : '/iletisim'
                },
                {
                    id: 'growth',
                    productKey: 'eye-growth',
                    name: 'Growth',
                    price: '2.700TL',
                    period: t('pricing.monthly'),
                    description: t('eyeTracking.pricing.plans.growth.desc'),
                    icon: <HiArrowTrendingUp />,
                    isPopular: true,
                    features: [
                        isEn ? '3 Creative Analyses' : '3 Gorsel Analizi',
                        isEn ? 'Priority Analysis Queue' : 'Oncelikli Analiz Sirasi',
                        isEn ? 'Pre A/B Test Measurement' : 'A/B Test Oncesi Olcum',
                        isEn ? 'Sector Benchmarking' : 'Sektorel Karsilastirma'
                    ],
                    buttonText: t('pricing.buyNow'),
                    buttonLink: isEn ? '/en/contact' : '/iletisim'
                },
                {
                    id: 'pro',
                    productKey: 'eye-pro',
                    name: 'Pro',
                    price: '4.000TL',
                    period: t('pricing.monthly'),
                    description: t('eyeTracking.pricing.plans.pro.desc'),
                    icon: <HiSparkles />,
                    features: [
                        isEn ? '5 Creative Analyses' : '5 Gorsel Analizi',
                        isEn ? 'Advanced ROI Analysis' : 'Gelismis ROI Analizi',
                        isEn ? 'Strategic Advisory Support' : 'Stratejik Danismanlik Destegi',
                        isEn ? 'Fast Approval Workflow' : 'Hizli Onay Sureci'
                    ],
                    buttonText: t('pricing.buyNow'),
                    buttonLink: isEn ? '/en/contact' : '/iletisim'
                }
            ]
        },
        testimonial: {
            quote: t('eyeTracking.testimonial.quote'),
            author: t('eyeTracking.testimonial.author'),
            role: t('eyeTracking.testimonial.role')
        },
        faqs: t('eyeTracking.faqs', { returnObjects: true }) as any
    }

    return <ServicePageTemplate {...eyeTrackingConfig} />
}
