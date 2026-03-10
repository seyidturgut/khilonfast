import { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    HiShoppingCart,
    HiKey,
    HiClipboardDocumentList,
    HiMagnifyingGlass,
    HiCheckBadge
} from 'react-icons/hi2'
import { useCart } from '../../context/CartContext'
import Cart from '../../components/Cart'
import Breadcrumbs from '../../components/Breadcrumbs'
import FAQ from '../../components/FAQ'
import { parseLocalizedPrice } from '../../utils/price'
import './ServicePageTemplate.css'
import trCommon from '../../locales/tr/common.json'
import enCommon from '../../locales/en/common.json'

export interface PricingPackage {
    id: string;
    productKey?: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: (string | ReactNode)[];
    isPopular?: boolean;
    isPremium?: boolean;
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
    image?: string;
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
    icon?: ReactNode;
    image?: string;
    buttonText?: string;
    buttonLink?: string;
}

export interface ApproachSection {
    tag?: string;
    title?: string;
    description?: string;
    items: ApproachItem[];
    compact?: boolean;
}


export interface BannerSection {
    title: ReactNode | string;
    description: ReactNode | string;
    buttonText?: string;
    buttonLink?: string;
    image?: string;
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

export interface AudienceTabItem {
    label: string;
    reasonTitle: string;
    reason: string;
    outcomeTitle: string;
    outcome: string;
}

export interface AudienceTabsSection {
    tag?: string;
    title: string;
    description?: string;
    tabs: AudienceTabItem[];
}

export interface ServicePageProps {
    hero: {
        title: string;
        subtitle: string | ReactNode;
        description: string;
        buttonText: string;
        buttonLink: string;
        image: string;
        imageClassName?: string;
        imageContainerClassName?: string;
        videoUrl?: string;
        hideBadge?: boolean;
        badgeText: string;
        badgeIcon: ReactNode;
        themeColor?: string;
        disableBadgeAnimation?: boolean;
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
        compact?: boolean;
        introBlock?: {
            title: string;
            description: string;
            paragraphs?: string[];
            bullets?: string[];
            note?: string;
            listTitle?: string;
            listItems?: string[];
        };
    };
    pricingSection: {
        tag: string;
        title: string;
        description: string;
        packages: PricingPackage[];
    };
    heroPriceCard?: {
        packageId?: string;
        priceOnly?: boolean;
        name?: string;
        price?: string;
        period?: string;
        description?: string;
        features?: (string | ReactNode)[];
        buttonText?: string;
        icon?: ReactNode;
    };
    comparisonTable?: ComparisonTable;
    processSection?: ProcessSection;
    afterProcessBanner?: BannerSection;
    authorizationSection?: AuthorizationSection;
    approachSection?: ApproachSection;
    audienceTabsSection?: AudienceTabsSection;
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
    serviceKey?: string;
    disableApiHeroTextOverride?: boolean;
    cmsMode?: boolean;
    onCmsEditSection?: (section: 'hero' | 'video' | 'features' | 'faqs') => void;
}

export default function ServicePageTemplate(props: ServicePageProps) {
    const { t, i18n } = useTranslation('common');
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    const location = useLocation();
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr';
    const isCmsMode = props.cmsMode ?? (new URLSearchParams(location.search).get('cms') === '1');
    const canShowCms = isCmsMode && typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));
    const hasExternalCmsController = Boolean(props.onCmsEditSection);
    const shouldUseInternalCms = canShowCms && !hasExternalCmsController;
    const cmsSlug = location.pathname
        .replace(/^\/en(\/|$)/, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');
    const langPrefix = currentLang === 'en' ? '/en' : '';
    const trSlugs = trCommon.slugs as Record<string, string>;
    const enSlugs = enCommon.slugs as Record<string, string>;
    const { addToCart } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [downloadModalUrl, setDownloadModalUrl] = useState<string | null>(null);
    const [dynamicPackages, setDynamicPackages] = useState<PricingPackage[]>(props.serviceKey ? [] : props.pricingSection.packages);
    const [dynamicHero, setDynamicHero] = useState(props.hero);
    const [cmsPageId, setCmsPageId] = useState<number | null>(null);
    const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null);
    const [cmsContent, setCmsContent] = useState<any | null>(null);
    const [cmsEditorData, setCmsEditorData] = useState<any | null>(null);
    const [cmsSection, setCmsSection] = useState<'hero' | 'video' | 'features' | 'faqs'>('hero');
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
    const [activeFaqIndex, setActiveFaqIndex] = useState(0);
    const [activeAudienceTabIndex, setActiveAudienceTabIndex] = useState(0);
    const [cmsLoading, setCmsLoading] = useState(false);
    const [cmsSaving, setCmsSaving] = useState(false);
    const [cmsError, setCmsError] = useState('');

    useEffect(() => {
        const activeLang = i18n.language.split('-')[0];
        if (activeLang !== currentLang) {
            i18n.changeLanguage(currentLang);
        }
    }, [currentLang, i18n]);

    const resolveHeroVideoUrl = (rawValue?: string | null) => {
        const value = String(rawValue || '').trim();
        if (!value) return null;

        if (/^https?:\/\//i.test(value)) {
            const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
            if (vimeoMatch?.[1]) {
                return `https://player.vimeo.com/video/${vimeoMatch[1]}?h=880a1387d8&badge=0&autopause=0&player_id=0&app_id=58479`;
            }
            return value;
        }

        const idMatch = value.match(/(\d{6,})/);
        if (!idMatch?.[1]) return null;

        return `https://player.vimeo.com/video/${idMatch[1]}?h=880a1387d8&badge=0&autopause=0&player_id=0&app_id=58479`;
    };

    const resolveEmbedVideoUrl = (rawValue?: string | null) => {
        const value = String(rawValue || '').trim();
        if (!value) return '';

        try {
            const url = new URL(value);
            const host = url.hostname.toLowerCase();

            if (host.includes('youtube.com') || host.includes('youtu.be')) {
                let videoId = '';
                if (host.includes('youtu.be')) {
                    videoId = url.pathname.replace(/^\/+/, '').split('/')[0] || '';
                } else if (url.pathname.startsWith('/watch')) {
                    videoId = url.searchParams.get('v') || '';
                } else if (url.pathname.startsWith('/shorts/')) {
                    videoId = url.pathname.split('/')[2] || '';
                } else if (url.pathname.startsWith('/embed/')) {
                    videoId = url.pathname.split('/')[2] || '';
                }

                if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            }

            if (host.includes('vimeo.com')) {
                const idMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
                if (idMatch?.[1]) return `https://player.vimeo.com/video/${idMatch[1]}`;
            }
        } catch {
            // ignore URL parsing errors and try regex fallback
        }

        const ytId = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/i)?.[1];
        if (ytId) return `https://www.youtube.com/embed/${ytId}`;

        const vimeoId = value.match(/vimeo\.com\/(?:video\/)?(\d{6,})/i)?.[1];
        if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;

        return value;
    };

    const useOrFallback = (value: any, fallback: any) =>
        value !== undefined && value !== null && value !== '' ? value : fallback;
    const isInvalidCmsText = (value: any) =>
        typeof value !== 'string' || value.trim() === '' || value.trim() === '[object Object]';

    const defaultEditorData = {
        hero: {
            title: props.hero.title,
            subtitle: String(props.hero.subtitle || ''),
            description: props.hero.description,
            image: props.hero.image,
            buttonText: props.hero.buttonText,
            buttonLink: props.hero.buttonLink,
            badgeText: props.hero.badgeText
        },
        videoShowcase: {
            tag: props.videoShowcase.tag,
            title: typeof props.videoShowcase.title === 'string' ? props.videoShowcase.title : '',
            description: props.videoShowcase.description,
            videoUrl: props.videoShowcase.videoUrl
        },
        featuresSection: props.featuresSection
            ? {
                tag: props.featuresSection.tag,
                title: props.featuresSection.title,
                description: props.featuresSection.description,
                features: (props.featuresSection.features || []).map((f) => ({
                    title: f.title,
                    description: f.description
                }))
            }
            : { tag: '', title: '', description: '', features: [] },
        testimonial: {
            quote: props.testimonial.quote,
            author: props.testimonial.author,
            role: props.testimonial.role
        },
        faqs: (props.faqs || []).map((f) => ({ question: f.question, answer: f.answer }))
    };

    useEffect(() => {
        setCmsContent(null);
        setCmsAllContent(null);
        setCmsEditorData(null);
        setCmsPageId(null);
        setCmsError('');
        setActiveFeatureIndex(0);
        setActiveFaqIndex(0);
        setActiveAudienceTabIndex(0);
        setDynamicHero(props.hero);
        setDynamicPackages(props.serviceKey ? [] : props.pricingSection.packages);
    }, [cmsSlug, currentLang, props.hero, props.pricingSection.packages, props.serviceKey]);

    // Keep UI text state in sync when parent props change (including CMS edits).
    useEffect(() => {
        setDynamicHero(props.hero);
        if (!props.serviceKey) {
            setDynamicPackages(props.pricingSection.packages);
        }
    }, [props.hero, props.pricingSection.packages, props.serviceKey]);

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
    }, [API_BASE, cmsSlug, currentLang]);

    useEffect(() => {
        const count = Array.isArray(cmsEditorData?.featuresSection?.features)
            ? cmsEditorData.featuresSection.features.length
            : 0;
        if (count === 0) {
            setActiveFeatureIndex(0);
            return;
        }
        if (activeFeatureIndex > count - 1) {
            setActiveFeatureIndex(count - 1);
        }
    }, [cmsEditorData?.featuresSection?.features, activeFeatureIndex]);

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
        const fetchAdminCms = async () => {
            if (!shouldUseInternalCms || !cmsSlug) return;
            const token = localStorage.getItem('token');
            if (!token) {
                setCmsError('CMS edit icin admin oturumu gerekli.');
                return;
            }
            setCmsLoading(true);
            setCmsError('');
            try {
                const pagesRes = await fetch(`${API_BASE}/admin/pages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!pagesRes.ok) {
                    const errTxt = await pagesRes.text();
                    setCmsError(`Admin sayfalari okunamadi (${pagesRes.status}): ${errTxt}`);
                    return;
                }
                const pages = await pagesRes.json();
                const page = (pages || []).find((p: any) => String(p?.slug || '').replace(/^\/+/, '') === cmsSlug);
                if (!page?.id) return;

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
    }, [API_BASE, cmsSlug, currentLang, shouldUseInternalCms]);

    useEffect(() => {
        if (!shouldUseInternalCms) return;
        if (!cmsEditorData) {
            setCmsEditorData(defaultEditorData);
        }
    }, [shouldUseInternalCms, cmsEditorData, props.hero.title, props.videoShowcase.videoUrl, currentLang]);

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

                    // Primary text source should always be current locale.
                    // TR fallback is only for package/price continuity.
                    const primaryProduct = await fetchByLang(currentLang);
                    const fallbackProduct = currentLang === 'tr' ? null : await fetchByLang('tr');
                    const product = primaryProduct || fallbackProduct;

                    if (product) {
                        const resolvedTitle = props.disableApiHeroTextOverride
                            ? undefined
                            : (primaryProduct?.name || fallbackProduct?.name || undefined);
                        const resolvedDescription = props.disableApiHeroTextOverride
                            ? undefined
                            : (primaryProduct?.description || fallbackProduct?.description || undefined);
                        const resolvedImage =
                            primaryProduct?.hero_image ||
                            fallbackProduct?.hero_image ||
                            undefined;
                        const resolvedVideo =
                            resolveHeroVideoUrl(primaryProduct?.hero_vimeo_id) ||
                            resolveHeroVideoUrl(fallbackProduct?.hero_vimeo_id) ||
                            undefined;

                        setDynamicHero(prev => ({
                            ...prev,
                            title: resolvedTitle || prev.title,
                            description: resolvedDescription || prev.description,
                            image: resolvedImage || prev.image,
                            videoUrl: resolvedVideo || prev.videoUrl
                        }));

                        const primaryPackageMap = new Map<string, any>(
                            Array.isArray(primaryProduct?.packages)
                                ? primaryProduct.packages.map((p: any) => [p.product_key, p])
                                : []
                        );
                        const packageSource =
                            Array.isArray(primaryProduct?.packages) && primaryProduct.packages.length > 0
                                ? primaryProduct.packages
                                : (Array.isArray(fallbackProduct?.packages) ? fallbackProduct.packages : []);

                        if (Array.isArray(packageSource) && packageSource.length > 0) {
                            const packages = packageSource.map((pkg: any) => {
                                const localizedPkg = currentLang === 'en'
                                    ? (primaryPackageMap.get(pkg.product_key) || pkg)
                                    : pkg;

                                const localPkg = (props.pricingSection.packages.find(p => pkg.product_key.includes(p.id)) || {}) as any;

                                return ({
                                    ...localPkg,
                                    id: pkg.product_key,
                                    productKey: pkg.product_key,
                                    fullName: localizedPkg.name || localPkg.name,
                                    name: localPkg.name || (localizedPkg.name?.includes('-') ? localizedPkg.name.split('-').pop()?.trim() : localizedPkg.name),
                                    price: new Intl.NumberFormat(currentLang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: pkg.currency, maximumFractionDigits: 0 }).format(pkg.price) + '*',
                                    period: pkg.duration_days ? (currentLang === 'tr' ? `${pkg.duration_days} Gün` : `${pkg.duration_days} Days`) : (localPkg.period || t('pricing.monthly')),
                                    description: localizedPkg.description || localPkg.description || props.pricingSection.description,
                                    features: (localPkg.features && localPkg.features.length > 0) ? localPkg.features : (localizedPkg.features ? localizedPkg.features.split('\n') : []),
                                    isPopular: pkg.product_key.includes('growth') || localPkg.isPopular,
                                    buttonText: localPkg.buttonText || t('pricing.buyNow'),
                                    icon: localPkg.icon || props.pricingSection.packages[0]?.icon
                                });
                            });
                            setDynamicPackages(packages);
                        } else if (typeof product.price !== 'undefined' && product.price !== null) {
                            const textProduct = primaryProduct || fallbackProduct || product;
                            const priceProduct = fallbackProduct || primaryProduct || product;
                            const localPkg = props.pricingSection.packages[0] || {} as any;
                            const fallbackPackage: PricingPackage = {
                                id: priceProduct.product_key || props.heroPriceCard?.packageId || 'single',
                                productKey: priceProduct.product_key || undefined,
                                name: localPkg.name || textProduct.name || 'Package',
                                price: new Intl.NumberFormat(currentLang === 'tr' ? 'tr-TR' : 'en-US', {
                                    style: 'currency',
                                    currency: priceProduct.currency || 'TRY',
                                    maximumFractionDigits: 0
                                }).format(Number(priceProduct.price)) + '*',
                                period: priceProduct.duration_days
                                    ? (currentLang === 'tr' ? `${priceProduct.duration_days} Gün` : `${priceProduct.duration_days} Days`)
                                    : (localPkg.period || t('pricing.monthly')),
                                description: localPkg.description || textProduct.description || props.pricingSection.description,
                                features: (localPkg.features && localPkg.features.length > 0) ? localPkg.features : (textProduct.features ? String(textProduct.features).split('\n') : []),
                                details: localPkg.details,
                                buttonText: localPkg.buttonText || t('pricing.buyNow'),
                                icon: localPkg.icon || props.pricingSection.packages[0]?.icon
                            };
                            setDynamicPackages([fallbackPackage]);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch packages:", err);
                }
            };
            fetchPackages();
        }
    }, [props.serviceKey, props.disableApiHeroTextOverride, currentLang, t, props.pricingSection.description, props.pricingSection.packages, props.heroPriceCard?.packageId]);

    const displayPackages = props.serviceKey ? dynamicPackages : props.pricingSection.packages;

    const localizeInternalPath = (path?: string) => {
        if (!path) return path;
        if (path.startsWith('#') || /^https?:\/\//.test(path)) return path;

        const normalized = path.replace(/^\/en(\/|$)/, '').replace(/^\/+/, '').replace(/\/+$/, '');
        const matchedKey =
            Object.keys(trSlugs).find((k) => trSlugs[k] === normalized) ||
            Object.keys(enSlugs).find((k) => enSlugs[k] === normalized);

        const targetSlug = matchedKey
            ? (currentLang === 'en' ? enSlugs[matchedKey] : trSlugs[matchedKey])
            : normalized;

        if (!targetSlug) return currentLang === 'en' ? '/en' : '/';
        return `${langPrefix}/${targetSlug}`.replace(/\/{2,}/g, '/');
    };

    const localizedBreadcrumbs = props.breadcrumbs.map((item) => ({
        ...item,
        path: localizeInternalPath(item.path)
    }));
    const contactPath = `${langPrefix}/${currentLang === 'en' ? enSlugs.contact : trSlugs.contact}`.replace(/\/{2,}/g, '/');

    const openCmsSection = (section: 'hero' | 'video' | 'features' | 'faqs') => {
        if (!canShowCms) return;
        if (props.onCmsEditSection) {
            props.onCmsEditSection(section);
            return;
        }
        setCmsSection(section);
    };

    const renderCmsButton = (section: 'hero' | 'video' | 'features' | 'faqs') => {
        if (!canShowCms) return null;
        return (
            <button
                type="button"
                onClick={() => openCmsSection(section)}
                style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: 'pointer'
                }}
            >
                Duzenle
            </button>
        );
    };

    const updateFeature = (index: number, field: 'title' | 'description', value: string) => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const features = Array.isArray(base?.featuresSection?.features)
                ? [...base.featuresSection.features]
                : [];
            const current = features[index] || { title: '', description: '' };
            features[index] = { ...current, [field]: value };
            return { ...base, featuresSection: { ...(base.featuresSection || {}), features } };
        });
    };

    const addFeature = () => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const features = Array.isArray(base?.featuresSection?.features)
                ? [...base.featuresSection.features]
                : [];
            features.push({ title: '', description: '' });
            return { ...base, featuresSection: { ...(base.featuresSection || {}), features } };
        });
    };

    const removeFeature = (index: number) => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const features = Array.isArray(base?.featuresSection?.features)
                ? base.featuresSection.features.filter((_: any, i: number) => i !== index)
                : [];
            return { ...base, featuresSection: { ...(base.featuresSection || {}), features } };
        });
    };

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
                if (!res.ok) {
                    setCmsError('Gorsel upload basarisiz oldu.');
                    return;
                }
                const data = await res.json();
                setCmsEditorData((prev: any) => ({
                    ...(prev || defaultEditorData),
                    hero: {
                        ...((prev || defaultEditorData).hero || {}),
                        image: data.path || ''
                    }
                }));
            } catch {
                setCmsError('Gorsel upload basarisiz oldu.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCmsSave = async () => {
        if (!shouldUseInternalCms || !cmsSlug || !cmsEditorData) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setCmsError('Kaydetmek icin admin girisi gerekli.');
            return;
        }
        setCmsSaving(true);
        setCmsError('');
        try {
            const nextAll = {
                ...(cmsAllContent || {}),
                [currentLang]: cmsEditorData
            };
            let nextPageId = cmsPageId;
            if (!nextPageId) {
                const createRes = await fetch(`${API_BASE}/admin/pages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: props.hero.title || cmsSlug,
                        slug: cmsSlug,
                        meta_title: '',
                        meta_description: ''
                    })
                });
                if (!createRes.ok) {
                    const errTxt = await createRes.text();
                    setCmsError(`Sayfa olusturulamadi (${createRes.status}): ${errTxt}`);
                    return;
                }
                const created = await createRes.json();
                nextPageId = Number(created?.id || 0);
                setCmsPageId(nextPageId);
            }
            const saveRes = await fetch(`${API_BASE}/admin/pages/${nextPageId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content_json: nextAll, is_published: true })
            });
            if (!saveRes.ok) {
                const errTxt = await saveRes.text();
                setCmsError(`Kaydetme basarisiz (${saveRes.status}): ${errTxt}`);
                return;
            }
            setCmsAllContent(nextAll);
            setCmsContent(cmsEditorData);
        } catch {
            setCmsError('Kaydetme basarisiz oldu.');
        } finally {
            setCmsSaving(false);
        }
    };

    const displayHero = cmsContent
        ? {
            ...dynamicHero,
            title: useOrFallback(cmsContent?.hero?.title, dynamicHero.title),
            subtitle: useOrFallback(cmsContent?.hero?.subtitle, dynamicHero.subtitle),
            description: useOrFallback(cmsContent?.hero?.description, dynamicHero.description),
            image: useOrFallback(cmsContent?.hero?.image, dynamicHero.image),
            buttonText: useOrFallback(cmsContent?.hero?.buttonText, dynamicHero.buttonText),
            buttonLink: useOrFallback(cmsContent?.hero?.buttonLink, dynamicHero.buttonLink),
            badgeText: useOrFallback(cmsContent?.hero?.badgeText, dynamicHero.badgeText)
        }
        : dynamicHero;

    const displayVideoShowcase = cmsContent
        ? {
            ...props.videoShowcase,
            tag: useOrFallback(cmsContent?.videoShowcase?.tag, props.videoShowcase.tag),
            title: <>{isInvalidCmsText(cmsContent?.videoShowcase?.title) ? props.videoShowcase.title : cmsContent.videoShowcase.title}</>,
            description: useOrFallback(cmsContent?.videoShowcase?.description, props.videoShowcase.description),
            videoUrl: useOrFallback(cmsContent?.videoShowcase?.videoUrl, props.videoShowcase.videoUrl)
        }
        : props.videoShowcase;

    const baseFeaturesSection = props.featuresSection;
    const displayFeaturesSection = baseFeaturesSection
        ? (
            cmsContent
                ? {
                    ...baseFeaturesSection,
                    tag: useOrFallback(cmsContent?.featuresSection?.tag, baseFeaturesSection.tag),
                    title: useOrFallback(cmsContent?.featuresSection?.title, baseFeaturesSection.title),
                    description: useOrFallback(cmsContent?.featuresSection?.description, baseFeaturesSection.description),
                    features: Array.isArray(cmsContent?.featuresSection?.features) && cmsContent.featuresSection.features.length > 0
                        ? cmsContent.featuresSection.features.map((f: any, idx: number) => ({
                            title: f.title,
                            description: f.description,
                            icon: baseFeaturesSection.features[idx]?.icon || baseFeaturesSection.features[0]?.icon
                        }))
                        : baseFeaturesSection.features
                }
                : baseFeaturesSection
        )
        : undefined;

    const displayFaqs = Array.isArray(cmsContent?.faqs) && cmsContent.faqs.length > 0
        ? cmsContent.faqs
        : props.faqs;

    const displayTestimonial = cmsContent
        ? {
            ...props.testimonial,
            quote: useOrFallback(cmsContent?.testimonial?.quote, props.testimonial.quote),
            author: useOrFallback(cmsContent?.testimonial?.author, props.testimonial.author),
            role: useOrFallback(cmsContent?.testimonial?.role, props.testimonial.role)
        }
        : props.testimonial;

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

            const productKey = pkg.productKey || productKeyMap[pkg.id] || pkg.id;

            const priceNum = parseLocalizedPrice(pkg.price)

            addToCart({
                id: pkg.id,
                product_id: 0, // Will be mapped by backend using product_key
                product_key: productKey, // Use mapped product key
                name: (pkg as any).fullName || pkg.name, // Use full name if available
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

    useEffect(() => {
        if (!downloadModalUrl) return;
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setDownloadModalUrl(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [downloadModalUrl]);

    const standardProcessSteps: ProcessStep[] = [
        {
            stepNumber: 1,
            title: t('process.steps.buy.title'),
            description: t('process.steps.buy.description'),
            icon: <HiShoppingCart />
        },
        {
            stepNumber: 2,
            title: t('process.steps.auth.title'),
            description: t('process.steps.auth.description'),
            icon: <HiKey />
        },
        {
            stepNumber: 3,
            title: t('process.steps.brief.title'),
            description: t('process.steps.brief.description'),
            icon: <HiClipboardDocumentList />
        },
        {
            stepNumber: 4,
            title: t('process.steps.analysis.title'),
            description: t('process.steps.analysis.description'),
            icon: <HiMagnifyingGlass />
        },
        {
            stepNumber: 5,
            title: t('process.steps.approval.title'),
            description: t('process.steps.approval.description'),
            icon: <HiCheckBadge />
        }
    ];

    const heroPricePackage = props.heroPriceCard
        ? displayPackages.find((pkg) => pkg.id === props.heroPriceCard?.packageId) || displayPackages[0]
        : null;
    const isHeroPriceOnly = Boolean(props.heroPriceCard?.priceOnly);
    const displayedHeroPricePackage = heroPricePackage
        ? {
            ...heroPricePackage,
            name: props.heroPriceCard?.name ?? heroPricePackage.name,
            price: props.heroPriceCard?.price ?? heroPricePackage.price,
            period: props.heroPriceCard?.period ?? heroPricePackage.period,
            description: props.heroPriceCard?.description ?? heroPricePackage.description,
            features: props.heroPriceCard?.features ?? heroPricePackage.features,
            buttonText: props.heroPriceCard?.buttonText ?? heroPricePackage.buttonText,
            icon: props.heroPriceCard?.icon ?? heroPricePackage.icon
        }
        : null;

    const renderBrandText = (text?: string) => {
        if (!text) return text;

        const parts = text.split(/(khilonfast)/gi);

        return (
            <>
                {parts.map((part, idx) =>
                    /^khilonfast$/i.test(part) ? (
                        <span key={idx} className="brand-khilonfast-word">
                            <span className="brand-khilon">khilon</span>
                            <span className="brand-fast">fast</span>
                        </span>
                    ) : (
                        <span key={idx}>{part}</span>
                    )
                )}
            </>
        );
    };

    const handleAuthorizationActionClick = (
        event: MouseEvent<HTMLAnchorElement>,
        buttonLink?: string
    ) => {
        if (!buttonLink) return;
        if (/\.pdf(\?|#|$)/i.test(buttonLink)) {
            event.preventDefault();
            setDownloadModalUrl(buttonLink);
        }
    };

    return (
        <div className="page-container service-template-page">
            <section className="service-hero">
                <Breadcrumbs 
                    items={localizedBreadcrumbs} 
                    homePath={currentLang === 'en' ? '/en' : '/'} 
                />
                <div className="container service-hero-container">
                    <div className="service-hero-grid">
                        <div className="service-hero-text">
                            <div style={{ marginBottom: 10 }}>
                                {renderCmsButton('hero')}
                            </div>
                            <h1 className="service-title">{displayHero.title}</h1>
                            <h2 className="service-subtitle">{displayHero.subtitle}</h2>
                            <p className="service-description">{displayHero.description}</p>
                            <div className="service-hero-actions">
                                <a href={displayHero.buttonLink} className="btn-service-primary">{displayHero.buttonText}</a>
                            </div>
                        </div>
                        <div className={`service-hero-visual ${isHeroPriceOnly ? 'price-only' : ''}`}>
                            {!isHeroPriceOnly && (
                                <div className={`hero-image-container ${displayHero.hideBadge ? 'no-badge' : ''} ${displayHero.imageContainerClassName || ''}`}>
                                    {displayHero.videoUrl ? (
                                        <iframe
                                            src={resolveEmbedVideoUrl(displayHero.videoUrl)}
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
                            )}
                            {displayedHeroPricePackage && (
                                <div className="hero-price-card compact">
                                    <div className="card-header">
                                        <div className="pkg-icon">{displayedHeroPricePackage.icon}</div>
                                        <h3 className="pkg-name">{displayedHeroPricePackage.name}</h3>
                                        <div className="pkg-price-wrap">
                                            <span className="pkg-price">{displayedHeroPricePackage.price}</span>
                                            {displayedHeroPricePackage.period ? (
                                                <span className="pkg-period">/{displayedHeroPricePackage.period}</span>
                                            ) : null}
                                        </div>
                                        <p className="pkg-desc">{displayedHeroPricePackage.description}</p>
                                    </div>
                                    <div className="card-body">
                                        <ul className="pkg-features">
                                            {displayedHeroPricePackage.features.map((f, i) => (
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
                                            onClick={() => handleAddToCart(displayedHeroPricePackage)}
                                            className="btn-pkg btn-pkg-primary hero-price-btn"
                                        >
                                            {displayedHeroPricePackage.buttonText || t('pricing.buyNow')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="video-showcase">
                <div className="container">
                    <div className="showcase-grid">
                        <div className="showcase-info">
                            <div style={{ marginBottom: 10 }}>
                                {renderCmsButton('video')}
                            </div>
                            <div className="showcase-tag">{displayVideoShowcase.tag}</div>
                            <h2 className="showcase-title">{displayVideoShowcase.title}</h2>
                            <p className="showcase-description">{displayVideoShowcase.description}</p>
                        </div>
                        <div className="showcase-video">
                            <div className="video-glass-wrapper">
                                <div className="video-container">
                                    <iframe
                                        src={resolveEmbedVideoUrl(displayVideoShowcase.videoUrl)}
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
                displayFeaturesSection && (
                    <section className={`service-features-linear ${displayFeaturesSection.compact ? 'compact' : ''}`}>
                        <div className="container">
                            <div className="section-header text-center">
                                <div style={{ marginBottom: 10 }}>
                                    {renderCmsButton('features')}
                                </div>
                                <span className="showcase-tag">{displayFeaturesSection.tag}</span>
                                <h2 className="section-title-large">{displayFeaturesSection.title}</h2>
                                <p className="section-desc-mid">{displayFeaturesSection.description}</p>
                            </div>

                            {displayFeaturesSection.introBlock && (
                                <div className="features-intro-panel">
                                    <div className="features-intro-copy">
                                        <h3>{displayFeaturesSection.introBlock.title}</h3>
                                        <p>{displayFeaturesSection.introBlock.description}</p>
                                        {(displayFeaturesSection.introBlock.paragraphs || []).map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))}
                                        {Array.isArray(displayFeaturesSection.introBlock.bullets) && displayFeaturesSection.introBlock.bullets.length > 0 && (
                                            <ul className="features-intro-bullets">
                                                {displayFeaturesSection.introBlock.bullets.map((bullet, idx) => (
                                                    <li key={idx}>{bullet}</li>
                                                ))}
                                            </ul>
                                        )}
                                        {displayFeaturesSection.introBlock.note && (
                                            <p className="features-intro-note">{displayFeaturesSection.introBlock.note}</p>
                                        )}
                                    </div>
                                    {Array.isArray(displayFeaturesSection.introBlock.listItems) && displayFeaturesSection.introBlock.listItems.length > 0 && (
                                        <div className="features-intro-list">
                                            {displayFeaturesSection.introBlock.listTitle && <h4>{displayFeaturesSection.introBlock.listTitle}</h4>}
                                            <ol>
                                                {displayFeaturesSection.introBlock.listItems.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`features-grid-linear ${displayFeaturesSection.compact ? 'compact' : ''}`}>
                                {displayFeaturesSection.features.map((feature: ServiceFeature, idx: number) => (
                                    <div key={idx} className={`feature-card-linear ${displayFeaturesSection.compact ? 'compact' : ''} ${feature.image ? 'has-image' : ''}`}>
                                        {feature.image ? (
                                            <div className="feature-image-box">
                                                <img src={feature.image} alt={feature.title} />
                                            </div>
                                        ) : (
                                            <div className="feature-icon-box">{feature.icon}</div>
                                        )}
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

            {props.audienceTabsSection && props.audienceTabsSection.tabs.length > 0 && (
                <section className="audience-tabs-section">
                    <div className="container">
                        <div className="section-header text-center">
                            {props.audienceTabsSection.tag && <span className="showcase-tag">{props.audienceTabsSection.tag}</span>}
                            <h2 className="section-title-large">{props.audienceTabsSection.title}</h2>
                            {props.audienceTabsSection.description && <p className="section-desc-mid">{props.audienceTabsSection.description}</p>}
                        </div>

                        <div className="audience-tabs-shell">
                            <div className="audience-tab-list" role="tablist" aria-label={props.audienceTabsSection.title}>
                                {props.audienceTabsSection.tabs.map((tab, idx) => (
                                    <button
                                        key={tab.label}
                                        type="button"
                                        className={`audience-tab-trigger ${idx === activeAudienceTabIndex ? 'active' : ''}`}
                                        onClick={() => setActiveAudienceTabIndex(idx)}
                                        role="tab"
                                        aria-selected={idx === activeAudienceTabIndex}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="audience-tab-panel" role="tabpanel">
                                <div className="audience-tab-card">
                                    <span className="audience-tab-kicker">{props.audienceTabsSection.tabs[activeAudienceTabIndex].label}</span>
                                    <div className="audience-tab-block">
                                        <h3>{props.audienceTabsSection.tabs[activeAudienceTabIndex].reasonTitle}</h3>
                                        <p>{props.audienceTabsSection.tabs[activeAudienceTabIndex].reason}</p>
                                    </div>
                                    <div className="audience-tab-block">
                                        <h3>{props.audienceTabsSection.tabs[activeAudienceTabIndex].outcomeTitle}</h3>
                                        <p>{props.audienceTabsSection.tabs[activeAudienceTabIndex].outcome}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Split Layout: Single Pricing + Comparison Table Side-by-Side */}
            {!isHeroPriceOnly && (displayPackages.length === 1 && props.comparisonTable ? (
                <section className="service-pricing-split" id="pricing">
                    <div className="container">
                        <div className="section-header text-center">
                            <span className="showcase-tag">{props.pricingSection.tag}</span>
                            <h2 className="section-title-large">{props.pricingSection.title}</h2>
                            <p className="section-desc-mid">{props.pricingSection.description}</p>
                        </div>

                        <div className="split-layout-grid">
                            {/* Left: Single Layout Pricing Card */}
                            <div className={`pricing-grid-linear ${displayPackages.length <= 2 ? 'centered-grid' : ''}`}>
                                {displayPackages.map((pkg) => (
                                    <div key={pkg.id} className={`pricing-card-linear ${pkg.isPopular ? 'popular' : ''} ${pkg.isPremium ? 'premium' : ''}`}>
                                        {displayPackages.length > 1 && pkg.isPopular && <div className="popular-badge">{t('pricing.popular')}</div>}
                                        {displayPackages.length > 1 && pkg.isPremium && <div className="premium-badge">PREMIUM</div>}
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
                                                {pkg.buttonText || t('pricing.buyNow')}
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

                            <div className={`pricing-grid-linear ${displayPackages.length <= 2 ? 'centered-grid' : ''}`}>
                                {displayPackages.map((pkg) => (
                                    <div key={pkg.id} className={`pricing-card-linear ${pkg.isPopular ? 'popular' : ''} ${pkg.isPremium ? 'premium' : ''}`}>
                                        {displayPackages.length > 1 && pkg.isPopular && <div className="popular-badge">{t('pricing.popular')}</div>}
                                        {displayPackages.length > 1 && pkg.isPremium && <div className="premium-badge">PREMIUM</div>}
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
                                                                {detail.icon && <span className="pkg-detail-icon">{detail.icon}</span>}
                                                                <span className="pkg-detail-title">{detail.title}</span>
                                                            </div>
                                                            <div className="pkg-detail-content">
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
                                                {pkg.buttonText || t('pricing.buyNow')}
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
            ))}



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
                                {(props.processSection.steps || standardProcessSteps).map((step, idx) => (
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
                                                    src={resolveEmbedVideoUrl(props.processSection.videoUrl)}
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
                props.afterProcessBanner && (
                    <section className="service-after-process-banner">
                        <div className="container">
                            <div className="apb-content">
                                <h2 className="apb-title">{props.afterProcessBanner.title}</h2>
                                <p className="apb-desc">{props.afterProcessBanner.description}</p>
                            </div>
                            <svg className="apb-bg-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 0 C22.4 0 0 22.4 0 50 L20 50 C20 33.4 33.4 20 50 20 C66.6 20 80 33.4 80 50 L100 50 C100 22.4 77.6 0 50 0 Z" fill="currentColor" />
                            </svg>
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
                                            <a
                                                href={card.buttonLink || contactPath}
                                                className="btn-auth"
                                                onClick={(e) => handleAuthorizationActionClick(e, card.buttonLink)}
                                            >
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
                        <p className="quote-text">{displayTestimonial.quote}</p>
                        <div className="quote-author">
                            <strong>{displayTestimonial.author}</strong>
                            <span>{displayTestimonial.role}</span>
                        </div>
                    </div>
                </div>
            </section>

            {
                props.approachSection && (() => {
                    const approachSection = props.approachSection;

                    return (
                    <section className="service-approach-linear">
                        <div className="container">
                            {(approachSection.title || approachSection.tag) && (
                                <div className="section-header text-center">
                                    {approachSection.tag && <span className="showcase-tag">{approachSection.tag}</span>}
                                    {approachSection.title && <h2 className="section-title-large">{renderBrandText(approachSection.title)}</h2>}
                                    {approachSection.description && <p className="section-desc-mid">{approachSection.description}</p>}
                                </div>
                            )}

                            <div className={`approach-grid-linear count-${approachSection.items.length} ${approachSection.compact ? 'compact' : ''}`}>
                                {approachSection.items.map((item, idx) => (
                                    <div key={idx} className={`approach-card-linear ${approachSection.compact ? 'compact' : ''}`}>
                                        {item.image && (
                                            <div className="approach-image-box">
                                                <img src={item.image} alt={item.title} className="approach-image" />
                                            </div>
                                        )}
                                        {item.icon && !item.image && (
                                            <div className="approach-icon-box">
                                                {item.icon}
                                            </div>
                                        )}
                                        <div className="approach-content">
                                            <h3 className="approach-title">{item.title}</h3>
                                            <h4 className="approach-subtitle">{renderBrandText(item.subtitle)}</h4>
                                            <p className="approach-desc">{item.description}</p>
                                            {item.buttonText && (
                                                <div className="approach-action">
                                                    <a href={item.buttonLink || '#pricing'} className="approach-btn">
                                                        {item.buttonText}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    );
                })()
            }

            {
                displayFaqs && (
                    <>
                        {canShowCms && (
                            <div className="container" style={{ marginBottom: 12 }}>
                                {renderCmsButton('faqs')}
                            </div>
                        )}
                        <FAQ items={displayFaqs} />
                    </>
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
                                    <Link to={contactPath} className="btn-service-primary">{t('common.contactUs')}</Link>
                                </div>
                            </div>
                            <div className="pattern-overlay"></div>
                        </div>
                    </section>
                )
            }

            {shouldUseInternalCms && (
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
                        {(['hero', 'video', 'features', 'faqs'] as const).map((section) => (
                            <button
                                key={section}
                                type="button"
                                onClick={() => setCmsSection(section)}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 999,
                                    padding: '6px 10px',
                                    background: cmsSection === section ? '#0f172a' : '#fff',
                                    color: cmsSection === section ? '#fff' : '#0f172a',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {section === 'hero' ? 'Hero' : section === 'video' ? 'Video' : section === 'features' ? 'Ozellikler' : 'SSS'}
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
                                    value={cmsEditorData?.videoShowcase?.videoUrl || ''}
                                    onChange={(e) => setCmsEditorData((p: any) => ({ ...(p || defaultEditorData), videoShowcase: { ...(p?.videoShowcase || {}), videoUrl: e.target.value } }))}
                                />
                            </>
                        )}
                        {cmsSection === 'features' && (
                            <>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                    {(cmsEditorData?.featuresSection?.features || []).map((_: any, idx: number) => (
                                        <button
                                            key={`feature-tab-${idx}`}
                                            type="button"
                                            onClick={() => setActiveFeatureIndex(idx)}
                                            style={{
                                                border: '1px solid #cbd5e1',
                                                borderRadius: 999,
                                                padding: '4px 8px',
                                                background: idx === activeFeatureIndex ? '#0f172a' : '#fff',
                                                color: idx === activeFeatureIndex ? '#fff' : '#0f172a',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                                {Array.isArray(cmsEditorData?.featuresSection?.features) && cmsEditorData.featuresSection.features.length > 0 && (
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, display: 'grid', gap: 8, background: '#fff' }}>
                                        <input
                                            placeholder="Ozellik Baslik"
                                            value={cmsEditorData.featuresSection.features[activeFeatureIndex]?.title || ''}
                                            onChange={(e) => updateFeature(activeFeatureIndex, 'title', e.target.value)}
                                        />
                                        <textarea
                                            placeholder="Ozellik Aciklama"
                                            rows={3}
                                            value={cmsEditorData.featuresSection.features[activeFeatureIndex]?.description || ''}
                                            onChange={(e) => updateFeature(activeFeatureIndex, 'description', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(activeFeatureIndex)}
                                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                                        >
                                            Secili Ozelligi Sil
                                        </button>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={addFeature}
                                    style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                                >
                                    Ozellik Ekle
                                </button>
                            </>
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

            {downloadModalUrl && (
                <div className="download-modal-overlay" onClick={() => setDownloadModalUrl(null)}>
                    <div className="download-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="download-modal-title">{t('common.sampleReport')}</h3>
                        <p className="download-modal-desc">
                            {t('common.sampleReportDescription')}
                        </p>
                        <div className="download-modal-preview">
                            <iframe
                                src={downloadModalUrl}
                                title={t('common.sampleReportPdfTitle')}
                                className="download-modal-iframe"
                            />
                        </div>
                        <div className="download-modal-actions">
                            <a href={downloadModalUrl} download className="btn-service-primary">{t('common.downloadPdf')}</a>
                            <a href={downloadModalUrl} target="_blank" rel="noreferrer" className="btn-pkg btn-pkg-outline">{t('common.openInNewTab')}</a>
                        </div>
                        <button className="download-modal-close" onClick={() => setDownloadModalUrl(null)}>Kapat</button>
                    </div>
                </div>
            )}

            <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    )
}
