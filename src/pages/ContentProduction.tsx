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
    HiDocumentText,
    HiUser
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function ContentProduction() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
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
            title: 'Stratejik İçerik Üretimi',
            description: 'Doğru içeriklerle hedef kitlenize ulaşın.',
            items: [
                {
                    title: 'SEO Uyumlu Üretim',
                    subtitle: 'Arama Motoru Dostu',
                    description: 'Arama motorlarında üst sıralarda yer almanızı sağlayacak anahtar kelime, başlık ve meta optimizasyonlarını yapıyoruz.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    title: 'Yaratıcı Metin Yazarlığı',
                    subtitle: 'Özgün Hikayeler',
                    description: 'Hedef kitlenizi harekete geçirecek, ikna edici ve markanızın diline uygun özgün metinler hazırlıyoruz.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Kalite Güvencesi',
                    subtitle: 'Editöryal Kontrol',
                    description: 'Tüm içeriklerimiz uzman editör kontrolünden geçerek yazım, imla ve anlam bütünlüğü açısından denetlenir.',
                    icon: <HiCheckBadge />
                },
                {
                    title: 'İnsan Dokunuşu',
                    subtitle: '%100 Orijinal',
                    description: 'Yapay zeka araçlarını sadece yardımcı olarak kullanır, içeriklerinizin ruhunu ve özgünlüğünü insan yaratıcılığıyla koruruz.',
                    icon: <HiUser />
                },
                {
                    title: 'Tutarlı Ton',
                    subtitle: 'Marka Sesi',
                    description: 'Markanızın kurumsal kimliğine ve iletişim diline uygun, tutarlı bir ses tonuyla içeriklerinizi kurgularız.',
                    icon: <HiDocumentText />
                }
            ]
        },
        processSection: {
            tag: '4 Adımda Üretim',
            title: 'Nasıl Çalışır?',
            description: 'Kusursuz içerik üretimi için işleyen çarklarımız.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Brief',
                    description: 'İhtiyaçlarınızı, konu başlıklarını ve beklentilerinizi netleştiren bir brief oluştururuz.',
                    icon: <HiPencilSquare />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Yazım',
                    description: 'Konusunda uzman yazarlarımız, belirlenen stratejiye uygun olarak içerikleri hazırlar.',
                    icon: <HiCursorArrowRays />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Editör Kontrolü',
                    description: 'Üretilen içerikler editörlerimiz tarafından SEO, dil ve kalite açısından denetlenir.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Teslim & Yayın',
                    description: 'Onaylanan içerikler yayına hazır formatta (veya direkt siteye yüklenerek) teslim edilir.',
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
                    buttonText: t('pricing.buyNow')
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
                    buttonText: t('pricing.buyNow')
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺49.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: t('pricing.buyNow')
                }
            ]
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
            title: 'Strategic Content Engine',
            description: 'Create with intent, publish with consistency, optimize for growth.',
            items: [
                {
                    title: 'SEO-Led Production',
                    subtitle: 'Search Visibility',
                    description: 'Keyword architecture, metadata, and content structure are designed to improve rankings and discoverability.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    title: 'Conversion Copywriting',
                    subtitle: 'Message Precision',
                    description: 'Compelling narratives aligned with your buyer journey increase trust and conversion potential.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Editorial QA',
                    subtitle: 'Quality Assurance',
                    description: 'Every asset is reviewed for clarity, consistency, and strategic alignment before publication.',
                    icon: <HiCheckBadge />
                },
                {
                    title: 'Human-Led Creativity',
                    subtitle: 'Brand Authenticity',
                    description: 'AI supports speed, while human editorial judgment protects originality and brand voice.',
                    icon: <HiUser />
                },
                {
                    title: 'Voice Consistency',
                    subtitle: 'Brand Integrity',
                    description: 'We maintain a unified tone across channels to strengthen recognition and trust.',
                    icon: <HiDocumentText />
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
        ]
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-content-production" />
}
