import {
    HiStar,
    HiBolt,
    HiCpuChip,
    HiDocumentMagnifyingGlass,
    HiArrowsPointingIn,
    HiSparkles,
    HiAcademicCap,
    HiChartBar,
    HiCloudArrowUp,
    HiQueueList,
    HiCommandLine
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function MaestroAI() {
    const maestroConfig = {
        hero: {
            title: 'B2B Pazarlama Stratejinizi Maestro AI ile Yönetin',
            subtitle: (
                <>
                    B2B Sektörü için özelleştirilmiş<br />
                    Maestro AI Pazarlama Stratejisti ile<br />
                    Başarıya Ulaşın
                </>
            ),
            description: 'CRM’den PR’a, pazar araştırmasından dijital pazarlamaya, birebir pazarlamadan pazarlama stratejilerine kadar uzman ekiplerin deneyimiyle beslenmiş yapay zeka modülümüz; doğru kararı almanıza yardımcı olur, işleri hızlandırır ve pazarlamanızı somut sonuçlara dönüştürür.',
            buttonText: 'Satın Al',
            buttonLink: '#pricing',
            image: '/img/maestro-ai-hero.png',
            videoUrl: 'https://www.youtube.com/embed/fiHpDDF440M',
            hideBadge: true,
            badgeText: "Yapay Zeka Gücü",
            badgeIcon: <HiBolt />,
            themeColor: '#f9fafb'
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'Maestro AI' }
        ],
        videoShowcase: {
            tag: 'B2B Sektörü Pazarlama Departmanı için Yapay Zeka Asistanı',
            title: (
                <>
                    Pazarlama Kararlarınızı
                    <span className="highlight"> Maestro AI</span> ile Hızlandırın
                </>
            ),
            description: 'B2B sektörü için oluşturulmuş; CRM’den PR’a, pazar araştırmasından dijital pazarlamaya kadar uzman ekiplerin deneyimiyle beslenmiş yapay zeka modülümüz; doğru kararı almanıza yardımcı olur, işleri hızlandırır ve pazarlamanızı somut sonuçlara dönüştürür.',
            videoUrl: 'https://vimeo.com/1045939223'
        },
        featuresSection: {
            tag: 'Temel Yetenekler',
            title: 'Neden Maestro AI?',
            description: 'B2B dünyasının karmaşık yapısını anlayan ve buna uygun çözümler üreten bir stratejist.',
            features: [
                {
                    title: 'Farklı Disiplinler Bir Arada',
                    description: 'Maestro AI, farklı pazarlama disiplinlerini birleştirerek bütüncül bir çözüm sağlar.',
                    icon: <HiArrowsPointingIn />
                },
                {
                    title: 'Hız Kazandırır',
                    description: 'Toplantılar, araştırmalar, yıllar ile oluşacak sektörel tecrübe kazanımını hızlandırır.',
                    icon: <HiBolt />
                },
                {
                    title: 'Bilge Stratejist',
                    description: 'Endüstriyel Gıda & Şef Çözümleri Sektörü Pazarlama konularında eğitimli',
                    icon: <HiAcademicCap />
                },
                {
                    title: 'Sonuç Odaklı',
                    description: 'Veriler → öneriler → uygulanabilir sonuçlar.',
                    icon: <HiChartBar />
                },
                {
                    title: 'Bellek',
                    description: 'Maestro AI şirketiniz ile ilgili konuları unutmaz, sektörü tanır. Sektör hafızasını koruyarak, turnover nedeniyle bilginin kaybolmasını engeller.',
                    icon: <HiCpuChip />
                },
                {
                    title: 'Sektöre Özel Yönlendirme',
                    description: 'Sektöre özgü verilerle yetiştiği için sizi doğru yönlendirir. Genel çözümler değil, doğrudan işinize uygun stratejiler sunar.',
                    icon: <HiSparkles />
                },
                {
                    title: 'Tarafsız Analiz',
                    description: 'Önyargısız çalışır. Veriler ve gerçekler üzerinden karar almayı destekleyerek, insanların eksik kaldığı noktaları tamamlar.',
                    icon: <HiDocumentMagnifyingGlass />
                },
                {
                    title: 'Sürekli Öğrenme',
                    description: 'Yeni kampanyalar, müşteri verileri ve pazar değişimlerinden sürekli öğrenir. Her gün daha doğru ve güncel öneriler sunar.',
                    icon: <HiStar />
                }
            ]
        },
        processSection: {
            tag: 'İşleyiş Süreci',
            title: 'Maestro AI Nasıl Çalışır?',
            description: 'B2B sektörüne özel geliştirilmiş AI asistanımız ile pazarlama stratejilerinizi güçlendirin.',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Soru',
                    description: 'Satış düşüşü, kampanya performansı, yeni ürün lansmanı vb.',
                    icon: <HiCloudArrowUp />
                },
                {
                    stepNumber: 2,
                    title: 'Analiz',
                    description: 'CRM, pazar, sosyal medya ve reklam verilerini sentezler.',
                    icon: <HiQueueList />
                },
                {
                    stepNumber: 3,
                    title: 'Öneri',
                    description: 'Kampanya mesajı, kanal seçimi, kreatif öneri, raporlar.',
                    icon: <HiSparkles />
                },
                {
                    stepNumber: 4,
                    title: 'Tecrübe',
                    description: 'Haftalar sürecek kararlaru, işleri saatler içerisinde bitirin.',
                    icon: <HiCommandLine />
                }
            ]
        },
        pricingSection: {
            tag: 'Planlar',
            title: 'Size Uygun Planı Seçin',
            description: 'B2B sektörüne özel geliştirilmiş AI asistanımız ile pazarlama stratejilerinizi güçlendirin.',
            packages: [
                {
                    id: 'kredili-maestro',
                    name: 'Kredili Maestro',
                    price: '1.200TL',
                    period: 'ay',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    icon: <HiStar />,
                    features: [
                        'Orta ölçekli işletmeler için ideal',
                        'Dijital pazarlama strateji optimize',
                        'Genişletilmiş raporlama içeriği',
                        'İçerik ve reklam bütçe planlama',
                        'Sektörel gelişim takibi'
                    ],
                    buttonText: 'Hemen Başlayın',
                    buttonLink: '/#contact'
                },
                {
                    id: 'sinirsiz-maestro',
                    name: 'Sınırsız Maestro',
                    price: '2.000TL',
                    period: 'ay',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    icon: <HiBolt />,
                    isPopular: true,
                    features: [
                        'Daha geniş kitlelere ulaşım',
                        'Aylık raporlar ve performans izleme',
                        'Dijital görünürlük artışı',
                        'Gelişmiş strateji yönetimi',
                        'Sürekli kampanya optimizasyonu'
                    ],
                    buttonText: 'Üye Ol',
                    buttonLink: '/#contact'
                }
            ]
        },
        testimonial: {
            quote: "Maestro AI ile pazarlama stratejilerimizi haftalar değil, saatler içinde kurguluyoruz. Veriye dayalı kararlar alırken kazandığımız hız paha biçilemez.",
            author: "Ali Yılmaz",
            role: "Pazarlama Müdürü"
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
                answer: 'khilonfast, dijital dünyada hızlı, verimli ve sonuç odaklı çözümler arayan firmalar için mükemmel bir iş ortağıdır. Veriye dayalı kararlar almayı seven, metriklerle çalışabilen, dijital pazarlamanın gücüne inanan ve yeni nesil araçları kullanmaya istekli olan firmalar için Khilonfast ideal bir çözüm sunar. Ayrıca, e-posta ve diğer dijital iletişim araçlarını düzenli olarak kullanan, Khilonfast tarafından sağlanan formları dolduracak zaman ve disipline sahip olan, ve uzman ekibin önerilerine güvenerek stratejik rehberlik arayan firmalar, Khilonfast ile çalışırken en yüksek verimi elde ederler.'
            },
            {
                question: 'Khilonfast ile iletişimi nasıl sağlayabilirim?',
                answer: 'Khilonfast ile tüm iletişim, kullanıcı dostu sitemiz ve e-posta üzerinden gerçekleştirilir. Hizmeti satın aldıktan sonra, size gerekli formlar sistem üzerinden iletilir. Bu formları doldurduktan sonra, Khilonfast ekibi titizlikle inceleyerek gerekli kurulumları yapar ve operasyonu başlatır. Sürecin her aşamasında, e-posta yoluyla size bilgilendirme yapılır ve gerekli tüm destek sağlanır.'
            },
            {
                question: 'Hizmet satın alımdan sonra süreç nasıl ilerleyecek?',
                answer: 'Khilonfast üzerinden hizmet satın alımını tamamladığınızda, size sitemiz üzerinden doldurmanız gereken formlar iletilir. Bu formlar, hizmetin doğru yapılandırılması için gereken bilgileri toplar. Formlar doldurulduktan sonra, Khilonfast ekibi gerekli tanımlamaları yapar ve hizmetinizi aktif hale getirir. Tüm süreç boyunca, gerekli bilgiler ve talimatlar e-posta ile size iletilecektir.'
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
        ]
    }


    return <ServicePageTemplate {...maestroConfig} />
}
