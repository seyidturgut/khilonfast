import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiMenu, HiX, HiChevronDown, HiChevronRight, HiArrowLeft } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import Cart from './Cart'
import CartIcon from './CartIcon'
import UserIcon from './UserIcon'
import {
    HiRocketLaunch,
    HiDocumentText,
    HiPresentationChartLine,
    HiCursorArrowRays,
    HiShare,
    HiMagnifyingGlass,
    HiPencilSquare,
    HiEnvelope,
    HiBriefcase,
    HiCreditCard,
    HiCommandLine,
    HiBolt,
    HiPaintBrush,
    HiTruck,
    HiWrench,
    HiOutlineEye,
    HiAcademicCap
} from 'react-icons/hi2'
import { trainingPrograms } from '../data/trainingPrograms'
import { productPrograms } from '../data/productPrograms'
import './Header.css'

const services = [
    { icon: HiRocketLaunch, title: 'Go To Market Stratejisi', desc: 'Pazara giriş ve büyüme planları', path: '/hizmetlerimiz/go-to-market-stratejisi' },
    { icon: HiDocumentText, title: 'İçerik Stratejisi', desc: 'Marka hikayenizi güçlendiren içerikler', path: '/hizmetlerimiz/icerik-stratejisi' },
    { icon: HiPresentationChartLine, title: 'Bütünleşik Dijital Pazarlama', desc: '360 derece pazarlama çözümleri', path: '/hizmetlerimiz/butunlesik-dijital-pazarlama' },
    { icon: HiCursorArrowRays, title: 'Google Ads', desc: 'Performans odaklı reklam yönetimi', path: '/hizmetlerimiz/google-ads' },
    { icon: HiShare, title: 'Sosyal Medya Reklamcılığı', desc: 'Hedef kitle etkileşimini artırın', path: '/hizmetlerimiz/sosyal-medya-reklamciligi' },
    { icon: HiMagnifyingGlass, title: 'SEO', desc: 'Arama motorlarında üst sıralara çıkın', path: '/hizmetlerimiz/seo-yonetimi' },
    { icon: HiPencilSquare, title: 'İçerik Üretimi', desc: 'Etkileyici ve özgün içerik üretimi', path: '/hizmetlerimiz/icerik-uretimi' },
    { icon: HiEnvelope, title: 'B2B Email Pazarlama', desc: 'Profesyonel e-posta kampanyaları', path: '/hizmetlerimiz/b2b-email-pazarlama' },
    { icon: HiBolt, title: 'Maestro AI', desc: 'Sektörel akıllı pazarlama asistanı', path: '/hizmetlerimiz/maestro-ai' },
    { icon: HiOutlineEye, title: 'Eye Tracking Reklam Analizi', desc: 'AI destekli reklam görsel analizi', path: '/hizmetlerimiz/eye-tracking-reklam-analizi' },
    { icon: HiCommandLine, title: 'Google Search Console Kurulumu', desc: 'Siteniz için arama konsolu kurulum rehberi', path: '/hizmetlerimiz/google-search-console-kurulum-akisi' }
]

const sectoralServices = [
    { icon: HiBriefcase, title: 'B2B Firmalar İçin 360 Pazarlama Yönetimi', desc: 'Bütünleşik B2B pazarlama çözümleri', path: '/sektorel-hizmetler/b2b-360-pazarlama-yonetimi' },
    { icon: HiCreditCard, title: 'Ödeme Sistemleri İçin 360 Pazarlama Yönetimi', desc: 'Fintech odaklı stratejik çözümler', path: '/sektorel-hizmetler/odeme-sistemleri-pazarlama-yonetimi' },
    { icon: HiRocketLaunch, title: 'Endüstriyel Gıda & Şef Çözümleri', desc: 'Gıda sektörüne özel 360 pazarlama', path: '/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-pazarlama-yonetimi' },
    { icon: HiPresentationChartLine, title: 'FinTech Firmaları İçin 360 Pazarlama', desc: 'Finansal teknoloji odaklı çözümler', path: '/sektorel-hizmetler/fintech-360-pazarlama-yonetimi' },
    { icon: HiCommandLine, title: 'Teknoloji & Yazılım Firmaları İçin 360 Pazarlama Yönetimi', desc: 'SaaS ve yazılım odaklı çözümler', path: '/sektorel-hizmetler/teknoloji-yazilim-360-pazarlama-yonetimi' },
    { icon: HiBolt, title: 'Enerji Firmaları İçin 360 Pazarlama Yönetimi', desc: 'Enerji ve teknoloji odaklı çözümler', path: '/sektorel-hizmetler/enerji-firmalari-360-pazarlama-yonetimi' },
    { icon: HiPaintBrush, title: 'Ofis & Kurumsal İç Tasarım Sektörü İçin Pazarlama Yönetimi', desc: 'Mimari ve kurumsal tasarım çözümleri', path: '/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-360-pazarlama-yonetimi' },
    { icon: HiTruck, title: 'Filo Kiralama Firmaları İçin 360 Pazarlama Yönetimi', desc: 'Kurumsal mobilite ve filo çözümleri', path: '/sektorel-hizmetler/filo-kiralama-firmalari-360-pazarlama-yonetimi' },
    { icon: HiWrench, title: 'Üretim Sektörü Firmaları İçin 360 Pazarlama Yönetimi', desc: 'Endüstriyel ve üretim odaklı çözümler', path: '/sektorel-hizmetler/uretim-sektoru-firmalari-360-pazarlama-yonetimi' }
]

export default function Header() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [currentMenu, setCurrentMenu] = useState<'main' | 'services' | 'sectoral' | 'trainings' | 'products'>('main')
    const [scrolled, setScrolled] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const { isAuthenticated } = useAuth()
    const location = useLocation()
    const isHome = location.pathname === '/'

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setIsOpen(false)
        setActiveDropdown(null)
        setCurrentMenu('main')
    }, [location])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    const toggleMenu = () => {
        setIsOpen(!isOpen)
        if (!isOpen) setCurrentMenu('main')
    }

    return (
        <header className={`header ${scrolled ? 'scrolled' : ''} ${isHome ? 'is-home' : ''}`}>
            <div className="container header-container">
                <div className="logo">
                    <Link to="/">
                        <img src="/fast-logo-big.svg" alt="Khilonfast" />
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="nav-desktop desktop-only">
                    <div className="nav-item">
                        <button className="nav-link dropdown-toggle" onMouseEnter={() => setActiveDropdown('services')}>
                            Hizmetlerimiz <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu compact ${activeDropdown === 'services' ? 'show' : ''}`} onMouseLeave={() => setActiveDropdown(null)}>
                            <div className="mega-menu-grid">
                                {services.map((s, i) => (
                                    <Link key={i} to={s.path} className="mega-menu-item" onClick={() => setActiveDropdown(null)}>
                                        <div className="mega-icon-box"><s.icon /></div>
                                        <div className="mega-content">
                                            <h4 className="mega-title">{s.title}</h4>
                                            <p className="mega-desc">{s.desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="nav-item">
                        <button className="nav-link dropdown-toggle" onMouseEnter={() => setActiveDropdown('sectoral')}>
                            Sektörel <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu compact sectoral ${activeDropdown === 'sectoral' ? 'show' : ''}`} onMouseLeave={() => setActiveDropdown(null)}>
                            <div className="mega-menu-grid">
                                {sectoralServices.map((s, i) => (
                                    <Link key={i} to={s.path} className="mega-menu-item" onClick={() => setActiveDropdown(null)}>
                                        <div className="mega-icon-box"><s.icon /></div>
                                        <div className="mega-content">
                                            <h4 className="mega-title">{s.title}</h4>
                                            <p className="mega-desc">{s.desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="nav-item">
                        <button className="nav-link dropdown-toggle" onMouseEnter={() => setActiveDropdown('trainings')}>
                            Eğitimler <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu compact sectoral ${activeDropdown === 'trainings' ? 'show' : ''}`} onMouseLeave={() => setActiveDropdown(null)}>
                            <div className="mega-menu-grid">
                                <Link to="/egitimler" className="mega-menu-item" onClick={() => setActiveDropdown(null)}>
                                    <div className="mega-icon-box"><HiAcademicCap /></div>
                                    <div className="mega-content">
                                        <h4 className="mega-title">Tüm Eğitimler</h4>
                                        <p className="mega-desc">Program listesini tek ekranda görüntüleyin</p>
                                    </div>
                                </Link>
                                {trainingPrograms.slice(0, 8).map((t) => (
                                    <Link key={t.path} to={t.path} className="mega-menu-item" onClick={() => setActiveDropdown(null)}>
                                        <div className="mega-icon-box"><HiAcademicCap /></div>
                                        <div className="mega-content">
                                            <h4 className="mega-title">{t.title}</h4>
                                            <p className="mega-desc">{t.summary}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="nav-item">
                        <button className="nav-link dropdown-toggle" onMouseEnter={() => setActiveDropdown('products')}>
                            Ürünler <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu compact ${activeDropdown === 'products' ? 'show' : ''}`} onMouseLeave={() => setActiveDropdown(null)}>
                            <div className="mega-menu-grid">
                                {productPrograms.map((product) => (
                                    <Link key={product.path} to={product.path} className="mega-menu-item" onClick={() => setActiveDropdown(null)}>
                                        <div className="mega-icon-box">{product.title.includes('Eye') ? <HiOutlineEye /> : <HiBolt />}</div>
                                        <div className="mega-content">
                                            <h4 className="mega-title">{product.title}</h4>
                                            <p className="mega-desc">{product.summary}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Link to="/hakkimizda" className="nav-link">Hakkımızda</Link>
                    <Link to="/#contact" className="nav-link">İletişim</Link>
                </nav>

                <div className="header-actions">
                    <div className="lang-switch">
                        <span className="active">TR</span>
                        <span className="divider">|</span>
                        <span>EN</span>
                    </div>
                    <UserIcon />
                    <CartIcon onClick={() => setCartOpen(true)} />
                    {!isAuthenticated && (
                        <Link to="/register" className="btn btn-primary desktop-only">Hemen Başlayın</Link>
                    )}
                    <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
                        {isOpen ? <HiX /> : <HiMenu />}
                    </button>
                </div>
            </div>

            {/* Complete New Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}>
                <div className="mobile-menu-header">
                    <div className="logo">
                        <img src="/fast-logo-big.svg" alt="Khilonfast" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <button className="menu-close" onClick={() => setIsOpen(false)}>
                        <HiX />
                    </button>
                </div>

                <div className={`mobile-menu-viewport ${currentMenu}`}>
                    {/* Main Menu */}
                    <div className="mobile-menu-page main">
                        <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('services')}>
                            Hizmetlerimiz <HiChevronRight />
                        </button>
                        <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('sectoral')}>
                            Sektörel Hizmetler <HiChevronRight />
                        </button>
                        <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('trainings')}>
                            Eğitimler <HiChevronRight />
                        </button>
                        <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('products')}>
                            Ürünler <HiChevronRight />
                        </button>
                        <Link to="/hakkimizda" className="mobile-link">Hakkımızda</Link>
                        <Link to="/#contact" className="mobile-link">İletişim</Link>

                        <div className="mobile-menu-footer">
                            {!isAuthenticated && (
                                <Link to="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>Hemen Başlayın</Link>
                            )}
                        </div>
                    </div>

                    {/* Services Sub-Menu */}
                    <div className="mobile-menu-page sub">
                        <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                            <HiArrowLeft /> Geri: Menü
                        </button>
                        <h3 className="mobile-submenu-title">Hizmetlerimiz</h3>
                        <div className="mobile-submenu-list">
                            {services.map((s, i) => (
                                <Link key={i} to={s.path} className="mobile-sub-item" onClick={() => setIsOpen(false)}>
                                    <div className="sub-icon"><s.icon /></div>
                                    <span>{s.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Sectoral Sub-Menu */}
                    <div className="mobile-menu-page sub">
                        <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                            <HiArrowLeft /> Geri: Menü
                        </button>
                        <h3 className="mobile-submenu-title">Sektörel Hizmetler</h3>
                        <div className="mobile-submenu-list">
                            {sectoralServices.map((s, i) => (
                                <Link key={i} to={s.path} className="mobile-sub-item" onClick={() => setIsOpen(false)}>
                                    <div className="sub-icon"><s.icon /></div>
                                    <span>{s.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Trainings Sub-Menu */}
                    <div className="mobile-menu-page sub">
                        <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                            <HiArrowLeft /> Geri: Menü
                        </button>
                        <h3 className="mobile-submenu-title">Eğitimler</h3>
                        <div className="mobile-submenu-list">
                            <Link to="/egitimler" className="mobile-sub-item" onClick={() => setIsOpen(false)}>
                                <div className="sub-icon"><HiAcademicCap /></div>
                                <span>Tüm Eğitimler</span>
                            </Link>
                            {trainingPrograms.map((t) => (
                                <Link key={t.path} to={t.path} className="mobile-sub-item" onClick={() => setIsOpen(false)}>
                                    <div className="sub-icon"><HiAcademicCap /></div>
                                    <span>{t.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Products Sub-Menu */}
                    <div className="mobile-menu-page sub">
                        <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                            <HiArrowLeft /> Geri: Menü
                        </button>
                        <h3 className="mobile-submenu-title">Ürünler</h3>
                        <div className="mobile-submenu-list">
                            {productPrograms.map((product) => (
                                <Link key={product.path} to={product.path} className="mobile-sub-item" onClick={() => setIsOpen(false)}>
                                    <div className="sub-icon">{product.title.includes('Eye') ? <HiOutlineEye /> : <HiBolt />}</div>
                                    <span>{product.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </header>
    )
}
