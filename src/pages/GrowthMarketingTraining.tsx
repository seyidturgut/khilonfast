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
            subtitle: 'Bütünleşik pazarlama stratejileri ile markanızı büyütün!',
            description: 'khilonfast ile bütçenizi doğru kanallara yönlendirerek dijital pazarlamanızı güçlendirin. Tüm kanallarınızı tek bir strateji ile yöneterek performansınızı artırın.',
            buttonText: 'Satın Al',
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
                    buttonLink: '/#contact'
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
                question: 'Neden khilonfast ile çalışmayı seçmeliyim?',
                answer: 'khilonfast, kapsamlı dijital pazarlama deneyimi ve veriye dayalı yaklaşımları ile öne çıkar. İşletmenizin ihtiyaçlarına özel çözümler sunar, kampanyalarınızı sürekli optimize eder ve sonuç odaklı çalışır. Khilonfast ile çalışarak, markanızın dijital alanda güçlü bir yer edinmesini sağlayabilirsiniz.'
            },
            {
                question: 'Neden yüz yüze veya online toplantı yapmıyoruz?',
                answer: 'Khilonfast, süreçleri hızlandırmak ve verimliliği artırmak amacıyla dijital iletişim araçlarını tercih eder. Tüm işlemler sitemiz ve e-posta üzerinden yürütülür, bu sayede dünyanın her yerinden hızlı ve etkili bir şekilde hizmet alabilirsiniz. Khilonfast, zaman kaybına yol açan senkron toplantıları ortadan kaldırarak pazarlama hizmetini ölçeklendirebiliyor ve tecrübesini tamamen uzmanlığına odaklayarak daha iyi iş yapmayı tercih ediyor. Bu şekilde, üst düzey bir ajansla makul fiyatlarla çalışabilir, zaman kaybına uğramadan işinizin görülmesini sağlayabilirsiniz.'
            },
            {
                question: 'khilonfast ile kimler çalışmamalı?',
                answer: 'khilonfast, dijital süreçleri etkin bir şekilde yönetebilen ve modern pazarlama araçlarını benimseyen firmalar için idealdir. Ancak, ortaya çıkacak işin kalitesinden çok karşısında bir insan bulmayı isteyen, sadece bir yüz yüze görüşmeyle kendini güvende hisseden, metrikler ve analizlerle arası iyi olmayan, gelişmeleri anlamlı bir şekilde takip edemeyen, yeni nesil pazarlama araçlarına mesafeli olan, WhatsApp veya e-posta gibi iletişim araçlarını düzenli olarak kontrol etmeyen, Khilonfast’ın göndereceği formları doldurmayacak kadar meşgul olan ya da “Ben ajanslardan daha iyi biliyorum, kendi yöntemimle ilerleyelim” diyen firmalar, Khilonfast için uygun müşteriler değildir.'
            },
            {
                question: 'khilonfast kimler için ideal bir iş ortağıdır?',
                answer: 'khilonfast, dijital dünyada hızlı, verimli ve sonuç odaklı çözümler arayan firmalar için mükemmel bir iş ortağıdır. Veriye dayalı kararlar almayı seven, metriklerle çalışabilen, dijital pazarlamanın gücüne inanan ve yeni nesil araçları kullanmaya istekli olan firmalar için Khilonfast ideal bir çözüm sunar.'
            },
            {
                question: 'Khilonfast ile iletişimi nasıl sağlayabilirim?',
                answer: 'Khilonfast ile tüm iletişim, kullanıcı dostu sitemiz ve e-posta üzerinden gerçekleştirilir. Hizmeti satın aldıktan sonra, size gerekli formlar sistem üzerinden iletilir. Bu formları doldurduktan sonra, Khilonfast ekibi titizlikle inceleyerek gerekli kurulumları yapar ve operasyonu başlatır.'
            },
            {
                question: 'Hizmet satın alımdan sonra süreç nasıl ilerleyecek?',
                answer: 'Khilonfast üzerinden hizmet satın alımını tamamladığınızda, size sitemiz üzerinden doldurmanız gereken formlar iletilir. Bu formlar, hizmetin doğru yapılandırılması için gereken bilgileri toplar. Formlar doldurulduktan sonra, Khilonfast ekibi gerekli tanımlamaları yapar ve hizmetinizi aktif hale getirir.'
            },
            {
                question: 'Bütünleşik dijital pazarlama stratejileri işletmem için nasıl faydalıdır?',
                answer: 'Bütünleşik dijital pazarlama, farklı dijital kanalları tek bir strateji altında birleştirerek pazarlama etkinliğinizi artırır. Khilonfast, tüm dijital pazarlama çabalarınızı entegre eder ve bütçenizi en verimli şekilde kullanarak maksimum etkileşim ve dönüşüm sağlar.'
            },
            {
                question: 'Bütünleşik dijital pazarlama kampanyalarının performansını nasıl takip edebilirim?',
                answer: 'Khilonfast, tüm dijital kanallarınızı kapsayan haftalık, aylık veya üç aylık raporlar sunar. Bu raporlar, etkileşim oranları, dönüşümler ve diğer kritik performans göstergeleri hakkında bilgi içerir. Ayrıca, canlı dashboard’lar üzerinden kampanyalarınızı anlık olarak izleyebilirsiniz.'
            },
            {
                question: 'Neden khilonfast bütünleşik dijital pazarlama hizmetini tercih etmeliyim?',
                answer: 'khilonfast, tüm dijital pazarlama çabalarınızı entegre ederek maksimum verimlilik sağlar. Uzman ekibimiz, dijital stratejinizi bir bütün olarak ele alır ve tüm kanallarda tutarlı bir mesaj ve marka deneyimi sunmanızı sağlar.'
            },
            {
                question: 'Bütünleşik dijital pazarlama stratejisi nasıl oluşturulur?',
                answer: 'Khilonfast, öncelikle işletmenizin hedeflerini ve mevcut dijital varlıklarını analiz eder. Ardından, tüm dijital kanallarınızı entegre eden bir strateji geliştirir. Kampanyalar başlatıldıktan sonra, performans düzenli olarak izlenir ve optimize edilir.'
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
