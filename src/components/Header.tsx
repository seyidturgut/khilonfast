import { useState, useRef, useEffect } from 'react'
import { HiMenu, HiX, HiChevronDown } from 'react-icons/hi'
import {
    HiRocketLaunch,
    HiDocumentText,
    HiPresentationChartLine,
    HiCursorArrowRays,
    HiShare,
    HiMagnifyingGlass,
    HiPencilSquare,
    HiEnvelope
} from 'react-icons/hi2'
import './Header.css'

const services = [
    { icon: HiRocketLaunch, title: 'Go To Market Stratejisi', desc: 'Pazara giriş ve büyüme planları' },
    { icon: HiDocumentText, title: 'İçerik Stratejisi', desc: 'Marka hikayenizi güçlendiren içerikler' },
    { icon: HiPresentationChartLine, title: 'Bütünleşik Dijital Pazarlama', desc: '360 derece pazarlama çözümleri' },
    { icon: HiCursorArrowRays, title: 'Google Ads', desc: 'Performans odaklı reklam yönetimi' },
    { icon: HiShare, title: 'Sosyal Medya Reklamcılığı', desc: 'Hedef kitle etkileşimini artırın' },
    { icon: HiMagnifyingGlass, title: 'SEO', desc: 'Arama motorlarında üst sıralara çıkın' },
    { icon: HiPencilSquare, title: 'İçerik Üretimi', desc: 'Etkileyici ve özgün içerik üretimi' },
    { icon: HiEnvelope, title: 'B2B Email Pazarlama', desc: 'Profesyonel e-posta kampanyaları' }
]

export default function Header() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [scrolled, setScrolled] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null)
            }
        }

        window.addEventListener('scroll', handleScroll)
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const toggleMenu = () => {
        setIsOpen(!isOpen)
        if (!isOpen) setActiveDropdown(null)
    }

    const toggleDropdown = (name: string) => {
        setActiveDropdown(activeDropdown === name ? null : name)
    }

    return (
        <header className={`header ${scrolled ? 'scrolled' : ''}`}>
            <div className="container header-container">
                <div className="logo">
                    <img src="/fast-logo-big.svg" alt="Khilonfast" />
                </div>

                <nav className={`nav-menu ${isOpen ? 'active' : ''}`}>
                    <div className={`nav-item ${activeDropdown === 'services' ? 'active' : ''}`} ref={dropdownRef}>
                        <button
                            className="nav-link dropdown-toggle"
                            onClick={() => toggleDropdown('services')}
                            onMouseEnter={() => window.innerWidth > 968 && setActiveDropdown('services')}
                        >
                            Hizmetlerimiz <HiChevronDown className="dropdown-icon" />
                        </button>

                        <div className={`mega-menu ${activeDropdown === 'services' ? 'show' : ''}`} onMouseLeave={() => window.innerWidth > 968 && setActiveDropdown(null)}>
                            <div className="mega-menu-grid">
                                {services.map((service, index) => {
                                    const Icon = service.icon
                                    return (
                                        <a href="#services" key={index} className="mega-menu-item">
                                            <div className="mega-icon-box">
                                                <Icon />
                                            </div>
                                            <div className="mega-content">
                                                <h4 className="mega-title">{service.title}</h4>
                                                <p className="mega-desc">{service.desc}</p>
                                            </div>
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <a href="#solutions" className="nav-link">Çözümlerimiz</a>
                    <a href="#about" className="nav-link">Hakkımızda</a>
                    <a href="#references" className="nav-link">Referanslar</a>
                    <a href="#contact" className="nav-link">İletişim</a>

                    <button className="btn btn-primary mobile-only">
                        Hemen Başlayın
                    </button>
                </nav>

                <div className="header-actions">
                    <div className="lang-switch">
                        <span className="active">TR</span>
                        <span className="divider">|</span>
                        <span>EN</span>
                    </div>
                    <button className="btn btn-primary desktop-only">
                        Hemen Başlayın
                    </button>
                    <button className="menu-toggle" onClick={toggleMenu}>
                        {isOpen ? <HiX /> : <HiMenu />}
                    </button>
                </div>
            </div>
        </header>
    )
}
