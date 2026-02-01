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

export default function PaymentSystemsMarketing() {
    const paymentConfig = {
        hero: {
            title: 'Ödeme Sistemleri İçin',
            subtitle: 'Tek Noktadan Pazarlama Çözümleri',
            description: 'Ödeme sistemlerinde büyümenin sırrını keşfedin. khilonfast ile pazarlama süreçlerinizi zahmetsizce yönetin, sektör uzmanlığıyla etkili sonuçlar elde edin.',
            buttonText: 'Çözümleri Keşfedin',
            buttonLink: '#pricing',
            image: '/img/payment-systems-hero.png',
            badgeText: "Fintech'te Güçlü Büyüme!",
            badgeIcon: <HiCreditCard />,
            themeColor: '#E0F2FE'
        },
        breadcrumbs: [
            { label: 'Sektörel Hizmetler', path: '/#sectoral-services' },
            { label: 'Ödeme Sistemleri Pazarlama Yönetimi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Ödeme Sistemlerinde Başarıyı Getiren
                    <span className="highlight"> Büyüme Stratejileri</span>
                </>
            ),
            description: 'Ödeme sistemlerinde büyümek için doğru adımları atın. İhtiyacınıza uygun çözümleri seçin, khilonfast ile pazarlama süreçlerinizi hızla devreye alın.',
            vimeoUrl: 'https://player.vimeo.com/video/1131185616'
        },
        tabsSection: {
            tag: 'Ödeme Sistemleri İçin',
            title: '360° Stratejik Pazarlama Çözümleri',
            description1: 'Ödeme sistemlerinde büyümek için doğru adımları atın.',
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
                                    <h3 style={{ color: '#1b3d2d', fontSize: '1.6rem' }}>Ödeme Sistemlerinde Büyüme Odaklı Pazarlama</h3>
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
                                <div className="sectoral-card">
                                    <h3>Maestro AI ile farklı pazarlama departmanlarını yönetin!</h3>
                                    <p>Ödeme sistemleri sektörü için hazırlanmış yapay zeka asistanımız; CRM, PR, pazar araştırma, satış, dijital pazarlama ve strateji disiplinlerini birleştirerek size hazır çözümler sunar.</p>
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
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>Tam Donanımlı Pazarlama Takımınızı Kurun</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '700px', margin: '0 auto' }}>
                                    Ödeme sistemleri sunan firmalar için özelleştirilmiş, stratejik pazarlama takımlarıyla işinizi hızlıca büyütün.
                                    Tüm pazarlama ihtiyaçlarınızı tek bir yerden karşılayarak operasyonel yüklerden kurtulun.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-3">
                                <div className="sectoral-card" style={{ border: '1px solid #eef2d0' }}>
                                    <h3>Core</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Ödeme sistemleri markaları için pazarlama faaliyetlerine hızlıca başlamaya odaklanır.</p>
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
                                    <p style={{ fontSize: '0.85rem' }}>Ödeme sistemleri markaları için büyümeye ve derinlemesine çözümlere odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Kullanıcı tabanınızı sürdürülebilir büyütür.</li>
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
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>Fintech Sektörü İçin Özel Pazarlama Çözümleri</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '850px', margin: '0 auto 8px' }}>
                                    Ödeme sistemleri sektöründe hizmet sunan firmalara özel olarak uyarlanmış çözümlerle, işinizin ihtiyaçlarına göre en doğru adımları seçin.
                                </p>
                                <p style={{ fontSize: '0.85rem', color: '#6b7280', maxWidth: '900px', margin: '0 auto' }}>
                                    İster tek tek alabileceğiniz hizmetlerle stratejinizi oluşturun, ister kapsamlı bir yaklaşım tercih edin; khilonfast ile süreçleri hızla devreye alın ve sektörde öne çıkın.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-4">
                                <div className="sectoral-card">
                                    <HiMagnifyingGlass style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Arama Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Fintech için hedefli Google arama reklamlarıyla doğru müşteri kitlesine ulaşın ve dönüşüm sağlayın.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/search_ads/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiChartBar style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Sosyal Medya Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Ödeme sistemi markanızı sosyal medya platformlarında görünür kılın, etkileşim ve marka bilinirliğini artırın</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/sosyal-medya-reklamciligi/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiSparkles style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>SEO Hizmetleri</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Fintech sektöründe arama motorlarında üst sıralara çıkın, organik trafikle daha fazla müşteri çekin.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/seo/" className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiVideoCamera style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>İçerik Üretimi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Ödeme çözümlerinizle ilgili hedef kitlenizi bilgilendiren ve çeken stratejik içerikler oluşturun.</p>
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
                                        Go-To-Market Stratejisi, yeni ürün veya hizmetinizi doğru kitleye, doğru kanallardan ve en verimli şekilde ulaştırmanızı sağlar. Ödeme sistemleri gibi rekabetin yüksek olduğu pazarlarda, doğru GTM yaklaşımı büyümeyi hızlandırır ve fark yaratır.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/go-to-market-stratejisi/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>İçerik Stratejisi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Ödeme Sistemleri Sektöründe etkili bir içerik stratejisi nasıl oluşturulur? Doğru mesajla hedef kitlenize nasıl ulaşabileceğinizi öğrenin.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <a href="https://khilonfast.com/icerik-stratejisi/" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>Satın Al</a>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>Fintech Büyüme Odaklı Pazarlama Danışmanlığı</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Ödeme sistemleri dünyasında dijitalin gücünü kullanarak pazar payınızı artırın. Sektöre özel stratejilerle rekabette öne çıkın, bu danışmanlık hizmetiyle tecrübeyi hızla firmanıza taşıyın.
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
            quote: "Fintech sektörü hata kabul etmez. khilonfast'in ödeme sistemleri konusundaki derin tecrübesi, pazarlama operasyonlarımızı bir üst seviyeye taşıdı.",
            author: "Caner Özkan",
            role: "Fintech Direktörü"
        },
        processVideo: {
            vimeoUrl: "https://player.vimeo.com/video/1128822985"
        }
    }

    return <SectoralSolutionTemplate {...paymentConfig} />
}
