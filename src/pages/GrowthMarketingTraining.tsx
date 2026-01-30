import {
    HiAcademicCap,
    HiUserGroup,
    HiPresentationChartLine,
    HiPuzzlePiece,
    HiBolt,
    HiFunnel,
    HiChartBar,
    HiGlobeAlt,
    HiComputerDesktop,
    HiUsers,
    HiChatBubbleLeftRight,
    HiRocketLaunch,
    HiCube,
    HiCurrencyDollar
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function GrowthMarketingTraining() {
    const trainingConfig = {
        hero: {
            title: 'Büyüme Odaklı Pazarlama Eğitimi',
            subtitle: 'B2B Sektöründe Başarının Pusulası',
            description: 'Dijital kanalların entegrasyonu ile daha fazla etkileşim, daha fazla dönüşüm elde edin. khilonfast ile pazarlama yatırımlarınızı optimize edin.',
            buttonText: 'Eğitimi Satın Al',
            buttonLink: '#pricing',
            image: '/img/marketing-training-hero.png',
            badgeText: "Bora Işık ile 10+1 Modül!",
            badgeIcon: <HiAcademicCap />,
            themeColor: '#F0F9FF' // Very light sky blue
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
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
            videoUrl: 'https://vimeo.com/1045939223' // Placeholder based on similar pages
        },
        featuresSection: {
            tag: 'Program Modülleri',
            title: 'Eğitimde Sizi Neler Bekliyor?',
            description: '10+1 Bölümden oluşan bu eğitimde, ilk temastan satışa kadar tüm süreci uçtan uca öğrenin.',
            features: [
                {
                    title: 'Büyüme Odaklı Pazarlama',
                    description: 'Satışa giden yolun haritasını çıkarın ve temel prensipleri öğrenin.',
                    icon: <HiRocketLaunch />
                },
                {
                    title: 'Hedef Kitle Analizi',
                    description: 'Karar verici ve onaylayıcıyı doğru okuma teknikleri.',
                    icon: <HiUserGroup />
                },
                {
                    title: 'Değer Önerisi Kurgusu',
                    description: 'Ethos, Pathos, Logos ile fark yaratan mesajlar oluşturun.',
                    icon: <HiPresentationChartLine />
                },
                {
                    title: 'Sistematik Değer Kurma',
                    description: 'Pain point ve rol bazlı mesaj kurgusuyla etkiyi artırın.',
                    icon: <HiPuzzlePiece />
                },
                {
                    title: 'Satış Hunisi Yönetimi',
                    description: 'Mesajı zaman, mecra ve aşamaya göre uyarlama stratejileri.',
                    icon: <HiFunnel />
                },
                {
                    title: 'Başlangıç Metrikleri',
                    description: 'Büyümenin sayısal pusulası: CAC, LTV, ROAS ve ROI.',
                    icon: <HiChartBar />
                },
                {
                    title: 'Pazarlamanın Üç Hedefi',
                    description: 'Müşteri kazanmak, derinleşmek ve mevcut olanı korumak.',
                    icon: <HiBolt />
                },
                {
                    title: 'Web Sitesi ile Büyümek',
                    description: 'Web sitenizdeki sayfaların görevleri ve dönüşüm optimizasyonu.',
                    icon: <HiGlobeAlt />
                },
                {
                    title: 'Lead Sonrası Akış',
                    description: 'Psikoloji, zamanlama ve çok kanallı temas yönetimi.',
                    icon: <HiComputerDesktop />
                },
                {
                    title: 'İlk Temastan Satışa',
                    description: 'Etkili iletişim, itiraz yönetimi ve takip teknikleri.',
                    icon: <HiChatBubbleLeftRight />
                },
                {
                    title: 'Bonus Modül',
                    description: 'B2B sektöründe sürdürülebilir büyüme için özel stratejiler.',
                    icon: <HiCube />
                }
            ]
        },
        pricingSection: {
            tag: 'Satın Alın',
            title: 'Eğitim Paketi',
            description: 'B2B Sektöründe Bütünleşik Dijital Pazarlama Eğitimi’ne hemen başlayın.',
            packages: [
                {
                    id: 'training-program',
                    name: 'B2B Pazarlama Eğitimi',
                    price: '5.000 TL',
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
                    buttonText: 'Hemen Kaydol',
                    buttonLink: 'https://khilonfast.com/contact-us'
                }
            ]
        },
        approachSection: {
            tag: 'Kimler İçin?',
            title: 'Bu Eğitim Kimler İçin İdeal?',
            description: 'Ekiplerin ortak bir hedef doğrultusunda büyümesini hedefleyen her kademe için.',
            items: [
                {
                    title: 'CEO & Şirket Sahipleri',
                    subtitle: 'Stratejik Yol Haritası',
                    description: 'Şirketin büyüme yol haritasını anlamak ve pazarlama–satış uyumunu en üst seviyeye çıkarmak için.',
                    icon: <HiUsers />
                },
                {
                    title: 'Pazarlama Yöneticileri',
                    subtitle: 'Bütçe ve ROAS Verimliliği',
                    description: 'Pazarlama bütçesini en verimli şekilde kullanmak ve ROAS/ROI metriklerini iyileştirmek için.',
                    icon: <HiCurrencyDollar />
                },
                {
                    title: 'Satış Ekipleri',
                    subtitle: 'Dönüşüm Oranı Artışı',
                    description: 'Huniden gelen lead’leri daha yüksek oranda kapatmak ve itirazları yönetmek için.',
                    icon: <HiChartBar />
                }
            ]
        },
        faqs: [
            {
                question: 'Bu eğitime ne zaman başlayabilirim?',
                answer: 'Satın alma işlemi tamamlanır tamamlanmaz tüm modüllere dijital erişim hakkınız aktif hale gelir.'
            },
            {
                question: 'Eğitimi kimler almalı?',
                answer: 'B2B sektöründe çalışan satış ve pazarlama profesyonelleri, departman yöneticileri ve şirket sahipleri için özel olarak tasarlanmıştır.'
            },
            {
                question: 'Video eğitimleri tekrar izleyebilir miyim?',
                answer: 'Evet, satın aldığınız eğitimlerinize ömür boyu erişim hakkına sahipsiniz, dilediğiniz zaman tekrar izleyebilirsiniz.'
            }
        ],
        testimonial: {
            quote: "Pazarlamayı sadece reklam vermek sanıyorduk, bu eğitimle bütünleşik stratejinin gücünü anladık. Satışlarımızda gözle görülür bir artış oldu.",
            author: "Can Ergin",
            role: "B2B Satış Müdürü"
        }
    }

    return <ServicePageTemplate {...trainingConfig} />
}
