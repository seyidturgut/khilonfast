import {
    HiDocumentText,
    HiMagnifyingGlass,
    HiSparkles,
    HiArrowTrendingUp,
    HiTrophy,
    HiCheckBadge,
    HiCreditCard,
    HiKey,
    HiClipboardDocumentList,
    HiGlobeAlt,
    HiChartPie,
    HiUserGroup
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function ContentStrategy() {
    const csConfig = {
        hero: {
            title: 'Doğru İçerik Stratejisi ile Hedef Kitlenize Ulaşın!',
            subtitle: 'Hedef kitlenizi anlayın ve etkili içerik stratejileri oluşturun!',
            description: 'khilonfast ile marka hedeflerinize uygun, stratejik içerikler oluşturarak hedef kitlenizle güçlü bir bağ kurun. Çeşitli içerik formatlarıyla etkileşimi artırın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/img/content-strategy-hero.png',
            badgeText: "Stratejik İçerik Planı! Marka Otoritesi!",
            badgeIcon: <HiDocumentText />,
            themeColor: '#FEF3C7' // Warm yellow theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'İçerik Stratejisi' }
        ],
        videoShowcase: {
            tag: 'İçerik Gücü',
            title: (
                <>
                    Etkili İçerik Stratejileriyle
                    <span className="highlight"> Marka Bağlılığı Oluşturun</span>
                </>
            ),
            description: 'Hedef kitlenizin ilgisini çeken içerikler üretin. khilonfast ile doğru içerik stratejileri geliştirerek marka bilinirliğinizi artırın.',
            videoUrl: 'https://www.youtube.com/embed/zfz5tG3i5ck'
        },

        processSection: {
            tag: '5 adımda khilonfast',
            title: 'Nasıl Çalışır?',
            description: 'Sadece birkaç adımda dijital pazarlama sürecinizi başlatın. Tüm adımlar şeffaf, hızlı ve ölçülebilir şekilde tasarlandı.',
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Satın Al',
                    description: 'İhtiyacınıza uygun paketi seçin. Satın alma işlemi tamamlandığında süreç otomatik olarak başlar.',
                    icon: <HiCreditCard />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Yetkilendir',
                    description: 'khilonfast ekibine gerekli erişim izinlerini verin. Yetkilendirme detayları için tıklayın>>',
                    icon: <HiKey />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Brief Ver',
                    description: 'Size gönderilen formdaki soruları cevaplayarak hedeflerinizi, hedef kitlenizi ve marka dilinizi paylaşın. Bu form, stratejinin temelini oluşturur.',
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Analiz',
                    description: 'khilonfast ekibi brief\'inizi analiz eder ve sizi nasıl anladığını gösteren de-brief raporunu hazırlar. Bu rapor, hizmetin yönünü birlikte netleştirmemizi sağlar.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 5,
                    title: 'Adım 5: Onay',
                    description: 'De-brief raporunun onaylanması ile isteyin. hizmet kurulumları başlar ve ölçümlemeler 1 hafta içerisinde aktif edilir.',
                    icon: <HiCheckBadge />
                }
            ]
        },
        authorizationSection: {
            title: "YETKİLENDİRME",
            description: "Google Analytics veya Google Search Console yetkilendirmesi içerik stratejisi hizmeti için zorunlu değildir; ancak bu araçlar web sitenizde tanımlıysa, khilonfast verileri daha derinlemesine analiz ederek stratejinizi çok daha doğru yönlendirebilir. Yetkilendirme adımlarına aşağıdaki kutucuklardan ulaşabilirsiniz.",
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
                    buttonLink: "/#contact",
                    theme: "dark" as const
                }
            ]
        },

        pricingSection: {
            tag: 'İçerik Stratejisi Paketi',
            title: 'İçerik Stratejisi Çözümleri',
            description: 'Doğru içerik stratejisiyle markanızın hedef kitlesine ulaşın. khilonfast ile içerik üretiminizi stratejik bir düzeye taşıyın.',
            packages: [
                {
                    id: 'single-plan',
                    name: 'Tek Fiyat',
                    price: '₺80.000',
                    period: 'tek sefer*',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    isPopular: true,
                    icon: <HiTrophy />,
                    buttonText: 'SATIN AL',
                    features: [
                        'Her ölçekten firma için profesyonel strateji',
                        'İçerik üretim süreçlerine rehberlik',
                        'Firma özelinde pazarlama hedeflerine ulaşma',
                        'Üretimi optimize eden ve iletişimi güçlendiren çözüm',
                        'SEO uyumlu içerik planlaması',
                        'Uzun vadeli ve sürdürülebilir strateji belgesi'
                    ]
                }
            ]
        },
        comparisonTable: {
            headers: [
                { title: 'İçerik Stratejisi Paketi', icon: <HiCheckBadge /> }
            ],
            rows: [
                { feature: 'Doküman İçeriği', values: ['Tek bir kapsamlı içerik stratejisi belgesi'] },
                { feature: 'Strateji Kapsamı', values: ['Hedef kitle analizi, içerik planlama, SEO uyumlu içerik önerileri'] },
                { feature: 'Hedef Kitle Tanımlaması', values: [true] },
                { feature: 'İçerik Konuları ve Frekansı', values: [true] }
            ],
            note: 'Fiyatlara KDV dahil değildir.'
        },
        testimonial: {
            quote: "İçerik stratejisi dökümanı sayesinde içerik üretim sürecimiz rayına oturdu. Artık neyi, neden ve kime ürettiğimizi çok daha iyi biliyoruz.",
            author: "Zeynep Aydın",
            role: "Pazarlama Müdürü"
        },
        approachSection: {
            title: 'Khilonfast Yaklaşımı',
            description: 'Markanızın potansiyelini 360 derece stratejilerle açığa çıkarıyoruz.',
            items: [
                {
                    title: '360 Derece Bakış Açısı',
                    subtitle: 'Her Detayı Kapsayan khilonfast Yaklaşımı',
                    description: 'Khilon olarak pazarlama dünyasına geniş bir pencereden bakıyoruz. 360 derece bakış açısı, tek bir parçaya odaklanmak yerine tüm süreçleri kapsayan bir anlayış gerektiriyor. Bu kapsamlı yaklaşım, markaların ihtiyaçlarını derinlemesine anlayarak, tüm pazarlama kanallarını entegre bir strateji ile yönetmemize olanak tanıyor. khilon ile aldığınız en mikro hizmette dahi, size 360 derece bakış açısı ile o işi hedeflerinize, amacınıza, stratejinize uyumlu hale getiriyoruz.',
                    icon: <HiGlobeAlt />
                },
                {
                    title: 'Büyüme Odaklı Stratejiler',
                    subtitle: 'Sektöre Özel Büyüme Planları',
                    description: 'Her sektörün kendine özgü dinamikleri bulunuyor ve Khilon, bu farklılıkları dikkate alarak büyüme stratejilerinizi geliştiriyor. Markanızın bulunduğu sektöre özel olarak hazırladığımız planlar, hedef kitlenizle daha etkin iletişim kurmanızı sağlıyoruz. Sürdürülebilir büyüme için pazardaki eğilimleri yakından takip eder ve sektörel farkındalık ile stratejilerinizi yönetiyoruz.',
                    icon: <HiArrowTrendingUp />
                },
                {
                    title: 'Veri Odaklı Pazarlama',
                    subtitle: 'Daha Fazla Veri, Daha Fazla Başarı',
                    description: 'Khilon, veriyi sadece toplamakla kalmaz, aksiyona dönüştürülebilir içgörüler sunar. Tüketici davranışlarını analiz ederek, dönüşüm oranlarını optimize eden çözümler üretiriz. Bu şekilde, markanızın mevcut durumunu analiz etmenin ötesine geçerek, veriye dayalı tahminlerle geleceğe yönelik adımlar atmanızı sağlar. Müşteri segmentasyonu, kişiselleştirilmiş kampanyalar ve daha etkili hedeflemeler ile veriyi bir fırsata dönüştürmenize yardımcı oluyoruz.',
                    icon: <HiChartPie />
                },
                {
                    title: 'İnovasyon ile Fark',
                    subtitle: 'Rakiplerden Bir Adım Önde Olun',
                    description: 'Pazarlama dünyasında kalabalığın içinde kaybolmamak için sürekli yenilikçi olmak gerekiyor. Khilon, ileri veri analitiği ve yapay zeka destekli araçları kullanarak müşterilerine yenilikçi çözümler sunar. Bu sayede, rakiplerinizden bir adım önde olmanızı sağlar, markanızı daima yeniliklerle destekliyoruz.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Stratejik İş Ortağı',
                    subtitle: 'Uzun Vadeli Başarı İçin Güvenilir Partneriniz',
                    description: 'Khilon sadece bir hizmet sağlayıcı değil, uzun vadeli başarılar için stratejik bir iş ortağıdır. İş hedeflerinizi tam olarak anlayarak, sadece kısa vadeli kampanyalar değil, uzun vadeli ve sürdürülebilir başarı stratejileri geliştiririz. Markanızın sürekli büyümesi ve başarıya ulaşması için güvenebileceğiniz bir iş ortağı olarak yanınızdayız.',
                    icon: <HiUserGroup />
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

    return <ServicePageTemplate {...csConfig} />
}
