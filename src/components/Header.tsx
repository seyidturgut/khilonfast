import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiMenu, HiX, HiChevronDown, HiChevronRight, HiArrowLeft, HiHome } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'
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
import './Header.css'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'

export default function Header() {
    const { t, i18n } = useTranslation('common')
    const trSlugs = trCommon.slugs as Record<string, string>
    const enSlugs = enCommon.slugs as Record<string, string>
    const location = useLocation()
    const navigate = useNavigate()
    const currentLang = location.pathname.startsWith('/en') ? 'en' : 'tr'
    const langPrefix = currentLang === 'en' ? '/en' : ''
    const toLocalized = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/')

    const switchLanguagePath = (targetLang: 'tr' | 'en', pathname: string) => {
        const isEnglishPath = pathname.startsWith('/en')
        const cleanPath = pathname
            .replace(/^\/en/, '')
            .replace(/^\/+/, '')
            .replace(/\/+$/, '')

        const sourceSlugs = isEnglishPath ? enSlugs : trSlugs
        const targetSlugs = targetLang === 'en' ? enSlugs : trSlugs
        const matchedKey = Object.keys(sourceSlugs).find((k) => sourceSlugs[k] === cleanPath)

        if (matchedKey && targetSlugs[matchedKey] !== undefined) {
            const targetSlug = targetSlugs[matchedKey]
            if (!targetSlug) return targetLang === 'en' ? '/en' : '/'
            const withPrefix = `${targetLang === 'en' ? '/en' : ''}/${targetSlug}`.replace(/\/{2,}/g, '/')
            return withPrefix
        }

        if (!cleanPath) return targetLang === 'en' ? '/en' : '/'
        const dynamicPrefixMap: Record<'tr' | 'en', Array<[RegExp, string]>> = {
            tr: [
                [/^services\/?/, 'hizmetlerimiz/'],
                [/^sectoral-services\/?/, 'sektorel-hizmetler/'],
                [/^trainings\/?/, 'egitimler/'],
                [/^products\/?/, 'urunler/']
            ],
            en: [
                [/^hizmetlerimiz\/?/, 'services/'],
                [/^sektorel-hizmetler\/?/, 'sectoral-services/'],
                [/^egitimler\/?/, 'trainings/'],
                [/^urunler\/?/, 'products/']
            ]
        }

        let translatedPath = cleanPath
        for (const [pattern, replacement] of dynamicPrefixMap[targetLang]) {
            if (pattern.test(translatedPath)) {
                translatedPath = translatedPath.replace(pattern, replacement)
                break
            }
        }

        return `${targetLang === 'en' ? '/en' : ''}/${translatedPath}`.replace(/\/{2,}/g, '/')
    }

    // Define localized items inside the component to use 't'
    const services = [
        { icon: HiRocketLaunch, title: t('header.menuItems.services.gtm.title'), desc: t('header.menuItems.services.gtm.desc'), path: toLocalized('gtm') },
        { icon: HiDocumentText, title: t('header.menuItems.services.content.title'), desc: t('header.menuItems.services.content.desc'), path: toLocalized('contentStrategy') },
        { icon: HiPresentationChartLine, title: t('header.menuItems.services.integrated.title'), desc: t('header.menuItems.services.integrated.desc'), path: toLocalized('idm') },
        { icon: HiCursorArrowRays, title: t('header.menuItems.services.ads.title'), desc: t('header.menuItems.services.ads.desc'), path: toLocalized('googleAds') },
        { icon: HiShare, title: t('header.menuItems.services.social.title'), desc: t('header.menuItems.services.social.desc'), path: toLocalized('socialAds') },
        { icon: HiMagnifyingGlass, title: t('header.menuItems.services.seo.title'), desc: t('header.menuItems.services.seo.desc'), path: toLocalized('seo') },
        { icon: HiPencilSquare, title: t('header.menuItems.services.production.title'), desc: t('header.menuItems.services.production.desc'), path: toLocalized('contentProduction') },
        { icon: HiEnvelope, title: t('header.menuItems.services.email.title'), desc: t('header.menuItems.services.email.desc'), path: toLocalized('b2bEmail') }
    ]

    const sectoralServices = [
        { icon: HiBriefcase, title: t('header.menuItems.sectoral.b2b.title'), desc: t('header.menuItems.sectoral.b2b.desc'), path: toLocalized('sectoralB2B') },
        { icon: HiCreditCard, title: t('header.menuItems.sectoral.payment.title'), desc: t('header.menuItems.sectoral.payment.desc'), path: toLocalized('sectoralPayment') },
        { icon: HiRocketLaunch, title: t('header.menuItems.sectoral.food.title'), desc: t('header.menuItems.sectoral.food.desc'), path: toLocalized('sectoralFood') },
        { icon: HiPresentationChartLine, title: t('header.menuItems.sectoral.fintech.title'), desc: t('header.menuItems.sectoral.fintech.desc'), path: toLocalized('sectoralFintech') },
        { icon: HiCommandLine, title: t('header.menuItems.sectoral.tech.title'), desc: t('header.menuItems.sectoral.tech.desc'), path: toLocalized('sectoralTech') },
        { icon: HiBolt, title: t('header.menuItems.sectoral.energy.title'), desc: t('header.menuItems.sectoral.energy.desc'), path: toLocalized('sectoralEnergy') },
        { icon: HiPaintBrush, title: t('header.menuItems.sectoral.design.title'), desc: t('header.menuItems.sectoral.design.desc'), path: toLocalized('sectoralDesign') },
        { icon: HiTruck, title: t('header.menuItems.sectoral.fleet.title'), desc: t('header.menuItems.sectoral.fleet.desc'), path: toLocalized('sectoralFleet') },
        { icon: HiWrench, title: t('header.menuItems.sectoral.manufacturing.title'), desc: t('header.menuItems.sectoral.manufacturing.desc'), path: toLocalized('sectoralManufacturing') }
    ]

    const trainingMenuItems = [
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.all.title'), desc: t('header.menuItems.trainings.all.desc'), path: toLocalized('trainings') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.growth.title'), desc: t('header.menuItems.trainings.growth.desc'), path: toLocalized('trainingGrowth') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.payment.title'), desc: t('header.menuItems.trainings.payment.desc'), path: toLocalized('trainingPayment') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.b2b.title'), desc: t('header.menuItems.trainings.b2b.desc'), path: toLocalized('trainingB2B') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.fintech.title'), desc: t('header.menuItems.trainings.fintech.desc'), path: toLocalized('trainingFintech') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.tech.title'), desc: t('header.menuItems.trainings.tech.desc'), path: toLocalized('trainingTech') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.manufacturing.title'), desc: t('header.menuItems.trainings.manufacturing.desc'), path: toLocalized('trainingManufacturing') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.energy.title'), desc: t('header.menuItems.trainings.energy.desc'), path: toLocalized('trainingEnergy') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.design.title'), desc: t('header.menuItems.trainings.design.desc'), path: toLocalized('trainingDesign') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.fleet.title'), desc: t('header.menuItems.trainings.fleet.desc'), path: toLocalized('trainingFleet') },
        { icon: HiAcademicCap, title: t('header.menuItems.trainings.food.title'), desc: t('header.menuItems.trainings.food.desc'), path: toLocalized('trainingFood') }
    ]

    const productMenuItems = [
        { icon: HiBolt, title: t('header.menuItems.products.maestro.title'), desc: t('header.menuItems.products.maestro.desc'), path: toLocalized('maestro') },
        { icon: HiOutlineEye, title: t('header.menuItems.products.eyeTracking.title'), desc: t('header.menuItems.products.eyeTracking.desc'), path: toLocalized('eyeTracking') }
    ]

    const [isOpen, setIsOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [currentMenu, setCurrentMenu] = useState<'main' | 'services' | 'sectoral' | 'trainings' | 'products'>('main')
    const [scrolled, setScrolled] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const { isAuthenticated } = useAuth()
    const isHome = location.pathname === '/' || location.pathname === '/en' || location.pathname === '/en/'
    const desktopNavRef = useRef<HTMLElement | null>(null)

    const handleLanguageChange = (lang: string) => {
        const targetLang = lang === 'en' ? 'en' : 'tr'
        const newPath = switchLanguagePath(targetLang, location.pathname)
        void i18n.changeLanguage(targetLang)
        localStorage.setItem('i18nextLng', targetLang)
        navigate(`${newPath}${location.search}${location.hash}`)
    }

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const closeMobileMenu = useCallback(() => {
        setIsOpen(false)
        setCurrentMenu('main')
    }, [])

    useEffect(() => {
        closeMobileMenu()
        setActiveDropdown(null)
    }, [location, closeMobileMenu])

    useEffect(() => {
        const root = document.documentElement
        const body = document.body

        if (isOpen) {
            root.classList.add('mobile-menu-open')
            body.classList.add('mobile-menu-open')
        } else {
            root.classList.remove('mobile-menu-open')
            body.classList.remove('mobile-menu-open')
        }

        return () => {
            root.classList.remove('mobile-menu-open')
            body.classList.remove('mobile-menu-open')
        }
    }, [isOpen])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 968) {
                closeMobileMenu()
            }
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('orientationchange', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('orientationchange', handleResize)
        }
    }, [closeMobileMenu])

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            if (!activeDropdown) return
            if (window.innerWidth <= 968) return
            if (!desktopNavRef.current) return

            const target = event.target as Node
            if (!desktopNavRef.current.contains(target)) {
                setActiveDropdown(null)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActiveDropdown(null)
                closeMobileMenu()
            }
        }

        document.addEventListener('click', handleDocumentClick)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('click', handleDocumentClick)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [activeDropdown, closeMobileMenu])

    const toggleDesktopDropdown = (menu: 'services' | 'sectoral' | 'trainings' | 'products') => {
        setActiveDropdown((prev) => (prev === menu ? null : menu))
    }

    const toggleMenu = () => {
        setIsOpen((prev) => {
            const next = !prev
            if (next) setCurrentMenu('main')
            return next
        })
    }


    const renderDesktopDropdownContent = (items: Array<{ icon: any; title: string; desc: string; path: string }>) => {
        const splitIndex = Math.ceil(items.length / 2)
        const left = items.slice(0, splitIndex)
        const right = items.slice(splitIndex)

        return (
            <div className="mega-v2-layout">
                <div className="mega-v2-col">
                    {left.map((item) => (
                        <Link key={item.path} to={item.path} className="mega-v2-row" onClick={() => setActiveDropdown(null)}>
                            <div className="mega-icon-box"><item.icon /></div>
                            <div className="mega-content">
                                <span className="mega-v2-row-title">{item.title}</span>
                                <span className="mega-v2-row-desc">{item.desc}</span>
                            </div>
                            <HiChevronRight className="mega-v2-row-arrow" />
                        </Link>
                    ))}
                </div>
                <div className="mega-v2-col">
                    {right.map((item) => (
                        <Link key={item.path} to={item.path} className="mega-v2-row" onClick={() => setActiveDropdown(null)}>
                            <div className="mega-icon-box"><item.icon /></div>
                            <div className="mega-content">
                                <span className="mega-v2-row-title">{item.title}</span>
                                <span className="mega-v2-row-desc">{item.desc}</span>
                            </div>
                            <HiChevronRight className="mega-v2-row-arrow" />
                        </Link>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <header className={`header ${scrolled ? 'scrolled' : ''} ${isHome ? 'is-home' : ''}`}>
            <div className="container header-container">
                <div className="logo">
                    <Link to={currentLang === 'en' ? '/en' : '/'}>
                        <img src="/fast-logo-big.svg" alt="khilonfast" />
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav ref={desktopNavRef} className="nav-desktop desktop-only">
                    <Link to={currentLang === 'en' ? '/en' : '/'} className="nav-link nav-home-link" aria-label="Ana Sayfa">
                        <HiHome />
                    </Link>
                    <div className={`nav-item ${activeDropdown === 'services' ? 'dropdown-open' : ''}`}>
                        <button
                            className="nav-link dropdown-toggle"
                            onClick={() => toggleDesktopDropdown('services')}
                            aria-expanded={activeDropdown === 'services'}
                        >
                            {t('header.services')} <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu mega-menu-v2 ${activeDropdown === 'services' ? 'show' : ''}`}>
                            {renderDesktopDropdownContent(services)}
                        </div>
                    </div>
                    <div className={`nav-item ${activeDropdown === 'sectoral' ? 'dropdown-open' : ''}`}>
                        <button
                            className="nav-link dropdown-toggle"
                            onClick={() => toggleDesktopDropdown('sectoral')}
                            aria-expanded={activeDropdown === 'sectoral'}
                        >
                            {t('header.sectoral')} <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu mega-menu-v2 ${activeDropdown === 'sectoral' ? 'show' : ''}`}>
                            {renderDesktopDropdownContent(sectoralServices)}
                        </div>
                    </div>
                    <div className={`nav-item ${activeDropdown === 'trainings' ? 'dropdown-open' : ''}`}>
                        <button
                            className="nav-link dropdown-toggle"
                            onClick={() => toggleDesktopDropdown('trainings')}
                            aria-expanded={activeDropdown === 'trainings'}
                        >
                            {t('header.trainings')} <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu mega-menu-v2 trainings-dropdown ${activeDropdown === 'trainings' ? 'show' : ''}`}>
                            {renderDesktopDropdownContent(trainingMenuItems)}
                        </div>
                    </div>
                    <div className={`nav-item ${activeDropdown === 'products' ? 'dropdown-open' : ''}`}>
                        <button
                            className="nav-link dropdown-toggle"
                            onClick={() => toggleDesktopDropdown('products')}
                            aria-expanded={activeDropdown === 'products'}
                        >
                            {t('header.products')} <HiChevronDown className="dropdown-icon" />
                        </button>
                        <div className={`mega-menu mega-menu-v2 ${activeDropdown === 'products' ? 'show' : ''}`}>
                            {renderDesktopDropdownContent(productMenuItems)}
                        </div>
                    </div>
                    <Link to={toLocalized('about')} className="nav-link">{t('header.about')}</Link>
                    <Link to={toLocalized('contact')} className="nav-link">{t('header.contact')}</Link>
                </nav>

                <div className="header-actions">
                    <div className="lang-switch">
                        <button
                            className={currentLang === 'tr' ? 'lang-btn active' : 'lang-btn'}
                            onClick={() => handleLanguageChange('tr')}
                        >TR</button>
                        <span className="divider">|</span>
                        <button
                            className={currentLang === 'en' ? 'lang-btn active' : 'lang-btn'}
                            onClick={() => handleLanguageChange('en')}
                        >EN</button>
                    </div>
                    <UserIcon />
                    <CartIcon onClick={() => setCartOpen(true)} />
                    {!isAuthenticated && (
                        <Link to={toLocalized('howItWorks')} className="btn btn-primary desktop-only">{t('header.howItWorks')}</Link>
                    )}
                    <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
                        {isOpen ? <HiX /> : <HiMenu />}
                    </button>
                </div>
            </div>

            {/* Complete New Mobile Menu Overlay */}
            {isOpen && (
                <div className="mobile-menu-overlay active">
                    <div className="mobile-menu-header">
                        <div className="logo">
                            <img src="/fast-logo-big.svg" alt="khilonfast" style={{ filter: 'brightness(0) invert(1)' }} />
                        </div>
                        <button className="menu-close" onClick={closeMobileMenu}>
                            <HiX />
                        </button>
                    </div>

                    <div className={`mobile-menu-viewport ${currentMenu}`}>
                        {/* Main Menu */}
                        <div className="mobile-menu-page main">
                            <Link to={currentLang === 'en' ? '/en' : '/'} className="mobile-link mobile-home-link" onClick={closeMobileMenu}>
                                <HiHome /> {t('header.home')}
                            </Link>
                            <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('services')}>
                                {t('header.services')} <HiChevronRight />
                            </button>
                            <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('sectoral')}>
                                {t('header.sectoral')} <HiChevronRight />
                            </button>
                            <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('trainings')}>
                                {t('header.trainings')} <HiChevronRight />
                            </button>
                            <button className="mobile-link has-arrow" onClick={() => setCurrentMenu('products')}>
                                {t('header.products')} <HiChevronRight />
                            </button>
                            <Link to={toLocalized('about')} className="mobile-link" onClick={closeMobileMenu}>{t('header.about')}</Link>
                            <Link to={toLocalized('contact')} className="mobile-link" onClick={closeMobileMenu}>{t('header.contact')}</Link>

                            <div className="mobile-menu-footer">
                                {!isAuthenticated && (
                                    <Link to={toLocalized('howItWorks')} className="btn btn-primary" onClick={closeMobileMenu}>{t('header.howItWorks')}</Link>
                                )}
                            </div>
                        </div>

                        {/* Services Sub-Menu */}
                        <div className="mobile-menu-page sub">
                            <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                                <HiArrowLeft /> {t('header.backMenu')}
                            </button>
                            <h3 className="mobile-submenu-title">{t('header.services')}</h3>
                            <div className="mobile-submenu-list">
                                {services.map((s, i) => (
                                    <Link key={i} to={s.path} className="mobile-sub-item" onClick={closeMobileMenu}>
                                        <div className="sub-icon"><s.icon /></div>
                                        <span>{s.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Sectoral Sub-Menu */}
                        <div className="mobile-menu-page sub">
                            <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                                <HiArrowLeft /> {t('header.backMenu')}
                            </button>
                            <h3 className="mobile-submenu-title">{t('header.sectoral')}</h3>
                            <div className="mobile-submenu-list">
                                {sectoralServices.map((s, i) => (
                                    <Link key={i} to={s.path} className="mobile-sub-item" onClick={closeMobileMenu}>
                                        <div className="sub-icon"><s.icon /></div>
                                        <span>{s.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Trainings Sub-Menu */}
                        <div className="mobile-menu-page sub">
                            <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                                <HiArrowLeft /> {t('header.backMenu')}
                            </button>
                            <h3 className="mobile-submenu-title">{t('header.trainings')}</h3>
                            <div className="mobile-submenu-list">
                                <Link to={toLocalized('trainings')} className="mobile-sub-item" onClick={closeMobileMenu}>
                                    <div className="sub-icon"><HiAcademicCap /></div>
                                    <span>{t('header.allTrainings')}</span>
                                </Link>
                                {trainingMenuItems.map((item, idx) => (
                                    <Link key={idx} to={item.path} className="mobile-sub-item" onClick={closeMobileMenu}>
                                        <div className="sub-icon"><item.icon /></div>
                                        <span>{item.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Products Sub-Menu */}
                        <div className="mobile-menu-page sub">
                            <button className="mobile-back" onClick={() => setCurrentMenu('main')}>
                                <HiArrowLeft /> {t('header.backMenu')}
                            </button>
                            <h3 className="mobile-submenu-title">{t('header.products')}</h3>
                            <div className="mobile-submenu-list">
                                {productMenuItems.map((product) => (
                                    <Link key={product.path} to={product.path} className="mobile-sub-item" onClick={closeMobileMenu}>
                                        <div className="sub-icon"><product.icon /></div>
                                        <span>{product.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </header>
    )
}
