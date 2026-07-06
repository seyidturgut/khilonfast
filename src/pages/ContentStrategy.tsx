import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiDocumentText,
    HiMagnifyingGlass,
    HiSparkles,
    HiArrowTrendingUp,
    HiTrophy,
    HiCheckBadge,
    HiCreditCard,
    HiKey,
    HiClipboardDocumentList,
    HiGlobeAlt,
    HiChartPie,
    HiUserGroup
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'
import { useRouteLocale } from '../utils/locale'

const AI_ANSWER_TR = {
    question: 'İçerik Stratejisi hizmeti nedir?',
    answer: 'khilonfast İçerik Stratejisi hizmeti, hedef kitle analizi, içerik planlama ve SEO uyumlu önerilerle markanız için kapsamlı bir yol haritası sunan tek seferlik bir stratejik belgedir. Neyi, kime ve neden ürettiğinizi netleştirerek içerik üretim sürecinizi rayına oturtur.'
};
const AI_ANSWER_EN = {
    question: 'What is a Content Strategy service?',
    answer: 'khilonfast\'s Content Strategy service delivers a one-time strategic document covering audience analysis, editorial planning, and SEO-aligned content recommendations. It gives your team a clear roadmap for what to produce, for whom, and why, aligned with your growth objectives.'
};

export default function ContentStrategy() {
    const { t, i18n } = useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'

    useEffect(() => {
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Doğru İçerik Stratejisi ile Hedef Kitlenize Ulaşın!',
            subtitle: 'Hedef kitlenizi anlayın ve etkili içerik stratejileri oluşturun!',
            description: 'khilonfast ile marka hedeflerinize uygun, stratejik içerikler oluşturarak hedef kitlenizle güçlü bir bağ kurun. Çeşitli içerik formatlarıyla etkileşimi artırın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/TR_IcerikStratejisi.avif',
            imageClassName: 'hero-main-img-content-production',
            imageContainerClassName: 'hero-image-container-content-production',
            hideBadge: true,
            badgeText: "Stratejik İçerik Planı! Marka Otoritesi!",
            badgeIcon: <HiDocumentText />,
            themeColor: '#FEF3C7' // Warm yellow theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'İçerik Stratejisi' }
        ],
        videoShowcase: {
            tag: 'İçerik Gücü',
            title: (
                <>
                    Etkili İçerik Stratejileriyle
                    <span className="highlight"> Marka Bağlılığı Oluşturun</span>
                </>
            ),
            description: 'Hedef kitlenizin ilgisini çeken içerikler üretin. khilonfast ile doğru içerik stratejileri geliştirerek marka bilinirliğinizi artırın.',
            videoUrl: 'https://www.youtube.com/embed/zfz5tG3i5ck'
        },

        processSection: {
            tag: '5 adımda khilonfast',
            title: 'Nasıl Çalışır?',
            description: 'Sadece birkaç adımda dijital pazarlama sürecinizi başlatın. Tüm adımlar şeffaf, hızlı ve ölçülebilir şekilde tasarlandı.',
            videoUrl: 'https://vimeo.com/1128822985?fl=pl&fe=cm',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Satın Al',
                    description: 'İhtiyacınıza uygun paketi seçin. Satın alma işlemi tamamlandığında süreç otomatik olarak başlar.',
                    icon: <HiCreditCard />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Yetkilendir',
                    description: 'khilonfast ekibine gerekli erişim izinlerini verin. Yetkilendirme detayları için tıklayın>>',
                    icon: <HiKey />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Brief Ver',
                    description: 'Size gönderilen formdaki soruları cevaplayarak hedeflerinizi, hedef kitlenizi ve marka dilinizi paylaşın. Bu form, stratejinin temelini oluşturur.',
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Analiz',
                    description: 'khilonfast ekibi brief\'inizi analiz eder ve sizi nasıl anladığını gösteren de-brief raporunu hazırlar. Bu rapor, hizmetin yönünü birlikte netleştirmemizi sağlar.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 5,
                    title: 'Adım 5: Onay',
                    description: 'De-brief raporunun onaylanması ile isteyin. hizmet kurulumları başlar ve ölçümlemeler 1 hafta içerisinde aktif edilir.',
                    icon: <HiCheckBadge />
                }
            ]
        },
        authorizationSection: {
            title: "YETKİLENDİRME",
            description: "Google Analytics veya Google Search Console yetkilendirmesi içerik stratejisi hizmeti için zorunlu değildir; ancak bu araçlar web sitenizde tanımlıysa, khilonfast verileri daha derinlemesine analiz ederek stratejinizi çok daha doğru yönlendirebilir. Yetkilendirme adımlarına aşağıdaki kutucuklardan ulaşabilirsiniz.",
            cards: [
                {
                    title: "Google Search Console Yetkilendirme",
                    description: "Detaylı bir içerik stratejisi için Google Search Console yetkilerini ekleyin.",
                    highlightText: "Organik görünürlüğünüzü analiz ederek performansınızı geliştirin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/hizmetlerimiz/google-search-console-kurulum-akisi",
                    theme: "light" as const
                },
                {
                    title: "Google Analytics Yetkilendirme",
                    description: "Detaylı analiz için Google Analytics erişimlerini tanımlayın.",
                    highlightText: "Analiz süreçlerinizin ölçüm doğruluğunu artırın.",
                    buttonText: "KEŞFET",
                    buttonLink: "/google-analytics-kurulum-akisi",
                    theme: "dark" as const
                }
            ]
        },

        pricingSection: {
            tag: 'İçerik Stratejisi Paketi',
            title: 'İçerik Stratejisi Çözümleri',
            description: 'Doğru içerik stratejisiyle markanızın hedef kitlesine ulaşın. khilonfast ile içerik üretiminizi stratejik bir düzeye taşıyın.',
            packages: [
                {
                    id: 'single-plan',
                    productKey: 'service-content-strategy',
                    name: 'İçerik Stratejisi Paketi',
                    price: '₺80.000*',
                    period: 'tek sefer',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    isPopular: false,
                    buttonText: 'Satın Al',
                    icon: <HiKey />,
                    features: [
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Kimler İçin Uygun</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>İşletmesi için profesyonel bir içerik stratejisi oluşturmak isteyen her ölçekten firmaya uygundur. Strateji belgesi, içerik üretim süreçlerinde rehberlik edecek ve firmanın içerik pazarlama hedeflerine ulaşmasına yardımcı olacaktır.</span>
                        </div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Neden Tercih Edilmeli</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>İçerik Stratejisi Paketi, içerik üretimini optimize etmek, hedef kitlesi ile etkili bir iletişim kurmak ve SEO uyumlu içerikler üreterek dijital görünürlüğü artırmak isteyen firmalar için mükemmel bir çözümdür. Doküman, firmanın uzun vadeli içerik stratejisini belirlemesine yardımcı olur ve sürdürülebilir içerik planlaması sağlar.</span>
                        </div>
                    ]
                }
            ]
        },
        comparisonTable: {
            headers: [
                { title: i18n.language === 'en' ? 'Content Strategy Package' : 'İçerik Stratejisi Paketi', icon: <HiCheckBadge /> }
            ],
            rows: i18n.language === 'en' ? [
                { feature: 'Document Content', values: ['A single comprehensive content strategy document'] },
                { feature: 'Strategy Scope', values: ['Audience analysis, content planning, and SEO-aligned content recommendations'] },
                { feature: 'Target Audience Definition', values: [true] },
                { feature: 'Content Topics & Frequency', values: [true] }
            ] : [
                { feature: 'Doküman İçeriği', values: ['Tek bir kapsamlı içerik stratejisi belgesi'] },
                { feature: 'Strateji Kapsamı', values: ['Hedef kitle analizi, içerik planlama, SEO uyumlu içerik önerileri'] },
                { feature: 'Hedef Kitle Tanımlaması', values: [true] },
                { feature: 'İçerik Konuları ve Frekansı', values: [true] }
            ],
            note: i18n.language === 'en' ? '(*) Prices exclude VAT.' : '(*) KDV hariçtir.'
        },
        testimonial: {
            quote: "İçerik stratejisi dökümanı sayesinde içerik üretim sürecimiz rayına oturdu. Artık neyi, neden ve kime ürettiğimizi çok daha iyi biliyoruz.",
            author: "Zeynep Aydın",
            role: "Pazarlama Müdürü"
        },
        approachSection: {
            title: 'khilonfast Yaklaşımı',
            description: 'Markanızın potansiyelini 360 derece stratejilerle açığa çıkarıyoruz.',
            items: [
                {
                    title: '360 Derece Bakış Açısı',
                    subtitle: 'Her Detayı Kapsayan khilonfast Yaklaşımı',
                    description: 'Khilon olarak pazarlama dünyasına geniş bir pencereden bakıyoruz. 360 derece bakış açısı, tek bir parçaya odaklanmak yerine tüm süreçleri kapsayan bir anlayış gerektiriyor. Bu kapsamlı yaklaşım, markaların ihtiyaçlarını derinlemesine anlayarak, tüm pazarlama kanallarını entegre bir strateji ile yönetmemize olanak tanıyor. khilon ile aldığınız en mikro hizmette dahi, size 360 derece bakış açısı ile o işi hedeflerinize, amacınıza, stratejinize uyumlu hale getiriyoruz.',
                    icon: <HiGlobeAlt />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/Bakis-Acisi.avif'
                },
                {
                    title: 'Büyüme Odaklı Stratejiler',
                    subtitle: 'Sektöre Özel Büyüme Planları',
                    description: 'Her sektörün kendine özgü dinamikleri bulunuyor ve Khilon, bu farklılıkları dikkate alarak büyüme stratejilerinizi geliştiriyor. Markanızın bulunduğu sektöre özel olarak hazırladığımız planlar, hedef kitlenizle daha etkin iletişim kurmanızı sağlıyoruz. Sürdürülebilir büyüme için pazardaki eğilimleri yakından takip eder ve sektörel farkındalık ile stratejilerinizi yönetiyoruz.',
                    icon: <HiArrowTrendingUp />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/buyume-dakli.avif'
                },
                {
                    title: 'Veri Odaklı Pazarlama',
                    subtitle: 'Daha Fazla Veri, Daha Fazla Başarı',
                    description: 'Khilon, veriyi sadece toplamakla kalmaz, aksiyona dönüştürülebilir içgörüler sunar. Tüketici davranışlarını analiz ederek, dönüşüm oranlarını optimize eden çözümler üretiriz. Bu şekilde, markanızın mevcut durumunu analiz etmenin ötesine geçerek, veriye dayalı tahminlerle geleceğe yönelik adımlar atmanızı sağlar. Müşteri segmentasyonu, kişiselleştirilmiş kampanyalar ve daha etkili hedeflemeler ile veriyi bir fırsata dönüştürmenize yardımcı oluyoruz.',
                    icon: <HiChartPie />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/veri-odakli.avif'
                },
                {
                    title: 'İnovasyon ile Fark',
                    subtitle: 'Rakiplerden Bir Adım Önde Olun',
                    description: 'Pazarlama dünyasında kalabalığın içinde kaybolmamak için sürekli yenilikçi olmak gerekiyor. Khilon, ileri veri analitiği ve yapay zeka destekli araçları kullanarak müşterilerine yenilikçi çözümler sunar. Bu sayede, rakiplerinizden bir adım önde olmanızı sağlar, markanızı daima yeniliklerle destekliyoruz.',
                    icon: <HiSparkles />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/inovasyon-fark.avif'
                },
                {
                    title: 'Stratejik İş Ortağı',
                    subtitle: 'Uzun Vadeli Başarı İçin Güvenilir Partneriniz',
                    description: 'Khilon sadece bir hizmet sağlayıcı değil, uzun vadeli başarılar için stratejik bir iş ortağıdır. İş hedeflerinizi tam olarak anlayarak, sadece kısa vadeli kampanyalar değil, uzun vadeli ve sürdürülebilir başarı stratejileri geliştiririz. Markanızın sürekli büyümesi ve başarıya ulaşması için güvenebileceğiniz bir iş ortağı olarak yanınızdayız.',
                    icon: <HiUserGroup />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/is-ortagi.avif'
                }
            ]
        },
        faqs: [
            { question: t('serviceContentStrategy.faqs.q1.q'), answer: t('serviceContentStrategy.faqs.q1.a') },
            { question: t('serviceContentStrategy.faqs.q2.q'), answer: t('serviceContentStrategy.faqs.q2.a') },
            { question: t('serviceContentStrategy.faqs.q3.q'), answer: t('serviceContentStrategy.faqs.q3.a') },
            { question: t('serviceContentStrategy.faqs.q4.q'), answer: t('serviceContentStrategy.faqs.q4.a') },
            { question: t('serviceContentStrategy.faqs.q5.q'), answer: t('serviceContentStrategy.faqs.q5.a') },
            { question: t('serviceContentStrategy.faqs.q6.q'), answer: t('serviceContentStrategy.faqs.q6.a') },
            { question: t('serviceContentStrategy.faqs.q7.q'), answer: t('serviceContentStrategy.faqs.q7.a') },
            { question: t('serviceContentStrategy.faqs.q8.q'), answer: t('serviceContentStrategy.faqs.q8.a') },
            { question: t('serviceContentStrategy.faqs.q9.q'), answer: t('serviceContentStrategy.faqs.q9.a') },
            { question: t('serviceContentStrategy.faqs.q10.q'), answer: t('serviceContentStrategy.faqs.q10.a') },
            { question: t('serviceContentStrategy.faqs.q11.q'), answer: t('serviceContentStrategy.faqs.q11.a') }
        ]
    }

    const enConfig = {
        hero: {
            title: 'Turn Content into a Revenue Engine',
            subtitle: 'Build a strategy your audience actually engages with.',
            description: 'With khilonfast, design an insight-led content strategy aligned with your growth objectives, funnel stages, and buyer intent.',
            buttonText: 'Start Now',
            buttonLink: '#pricing',
            image: '/TR_IcerikStratejisi.avif',
            imageClassName: 'hero-main-img-content-production',
            imageContainerClassName: 'hero-image-container-content-production',
            hideBadge: true,
            badgeText: 'Strategic Content Framework for Scalable Growth',
            badgeIcon: <HiDocumentText />,
            themeColor: '#FEF3C7'
        },
        breadcrumbs: [
            { label: t('header.services'), path: `/${t('slugs.home')}#services`.replace(/\/\#/, '/#') },
            { label: t('header.menuItems.services.content.title') }
        ],
        videoShowcase: {
            tag: 'Content Intelligence',
            title: <>Create Content That Builds Brand Trust and Demand</>,
            description: 'Develop high-impact narratives with channel-fit formats and SEO-ready planning to improve reach, engagement, and conversion quality.',
            videoUrl: 'https://www.youtube.com/embed/zfz5tG3i5ck'
        },
        processSection: {
            tag: '5-Step Workflow',
            title: 'How It Works?',
            description: 'Launch a measurable content strategy with a clear execution roadmap.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                { stepNumber: 1, title: 'Step 1: Purchase', description: t('process.steps.buy.description'), icon: <HiCreditCard /> },
                { stepNumber: 2, title: 'Step 2: Authorize', description: t('process.steps.auth.description'), icon: <HiKey /> },
                { stepNumber: 3, title: 'Step 3: Submit Brief', description: t('process.steps.brief.description'), icon: <HiClipboardDocumentList /> },
                { stepNumber: 4, title: 'Step 4: Analysis', description: t('process.steps.analysis.description'), icon: <HiMagnifyingGlass /> },
                { stepNumber: 5, title: 'Step 5: Approval', description: t('process.steps.approval.description'), icon: <HiCheckBadge /> }
            ]
        },
        pricingSection: {
            tag: 'Content Strategy Package',
            title: 'Content Strategy Solution',
            description: 'Align your message architecture, editorial plan, and SEO direction under one strategic document.',
            packages: [
                {
                    id: 'single-plan',
                    name: 'Content Strategy Solution',
                    price: '$2,000',
                    period: 'one-time*',
                    description: 'A complete strategic document tailored to your market and growth goals.',
                    isPopular: true,
                    icon: <HiTrophy />,
                    buttonText: t('pricing.buyNow'),
                    features: [
                        'Professional strategic framework for any business size',
                        'Execution-ready guidance for content teams',
                        'Business-goal aligned planning model',
                        'SEO-focused editorial architecture',
                        'Long-term and sustainable growth direction'
                    ]
                }
            ]
        },
        testimonial: {
            quote: 'After implementing the strategy document, our content production became faster, more consistent, and conversion-driven.',
            author: 'Zeynep Aydin',
            role: 'Marketing Manager'
        },
        faqs: [
            { question: t('serviceContentStrategy.faqs.q1.q'), answer: t('serviceContentStrategy.faqs.q1.a') },
            { question: t('serviceContentStrategy.faqs.q2.q'), answer: t('serviceContentStrategy.faqs.q2.a') },
            { question: t('serviceContentStrategy.faqs.q3.q'), answer: t('serviceContentStrategy.faqs.q3.a') },
            { question: t('serviceContentStrategy.faqs.q4.q'), answer: t('serviceContentStrategy.faqs.q4.a') },
            { question: t('serviceContentStrategy.faqs.q5.q'), answer: t('serviceContentStrategy.faqs.q5.a') },
            { question: t('serviceContentStrategy.faqs.q6.q'), answer: t('serviceContentStrategy.faqs.q6.a') },
            { question: t('serviceContentStrategy.faqs.q7.q'), answer: t('serviceContentStrategy.faqs.q7.a') },
            { question: t('serviceContentStrategy.faqs.q8.q'), answer: t('serviceContentStrategy.faqs.q8.a') },
            { question: t('serviceContentStrategy.faqs.q9.q'), answer: t('serviceContentStrategy.faqs.q9.a') },
            { question: t('serviceContentStrategy.faqs.q10.q'), answer: t('serviceContentStrategy.faqs.q10.a') },
            { question: t('serviceContentStrategy.faqs.q11.q'), answer: t('serviceContentStrategy.faqs.q11.a') }
        ],
        comparisonTable: trConfig.comparisonTable
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} aiAnswer={isEn ? AI_ANSWER_EN : AI_ANSWER_TR} serviceKey="service-content-strategy" disableApiHeroTextOverride />
}
