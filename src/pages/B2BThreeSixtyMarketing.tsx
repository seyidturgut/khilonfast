import {
    HiChartBar,
    HiCheck,
    HiVideoCamera,
    HiSparkles,
    HiArrowsPointingIn,
    HiWrenchScrewdriver,
    HiMagnifyingGlass
} from 'react-icons/hi2'
import SectoralSolutionTemplate from './templates/SectoralSolutionTemplate'

export default function B2BThreeSixtyMarketing() {
    const b2bConfig = {
        hero: {
            title: 'B2B Firmalar İçin',
            subtitle: 'Tek Noktadan Pazarlama Çözümleri',
            description: 'khilonfast ile Business to Business pazarlama süreçlerinizi zahmetsizce yönetin, sektör uzmanlığıyla etkili sonuçlar elde edin.',
            buttonText: 'Hizmetleri Keşfedin',
            buttonLink: '#pricing',
            image: '/b2b_360_marketing_hero_1769621591525.png',
            badgeText: "B2B'de Tek Nokta! Etkili Sonuçlar!",
            badgeIcon: <HiChartBar />,
            themeColor: '#D9F99D'
        },
        breadcrumbs: [
            { label: 'Sektörel Hizmetler', path: '/#sectoral-services' },
            { label: 'B2B Firmalar İçin 360 Pazarlama Yönetimi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    B2B'de Başarıyı Getiren
                    <span className="highlight"> Büyüme Stratejileri</span>
                </>
            ),
            description: 'B2B sektöründe büyümek için doğru adımları atın. khilonfast ile pazarlama süreçlerinizi hızla devreye alın.',
            vimeoUrl: 'https://player.vimeo.com/video/1133021053?badge=0&autopause=0&player_id=0&app_id=58479'
        },
        tabsSection: {
            tag: 'B2B Sektörü için',
            title: '360° Stratejik Pazarlama Çözümleri',
            description1: 'B2B’de büyümek ve fark yaratmak için doğru adımları atın.',
            description2: 'İhtiyacınıza uygun çözümleri seçin, khilonfast ile pazarlama süreçlerinizi hızla devreye alın.',
            tabs: [
                {
                    id: 'education',
                    label: 'Büyüme Odaklı Pazarlama Eğitimi',
                    icon: <HiVideoCamera />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="sectoral-split-layout">
                                <div className="sectoral-split-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1131284512?color&autopause=0&loop=0&muted=0&title=1&portrait=1&byline=1"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title="Büyüme Odaklı Pazarlama Eğitimi"
                                    ></iframe>
                                </div>
                                <div className="sectoral-card">
                                    <h3>B2B Sektöründe Büyüme Odaklı Pazarlama</h3>
                                    <p>Büyüme odaklı pazarlama alanında Türkiye’nin sayılı uzmanlarından Bora Işık tarafından hazırlanan bu eğitim, sahada kanıtlanmış yöntemleri ve tekrar edilebilir stratejileri sunuyor.</p>
                                    <a href="https://khilonfast.com/b2b-sektorunde-buyume-odakli-pazarlama-egitimi/" className="sectoral-btn">Satın Al</a>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'ai',
                    label: 'Maestro AI',
                    icon: <HiSparkles />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="sectoral-split-layout reverse">
                                <div className="sectoral-card">
                                    <h3>Maestro AI ile kararlarınızı analize dayalı alın!</h3>
                                    <p>B2B sektörü için hazırlanmış yapay zeka asistanımız; CRM, PR, pazar araştırma ve strateji disiplinlerini birleştirerek size hazır çözümler sunar.</p>
                                    <ul className="sectoral-features">
                                        <li><HiCheck /> Tecrübeyi firmanıza hızla ekler</li>
                                        <li><HiCheck /> Verilerle doğru kararlar almanızı sağlar</li>
                                        <li><HiCheck /> Zaman kaybını önler, maliyetleri düşürür</li>
                                        <li><HiCheck /> Büyümeyi hızlandırırsınız.</li>
                                    </ul>
                                    <a href="https://khilonfast.com/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy/" className="sectoral-btn">Detaylı Bilgi</a>
                                </div>
                                <div className="sectoral-split-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1133020329?color&autopause=0&loop=0&muted=0&title=1&portrait=1&byline=1"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title="Maestro AI"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'packages',
                    label: '360° Dijital Pazarlama Yönetimi',
                    icon: <HiArrowsPointingIn />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>Tam Donanımlı Pazarlama Takımınızı Kurun</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '700px', margin: '0 auto' }}>
                                    B2B hizmet sunan firmalar için özelleştirilmiş, stratejik pazarlama takımlarıyla işinizi hızlıca büyütün.
                                    Tüm pazarlama ihtiyaçlarınızı tek bir yerden karşılayarak operasyonel yüklerden kurtulun.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-3">
                                <div className="sectoral-card" style={{ border: '1px solid #eef2d0' }}>
                                    <h3>Core</h3>
                                    <p style={{ fontSize: '0.85rem' }}>B2B markaları için pazarlama faaliyetlerine hızlıca başlamaya odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Süreçleri hızlıca devreye alır ve operasyonel yükten kurtarır.</li>
                                        <li><HiCheck /> <strong>Fark:</strong> Ekip kurma derdi olmadan hemen başlayın.</li>
                                        <li><HiCheck /> <strong>Uygun:</strong> Kaynak yönetimini sadeleştirmek isteyen KOBİ'ler.</li>
                                    </ul>
                                    <div style={{ textAlign: 'center' }}>
                                        <a href="https://khilonfast.com/b2b-sektorunu-butunlesik-pazarlama/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>

                                <div className="sectoral-card" style={{ border: '1px solid #d0e7f2', background: '#fdfdff' }}>
                                    <h3>Growth</h3>
                                    <p style={{ fontSize: '0.85rem' }}>B2B markaları için büyümeye ve derinlemesine çözümlere odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Müşteri tabanınızı sürdürülebilir büyütür.</li>
                                        <li><HiCheck /> <strong>Fark:</strong> İşletme etkisini artırarak rekabet avantajı sağlar.</li>
                                        <li><HiCheck /> <strong>Uygun:</strong> Dijitalde büyümeye yatırım yapan işletmeler.</li>
                                    </ul>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/b2b-sektorunu-butunlesik-pazarlama/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>

                                <div className="sectoral-card" style={{ border: '1px solid #1a3a52', transform: 'scale(1.02)', position: 'relative', zIndex: '2' }}>
                                    <h3>Ultimate</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Marka gücünü maksimize eden en üst seviye çözümlere odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Tüm kanalları entegre eden marka stratejisi.</li>
                                        <li><HiCheck /> <strong>Fark:</strong> Sektörde lider konuma getiren tam kapsamlı strateji.</li>
                                        <li><HiCheck /> <strong>Uygun:</strong> Rekabette öne çıkmak isteyen büyük işletmeler.</li>
                                    </ul>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/b2b-sektorunu-butunlesik-pazarlama/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'solutions',
                    label: 'İhtiyaca Özel Çözümler',
                    icon: <HiWrenchScrewdriver />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>B2B Sektörü İçin Özel Pazarlama Çözümleri</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '850px', margin: '0 auto 8px' }}>
                                    B2B sektöründe hizmet sunan firmalara özel olarak uyarlanmış çözümlerle, işinizin ihtiyaçlarına göre en doğru adımları seçin.
                                </p>
                                <p style={{ fontSize: '0.85rem', color: '#6b7280', maxWidth: '900px', margin: '0 auto' }}>
                                    İster tek tek alabileceğiniz hizmetlerle stratejinizi oluşturun, ister kapsamlı bir yaklaşım tercih edin; khilonfast ile süreçleri hızla devreye alın ve sektörde öne çıkın.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-4">
                                <div className="sectoral-card">
                                    <HiMagnifyingGlass style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Arama Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>B2B için hedefli Google arama reklamlarıyla doğru müşteri kitlesine ulaşın ve dönüşüm sağlayın.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/search_ads/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiChartBar style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Sosyal Medya Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>B2B markanızı sosyal medya platformlarında görünür kılın, etkileşim ve marka bilinirliğini artırın</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/sosyal-medya-reklamciligi/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiSparkles style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>SEO Hizmetleri</h3>
                                    <p style={{ fontSize: '0.85rem' }}>B2B sektöründe arama motorlarında üst sıralara çıkın, organik trafikle daha fazla müşteri çekin.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/seo/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiVideoCamera style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>İçerik Üretimi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>B2B hizmetlerinizle ilgili hedef kitlenizi bilgilendiren ve çeken stratejik içerikler oluşturun.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/icerik-uretimi/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'strategy',
                    label: 'Strateji / Danışmanlık',
                    icon: <HiChartBar />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="tab-grid grid-cols-3">
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>Go To Market Strategy</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Go-To-Market Stratejisi, yeni ürün veya hizmetinizi doğru kitleye, doğru kanallardan ve en verimli şekilde ulaştırmanızı sağlar. B2B sektörü gibi rekabetin yüksek olduğu pazarlarda, doğru GTM yaklaşımı büyümeyi hızlandırır ve fark yaratır.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/go-to-market-stratejisi/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>İçerik Stratejisi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        B2B Sektöründe etkili bir içerik stratejisi nasıl oluşturulur? Doğru mesajla hedef kitlenize nasıl ulaşabileceğinizi öğrenin.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/icerik-stratejisi/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>B2B Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        B2B sektöründe dijital dünyanın gücünü kullanarak satışlarınızı artırın. Sektöre özel stratejilerle rekabette öne çıkın, bu danışmanlık hizmetiyle tecrübeyi hızla firmanıza taşıyın.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <a href="#" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'analysis',
                    label: 'Reklam Görsel Analizi',
                    icon: <HiMagnifyingGlass />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="sectoral-split-layout">
                                <div className="sectoral-split-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1131181115"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title="Reklam Görsel Analizi"
                                    ></iframe>
                                </div>
                                <div className="sectoral-card" style={{ padding: '30px' }}>
                                    <h3 style={{ color: '#1a3a52', fontSize: '1.8rem', marginBottom: '25px' }}>Sosyal Medya Reklam Analizi</h3>
                                    <ul className="sectoral-features" style={{ fontSize: '0.95rem', marginBottom: '30px' }}>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Reklam görsellerinizin insanların gözünde <strong>nerelere odaklandığını</strong> ölçüyoruz.</span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Görselin hangi kısımlarının <strong>daha çok hatırlandığını ve ilgi topladığını</strong> ortaya çıkarıyoruz.</span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span><strong>Renkli haritalar</strong> (heatmap) ile görsellerinizin güçlü ve zayıf yanlarını gösteriyoruz.</span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Size özel önerilerle görsellerinizi <strong>daha etkili hale getiriyoruz.</strong></span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Böylece reklam bütçeniz boşa gitmiyor, <strong>daha uzun süre sonuç getiren görseller</strong> kullanıyorsunuz.</span></li>
                                    </ul>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/reklam-gorsel-analizi/" className="sectoral-btn" style={{ width: '100%', padding: '16px' }}>Satın Al</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        testimonial: {
            quote: "B2B dünyasında hız ve veri her şeydir. khilonfast'in 360 pazarlama yaklaşımı, gerçek ticari sonuçlar elde etmemizi sağladı.",
            author: "Emre Güzer",
            role: "CEO, Lidio"
        },
        processVideo: {
            vimeoUrl: "https://player.vimeo.com/video/1128822985?badge=0&autopause=0&player_id=0&app_id=58479"
        },
        faqs: [
            {
                question: 'Neden khilonfast ile çalışmayı seçmeliyim?',
                answer: 'khilonfast, kapsamlı dijital pazarlama deneyimi ve veriye dayalı yaklaşımları ile öne çıkar. İşletmenizin ihtiyaçlarını özel çözümler sunar, kampanyalarınızı sürekli optimize eder ve sonuç odaklı çalışır. Khilonfast ile çalışarak, markanızın dijital alanda güçlü bir yer edinmesini sağlayabilirsiniz.'
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
            }
        ],
        growthCTA: {
            title: "Google'da Görünür Olun!",
            description: "Potansiyel müşterileriniz sizi aradığında orada olun. khilonfast'in uzman SEO ekibiyle arama motorlarında yükselin, organik trafiğinizi ve satışlarınızı artırın."
        }
    }

    return <SectoralSolutionTemplate {...b2bConfig} />
}
