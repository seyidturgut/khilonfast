import { useState, ReactNode } from 'react'
import Breadcrumbs from '../../components/Breadcrumbs'
import FAQ from '../../components/FAQ'
import './SectoralSolutionTemplate.css'

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
}

export default function SectoralSolutionTemplate(props: SectoralSolutionProps) {
    const [activeTab, setActiveTab] = useState(props.tabsSection.tabs[0].id)

    const renderActiveTabContent = () => {
        const tab = props.tabsSection.tabs.find(t => t.id === activeTab)
        return tab ? tab.content : null
    }

    return (
        <div className="page-container sectoral-page service-template-page">
            <section className="sectoral-hero" style={{ backgroundColor: props.hero.themeColor }}>
                <Breadcrumbs items={props.breadcrumbs} />
                <div className="container service-hero-container">
                    <div className="service-hero-grid">
                        <div className="service-hero-text">
                            <h1 className="service-title">{props.hero.title}</h1>
                            <h2 className="service-subtitle">{props.hero.subtitle}</h2>
                            <p className="service-description">{props.hero.description}</p>
                            <div className="service-hero-actions">
                                <a href={props.hero.buttonLink} className="btn btn-white">{props.hero.buttonText}</a>
                            </div>
                        </div>

                        <div className="service-hero-visual">
                            <div className="hero-image-container">
                                <img src={props.hero.image} alt={props.hero.title} className="hero-main-img" />
                                <div className="circular-badge">
                                    <div className="badge-text-wrapper">
                                        <svg viewBox="0 0 100 100" className="badge-svg">
                                            <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                                            <text className="badge-text">
                                                <textPath xlinkHref="#circlePath">
                                                    {props.hero.badgeText}
                                                </textPath>
                                            </text>
                                        </svg>
                                    </div>
                                    <div className="badge-icon">{props.hero.badgeIcon}</div>
                                </div>
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
