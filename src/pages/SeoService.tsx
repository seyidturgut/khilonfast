import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiMagnifyingGlass,
    HiGlobeAlt,
    HiSparkles,
    HiChartBar,
    HiTrophy,
    HiKey,
    HiArrowTrendingUp,
    HiChartPie,
    HiUserGroup,
    HiRocketLaunch,
    HiShoppingCart,
    HiCheckBadge,
    HiClipboardDocumentList

} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function SeoService() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
    const isEn = currentLang === 'en'
    const homeServicesPath = `/${t('slugs.home')}#services`.replace(/\/\#/, '/#')
    const langPrefix = isEn ? '/en' : ''

    useEffect(() => {
        document.title = isEn ? 'SEO Management Services | khilonfast' : 'SEO Yönetimi | khilonfast'
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Üst Sıralara Çıkın!',
            subtitle: 'Rakiplerinizle rekabet edin ve online görünürlüğünüzü artırın!',
            description: 'Doğru anahtar kelime stratejileri ve SEO optimizasyonuyla, khilonfast ile markanızın organik sıralamalarda yükselmesini sağlayın. Hedef kitlenizi büyütün.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/seo-yonetimi/hero.png',
            hideBadge: true,
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
            title: t('serviceGTM.approach.title', { defaultValue: 'khilonfast Yaklaşımı' }),
            description: t('serviceGTM.approach.description', { defaultValue: 'Her adımda sürdürülebilir büyüme odaklı çalışıyoruz.' }),
            items: [
                {
                    title: t('serviceGTM.approach.360.title', { defaultValue: '360 Derece Bakış Açısı' }),
                    subtitle: t('serviceGTM.approach.360.subtitle', { defaultValue: 'Bütünleşik Strateji' }),
                    description: t('serviceGTM.approach.360.desc', { defaultValue: 'Her detayı bütünsel bir bakış açısıyla inceliyoruz.' }),
                    icon: <HiGlobeAlt />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/Bakis-Acisi.avif'
                },
                {
                    title: t('serviceGTM.approach.growth.title', { defaultValue: 'Büyüme Odaklı Stratejiler' }),
                    subtitle: t('serviceGTM.approach.growth.subtitle', { defaultValue: 'Performans Yönetimi' }),
                    description: t('serviceGTM.approach.growth.desc', { defaultValue: 'Hedeflerinizi hızlıca yakalamak için büyümenizi ölçümlüyoruz.' }),
                    icon: <HiArrowTrendingUp />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/buyume-dakli.avif'
                },
                {
                    title: t('serviceGTM.approach.data.title', { defaultValue: 'Veri Odaklı Pazarlama' }),
                    subtitle: t('serviceGTM.approach.data.subtitle', { defaultValue: 'Geniş İçgörüler' }),
                    description: t('serviceGTM.approach.data.desc', { defaultValue: 'Kanıtlanmış verilerle risk almadan hareket ediyoruz.' }),
                    icon: <HiChartPie />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/veri-odakli.avif'
                },
                {
                    title: t('serviceGTM.approach.innovation.title', { defaultValue: 'İnovasyon ile Fark' }),
                    subtitle: t('serviceGTM.approach.innovation.subtitle', { defaultValue: 'Yenilikçi Teknikler' }),
                    description: t('serviceGTM.approach.innovation.desc', { defaultValue: 'Sektördeki en modern teknoloji araçlarıyla rakiplerden ayrışın.' }),
                    icon: <HiSparkles />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/inovasyon-fark.avif'
                },
                {
                    title: t('serviceGTM.approach.partner.title', { defaultValue: 'Stratejik İş Ortağı' }),
                    subtitle: t('serviceGTM.approach.partner.subtitle', { defaultValue: 'Uzun Vadeli Başarı' }),
                    description: t('serviceGTM.approach.partner.desc', { defaultValue: 'Müşterilerimizi kısa süreli değil uzun dönemli hedeflerle destekliyoruz.' }),
                    icon: <HiUserGroup />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/is-ortagi.avif'
                }
            ]
        },
        processSection: {
            tag: 'Nasıl Çalışır?',
            title: 'Hizmet Süreci',
            description: 'Organik trafiğinizi artırmak için izlediğimiz 5 adımlı yol haritası.',
            videoUrl: 'https://player.vimeo.com/video/1128822985',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Satın Al',
                    description: 'İhtiyacınıza uygun paketi seçin. Satın alma işlemi tamamlandığında süreç otomatik olarak başlar.',
                    icon: <HiShoppingCart />
                },
                {
                    stepNumber: 2,
                    title: 'Yetkilendir',
                    description: <p>khilonfast ekibine gerekli erişim izinlerini verin. Yetkilendirme detayları için <a href="#authorization" style={{ textDecoration: 'underline' }}>tıklayın</a></p>,
                    icon: <HiKey />
                },
                {
                    stepNumber: 3,
                    title: 'Brief Ver',
                    description: 'Size gönderilen formdaki soruları cevaplayarak hedeflerinizi, hedef kitlenizi ve marka dilinizi paylaşın. Bu form, stratejinin temelini oluşturur.',
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 4,
                    title: 'Analiz',
                    description: 'khilonfast ekibi brief’inizi analiz eder ve sizi nasıl anladığını gösteren de-brief raporunu hazırlar. Bu rapor, hizmetin yönünü birlikte netleştirmemizi sağlar.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 5,
                    title: 'Onay',
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
            title: 'SEO Çözümleri',
            description: 'Markanızı üst sıralara taşımak için doğru adımları atın. khilonfast ile SEO kampanyalarınızı başlatın ve online potansiyelinizi ortaya çıkarın.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺32.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiGlobeAlt />,
                    features: [],
                    buttonText: 'SATIN AL',
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
                    buttonText: 'SATIN AL',
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
                    buttonText: 'SATIN AL',
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
                answer: 'khilonfast, kapsamlı dijital pazarlama deneyimi ve veriye dayalı yaklaşımları ile öne çıkar. İşletmenizin ihtiyaçlarına özel çözümler sunar, kampanyalarınızı sürekli optimize eder ve sonuç odaklı çalışır. khilonfast ile çalışarak, markanızın dijital alanda güçlü bir yer edinmesini sağlayabilirsiniz.'
            },
            {
                question: 'Neden yüz yüze veya online toplantı yapmıyoruz?',
                answer: 'khilonfast, süreçleri hızlandırmak ve verimliliği artırmak amacıyla dijital iletişim araçlarını tercih eder. Tüm işlemler sitemiz ve e-posta üzerinden yürütülür, bu sayede dünyanın her yerinden hızlı ve etkili bir şekilde hizmet alabilirsiniz. khilonfast, zaman kaybına yol açan senkron toplantıları ortadan kaldırarak pazarlama hizmetini ölçeklendirebiliyor ve tecrübesini tamamen uzmanlığına odaklayarak daha iyi iş yapmayı tercih ediyor. Bu şekilde, üst düzey bir ajansla makul fiyatlarla çalışabilir, zaman kaybına uğramadan işinizin görülmesini sağlayabilirsiniz. Tüm hizmet süreci boyunca ihtiyacınız olan bilgi ve destek, e-posta aracılığıyla sağlanacaktır.'
            },
            {
                question: 'khilonfast ile kimler çalışmamalı?',
                answer: 'khilonfast, dijital süreçleri etkin bir şekilde yönetebilen ve modern pazarlama araçlarını benimseyen firmalar için idealdir. Ancak, ortaya çıkacak işin kalitesinden çok karşısında bir insan bulmayı isteyen, sadece bir yüz yüze görüşmeyle kendini güvende hisseden, metrikler ve analizlerle arası iyi olmayan, gelişmeleri anlamlı bir şekilde takip edemeyen, yeni nesil pazarlama araçlarına mesafeli olan, WhatsApp veya e-posta gibi iletişim araçlarını düzenli olarak kontrol etmeyen, khilonfast’ın göndereceği formları doldurmayacak kadar meşgul olan ya da “Ben ajanslardan daha iyi biliyorum, kendi yöntemimle ilerleyelim” diyen firmalar, khilonfast için uygun müşteriler değildir. Bu tür firmalar için, khilonfast hizmeti uygun olmayabilir.'
            },
            {
                question: 'khilonfast kimler için ideal bir iş ortağıdır?',
                answer: 'khilonfast, dijital dünyada hızlı, verimli ve sonuç odaklı çözümler arayan firmalar için mükemmel bir iş ortağıdır. Veriye dayalı kararlar almayı seven, metriklerle çalışabilen, dijital pazarlamanın gücüne inanan ve yeni nesil araçları kullanmaya istekli olan firmalar için khilonfast ideal bir çözüm sunar. Ayrıca, e-posta ve diğer dijital iletişim araçlarını düzenli olarak kullanan, khilonfast tarafından sağlanan formları dolduracak zaman ve disipline sahip olan, ve uzman ekibin önerilerine güvenerek stratejik rehberlik arayan firmalar, khilonfast ile çalışırken en yüksek verimi elde ederler. Eğer dijital pazarlama süreçlerinde güvenilir bir iş ortağı arıyorsanız, khilonfast sizin için mükemmel bir seçimdir.'
            },
            {
                question: 'khilonfast ile iletişimi nasıl sağlayabilirim?',
                answer: 'khilonfast ile tüm iletişim, kullanıcı dostu sitemiz ve e-posta üzerinden gerçekleştirilir. Hizmeti satın aldıktan sonra, size gerekli formlar sistem üzerinden iletilir. Bu formları doldurduktan sonra, khilonfast ekibi titizlikle inceleyerek gerekli kurulumları yapar ve operasyonu başlatır. Sürecin her aşamasında, e-posta yoluyla size bilgilendirme yapılır ve gerekli tüm destek sağlanır.'
            },
            {
                question: 'Hizmet satın alımdan sonra süreç nasıl ilerleyecek?',
                answer: 'khilonfast üzerinden hizmet satın alımını tamamladığınızda, size sitemiz üzerinden doldurmanız gereken formlar iletilir. Bu formlar, hizmetin doğru yapılandırılması için gereken bilgileri toplar. Formlar doldurulduktan sonra, khilonfast ekibi gerekli tanımlamaları yapar ve hizmetinizi aktif hale getirir. Tüm süreç boyunca, gerekli bilgiler ve talimatlar e-posta ile size iletilecektir. Ayrıca, raporlama periyotlarına göre haftalık, aylık veya üç aylık raporlar e-posta yoluyla gönderilir ve hizmetinizin performansını takip etmeniz sağlanır.'
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
                answer: 'khilonfast, veri odaklı yaklaşımlarla pazara giriş stratejinizi güçlendirir. Uzman ekibimiz, rekabet avantajı sağlayan stratejiler geliştirir ve pazarda hızlı bir şekilde yer almanızı sağlar. Yeni pazarlara girişte güvenilir bir iş ortağı arıyorsanız, khilonfast sizin için ideal bir seçimdir.'
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

    const enConfig = {
        hero: {
            title: 'Rank Higher and Capture Qualified Demand',
            subtitle: 'Increase search visibility and outperform competitors organically.',
            description: 'With khilonfast SEO services, improve technical health, keyword relevance, and content quality to drive sustainable organic growth.',
            buttonText: 'Start Now',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/seo-yonetimi/hero.png',
            hideBadge: true,
            badgeText: 'Higher Rankings. Stronger Organic Momentum.',
            badgeIcon: <HiGlobeAlt />,
            themeColor: '#E0F2FE'
        },
        breadcrumbs: [
            { label: t('header.services'), path: homeServicesPath },
            { label: t('header.menuItems.services.seo.title') }
        ],
        videoShowcase: {
            tag: 'Watch & Learn',
            title: <>Win Visibility in <span className="highlight">Search Results</span></>,
            description: 'Gain durable rankings with strategic keyword architecture, technical optimization, and search-intent aligned content systems.',
            videoUrl: 'https://www.youtube.com/embed/qx17zxGfFzs'
        },
        approachSection: {
            title: t('serviceGTM.approach.title', { defaultValue: 'The khilonfast Approach' }),
            description: t('serviceGTM.approach.description', { defaultValue: 'We focus on sustainable growth at every step.' }),
            items: [
                {
                    title: t('serviceGTM.approach.360.title', { defaultValue: '360-Degree Perspective' }),
                    subtitle: t('serviceGTM.approach.360.subtitle', { defaultValue: 'Integrated Strategy' }),
                    description: t('serviceGTM.approach.360.desc', { defaultValue: 'We analyze every detail with a holistic perspective.' }),
                    icon: <HiGlobeAlt />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/Bakis-Acisi.avif'
                },
                {
                    title: t('serviceGTM.approach.growth.title', { defaultValue: 'Growth-Driven Strategies' }),
                    subtitle: t('serviceGTM.approach.growth.subtitle', { defaultValue: 'Performance Management' }),
                    description: t('serviceGTM.approach.growth.desc', { defaultValue: 'We measure your growth to reach your goals quickly.' }),
                    icon: <HiArrowTrendingUp />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/buyume-dakli.avif'
                },
                {
                    title: t('serviceGTM.approach.data.title', { defaultValue: 'Data-Driven Marketing' }),
                    subtitle: t('serviceGTM.approach.data.subtitle', { defaultValue: 'Broad Insights' }),
                    description: t('serviceGTM.approach.data.desc', { defaultValue: 'We move without risk using proven data.' }),
                    icon: <HiChartPie />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/veri-odakli.avif'
                },
                {
                    title: t('serviceGTM.approach.innovation.title', { defaultValue: 'Making a Difference with Innovation' }),
                    subtitle: t('serviceGTM.approach.innovation.subtitle', { defaultValue: 'Innovative Techniques' }),
                    description: t('serviceGTM.approach.innovation.desc', { defaultValue: 'Stand out from competitors with the most modern tech tools in the industry.' }),
                    icon: <HiSparkles />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/inovasyon-fark.avif'
                },
                {
                    title: t('serviceGTM.approach.partner.title', { defaultValue: 'Strategic Partner' }),
                    subtitle: t('serviceGTM.approach.partner.subtitle', { defaultValue: 'Long-Term Success' }),
                    description: t('serviceGTM.approach.partner.desc', { defaultValue: 'We support our clients with long-term goals, not short-term ones.' }),
                    icon: <HiUserGroup />,
                    image: '/images/hizmetlerimiz/go-to-market-stratejisi/is-ortagi.avif'
                }
            ]
        },
        processSection: {
            tag: 'Nasıl Çalışır?',
            title: 'Hizmet Süreci',
            description: 'Organik trafiğinizi artırmak için izlediğimiz 5 adımlı yol haritası.',
            videoUrl: 'https://player.vimeo.com/video/1128822985',
            steps: [
                {
                    stepNumber: 1,
                    title: 'Satın Al',
                    description: 'İhtiyacınıza uygun paketi seçin. Satın alma işlemi tamamlandığında süreç otomatik olarak başlar.',
                    icon: <HiShoppingCart />
                },
                {
                    stepNumber: 2,
                    title: 'Yetkilendir',
                    description: <p>khilonfast ekibine gerekli erişim izinlerini verin. Yetkilendirme detayları için <a href="#authorization" style={{ textDecoration: 'underline' }}>tıklayın</a></p>,
                    icon: <HiKey />
                },
                {
                    stepNumber: 3,
                    title: 'Brief Ver',
                    description: 'Size gönderilen formdaki soruları cevaplayarak hedeflerinizi, hedef kitlenizi ve marka dilinizi paylaşın. Bu form, stratejinin temelini oluşturur.',
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 4,
                    title: 'Analiz',
                    description: 'khilonfast ekibi brief’inizi analiz eder ve sizi nasıl anladığını gösteren de-brief raporunu hazırlar. Bu rapor, hizmetin yönünü birlikte netleştirmemizi sağlar.',
                    icon: <HiMagnifyingGlass />
                },
                {
                    stepNumber: 5,
                    title: 'Onay',
                    description: 'De-brief raporunun onaylanması ile isteyin. hizmet kurulumları başlar ve ölçümlemeler 1 hafta içerisinde aktif edilir.',
                    icon: <HiCheckBadge />
                }
            ]
        },
        pricingSection: {
            tag: 'Service Packages',
            title: 'SEO Solutions',
            description: 'Select the package that matches your growth ambition and search competition level.',
            packages: [
                { id: 'core', name: 'Core', price: '$799*', period: t('pricing.monthly'), description: 'Solid entry package for foundational SEO progress.', icon: <HiGlobeAlt />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'growth', name: 'Growth', price: '$1,199*', period: t('pricing.monthly'), description: 'Scaling package for stronger rankings and demand capture.', isPopular: true, icon: <HiChartBar />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'ultimate', name: 'Ultimate', price: '$2,149*', period: t('pricing.monthly'), description: 'Advanced package for competitive markets and category leadership.', icon: <HiTrophy />, features: [], buttonText: t('pricing.buyNow') }
            ]
        },
        testimonial: {
            quote: 'Within six months of SEO execution, our organic traffic and high-intent lead volume increased substantially.',
            author: 'Caner Ozkan',
            role: 'E-commerce Director'
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ],
        authorizationSection: {
            title: isEn ? 'SEO Authorization Steps' : 'SEO Yetkilendirme Adımları',
            description: isEn ? 'Access to the following tools is required for healthy SEO execution.' : 'SEO süreçlerinin sağlıklı yürütülmesi için aşağıdaki araçların yetkilendirilmesi gerekmektedir.',
            cards: [
                {
                    title: isEn ? 'Google Search Console Authorization' : 'Google Search Console Yetkilendirme',
                    description: isEn ? 'Grant Search Console access to strengthen organic analysis.' : 'Detaylı bir içerik stratejisi için Google Search Console yetkilerini ekleyin.',
                    highlightText: isEn ? 'Improve visibility through search performance diagnostics.' : 'Organik görünürlüğünüzü analiz ederek performansınızı geliştirin.',
                    buttonText: t('common.discover'),
                    buttonLink: `${langPrefix}/hizmetlerimiz/google-search-console-kurulum-akisi`,
                    theme: 'light' as const
                },
                {
                    title: isEn ? 'Google Analytics Authorization' : 'Google Analytics Yetkilendirme',
                    description: isEn ? 'Grant Analytics access for deeper behavioral insight.' : 'Detaylı analiz için Google Analytics erişimlerini tanımlayın.',
                    highlightText: isEn ? 'Increase measurement reliability across SEO workflows.' : 'Analiz süreçlerinizin ölçüm doğruluğunu artırın.',
                    buttonText: t('common.discover'),
                    buttonLink: `${langPrefix}/google-analytics-kurulum-akisi`,
                    theme: 'dark' as const
                }
            ]
        }
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-seo" disableApiHeroTextOverride={true} />
}
