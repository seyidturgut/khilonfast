import { Link } from 'react-router-dom'
import {
    HiChartBar,
    HiCheck,
    HiVideoCamera,
    HiSparkles,
    HiArrowsPointingIn,
    HiWrenchScrewdriver,
    HiMagnifyingGlass,
    HiCreditCard
} from 'react-icons/hi2'
import SectoralSolutionTemplate from './templates/SectoralSolutionTemplate'

export default function FintechMarketing() {
    const fintechConfig = {
        hero: {
            title: 'FinTech Firmaları İçin',
            subtitle: 'Tek Noktadan Pazarlama Çözümleri',
            description: 'khilonfast ile FinTech pazarlama süreçlerinizi zahmetsizce yönetin, sektör uzmanlığıyla etkili sonuçlar elde edin.',
            buttonText: 'Çözümleri Keşfedin',
            buttonLink: '#pricing',
            image: '/fintech-hero.png',
            badgeText: 'FinTech Sektörü Pazarlama Üssü • FinTech Sektörü Pazarlama Üssü • ',
            badgeIcon: <HiCreditCard />,
            themeColor: '#D9F99D'
        },
        breadcrumbs: [
            { label: 'Sektörel Hizmetler', path: '/#sectoral-services' },
            { label: 'FinTech Firmaları İçin 360 Pazarlama Yönetimi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    FinTech Sektöründe Başarıyı Getiren
                    <span className="highlight"> Büyüme Stratejileri</span>
                </>
            ),
            description: 'FinTech sektöründe büyümek için doğru adımları atın. İhtiyacınıza uygun çözümleri seçin, khilonfast ile pazarlama süreçlerinizi hızla devreye alın.',
            vimeoUrl: 'https://player.vimeo.com/video/1133021053?badge=0&autopause=0&player_id=0&app_id=58479'
        },
        tabsSection: {
            tag: 'FinTech Sektörü İçin',
            title: '360° Stratejik Pazarlama Çözümleri',
            description1: 'Finansal teknolojilerde liderliğe oynamak için doğru adımları atın.',
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
                                <div className="sectoral-card" style={{ background: '#f7f9f2', border: '1px solid #e2ebb4' }}>
                                    <h3 style={{ color: '#1b3d2d', fontSize: '1.6rem' }}>FinTech Sektöründe Büyüme Odaklı Pazarlama</h3>
                                    <p style={{ color: '#1b3d2d', fontWeight: '500' }}>Büyüme odaklı pazarlama alanında Türkiye’nin sayılı uzmanlarından Bora Işık tarafından hazırlanan bu eğitim, sahada kanıtlanmış yöntemleri ve tekrar edilebilir stratejileri sunuyor.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to="/hizmetlerimiz/buyume-odakli-pazarlama-egitimi" className="sectoral-btn" style={{ background: '#d4f04d', color: '#1b3d2d', fontWeight: '700', width: '100%', textAlign: 'center' }}>Satın Al</Link>
                                    </div>
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
                                <div className="sectoral-card" style={{ background: '#f7f9f2', border: '1px solid #e2ebb4' }}>
                                    <h3 style={{ color: '#1b3d2d', fontSize: '1.6rem' }}>Maestro AI ile pazarlama kararlarını analize dayalı alın!</h3>
                                    <p style={{ color: '#1b3d2d', fontWeight: '500' }}>FinTech sektörü için hazırlanmış yapay zeka asistanımız; CRM, PR, pazar araştırma, satış, dijital pazarlama ve strateji disiplinlerini birleştirerek size hazır çözümler sunar.</p>
                                    <ul className="sectoral-features" style={{ color: '#1b3d2d' }}>
                                        <li><HiCheck /> Tecrübeyi firmanıza hızla ekler</li>
                                        <li><HiCheck /> Verilerle doğru kararlar almanızı sağlar</li>
                                        <li><HiCheck /> Zaman kaybını önler, maliyetleri düşürür</li>
                                        <li><HiCheck /> Büyümeyi hızlandırırsınız.</li>
                                    </ul>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy/" className="sectoral-btn" style={{ background: '#d4f04d', color: '#1b3d2d', fontWeight: '700', width: '100%', textAlign: 'center' }}>Detaylı Bilgi</a>
                                    </div>
                                </div>
                                <div className="sectoral-split-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1131184399?color&autopause=0&loop=0&muted=0&title=1&portrait=1&byline=1"
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
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>Tam Donanımlı FinTech Pazarlama Takımınızı Kurun</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '700px', margin: '0 auto' }}>
                                    FinTech hizmeti sunan firmalar için özelleştirilmiş, stratejik pazarlama takımlarıyla işinizi hızlıca büyütün.
                                    Tüm pazarlama ihtiyaçlarınızı tek bir yerden karşılayarak operasyonel yüklerden kurtulun.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-3">
                                <div className="sectoral-card" style={{ border: '1px solid #eef2d0' }}>
                                    <h3>Core</h3>
                                    <p style={{ fontSize: '0.85rem' }}>FinTech markaları için pazarlama faaliyetlerine hızlıca başlamaya odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Süreçleri hızlıca devreye alır ve operasyonel yükten kurtarır.</li>
                                        <li><HiCheck /> <strong>Fark:</strong> Ekip kurma derdi olmadan hemen başlayın.</li>
                                        <li><HiCheck /> <strong>Uygun:</strong> Kaynak yönetimini sadeleştirmek isteyen FinTech girişimleri.</li>
                                    </ul>
                                    <div style={{ textAlign: 'center' }}>
                                        <a href="https://khilonfast.com/b2b-sektorunu-butunlesik-pazarlama/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ border: '1px solid #d0e7f2', background: '#fdfdff' }}>
                                    <h3>Growth</h3>
                                    <p style={{ fontSize: '0.85rem' }}>FinTech markaları için büyümeye ve derinlemesine çözümlere odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Müşteri tabanınızı sürdürülebilir büyütür.</li>
                                        <li><HiCheck /> <strong>Fark:</strong> İşletme etkisini artırarak rekabet avantajı sağlar.</li>
                                        <li><HiCheck /> <strong>Uygun:</strong> Pazar payını artırmak isteyen FinTech şirketleri.</li>
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
                                        <li><HiCheck /> <strong>Uygun:</strong> Global ölçekte büyümeyi hedefleyen FinTech markaları.</li>
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
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>FinTech Sektörü İçin Özel Pazarlama Çözümleri</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '850px', margin: '0 auto 8px' }}>
                                    FinTech sektöründe hizmet sunan firmalara özel olarak uyarlanmış çözümlerle, işinizin ihtiyaçlarına göre en doğru adımları seçin.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-4">
                                <div className="sectoral-card">
                                    <HiMagnifyingGlass style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Arama Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Düşük maliyetli müşteri kazanımı için Google Ads stratejileri.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/search_ads/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiChartBar style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Linkedin Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Karar vericilere doğrudan ulaşmak için profesyonel hedefleme.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/sosyal-medya-reklamciligi/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiSparkles style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>FinTech SEO</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Güven ve otorite odaklı içeriklerle organik trafik artışı.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/seo/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiVideoCamera style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>İçerik Üretimi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Teknik FinTech çözümlerinizi anlaşılır kılan video ve bloglar.</p>
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
                                        GTM Stratejisi ile yeni FinTech ürününüzü hızla pazara sunun.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/go-to-market-stratejisi/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>İletişim Stratejisi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Regülasyonlara uyumlu, güven tazeleyen marka iletişimi.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/icerik-stratejisi/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>Büyüme Danışmanlığı</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Scale-up aşamasındaki FinTech’ler için metrik odaklı danışmanlık.
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
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Görsellerinizin FinTech kitlesinde yarattığı <strong>etkiyi ölçüyoruz.</strong></span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Görselin hangi kısımlarının <strong>güven telkin ettiğini</strong> analiz ediyoruz.</span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span><strong>Heatmap</strong> ile kullanıcı dikkatini nereye odakladığını gösteriyoruz.</span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Dönüşüm oranlarını artıracak <strong>görsel revizyon önerileri</strong> sunuyoruz.</span></li>
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
            quote: "FinTech sektörü hata kabul etmez. khilonfast'in veriye dayalı stratejileriyle CAC oranlarımızı düşürürken pazar payımızı artırdık.",
            author: "Hakan Erdoğan",
            role: "CMO, FinPay"
        },
        processVideo: {
            vimeoUrl: "https://player.vimeo.com/video/1128822985?badge=0&autopause=0&player_id=0&app_id=58479"
        },
        faqs: [
            {
                question: 'FinTech şirketleri için neden khilonfast?',
                answer: 'Khilonfast, finansal teknolojilerin kendine has dinamiklerine, regülasyonlarına ve hedef kitle davranışlarına hakimdir. Sadece reklam değil, güven ve marka otoritesi inşa eden bir 360 derece yaklaşım sunarız.'
            }
        ],
        growthCTA: {
            title: "FinTech'te Liderliğe Yükselin!",
            description: "Rekabetin en hararetli olduğu FinTech dünyasında fark yaratın. khilonfast'in uzman ekibiyle büyüme rakamlarınızı bir üst seviyeye taşıyın."
        }
    }

    return <SectoralSolutionTemplate {...fintechConfig} />
}
