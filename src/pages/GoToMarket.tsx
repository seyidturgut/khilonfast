import {
    HiRocketLaunch,
    HiChartBar,
    HiLightBulb,
    HiKey,
    HiTrophy,
    HiCreditCard,
    HiClipboardDocumentList,
    HiCheckBadge,
    HiGlobeAlt,
    HiArrowTrendingUp,
    HiChartPie,
    HiSparkles,
    HiUserGroup
} from 'react-icons/hi2'
import ServicePageTemplate from './templates/ServicePageTemplate'

export default function GoToMarket() {
    const gtmConfig = {
        hero: {
            title: 'Pazara Stratejik Giriş ile Başarıyı Yakalayın!',
            subtitle: 'Pazar payınızı artırmak için hedef kitlenizi doğru belirleyin!',
            description: 'khilonfast ile pazara giriş stratejilerinizi doğru şekilde planlayın. Rakiplerinizin önüne geçin ve pazarda etkin bir şekilde yerinizi alın.',
            buttonText: 'Hemen Keşfedin',
            buttonLink: '#pricing',
            image: '/img/go-to-market-hero.png',
            badgeText: "Hızlı ve Güçlü Başlangıç! Başarıyı Yakalayın!",
            badgeIcon: <HiRocketLaunch />,
            themeColor: '#DBEAFE' // Light blue theme
        },
        breadcrumbs: [
            { label: 'Hizmetlerimiz', path: '/#services' },
            { label: 'Go To Market Stratejisi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Doğru Go To Market Stratejisiyle
                    <span className="highlight"> Pazar Payınızı Artırın</span>
                </>
            ),
            description: 'Pazara girişte stratejik ve veri odaklı adımlar atın. khilonfast ile hedef kitlenizi net bir şekilde belirleyin ve rekabet avantajı sağlayın.',
            videoUrl: 'https://www.youtube.com/embed/Gw7sA7aaI6k'
        },

        pricingSection: {
            tag: 'Hizmet Paketleri',
            title: 'Go to Market Stratejisi Çözümleri',
            description: 'Yeni bir pazara giriş yapmak istiyorsanız, doğru stratejilerle başlamanız şart. khilonfast ile pazara hızlı ve etkili giriş stratejileri oluşturun. Hedef kitlenizi doğru belirleyin ve rekabet avantajı kazanın.',
            packages: [
                {
                    id: 'core',
                    name: 'Core',
                    price: '$9.900*',
                    period: '',
                    description: 'Harekete geçin ve dijital dünyada varlığınızı hissettirmeye başlayın.',
                    icon: <HiKey />,
                    features: [
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Kimler İçin Uygun</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Pazara hızlı giriş yapmak, temel satış ve değer önerisini oluşturmak isteyen küçük ve orta ölçekli işletmeler için ideal.</span>
                        </div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Neden Tercih Edilmeli</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Pazarlama planı, satış önerisi ve temel dijital stratejiyle, işletmenizin varlığını kısa sürede ve düşük riskle hayata geçirin.</span>
                        </div>
                    ],
                    buttonLink: 'https://khilonfast.com/b2b-sektorunu-butunlesik-pazarlama/'
                },
                {
                    id: 'growth',
                    name: 'Growth',
                    price: '$14.900*',
                    period: '',
                    description: 'Dijital performansınızı artırın, daha fazla dönüşüm sağlayın.',
                    isPopular: true,
                    icon: <HiChartBar />,
                    features: [
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Kimler İçin Uygun</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Gelişmiş bir dijital, içerik ve pazarlama otomasyonu, satış stratejisi ile büyümeyi hedefleyen orta ölçekli işletmeler için ideal.</span>
                        </div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Neden Tercih Edilmeli</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Gelişmiş dijital, içerik, pazarlama otomasyonu stratejisi ve satış scripti sayesinde markanızı bir üst seviyeye taşıyın.</span>
                        </div>
                    ],
                    buttonLink: 'https://khilonfast.com/b2b-sektorunu-butunlesik-pazarlama/'
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate',
                    price: '$29.900*',
                    period: '',
                    description: 'Pazarda öne çıkın, akıllı stratejilerle rekabeti geride bırakın.',
                    icon: <HiTrophy />,
                    features: [
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Kimler İçin Uygun</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Kapsamlı strateji, marka kimliği ve satış hunisi tasarımıyla kalıcı rekabet avantajı isteyen firmalar için ideal.</span>
                        </div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#1a3a52', fontSize: '0.95rem' }}>Neden Tercih Edilmeli</span>
                            <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Growth paketine ek olarak; kurumsal kimlik tasarımı, satış hunisi şablonları ile markanızın gücünü artırın.</span>
                        </div>
                    ],
                    buttonLink: 'https://khilonfast.com/b2b-sektorunu-butunlesik-pazarlama/'
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
                { feature: 'Pazarlama Planı Geliştirme', values: [true, true, true] },
                { feature: 'Satış ve Değer Önerisi Oluşturma', values: [true, true, true] },
                { feature: 'Dijital Strateji', values: ['Temel', 'Gelişmiş', 'Gelişmiş'] },
                { feature: 'İçerik Stratejisi', values: ['-', 'Temel', 'Gelişmiş'] },
                { feature: 'Pazarlama Otomasyonu Stratejisi', values: ['-', true, true] },
                { feature: 'Satış scripti', values: ['-', 'Temel', 'Gelişmiş'] },
                { feature: 'Kurumsal Kimlik Tasarımı', values: ['-', '-', true] },
                { feature: 'Satış Hunisi Kreatif Şablonlar', values: ['-', '-', true] },
                { feature: 'Süre', values: ['Min 4 Hafta', 'Min 6 Hafta', 'Min 9 Hafta'] },
                { feature: 'Revizyon Hakkı', values: [1, 3, 5] },
            ],
            note: '(*) KDV hariçtir. Tek seferlik hizmettir.'
        },
        processSection: {
            tag: '4 adımda GTM',
            title: 'Nasıl Çalışır?',
            description: 'Sadece birkaç adımda pazara giriş stratejinizi oluşturun. Tüm adımlar şeffaf, hızlı ve ölçülebilir şekilde tasarlandı.',
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
                    title: 'Adım 2: Brief Ver',
                    description: 'Size gönderilen formdaki soruları cevaplayarak hedeflerinizi, hedef kitlenizi ve marka dilinizi paylaşın. Bu form, stratejinin temelini oluşturur.',
                    icon: <HiClipboardDocumentList />
                },
                {
                    stepNumber: 3,
                    title: 'Adım 3: Analiz',
                    description: 'khilonfast ekibi brief’iniz analiz eder ve sizi nasıl anladığını gösteren de-brief raporunu hazırlar. Bu rapor, hizmetin yönünü birlikte netleştirmemizi sağlar.',
                    icon: <HiLightBulb />
                },
                {
                    stepNumber: 4,
                    title: 'Adım 4: Onay',
                    description: 'De-brief raporunun onaylanması ile isteyin. hizmet kurulumları başlar ve ölçümlemeler 1 hafta içerisinde aktif edilir.',
                    icon: <HiCheckBadge />
                }
            ]
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
        testimonial: {
            quote: "Pazara girişte attığımız her adımın arkasında khilonfast'in veriye dayalı stratejisi vardı. Sonuçlar beklediğimizden çok daha hızlı geldi.",
            author: "Murat Çelik",
            role: "Yatırımcı & Danışman"
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

    }

    return <ServicePageTemplate {...gtmConfig} />
}
