import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    HiChartBar,
    HiCheck,
    HiVideoCamera,
    HiSparkles,
    HiArrowsPointingIn,
    HiWrenchScrewdriver,
    HiMagnifyingGlass,
    HiWrench
} from 'react-icons/hi2'
import SectoralSolutionTemplate from './templates/SectoralSolutionTemplate'
import StrategyAdvisoryTabContent from '../components/sectoral/StrategyAdvisoryTabContent'

export default function ManufacturingMarketing() {
    const { t, i18n } = useTranslation('common')
    const location = useLocation()
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr'
    const isEn = currentLang === 'en'
    const langPrefix = isEn ? '/en' : ''

    useEffect(() => {
        const activeLang = i18n.language.split('-')[0]
        if (activeLang !== currentLang) {
            void i18n.changeLanguage(currentLang)
        }
    }, [currentLang, i18n])
    const path = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/')

    const trConfig = {
        hero: {
            title: (
                <>
                    B2B Firmalar İçin<br />
                    Tek Noktadan Pazarlama Çözümleri
                </>
            ),
            subtitle: '',
            description: 'khilonfast ile Business to Business pazarlama süreçlerinizi zahmetsizce yönetin, sektör uzmanlığıyla etkili sonuçlar elde edin.',
            buttonText: 'Çözümleri Keşfedin',
            buttonLink: '#pricing',
            image: '/images/sektorel-hizmetler/uretim-sektoru-firmalari-360-pazarlama-yonetimi/hero.avif',
            hideBadge: true,
            badgeText: 'Üretim Sektörü Pazarlama Üssü • Üretim Sektörü Pazarlama Üssü • ',
            badgeIcon: <HiWrench />,
            themeColor: '#D9F99D'
        },
        breadcrumbs: [
            { label: 'Sektörel Hizmetler', path: '/#sectoral-services' },
            { label: 'Üretim Sektörü Firmaları İçin 360 Pazarlama Yönetimi' }
        ],
        videoShowcase: {
            tag: 'İzleyin & Öğrenin',
            title: (
                <>
                    Üretim Sektöründe Başarıyı Getiren
                    <span className="highlight"> Büyüme Stratejileri</span>
                </>
            ),
            description: 'Üretim sektöründe büyümek için doğru adımları atın. İhtiyacınıza uygun çözümleri seçin, khilonfast ile pazarlama süreçlerinizi hızla devreye alın.',
            vimeoUrl: 'https://player.vimeo.com/video/1135508564'
        },
        tabsSection: {
            tag: '',
            title: (
                <>
                    B2B Sektörü için<br />
                    360° Stratejik Pazarlama Çözümleri
                </>
            ),
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
                                <div className="sectoral-card" style={{ background: '#f7f9f2', border: '1px solid #e2ebb4' }}>
                                    <h3 style={{ color: '#1b3d2d', fontSize: '1.6rem' }}>B2B Sektöründe Büyüme Odaklı Pazarlama</h3>
                                    <p style={{ color: '#1b3d2d', fontWeight: '500' }}>Büyüme odaklı pazarlama alanında Türkiye’nin sayılı uzmanlarından Bora Işık tarafından hazırlanan bu eğitim, sahada kanıtlanmış yöntemleri ve tekrar edilebilir stratejileri sunuyor.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('trainingManufacturing')} className="sectoral-btn" style={{ background: '#d4f04d', color: '#1b3d2d', fontWeight: '700', width: '100%', textAlign: 'center' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                    <p style={{ color: '#1b3d2d', fontWeight: '500' }}>Üretim sektörü için hazırlanmış yapay zeka asistanımız; CRM, PR, pazar araştırma, satış, dijital pazarlama ve strateji disiplinlerini birleştirerek size hazır çözümler sunar.</p>
                                    <ul className="sectoral-features" style={{ color: '#1b3d2d' }}>
                                        <li><HiCheck /> Tecrübeyi firmanıza hızla ekler</li>
                                        <li><HiCheck /> Verilerle doğru kararlar almanızı sağlar</li>
                                        <li><HiCheck /> Zaman kaybını önler, maliyetleri düşürür</li>
                                        <li><HiCheck /> Büyümeyi hızlandırırsınız.</li>
                                    </ul>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={isEn ? '/en/products/maestro-ai' : '/urunler/maestro-ai'} className="sectoral-btn" style={{ background: '#d4f04d', color: '#1b3d2d', fontWeight: '700', width: '100%', textAlign: 'center' }}>{isEn ? 'Learn More' : 'Detaylı Bilgi'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-split-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1138050853?color&autopause=0&loop=0&muted=0&title=1&portrait=1&byline=1"
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
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>Tam Donanımlı Endüstriyel Pazarlama Takımınızı Kurun</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '700px', margin: '0 auto' }}>
                                    Üretim firmaları için özelleştirilmiş, stratejik pazarlama takımlarıyla fabrikanızın gücünü tüm dünyaya duyurun.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-3">
                                <div className="sectoral-card" style={{ border: '1px solid #eef2d0' }}>
                                    <h3>Core</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Üretim sektörü markaları için pazarlama faaliyetlerine hızlıca başlamaya ve sonuç almaya odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Dijital pazarlama süreçlerinizi hızlıca devreye alır ve operasyonel yüklerden kurtarır.</li>
                                        <li><HiCheck /> <strong>Öne Çıkan Fark:</strong> Ekstra toplantılar veya ekip kurma derdi olmadan pazarlama faaliyetlerine hemen başlayabilir, sonuçları kısa sürede görebilirsiniz.</li>
                                        <li><HiCheck /> <strong>Kimler İçin Uygun:</strong> Zaman ve kaynak yönetimini sadeleştirmek isteyen küçük ve orta ölçekli işletmeler.</li>
                                    </ul>
                                    <div style={{ textAlign: 'center' }}>
                                        <Link to={path('idm')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ border: '1px solid #d0e7f2', background: '#fdfdff' }}>
                                    <h3>Growth</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Üretim sektörü markaları için büyümeye ve derinlemesine pazarlama çözümlerine odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Dijital varlığınızı genişletmek ve müşteri tabanınızı büyütmek için dengeli ve sürdürülebilir çözümler sunar.</li>
                                        <li><HiCheck /> <strong>Öne Çıkan Fark:</strong> İşletmenizin pazarlama etkisini artırarak, büyümeye odaklanmanızı sağlar ve rakiplerinize karşı avantaj kazandırır.</li>
                                        <li><HiCheck /> <strong>Kimler İçin Uygun:</strong> Dijital pazarlamada bir adım ileri gitmek isteyen ve büyümeye yatırım yapmayı hedefleyen işletmeler.</li>
                                    </ul>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('idm')} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card" style={{ border: '1px solid #1a3a52', transform: 'scale(1.02)', position: 'relative', zIndex: '2' }}>
                                    <h3>Ultimate</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Üretim sektörü markaları için pazarlama süreçlerini en üst seviyeye taşıyan ve marka gücünü maksimize eden çözümlere odaklanır.</p>
                                    <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                        <li><HiCheck /> <strong>Faydalar:</strong> Tüm pazarlama kanallarını entegre ederek güçlü bir marka stratejisi oluşturur ve kalıcı bir etki yaratır.</li>
                                        <li><HiCheck /> <strong>Öne Çıkan Fark:</strong> Pazarda lider konuma gelmenizi sağlayacak tam kapsamlı bir strateji ile yüksek seviyede rekabet avantajı sunar.</li>
                                        <li><HiCheck /> <strong>Kimler İçin Uygun:</strong> Tam donanımlı bir pazarlama stratejisiyle sektörde öne çıkmak isteyen büyük işletmeler.</li>
                                    </ul>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('idm')} className="sectoral-btn" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
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
                                <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>Üretim Sektörü İçin Özel Çözümler</h3>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '850px', margin: '0 auto 8px' }}>
                                    Endüstriyel ürünlerin tanıtımı ve pazarlanması için teknik odaklı dijital kanallar.
                                </p>
                            </div>
                            <div className="tab-grid grid-cols-4">
                                <div className="sectoral-card">
                                    <HiMagnifyingGlass style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Google Ads (Global)</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Küresel pazarlarda potansiyel alıcılara doğrudan ulaşın.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('googleAds')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiChartBar style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Linkedin Reklamları</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Satın alma direktörlerine ve endüstri profesyonellerine erişim.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('socialAds')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiSparkles style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Teknik SEO</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Ürün kataloglarınızla global aramalarda üst sıralarda yer alın.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link to={path('seo')} className="sectoral-btn" style={{ width: '100%', padding: '10px' }}>{isEn ? 'Buy Now' : 'Satın Al'}</Link>
                                    </div>
                                </div>
                                <div className="sectoral-card">
                                    <HiVideoCamera style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#1a3a52' }} />
                                    <h3>Tesis Prodüksiyonu</h3>
                                    <p style={{ fontSize: '0.85rem' }}>Üretim hattınızı ve tesis gücünüzü profesyonel videolarla sunun.</p>
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
                    content: <StrategyAdvisoryTabContent isEn={false} advisoryTitle="Üretim Firmaları İçin Büyüme Odaklı Pazarlama Danışmanlığı" gtmContext="üretim firmaları için" advisoryPath="/danismanlik/uretim-sektorunde-buyume-odakli-pazarlama-danismanligi" />
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
                                    <h3 style={{ color: '#1a3a52', fontSize: '1.8rem', marginBottom: '25px' }}>Reklam Görsel Analizi</h3>
                                    <ul className="sectoral-features" style={{ fontSize: '0.95rem', marginBottom: '30px' }}>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Teknik ürün görsellerinin profesyonel kitle üzerindeki etkisini <strong>ölçüyoruz.</strong></span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Üretim tesisi fotoğraflarının <strong>güven algısını</strong> analiz ediyoruz.</span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span><strong>Heatmap</strong> ile teknik broşürlerinizdeki odak noktalarını raporluyoruz.</span></li>
                                        <li><span style={{ color: '#1a3a52', marginRight: '10px' }}>•</span> <span>Tıklanma oranlarını artırmak için <strong>endüstriyel tasarım önerileri</strong> sunuyoruz.</span></li>
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
            quote: "Üretim gücümüzü dijital dünyada doğru kitlelere ulaştırmak, khilonfast ile çok daha stratejik bir hale geldi. İhracat taleplerimiz %40 arttı.",
            author: "Caner Yıldız",
            role: "Dış Ticaret Müdürü, MegaIndustrial"
        },
        processVideo: {
            vimeoUrl: "https://player.vimeo.com/video/1128822985"
        },
        faqs: [
            {
                question: 'Üretim firmaları için neden khilonfast?',
                answer: 'Endüstriyel pazarlamanın dinamiklerini, fuar süreçlerini ve ihracat hedeflerini biliyoruz. Fabrikanızı sadece bir üretim tesisi olarak değil, global bir marka olarak konumlandırıyoruz.'
            }
        ],
        growthCTA: {
            title: "Üretim Gücünüzü Küresele Taşıyın!",
            description: "Endüstriyel pazarlamada fark yaratacak stratejiyi birlikte kuralım. khilonfast ile üretim sektöründe dijital dönüşümü başlatın."
        }
    }

    
    const tabIcon = (id: string) => trConfig.tabsSection.tabs.find((tab) => tab.id === id)?.icon

    const enConfig = {
        ...trConfig,
        hero: {
            ...trConfig.hero,
            title: `360° Marketing Management for Manufacturing Companies`,
            subtitle: '',
            description: `Scale manufacturing demand growth with khilonfast through an integrated and execution-focused marketing operating model.`,
            buttonText: 'Explore Solutions',
            badgeText: 'Manufacturing Companies Growth Engine'
        },
        breadcrumbs: [
            { label: 'Sectoral Services', path: `${path('home')}#sectoral-services`.replace('/#', '/#') },
            { label: `360 Marketing Management for Manufacturing Companies` }
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
            tag: `For Manufacturing Companies`,
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
                                    <h3>Growth-Focused Training for Manufacturing Companies</h3>
                                    <p>Master a proven operating system that aligns strategy, channel execution, and commercial outcomes.</p>
                                    <Link to={path('trainingManufacturing')} className="sectoral-btn">{t('pricing.buyNow')}</Link>
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
                                    <Link to={isEn ? '/en/products/maestro-ai' : '/urunler/maestro-ai'} className="sectoral-btn">Learn More</Link>
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
                    content: <StrategyAdvisoryTabContent isEn={true} advisoryTitle="Growth-Focused Marketing Advisory for Manufacturing Companies" gtmContext="For manufacturing companies," advisoryPath="/en/consulting/growth-focused-marketing-consulting-for-manufacturing" />
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

    return <SectoralSolutionTemplate {...(isEn ? enConfig : trConfig)} serviceKey="service-manufacturing" disableApiHeroTextOverride={true} disableApiPackages={true} />
}
