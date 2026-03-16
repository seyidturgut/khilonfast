import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiEnvelope,
    HiUsers,
    HiSparkles,
    HiChartPie,
    HiPresentationChartLine,
    HiKey,
    HiChartBar,
    HiTrophy,
    HiUserGroup,
    HiRocketLaunch,
    HiShoppingCart,
    HiClipboardDocumentList,
    HiMagnifyingGlass,
    HiCheckBadge,
    HiGlobeAlt,
    HiArrowTrendingUp
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'
import { useRouteLocale } from '../utils/locale'

export default function B2BEmailMarketing() {
    const { t } = useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const homeServicesPath = `/${t('slugs.home')}#services`.replace(/\/\#/, '/#')

    useEffect(() => {
        document.title = isEn ? 'B2B Email Marketing | khilonfast' : 'B2B Email Pazarlama | khilonfast'
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Doğru Kitleye Ulaşın!',
            subtitle: 'Doğru hedeflemelerle e-posta kampanyalarınızı kişiselleştirin!',
            description: 'khilonfast ile hedef kitlenizi etkileyen e-posta kampanyaları oluşturun. Kişiselleştirilmiş içeriklerle açılma oranlarınızı artırın ve düşük tıklama oranlarını geride bırakın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/seo-yonetimi/TR_B2BEmailMarketing.avif',
            imageClassName: 'hero-main-img-content-production',
            imageContainerClassName: 'hero-image-container-content-production',
            hideBadge: true,
            badgeText: 'Doğru Kitleye Ulaşın! Etkileşimi Artırın!',
            badgeIcon: <HiEnvelope />,
            themeColor: '#FEF9C3'
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: homeServicesPath },
            { label: 'B2B Email Pazarlama' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Etkili B2B Email Stratejileriyle <span className="highlight-text">Dönüşüm Sağlayın</span>
                </>
            ),
            description: 'Doğru hedeflemeler ve kişiselleştirilmiş içeriklerle e-posta kampanyalarınızı optimize edin. khilonfast ile hedef kitlenizle bağlantı kurun ve dijital stratejinizi tamamlayın.',
            videoUrl: 'https://www.youtube.com/embed/FgRlnrHHnSk'
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
            description: 'Operasyonunuzu başarıya ulaştırmak için izlediğimiz 5 adımlı yol haritası.',
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
        afterProcessBanner: {
            title: (
                <>
                    khilonfast ile<br />
                    E-posta Kampanyalarınızı<br />
                    Kişiselleştirin!
                </>
            ),
            description: 'Kişiselleştirilmiş, etkili içeriklerle e-posta açılma ve tıklama oranlarınızı artırın. khilonfast ile doğru hedeflemelerle düşük dönüşüm oranlarını aşın ve hedef kitlenizle etkili iletişim kurun.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'B2B Email Pazarlama Çözümleri',
            description: 'khilonfast ile e-posta pazarlama süreçlerinizi en verimli şekilde yönetin ve reklam maliyeti olmadan büyüyün.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺18.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiKey />,
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Küçük işletmeler ve B2B pazarlama süreçlerine yeni adım atan firmalar için idealdir.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Düşük maliyetle başlayarak, sınırlı bir kitleye doğrudan ulaşma imkanı sunar. Bu paket, küçük firmalar için verimli ve ekonomik bir çözüm sağlar.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '₺25.000*',
                    period: 'Ay',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    isPopular: true,
                    icon: <HiChartBar />,
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: '5.000 e-posta ile daha etkili ve geniş çaplı pazarlama kampanyaları yapmak isteyen işletmeler için idealdir.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Daha geniş veri tabanıyla daha fazla potansiyel müşteriye ulaşmayı hedefleyen işletmeler için güçlü bir destek sağlar. Dijital pazarlamayı desteklemek için idealdir.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺39.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: t('pricing.buyNow'),
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: '10.000 e-posta ile müşteri kitlesini genişletmek isteyen firmalar için mükemmel bir çözümdür.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Yüksek hacimde müşteri datası ile güçlü ve optimize edilmiş kampanyalar düzenlemek isteyen firmalar için maksimum verimlilik sağlar.',
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
                    feature: 'Veritabanı Miktarı',
                    values: ['1,000 kişilik data', '5,000 kişilik data', '10,000 kişilik data']
                },
                {
                    feature: 'Email İçerik Üretimi',
                    values: [
                        'Temel HTML email tasarımı',
                        'İleri düzey HTML email tasarımı ve kişiselleştirme',
                        'İleri düzey HTML email tasarımı ve kişiselleştirme'
                    ]
                },
                {
                    feature: 'Dönüşüm Optimizasyonu',
                    values: [
                        'Temel dönüşüm takip araçları',
                        'Gelişmiş dönüşüm takip ve analiz',
                        'Profesyonel dönüşüm analiz ve raporlama'
                    ]
                },
                {
                    feature: 'Revizyon Hakkı',
                    values: ['1 revizyon hakkı', '2 revizyon hakkı', '3 revizyon hakkı']
                },
                {
                    feature: 'Gönderim Raporlaması',
                    values: ['Aylık rapor', 'Aylık rapor', 'Aylık rapor']
                }
            ],
            note: '(*) KDV hariç.'
        },
        testimonial: {
            quote: "E-posta pazarlamasında doğru hedefleme ile satış döngümüz %30 kısaldı. khilonfast'in B2B tecrübesi gerçekten fark yaratıyor.",
            author: 'Zeynep Aras',
            role: 'Pazarlama Müdürü'
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ]
    }

    const enConfig = {
        hero: {
            title: 'Activate Pipeline Through B2B Email',
            subtitle: 'Personalize campaigns and reach decision-makers with precision.',
            description: 'khilonfast builds high-converting outbound and nurture email systems that improve open rates, increase reply quality, and accelerate sales cycles.',
            buttonText: t('common.startNow'),
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/seo-yonetimi/TR_B2BEmailMarketing.avif',
            imageClassName: 'hero-main-img-content-production',
            imageContainerClassName: 'hero-image-container-content-production',
            hideBadge: true,
            badgeText: 'Reach the Right Buyer at the Right Time',
            badgeIcon: <HiEnvelope />,
            themeColor: '#FEF9C3'
        },
        breadcrumbs: [
            { label: t('nav.services'), path: homeServicesPath },
            { label: 'B2B Email Marketing' }
        ],
        videoShowcase: {
            tag: 'Watch & Learn',
            title: (
                <>
                    Convert Leads with <span className="highlight-text">Performance Email Systems</span>
                </>
            ),
            description: 'From segmentation to deliverability, we operationalize email as a measurable growth channel for B2B teams.',
            videoUrl: 'https://www.youtube.com/embed/FgRlnrHHnSk'
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
            tag: '4-Step Framework',
            title: 'How It Works?',
            description: 'A practical system that converts cold lists into qualified commercial conversations.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                { stepNumber: 1, title: 'Step 1: Data Preparation', description: 'We clean, segment, and structure your list for reliable campaign performance.', icon: <HiUsers /> },
                { stepNumber: 2, title: 'Step 2: Copy & Design', description: 'We create mobile-ready templates and conversion-focused email copy.', icon: <HiSparkles /> },
                { stepNumber: 3, title: 'Step 3: Delivery & Testing', description: 'A/B testing identifies best-performing subjects, timing, and message variants.', icon: <HiEnvelope /> },
                { stepNumber: 4, title: 'Step 4: Reporting', description: 'You receive actionable reports that prioritize next steps for pipeline growth.', icon: <HiPresentationChartLine /> }
            ]
        },
        afterProcessBanner: {
            title: (
                <>
                    Personalize Your<br />
                    Email Campaigns<br />
                    with khilonfast!
                </>
            ),
            description: 'Increase your email open and click rates with personalized, effective content. Overcome low conversion rates with precise targeting and communicate efficiently with your audience using khilonfast.'
        },
        pricingSection: {
            tag: 'Service Packages',
            title: 'B2B Email Marketing Solutions',
            description: 'Choose the package aligned with your outbound volume and growth ambition.',
            packages: [
                { id: 'core', name: 'Core', price: '$459*', period: t('pricing.monthly'), description: 'Foundational package for focused outreach programs.', icon: <HiKey />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'growth', name: 'Growth', price: '$639*', period: t('pricing.monthly'), description: 'Scale package for broader outreach and stronger conversion velocity.', isPopular: true, icon: <HiChartBar />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'ultimate', name: 'Ultimate', price: '$999*', period: t('pricing.monthly'), description: 'Advanced package for high-volume outbound and enterprise-grade execution.', icon: <HiTrophy />, features: [], buttonText: t('pricing.buyNow') }
            ]
        },
        testimonial: {
            quote: 'With khilonfast, our B2B email strategy shortened the sales cycle and improved reply quality significantly.',
            author: 'Zeynep Aras',
            role: 'Marketing Manager'
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ]
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-b2b-email" disableApiHeroTextOverride={true} />
}
