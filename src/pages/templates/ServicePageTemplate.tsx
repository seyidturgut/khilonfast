import { ReactNode, useEffect, useRef, useState } from 'react'
import { useCart } from '../../context/CartContext'
import Cart from '../../components/Cart'
import Breadcrumbs from '../../components/Breadcrumbs'
import FAQ from '../../components/FAQ'
import './ServicePageTemplate.css'

export interface PricingPackage {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: (string | ReactNode)[];
    isPopular?: boolean;
    buttonText?: string;
    buttonLink?: string;
    icon?: ReactNode;
    details?: {
        title: string;
        description: string;
        icon?: ReactNode;
    }[];
}

export interface ServiceFeature {
    title: string;
    description: string;
    icon?: ReactNode;
}

export interface ComparisonRow {
    feature: string;
    values: (string | boolean | ReactNode)[];
    isSectionHeader?: boolean;
}

export interface ComparisonTable {
    headers: {
        title: string;
        icon?: ReactNode;
    }[];
    rows: ComparisonRow[];
    note?: string;
}

export interface ProcessStep {
    title: string;
    description: string | ReactNode;
    icon: ReactNode;
    stepNumber: number;
}

export interface ProcessSection {
    tag: string;
    title: string;
    description: string;
    steps: ProcessStep[];
    videoUrl?: string;
}

export interface ApproachItem {
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
}

export interface ApproachSection {
    tag?: string;
    title?: string;
    description?: string;
    items: ApproachItem[];
}


export interface AuthorizationCard {
    title: string;
    description: string;
    highlightText: string;
    buttonText: string;
    buttonLink?: string;
    theme: 'light' | 'dark';
}

export interface AuthorizationSection {
    title: string;
    description: string;
    cards: AuthorizationCard[];
}

export interface ServicePageProps {
    hero: {
        title: string;
        subtitle: string | ReactNode;
        description: string;
        buttonText: string;
        buttonLink: string;
        image: string;
        videoUrl?: string;
        hideBadge?: boolean;
        badgeText: string;
        badgeIcon: ReactNode;
        themeColor?: string;
    };
    breadcrumbs: { label: string; path?: string }[];
    videoShowcase: {
        tag: string;
        title: ReactNode;
        description: string;
        videoUrl: string; // Generic video URL (vimeo or youtube)
    };
    featuresSection?: {
        tag: string;
        title: string;
        description: string;
        features: ServiceFeature[];
    };
    pricingSection: {
        tag: string;
        title: string;
        description: string;
        packages: PricingPackage[];
    };
    comparisonTable?: ComparisonTable;
    processSection?: ProcessSection;
    authorizationSection?: AuthorizationSection;
    approachSection?: ApproachSection;
    testimonial: {
        quote: string;
        author: string;
        role: string;
    };
    faqs?: {
        question: string;
        answer: string;
        features?: string[]; // Optional specific feature list for FAQ
    }[];
    growthCTA?: {
        title: string;
        description: string;
        features?: string[];
    };
}

export default function ServicePageTemplate(props: ServicePageProps) {
    const { addToCart } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Handle add to cart
    const handleAddToCart = (pkg: PricingPackage) => {
        if (pkg.id && pkg.name && pkg.price) {
            // Map frontend package IDs to database product_keys
            const productKeyMap: Record<string, string> = {
                'core': 'gtm-core',
                'growth': 'gtm-growth',
                'ultimate': 'gtm-ultimate',
                'training': 'b2b-training'
            };

            const productKey = productKeyMap[pkg.id] || pkg.id;

            // Parse price correctly - remove all non-numeric characters except comma
            // Turkish format: $9.900 means 9900, $14.900 means 14900
            const priceStr = pkg.price.replace(/[^0-9,]/g, ''); // Remove $, *, dots, spaces
            const priceNum = parseFloat(priceStr.replace(',', '.')); // Convert comma to dot for decimal

            addToCart({
                id: pkg.id,
                product_id: 0, // Will be mapped by backend using product_key
                product_key: productKey, // Use mapped product key
                name: pkg.name,
                description: pkg.description,
                price: priceNum,
                currency: pkg.price.includes('$') ? 'USD' : 'TRY'
            });

            // Auto-open cart after adding
            setIsCartOpen(true);
        }
    };

    // Horizontal Scroll Animation Logic
    const processRef = useRef<HTMLElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!processRef.current || !scrollContainerRef.current) return;

            const section = processRef.current;
            const container = scrollContainerRef.current;

            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const windowScroll = window.scrollY;
            const windowHeight = window.innerHeight;

            // Calculate start and end points of the sticky section
            const start = sectionTop;
            const end = sectionTop + sectionHeight - windowHeight;

            // Check if within the scroll area
            if (windowScroll >= start && windowScroll <= end) {
                const progress = (windowScroll - start) / (end - start);
                // Move the container horizontally
                // Max scroll is container width - window width
                const maxScroll = container.scrollWidth - window.innerWidth;
                const translateX = Math.max(0, Math.min(progress * maxScroll, maxScroll));

                container.style.transform = `translateX(-${translateX}px)`;
            } else if (windowScroll < start) {
                container.style.transform = `translateX(0px)`;
            } else if (windowScroll > end) {
                const maxScroll = container.scrollWidth - window.innerWidth;
                container.style.transform = `translateX(-${maxScroll}px)`;
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Initial call
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [props.processSection]);

    return (
        <div className="page-container service-template-page">
            <section className="service-hero">
                <Breadcrumbs items={props.breadcrumbs} />
                <div className="container service-hero-container">
                    <div className="service-hero-grid">
                        <div className="service-hero-text">
                            <h1 className="service-title">{props.hero.title}</h1>
                            <h2 className="service-subtitle">{props.hero.subtitle}</h2>
                            <p className="service-description">{props.hero.description}</p>
                            <div className="service-hero-actions">
                                <a href={props.hero.buttonLink} className="btn-service-primary">{props.hero.buttonText}</a>
                            </div>
                        </div>
                        <div className="service-hero-visual">
                            <div className="hero-image-container">
                                {props.hero.videoUrl ? (
                                    <iframe
                                        src={props.hero.videoUrl}
                                        title={props.hero.title}
                                        className="hero-main-video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                ) : (
                                    <img src={props.hero.image} alt={props.hero.title} className="hero-main-img" />
                                )}
                                {!props.hero.hideBadge && (
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
                                        src={props.videoShowcase.videoUrl}
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

            {
                props.featuresSection && (
                    <section className="service-features-linear">
                        <div className="container">
                            <div className="section-header text-center">
                                <span className="showcase-tag">{props.featuresSection.tag}</span>
                                <h2 className="section-title-large">{props.featuresSection.title}</h2>
                                <p className="section-desc-mid">{props.featuresSection.description}</p>
                            </div>

                            <div className="features-grid-linear">
                                {props.featuresSection.features.map((feature, idx) => (
                                    <div key={idx} className="feature-card-linear">
                                        <div className="feature-icon-box">{feature.icon}</div>
                                        <div className="feature-content-box">
                                            <h3>{feature.title}</h3>
                                            <p>{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {/* Split Layout: Single Pricing + Comparison Table Side-by-Side */}
            {props.pricingSection.packages.length === 1 && props.comparisonTable ? (
                <section className="service-pricing-split" id="pricing">
                    <div className="container">
                        <div className="section-header text-center">
                            <span className="showcase-tag">{props.pricingSection.tag}</span>
                            <h2 className="section-title-large">{props.pricingSection.title}</h2>
                            <p className="section-desc-mid">{props.pricingSection.description}</p>
                        </div>

                        <div className="split-layout-grid">
                            {/* Left: Single Layout Pricing Card */}
                            <div className="split-pricing-col">
                                {props.pricingSection.packages.map((pkg) => (
                                    <div key={pkg.id} className={`pricing-card-linear ${pkg.isPopular ? 'popular' : ''} single-mode`}>
                                        {pkg.isPopular && <div className="popular-badge">En Çok Tercih Edilen</div>}
                                        <div className="card-header">
                                            <div className="pkg-icon">{pkg.icon}</div>
                                            <h3 className="pkg-name">{pkg.name}</h3>
                                            <div className="pkg-price-wrap">
                                                <span className="pkg-price">{pkg.price}</span>
                                                <span className="pkg-period">/{pkg.period}</span>
                                            </div>
                                            <p className="pkg-desc">{pkg.description}</p>
                                        </div>
                                        <div className="card-body">
                                            <ul className="pkg-features">
                                                {pkg.features.map((f, i) => (
                                                    <li key={i}>
                                                        <svg viewBox="0 0 20 20" fill="currentColor" className="check-icon">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="card-footer">
                                            <button
                                                onClick={() => handleAddToCart(pkg)}
                                                className={`btn-pkg ${pkg.isPopular ? 'btn-pkg-primary' : 'btn-pkg-outline'}`}
                                            >
                                                {pkg.buttonText || 'Sepete Ekle'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right: Table */}
                            <div className="split-table-col">
                                <div className="comparison-table-wrapper single-mode">
                                    <table className="comparison-table">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                {props.comparisonTable.headers.map((header, idx) => (
                                                    <th key={idx}>
                                                        <div className="th-content">
                                                            {header.icon && <span className="th-icon">{header.icon}</span>}
                                                            {header.title}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {props.comparisonTable.rows.map((row, idx) => (
                                                <tr key={idx} className={row.isSectionHeader ? 'comparison-section-row' : ''}>
                                                    {row.isSectionHeader ? (
                                                        <td colSpan={props.comparisonTable!.headers.length + 1} className="comparison-section-header">
                                                            {row.feature}
                                                        </td>
                                                    ) : (
                                                        <>
                                                            <td className="feature-name">{row.feature}</td>
                                                            {row.values.map((val, vIdx) => (
                                                                <td key={vIdx}>
                                                                    {val === true ? (
                                                                        <svg viewBox="0 0 20 20" fill="currentColor" className="check-icon-table">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    ) : val === false || val === '-' ? (
                                                                        <span className="dash-icon">-</span>
                                                                    ) : (
                                                                        <span className="table-text">{val}</span>
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {props.comparisonTable.note && (
                                        <p className="table-note">{props.comparisonTable.note}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                /* Original Stacked Layout */
                <>
                    <section className="service-pricing-linear" id="pricing">
                        <div className="container">
                            <div className="section-header text-center">
                                <span className="showcase-tag">{props.pricingSection.tag}</span>
                                <h2 className="section-title-large">{props.pricingSection.title}</h2>
                                <p className="section-desc-mid">{props.pricingSection.description}</p>
                            </div>

                            <div className="pricing-grid-linear">
                                {props.pricingSection.packages.map((pkg) => (
                                    <div key={pkg.id} className={`pricing-card-linear ${pkg.isPopular ? 'popular' : ''}`}>
                                        {pkg.isPopular && <div className="popular-badge">En Çok Tercih Edilen</div>}
                                        <div className="card-header">
                                            <div className="pkg-icon">{pkg.icon}</div>
                                            <h3 className="pkg-name">{pkg.name}</h3>
                                            <div className="pkg-price-wrap">
                                                <span className="pkg-price">{pkg.price}</span>
                                                <span className="pkg-period">/{pkg.period}</span>
                                            </div>
                                            <p className="pkg-desc">{pkg.description}</p>
                                        </div>
                                        <div className="card-body">
                                            {pkg.details && pkg.details.length > 0 ? (
                                                <div className="pkg-details-list">
                                                    {pkg.details.map((detail, i) => (
                                                        <div key={i} className="pkg-detail-item">
                                                            <div className="pkg-detail-header">
                                                                <span className="pkg-detail-title">{detail.title}</span>
                                                            </div>
                                                            <div className="pkg-detail-content">
                                                                {detail.icon && <div className="pkg-detail-icon">{detail.icon}</div>}
                                                                <p className="pkg-detail-desc">{detail.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <ul className="pkg-features">
                                                    {pkg.features.map((f, i) => (
                                                        <li key={i}>
                                                            <svg viewBox="0 0 20 20" fill="currentColor" className="check-icon">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="card-footer">
                                            <button
                                                onClick={() => handleAddToCart(pkg)}
                                                className={`btn-pkg ${pkg.isPopular ? 'btn-pkg-primary' : 'btn-pkg-outline'}`}
                                            >
                                                {pkg.buttonText || 'Sepete Ekle'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    {
                        props.comparisonTable && (
                            <section className="service-comparison-linear">
                                <div className="container">
                                    <div className="comparison-table-wrapper">
                                        <table className="comparison-table">
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    {props.comparisonTable.headers.map((header, idx) => (
                                                        <th key={idx}>
                                                            <div className="th-content">
                                                                {header.icon && <span className="th-icon">{header.icon}</span>}
                                                                {header.title}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {props.comparisonTable.rows.map((row, idx) => (
                                                    <tr key={idx} className={row.isSectionHeader ? 'comparison-section-row' : ''}>
                                                        {row.isSectionHeader ? (
                                                            <td colSpan={props.comparisonTable!.headers.length + 1} className="comparison-section-header">
                                                                {row.feature}
                                                            </td>
                                                        ) : (
                                                            <>
                                                                <td className="feature-name">{row.feature}</td>
                                                                {row.values.map((val, vIdx) => (
                                                                    <td key={vIdx}>
                                                                        {val === true ? (
                                                                            <svg viewBox="0 0 20 20" fill="currentColor" className="check-icon-table">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        ) : val === false || val === '-' ? (
                                                                            <span className="dash-icon">-</span>
                                                                        ) : (
                                                                            <span className="table-text">{val}</span>
                                                                        )}
                                                                    </td>
                                                                ))}
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {props.comparisonTable.note && (
                                            <p className="table-note">{props.comparisonTable.note}</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )
                    }
                </>
            )}



            {
                props.processSection && (
                    <section className="service-process-sticky" ref={processRef}>
                        <div className="sticky-wrapper">
                            <div className="horizontal-scroll-container" ref={scrollContainerRef}>
                                {/* Intro Card */}
                                <div className="process-card-intro">
                                    <div className="intro-content">
                                        <span className="showcase-tag">{props.processSection.tag}</span>
                                        <h2 className="section-title-large">{props.processSection.title}</h2>
                                        <p className="section-desc-mid">{props.processSection.description}</p>
                                    </div>
                                </div>

                                {/* Steps */}
                                {props.processSection.steps.map((step, idx) => (
                                    <div key={idx} className="process-card-horizontal">
                                        <div className="step-number">{step.stepNumber}</div>
                                        <div className="process-icon-box-horizontal">
                                            {step.icon}
                                        </div>
                                        <h3 className="process-step-title">{step.title}</h3>
                                        <p className="process-step-desc">{step.description}</p>
                                    </div>
                                ))}

                                {/* Video or Final Card if needed */}
                                {props.processSection.videoUrl && (
                                    <div className="process-card-video">
                                        <div className="video-glass-wrapper">
                                            <div className="video-container">
                                                <iframe
                                                    src={props.processSection.videoUrl}
                                                    title="Process Video"
                                                    width="100%"
                                                    height="100%"
                                                    className="video-iframe"
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )
            }

            {
                props.authorizationSection && (
                    <section className="service-auth-section" id="authorization">
                        <div className="container">
                            <div className="section-header text-center">
                                <h2 className="section-title-large">{props.authorizationSection.title}</h2>
                                <p className="section-desc-mid">{props.authorizationSection.description}</p>
                            </div>

                            <div className={`auth-cards-grid ${props.authorizationSection.cards.length === 3 ? 'cols-3' : ''}`}>
                                {props.authorizationSection.cards.map((card, idx) => (
                                    <div key={idx} className={`auth-card theme-${card.theme}`}>
                                        <h3 className="auth-card-title">{card.title}</h3>
                                        <p className="auth-card-desc">{card.description}</p>
                                        <p className="auth-card-highlight">{card.highlightText}</p>
                                        <div className="auth-card-action">
                                            <a href={card.buttonLink || "/#contact"} className="btn-auth">
                                                {card.buttonText}
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            <section className="service-testimonial-linear">
                <div className="container">
                    <div className="testimonial-box-linear">
                        <div className="quote-icon">"</div>
                        <p className="quote-text">{props.testimonial.quote}</p>
                        <div className="quote-author">
                            <strong>{props.testimonial.author}</strong>
                            <span>{props.testimonial.role}</span>
                        </div>
                    </div>
                </div>
            </section>

            {
                props.approachSection && (
                    <section className="service-approach-linear">
                        <div className="container">
                            {(props.approachSection.title || props.approachSection.tag) && (
                                <div className="section-header text-center">
                                    {props.approachSection.tag && <span className="showcase-tag">{props.approachSection.tag}</span>}
                                    {props.approachSection.title && <h2 className="section-title-large">{props.approachSection.title}</h2>}
                                    {props.approachSection.description && <p className="section-desc-mid">{props.approachSection.description}</p>}
                                </div>
                            )}

                            <div className="approach-grid-linear">
                                {props.approachSection.items.map((item, idx) => (
                                    <div key={idx} className="approach-card-linear">
                                        <div className="approach-icon-box">
                                            {item.icon}
                                        </div>
                                        <div className="approach-content">
                                            <h3 className="approach-title">{item.title}</h3>
                                            <h4 className="approach-subtitle">{item.subtitle}</h4>
                                            <p className="approach-desc">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {
                props.faqs && (
                    <FAQ items={props.faqs} />
                )
            }

            {
                props.growthCTA && (
                    <section className="growth-cta service-growth-cta">
                        <div className="container">
                            <div className="growth-cta-content">
                                <h2 className="growth-cta-title">{props.growthCTA.title}</h2>
                                <p className="growth-cta-description">{props.growthCTA.description}</p>
                                <div className="growth-cta-actions">
                                    <a href="/#contact" className="btn-service-primary">Ücretsiz Danışmanlık Alın</a>
                                </div>
                            </div>
                            <div className="pattern-overlay"></div>
                        </div>
                    </section>
                )
            }

            <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    )
}
