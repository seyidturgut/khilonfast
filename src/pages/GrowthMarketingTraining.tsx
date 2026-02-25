import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiAcademicCap,
    HiUserGroup,
    HiPresentationChartLine,
    HiPuzzlePiece,
    HiPencilSquare,
    HiBolt,
    HiFunnel,
    HiChartBar,
    HiGlobeAlt,
    HiComputerDesktop,
    HiUsers,
    HiChatBubbleLeftRight,
    HiRocketLaunch,
    HiCurrencyDollar
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function GrowthMarketingTraining() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
    const isEn = currentLang === 'en'
    const langPrefix = isEn ? '/en' : ''

    useEffect(() => {
        document.title = isEn ? 'Growth-Focused Marketing Training | khilonfast' : 'Büyüme Odaklı Pazarlama Eğitimi | khilonfast'
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Büyüme Odaklı Pazarlama Eğitimi',
            subtitle: 'Bütünleşik pazarlama stratejileri ile markanızı büyütün!',
            description: 'khilonfast ile bütçenizi doğru kanallara yönlendirerek dijital pazarlamanızı güçlendirin. Tüm kanallarınızı tek bir strateji ile yöneterek performansınızı artırın.',
            buttonText: 'Satın Al',
            buttonLink: '#pricing',
            image: '/img/marketing-training-hero.png',
            badgeText: 'Bora Işık ile 10+1 Modül!',
            badgeIcon: <HiAcademicCap />,
            themeColor: '#F0F9FF'
        },
        breadcrumbs: [
            { label: 'Eğitimlerimiz', path: '/egitimler' },
            { label: 'Pazarlama Eğitimi' }
        ],
        videoShowcase: {
            tag: 'Eğitim Tanıtımı',
            title: (
                <>
                    Bütünleşik Dijital Pazarlama ile
                    <span className="highlight"> Satışa Giden Yol</span>
                </>
            ),
            description: 'Bu eğitim serisi, pazarlamayı ürün ya da teknolojiyle değil, doğrudan hedef kitleyle başlatan sistematik bir çerçeve sunar. Deneyimli CMO Bora Işık’ın perspektifiyle hazırlanmış bu programla rakiplerinizin önüne geçin.',
            videoUrl: 'https://player.vimeo.com/video/1045939223'
        },
        featuresSection: {
            tag: 'Program Modülleri',
            title: 'Eğitimde Sizi Neler Bekliyor?',
            description: '10+1 Bölümden oluşan bu eğitimde, ilk temastan satışa kadar tüm süreci uçtan uca öğrenin.',
            features: [
                { title: 'Büyüme Odaklı Pazarlamaya Giriş: Satışa Giden Yolun Haritası', description: 'Büyüme odaklı pazarlamanın temel çerçevesini kurun ve satışa giden yolu haritalayın.', icon: <HiRocketLaunch /> },
                { title: 'Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak', description: 'Karar verici ve onaylayıcı rolleri doğru ayrıştırarak hedef kitle analizini netleştirin.', icon: <HiUserGroup /> },
                { title: 'Egzersiz: Hedef Kitle Sorunlarını Not Etmek', description: 'Hedef kitlenin yaşadığı temel problemleri sistematik biçimde not ederek içgörü üretin.', icon: <HiPencilSquare /> },
                { title: 'Değer Önerisi: Ethos, Pathos, Logos ile Fark Yaratmak', description: 'Ethos, Pathos ve Logos yaklaşımıyla güçlü ve ikna edici bir değer önerisi geliştirin.', icon: <HiPresentationChartLine /> },
                { title: 'Değer Önerisini Sistematik Kurmak: Pain Point ve Rol Bazlı Mesaj', description: 'Pain point odaklı ve rol bazlı mesajlarla değer önerinizi sistematik hale getirin.', icon: <HiPuzzlePiece /> },
                { title: 'Satış Hunisi: Mesajı Zaman, Mecra ve Aşamaya Göre Uyarlamak', description: 'Mesajınızı doğru zamanda, doğru mecrada ve doğru aşamada konumlandırın.', icon: <HiFunnel /> },
                { title: 'Başlangıç Metrikleri: Büyümenin Sayısal Pusulası', description: 'Büyümeyi ölçmek için başlangıç metriklerini belirleyin ve takip modelini kurun.', icon: <HiChartBar /> },
                { title: 'Pazarlamanın Üç Net Hedefi: Kazanmak, Derinleşmek, Korumak', description: 'Kazanım, derinleşme ve koruma ekseninde pazarlama hedeflerinizi netleştirin.', icon: <HiBolt /> },
                { title: 'Web Sitesi ile Büyümek: Web Sitesindeki Sayfaların Görevleri', description: 'Web sitesindeki sayfaların rollerini netleştirerek dönüşüm akışını iyileştirin.', icon: <HiGlobeAlt /> },
                { title: 'Lead Sonrası Akış: Psikoloji, Zamanlama ve Çok Kanallı Temas', description: 'Lead sonrası süreçte psikoloji, zamanlama ve çok kanallı temas dengesini kurun.', icon: <HiComputerDesktop /> },
                { title: 'İlk Temastan Satışa: Etkili İletişim, İtiraz Yönetimi ve Takip', description: 'İlk temastan satış kapanışına kadar etkili iletişim, itiraz yönetimi ve takibi yönetin.', icon: <HiChatBubbleLeftRight /> }
            ]
        },
        pricingSection: {
            tag: 'Satın Alın',
            title: 'Eğitim Paketi',
            description: 'B2B Sektöründe Bütünleşik Dijital Pazarlama Eğitimi’ne hemen başlayın.',
            packages: [
                {
                    id: 'training-buyume-odakli-pazarlama',
                    name: 'B2B Pazarlama Eğitimi',
                    price: '5000TL',
                    period: 'Tek Seferlik',
                    description: 'Tüm modüllere ömür boyu erişim ve uygulamalı egzersizler.',
                    icon: <HiAcademicCap />,
                    isPopular: true,
                    features: [
                        '10+1 Video Eğitim Modülü',
                        'Uygulamalı Egzersiz Dokümanları',
                        'CMO Perspektifiyle Stratejiler',
                        'Pazarlama & Satış Entegrasyonu',
                        'Sektörel Örnek Analizleri',
                        'Metrik ve Analiz Şablonları'
                    ],
                    buttonText: 'Satın Al',
                    buttonLink: '/iletisim'
                }
            ]
        },
        heroPriceCard: {
            packageId: 'training-buyume-odakli-pazarlama',
            priceOnly: true
        },
        approachSection: {
            tag: 'Kimler İçin?',
            title: 'Bu Eğitim Kimler İçin İdeal?',
            description: 'Ekiplerin ortak bir hedef doğrultusunda büyümesini hedefleyen her kademe için.',
            items: [
                { title: 'CEO & Şirket Sahipleri', subtitle: 'Stratejik Yol Haritası', description: 'Şirketin büyüme yol haritasını anlamak ve pazarlama–satış uyumunu en üst seviyeye çıkarmak için.', icon: <HiUsers /> },
                { title: 'Pazarlama Yöneticileri', subtitle: 'Bütçe ve ROAS Verimliliği', description: 'Pazarlama bütçesini en verimli şekilde kullanmak ve ROAS/ROI metriklerini iyileştirmek için.', icon: <HiCurrencyDollar /> },
                { title: 'Satış Ekipleri', subtitle: 'Dönüşüm Oranı Artışı', description: 'Huniden gelen lead’leri daha yüksek oranda kapatmak ve itirazları yönetmek için.', icon: <HiChartBar /> }
            ]
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ],
        testimonial: {
            quote: 'Pazarlamayı sadece reklam vermek sanıyorduk, bu eğitimle bütünleşik stratejinin gücünü anladık. Satışlarımızda gözle görülür bir artış oldu.',
            author: 'Can Ergin',
            role: 'B2B Satış Müdürü'
        }
    }

    const enConfig = {
        hero: {
            title: 'Growth-Focused Marketing Training',
            subtitle: 'Scale your brand with integrated marketing strategy.',
            description: 'khilonfast helps you allocate budget across the right channels, align teams, and execute with a measurable growth framework.',
            buttonText: t('pricing.buyNow'),
            buttonLink: '#pricing',
            image: '/img/marketing-training-hero.png',
            badgeText: '10+1 Modules with Bora Isik',
            badgeIcon: <HiAcademicCap />,
            themeColor: '#F0F9FF'
        },
        breadcrumbs: [
            { label: t('header.allTrainings'), path: `/${t('slugs.trainings')}` },
            { label: 'Marketing Training' }
        ],
        videoShowcase: {
            tag: 'Program Overview',
            title: (
                <>
                    Integrated Digital Marketing for a
                    <span className="highlight"> Revenue-Driven Funnel</span>
                </>
            ),
            description: 'This curriculum gives your team a practical, end-to-end growth system that starts with audience clarity and ends with measurable sales outcomes.',
            videoUrl: 'https://player.vimeo.com/video/1045939223'
        },
        featuresSection: {
            tag: 'Training Modules',
            title: 'What You Will Master',
            description: 'A complete 10+1 module framework from first touch to closed revenue.',
            features: [
                { title: 'Growth Marketing Fundamentals', description: 'Build a strategic roadmap from market signal to sales outcome.', icon: <HiRocketLaunch /> },
                { title: 'Buyer Mapping', description: 'Understand decision-makers and influencers with precision.', icon: <HiUserGroup /> },
                { title: 'Audience Problem Discovery', description: 'Create structured insight logs around real buyer pain points.', icon: <HiPencilSquare /> },
                { title: 'Value Proposition Architecture', description: 'Use ethos, pathos, and logos to develop persuasive market messaging.', icon: <HiPresentationChartLine /> },
                { title: 'Role-Based Messaging System', description: 'Translate pain points into segment-specific message frameworks.', icon: <HiPuzzlePiece /> },
                { title: 'Funnel Messaging Strategy', description: 'Adapt message, timing, and channel by funnel stage.', icon: <HiFunnel /> },
                { title: 'Baseline Metrics Setup', description: 'Define and operationalize the metrics that guide scalable growth.', icon: <HiChartBar /> },
                { title: 'Three Core Marketing Goals', description: 'Design around acquisition, expansion, and retention outcomes.', icon: <HiBolt /> },
                { title: 'Website Conversion Architecture', description: 'Align page responsibilities to increase conversion flow quality.', icon: <HiGlobeAlt /> },
                { title: 'Post-Lead Journey', description: 'Run timing, psychology, and multi-channel follow-up with discipline.', icon: <HiComputerDesktop /> },
                { title: 'Sales Conversation Excellence', description: 'Improve objection handling, follow-up quality, and close rates.', icon: <HiChatBubbleLeftRight /> }
            ]
        },
        pricingSection: {
            tag: 'Enroll Now',
            title: 'Training Package',
            description: 'Start the integrated B2B growth marketing training program today.',
            packages: [
                {
                    id: 'training-buyume-odakli-pazarlama',
                    name: 'B2B Marketing Training',
                    price: '5000TL',
                    period: 'One-Time',
                    description: 'Lifetime access to all modules with practical exercises.',
                    icon: <HiAcademicCap />,
                    isPopular: true,
                    features: [
                        '10+1 Video Training Modules',
                        'Hands-On Exercise Documents',
                        'CMO-Level Strategic Frameworks',
                        'Marketing & Sales Integration',
                        'Sector-Specific Case Analysis',
                        'Metrics and Reporting Templates'
                    ],
                    buttonText: t('pricing.buyNow'),
                    buttonLink: `${langPrefix}/${t('slugs.contact')}`.replace(/\/{2,}/g, '/')
                }
            ]
        },
        heroPriceCard: {
            packageId: 'training-buyume-odakli-pazarlama',
            priceOnly: true
        },
        approachSection: {
            tag: 'Who It Is For',
            title: 'Designed for Growth Teams',
            description: 'Built for leaders and operators responsible for predictable growth outcomes.',
            items: [
                { title: 'CEOs & Founders', subtitle: 'Strategic Clarity', description: 'Align commercial direction and improve marketing-sales coordination at leadership level.', icon: <HiUsers /> },
                { title: 'Marketing Leaders', subtitle: 'Budget Efficiency', description: 'Optimize channel allocation and improve ROAS/ROI performance.', icon: <HiCurrencyDollar /> },
                { title: 'Sales Teams', subtitle: 'Higher Close Rate', description: 'Increase lead conversion quality through stronger objection handling and follow-up discipline.', icon: <HiChartBar /> }
            ]
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ],
        testimonial: {
            quote: 'This program reframed our approach from isolated tactics to integrated growth execution, and our sales results improved visibly.',
            author: 'Can Ergin',
            role: 'B2B Sales Manager'
        }
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="training-buyume-odakli-pazarlama" disableApiHeroTextOverride />
}
