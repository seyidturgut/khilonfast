import { useState, ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Breadcrumbs from '../../components/Breadcrumbs'
import FAQ from '../../components/FAQ'
import { useCart } from '../../context/CartContext'
import { HiCheck } from 'react-icons/hi2'
import './SectoralSolutionTemplate.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface TabConfig {
    id: string;
    label: string;
    icon: ReactNode;
    content: ReactNode;
}

export interface SectoralSolutionProps {
    hero: {
        title: string;
        subtitle: string;
        description: string;
        buttonText: string;
        buttonLink: string;
        image: string;
        videoUrl?: string;
        imageClassName?: string;
        imageContainerClassName?: string;
        hideBadge?: boolean;
        disableBadgeAnimation?: boolean;
        badgeText: string;
        badgeIcon: ReactNode;
        themeColor?: string;
    };
    breadcrumbs: { label: string; path?: string }[];
    videoShowcase: {
        tag: string;
        title: ReactNode;
        description: string;
        vimeoUrl: string;
    };
    tabsSection: {
        tag: string;
        title: string;
        description1: string;
        description2: string;
        tabs: TabConfig[];
    };
    testimonial: {
        quote: string;
        author: string;
        role: string;
    };
    processVideo: {
        vimeoUrl: string;
    };
    faqs?: {
        question: string;
        answer: string;
    }[];
    growthCTA?: {
        title: string;
        description: string;
    };
    serviceKey?: string;
}

export default function SectoralSolutionTemplate(props: SectoralSolutionProps) {
    const { i18n, t } = useTranslation('common');
    const currentLang = i18n.language.split('-')[0];
    const [activeTab, setActiveTab] = useState(props.tabsSection.tabs[0].id)
    const { addToCart } = useCart();
    const [dynamicPackages, setDynamicPackages] = useState<any[]>([]);
    const [dynamicHero, setDynamicHero] = useState(props.hero);

    const resolveHeroVideoUrl = (rawValue?: string | null) => {
        const value = String(rawValue || '').trim();
        if (!value) return null;

        if (/^https?:\/\//i.test(value)) {
            const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
            if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
            return value;
        }

        const idMatch = value.match(/(\d{6,})/);
        if (!idMatch?.[1]) return null;
        return `https://player.vimeo.com/video/${idMatch[1]}`;
    };

    useEffect(() => {
        setDynamicHero(props.hero);
        setDynamicPackages([]);
    }, [i18n.language, props.serviceKey]);

    useEffect(() => {
        if (props.serviceKey) {
            const fetchPackages = async () => {
                try {
                    const fetchByLang = async (lang: string) => {
                        const res = await fetch(`${API_BASE}/products/key/${props.serviceKey}?lang=${lang}`);
                        if (!res.ok) return null;
                        const data = await res.json();
                        return data?.product || null;
                    };

                    // Primary: current locale. Fallback: TR for admin-controlled package/price continuity.
                    const primaryProduct = await fetchByLang(currentLang);
                    const product =
                        primaryProduct && Array.isArray(primaryProduct.packages) && primaryProduct.packages.length > 0
                            ? primaryProduct
                            : await fetchByLang('tr');

                    if (product) {
                        setDynamicHero(prev => ({
                            ...prev,
                            title: product.name || prev.title,
                            description: product.description || prev.description,
                            image: product.hero_image || prev.image,
                            videoUrl: resolveHeroVideoUrl(product.hero_vimeo_id) || prev.videoUrl
                        }));

                        if (Array.isArray(product.packages) && product.packages.length > 0) {
                            const packages = product.packages.map((pkg: any) => ({
                                id: pkg.product_key,
                                fullName: pkg.name,
                                name: pkg.name.includes('-') ? pkg.name.split('-').pop()?.trim() : pkg.name,
                                price: new Intl.NumberFormat(currentLang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: pkg.currency, maximumFractionDigits: 0 }).format(pkg.price) + '*',
                                description: pkg.description || '',
                                features: pkg.features ? pkg.features.split('\n') : [],
                                isPopular: pkg.product_key.includes('growth') || pkg.product_key.includes('ultimate')
                            }));
                            setDynamicPackages(packages);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch sectoral packages:", err);
                }
            };
            fetchPackages();
        }
    }, [props.serviceKey, i18n.language]);

    const handleAddToCart = (pkg: any) => {
        const priceStr = pkg.price.replace(/[^0-9,]/g, '');
        const priceNum = parseFloat(priceStr.replace(',', '.'));

        addToCart({
            id: pkg.id,
            product_id: 0,
            product_key: pkg.id,
            name: pkg.fullName || pkg.name,
            description: pkg.description,
            price: priceNum,
            currency: pkg.price.includes('$') ? 'USD' : 'TRY'
        });
    };

    const renderActiveTabContent = () => {
        const tab = props.tabsSection.tabs.find(t => t.id === activeTab)
        if (!tab) return null;

        if (tab.id === 'packages' && props.serviceKey && dynamicPackages.length > 0) {
            return (
                <div className="sectoral-tabs-content">
                    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '1.4rem', color: '#1a3a52', marginBottom: '8px' }}>
                            {currentLang === 'en' ? 'Build Your Full-Stack Marketing Team' : 'Tam Donanımlı Pazarlama Takımınızı Kurun'}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '700px', margin: '0 auto' }}>
                            {props.tabsSection.description1}
                        </p>
                    </div>
                    <div className="tab-grid grid-cols-3">
                        {dynamicPackages.map((pkg) => (
                            <div key={pkg.id} className="sectoral-card" style={{
                                border: pkg.isPopular ? '1px solid #1a3a52' : '1px solid #eef2d0',
                                transform: pkg.isPopular ? 'scale(1.02)' : 'none',
                                position: 'relative',
                                zIndex: pkg.isPopular ? '2' : '1'
                            }}>
                                <h3>{pkg.name}</h3>
                                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a3a52', margin: '10px 0' }}>{pkg.price}</p>
                                <p style={{ fontSize: '0.85rem' }}>{pkg.description}</p>
                                <ul className="sectoral-features" style={{ fontSize: '0.82rem' }}>
                                    {pkg.features.map((f: string, i: number) => (
                                        <li key={i}><HiCheck /> {f}</li>
                                    ))}
                                </ul>
                                <div style={{ marginTop: 'auto' }}>
                                    <button
                                        onClick={() => handleAddToCart(pkg)}
                                        className="sectoral-btn"
                                        style={{ width: '100%', padding: '12px', border: 'none', cursor: 'pointer' }}
                                    >
                                        {t('pricing.buyNow')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (tab.id === 'packages' && props.serviceKey && dynamicPackages.length === 0) {
            return (
                <div className="sectoral-tabs-content">
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.25rem', color: '#1a3a52' }}>
                            {currentLang === 'en' ? 'Packages are being prepared.' : 'Paketler hazirlaniyor.'}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                            {currentLang === 'en'
                                ? 'Please refresh in a moment or continue with the available solution tabs.'
                                : 'Lutfen kisa bir sure sonra tekrar deneyin veya diger cozum sekmelerini inceleyin.'}
                        </p>
                    </div>
                </div>
            );
        }

        return tab.content;
    }

    return (
        <div className="page-container sectoral-page service-template-page">
            <section className="sectoral-hero">
                <Breadcrumbs items={props.breadcrumbs} />
                <div className="container service-hero-container">
                    <div className="service-hero-grid">
                        <div className="service-hero-text">
                            <h1 className="service-title">{dynamicHero.title}</h1>
                            <h2 className="service-subtitle">{dynamicHero.subtitle}</h2>
                            <p className="service-description">{dynamicHero.description}</p>
                            <div className="service-hero-actions">
                                <a href={dynamicHero.buttonLink} className="btn btn-white">{dynamicHero.buttonText}</a>
                            </div>
                        </div>

                        <div className="service-hero-visual">
                            <div className={`hero-image-container ${dynamicHero.hideBadge ? 'no-badge' : ''} ${dynamicHero.imageContainerClassName || ''}`}>
                                {dynamicHero.videoUrl ? (
                                    <iframe
                                        src={dynamicHero.videoUrl}
                                        title={dynamicHero.title}
                                        className="hero-main-video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                ) : (
                                    <img src={dynamicHero.image} alt={dynamicHero.title} className={`hero-main-img ${dynamicHero.hideBadge ? 'no-badge-image' : ''} ${dynamicHero.imageClassName || ''}`} />
                                )}
                                {!dynamicHero.hideBadge && (
                                    <div className="circular-badge">
                                        <div className={`badge-text-wrapper ${dynamicHero.disableBadgeAnimation ? 'no-animation' : ''}`}>
                                            <svg viewBox="0 0 100 100" className="badge-svg">
                                                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                                                <text className="badge-text">
                                                    <textPath xlinkHref="#circlePath">
                                                        {dynamicHero.badgeText}
                                                    </textPath>
                                                </text>
                                            </svg>
                                        </div>
                                        <div className="badge-icon">{dynamicHero.badgeIcon}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="video-showcase">
                <div className="container">
                    <div className="showcase-grid">
                        <div className="showcase-info">
                            <div className="showcase-tag">{props.videoShowcase.tag}</div>
                            <h2 className="showcase-title">{props.videoShowcase.title}</h2>
                            <p className="showcase-description">{props.videoShowcase.description}</p>
                        </div>
                        <div className="showcase-video">
                            <div className="video-glass-wrapper">
                                <div className="video-container">
                                    <iframe
                                        src={props.videoShowcase.vimeoUrl}
                                        title="Showcase Video"
                                        width="100%"
                                        height="100%"
                                        className="video-iframe"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="sectoral-tabs-section" id="pricing">
                <div className="container">
                    <div className="pricing-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
                        <span className="showcase-tag" style={{ display: 'inline-block', marginBottom: '10px' }}>{props.tabsSection.tag}</span>
                        <h2 className="pricing-title" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1a3a52', marginBottom: '20px' }}>
                            {props.tabsSection.title}
                        </h2>
                        <p className="pricing-description" style={{ fontSize: '1.15rem', color: '#4b5563', maxWidth: '800px', margin: '0 auto 15px' }}>
                            {props.tabsSection.description1}
                        </p>
                        <p className="pricing-description" style={{ fontSize: '1.15rem', color: '#4b5563', maxWidth: '800px', margin: '0 auto' }}>
                            {props.tabsSection.description2}
                        </p>
                    </div>

                    {/* Desktop Layout: Grid Navigation + Content Area */}
                    <div className="sectoral-desktop-view">
                        <div className="sectoral-nav-grid-container">
                            <div className="sectoral-nav-grid">
                                {props.tabsSection.tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`sectoral-nav-card ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <div className="nav-card-icon">{tab.icon}</div>
                                        <span className="nav-card-label">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="sectoral-content-area" key={activeTab}>
                            {renderActiveTabContent()}
                        </div>
                    </div>

                    {/* Mobile Layout: Accordion */}
                    <div className="sectoral-mobile-view">
                        <div className="sectoral-accordion">
                            {props.tabsSection.tabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    className={`sectoral-accordion-item ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    <button
                                        className="sectoral-accordion-header"
                                        onClick={() => setActiveTab(activeTab === tab.id ? '' : tab.id)}
                                    >
                                        <div className="header-info">
                                            <span className="header-icon">{tab.icon}</span>
                                            <span className="header-label">{tab.label}</span>
                                        </div>
                                        <span className="header-arrow">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </span>
                                    </button>
                                    <div className="sectoral-accordion-content">
                                        <div className="accordion-content-inner">
                                            {tab.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="sectoral-testimonial-section">
                <div className="container">
                    <div className="sectoral-testimonial">
                        <p className="sectoral-testimonial-text">
                            "{props.testimonial.quote}"
                        </p>
                        <div className="testimonial-author">
                            <div className="author-meta">
                                <h5>{props.testimonial.author}</h5>
                                <span>{props.testimonial.role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="sectoral-process-video-section">
                <div className="container">
                    <div className="sectoral-process-video-wrapper">
                        <iframe
                            src={props.processVideo.vimeoUrl}
                            allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                            allowFullScreen
                            title="Process Video"
                        ></iframe>
                    </div>
                </div>
            </section>

            {props.faqs && (
                <FAQ items={props.faqs} />
            )}

            {props.growthCTA && (
                <section className="growth-cta sectoral-growth-cta">
                    <div className="container">
                        <div className="growth-cta-content">
                            <h2 className="growth-cta-title">{props.growthCTA.title}</h2>
                            <p className="growth-cta-description">{props.growthCTA.description}</p>
                        </div>
                        <div className="pattern-overlay"></div>
                    </div>
                </section>
            )}
        </div>
    )
}
