import {
    HiChartBar,
    HiKey,
    HiTrophy,
    HiPresentationChartLine,
    HiMagnifyingGlass,
    HiRocketLaunch,
    HiCheckBadge,
    HiSignal,
    HiCursorArrowRays,
    HiUserGroup
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function GoogleAds() {
    const gaConfig = {
        hero: {
            title: 'Google Ads',
            subtitle: 'Google Reklamcılığı ile Gelirinizi Artırın.',
            description: 'Rakiplerinizin arasında kaybolmayın! khilonfast ile doğru anahtar kelime stratejileri ve hedeflemelerle markanızı öne çıkarın. Düşük dönüşüm oranlarını, reklam yatırımınızı verimli şekilde kullanarak aşın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/img/google-ads-hero.png',
            badgeText: "google ads - işiniz büyüsün",
            badgeIcon: <HiChartBar />,
            themeColor: '#FEF3C7' // Warm yellow theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'Google Ads' }
        ],
        videoShowcase: {
            tag: 'İZLEYİN & ÖĞRENİN',
            title: (
                <>
                    Markanızı <span className="highlight-text">Üst Sıralara Taşıyın</span>
                </>
            ),
            description: 'Görünür olun, rakiplerinizin önüne geçin! khilonfast ile doğru hedefleme ve stratejilerle reklam bütçenizi etkili yönetin, sonuçları hızla görün.',
            videoUrl: 'https://www.youtube.com/embed/V-TdlZW40BE'
        },
        // Mapped old 'featuresSection' to new 'approachSection' and expanded to 5 items for Bento Grid
        approachSection: {
            title: 'Hesap Denetimi ve Strateji',
            description: 'Mevcut reklam hesaplarınızı derinlemesine analiz ediyor, kayıp bütçe alanlarını tespit ediyoruz.',
            items: [
                {
                    title: 'Profesyonel Hesap Denetimi',
                    subtitle: 'Hataları Tespit Edin',
                    description: 'Mevcut hesaplarınızdaki hataları bulur, bütçe israfını önleriz. Kapsamlı audit ile potansiyel fırsatları ortaya çıkarırız.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    title: 'Kalite Puanı İyileştirme',
                    subtitle: 'Maliyetleri Düşürün',
                    description: 'Reklam alaka düzeyini artırarak tıklama başı maliyetleri düşürürüz. Daha yüksek kalite puanı, daha düşük maliyetle daha fazla erişim demektir.',
                    icon: <HiChartBar />
                },
                {
                    title: 'Dönüşüm Takibi',
                    subtitle: 'ROI Odaklı Yaklaşım',
                    description: 'Harcadığınız her kuruşun size ne kadar kazandırdığını ölçeriz. Gelişmiş dönüşüm kurulumları ile veriye dayalı kararlar almanızı sağlarız.',
                    icon: <HiPresentationChartLine />
                },
                {
                    title: 'Rakip Analizi',
                    subtitle: 'Pazarda Öne Geçin',
                    description: 'Rakiplerinizin stratejilerini analiz eder, onların önünde yer almanızı sağlayacak taktikler geliştiririz.',
                    icon: <HiRocketLaunch />
                },
                {
                    title: 'Sürekli Optimizasyon',
                    subtitle: 'Dinamik Yönetim',
                    description: 'Kampanyalarınızı "kur ve unut" mantığıyla değil, günlük ve haftalık optimizasyonlarla sürekli canlı ve verimli tutarız.',
                    icon: <HiSignal />
                }
            ]
        },
        processSection: {
            tag: '4 Adımda Başarı',
            title: 'Nasıl Çalışır?',
            description: 'Google Ads süreçlerimizle reklam performansınızı zirveye taşıyın. Şeffaf, hızlı ve sonuç odaklı.',
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm', // Using standard GTM video layout or placeholder if specific video missing
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Analiz & Audit',
                    description: 'Mevcut hesabınızı ve pazar durumunuzu detaylıca inceler, fırsat ve riskleri raporlarız.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Strateji & Kurulum',
                    description: 'Hedef kitlenize uygun kampanya yapısını kurgular, anahtar kelime ve reklam metinlerini hazırlarız.',
                    icon: <HiPresentationChartLine />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Yayına Alma',
                    description: 'Onayınızla birlikte kampanyaları başlatır, ilk veri akışını ve doğruluğunu kontrol ederiz.',
                    icon: <HiCursorArrowRays />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Optimizasyon',
                    description: 'Gelen verilerle sürekli A/B testleri yapar, maliyetleri düşürüp dönüşümleri artırırız.',
                    icon: <HiCheckBadge />
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
                { feature: 'Arama Reklamları', values: ['Temel Google Search Ads kurulumu ve temel anahtar kelime araştırması', 'Standart Google Search Ads kurulumu', 'Pro Google Search Ads kurulumu, gelişmiş anahtar kelime araştırması ve reklam metni oluşturma'] },
                { feature: 'Ek kurulum ücreti', values: ['Aylık paketlerde kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.'] },
                { feature: 'Google Analytics Entegrasyonu', values: ['-', '-', true] },
                { feature: 'Reklam kampanyası optimizasyonu', values: ['Temel', true, '✓ Sürekli'] },
                { feature: 'Reklam uzantıları ve hedefleme', values: ['Sınırlı', '✓ (lokasyon, zamanlama, cihaz)', '✓ (remarketing, demografik, kitle segmentasyonu)'] },
                { feature: 'Performans raporu', values: ['✓ E-posta ile, ayda 1 kez raporlama', '✓ E-posta ile, 2 haftada 1 raporlama', '✓ E-posta ile, haftada 1 raporlama'] },
                { feature: 'Reklam Bütçesi Politikası', values: ['Reklam bütçesinin %10\'u core paket ücretini aşmıyorsa core paket üzerinden fiyatlandırılır; aştığında bir üst paketten fiyatlandırılır.', 'Reklam bütçesinin %10\'u growth paket ücretini aşmıyorsa growth paket üzerinden fiyatlandırılır; aştığında bir üst pakete geçilir.', 'Reklam bütçesinin %10\'u ultimate paket ücretini aşmıyorsa ultimate paket üzerinden fiyatlandırılır; aşması durumunda ek tutar yüzdesel olarak eklenir ve sonraki aylarda bulunduğu üst paketten fiyatlandırma devam eder.'] }
            ],
            note: 'Fiyatlara KDV dahil değildir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Net ve Şeffaf Fiyatlandırma',
            description: 'khilonfast ile reklam bütçenizi en verimli şekilde yönetin ve ölçülebilir büyüme elde edin.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺32.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın',
                    icon: <HiKey />,
                    features: [],
                    buttonText: 'ÜYE OL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Küçük işletmeler ve dijital pazarlamaya yeni başlayanlar.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Dijital pazarlamayı düşük bütçe ve düşük riskle keşfetmek isteyen,hızlı başlangıç isteyen firmalar için ideal.',
                            icon: <HiRocketLaunch />
                        }
                    ]
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
                    buttonText: 'ÜYE OL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Dijital operasyonlarını büyütmeyi hedefleyen orta ölçekli işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Gelişmiş hedefleme ve optimizasyon teknikleriyle etkileşimi artırmak ve dönüşüm oranlarını yükseltmek için mükemmel.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺85.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: 'ÜYE OL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Reklam bütçesini en iyi şekilde yönetmek isteyen büyük işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Agresif büyüme, pazar liderliği veya maksimum getiri için özel bir Search Ads ekibi kurmak için mükemmel.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                }
            ]
        },
        authorizationSection: {
            title: "YETKİLENDİRME",
            description: "",
            cards: [
                {
                    title: "Yetkilendirme",
                    description: "Hizmeti başlatmak için pazarlama araçlarına erişim tanımlayın.",
                    highlightText: "Tüm kanallarda entegre ve tutarlı iletişim sağlayın.",
                    buttonText: "KEŞFET",
                    buttonLink: "/#contact",
                    theme: "light" as const
                },
                {
                    title: "Nasıl Çalışır?",
                    description: "Sürecin baştan sona nasıl ilerlediğini adım adım görün.",
                    highlightText: "Doğru brief → net süreç → ölçülebilir sonuçları keşfedin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/#process",
                    theme: "dark" as const
                }
            ]
        },
        testimonial: {
            quote: "Google Ads kampanyalarımızı khilonfast'a devrettikten sonra maliyetlerimizi %30 düşürürken dönüşümlerimizi iki katına çıkardık.",
            author: "Mehmet Demir",
            role: "E-Ticaret Direktörü"
        },
        faqs: [
            {
                question: 'Neden khilonfast ile çalışmayı seçmeliyim?',
                answer: 'khilonfast, kapsamlı dijital pazarlama deneyimi ve veriye dayalı yaklaşımları ile öne çıkar. İşletmenizin ihtiyaçlarına özel çözümler sunar, kampanyalarınızı sürekli optimize eder ve sonuç odaklı çalışır. Khilonfast ile çalışarak, markanızın dijital alanda güçlü bir yer edinmesini sağlayabilirsiniz.'
            },
            {
                question: 'Neden yüz yüze veya online toplantı yapmıyoruz?',
                answer: 'Khilonfast, süreçleri hızlandırmak ve verimliliği artırmak amacıyla dijital iletişim araçlarını tercih eder. Tüm işlemler sitemiz ve e-posta üzerinden yürütülür, bu sayede dünyanın her yerinden hızlı ve etkili bir şekilde hizmet alabilirsiniz. Khilonfast, zaman kaybına yol açan senkron toplantıları ortadan kaldırarak pazarlama hizmetini ölçeklendirebiliyor ve tecrübesini tamamen uzmanlığına odaklayarak daha iyi iş yapmayı tercih ediyor. Bu şekilde, üst düzey bir ajansla makul fiyatlarla çalışabilir, zaman kaybına uğramadan işinizin görülmesini sağlayabilirsiniz. Tüm hizmet süreci boyunca ihtiyacınız olan bilgi ve destek, e-posta aracılığıyla sağlanacaktır.'
            },
            {
                question: 'khilonfast ile kimler çalışmamalı?',
                answer: 'khilonfast, dijital süreçleri etkin bir şekilde yönetebilen ve modern pazarlama araçlarını benimseyen firmalar için idealdir. Ancak, ortaya çıkacak işin kalitesinden çok karşısında bir insan bulmayı isteyen, sadece bir yüz yüze görüşmeyle kendini güvende hisseden, metrikler ve analizlerle arası iyi olmayan, gelişmeleri anlamlı bir şekilde takip edemeyen, yeni nesil pazarlama araçlarına mesafeli olan, WhatsApp veya e-posta gibi iletişim araçlarını düzenli olarak kontrol etmeyen, Khilonfast’ın göndereceği formları doldurmayacak kadar meşgul olan ya da “Ben ajanslardan daha iyi biliyorum, kendi yöntemimle ilerleyelim” diyen firmalar, Khilonfast için uygun müşteriler değildir. Bu tür firmalar için, Khilonfast hizmeti uygun olmayabilir.'
            },
            {
                question: 'khilonfast kimler için ideal bir iş ortağıdır?',
                answer: 'khilonfast, dijital dünyada hızlı, verimli ve sonuç odaklı çözümler arayan firmalar için mükemmel bir iş ortağıdır. Veriye dayalı kararlar almayı seven, metriklerle çalışabilen, dijital pazarlamanın gücüne inanan ve yeni nesil araçları kullanmaya istekli olan firmalar için Khilonfast ideal bir çözüm sunar. Ayrıca, e-posta ve diğer dijital iletişim araçlarını düzenli olarak kullanan, Khilonfast tarafından sağlanan formları dolduracak zaman ve disipline sahip olan, ve uzman ekibin önerilerine güvenerek stratejik rehberlik arayan firmalar, Khilonfast ile çalışırken en yüksek verimi elde ederler. Eğer dijital pazarlama süreçlerinde güvenilir bir iş ortağı arıyorsanız, Khilonfast sizin için mükemmel bir seçimdir.'
            },
            {
                question: 'khilonfast ile iletişimi nasıl sağlayabilirim?',
                answer: 'khilonfast ile tüm iletişim, kullanıcı dostu sitemiz ve e-posta üzerinden gerçekleştirilir. Hizmeti satın aldıktan sonra, size gerekli formlar sistem üzerinden iletilir. Bu formları doldurduktan sonra, Khilonfast ekibi titizlikle inceleyerek gerekli kurulumları yapar ve operasyonu başlatır. Sürecin her aşamasında, e-posta yoluyla size bilgilendirme yapılır ve gerekli tüm destek sağlanır.'
            },
            {
                question: 'Hizmet satın alımdan sonra süreç nasıl ilerleyecek?',
                answer: 'khilonfast üzerinden hizmet satın alımını tamamladığınızda, size sitemiz üzerinden doldurmanız gereken formlar iletilir. Bu formlar, hizmetin doğru yapılandırılması için gereken bilgileri toplar. Formlar doldurulduktan sonra, Khilonfast ekibi gerekli tanımlamaları yapar ve hizmetinizi aktif hale getirir. Tüm süreç boyunca, gerekli bilgiler ve talimatlar e-posta ile size iletilecektir. Ayrıca, raporlama periyotlarına göre haftalık, aylık veya üç aylık raporlar e-posta yoluyla gönderilir ve hizmetinizin performansını takip etmeniz sağlanır.'
            },
            {
                question: 'Go to market stratejisi işletmem için nasıl faydalıdır?',
                answer: 'Go to market stratejisi, yeni bir ürün veya hizmetin pazara hızlı ve etkili bir şekilde giriş yapmasını sağlar. khilonfast, hedef kitlenizi analiz eder, rekabet avantajı sağlayan stratejiler geliştirir ve pazarda başarılı bir konum almanızı sağlar.'
            },
            {
                question: 'Go to market stratejimin performansını nasıl takip edebilirim?',
                answer: 'khilonfast, go to market stratejinizin performansını izlemek için haftalık, aylık veya üç aylık raporlar sunar. Bu raporlar, satışlar, pazar penetrasyonu ve müşteri geri bildirimleri gibi önemli metrikleri içerir. Canlı dashboard’lar aracılığıyla sonuçlarınızı anlık olarak takip edebilirsiniz.'
            },
            {
                question: 'Neden khilonfast go to market stratejisi hizmetini tercih etmeliyim?',
                answer: 'khilonfast, veri odaklı yaklaşımlarla pazara giriş stratejinizi güçlendirir. Uzman ekibimiz, rekabet avantajı sağlayan stratejiler geliştirir ve pazarda hızlı bir şekilde yer almanızı sağlar. Yeni pazarlara girişte güvenilir bir iş ortağı arıyorsanız, Khilonfast sizin için ideal bir seçimdir.'
            },
            {
                question: 'Go to market stratejisi nasıl oluşturulur?',
                answer: 'khilonfast, öncelikle hedef kitlenizi ve pazarınızı analiz eder. Ardından, pazara giriş sürecinizi destekleyecek stratejileri geliştirir. Pazara giriş sonrası performans izlenir ve strateji gerektiğinde güncellenir.'
            }
        ]
    }

    return <ServicePageTemplate {...gaConfig} />
}
