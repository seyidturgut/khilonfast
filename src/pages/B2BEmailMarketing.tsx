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
    HiCommandLine,
    HiUserGroup,
    HiRocketLaunch
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function B2BEmailMarketing() {
    const emailConfig = {
        hero: {
            title: 'Doğru Kitleye Ulaşın!',
            subtitle: 'Doğru hedeflemelerle e-posta kampanyalarınızı kişiselleştirin!',
            description: 'khilonfast ile hedef kitlenizi etkileyen e-posta kampanyaları oluşturun. Kişiselleştirilmiş içeriklerle açılma oranlarınızı artırın ve düşük tıklama oranlarını geride bırakın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/b2b_email_marketing_hero_1769620679265.png',
            badgeText: "Doğru Kitleye Ulaşın! Etkileşimi Artırın!",
            badgeIcon: <HiEnvelope />,
            themeColor: '#FEF9C3' // Warm yellow/lime theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
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
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm',
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
        comparisonTable: {
            headers: [
                { title: 'Core', icon: <HiKey /> },
                { title: 'Growth', icon: <HiChartBar /> },
                { title: 'Ultimate', icon: <HiTrophy /> }
            ],
            rows: [
                { feature: 'Veritabanı Miktarı', values: ['1,000 kişilik data', '5,000 kişilik data', '10,000 kişilik data'] },
                { feature: 'Email İçerik Üretimi', values: ['Temel HTML email tasarımı', 'İleri düzey HTML email tasarımı ve kişiselleştirme', 'İleri düzey HTML email tasarımı ve kişiselleştirme'] },
                { feature: 'Dönüşüm Optimizasyonu', values: ['Temel dönüşüm takip araçları', 'Gelişmiş dönüşüm takip ve analiz', 'Profesyonel dönüşüm analiz ve raporlama'] },
                { feature: 'Revizyon Hakkı', values: ['1 revizyon hakkı', '2 revizyon hakkı', '3 revizyon hakkı'] },
                { feature: 'Gönderim Raporlaması', values: ['Aylık rapor', 'Aylık rapor', 'Aylık rapor'] }
            ],
            note: '(*) KDV hariçtir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Net ve Şeffaf Fiyatlandırma',
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
                    buttonText: 'ÜYE OL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Küçük işletmeler ve B2B pazarlama süreçlerine yeni adım atan firmalar için idealdir.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Düşük maliyetle başlayarak, sınırlı bir kitleye doğrudan ulaşma imkanı sunar. Bu paket, küçük firmalar için verimli ve ekonomik bir çözüm sağlar.',
                            icon: <HiRocketLaunch />
                        }
                    ]
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
                    buttonText: 'ÜYE OL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: '5.000 e-posta ile daha etkili ve geniş çaplı pazarlama kampanyaları yapmak isteyen işletmeler için idealdir.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Daha geniş veri tabanıyla daha fazla potansiyel müşteriye ulaşmayı hedefleyen işletmeler için güçlü bir destek sağlar. Dijital pazarlamayı desteklemek için idealdir.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺39.000*',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    buttonText: 'ÜYE OL',
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: '10.000 e-posta ile müşteri kitlesini genişletmek isteyen firmalar için mükemmel bir çözümdür.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Yüksek hacimde müşteri datası ile güçlü ve optimize edilmiş kampanyalar düzenlemek isteyen firmalar için maksimum verimlilik sağlar.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                }
            ]
        },
        testimonial: {
            quote: "E-posta pazarlamasında doğru hedefleme ile satış döngümüz %30 kısaldı. khilonfast'in B2B tecrübesi gerçekten fark yaratıyor.",
            author: "Zeynep Aras",
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
        growthCTA: {
            title: "Müşteri Listenizi Değere Dönüştürün!",
            description: "Atıl bekleyen e-posta listelerinizi aktif satış kanallarına dönüştürüyoruz. Hemen khilonfast uzmanlığıyla tanışın."
        }
    }

    return <ServicePageTemplate {...emailConfig} />
}
