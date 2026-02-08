import {
    HiChartBar,
    HiKey,
    HiTrophy,
    HiMagnifyingGlass,
    HiChatBubbleLeftRight,
    HiUserGroup,
    HiCheckBadge,
    HiPresentationChartLine,
    HiRocketLaunch,

    HiSignal
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function SocialMediaAds() {
    const smaConfig = {
        hero: {
            title: 'Hedef Kitlenizi Büyütün!',
            subtitle: 'Yetersiz bütçe yönetimi sorununu ortadan kaldırın!',
            description: 'khilonfast ile doğru platform ve strateji seçimiyle sosyal medyada bütçenizi verimli kullanın. Hedef kitlenize en etkili içeriklerle ulaşarak markanızı büyütün.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/img/social-media-ads-hero.png',
            badgeText: "Etkileşimi Artırın! Markanızı Büyütün!",
            badgeIcon: <HiChartBar />,
            themeColor: '#ECFDF5' // Soft emerald theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'Sosyal Medya Reklamcılığı' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    <span className="highlight-text">Yüksek Etkileşim </span> Sağlayın
                </>
            ),
            description: 'Hedef kitlenizin bulunduğu doğru platformlarda, yaratıcı ve sürekli içeriklerle görünür olun. khilonfast ile sosyal medya kampanyalarınızı optimize edin ve sonuçları hızla görün.',
            videoUrl: 'https://www.youtube.com/embed/1rp63c8i-20'
        },
        approachSection: {
            title: 'Stratejik Kampanya Yönetimi',
            description: 'Doğru platform, doğru hedefleme, maksimum etkileşim.',
            items: [
                {
                    title: 'Platform Analizi',
                    subtitle: 'Kanal Seçimi',
                    description: 'Markanız için en doğru sosyal medya kanallarını (Meta, LinkedIn, TikTok) analiz ediyor ve bütçenizi oraya yönlendiriyoruz.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    title: 'Hedef Kitle Optimizasyonu',
                    subtitle: 'Nokta Atışı Erişim',
                    description: 'Demografik ve davranışsal verilerle doğru kişilere doğru mesajla ulaşmanızı sağlıyor, boşa harcamayı önlüyoruz.',
                    icon: <HiUserGroup />
                },
                {
                    title: 'Kreatif Denetim',
                    subtitle: 'Görsel Etki',
                    description: 'Reklam görsellerinizin ve metinlerinizin performansını analiz ediyor, tıklama oranlarını (CTR) artıracak öneriler sunuyoruz.',
                    icon: <HiChatBubbleLeftRight />
                },
                {
                    title: 'Veri Odaklı Yönetim',
                    subtitle: 'Ölçülebilir Başarı',
                    description: 'Her etkileşimi ve dönüşümü takip ediyor, kampanyaları veriye dayalı içgörülerle optimize ediyoruz.',
                    icon: <HiPresentationChartLine />
                },
                {
                    title: 'Remarketing',
                    subtitle: 'Tekrar Hedefleme',
                    description: 'Sitenizi ziyaret eden ancak satın almayan kullanıcıları tekrar hedefleyerek dönüşüm şansını artırıyoruz.',
                    icon: <HiSignal />
                }
            ]
        },
        processSection: {
            tag: '4 Adımda Sosyal Medya',
            title: 'Nasıl Çalışır?',
            description: 'Sosyal medya varlığınızı güçlendirmek için izlediğimiz kanıtlanmış yol haritası.',
            videoUrl: 'https://vimeo.com/1131179237?fl=pl&fe=cm',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Adım 1: Analiz & Persona',
                    description: 'Hedef kitlenizi ve rakiplerinizi analiz eder, ideal müşteri profilini (persona) oluştururuz.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 2,
                    title: 'Adım 2: Medya Planı',
                    description: 'Hangi platformda, ne zaman ve nasıl reklam çıkılacağını belirleyen stratejik planı hazırlarız.',
                    icon: <HiPresentationChartLine />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Kampanya Kurulumu',
                    description: 'Görselleri ve metinleri hazırlar, reklam setlerini oluşturur ve yayına alırız.',
                    icon: <HiRocketLaunch />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Rapor & Scale',
                    description: 'Sonuçları analiz eder, başarılı kampanyaları ölçeklendirir (scale) ve düzenli raporlarız.',
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
                { feature: 'Sosyal Medya Reklamları', values: ['1 Meta Hesabı', '2 Hesap (Meta + linkedin veya tiktok)', '3 Hesap (Meta ve/veya Linkedin ve /veya TikTok)'] },
                { feature: 'Ek kurulum ücreti', values: ['Aylık paketlerde kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.'] },
                { feature: 'Kampanya yönetimi', values: ['2 Kampanya', '4 Kampanya', '6 Kampanya'] },
                { feature: 'Kampanya optimizasyonu', values: ['Temel', true, '✓ Sürekli'] },
                { feature: 'Performans raporu', values: ['✓ E-posta ile, ayda 1 kez raporlama', '✓ E-posta ile, 2 haftada 1 raporlama', '✓ E-posta ile, haftada 1 raporlama'] },
                { feature: 'Reklam Bütçesi Politikası', values: ['Reklam bütçesinin %10\'u core paket ücretini aşmıyorsa core paket üzerinden fiyatlandırılır; aştığında bir üst paketten fiyatlandırılır.', 'Reklam bütçesinin %10\'u growth paket ücretini aşmıyorsa growth paket üzerinden fiyatlandırılır; aştığında bir üst pakete geçilir.', 'Reklam bütçesinin %10\'u ultimate paket ücretini aşmıyorsa ultimate paket üzerinden fiyatlandırılır; aşması durumunda ek tutar yüzdesel olarak eklenir ve sonraki aylarda bulunduğu üst paketten fiyatlandırma devam eder.'] }
            ],
            note: 'Fiyatlara KDV dahil değildir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Platform Odaklı Paketler',
            description: 'khilonfast ile Meta, LinkedIn ve TikTok reklamlarınızı tek bir noktadan profesyonelce yönetin.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺32.000*',
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
                            description: 'Agresif büyüme, pazar liderliği veya maksimum getiri için özel bir performans ekibi kurmak için mükemmel.',
                            icon: <HiRocketLaunch />
                        }
                    ]
                }
            ]
        },
        testimonial: {
            quote: "Sosyal medya reklam bütçemizi khilonfast'a emanet ettikten sonra maliyetlerimizi sabit tutarak erişimimizi 3 katına çıkardık.",
            author: "Aslı Yılmaz",
            role: "Pazarlama Müdürü"
        },
        faqs: [
            {
                question: 'Neden khilonfast ile çalışmayı seçmeliyim?',
                answer: 'khilonfast, kapsamlı dijital pazarlama deneyimi ve veriye dayalı yaklaşımları ile öne çıkar. İşletmenizin ihtiyaçlarına özel çözümler sunar, kampanyalarınızı sürekli optimize eder ve sonuç odaklı çalışır. Khilonfast ile çalışarak, markanızın dijital alanda güçlü bir yer edinmesini sağlayabilirsiniz.'
            },
            {
                question: 'Neden yüz yüze veya online toplantı yapmıyoruz?',
                answer: 'Khilonfast, süreçleri hızlandırmak ve verimliliği artırmak amacıyla dijital iletişim araçlarını tercih eder. Tüm işlemler sitemiz ve e-posta üzerinden yürütülür, bu sayede dünyanın her yerinden hızlı ve etkili bir şekilde hizmet alabilirsiniz. Khilonfast, zaman kaybına yol açan senkron toplantıları ortadan kaldırarak pazarlama hizmetini ölçekleyebiliyor ve tecrübesini tamamen uzmanlığına odaklayarak daha iyi iş yapmayı tercih ediyor. Bu şekilde, üst düzey bir ajansla makul fiyatlarla çalışabilir, zaman kaybına uğramadan işinizin görülmesini sağlayabilirsiniz. Tüm hizmet süreci boyunca ihtiyacınız olan bilgi ve destek, e-posta aracılığıyla sağlanacaktır.'
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
            title: "Sosyal Medya Hesapları Yetkilendirme Adımları",
            description: "Aldığınız hizmet paketine uygun olarak, aşağıda yer alan sosyal medya platformlarının yetkilendirme adımlarını bulabilirsiniz. Bu adımlar, kampanyalarınızın doğru platformlarda etkin biçimde yönetilmesi için gereklidir.",
            cards: [
                {
                    title: "LinkedIn Reklamları",
                    description: "Hizmeti başlatmak için LinkedIn Ads erişimlerini tanımlayın.",
                    highlightText: "B2B hedef kitlenizle doğru temas noktalarında buluşun.",
                    buttonText: "KEŞFET",
                    buttonLink: "/linkedin-reklamlari-kurulum-akisi-khilonfast",
                    theme: "light" as const
                },
                {
                    title: "TikTok Reklamları",
                    description: "Hizmeti başlatmak için TikTok Business erişimlerini paylaşın.",
                    highlightText: "Reklamlarınızın genç hedef kitlelerle etkileşimini güçlendirin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/tiktok-kurulum-akisi",
                    theme: "dark" as const
                },
                {
                    title: "Meta (Facebook & Instagram)",
                    description: "Hizmeti başlatmak için Meta reklam hesap erişimlerini verin.",
                    highlightText: "Reklamlarınızın erişimini artırarak marka görünürlüğünü güçlendirin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/meta-facebook-instagram-reklamlari-kurulum-akisi",
                    theme: "light" as const
                }
            ]
        }
    }

    return <ServicePageTemplate {...smaConfig} />
}
