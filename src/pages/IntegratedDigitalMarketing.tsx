import {
    HiChartBar,

    HiSparkles,
    HiMagnifyingGlass,

    HiGlobeAlt,
    HiKey,
    HiTrophy,
    HiCheckBadge,
    HiArrowTrendingUp,
    HiChartPie,
    HiUserGroup,
    HiRocketLaunch,
    HiShoppingCart,
    HiClipboardDocumentList
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function IntegratedDigitalMarketing() {
    const idmConfig = {
        hero: {
            title: 'Dijital Kanalları Tek Bir Stratejide Birleştirin!',
            subtitle: 'Bütünleşik pazarlama stratejileri ile markanızı büyütün!',
            description: 'khilonfast ile bütçenizi doğru kanallara yönlendirerek dijital pazarlamanızı güçlendirin. Tüm kanallarınızı tek bir strateji ile yöneterek performansınızı artırın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/img/integrated-marketing-hero.png',
            badgeText: "360° Pazarlama Gücü! Rekabet Üstünlüğü!",
            badgeIcon: <HiChartBar />,
            themeColor: '#F0F9FF' // Very soft blue theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'Bütünleşik Dijital Pazarlama' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Bütünleşik Dijital Pazarlama ile
                    <span className="highlight"> Başarıya Ulaşın</span>
                </>
            ),
            description: 'Dijital kanalların entegrasyonu ile daha fazla etkileşim, daha fazla dönüşüm elde edin. khilonfast ile pazarlama yatırımlarınızı optimize edin.',
            videoUrl: 'https://www.youtube.com/embed/hWXnoXCsPMw'
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
        authorizationSection: {
            title: "YETKİLENDİRME",
            description: "",
            cards: [
                {
                    title: "Yetkilendirme",
                    description: "Hizmeti başlatmak için pazarlama araçlarına erişim tanımlayın.",
                    highlightText: "Tüm kanallarda entegre ve tutarlı iletişim sağlayın.",
                    buttonText: "KEŞFET",
                    buttonLink: "/search-ads-google-reklamlari-kurulum-akisi",
                    theme: "light" as const
                },
                {
                    title: "Nasıl Çalışır?",
                    description: "Sürecin baştan sona nasıl ilerlediğini adım adım görün.",
                    highlightText: "Doğru brief → net süreç → ölçülebilir sonuçları keşfedin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/google-tag-manager-kurulum-akisi",
                    theme: "dark" as const
                }
            ]
        },
        processSection: {
            tag: '4 Adımda Bütünleşme',
            title: 'Nasıl Çalışır?',
            description: 'Parçalı yönetimden kurtulun, bütünleşik güçle tanışın.',
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Satın Al',
                    description: 'İhtiyacınıza uygun paketi seçin. Satın alma işlemi tamamlandığında süreç otomatik olarak başlar.',
                    icon: <HiShoppingCart />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Yetkilendir',
                    description: (
                        <>
                            khilonfast ekibine gerekli erişim izinlerini verin. <a href="#authorization" className="font-bold underline text-blue-500 hover:text-blue-700">Yetkilendirme detayları için tıklayın&gt;&gt;</a>
                        </>
                    ),
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
                    description: 'khilonfast ekibi brief’inizi analiz eder ve sizi nasıl anladığını gösteren de-brief raporunu hazırlar. Bu rapor, hizmetin yönünü birlikte netleştirmemizi sağlar.',
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
        comparisonTable: {
            headers: [
                { title: 'Core', icon: <HiKey /> },
                { title: 'Growth', icon: <HiChartBar /> },
                { title: 'Ultimate', icon: <HiTrophy /> }
            ],
            rows: [
                // SEO Section
                { feature: 'SEO', values: [], isSectionHeader: true },
                { feature: 'Anahtar kelime araştırması', values: [true, true, true] },
                { feature: 'Sayfa içi optimizasyon (on-page)', values: [true, true, true] },
                { feature: 'Looker Studio kurulumu', values: [true, true, true] },
                { feature: 'GSC ve GA kurulumu', values: [true, true, true] },
                { feature: 'İçerik stratejisi dökümanı', values: ['-', '-', true] },
                { feature: 'Dış SEO (Backlink inşası)', values: ['-', '-', true] },
                { feature: 'Rekabet analizi', values: ['-', '1 Rakip', '2 Rakip'] },
                { feature: 'Sayfa sayısı', values: ['1-3', '10-15', '20-30'] },
                { feature: 'Seo Audit', values: ['-', '3 Ayda 1', 'Ayda 1'] },
                { feature: 'Yapay Zeka (AI) Optimizasyonu', values: ['-', '-', true] },
                { feature: 'Hedef Kitle Odaklı Blog Yazısı Üretimi', values: ['2 içerik X 750 kelime', '4 içerik X 750 kelime', '6 içerik X 750 kelime'] },
                { feature: 'Hedef Kitle E-posta (Açık Veri/YIL', values: ['-', '-', '10.000 e-posta'] },
                { feature: 'Sıfırın Tık / e-bülten Ağı', values: ['-', '-', true] },

                // Reklamlar Section
                { feature: 'Reklamlar', values: [], isSectionHeader: true },
                { feature: 'Arama Reklamları', values: ['Temel Google Search Ads kurulumu ve temel anahtar kelime araştırması', 'Standart Google Search Ads kurulumu', 'Pro Google Search Ads kurulumu, gelişmiş anahtar kelime araştırması ve reklam metni oluşturma'] },
                { feature: 'Ek kurulum ücreti', values: ['Aylık paketlerde kurulum ücreti, ilk üç aylık ücret kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde kurulum ücreti, ilk üç aylık ücret kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde kurulum ücreti, ilk üç aylık ücret kadar olup sadece ilk ay uygulanır.'] },
                { feature: 'Reklam kampanyası optimizasyonu', values: ['Temel', true, 'Sürekli'] },
                { feature: 'Reklam Uzantıları ve hedefleme', values: ['Sınırlı', 'Lokasyon, zaman, cihaz', 'İnmarket vb. demografik kitle segmentasyonu'] },

                // Sosyal Medya (SM) Reklamları Section
                { feature: 'Sosyal Medya (SM) Reklamları', values: [], isSectionHeader: true },
                { feature: 'Profil kurulumu', values: ['1 Meta Hesap', '2 Hesap (Meta + Linkedin veya Tiktok)', '3 Hesap (Meta ve/veya Linkedin ve/veya Tiktok)'] },
                { feature: 'Kampanya yönetimi', values: ['2 Kampanya', '4 Kampanya', '6 Kampanya'] },
                { feature: 'Aylık optimizasyon', values: [true, true, true] },

                // Genel Reklam Yönetimi Section
                { feature: 'Genel Reklam Yönetimi', values: [], isSectionHeader: true },
                { feature: 'Performans raporu', values: ['E-posta ile, ayda 1 kez raporlama', 'E-posta ile, 2 haftada 1 raporlama', 'E-posta ile, haftada 1 raporlama'] },
                { feature: 'Reklam Bütçesi Politikası', values: ['Reklam bütçesinin %10 u Core paket ücretini aşmıyorsa, Core paket üzerinden fiyatlandırılır. Aştığında, Growth pakete geçilir.', 'Reklam bütçesinin %10 u Growth paket ücretini aşmıyorsa, Growth paket üzerinden fiyatlandırılır. Aştığında, Ultimate pakete geçilir.', 'Reklam bütçesinin %10 u Ultimate paket ücretini aşmıyorsa, Ultimate paket üzerinden fiyatlandırılır. Aşması durumunda, ek reklamcıdan Ultimate paket hizmet bedelinin %10 u üzerine %10 reklam bütçesi eklenerek faturalandırılır. Sonraki aylarda da bulunduğu en üst paketten fiyatlandırma devam eder.'] },
                { feature: 'Ek kurulum ücreti', values: ['kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.'] }
            ],
            note: 'Fiyatlara KDV dahil değildir. Medya bütçeleri ve 3. parti araç maliyetleri hariçtir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: '360° Dijital Pazarlama Yönetimi',
            description: 'Tüm pazarlama ihtiyaçlarınızı tek bir yerden karşılayarak operasyonel yüklerden kurtulun.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺99.000',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiKey />,
                    features: [],
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Küçük işletmeler için tasarlanmış, dijital pazarlamada güçlü bir başlangıç yapmak isteyen firmalara uygundur. Markaların dijital varlıklarını güçlendirmesine destek olur.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'SEO, sosyal medya ve arama ağı reklamlarıyla dijital görünürlüğünüzü artırın. Markanızın dijital varlıklarını güçlendirerek fark edilmenizi sağlar. Dijital dünyada ilk adımlarınızı sağlam ve ölçülebilir bir şekilde atın.',
                            icon: <HiRocketLaunch />
                        }
                    ],
                    buttonText: 'ÜYE OL'
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '₺149.000',
                    period: 'Ay',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    isPopular: true,
                    icon: <HiArrowTrendingUp />,
                    features: [],
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Orta ölçekli işletmelerin dijital pazarlama stratejilerini büyütmek ve optimize etmek isteyenler için idealdir. Müşteri kazanımı, mevcut kitleyle etkileşim için tasarlanmıştır.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Stratejilerinizi optimize ederek daha fazla dönüşüm elde edin. Müşteri kazanımınızı artırın ve mevcut kitlenizle etkileşiminizi güçlendirin. Dijital pazarlama faaliyetlerinizi veriye dayalı şekilde büyütün.',
                            icon: <HiRocketLaunch />
                        }
                    ],
                    buttonText: 'ÜYE OL'
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '₺319.000',
                    period: 'Ay',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [],
                    details: [
                        {
                            title: 'Kimler İçin Uygun',
                            description: 'Büyük işletmeler için tam kapsamlı dijital pazarlama stratejisi sunar. Strateji odaklı yaklaşımıyla uzun vadeli büyüme, sürekli optimizasyon ve rekabet avantajı sağlar.',
                            icon: <HiUserGroup />
                        },
                        {
                            title: 'Neden Tercih Edilmeli',
                            description: 'Veri odaklı stratejilerle maksimum dönüşüm ve etkileşim sağlayın. Rekabeti geride bırakan, uzun vadeli bir büyüme altyapısı kurun. Tüm dijital pazarlama süreçlerinizi tek çatı altında yönetin ve optimize edin.',
                            icon: <HiRocketLaunch />
                        }
                    ],
                    buttonText: 'ÜYE OL'
                }
            ]
        },
        testimonial: {
            quote: "Tüm dijital süreçlerimizi tek bir stratejide birleştirdikten sonra pazarlama bütçemizin geri dönüşü %45 oranında arttı.",
            author: "Caner Özkan",
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

    return <ServicePageTemplate {...idmConfig} />
}
