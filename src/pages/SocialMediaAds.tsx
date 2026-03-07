import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiChartBar,
    HiKey,
    HiTrophy,
    HiMagnifyingGlass,
    HiUserGroup,
    HiCheckBadge,
    HiPresentationChartLine,
    HiRocketLaunch,
    HiShoppingCart,
    HiClipboardDocumentList,
    HiGlobeAlt,
    HiArrowTrendingUp,
    HiChartPie,
    HiSparkles
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function SocialMediaAds() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
    const isEn = currentLang === 'en'
    const homeServicesPath = `/${t('slugs.home')}#services`.replace(/\/\#/, '/#')

    useEffect(() => {
        document.title = isEn ? 'Social Media Advertising | khilonfast' : 'Sosyal Medya Reklamcılığı | khilonfast'
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Hedef Kitlenizi Büyütün!',
            subtitle: 'Yetersiz bütçe yönetimi sorununu ortadan kaldırın!',
            description: 'khilonfast ile doğru platform ve strateji seçimiyle sosyal medyada bütçenizi verimli kullanın. Hedef kitlenize en etkili içeriklerle ulaşarak markanızı büyütün.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/sosyal-medya-reklamciligi/hero.png',
            hideBadge: true,
            badgeText: 'Etkileşimi Artırın! Markanızı Büyütün!',
            badgeIcon: <HiChartBar />,
            themeColor: '#ECFDF5'
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: homeServicesPath },
            { label: 'Sosyal Medya Reklamcılığı' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    <span className="highlight-text">Yüksek Etkileşim </span> Sağlayın
                </>
            ),
            description: 'Hedef kitlenizin bulunduğu doğru platformlarda, yaratıcı ve sürekli içeriklerle görünür olun. khilonfast ile sosyal medya kampanyalarınızı optimize edin ve sonuçları hızla görün.',
            videoUrl: 'https://www.youtube.com/embed/1rp63c8i-20'
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
            description: 'Sosyal medya varlığınızı güçlendirmek için izlediğimiz 5 adımlı yol haritası.',
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
        authorizationSection: {
            title: "Sosyal Medya Hesapları Yetkilendirme Adımları",
            description: "Aldığınız hizmet paketine uygun olarak, aşağıda yer alan sosyal medya platformlarının yetkilendirme adımlarını bulabilirsiniz. Bu adımlar, kampanyalarınızın doğru platformlarda etkin biçimde yönetilmesi için gereklidir.",
            cards: [
                {
                    title: "LinkedIn Reklamları",
                    description: "Hizmeti başlatmak için LinkedIn Ads erişimlerini tanımlayın.",
                    highlightText: "B2B hedef kitlenizle doğru temas noktalarında buluşun.",
                    buttonText: "KEŞFET",
                    buttonLink: "/linkedin-reklamlari-kurulum-akisi-khilonfast",
                    theme: "light" as const
                },
                {
                    title: "TikTok Reklamları",
                    description: "Hizmeti başlatmak için TikTok For Business kurulumunu tamamlayın.",
                    highlightText: "Z kuşağı ve dinamik kitlelere yaratıcı içeriklerle ulaşın.",
                    buttonText: "KEŞFET",
                    buttonLink: "/tiktok-kurulum-akisi",
                    theme: "dark" as const
                },
                {
                    title: "Meta (Facebook & Instagram) Reklamları",
                    description: "Hizmeti başlatmak için Meta Business Suite erişimlerini tanımlayın.",
                    highlightText: "Geniş kitlelere ulaşarak marka bilinirliğinizi ve satışlarınızı artırın.",
                    buttonText: "KEŞFET",
                    buttonLink: "/meta-facebook-instagram-reklamlari-kurulum-akisi",
                    theme: "light" as const
                }
            ]
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Sosyal Medya Reklam Çözümleri',
            description: 'Markanızı sosyal medyada büyütmek için en uygun adımları atın. khilonfast ile sosyal medya reklam kampanyalarınızı hemen başlatın. İster yeni başlayın ister genişletmek isteyin, size uygun bir çözüm var.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺32.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiKey />,
                    features: [],
                    buttonText: t('pricing.buyNow')
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
                    buttonText: t('pricing.buyNow')
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺85.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: t('pricing.buyNow')
                }
            ]
        },
        testimonial: {
            quote: "Sosyal medya reklam bütçemizi khilonfast'a emanet ettikten sonra maliyetlerimizi sabit tutarak erişimimizi 3 katına çıkardık.",
            author: 'Aslı Yılmaz',
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
            title: 'Scale Your Audience with Precision',
            subtitle: 'Eliminate inefficient budget allocation across social channels.',
            description: 'khilonfast turns social advertising into predictable growth through sharp platform selection, audience intelligence, and high-converting creative frameworks.',
            buttonText: t('common.startNow'),
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/sosyal-medya-reklamciligi/hero.png',
            hideBadge: true,
            badgeText: 'Grow Engagement. Grow Revenue.',
            badgeIcon: <HiChartBar />,
            themeColor: '#ECFDF5'
        },
        breadcrumbs: [
            { label: t('nav.services'), path: homeServicesPath },
            { label: 'Social Media Advertising' }
        ],
        videoShowcase: {
            tag: 'Watch & Learn',
            title: (
                <>
                    Drive <span className="highlight-text">High-Intent Engagement</span>
                </>
            ),
            description: 'Activate the right channel mix, launch stronger creatives, and improve campaign efficiency with a measurable, data-led execution model.',
            videoUrl: 'https://www.youtube.com/embed/1rp63c8i-20'
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
            tag: '4-Step Delivery',
            title: 'How It Works?',
            description: 'A focused execution cycle built to improve social ad efficiency month after month.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Step 1: Audit & Persona',
                    description: 'We evaluate audience behavior, market context, and define high-value customer personas.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 2,
                    title: 'Step 2: Media Blueprint',
                    description: 'A strategic media plan is built around channel mix, budget pacing, and funnel stage goals.',
                    icon: <HiPresentationChartLine />
                },
                {
                    stepNumber: 3,
                    title: 'Step 3: Campaign Launch',
                    description: 'We deploy ad sets, activate creatives, and validate tracking integrity before scale.',
                    icon: <HiRocketLaunch />
                },
                {
                    stepNumber: 4,
                    title: 'Step 4: Reporting & Scale',
                    description: 'We prioritize winners, scale profitable segments, and report progress transparently.',
                    icon: <HiCheckBadge />
                }
            ]
        },
        authorizationSection: {
            title: "Social Media Account Authorization Steps",
            description: "Depending on your service package, find the authorization steps for social media platforms below. These steps are essential for effectively managing your campaigns across the right platforms.",
            cards: [
                {
                    title: "LinkedIn Ads",
                    description: "Define LinkedIn Ads access to start the service.",
                    highlightText: "Meet your B2B audience at the right touchpoints.",
                    buttonText: "EXPLORE",
                    buttonLink: "/linkedin-reklamlari-kurulum-akisi-khilonfast",
                    theme: "light" as const
                },
                {
                    title: "TikTok Ads",
                    description: "Complete TikTok For Business setup to start the service.",
                    highlightText: "Reach Gen Z and dynamic audiences with creative content.",
                    buttonText: "EXPLORE",
                    buttonLink: "/tiktok-kurulum-akisi",
                    theme: "dark" as const
                },
                {
                    title: "Meta (Facebook & Instagram) Ads",
                    description: "Define Meta Business Suite access to start the service.",
                    highlightText: "Increase brand awareness and sales by reaching broad audiences.",
                    buttonText: "EXPLORE",
                    buttonLink: "/meta-facebook-instagram-reklamlari-kurulum-akisi",
                    theme: "light" as const
                }
            ]
        },
        pricingSection: {
            tag: 'Service Packages',
            title: 'Channel-Focused Social Advertising',
            description: 'Choose the package aligned with your growth stage and scale with khilonfast.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '$799*',
                    period: t('pricing.monthly'),
                    description: 'Launch package for structured social ad activation.',
                    icon: <HiKey />,
                    features: [],
                    buttonText: t('pricing.buyNow')
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '$1,199*',
                    period: t('pricing.monthly'),
                    description: 'Scale package for stronger acquisition and conversion velocity.',
                    isPopular: true,
                    icon: <HiChartBar />,
                    features: [],
                    buttonText: t('pricing.buyNow')
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '$2,149*',
                    period: t('pricing.monthly'),
                    description: 'Advanced package for aggressive, multi-channel growth.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: t('pricing.buyNow')
                }
            ]
        },
        testimonial: {
            quote: 'After switching to khilonfast, we tripled qualified reach while maintaining budget discipline.',
            author: 'Asli Yilmaz',
            role: 'Marketing Manager'
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ]
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-social-ads" disableApiHeroTextOverride={true} />
}
