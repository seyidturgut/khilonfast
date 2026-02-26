import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiChartBar,
    HiSparkles,
    HiMagnifyingGlass,
    HiGlobeAlt,
    HiKey,
    HiTrophy,
    HiCheckBadge,
    HiArrowTrendingUp,
    HiChartPie,
    HiUserGroup,
    HiRocketLaunch,
    HiShoppingCart,
    HiClipboardDocumentList,
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function IntegratedDigitalMarketing() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
    const langPrefix = currentLang === 'en' ? '/en' : ''

    useEffect(() => {
        document.title = t('serviceIDM.hero.title')

        const upsertMeta = (name: string, content: string) => {
            let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
            if (!tag) {
                tag = document.createElement('meta')
                tag.setAttribute('name', name)
                document.head.appendChild(tag)
            }
            tag.setAttribute('content', content)
        }

        upsertMeta('description', t('serviceIDM.hero.description'))
    }, [t])

    const idmConfig = {
        hero: {
            title: t('serviceIDM.hero.title'),
            subtitle: t('serviceIDM.hero.subtitle'),
            description: t('serviceIDM.hero.description'),
            buttonText: t('serviceIDM.hero.buttonText'),
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/butunlesik-dijital-pazarlama/hero.avif',
            hideBadge: true,
            badgeText: t('serviceIDM.hero.badgeText'),
            badgeIcon: <HiChartBar />,
            themeColor: '#F0F9FF'
        },
        breadcrumbs: [
            { label: t('header.services'), path: `/${t('slugs.home')}#services`.replace(/\/\#/, '/#') },
            { label: t('header.menuItems.services.integrated.title') }
        ],
        videoShowcase: {
            tag: t('serviceIDM.videoShowcase.tag'),
            title: <>{t('serviceIDM.videoShowcase.title')}</>,
            description: t('serviceIDM.videoShowcase.description'),
            videoUrl: 'https://www.youtube.com/embed/hWXnoXCsPMw'
        },
        approachSection: {
            title: t('serviceGTM.approach.title'),
            description: t('serviceGTM.approach.description'),
            items: [
                {
                    title: t('serviceGTM.approach.360.title'),
                    subtitle: t('serviceGTM.approach.360.subtitle'),
                    description: t('serviceGTM.approach.360.desc'),
                    icon: <HiGlobeAlt />
                },
                {
                    title: t('serviceGTM.approach.growth.title'),
                    subtitle: t('serviceGTM.approach.growth.subtitle'),
                    description: t('serviceGTM.approach.growth.desc'),
                    icon: <HiArrowTrendingUp />
                },
                {
                    title: t('serviceGTM.approach.data.title'),
                    subtitle: t('serviceGTM.approach.data.subtitle'),
                    description: t('serviceGTM.approach.data.desc'),
                    icon: <HiChartPie />
                },
                {
                    title: t('serviceGTM.approach.innovation.title'),
                    subtitle: t('serviceGTM.approach.innovation.subtitle'),
                    description: t('serviceGTM.approach.innovation.desc'),
                    icon: <HiSparkles />
                },
                {
                    title: t('serviceGTM.approach.partner.title'),
                    subtitle: t('serviceGTM.approach.partner.subtitle'),
                    description: t('serviceGTM.approach.partner.desc'),
                    icon: <HiUserGroup />
                }
            ]
        },
        authorizationSection: {
            title: t('serviceIDM.authorization.title'),
            description: '',
            cards: [
                {
                    title: t('serviceIDM.authorization.card1.title'),
                    description: t('serviceIDM.authorization.card1.desc'),
                    highlightText: t('serviceIDM.authorization.card1.highlight'),
                    buttonText: t('common.discover'),
                    buttonLink: `${langPrefix}/search-ads-google-reklamlari-kurulum-akisi`,
                    theme: 'light' as const
                },
                {
                    title: t('serviceIDM.authorization.card2.title'),
                    description: t('serviceIDM.authorization.card2.desc'),
                    highlightText: t('serviceIDM.authorization.card2.highlight'),
                    buttonText: t('common.discover'),
                    buttonLink: `${langPrefix}/google-tag-manager-kurulum-akisi`,
                    theme: 'dark' as const
                }
            ]
        },
        processSection: {
            tag: t('serviceIDM.authorization.card2.title'),
            title: t('serviceIDM.authorization.card2.title'),
            description: t('serviceIDM.authorization.card2.desc'),
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                {
                    stepNumber: 1,
                    title: t('process.steps.buy.title'),
                    description: t('process.steps.buy.description'),
                    icon: <HiShoppingCart />
                },
                {
                    stepNumber: 2,
                    title: t('process.steps.auth.title'),
                    description: t('process.steps.auth.description'),
                    icon: <HiKey />
                },
                {
                    stepNumber: 3,
                    title: t('process.steps.brief.title'),
                    description: t('process.steps.brief.description'),
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 4,
                    title: t('process.steps.analysis.title'),
                    description: t('process.steps.analysis.description'),
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 5,
                    title: t('process.steps.approval.title'),
                    description: t('process.steps.approval.description'),
                    icon: <HiCheckBadge />
                }
            ]
        },
        comparisonTable: {
            headers: [
                { title: 'Core', icon: <HiKey /> },
                { title: 'Growth', icon: <HiChartBar /> },
                { title: 'Ultimate', icon: <HiTrophy /> }
            ],
            rows: [
                { feature: 'SEO', values: [], isSectionHeader: true },
                { feature: t('serviceIDM.comparison.rows.keyword'), values: [true, true, true] },
                { feature: t('serviceIDM.comparison.rows.onPage'), values: [true, true, true] },
                { feature: t('serviceIDM.comparison.rows.looker'), values: [true, true, true] },
                { feature: t('serviceIDM.comparison.rows.setup'), values: ['-', true, true] },
                { feature: t('serviceIDM.comparison.rows.strategyDoc'), values: ['-', '-', true] },
                { feature: t('serviceIDM.comparison.rows.backlink'), values: ['-', '-', true] },
                { feature: t('serviceIDM.comparison.rows.competitor'), values: ['-', t('serviceIDM.comparison.values.competitor1'), t('serviceIDM.comparison.values.competitor2')] },
                { feature: t('serviceIDM.comparison.rows.pageCount'), values: ['1-3', '10-15', '20-30'] },
                { feature: t('serviceIDM.comparison.rows.audit'), values: ['-', '3 Ayda 1', 'Ayda 1'] },
                { feature: t('serviceIDM.comparison.rows.aiOpt'), values: ['-', '-', true] },
                { feature: t('serviceIDM.comparison.rows.blog'), values: [t('serviceIDM.comparison.values.blog2'), t('serviceIDM.comparison.values.blog4'), t('serviceIDM.comparison.values.blog6')] },
                { feature: t('serviceIDM.comparison.rows.email'), values: ['-', '-', t('serviceIDM.comparison.values.email10k')] },
                { feature: t('serviceIDM.comparison.rows.zeroClick'), values: ['-', '-', true] },
                { feature: 'Reklamlar', values: [], isSectionHeader: true },
                { feature: t('serviceIDM.comparison.rows.searchAds'), values: [t('serviceIDM.comparison.values.searchCore'), t('serviceIDM.comparison.values.searchGrowth'), t('serviceIDM.comparison.values.searchUltimate')] },
                { feature: t('serviceIDM.comparison.rows.setupFee'), values: [t('serviceIDM.comparison.values.setupFeeDesc'), t('serviceIDM.comparison.values.setupFeeDesc'), t('serviceIDM.comparison.values.setupFeeDesc')] },
                { feature: t('serviceIDM.comparison.rows.adOpt'), values: [t('serviceIDM.comparison.values.basic', { defaultValue: 'Temel' }), true, t('serviceIDM.comparison.values.continuous')] },
                { feature: t('serviceIDM.comparison.rows.extensions'), values: [t('serviceIDM.comparison.values.limited'), t('serviceIDM.comparison.values.geoTargeting'), t('serviceIDM.comparison.values.demographic')] },
                { feature: t('serviceIDM.comparison.rows.profile'), values: [t('serviceIDM.comparison.values.profile1'), t('serviceIDM.comparison.values.profile2'), t('serviceIDM.comparison.values.profile3')] },
                { feature: t('serviceIDM.comparison.rows.campaign'), values: [t('serviceIDM.comparison.values.campaign2'), t('serviceIDM.comparison.values.campaign4'), t('serviceIDM.comparison.values.campaign6')] },
                { feature: t('serviceIDM.comparison.rows.monthlyOpt'), values: [true, true, true] },
                { feature: t('serviceIDM.comparison.rows.report'), values: [t('serviceIDM.comparison.values.reportMonthly'), t('serviceIDM.comparison.values.reportBiweekly'), t('serviceIDM.comparison.values.reportWeekly')] },
                { feature: t('serviceIDM.comparison.rows.policy'), values: [t('serviceIDM.comparison.values.policyCore'), t('serviceIDM.comparison.values.policyGrowth'), t('serviceIDM.comparison.values.policyUltimate')] },
                { feature: t('serviceIDM.comparison.rows.setupFee'), values: [t('serviceIDM.comparison.values.setupFeeOnce'), t('serviceIDM.comparison.values.setupFeeOnce'), t('serviceIDM.comparison.values.setupFeeOnce')] }
            ],
            note: t('serviceIDM.comparison.note')
        },
        pricingSection: {
            tag: t('serviceIDM.pricing.tag'),
            title: t('serviceIDM.pricing.title'),
            description: t('serviceIDM.pricing.description'),
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺99.000',
                    period: t('pricing.monthly'),
                    description: t('serviceIDM.pricing.core.desc'),
                    icon: <HiKey />,
                    features: [],
                    details: [
                        {
                            title: t('serviceIDM.pricing.core.forWho'),
                            description: t('serviceIDM.pricing.core.forWhoDesc'),
                            icon: <HiUserGroup />
                        },
                        {
                            title: t('serviceGTM.pricing.core.why'),
                            description: t('serviceIDM.pricing.core.whyDesc'),
                            icon: <HiRocketLaunch />
                        }
                    ],
                    buttonText: t('pricing.buyNow')
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '₺149.000',
                    period: t('pricing.monthly'),
                    description: t('serviceIDM.pricing.growth.desc'),
                    isPopular: true,
                    icon: <HiArrowTrendingUp />,
                    features: [],
                    details: [
                        {
                            title: t('serviceIDM.pricing.core.forWho'),
                            description: t('serviceIDM.pricing.growth.forWhoDesc'),
                            icon: <HiUserGroup />
                        },
                        {
                            title: t('serviceGTM.pricing.core.why'),
                            description: t('serviceIDM.pricing.growth.whyDesc'),
                            icon: <HiRocketLaunch />
                        }
                    ],
                    buttonText: t('pricing.buyNow')
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺319.000',
                    period: t('pricing.monthly'),
                    description: t('serviceIDM.pricing.ultimate.desc'),
                    icon: <HiTrophy />,
                    features: [],
                    details: [
                        {
                            title: t('serviceIDM.pricing.core.forWho'),
                            description: t('serviceIDM.pricing.ultimate.forWhoDesc'),
                            icon: <HiUserGroup />
                        },
                        {
                            title: t('serviceGTM.pricing.core.why'),
                            description: t('serviceIDM.pricing.ultimate.whyDesc'),
                            icon: <HiRocketLaunch />
                        }
                    ],
                    buttonText: t('pricing.buyNow')
                }
            ]
        },
        testimonial: {
            quote: t('serviceIDM.testimonial.quote'),
            author: t('serviceIDM.testimonial.author'),
            role: t('serviceIDM.testimonial.role')
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') },
            { question: t('faq.item4.question'), answer: t('faq.item4.answer') }
        ]
    }

    return <ServicePageTemplate {...idmConfig} serviceKey="service-integrated-marketing" />
}
