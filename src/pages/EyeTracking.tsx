import {
    HiBolt,
    HiChartBar,
    HiCloudArrowUp,
    HiSparkles,
    HiArrowTrendingUp,
    HiOutlineEye,
    HiOutlineLightBulb,
    HiOutlineAcademicCap
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function EyeTracking() {
    const eyeTrackingConfig = {
        hero: {
            title: 'Eye Tracking Sosyal Medya Reklam Analizi',
            subtitle: (
                <>
                    Eye Tracking + AI ile;<br />
                    Kazanan Kreatifi Yayına Alın,<br />
                    ROI Riskini Azaltın
                </>
            ),
            description: 'Focus, Cognitive Demand, Engagement, Memory skorlarını anında öğrenin. Sponsorlu gönderilerinizde hangi görselin daha fazla dikkat çekeceğini yayına girmeden önce keşfedin.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/img/eye-tracking-hero.png',
            videoUrl: 'https://www.youtube.com/embed/fiHpDDF440M',
            hideBadge: true,
            badgeText: "Veriye Dayalı Analiz",
            badgeIcon: <HiBolt />,
            themeColor: '#f9fafb'
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'Eye Tracking Reklam Analizi' }
        ],
        videoShowcase: {
            tag: 'Dakikalar İçinde Kazanan Kreatifi Bulun',
            title: (
                <>
                    Reklam Performansınızı
                    <span className="highlight"> AI ve Eye Tracking</span> ile Ölçün
                </>
            ),
            description: 'Görsel analiz ile kreatif performansınızı güçlendirin. Harcanan bütçenin karşılığını alıp almayacağınızı tahmin etmek yerine, doğrudan bilimsel verilere dayanın.',
            videoUrl: 'https://vimeo.com/1131181115'
        },
        featuresSection: {
            tag: 'Analiz Skorları',
            title: '4 Kritik Skorla Kreatif Performansınızı Ölçün',
            description: 'Görsellerinizin her bir öğesini insan gözünün algısına göre puanlıyoruz.',
            features: [
                {
                    title: 'Focus (Odak)',
                    description: 'Görselin ne kadar anlaşılır olduğunu gösterir. Yüksek skor, net ve temiz bir mesaj demektir.',
                    icon: <HiOutlineEye />
                },
                {
                    title: 'Cognitive Demand',
                    description: 'Karmaşıklık düzeyi. Düşük skor, daha kolay bir tüketim ve daha hızlı algı sağlar.',
                    icon: <HiOutlineLightBulb />
                },
                {
                    title: 'Engagement (İlgi)',
                    description: 'İlgi ve heyecan tahmini. Yüksek skor, daha fazla etkileşim olasılığını simgeler.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Memory (Bellek)',
                    description: 'Akılda kalıcılık. Yüksek skor, görselin hatırlanma olasılığını artırır.',
                    icon: <HiOutlineAcademicCap />
                }
            ]
        },
        processSection: {
            tag: 'Nasıl Çalışır?',
            title: 'Analiz Süreci Çok Basit',
            description: 'Görselinizi yükleyin ve dakikalar içinde kapsamlı raporunuzu alın.',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Görselinizi Yükleyin',
                    description: 'Sponsorlu gönderi/post görselinizi sürükleyip bırakın.',
                    icon: <HiCloudArrowUp />
                },
                {
                    stepNumber: 2,
                    title: 'AI Analizi',
                    description: 'Eye Tracking modeli heatmap ve skorları anında hesaplar.',
                    icon: <HiBolt />
                },
                {
                    stepNumber: 3,
                    title: 'Sonuç & Öneri',
                    description: 'Güçlü/zayıf alanları ve iyileştirme checklist’ini içeren PDF’i alın.',
                    icon: <HiChartBar />
                }
            ]
        },
        pricingSection: {
            tag: 'Planlar',
            title: 'Size Uygun Paketi Seçin',
            description: 'Her analiz sonunda güçlü/zayıf yönler ve uygulanabilir öneriler sunulur.',
            packages: [
                {
                    id: 'starter',
                    name: 'Starter',
                    price: '1.000TL',
                    period: 'ay',
                    description: 'Tekli görsel analizi için ideal başlangıç.',
                    icon: <HiBolt />,
                    features: [
                        '1 Görsel Analizi',
                        'Detaylı Skor Raporu',
                        'Heatmap Görünümü',
                        'Temel İyileştirme Önerileri'
                    ],
                    buttonText: 'Hemen Başla',
                    buttonLink: '/#contact'
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '2.700TL',
                    period: 'ay',
                    description: 'Küçük ekipler ve düzenli kampanya yürütenler için.',
                    icon: <HiArrowTrendingUp />,
                    isPopular: true,
                    features: [
                        '3 Görsel Analizi',
                        'Öncelikli Analiz Sırası',
                        'A/B Test Öncesi Ölçüm',
                        'Sektörel Karşılaştırma'
                    ],
                    buttonText: 'Hemen Başla',
                    buttonLink: '/#contact'
                },
                {
                    id: 'pro',
                    name: 'Pro',
                    price: '4.000TL',
                    period: 'ay',
                    description: 'Yoğun kampanya dönemleri ve ajanslar için profesyonel çözüm.',
                    icon: <HiSparkles />,
                    features: [
                        '5 Görsel Analizi',
                        'Gelişmiş ROI Analizi',
                        'Stratejik Danışmanlık Desteği',
                        'Hızlı Onay Süreci'
                    ],
                    buttonText: 'Hemen Başla',
                    buttonLink: '/#contact'
                }
            ]
        },
        testimonial: {
            quote: "Eye Tracking analizi ile ROI riskimizi minimize etik. Yayına çıkmadan önce kazanan görseli bilmek bütçemizi çok daha verimli kullanmamızı sağladı.",
            author: "Deniz Erten",
            role: "E-ticaret Direktörü"
        },
        faqs: [
            {
                question: 'Neden Khilonfast ile çalışmayı seçmeliyim?',
                answer: 'Khilonfast, kapsamlı dijital pazarlama deneyimi ve veriye dayalı yaklaşımları ile öne çıkar. İşletmenizin ihtiyaçlarına özel çözümler sunar, kampanyalarınızı sürekli optimize eder ve sonuç odaklı çalışır.'
            },
            {
                question: 'Neden yüz yüze veya online toplantı yapmıyoruz?',
                answer: 'Khilonfast, süreçleri hızlandırmak ve verimliliği artırmak amacıyla dijital iletişim araçlarını tercih eder. Tüm işlemler sitemiz ve e-posta üzerinden yürütülür, bu sayede zaman kaybına yol açan toplantıları ortadan kaldırarak daha üst düzey hizmet sunabiliyoruz.'
            },
            {
                question: 'Khilonfast kimler için ideal bir iş ortağıdır?',
                answer: 'Dijital dünyada hızlı, verimli ve sonuç odaklı çözümler arayan, veriye dayalı kararlar almayı seven ve yeni nesil araçları kullanmaya istekli firmalar için Khilonfast mükemmel bir iş ortağıdır.'
            },
            {
                question: 'Hizmet satın alımdan sonra süreç nasıl ilerleyecek?',
                answer: 'Satın alım sonrası size doldurmanız gereken formlar iletilir. Bu formlar doldurulduktan sonra ekibimiz analizleri yapar, kurulumları tamamlar ve süreci başlatarak periyodik raporlar sunar.'
            }
        ]
    }

    return <ServicePageTemplate {...eyeTrackingConfig} />
}
