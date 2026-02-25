import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiEnvelope,
    HiUsers,
    HiInboxArrowDown,
    HiSparkles,
    HiChartPie,
    HiPresentationChartLine,
    HiKey,
    HiChartBar,
    HiTrophy,
    HiCommandLine
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function B2BEmailMarketing() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
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
            image: '/images/hizmetlerimiz/b2b-email-pazarlama/hero.png',
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
            title: 'Stratejik Email Kampanya Yönetimi',
            description: 'Etkili e-posta kampanyaları ile doğru kitleye ulaşın.',
            items: [
                {
                    title: 'İdeal Müşteri Hedefleme',
                    subtitle: 'Segmentasyon',
                    description: 'Sektör, unvan ve şirket büyüklüğü bazlı derinlemesine segmentasyonla mesajınızı sadece ilgili kişilere iletiyoruz.',
                    icon: <HiUsers />
                },
                {
                    title: 'Kişiselleştirilmiş İçerik',
                    subtitle: 'Dinamik Mesajlar',
                    description: 'Yapay zeka destekli dinamik değişkenler kullanarak her alıcıya ismiyle ve sektörüyle hitap eden özel içerikler hazırlıyoruz.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Performans Analizi',
                    subtitle: 'Anlık Takip',
                    description: 'Açılma, tıklama ve dönüşüm oranlarını anlık olarak takip ediyor, kampanyaları veriye göre optimize ediyoruz.',
                    icon: <HiChartPie />
                },
                {
                    title: 'Otomasyon Kurguları',
                    subtitle: 'Zaman Tasarrufu',
                    description: 'Hoş geldin serileri, terk edilmiş sepet hatırlatmaları gibi otomatik senaryolarla müşteriyi sıcak tutuyoruz.',
                    icon: <HiCommandLine />
                },
                {
                    title: 'Deliverability (İletim)',
                    subtitle: 'Inbox Garantisi',
                    description: 'Spam filtrelerine takılmadan, mesajlarınızın doğrudan gelen kutusuna düşmesini sağlayacak teknik altyapıyı kuruyoruz.',
                    icon: <HiInboxArrowDown />
                }
            ]
        },
        processSection: {
            tag: '4 Adımda E-Posta',
            title: 'Nasıl Çalışır?',
            description: 'Soğuk leadleri sıcak satış fırsatlarına dönüştüren sürecimiz.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Data Hazırlığı',
                    description: 'Mevcut listenizi temizler, segmentlere ayırır veya yeni hedef kitle datası oluştururuz.',
                    icon: <HiUsers />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Tasarım & İçerik',
                    description: 'Mobil uyumlu şablonlar tasarlar ve ikna edici metinleri yazarız.',
                    icon: <HiSparkles />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Gönderim & Test',
                    description: 'A/B testleri yaparak en iyi performans veren başlık ve saatleri belirler, gönderimi yaparız.',
                    icon: <HiEnvelope />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Raporlama',
                    description: 'Hangi firmaların ilgilendiğini gösteren detaylı raporu sunar, aksiyon planı çıkarırız.',
                    icon: <HiPresentationChartLine />
                }
            ]
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
                    buttonText: t('pricing.buyNow')
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
                    buttonText: t('pricing.buyNow')
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺39.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: t('pricing.buyNow')
                }
            ]
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
        ],
        growthCTA: {
            title: 'Müşteri Listenizi Değere Dönüştürün!',
            description: 'Atıl bekleyen e-posta listelerinizi aktif satış kanallarına dönüştürüyoruz. Hemen khilonfast uzmanlığıyla tanışın.'
        }
    }

    const enConfig = {
        hero: {
            title: 'Activate Pipeline Through B2B Email',
            subtitle: 'Personalize campaigns and reach decision-makers with precision.',
            description: 'khilonfast builds high-converting outbound and nurture email systems that improve open rates, increase reply quality, and accelerate sales cycles.',
            buttonText: t('common.startNow'),
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/b2b-email-pazarlama/hero.png',
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
            title: 'Strategic B2B Email Operations',
            description: 'Message-market fit, campaign discipline, and consistent optimization.',
            items: [
                {
                    title: 'Audience Segmentation',
                    subtitle: 'ICP Precision',
                    description: 'We segment by industry, role, and company profile to match messaging with buyer intent.',
                    icon: <HiUsers />
                },
                {
                    title: 'Personalized Messaging',
                    subtitle: 'Dynamic Relevance',
                    description: 'Dynamic content frameworks personalize each message for stronger response quality.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Performance Analytics',
                    subtitle: 'Live Insights',
                    description: 'Open, click, and reply metrics drive continuous iteration and campaign improvements.',
                    icon: <HiChartPie />
                },
                {
                    title: 'Automation Flows',
                    subtitle: 'Scalable Outreach',
                    description: 'Automated sequences keep opportunities warm without sacrificing personalization quality.',
                    icon: <HiCommandLine />
                },
                {
                    title: 'Deliverability Engineering',
                    subtitle: 'Inbox Placement',
                    description: 'Technical setup and domain hygiene ensure your emails reach inboxes, not spam folders.',
                    icon: <HiInboxArrowDown />
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
        ],
        growthCTA: {
            title: 'Turn Dormant Lists Into Revenue',
            description: 'Activate your existing database with a disciplined B2B email engine designed by khilonfast.'
        }
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-b2b-email" />
}
