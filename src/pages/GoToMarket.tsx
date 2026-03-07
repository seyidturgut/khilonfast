import {
    HiRocketLaunch,
    HiChartBar,
    HiLightBulb,
    HiKey,
    HiTrophy,
    HiCreditCard,
    HiClipboardDocumentList,
    HiCheckBadge,
    HiGlobeAlt,
    HiArrowTrendingUp,
    HiChartPie,
    HiSparkles,
    HiUserGroup
} from 'react-icons/hi2'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function GoToMarket() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
    const langPrefix = currentLang === 'en' ? '/en' : ''

    useEffect(() => {
        document.title = t('serviceGTM.seo.title')

        const upsertMeta = (name: string, content: string) => {
            let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
            if (!tag) {
                tag = document.createElement('meta')
                tag.setAttribute('name', name)
                document.head.appendChild(tag)
            }
            tag.setAttribute('content', content)
        }

        upsertMeta('description', t('serviceGTM.seo.description'))
    }, [t])

    const gtmConfig = {
        hero: {
            title: t('serviceGTM.hero.title'),
            subtitle: t('serviceGTM.hero.subtitle'),
            description: t('serviceGTM.hero.description'),
            buttonText: t('serviceGTM.hero.buttonText'),
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/go-to-market-stratejisi/hero.png',
            hideBadge: true,
            badgeText: t('serviceGTM.hero.badgeText'),
            badgeIcon: <HiRocketLaunch />,
            themeColor: '#DBEAFE'
        },
        breadcrumbs: [
            { label: t('serviceGTM.breadcrumbs.services'), path: `${langPrefix}/#services` },
            { label: t('serviceGTM.breadcrumbs.current') }
        ],
        videoShowcase: {
            tag: t('serviceGTM.videoShowcase.tag'),
            title: (
                <>
                    {t('serviceGTM.videoShowcase.titlePrefix')}
                    <span className="highlight"> {t('serviceGTM.videoShowcase.titleHighlight')}</span>
                </>
            ),
            description: t('serviceGTM.videoShowcase.description'),
            videoUrl: 'https://www.youtube.com/embed/Gw7sA7aaI6k'
        },

        pricingSection: {
            tag: t('serviceGTM.pricing.tag'),
            title: t('serviceGTM.pricing.title'),
            description: t('serviceGTM.pricing.description'),
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '$9.900*',
                    period: '',
                    description: t('serviceGTM.pricing.core.desc'),
                    icon: <HiKey />,
                    features: [
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>{t('serviceGTM.pricing.core.forWho')}</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{t('serviceGTM.pricing.core.forWhoDesc')}</span>
                        </div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>{t('serviceGTM.pricing.core.why')}</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{t('serviceGTM.pricing.core.whyDesc')}</span>
                        </div>
                    ],
                    buttonLink: `${langPrefix}/hizmetlerimiz/butunlesik-dijital-pazarlama`
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '$14.900*',
                    period: '',
                    description: t('serviceGTM.pricing.growth.desc'),
                    isPopular: true,
                    icon: <HiChartBar />,
                    features: [
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>{t('serviceGTM.pricing.growth.forWho')}</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{t('serviceGTM.pricing.growth.forWhoDesc')}</span>
                        </div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>{t('serviceGTM.pricing.growth.why')}</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{t('serviceGTM.pricing.growth.whyDesc')}</span>
                        </div>
                    ],
                    buttonLink: `${langPrefix}/hizmetlerimiz/butunlesik-dijital-pazarlama`
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '$29.900*',
                    period: '',
                    description: t('serviceGTM.pricing.ultimate.desc'),
                    icon: <HiTrophy />,
                    features: [
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>{t('serviceGTM.pricing.ultimate.forWho')}</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{t('serviceGTM.pricing.ultimate.forWhoDesc')}</span>
                        </div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>{t('serviceGTM.pricing.ultimate.why')}</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{t('serviceGTM.pricing.ultimate.whyDesc')}</span>
                        </div>
                    ],
                    buttonLink: `${langPrefix}/hizmetlerimiz/butunlesik-dijital-pazarlama`
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
                { feature: t('serviceGTM.comparison.rows.marketingPlan'), values: [true, true, true] },
                { feature: t('serviceGTM.comparison.rows.salesValue'), values: [true, true, true] },
                { feature: t('serviceGTM.comparison.rows.digitalStrategy'), values: [t('serviceGTM.comparison.values.basic'), t('serviceGTM.comparison.values.advanced'), t('serviceGTM.comparison.values.advanced')] },
                { feature: t('serviceGTM.comparison.rows.contentStrategy'), values: ['-', t('serviceGTM.comparison.values.basic'), t('serviceGTM.comparison.values.advanced')] },
                { feature: t('serviceGTM.comparison.rows.automation'), values: ['-', true, true] },
                { feature: t('serviceGTM.comparison.rows.salesScript'), values: ['-', t('serviceGTM.comparison.values.basic'), t('serviceGTM.comparison.values.advanced')] },
                { feature: t('serviceGTM.comparison.rows.brandDesign'), values: ['-', '-', true] },
                { feature: t('serviceGTM.comparison.rows.funnelTemplates'), values: ['-', '-', true] },
                { feature: t('serviceGTM.comparison.rows.duration'), values: [t('serviceGTM.comparison.values.weeks4'), t('serviceGTM.comparison.values.weeks6'), t('serviceGTM.comparison.values.weeks9')] },
                { feature: t('serviceGTM.comparison.rows.revisions'), values: [1, 3, 5] }
            ],
            note: t('serviceGTM.comparison.note')
        },
        processSection: {
            tag: t('serviceGTM.process.tag'),
            title: t('serviceGTM.process.title'),
            description: t('serviceGTM.process.description'),
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm',
            steps: [
                {
                    stepNumber: 1,
                    title: t('serviceGTM.process.steps.buy.title'),
                    description: t('serviceGTM.process.steps.buy.desc'),
                    icon: <HiCreditCard />
                },
                {
                    stepNumber: 2,
                    title: t('serviceGTM.process.steps.brief.title'),
                    description: t('serviceGTM.process.steps.brief.desc'),
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 3,
                    title: t('serviceGTM.process.steps.analysis.title'),
                    description: t('serviceGTM.process.steps.analysis.desc'),
                    icon: <HiLightBulb />
                },
                {
                    stepNumber: 4,
                    title: t('serviceGTM.process.steps.approval.title'),
                    description: t('serviceGTM.process.steps.approval.desc'),
                    icon: <HiCheckBadge />
                }
            ]
        },
        approachSection: {
            title: t('serviceGTM.approach.title'),
            description: t('serviceGTM.approach.description'),
            items: [
                {
                    title: t('serviceGTM.approach.360.title'),
                    subtitle: t('serviceGTM.approach.360.subtitle'),
                    description: t('serviceGTM.approach.360.desc'),
                    icon: <HiGlobeAlt />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/Bakis-Acisi.avif'
                },
                {
                    title: t('serviceGTM.approach.growth.title'),
                    subtitle: t('serviceGTM.approach.growth.subtitle'),
                    description: t('serviceGTM.approach.growth.desc'),
                    icon: <HiArrowTrendingUp />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/buyume-dakli.avif'
                },
                {
                    title: t('serviceGTM.approach.data.title'),
                    subtitle: t('serviceGTM.approach.data.subtitle'),
                    description: t('serviceGTM.approach.data.desc'),
                    icon: <HiChartPie />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/veri-odakli.avif'
                },
                {
                    title: t('serviceGTM.approach.innovation.title'),
                    subtitle: t('serviceGTM.approach.innovation.subtitle'),
                    description: t('serviceGTM.approach.innovation.desc'),
                    icon: <HiSparkles />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/inovasyon-fark.avif'
                },
                {
                    title: t('serviceGTM.approach.partner.title'),
                    subtitle: t('serviceGTM.approach.partner.subtitle'),
                    description: t('serviceGTM.approach.partner.desc'),
                    icon: <HiUserGroup />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/is-ortagi.avif'
                }
            ]
        },
        testimonial: {
            quote: t('serviceGTM.testimonial.quote'),
            author: t('serviceGTM.testimonial.author'),
            role: t('serviceGTM.testimonial.role')
        },
        faqs: [
            { question: t('serviceGTM.faqs.q1.q'), answer: t('serviceGTM.faqs.q1.a') },
            { question: t('serviceGTM.faqs.q2.q'), answer: t('serviceGTM.faqs.q2.a') },
            { question: t('serviceGTM.faqs.q3.q'), answer: t('serviceGTM.faqs.q3.a') },
            { question: t('serviceGTM.faqs.q4.q'), answer: t('serviceGTM.faqs.q4.a') },
            { question: t('serviceGTM.faqs.q5.q'), answer: t('serviceGTM.faqs.q5.a') },
            { question: t('serviceGTM.faqs.q6.q'), answer: t('serviceGTM.faqs.q6.a') },
            { question: t('serviceGTM.faqs.q7.q'), answer: t('serviceGTM.faqs.q7.a') },
            { question: t('serviceGTM.faqs.q8.q'), answer: t('serviceGTM.faqs.q8.a') },
            { question: t('serviceGTM.faqs.q9.q'), answer: t('serviceGTM.faqs.q9.a') },
            { question: t('serviceGTM.faqs.q10.q'), answer: t('serviceGTM.faqs.q10.a') }
        ]
    }

    return <ServicePageTemplate {...gtmConfig} serviceKey="service-gtm" disableApiHeroTextOverride />
}
