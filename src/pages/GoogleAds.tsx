import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
    HiUserGroup,
    HiShoppingCart,
    HiClipboardDocumentList,
    HiGlobeAlt,
    HiArrowTrendingUp,
    HiChartPie,
    HiSparkles
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'
import { useRouteLocale } from '../utils/locale'

export default function GoogleAds() {
    const { t } = useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const homeServicesPath = `/${t('slugs.home')}#services`.replace(/\/\#/, '/#')

    useEffect(() => {
        document.title = isEn ? 'Google Ads Management | khilonfast' : 'Google Ads | khilonfast'
    }, [isEn])

    const trConfig = {
        hero: {
            title: 'Google Reklamcılığı ile Gelirinizi Artırın.',
            subtitle: 'Rakiplerinizin arasında kaybolmayın!',
            description: 'khilonfast ile doğru anahtar kelime stratejileri ve hedeflemelerle markanızı öne çıkarın. Düşük dönüşüm oranlarını, reklam yatırımınızı verimli şekilde kullanarak aşın.',
            buttonText: 'Hemen Başlayın',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/google-ads/hero.avif',
            hideBadge: true,
            badgeText: "Google Ads - İşinizi Büyütün!",
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
        processSection: {
            tag: 'Nasıl Çalışır?',
            title: 'Hizmet Süreci',
            description: '5 adımda Google Ads başarıya ulaşın.',
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
                { feature: 'Arama Reklamları', values: ['Temel Google Search Ads kurulumu ve temel anahtar kelime araştırması', 'Standart Google Search Ads kurulumu', 'Pro Google Search Ads kurulumu, gelişmiş anahtar kelime araştırması ve reklam metni oluşturma'] },
                { feature: 'Ek Kurulum ücreti', values: ['Aylık paketlerde Kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde Kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.', 'Aylık paketlerde Kurulum ücreti, ilk ay paket ücreti kadar olup sadece ilk ay uygulanır.'] },
                { feature: 'Google Analytics Entegrasyonu', values: ['-', '-', true] },
                { feature: 'Reklam kampanyası optimizasyonu', values: ['Temel', true, '✓ Sürekli'] },
                { feature: 'Reklam uzantıları ve hedefleme', values: ['Sınırlı', '✓ (lokasyon, zamanlama, cihaz)', '✓ (remarketing, demografik, kitle segmentasyonu)'] },
                { feature: 'Performans raporu', values: ['✓ E-posta ile, ayda 1 kez raporlama', '✓ E-posta ile, 2 haftada 1 raporlama', '✓ E-posta ile, haftada 1 raporlama'] },
                { feature: 'Reklam Bütçesi Politikası', values: ['Reklam bütçesinin %10\'u core paket ücretini aşmıyorsa core paket üzerinden fiyatlandırılır; aştığında bir üst paketten fiyatlandırılır.', 'Reklam bütçesinin %10\'u growth paket ücretini aşmıyorsa growth paket üzerinden fiyatlandırılır; aştığında bir üst pakete geçilir.', 'Reklam bütçesinin %10\'u ultimate paket ücretini aşmıyorsa ultimate paket üzerinden fiyatlandırılır; aşması durumunda ek tutar yüzdesel olarak eklenir ve sonraki aylarda bulunduğu üst paketten fiyatlandırma devam eder.'] }
            ],
            note: '(*) KDV hariçtir.'
        },
        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Google Reklamcılığı Çözümleri',
            description: 'Markanızı büyütmek için doğru adımları atın. İhtiyacınıza uygun çözümü seçin, khilonfast ile Search Ads Reklamlarınızı hızla başlatın. İster yeni başlayın ister büyütmek isteyin, size uygun bir çözüm var.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '₺32.000*',
                    period: 'Ay',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın',
                    icon: <HiKey />,
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
                    buttonText: 'SATIN AL',
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
                    buttonText: 'SATIN AL',
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
                    buttonLink: "/search-ads-google-reklamlari-kurulum-akisi",
                    theme: "light" as const
                },
                {
                    title: "Nasıl Çalışır?",
                    description: "Sürecin baştan sona nasıl ilerlediğini adım adım görün.",
                    highlightText: "Doğru brief → net süreç → ölçülebilir sonuçları keşfedin.",
                    buttonText: "KEŞFET",
                    buttonLink: "/khilonfast-nasil-calisir-hizli-profesyonel-ve-sonuc-odakli-pazarlama-deneyimi",
                    theme: "dark" as const
                }
            ]
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
        testimonial: {
            quote: "Google Ads kampanyalarımızı khilonfast'a devrettikten sonra maliyetlerimizi %30 düşürürken dönüşümlerimizi iki katına çıkardık.",
            author: "Mehmet Demir",
            role: "E-Ticaret Direktörü"
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
        ]
    }

    const enConfig = {
        hero: {
            title: 'Scale Revenue with Precision Google Ads',
            subtitle: 'Outperform competitors with strategy-led campaign execution.',
            description: 'khilonfast helps you build high-intent keyword systems, smarter targeting, and conversion-focused ad architecture to improve ROAS.',
            buttonText: 'Start Now',
            buttonLink: '#pricing',
            image: '/images/hizmetlerimiz/google-ads/hero.avif',
            hideBadge: true,
            badgeText: 'Google Ads. Faster Growth, Measurable Results.',
            badgeIcon: <HiChartBar />,
            themeColor: '#FEF3C7'
        },
        breadcrumbs: [
            { label: t('header.services'), path: homeServicesPath },
            { label: 'Google Ads' }
        ],
        videoShowcase: {
            tag: 'WATCH & LEARN',
            title: <>Move Your Brand to the <span className="highlight-text">Top of Search</span></>,
            description: 'Capture demand at the right moment with performance-driven campaign strategy, structured optimization, and transparent reporting.',
            videoUrl: 'https://www.youtube.com/embed/V-TdlZW40BE'
        },
        approachSection: {
            title: 'Account Audit and Performance Strategy',
            description: 'We diagnose wasted spend, identify growth levers, and build scalable optimization loops.',
            items: [
                { title: 'Professional Account Audit', subtitle: 'Identify Hidden Leaks', description: 'Reveal structural issues, budget inefficiencies, and missed opportunities with a deep account audit.', icon: <HiMagnifyingGlass /> },
                { title: 'Quality Score Optimization', subtitle: 'Reduce CPC', description: 'Improve ad relevance and landing-page alignment to lower costs and increase impression efficiency.', icon: <HiChartBar /> },
                { title: 'Conversion Tracking Architecture', subtitle: 'ROI-Driven Decisions', description: 'Measure every meaningful action with clean tracking setup and decision-ready attribution.', icon: <HiPresentationChartLine /> },
                { title: 'Competitive Intelligence', subtitle: 'Gain Market Edge', description: 'Map competitor strategy and discover actionable angles to improve positioning and CTR.', icon: <HiRocketLaunch /> },
                { title: 'Continuous Optimization', subtitle: 'Always-On Performance', description: 'We operate through weekly optimization cycles, not set-and-forget campaign management.', icon: <HiSignal /> }
            ]
        },
        processSection: {
            tag: '4 Steps to Performance',
            title: 'How It Works?',
            description: 'A transparent and measurable delivery model built for sustained ad efficiency.',
            videoUrl: 'https://player.vimeo.com/video/1131179237',
            steps: [
                { stepNumber: 1, title: 'Step 1: Audit', description: 'We evaluate account structure, market context, and conversion readiness.', icon: <HiMagnifyingGlass /> },
                { stepNumber: 2, title: 'Step 2: Strategy & Setup', description: 'Campaign architecture, keyword map, and ad copy frameworks are prepared for launch.', icon: <HiPresentationChartLine /> },
                { stepNumber: 3, title: 'Step 3: Launch', description: 'Campaigns are launched with verification controls and data integrity checks.', icon: <HiCursorArrowRays /> },
                { stepNumber: 4, title: 'Step 4: Optimization', description: 'We run iterative A/B optimization to lower acquisition cost and improve conversion rate.', icon: <HiCheckBadge /> }
            ]
        },
        pricingSection: {
            tag: 'Service Packages',
            title: 'Google Ads Solutions',
            description: 'Choose the package aligned with your growth stage and launch with khilonfast.',
            packages: [
                { id: 'core', name: 'Core', price: '$799*', period: t('pricing.monthly'), description: 'A strong launch package for first-stage growth.', icon: <HiKey />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'growth', name: 'Growth', price: '$1,199*', period: t('pricing.monthly'), description: 'Performance package for scaling lead and conversion volume.', isPopular: true, icon: <HiChartBar />, features: [], buttonText: t('pricing.buyNow') },
                { id: 'ultimate', name: 'Ultimate', price: '$2,149*', period: t('pricing.monthly'), description: 'Advanced package for aggressive growth and market leadership.', icon: <HiTrophy />, features: [], buttonText: t('pricing.buyNow') }
            ]
        },
        testimonial: {
            quote: 'After partnering with khilonfast, we lowered acquisition costs while doubling conversion volume in a short period.',
            author: 'Mehmet Demir',
            role: 'E-commerce Director'
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ]
    }

    return <ServicePageTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-google-ads" disableApiHeroTextOverride={true} />
}
