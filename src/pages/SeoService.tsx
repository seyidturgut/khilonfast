import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiMagnifyingGlass,
    HiGlobeAlt,
    HiSparkles,
    HiChartBar,
    HiTrophy,
    HiKey,
    HiArrowTrendingUp,
    HiChartPie,
    HiUserGroup,
    HiRocketLaunch,
    HiShoppingCart,
    HiCheckBadge,
    HiClipboardDocumentList

} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'
import { useRouteLocale } from '../utils/locale'

export default function SeoService() {
    const { t, i18n } = useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const homeServicesPath = isEn ? '/en/#services' : '/#services'
    const langPrefix = isEn ? '/en' : ''

    useEffect(() => {
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Üst Sıralara Çıkın!',
            subtitle: 'Rakiplerinizle rekabet edin ve online görünürlüğünüzü artırın!',
            description: 'Doğru anahtar kelime stratejileri ve SEO optimizasyonuyla, khilonfast ile markanızın organik sıralamalarda yükselmesini sağlayın. Hedef kitlenizi büyütün.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/seo-yonetimi/TR_SEOservices.avif',
            hideBadge: true,
            badgeText: "Üst Sıralara Çıkın! Rekabetin Önüne Geçin!",
            badgeIcon: <HiGlobeAlt />,
            themeColor: '#E0F2FE' // Light blue theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'SEO Yönetimi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Arama Sonuçlarında
                    <span className="highlight"> Öne Çıkın</span>
                </>
            ),
            description: 'khilonfast SEO hizmetleriyle arama motoru sonuçlarında rakiplerinizi geride bırakın. Stratejik anahtar kelime seçimi ve optimize edilmiş içeriklerle online görünürlüğünüzü artırın.',
            videoUrl: 'https://www.youtube.com/embed/qx17zxGfFzs'
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
            description: 'Organik trafiğinizi artırmak için izlediğimiz 5 adımlı yol haritası.',
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
        comparisonTable: {
            headers: [
                { title: 'Core', icon: <HiKey /> },
                { title: 'Growth', icon: <HiChartBar /> },
                { title: 'Ultimate', icon: <HiTrophy /> }
            ],
            rows: i18n.language === 'en' ? [
                { feature: 'SEO', values: ['Basic SEO optimization', 'Advanced SEO strategy & execution', 'Pro SEO strategy, content production, advanced technical SEO'] },
                { feature: 'Keyword research', values: [true, true, true] },
                { feature: 'On-page optimization playbook', values: [true, true, true] },
                { feature: 'Looker Studio setup', values: [true, true, true] },
                { feature: 'GSC & GA setup', values: ['-', true, true] },
                { feature: 'Content strategy document', values: ['-', '-', true] },
                { feature: 'Off-page SEO (Backlink building)', values: ['-', '-', true] },
                { feature: 'Competitor analysis', values: ['-', '1 Competitor', '2 Competitors'] },
                { feature: 'Number of pages', values: ['1-9', '10-19', '20-30'] },
                { feature: 'SEO Audit', values: ['-', 'Every Quarter', 'Monthly'] },
                { feature: 'AI Optimization', values: ['-', '-', true] }
            ] : [
                { feature: 'SEO', values: ['Temel SEO optimizasyonu', 'Gelişmiş SEO stratejisi ve uygulama', 'Pro SEO stratejisi, içerik üretimi ve gelişmiş teknik SEO'] },
                { feature: 'Anahtar kelime araştırması', values: [true, true, true] },
                { feature: 'Sayfa içi optimizasyon reçetesi', values: [true, true, true] },
                { feature: 'Looker Studio kurulumu', values: [true, true, true] },
                { feature: 'GSC ve GA kurulumu', values: ['-', true, true] },
                { feature: 'İçerik stratejisi dokümanı', values: ['-', '-', true] },
                { feature: 'Dış SEO (Backlink inşası)', values: ['-', '-', true] },
                { feature: 'Rekabet analizi', values: ['-', '1 Rakip', '2 Rakip'] },
                { feature: 'Sayfa sayısı', values: ['1-9', '10-19', '20-30'] },
                { feature: 'SEO Audit', values: ['-', '3 Ayda 1', 'Ayda 1'] },
                { feature: 'Yapay Zeka (AI) Optimizasyonu', values: ['-', '-', true] }
            ],
            note: i18n.language === 'en' ? '(*) Prices exclude VAT.' : '(*) KDV hariçtir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'SEO Çözümleri',
            description: 'Markanızı üst sıralara taşımak için doğru adımları atın. khilonfast ile SEO kampanyalarınızı başlatın ve online potansiyelinizi ortaya çıkarın.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺32.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiGlobeAlt />,
                    features: [],
                    buttonText: 'SATIN AL',
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
                    price: '₺48.000*',
                    period: 'Ay',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    isPopular: true,
                    icon: <HiChartBar />,
                    features: [],
                    buttonText: 'SATIN AL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Dijital operasyonlarını büyütmeyi hedefleyen orta ölçekli işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Gelişmiş hedefleme ve optimizasyon teknikleriyle etkileşimi artırın.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺85.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: 'SATIN AL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Pazarda hakimiyet kurmayı hedefleyen büyük işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın!',
                            icon: <HiRocketLaunch />
                        }
                    ]
                }
            ]
        },
        testimonial: {
            quote: "SEO çalışmalarına başladıktan sonra organik trafiğimiz 6 ay içinde 3 katına çıktı. khilonfast'in teknik uzmanlığı gerçekten fark yaratıyor.",
            author: "Caner Özkan",
            role: "E-ticaret Direktörü"
        },
        faqs: [
            { question: t('serviceSeo.faqs.q1.q'), answer: t('serviceSeo.faqs.q1.a') },
            { question: t('serviceSeo.faqs.q2.q'), answer: t('serviceSeo.faqs.q2.a') },
            { question: t('serviceSeo.faqs.q3.q'), answer: t('serviceSeo.faqs.q3.a') },
            { question: t('serviceSeo.faqs.q4.q'), answer: t('serviceSeo.faqs.q4.a') },
            { question: t('serviceSeo.faqs.q5.q'), answer: t('serviceSeo.faqs.q5.a') },
            { question: t('serviceSeo.faqs.q6.q'), answer: t('serviceSeo.faqs.q6.a') },
            { question: t('serviceSeo.faqs.q7.q'), answer: t('serviceSeo.faqs.q7.a') },
            { question: t('serviceSeo.faqs.q8.q'), answer: t('serviceSeo.faqs.q8.a') },
            { question: t('serviceSeo.faqs.q9.q'), answer: t('serviceSeo.faqs.q9.a') },
            { question: t('serviceSeo.faqs.q10.q'), answer: t('serviceSeo.faqs.q10.a') }
        ]
    }

    const enConfig = {
        hero: {
            title: 'Rank Higher and Capture Qualified Demand',
            subtitle: 'Increase search visibility and outperform competitors organically.',
            description: 'With khilonfast SEO services, improve technical health, keyword relevance, and content quality to drive sustainable organic growth.',
            buttonText: 'Start Now',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/seo-yonetimi/hero.webp',
            hideBadge: true,
            badgeText: 'Higher Rankings. Stronger Organic Momentum.',
            badgeIcon: <HiGlobeAlt />,
            themeColor: '#E0F2FE'
        },
        breadcrumbs: [
            { label: t('header.services'), path: homeServicesPath },
            { label: t('header.menuItems.services.seo.title') }
        ],
        videoShowcase: {
            tag: 'Watch & Learn',
            title: <>Win Visibility in <span className="highlight">Search Results</span></>,
            description: 'Gain durable rankings with strategic keyword architecture, technical optimization, and search-intent aligned content systems.',
            videoUrl: 'https://www.youtube.com/embed/qx17zxGfFzs'
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
            tag: 'How It Works',
            title: 'Service Process',
            description: 'A 5-step roadmap we follow to grow your organic traffic.',
            videoUrl: 'https://player.vimeo.com/video/1128822985',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Purchase',
                    description: 'Choose the package that fits your needs. The process starts automatically once your purchase is complete.',
                    icon: <HiShoppingCart />
                },
                {
                    stepNumber: 2,
                    title: 'Authorize',
                    description: <>Grant the khilonfast team the necessary access permissions. For authorization details <a href="#authorization" style={{ textDecoration: 'underline' }}>click here</a></>,
                    icon: <HiKey />
                },
                {
                    stepNumber: 3,
                    title: 'Brief Us',
                    description: 'Answer the questions in the form we send you to share your goals, target audience and brand voice. This form forms the foundation of the strategy.',
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 4,
                    title: 'Analysis',
                    description: 'The khilonfast team analyzes your brief and prepares a de-brief report showing how we have understood you. This report helps us align on direction together.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 5,
                    title: 'Approval',
                    description: 'Once the de-brief report is approved, service setup begins and measurements are activated within one week.',
                    icon: <HiCheckBadge />
                }
            ]
        },
        pricingSection: {
            tag: 'Service Packages',
            title: 'SEO Solutions',
            description: 'Select the package that matches your growth ambition and search competition level.',
            packages: [
                { id: 'core', name: 'Core', price: '$799*', period: t('pricing.monthly'), description: 'Solid entry package for foundational SEO progress.', icon: <HiGlobeAlt />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'growth', name: 'Growth', price: '$1,199*', period: t('pricing.monthly'), description: 'Scaling package for stronger rankings and demand capture.', isPopular: true, icon: <HiChartBar />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'ultimate', name: 'Ultimate', price: '$2,149*', period: t('pricing.monthly'), description: 'Advanced package for competitive markets and category leadership.', icon: <HiTrophy />, features: [], buttonText: t('pricing.buyNow') }
            ]
        },
        testimonial: {
            quote: 'Within six months of SEO execution, our organic traffic and high-intent lead volume increased substantially.',
            author: 'Caner Ozkan',
            role: 'E-commerce Director'
        },
        faqs: [
            { question: t('serviceSeo.faqs.q1.q'), answer: t('serviceSeo.faqs.q1.a') },
            { question: t('serviceSeo.faqs.q2.q'), answer: t('serviceSeo.faqs.q2.a') },
            { question: t('serviceSeo.faqs.q3.q'), answer: t('serviceSeo.faqs.q3.a') },
            { question: t('serviceSeo.faqs.q4.q'), answer: t('serviceSeo.faqs.q4.a') },
            { question: t('serviceSeo.faqs.q5.q'), answer: t('serviceSeo.faqs.q5.a') },
            { question: t('serviceSeo.faqs.q6.q'), answer: t('serviceSeo.faqs.q6.a') },
            { question: t('serviceSeo.faqs.q7.q'), answer: t('serviceSeo.faqs.q7.a') },
            { question: t('serviceSeo.faqs.q8.q'), answer: t('serviceSeo.faqs.q8.a') },
            { question: t('serviceSeo.faqs.q9.q'), answer: t('serviceSeo.faqs.q9.a') },
            { question: t('serviceSeo.faqs.q10.q'), answer: t('serviceSeo.faqs.q10.a') }
        ],
        comparisonTable: trConfig.comparisonTable
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-seo" disableApiHeroTextOverride={true} />
}
