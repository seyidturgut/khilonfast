import { useState, ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
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
    const location = useLocation();
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr';
    const isCmsMode = new URLSearchParams(location.search).get('cms') === '1';
    const canShowCms = isCmsMode && typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));
    const cmsSlug = location.pathname
        .replace(/^\/en(\/|$)/, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');
    const [activeTab, setActiveTab] = useState(props.tabsSection.tabs[0].id)
    const { addToCart } = useCart();
    const [dynamicPackages, setDynamicPackages] = useState<any[]>([]);
    const [dynamicHero, setDynamicHero] = useState(props.hero);
    const [cmsPageId, setCmsPageId] = useState<number | null>(null);
    const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null);
    const [cmsContent, setCmsContent] = useState<any | null>(null);
    const [cmsEditorData, setCmsEditorData] = useState<any | null>(null);
    const [cmsSection, setCmsSection] = useState<'hero' | 'video' | 'testimonial' | 'process' | 'faqs'>('hero');
    const [activeFaqIndex, setActiveFaqIndex] = useState(0);
    const [cmsSaving, setCmsSaving] = useState(false);
    const [cmsLoading, setCmsLoading] = useState(false);
    const [cmsError, setCmsError] = useState('');

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

    const useOrFallback = (value: any, fallback: any) =>
        value !== undefined && value !== null && value !== '' ? value : fallback;
    const isInvalidCmsText = (value: any) =>
        typeof value !== 'string' || value.trim() === '' || value.trim() === '[object Object]';

    const defaultEditorData = {
        hero: {
            title: dynamicHero.title,
            subtitle: dynamicHero.subtitle,
            description: dynamicHero.description,
            image: dynamicHero.image,
            buttonText: dynamicHero.buttonText,
            buttonLink: dynamicHero.buttonLink,
            badgeText: dynamicHero.badgeText
        },
        videoShowcase: {
            tag: props.videoShowcase.tag,
            title: typeof props.videoShowcase.title === 'string' ? props.videoShowcase.title : '',
            description: props.videoShowcase.description,
            vimeoUrl: props.videoShowcase.vimeoUrl
        },
        testimonial: {
            quote: props.testimonial.quote,
            author: props.testimonial.author,
            role: props.testimonial.role
        },
        processVideo: {
            vimeoUrl: props.processVideo.vimeoUrl
        },
        faqs: (props.faqs || []).map((f) => ({ question: f.question, answer: f.answer }))
    };

    useEffect(() => {
        const activeLang = i18n.language.split('-')[0];
        if (activeLang !== currentLang) {
            i18n.changeLanguage(currentLang);
        }
    }, [currentLang, i18n]);

    useEffect(() => {
        setDynamicHero(props.hero);
        setDynamicPackages([]);
    }, [i18n.language, props.serviceKey]);

    useEffect(() => {
        const fetchPublicCms = async () => {
            if (!cmsSlug) return;
            try {
                const res = await fetch(`${API_BASE}/pages/slug/${encodeURIComponent(cmsSlug)}?lang=${currentLang}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.content && typeof data.content === 'object') {
                    const sanitized = {
                        ...data.content,
                        videoShowcase: {
                            ...(data.content.videoShowcase || {}),
                            title: isInvalidCmsText(data.content?.videoShowcase?.title) ? '' : data.content.videoShowcase.title
                        }
                    };
                    setCmsContent(sanitized);
                    if (!cmsEditorData) setCmsEditorData(sanitized);
                }
            } catch {
                // no-op
            }
        };
        fetchPublicCms();
    }, [cmsSlug, currentLang]);

    useEffect(() => {
        const fetchAdminCms = async () => {
            if (!canShowCms || !cmsSlug) return;
            const token = localStorage.getItem('token');
            if (!token) return;
            setCmsLoading(true);
            setCmsError('');
            try {
                const pagesRes = await fetch(`${API_BASE}/admin/pages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!pagesRes.ok) return;
                const pages = await pagesRes.json();
                let page = (pages || []).find((p: any) => String(p?.slug || '').replace(/^\/+/, '') === cmsSlug);
                if (!page?.id) {
                    const createRes = await fetch(`${API_BASE}/admin/pages`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: dynamicHero.title || cmsSlug,
                            slug: cmsSlug,
                            meta_title: '',
                            meta_description: ''
                        })
                    });
                    if (!createRes.ok) return;
                    const created = await createRes.json();
                    page = { id: created?.id };
                }
                setCmsPageId(Number(page.id));
                const contentRes = await fetch(`${API_BASE}/admin/pages/${page.id}/content`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!contentRes.ok) return;
                const contentData = await contentRes.json();
                let raw: any = null;
                if (contentData?.content_json && typeof contentData.content_json === 'object') {
                    raw = contentData.content_json;
                } else if (typeof contentData?.content_json === 'string') {
                    try {
                        raw = JSON.parse(contentData.content_json);
                    } catch {
                        raw = null;
                    }
                }
                if (raw && typeof raw === 'object') {
                    setCmsAllContent(raw);
                    const localized = raw[currentLang] || null;
                    if (localized) {
                        const sanitized = {
                            ...localized,
                            videoShowcase: {
                                ...(localized.videoShowcase || {}),
                                title: isInvalidCmsText(localized?.videoShowcase?.title) ? '' : localized.videoShowcase.title
                            }
                        };
                        setCmsContent(sanitized);
                        setCmsEditorData(sanitized);
                    }
                }
            } catch {
                setCmsError('Admin CMS icerigi okunamadi.');
            } finally {
                setCmsLoading(false);
            }
        };
        fetchAdminCms();
    }, [canShowCms, cmsSlug, currentLang, dynamicHero.title]);

    useEffect(() => {
        if (!canShowCms) return;
        if (!cmsEditorData) {
            setCmsEditorData(defaultEditorData);
        }
    }, [canShowCms, cmsEditorData, dynamicHero.title, currentLang]);

    useEffect(() => {
        const count = Array.isArray(cmsEditorData?.faqs) ? cmsEditorData.faqs.length : 0;
        if (count === 0) {
            setActiveFaqIndex(0);
            return;
        }
        if (activeFaqIndex > count - 1) {
            setActiveFaqIndex(count - 1);
        }
    }, [cmsEditorData?.faqs, activeFaqIndex]);

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

    const handleCmsImageUpload = async (file?: File) => {
        if (!file) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setCmsError('Upload icin admin girisi gerekli.');
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await fetch(`${API_BASE}/admin/media/upload-base64`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        dataUrl: String(reader.result || ''),
                        filename: `${cmsSlug.replace(/\//g, '-')}-${currentLang}`
                    })
                });
                if (!res.ok) return;
                const data = await res.json();
                setCmsEditorData((prev: any) => ({
                    ...(prev || defaultEditorData),
                    hero: { ...((prev || defaultEditorData).hero || {}), image: data.path || '' }
                }));
            } catch {
                setCmsError('Gorsel upload basarisiz.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCmsSave = async () => {
        if (!canShowCms || !cmsSlug || !cmsEditorData) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setCmsError('Kaydetmek icin admin girisi gerekli.');
            return;
        }
        setCmsSaving(true);
        setCmsError('');
        try {
            const nextAll = { ...(cmsAllContent || {}), [currentLang]: cmsEditorData };
            let pageId = cmsPageId;
            if (!pageId) {
                const createRes = await fetch(`${API_BASE}/admin/pages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: dynamicHero.title || cmsSlug,
                        slug: cmsSlug,
                        meta_title: '',
                        meta_description: ''
                    })
                });
                if (!createRes.ok) return;
                const created = await createRes.json();
                pageId = Number(created?.id || 0);
                setCmsPageId(pageId);
            }

            const saveRes = await fetch(`${API_BASE}/admin/pages/${pageId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content_json: nextAll, is_published: true })
            });
            if (!saveRes.ok) return;
            setCmsAllContent(nextAll);
            setCmsContent(cmsEditorData);
        } catch {
            setCmsError('Kaydetme basarisiz.');
        } finally {
            setCmsSaving(false);
        }
    };

    const displayHero = cmsContent
        ? (() => {
            const localizedCms =
                cmsContent && (cmsContent.tr || cmsContent.en)
                    ? cmsContent[currentLang]
                    : cmsContent;
            if (!localizedCms) return dynamicHero;
            return {
                ...dynamicHero,
                title: useOrFallback(localizedCms?.hero?.title, dynamicHero.title),
                subtitle: useOrFallback(localizedCms?.hero?.subtitle, dynamicHero.subtitle),
                description: useOrFallback(localizedCms?.hero?.description, dynamicHero.description),
                image: useOrFallback(localizedCms?.hero?.image, dynamicHero.image),
                buttonText: useOrFallback(localizedCms?.hero?.buttonText, dynamicHero.buttonText),
                buttonLink: useOrFallback(localizedCms?.hero?.buttonLink, dynamicHero.buttonLink),
                badgeText: useOrFallback(localizedCms?.hero?.badgeText, dynamicHero.badgeText)
            };
        })()
        : dynamicHero;

    const displayVideoShowcase = cmsContent
        ? (() => {
            const localizedCms =
                cmsContent && (cmsContent.tr || cmsContent.en)
                    ? cmsContent[currentLang]
                    : cmsContent;
            if (!localizedCms) return props.videoShowcase;
            return {
                ...props.videoShowcase,
                tag: useOrFallback(localizedCms?.videoShowcase?.tag, props.videoShowcase.tag),
                title: <>{isInvalidCmsText(localizedCms?.videoShowcase?.title) ? props.videoShowcase.title : localizedCms.videoShowcase.title}</>,
                description: useOrFallback(localizedCms?.videoShowcase?.description, props.videoShowcase.description),
                vimeoUrl: useOrFallback(localizedCms?.videoShowcase?.vimeoUrl, props.videoShowcase.vimeoUrl)
            };
        })()
        : props.videoShowcase;

    const displayTestimonial = cmsContent
        ? (() => {
            const localizedCms =
                cmsContent && (cmsContent.tr || cmsContent.en)
                    ? cmsContent[currentLang]
                    : cmsContent;
            if (!localizedCms) return props.testimonial;
            return {
                ...props.testimonial,
                quote: useOrFallback(localizedCms?.testimonial?.quote, props.testimonial.quote),
                author: useOrFallback(localizedCms?.testimonial?.author, props.testimonial.author),
                role: useOrFallback(localizedCms?.testimonial?.role, props.testimonial.role)
            };
        })()
        : props.testimonial;

    const localizedCms =
        cmsContent && (cmsContent.tr || cmsContent.en)
            ? cmsContent[currentLang]
            : cmsContent;
    const displayProcessVideoUrl = useOrFallback(localizedCms?.processVideo?.vimeoUrl, props.processVideo.vimeoUrl);
    const displayFaqs = Array.isArray(localizedCms?.faqs) && localizedCms.faqs.length > 0 ? localizedCms.faqs : props.faqs;

    const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const faqs = Array.isArray(base?.faqs) ? [...base.faqs] : [];
            const current = faqs[index] || { question: '', answer: '' };
            faqs[index] = { ...current, [field]: value };
            return { ...base, faqs };
        });
    };

    const addFaq = () => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const faqs = Array.isArray(base?.faqs) ? [...base.faqs] : [];
            faqs.push({ question: '', answer: '' });
            return { ...base, faqs };
        });
    };

    const removeFaq = (index: number) => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const faqs = Array.isArray(base?.faqs) ? base.faqs.filter((_: any, i: number) => i !== index) : [];
            return { ...base, faqs };
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
                            <h1 className="service-title">{displayHero.title}</h1>
                            <h2 className="service-subtitle">{displayHero.subtitle}</h2>
                            <p className="service-description">{displayHero.description}</p>
                            <div className="service-hero-actions">
                                <a href={displayHero.buttonLink} className="btn btn-white">{displayHero.buttonText}</a>
                            </div>
                        </div>

                        <div className="service-hero-visual">
                            <div className={`hero-image-container ${displayHero.hideBadge ? 'no-badge' : ''} ${displayHero.imageContainerClassName || ''}`}>
                                {displayHero.videoUrl ? (
                                    <iframe
                                        src={displayHero.videoUrl}
                                        title={displayHero.title}
                                        className="hero-main-video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                ) : (
                                    <img src={displayHero.image} alt={displayHero.title} className={`hero-main-img ${displayHero.hideBadge ? 'no-badge-image' : ''} ${displayHero.imageClassName || ''}`} />
                                )}
                                {!displayHero.hideBadge && (
                                    <div className="circular-badge">
                                        <div className={`badge-text-wrapper ${displayHero.disableBadgeAnimation ? 'no-animation' : ''}`}>
                                            <svg viewBox="0 0 100 100" className="badge-svg">
                                                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                                                <text className="badge-text">
                                                    <textPath xlinkHref="#circlePath">
                                                        {displayHero.badgeText}
                                                    </textPath>
                                                </text>
                                            </svg>
                                        </div>
                                        <div className="badge-icon">{displayHero.badgeIcon}</div>
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
                            <div className="showcase-tag">{displayVideoShowcase.tag}</div>
                            <h2 className="showcase-title">{displayVideoShowcase.title}</h2>
                            <p className="showcase-description">{displayVideoShowcase.description}</p>
                        </div>
                        <div className="showcase-video">
                            <div className="video-glass-wrapper">
                                <div className="video-container">
                                    <iframe
                                        src={displayVideoShowcase.vimeoUrl}
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
                            "{displayTestimonial.quote}"
                        </p>
                        <div className="testimonial-author">
                            <div className="author-meta">
                                <h5>{displayTestimonial.author}</h5>
                                <span>{displayTestimonial.role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="sectoral-process-video-section">
                <div className="container">
                    <div className="sectoral-process-video-wrapper">
                        <iframe
                            src={displayProcessVideoUrl}
                            allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                            allowFullScreen
                            title="Process Video"
                        ></iframe>
                    </div>
                </div>
            </section>

            {displayFaqs && (
                <FAQ items={displayFaqs} />
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

            {canShowCms && (
                <div style={{
                    position: 'fixed',
                    top: 90,
                    right: 16,
                    width: 390,
                    maxHeight: 'calc(100vh - 120px)',
                    overflowY: 'auto',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 14,
                    boxShadow: '0 18px 40px rgba(15,23,42,0.15)',
                    zIndex: 9999,
                    padding: 14
                }}>
                    <div style={{ fontWeight: 800, marginBottom: 10, color: '#0f172a' }}>
                        CMS Editor ({currentLang.toUpperCase()})
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        {([
                            ['hero', 'Hero'],
                            ['video', 'Video'],
                            ['testimonial', 'Yorum'],
                            ['process', 'Process'],
                            ['faqs', 'SSS']
                        ] as const).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setCmsSection(key)}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 999,
                                    padding: '6px 10px',
                                    background: cmsSection === key ? '#0f172a' : '#fff',
                                    color: cmsSection === key ? '#fff' : '#0f172a',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {cmsLoading && <div style={{ fontSize: 13, marginBottom: 8 }}>Yukleniyor...</div>}
                    {cmsError && <div style={{ fontSize: 13, color: '#b91c1c', marginBottom: 8 }}>{cmsError}</div>}
                    <div style={{ display: 'grid', gap: 8 }}>
                        {cmsSection === 'hero' && (
                            <>
                                <input
                                    placeholder="Hero Baslik"
                                    value={cmsEditorData?.hero?.title || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), hero: { ...(p?.hero || {}), title: e.target.value } }))}
                                />
                                <input
                                    placeholder="Hero Alt Baslik"
                                    value={cmsEditorData?.hero?.subtitle || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), hero: { ...(p?.hero || {}), subtitle: e.target.value } }))}
                                />
                                <textarea
                                    placeholder="Hero Aciklama"
                                    rows={3}
                                    value={cmsEditorData?.hero?.description || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), hero: { ...(p?.hero || {}), description: e.target.value } }))}
                                />
                                <input
                                    placeholder="Hero Gorsel URL"
                                    value={cmsEditorData?.hero?.image || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), hero: { ...(p?.hero || {}), image: e.target.value } }))}
                                />
                                <input type="file" accept="image/*" onChange={(e) => handleCmsImageUpload(e.target.files?.[0])} />
                            </>
                        )}
                        {cmsSection === 'video' && (
                            <>
                                <input
                                    placeholder="Video Etiket"
                                    value={cmsEditorData?.videoShowcase?.tag || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), videoShowcase: { ...(p?.videoShowcase || {}), tag: e.target.value } }))}
                                />
                                <input
                                    placeholder="Video Baslik"
                                    value={cmsEditorData?.videoShowcase?.title || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), videoShowcase: { ...(p?.videoShowcase || {}), title: e.target.value } }))}
                                />
                                <input
                                    placeholder="Video URL"
                                    value={cmsEditorData?.videoShowcase?.vimeoUrl || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), videoShowcase: { ...(p?.videoShowcase || {}), vimeoUrl: e.target.value } }))}
                                />
                            </>
                        )}
                        {cmsSection === 'testimonial' && (
                            <>
                                <textarea
                                    placeholder="Yorum"
                                    rows={4}
                                    value={cmsEditorData?.testimonial?.quote || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), testimonial: { ...(p?.testimonial || {}), quote: e.target.value } }))}
                                />
                                <input
                                    placeholder="Yazar"
                                    value={cmsEditorData?.testimonial?.author || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), testimonial: { ...(p?.testimonial || {}), author: e.target.value } }))}
                                />
                                <input
                                    placeholder="Rol"
                                    value={cmsEditorData?.testimonial?.role || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), testimonial: { ...(p?.testimonial || {}), role: e.target.value } }))}
                                />
                            </>
                        )}
                        {cmsSection === 'process' && (
                            <input
                                placeholder="Process Video URL"
                                value={cmsEditorData?.processVideo?.vimeoUrl || ''}
                                onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), processVideo: { ...(p?.processVideo || {}), vimeoUrl: e.target.value } }))}
                            />
                        )}
                        {cmsSection === 'faqs' && (
                            <>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                    {(cmsEditorData?.faqs || []).map((_: any, idx: number) => (
                                        <button
                                            key={`faq-tab-${idx}`}
                                            type="button"
                                            onClick={() => setActiveFaqIndex(idx)}
                                            style={{
                                                border: '1px solid #cbd5e1',
                                                borderRadius: 999,
                                                padding: '4px 8px',
                                                background: idx === activeFaqIndex ? '#0f172a' : '#fff',
                                                color: idx === activeFaqIndex ? '#fff' : '#0f172a',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                                {Array.isArray(cmsEditorData?.faqs) && cmsEditorData.faqs.length > 0 && (
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, display: 'grid', gap: 8, background: '#fff' }}>
                                        <input
                                            placeholder="Soru"
                                            value={cmsEditorData.faqs[activeFaqIndex]?.question || ''}
                                            onChange={(e) => updateFaq(activeFaqIndex, 'question', e.target.value)}
                                        />
                                        <textarea
                                            placeholder="Cevap"
                                            rows={4}
                                            value={cmsEditorData.faqs[activeFaqIndex]?.answer || ''}
                                            onChange={(e) => updateFaq(activeFaqIndex, 'answer', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFaq(activeFaqIndex)}
                                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                                        >
                                            Secili SSS Sil
                                        </button>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={addFaq}
                                    style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                                >
                                    SSS Ekle
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleCmsSave}
                            disabled={cmsSaving}
                            style={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '11px 12px',
                                cursor: 'pointer',
                                opacity: cmsSaving ? 0.7 : 1,
                                fontWeight: 700
                            }}
                        >
                            {cmsSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
