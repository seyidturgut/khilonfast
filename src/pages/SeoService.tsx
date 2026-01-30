import {
    HiMagnifyingGlass,
    HiPresentationChartLine,
    HiGlobeAlt,
    HiSparkles,
    HiChartBar,
    HiTrophy,
    HiKey,
    HiCommandLine,
    HiCpuChip,
    HiArrowTrendingUp,
    HiUserGroup,
    HiRocketLaunch

} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function SeoService() {
    const seoConfig = {
        hero: {
            title: 'Üst Sıralara Çıkın!',
            subtitle: 'Rakiplerinizle rekabet edin ve online görünürlüğünüzü artırın!',
            description: 'Doğru anahtar kelime stratejileri ve SEO optimizasyonuyla, khilonfast ile markanızın organik sıralamalarda yükselmesini sağlayın. Hedef kitlenizi büyütün.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/seo_hero_laptop.png',
            badgeText: "Üst Sıralara Çıkın! Rekabetin Önüne Geçin!",
            badgeIcon: <HiGlobeAlt />,
            themeColor: '#E0F2FE' // Light blue theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'SEO Yönetimi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Arama Sonuçlarında
                    <span className="highlight"> Öne Çıkın</span>
                </>
            ),
            description: 'khilonfast SEO hizmetleriyle arama motoru sonuçlarında rakiplerinizi geride bırakın. Stratejik anahtar kelime seçimi ve optimize edilmiş içeriklerle online görünürlüğünüzü artırın.',
            videoUrl: 'https://www.youtube.com/embed/qx17zxGfFzs'
        },
        approachSection: {
            title: 'Teknik ve Stratejik SEO',
            description: 'Sitenizin mevcut durumunu derinlemesine analiz ediyor, performans engellerini ortadan kaldırıyoruz.',
            items: [
                {
                    title: 'Teknik SEO Denetimi',
                    subtitle: 'Altyapı İyileştirme',
                    description: 'Site hızı, mobil uyumluluk ve tarama hatalarını gidererek Google dostu bir yapı kuruyoruz. Hızlı ve hatasız bir site, SEO başarısının temelidir.',
                    icon: <HiCommandLine />
                },
                {
                    title: 'İçerik Optimizasyonu',
                    subtitle: 'Değer Odaklı İçerik',
                    description: 'Sektörünüze özel anahtar kelime araştırmasıyla içeriklerinizi sıralamalarda yukarılara taşıyoruz. Kullanıcı niyetine uygun, kaliteli içerikler üretiyoruz.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Performans Takibi',
                    subtitle: 'Veriye Dayalı Büyüme',
                    description: 'Sıralama değişimlerini ve organik trafik artışını düzenli raporlarla izliyoruz. Her veriyi analize dökerek stratejimizi sürekli güncelliyoruz.',
                    icon: <HiPresentationChartLine />
                },
                {
                    title: 'Rakip Analizi',
                    subtitle: 'Pazar Hakimiyeti',
                    description: 'Rakiplerin güçlü ve zayıf yönlerini analiz ederek, onların önüne geçmenizi sağlayacak fırsatları belirliyoruz.',
                    icon: <HiChartBar />
                },
                {
                    title: 'Otorite İnşası',
                    subtitle: 'Güvenilir Backlinkler',
                    description: 'Markanızın dijital otoritesini artırmak için kaliteli ve doğal backlink stratejileri geliştiriyoruz.',
                    icon: <HiTrophy />
                }
            ]
        },
        processSection: {
            tag: '4 Adımda Zirve',
            title: 'Nasıl Çalışır?',
            description: 'Organik trafiğinizi artırmak için kanıtlanmış bir SEO yol haritası izliyoruz.',
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Kapsamlı Audit',
                    description: 'Web sitenizin teknik, içerik ve otorite durumunu detaylıca tarar, eksikleri raporlarız.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Strateji Planı',
                    description: 'Hedef kelimeleri belirler, rakipleri analiz eder ve 6 aylık büyüme planını oluştururuz.',
                    icon: <HiPresentationChartLine />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Optimizasyon',
                    description: 'Teknik hataları giderir, içerikleri düzenler ve site içi optimizasyonları tamamlarız.',
                    icon: <HiCpuChip />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Otorite & Rapor',
                    description: 'Backlink çalışmalarıyla gücünüzü artırır, düzenli raporlarla gelişimi sunarız.',
                    icon: <HiArrowTrendingUp />
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
                { feature: 'SEO', values: ['Temel SEO optimizasyonu', 'Gelişmiş SEO stratejisi ve uygulama', 'Pro SEO stratejisi, içerik üretimi ve gelişmiş teknik SEO'] },
                { feature: 'Anahtar kelime araştırması', values: [true, true, true] },
                { feature: 'Sayfa içi optimizasyon reçetesi', values: [true, true, true] },
                { feature: 'Looker Studio kurulumu', values: [true, true, true] },
                { feature: 'GSC ve GA kurulumu', values: ['-', true, true] },
                { feature: 'İçerik stratejisi dokümanı', values: ['-', '-', true] },
                { feature: 'Dış SEO (Backlink inşası)', values: ['-', '-', true] },
                { feature: 'Rekabet analizi', values: ['-', '1 Rakip', '2 Rakip'] },
                { feature: 'Sayfa sayısı', values: ['1-9', '10-19', '20-30'] },
                { feature: 'SEO Audit', values: ['-', '3 Ayda 1', 'Ayda 1'] },
                { feature: 'Yapay Zeka (AI) Optimizasyonu', values: ['-', '-', true] }
            ],
            note: '(*) KDV hariçtir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Organik Büyüme Paketleri',
            description: 'khilonfast ile teknik SEO, içerik optimizasyonu ve otorite inşası süreçlerinizi tek bir noktadan yönetin.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺32.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiGlobeAlt />,
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
                            description: 'Dijital pazarlamayı düşük bütçe ve minimal riskle keşfetmek için ideal.',
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
                            description: 'Gelişmiş hedefleme ve optimizasyon teknikleriyle etkileşimi artırın.',
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
                            description: 'Pazarda hakimiyet kurmayı hedefleyen büyük işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın!',
                            icon: <HiRocketLaunch />
                        }
                    ]
                }
            ]
        },
        testimonial: {
            quote: "SEO çalışmalarına başladıktan sonra organik trafiğimiz 6 ay içinde 3 katına çıktı. khilonfast'in teknik uzmanlığı gerçekten fark yaratıyor.",
            author: "Caner Özkan",
            role: "E-ticaret Direktörü"
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
        ],
        authorizationSection: {
            title: "SEO Yetkilendirme Adımları",
            description: "SEO süreçlerinin sağlıklı yürütülmesi için aşağıdaki araçların yetkilendirilmesi gerekmektedir.",
            cards: [
                {
                    title: "Google Search Console Yetkilendirme",
                    description: "Detaylı bir içerik stratejisi için Google Search Console yetkilerini ekleyin.",
                    highlightText: "Organik görünürlüğünüzü analiz ederek performansınızı geliştirin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/#contact",
                    theme: "light" as const
                },
                {
                    title: "Google Analytics Yetkilendirme",
                    description: "Detaylı analiz için Google Analytics erişimlerini tanımlayın.",
                    highlightText: "Analiz süreçlerinizin ölçüm doğruluğunu artırın.",
                    buttonText: "KEŞFET",
                    buttonLink: "/#process",
                    theme: "dark" as const
                }
            ]
        }
    }

    return <ServicePageTemplate {...seoConfig} />
}
