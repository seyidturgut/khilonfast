import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiPencilSquare,
    HiMagnifyingGlass,
    HiSparkles,
    HiCheckBadge,
    HiKey,
    HiChartBar,
    HiTrophy,
    HiCursorArrowRays,
    HiUserGroup,
    HiRocketLaunch,
    HiShoppingCart,
    HiClipboardDocumentList,
    HiGlobeAlt,
    HiArrowTrendingUp,
    HiChartPie
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'
import { useRouteLocale } from '../utils/locale'

export default function ContentProduction() {
    const { t, i18n } = useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const homeServicesPath = isEn ? '/en/#services' : '/#services'

    useEffect(() => {
        document.title = isEn
            ? 'Content Production & Conversion Services | khilonfast'
            : 'İçerik Üretimi ve Dönüşüm Hizmetleri | khilonfast'
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Görünürlüğünüzü Artırın!',
            subtitle: 'İçerik üretimindeki zaman ve yaratıcılık zorluklarını aşın!',
            description: 'khilonfast ile hedef kitlenize uygun, SEO uyumlu içerikler üreterek marka görünürlüğünüzü artırın. Profesyonel içerik çözümleriyle zaman ve kaynak sorunlarını geride bırakın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/icerik-uretimi/hero.webp',
            imageClassName: 'hero-main-img-content-production',
            imageContainerClassName: 'hero-image-container-content-production',
            hideBadge: true,
            badgeText: 'Görünürlüğünüzü Artırın! Zorlukları Aşın!',
            badgeIcon: <HiPencilSquare />,
            themeColor: '#FEF9C3',
            disableBadgeAnimation: true
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: homeServicesPath },
            { label: 'İçerik Üretimi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Markanızı <span className="highlight-text">Güçlendirin</span>
                </>
            ),
            description: 'Hedef kitlenizi etkileyen yüksek kaliteli içerikler üretin. khilonfast ile sürekli ve optimize edilmiş içeriklerle markanızın görünürlüğünü artırın.',
            videoUrl: 'https://www.youtube.com/embed/zfz5tG3i5ck'
        },
        approachSection: {
            title: t('serviceGTM.approach.title', { defaultValue: 'khilonfast Yaklaşımı' }),
            description: t('serviceGTM.approach.description', { defaultValue: 'Her adımda sürdürülebilir büyüme odaklı çalışıyoruz.' }),
            items: [
                {
                    title: t('serviceGTM.approach.360.title', { defaultValue: '360 Derece Bakış Açısı' }),
                    subtitle: t('serviceGTM.approach.360.subtitle', { defaultValue: 'Bütünleşik Strateji' }),
                    description: t('serviceGTM.approach.360.desc', { defaultValue: 'Her detayı bütünsel bir bakış açısıyla inceliyoruz.' }),
                    icon: <HiGlobeAlt />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/Bakis-Acisi.avif'
                },
                {
                    title: t('serviceGTM.approach.growth.title', { defaultValue: 'Büyüme Odaklı Stratejiler' }),
                    subtitle: t('serviceGTM.approach.growth.subtitle', { defaultValue: 'Performans Yönetimi' }),
                    description: t('serviceGTM.approach.growth.desc', { defaultValue: 'Hedeflerinizi hızlıca yakalamak için büyümenizi ölçümlüyoruz.' }),
                    icon: <HiArrowTrendingUp />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/buyume-dakli.avif'
                },
                {
                    title: t('serviceGTM.approach.data.title', { defaultValue: 'Veri Odaklı Pazarlama' }),
                    subtitle: t('serviceGTM.approach.data.subtitle', { defaultValue: 'Geniş İçgörüler' }),
                    description: t('serviceGTM.approach.data.desc', { defaultValue: 'Kanıtlanmış verilerle risk almadan hareket ediyoruz.' }),
                    icon: <HiChartPie />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/veri-odakli.avif'
                },
                {
                    title: t('serviceGTM.approach.innovation.title', { defaultValue: 'İnovasyon ile Fark' }),
                    subtitle: t('serviceGTM.approach.innovation.subtitle', { defaultValue: 'Yenilikçi Teknikler' }),
                    description: t('serviceGTM.approach.innovation.desc', { defaultValue: 'Sektördeki en modern teknoloji araçlarıyla rakiplerden ayrışın.' }),
                    icon: <HiSparkles />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/inovasyon-fark.avif'
                },
                {
                    title: t('serviceGTM.approach.partner.title', { defaultValue: 'Stratejik İş Ortağı' }),
                    subtitle: t('serviceGTM.approach.partner.subtitle', { defaultValue: 'Uzun Vadeli Başarı' }),
                    description: t('serviceGTM.approach.partner.desc', { defaultValue: 'Müşterilerimizi kısa süreli değil uzun dönemli hedeflerle destekliyoruz.' }),
                    icon: <HiUserGroup />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/is-ortagi.avif'
                }
            ]
        },
        processSection: {
            tag: t('process.tag', { defaultValue: 'Nasıl Çalışır?' }),
            title: t('process.title', { defaultValue: 'Hizmet Süreci' }),
            description: 'İçerik üretim stratejinizi hayata geçirmek için izlediğimiz 5 adımlı yol haritası.',
            videoUrl: 'https://player.vimeo.com/video/1128822985',
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
                    description: (() => {
                        const raw = t('process.steps.auth.description') as string
                        const tokens = ['tıklayın>>', 'tıklayın.', 'tıklayın', 'Click for authorization details >>', 'Click >>', 'Click']
                        for (const tok of tokens) {
                            const idx = raw.indexOf(tok)
                            if (idx !== -1) {
                                return <>{raw.slice(0, idx)}<a href="#authorization" style={{ textDecoration: 'underline' }}>{tok.replace('>>', '').trim()}</a>{raw.slice(idx + tok.length)}</>
                            }
                        }
                        return raw
                    })(),
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
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'İçerik Üretimi Çözümleri',
            description: 'khilonfast ile içerik üretim süreçlerinizi en verimli şekilde yönetin ve markanızın görünürlüğünü artırın.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺19.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiKey />,
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Küçük işletmeler ve dijital pazarlamaya yeni başlayanlar.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Dijital pazarlamayı düşük bütçe ve minimal riskle keşfetmek için ideal.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '₺29.000*',
                    period: 'Ay',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    isPopular: true,
                    icon: <HiChartBar />,
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Daha geniş bir kitleye hitap etmek isteyen işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Daha fazla içerik ve stratejik planlama isteyen işletmeler için uygundur.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺49.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Pazarda hakimiyet kurmayı hedefleyen büyük işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Profesyonel içerik ve kapsamlı strateji ile maksimum etkileşim sağlar.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                }
            ]
        },
        comparisonTable: {
            headers: [
                { title: 'Core', icon: <HiKey /> },
                { title: 'Growth', icon: <HiChartBar /> },
                { title: 'Ultimate', icon: <HiTrophy /> }
            ],
            rows: i18n.language === 'en' ? [
                { feature: 'Blog Posts', values: ['4 posts x 750 words', '6 posts x 750 words', '8 posts x 750 words'] },
                { feature: 'Visuals', values: ['-', true, true] },
                { feature: 'Revision Rounds', values: ['1', '2', '4'] }
            ] : [
                { feature: 'Blog Yazısı', values: ['4 içerik x 750 kelime', '6 içerik x 750 kelime', '8 içerik x 750 kelime'] },
                { feature: 'Görsel', values: ['-', true, true] },
                { feature: 'Revizyon Hakkı', values: ['1', '2', '4'] }
            ],
            note: i18n.language === 'en' ? '(*) Prices exclude VAT.' : '(*) KDV hariç.'
        },
        testimonial: {
            quote: 'İçerik üretimindeki tıkanıklığımızı khilonfast ile aştık. Düzenli ve kaliteli içerikler sayesinde organik trafiğimizde %40 artış gördük.',
            author: 'Zeynep Aydın',
            role: 'Pazarlama Müdürü'
        },
        faqs: [
            { question: t('serviceContentProduction.faqs.q1.q'), answer: t('serviceContentProduction.faqs.q1.a') },
            { question: t('serviceContentProduction.faqs.q2.q'), answer: t('serviceContentProduction.faqs.q2.a') },
            { question: t('serviceContentProduction.faqs.q3.q'), answer: t('serviceContentProduction.faqs.q3.a') },
            { question: t('serviceContentProduction.faqs.q4.q'), answer: t('serviceContentProduction.faqs.q4.a') },
            { question: t('serviceContentProduction.faqs.q5.q'), answer: t('serviceContentProduction.faqs.q5.a') },
            { question: t('serviceContentProduction.faqs.q6.q'), answer: t('serviceContentProduction.faqs.q6.a') },
            { question: t('serviceContentProduction.faqs.q7.q'), answer: t('serviceContentProduction.faqs.q7.a') },
            { question: t('serviceContentProduction.faqs.q8.q'), answer: t('serviceContentProduction.faqs.q8.a') },
            { question: t('serviceContentProduction.faqs.q9.q'), answer: t('serviceContentProduction.faqs.q9.a') },
            { question: t('serviceContentProduction.faqs.q10.q'), answer: t('serviceContentProduction.faqs.q10.a') },
            { question: t('serviceContentProduction.faqs.q11.q'), answer: t('serviceContentProduction.faqs.q11.a') }
        ]
    }

    const enConfig = {
        hero: {
            title: 'Turn Content Into Revenue',
            subtitle: 'Remove production bottlenecks and publish with strategic consistency.',
            description: 'khilonfast delivers SEO-first, conversion-ready content systems that elevate visibility, authority, and pipeline quality.',
            buttonText: t('common.startNow'),
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/icerik-uretimi/hero.webp',
            imageClassName: 'hero-main-img-content-production',
            imageContainerClassName: 'hero-image-container-content-production',
            hideBadge: true,
            badgeText: 'Scale Visibility with Strategic Content',
            badgeIcon: <HiPencilSquare />,
            themeColor: '#FEF9C3',
            disableBadgeAnimation: true
        },
        breadcrumbs: [
            { label: t('header.services'), path: homeServicesPath },
            { label: 'Content Production' }
        ],
        videoShowcase: {
            tag: 'Watch & Learn',
            title: (
                <>
                    Build <span className="highlight-text">Category Authority</span>
                </>
            ),
            description: 'From strategy to execution, we produce high-impact content that attracts qualified traffic and supports conversion goals.',
            videoUrl: 'https://www.youtube.com/embed/zfz5tG3i5ck'
        },
        approachSection: {
            title: t('serviceGTM.approach.title', { defaultValue: 'The khilonfast Approach' }),
            description: t('serviceGTM.approach.description', { defaultValue: 'We focus on sustainable growth at every step.' }),
            items: [
                {
                    title: t('serviceGTM.approach.360.title', { defaultValue: '360-Degree Perspective' }),
                    subtitle: t('serviceGTM.approach.360.subtitle', { defaultValue: 'Integrated Strategy' }),
                    description: t('serviceGTM.approach.360.desc', { defaultValue: 'We analyze every detail with a holistic perspective.' }),
                    icon: <HiGlobeAlt />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/Bakis-Acisi.avif'
                },
                {
                    title: t('serviceGTM.approach.growth.title', { defaultValue: 'Growth-Driven Strategies' }),
                    subtitle: t('serviceGTM.approach.growth.subtitle', { defaultValue: 'Performance Management' }),
                    description: t('serviceGTM.approach.growth.desc', { defaultValue: 'We measure your growth to reach your goals quickly.' }),
                    icon: <HiArrowTrendingUp />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/buyume-dakli.avif'
                },
                {
                    title: t('serviceGTM.approach.data.title', { defaultValue: 'Data-Driven Marketing' }),
                    subtitle: t('serviceGTM.approach.data.subtitle', { defaultValue: 'Broad Insights' }),
                    description: t('serviceGTM.approach.data.desc', { defaultValue: 'We move without risk using proven data.' }),
                    icon: <HiChartPie />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/veri-odakli.avif'
                },
                {
                    title: t('serviceGTM.approach.innovation.title', { defaultValue: 'Making a Difference with Innovation' }),
                    subtitle: t('serviceGTM.approach.innovation.subtitle', { defaultValue: 'Innovative Techniques' }),
                    description: t('serviceGTM.approach.innovation.desc', { defaultValue: 'Stand out from competitors with the most modern tech tools in the industry.' }),
                    icon: <HiSparkles />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/inovasyon-fark.avif'
                },
                {
                    title: t('serviceGTM.approach.partner.title', { defaultValue: 'Strategic Partner' }),
                    subtitle: t('serviceGTM.approach.partner.subtitle', { defaultValue: 'Long-Term Success' }),
                    description: t('serviceGTM.approach.partner.desc', { defaultValue: 'We support our clients with long-term goals, not short-term ones.' }),
                    icon: <HiUserGroup />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/is-ortagi.avif'
                }
            ]
        },
        processSection: {
            tag: '4-Step Workflow',
            title: 'How It Works?',
            description: 'A practical operating model for consistent, high-performing content output.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                { stepNumber: 1, title: 'Step 1: Strategic Brief', description: 'We define goals, topics, audiences, and conversion intent before production.', icon: <HiPencilSquare /> },
                { stepNumber: 2, title: 'Step 2: Production', description: 'Specialist writers produce content assets aligned with your positioning.', icon: <HiCursorArrowRays /> },
                { stepNumber: 3, title: 'Step 3: Editorial Review', description: 'Content is validated for SEO quality, readability, and messaging coherence.', icon: <HiMagnifyingGlass /> },
                { stepNumber: 4, title: 'Step 4: Delivery & Publishing', description: 'Final assets are delivered publication-ready, or directly deployed if required.', icon: <HiCheckBadge /> }
            ]
        },
        pricingSection: {
            tag: 'Service Packages',
            title: 'Content Production Solutions',
            description: 'Choose the level that matches your growth tempo and publishing ambition.',
            packages: [
                { id: 'core', name: 'Core', price: '$499*', period: t('pricing.monthly'), description: 'Essential package for foundational content consistency.', icon: <HiKey />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'growth', name: 'Growth', price: '$759*', period: t('pricing.monthly'), description: 'Scale package for higher output and stronger demand generation.', isPopular: true, icon: <HiChartBar />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'ultimate', name: 'Ultimate', price: '$1,299*', period: t('pricing.monthly'), description: 'Advanced package for category leadership and high-velocity growth.', icon: <HiTrophy />, features: [], buttonText: t('pricing.buyNow') }
            ]
        },
        testimonial: {
            quote: 'khilonfast helped us unblock production and scale quality content. Organic traffic increased by 40%.',
            author: 'Zeynep Aydin',
            role: 'Marketing Manager'
        },
        faqs: [
            { question: t('serviceContentProduction.faqs.q1.q'), answer: t('serviceContentProduction.faqs.q1.a') },
            { question: t('serviceContentProduction.faqs.q2.q'), answer: t('serviceContentProduction.faqs.q2.a') },
            { question: t('serviceContentProduction.faqs.q3.q'), answer: t('serviceContentProduction.faqs.q3.a') },
            { question: t('serviceContentProduction.faqs.q4.q'), answer: t('serviceContentProduction.faqs.q4.a') },
            { question: t('serviceContentProduction.faqs.q5.q'), answer: t('serviceContentProduction.faqs.q5.a') },
            { question: t('serviceContentProduction.faqs.q6.q'), answer: t('serviceContentProduction.faqs.q6.a') },
            { question: t('serviceContentProduction.faqs.q7.q'), answer: t('serviceContentProduction.faqs.q7.a') },
            { question: t('serviceContentProduction.faqs.q8.q'), answer: t('serviceContentProduction.faqs.q8.a') },
            { question: t('serviceContentProduction.faqs.q9.q'), answer: t('serviceContentProduction.faqs.q9.a') },
            { question: t('serviceContentProduction.faqs.q10.q'), answer: t('serviceContentProduction.faqs.q10.a') },
            { question: t('serviceContentProduction.faqs.q11.q'), answer: t('serviceContentProduction.faqs.q11.a') }
        ]
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-content-production" disableApiHeroTextOverride={true} />
}
