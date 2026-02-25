import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
    const isEn = currentLang === 'en'
    const langPrefix = currentLang === 'en' ? '/en' : ''
    const path = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/')

    const trConfig = {
        hero: {
            title: 'FinTech Firmaları İçin',
            subtitle: 'Tek Noktadan Pazarlama Çözümleri',
            description: 'khilonfast ile FinTech pazarlama süreçlerinizi zahmetsizce yönetin, sektör uzmanlığıyla etkili sonuçlar elde edin.',
            buttonText: 'Çözümleri Keşfedin',
            buttonLink: '#pricing',
            image: '/images/sektorel-hizmetler/fintech-360-pazarlama-yonetimi/hero.avif',
            hideBadge: true,
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
            vimeoUrl: 'https://player.vimeo.com/video/1135500461'
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
                                        <Link to={path('trainingGrowth')} className="sectoral-btn" style={{ background: '#d4f04d', color: '#1b3d2d', fontWeight: '700', width: '100%', textAlign: 'center' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                        <Link to={path('maestro')} className="sectoral-btn" style={{ background: '#d4f04d', color: '#1b3d2d', fontWeight: '700', width: '100%', textAlign: 'center' }}>{isEn ? 'Learn More' : 'Detaylı Bilgi'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-split-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1138057683?color&autopause=0&loop=0&muted=0&title=1&portrait=1&byline=1"
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
                                        <Link to={path('idm')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                        <Link to={path('idm')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                        <Link to={path('idm')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                        <Link to={path('googleAds')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiChartBar style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Linkedin Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Karar vericilere doğrudan ulaşmak için profesyonel hedefleme.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('socialAds')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiSparkles style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>FinTech SEO</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Güven ve otorite odaklı içeriklerle organik trafik artışı.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('seo')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiVideoCamera style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>İçerik Üretimi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Teknik FinTech çözümlerinizi anlaşılır kılan video ve bloglar.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('contentProduction')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                        <Link to={path('gtm')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>İletişim Stratejisi</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Regülasyonlara uyumlu, güven tazeleyen marka iletişimi.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <Link to={path('contentStrategy')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>Büyüme Danışmanlığı</h3>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Scale-up aşamasındaki FinTech’ler için metrik odaklı danışmanlık.
                                    </p>
                                    <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                        <Link to={path('contact')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                        <Link to={path('eyeTracking')} className="sectoral-btn" style={{ width: '100%', padding: '16px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
            vimeoUrl: "https://player.vimeo.com/video/1135500461"
        },
        faqs: [
            {
                question: 'FinTech şirketleri için neden khilonfast?',
                answer: 'khilonfast, finansal teknolojilerin kendine has dinamiklerine, regülasyonlarına ve hedef kitle davranışlarına hakimdir. Sadece reklam değil, güven ve marka otoritesi inşa eden bir 360 derece yaklaşım sunarız.'
            }
        ],
        growthCTA: {
            title: "FinTech'te Liderliğe Yükselin!",
            description: "Rekabetin en hararetli olduğu FinTech dünyasında fark yaratın. khilonfast'in uzman ekibiyle büyüme rakamlarınızı bir üst seviyeye taşıyın."
        }
    }

    
    const tabIcon = (id: string) => trConfig.tabsSection.tabs.find((tab) => tab.id === id)?.icon

    const enConfig = {
        ...trConfig,
        hero: {
            ...trConfig.hero,
            title: `For FinTech Companies`,
            subtitle: 'One-Stop Marketing Solutions',
            description: `Scale fintech customer growth with khilonfast through an integrated and execution-focused marketing operating model.`,
            buttonText: 'Explore Solutions',
            badgeText: 'FinTech Companies Growth Engine'
        },
        breadcrumbs: [
            { label: 'Sectoral Services', path: `${path('home')}#sectoral-services`.replace('/#', '/#') },
            { label: `360 Marketing Management for FinTech Companies` }
        ],
        videoShowcase: {
            ...trConfig.videoShowcase,
            tag: 'Watch & Learn',
            title: (
                <>
                    Growth Strategies That Deliver
                    <span className="highlight"> Measurable Results</span>
                </>
            ),
            description: 'Select the right solution set for your growth stage and activate your marketing operations with confidence.'
        },
        tabsSection: {
            ...trConfig.tabsSection,
            tag: `For FinTech Companies`,
            title: '360 Strategic Marketing Solutions',
            description1: 'Choose the right growth architecture for your market dynamics.',
            description2: 'Deploy quickly with khilonfast and scale with measurable outcomes.',
            tabs: [
                {
                    id: 'education',
                    label: 'Growth-Focused Marketing Training',
                    icon: tabIcon('education') || <HiVideoCamera />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="sectoral-split-layout">
                                <div className="sectoral-card">
                                    <h3>Growth-Focused Training for FinTech Companies</h3>
                                    <p>Master a proven operating system that aligns strategy, channel execution, and commercial outcomes.</p>
                                    <Link to={path('trainingFintech')} className="sectoral-btn">{t('pricing.buyNow')}</Link>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'ai',
                    label: 'Maestro AI',
                    icon: tabIcon('ai') || <HiSparkles />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="sectoral-split-layout reverse">
                                <div className="sectoral-card">
                                    <h3>Scale Decision Quality with Maestro AI</h3>
                                    <p>Unify data, planning, and campaign intelligence into one strategic command center for your team.</p>
                                    <ul className="sectoral-features">
                                        <li><HiCheck /> Accelerates strategic execution</li>
                                        <li><HiCheck /> Strengthens data-backed decisions</li>
                                        <li><HiCheck /> Reduces wasted effort and spend</li>
                                        <li><HiCheck /> Improves growth velocity</li>
                                    </ul>
                                    <Link to={path('maestro')} className="sectoral-btn">Learn More</Link>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'packages',
                    label: '360 Digital Marketing Management',
                    icon: tabIcon('packages') || <HiArrowsPointingIn />,
                    content: (
                        <div className='sectoral-tabs-content'>
                            <div className='tab-grid grid-cols-3'>
                                <div className='sectoral-card' style={{ border: '1px solid #eef2d0' }}>
                                    <h3>Core</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Launch quickly with a lean execution setup focused on traction.</p>
                                    <div style={{ textAlign: 'center' }}>
                                        <Link to={path('idm')} className='sectoral-btn' style={{ width: '100%', padding: '12px' }}>{t('pricing.buyNow')}</Link>
                                    </div>
                                </div>
                                <div className='sectoral-card' style={{ border: '1px solid #d0e7f2', background: '#fdfdff' }}>
                                    <h3>Growth</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Scale demand generation and conversion performance with stronger orchestration.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('idm')} className='sectoral-btn' style={{ width: '100%', padding: '12px' }}>{t('pricing.buyNow')}</Link>
                                    </div>
                                </div>
                                <div className='sectoral-card' style={{ border: '1px solid #1a3a52', transform: 'scale(1.02)', position: 'relative', zIndex: '2' }}>
                                    <h3>Ultimate</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Operate a full-spectrum growth system with strategic and executional depth.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('idm')} className='sectoral-btn' style={{ width: '100%', padding: '12px' }}>{t('pricing.buyNow')}</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'solutions',
                    label: 'Tailored Solutions',
                    icon: tabIcon('solutions') || <HiWrenchScrewdriver />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="tab-grid grid-cols-4">
                                <div className="sectoral-card">
                                    <HiMagnifyingGlass style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Search Ads</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Capture high-intent demand with conversion-focused campaign architecture.</p>
                                    <Link to={path('googleAds')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{t('pricing.buyNow')}</Link>
                                </div>
                                <div className="sectoral-card">
                                    <HiChartBar style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Social Advertising</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Scale reach and qualified engagement across high-value social channels.</p>
                                    <Link to={path('socialAds')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{t('pricing.buyNow')}</Link>
                                </div>
                                <div className="sectoral-card">
                                    <HiSparkles style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>SEO Management</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Build organic authority and sustainable inbound growth.</p>
                                    <Link to={path('seo')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{t('pricing.buyNow')}</Link>
                                </div>
                                <div className="sectoral-card">
                                    <HiVideoCamera style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Content Production</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Produce strategic assets that convert expertise into pipeline impact.</p>
                                    <Link to={path('contentProduction')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{t('pricing.buyNow')}</Link>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'strategy',
                    label: 'Strategy & Advisory',
                    icon: tabIcon('strategy') || <HiChartBar />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="tab-grid grid-cols-3">
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>Go-to-Market Strategy</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Design your market entry and scaling roadmap with strategic precision.</p>
                                    <Link to={path('gtm')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{t('pricing.buyNow')}</Link>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>Content Strategy</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Build messaging systems that increase trust, relevance, and conversion quality.</p>
                                    <Link to={path('contentStrategy')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{t('pricing.buyNow')}</Link>
                                </div>
                                <div className="sectoral-card" style={{ textAlign: 'left' }}>
                                    <h3>Growth Advisory</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Work directly with khilonfast for high-impact strategic and operational guidance.</p>
                                    <Link to={path('contact')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{t('pricing.buyNow')}</Link>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'analysis',
                    label: 'Ad Creative Analysis',
                    icon: tabIcon('analysis') || <HiMagnifyingGlass />,
                    content: (
                        <div className="sectoral-tabs-content">
                            <div className="sectoral-split-layout">
                                <div className="sectoral-card">
                                    <h3>Visual Performance Intelligence</h3>
                                    <p>Identify weak points in your ad creatives before scaling media budgets.</p>
                                    <Link to={path('eyeTracking')} className="sectoral-btn">Learn More</Link>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        testimonial: {
            ...trConfig.testimonial,
            quote: 'khilonfast gave us a clear growth framework and execution rhythm that improved both pipeline quality and conversion consistency.',
            role: 'Commercial Director'
        },
        faqs: [
            { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
            { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
            { question: t('faq.item3.question'), answer: t('faq.item3.answer') }
        ],
        ...((trConfig as any).growthCTA ? {
            growthCTA: {
                ...(trConfig as any).growthCTA,
                title: 'Grow with a Better Marketing Operating System',
                description: 'Activate your strategy with khilonfast and scale your market impact with confidence.'
            }
        } : {})
    }

    return <SectoralSolutionTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-fintech-360" />
}
