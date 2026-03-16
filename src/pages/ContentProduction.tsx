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
    const { t } = useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const homeServicesPath = `/${t('slugs.home')}#services`.replace(/\/\#/, '/#')

    useEffect(() => {
        document.title = isEn ? 'Content Production Services | khilonfast' : 'İçerik Üretimi | khilonfast'
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
            tag: 'Nasıl Çalışır?',
            title: 'Hizmet Süreci',
            description: 'İçerik üretim stratejinizi hayata geçirmek için izlediğimiz 5 adımlı yol haritası.',
            videoUrl: 'https://player.vimeo.com/video/1128822985',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Satın Al',
                    description: 'İhtiyacınıza uygun paketi seçin. Satın alma işlemi tamamlandığında süreç otomatik olarak başlar.',
                    icon: <HiShoppingCart />
                },
                {
                    stepNumber: 2,
                    title: 'Yetkilendir',
                    description: <p>khilonfast ekibine gerekli erişim izinlerini verin. Yetkilendirme detayları için <a href="#authorization" style={{ textDecoration: 'underline' }}>tıklayın</a></p>,
                    icon: <HiKey />
                },
                {
                    stepNumber: 3,
                    title: 'Brief Ver',
                    description: 'Size gönderilen formdaki soruları cevaplayarak hedeflerinizi, hedef kitlenizi ve marka dilinizi paylaşın. Bu form, stratejinin temelini oluşturur.',
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 4,
                    title: 'Analiz',
                    description: 'khilonfast ekibi brief’inizi analiz eder ve sizi nasıl anladığını gösteren de-brief raporunu hazırlar. Bu rapor, hizmetin yönünü birlikte netleştirmemizi sağlar.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 5,
                    title: 'Onay',
                    description: 'De-brief raporunun onaylanması ile isteyin. hizmet kurulumları başlar ve ölçümlemeler 1 hafta içerisinde aktif edilir.',
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
            rows: [
                {
                    feature: 'Blog Yazısı',
                    values: ['4 içerik x 750 kelime', '6 içerik x 750 kelime', '8 içerik x 750 kelime']
                },
                {
                    feature: 'Görsel',
                    values: ['-', true, true]
                },
                {
                    feature: 'Revizyon Hakkı',
                    values: ['1', '2', '4']
                }
            ],
            note: '(*) KDV hariç.'
        },
        testimonial: {
            quote: 'İçerik üretimindeki tıkanıklığımızı khilonfast ile aştık. Düzenli ve kaliteli içerikler sayesinde organik trafiğimizde %40 artış gördük.',
            author: 'Zeynep Aydın',
            role: 'Pazarlama Müdürü'
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ],
        authorizationSection: {
            title: "İçerik Üretimi Yetkilendirme Adımları",
            description: "Hizmet paketine uygun olarak, aşağıda yer alan platformların yetkilendirme adımlarını bulabilirsiniz. Bu adımlar, içerik stratejinizin doğru verilerle beslenmesi için gereklidir.",
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
        }
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
            { label: t('nav.services'), path: homeServicesPath },
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
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ],
        authorizationSection: {
            title: "Content Production Authorization Steps",
            description: "In accordance with your service package, you can find the authorization steps for the platforms below.",
            cards: [
                {
                    title: "Google Search Console Authorization",
                    description: "Add Google Search Console permissions for a detailed content strategy.",
                    highlightText: "Improve your performance by analyzing your organic visibility.",
                    buttonText: "EXPLORE",
                    buttonLink: "/en/services/google-search-console-setup-flow",
                    theme: "light" as const
                },
                {
                    title: "Google Analytics Authorization",
                    description: "Define Google Analytics access for detailed analysis.",
                    highlightText: "Increase the measurement accuracy of your analysis processes.",
                    buttonText: "EXPLORE",
                    buttonLink: "/en/google-analytics-setup-flow",
                    theme: "dark" as const
                }
            ]
        }
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-content-production" disableApiHeroTextOverride={true} />
}
