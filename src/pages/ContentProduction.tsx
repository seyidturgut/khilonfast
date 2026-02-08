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
    HiUser,
    HiUserGroup,
    HiRocketLaunch
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function ContentProduction() {
    const contentConfig = {
        hero: {
            title: 'Görünürlüğünüzü Artırın!',
            subtitle: 'İçerik üretimindeki zaman ve yaratıcılık zorluklarını aşın!',
            description: 'khilonfast ile hedef kitlenize uygun, SEO uyumlu içerikler üreterek marka görünürlüğünüzü artırın. Profesyonel içerik çözümleriyle zaman ve kaynak sorunlarını geride bırakın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/content_production_hero_1769620227118.png',
            badgeText: "Görünürlüğünüzü Artırın! Zorlukları Aşın!",
            badgeIcon: <HiPencilSquare />,
            themeColor: '#FEF9C3' // Light yellow theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
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
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm',
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
        comparisonTable: {
            headers: [
                { title: 'Core', icon: <HiKey /> },
                { title: 'Growth', icon: <HiChartBar /> },
                { title: 'Ultimate', icon: <HiTrophy /> }
            ],
            rows: [
                { feature: 'Blog Yazısı', values: ['4 içerik x 750 kelime', '6 içerik x 750 kelime', '8 içerik x 750 kelime'] },
                { feature: 'Görsel', values: ['-', true, true] },
                { feature: 'Revizyon Hakkı', values: ['1', '2', '4'] }
            ],
            note: '(*) KDV hariçtir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Net ve Şeffaf Fiyatlandırma',
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
                    price: '₺29.000*',
                    period: 'Ay',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    isPopular: true,
                    icon: <HiChartBar />,
                    features: [],
                    buttonText: 'ÜYE OL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Daha geniş bir kitleye hitap etmek isteyen işletmeler.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Daha fazla içerik ve stratejik planlama isteyen işletmeler için uygundur.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺49.000*',
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
                            description: 'Profesyonel içerik ve kapsamlı strateji ile maksimum etkileşim sağlar.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                }
            ]
        },
        testimonial: {
            quote: "İçerik üretimindeki tıkanıklığımızı khilonfast ile aştık. Düzenli ve kaliteli içerikler sayesinde organik trafiğimizde %40 artış gördük.",
            author: "Zeynep Aydın",
            role: "Pazarlama Müdürü"
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
            title: "YETKİLENDİRME",
            description: "İçerik üretim süreçlerinin verimli yönetilmesi için aşağıdaki araçların yetkilendirilmesi gerekmektedir.",
            cards: [
                {
                    title: "Google Search Console Yetkilendirme",
                    description: "Detaylı bir içerik stratejisi için Google Search Console yetkilerini ekleyin.",
                    highlightText: "Organik görünürlüğünüzü analiz ederek performansınızı geliştirin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/hizmetlerimiz/google-search-console-kurulum-akisi",
                    theme: "light" as const
                },
                {
                    title: "Google Analytics Yetkilendirme",
                    description: "Detaylı analiz için Google Analytics erişimlerini tanımlayın.",
                    highlightText: "Analiz süreçlerinizin ölçüm doğruluğunu artırın.",
                    buttonText: "KEŞFET",
                    buttonLink: "/google-analytics-kurulum-akisi",
                    theme: "dark" as const
                }
            ]
        }
    }

    return <ServicePageTemplate {...contentConfig} />
}
