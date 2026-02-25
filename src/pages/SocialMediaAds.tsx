import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiChartBar,
    HiKey,
    HiTrophy,
    HiMagnifyingGlass,
    HiChatBubbleLeftRight,
    HiUserGroup,
    HiCheckBadge,
    HiPresentationChartLine,
    HiRocketLaunch,
    HiSignal
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
            title: 'Stratejik Kampanya Yönetimi',
            description: 'Doğru platform, doğru hedefleme, maksimum etkileşim.',
            items: [
                {
                    title: 'Platform Analizi',
                    subtitle: 'Kanal Seçimi',
                    description: 'Markanız için en doğru sosyal medya kanallarını (Meta, LinkedIn, TikTok) analiz ediyor ve bütçenizi oraya yönlendiriyoruz.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    title: 'Hedef Kitle Optimizasyonu',
                    subtitle: 'Nokta Atışı Erişim',
                    description: 'Demografik ve davranışsal verilerle doğru kişilere doğru mesajla ulaşmanızı sağlıyor, boşa harcamayı önlüyoruz.',
                    icon: <HiUserGroup />
                },
                {
                    title: 'Kreatif Denetim',
                    subtitle: 'Görsel Etki',
                    description: 'Reklam görsellerinizin ve metinlerinizin performansını analiz ediyor, tıklama oranlarını (CTR) artıracak öneriler sunuyoruz.',
                    icon: <HiChatBubbleLeftRight />
                },
                {
                    title: 'Veri Odaklı Yönetim',
                    subtitle: 'Ölçülebilir Başarı',
                    description: 'Her etkileşimi ve dönüşümü takip ediyor, kampanyaları veriye dayalı içgörülerle optimize ediyoruz.',
                    icon: <HiPresentationChartLine />
                },
                {
                    title: 'Remarketing',
                    subtitle: 'Tekrar Hedefleme',
                    description: 'Sitenizi ziyaret eden ancak satın almayan kullanıcıları tekrar hedefleyerek dönüşüm şansını artırıyoruz.',
                    icon: <HiSignal />
                }
            ]
        },
        processSection: {
            tag: '4 Adımda Sosyal Medya',
            title: 'Nasıl Çalışır?',
            description: 'Sosyal medya varlığınızı güçlendirmek için izlediğimiz kanıtlanmış yol haritası.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Analiz & Persona',
                    description: 'Hedef kitlenizi ve rakiplerinizi analiz eder, ideal müşteri profilini (persona) oluştururuz.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Medya Planı',
                    description: 'Hangi platformda, ne zaman ve nasıl reklam çıkılacağını belirleyen stratejik planı hazırlarız.',
                    icon: <HiPresentationChartLine />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Kampanya Kurulumu',
                    description: 'Görselleri ve metinleri hazırlar, reklam setlerini oluşturur ve yayına alırız.',
                    icon: <HiRocketLaunch />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Rapor & Scale',
                    description: 'Sonuçları analiz eder, başarılı kampanyaları ölçeklendirir (scale) ve düzenli raporlarız.',
                    icon: <HiCheckBadge />
                }
            ]
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Platform Odaklı Paketler',
            description: 'khilonfast ile Meta, LinkedIn ve TikTok reklamlarınızı tek bir noktadan profesyonelce yönetin.',
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
            title: 'Performance-Led Campaign Management',
            description: 'Right platform, right message, right audience.',
            items: [
                {
                    title: 'Channel Intelligence',
                    subtitle: 'Platform Fit',
                    description: 'We identify the highest-value platforms for your brand and align media spend with conversion potential.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    title: 'Audience Optimization',
                    subtitle: 'Precision Targeting',
                    description: 'Behavioral and demographic segmentation ensures your message reaches the people most likely to convert.',
                    icon: <HiUserGroup />
                },
                {
                    title: 'Creative Performance Audit',
                    subtitle: 'CTR Uplift',
                    description: 'We continuously test visuals and copy to improve click-through rates and lower acquisition costs.',
                    icon: <HiChatBubbleLeftRight />
                },
                {
                    title: 'Data-Led Optimization',
                    subtitle: 'Measurable Growth',
                    description: 'Each conversion signal is tracked and translated into weekly optimization actions.',
                    icon: <HiPresentationChartLine />
                },
                {
                    title: 'Remarketing Systems',
                    subtitle: 'Recovery Campaigns',
                    description: 'Re-engage high-intent users who visited but did not convert to maximize return on ad spend.',
                    icon: <HiSignal />
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

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-social-ads" />
}
