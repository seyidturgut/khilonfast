import { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiBriefcase,
    HiBolt,
    HiChartBar,
    HiChatBubbleLeftRight,
    HiComputerDesktop,
    HiFunnel,
    HiGlobeAlt,
    HiPencilSquare,
    HiPresentationChartLine,
    HiPuzzlePiece,
    HiRocketLaunch,
    HiUserGroup
} from 'react-icons/hi2';
import ServicePageTemplate from './templates/ServicePageTemplate';
import { getConsultingPrograms } from '../data/consultingPrograms';
import trCommon from '../locales/tr/common.json';
import enCommon from '../locales/en/common.json';
import { API_BASE_URL } from '../config/api';
import { useRouteLocale } from '../utils/locale';
import { hasTurkishContentLeak } from '../utils/localizedContent';

export default function ConsultingProgramPage() {
    const location = useLocation();
    const { i18n } = useTranslation('common');
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';
    const langPrefix = isEn ? '/en' : '';
    const activeSlugs = (isEn ? enCommon.slugs : trCommon.slugs) as Record<string, string>;
    const consultingPrograms = useMemo(() => getConsultingPrograms(currentLang), [currentLang]);

    useEffect(() => {
        const activeLang = i18n.language.split('-')[0];
        if (activeLang !== currentLang) {
            i18n.changeLanguage(currentLang);
        }
    }, [currentLang, i18n]);

    const trSlugs = trCommon.slugs as Record<string, string>;
    const enSlugs = enCommon.slugs as Record<string, string>;

    const consultingSlugKeys = [
        'consultingPayment',
        'consultingB2B',
        'consultingFintech',
        'consultingTech',
        'consultingManufacturing',
        'consultingEnergy',
        'consultingDesign',
        'consultingFleet',
        'consultingFood'
    ] as const;

    const normalizedPath = location.pathname
        .replace(/^\/en(\/|$)/, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');

    const normalizedCandidates = [
        normalizedPath,
        normalizedPath.replace(/^(danismanlik|consulting)\//, '')
    ];

    const matchedConsultingKey = consultingSlugKeys.find((key) =>
        normalizedCandidates.some(
            (candidate) => trSlugs[key] === candidate || enSlugs[key] === candidate
        )
    );

    const consulting = useMemo(() => {
        if (matchedConsultingKey) {
            const resolvedPath = `/${activeSlugs[matchedConsultingKey]}`;
            const bySlugKey = consultingPrograms.find((item) => item.path === resolvedPath);
            if (bySlugKey) return bySlugKey;
        }

        const byPath = consultingPrograms.find((item) =>
            normalizedCandidates.some((candidate) => {
                const normalizedItem = item.path.replace(/^\/+/, '');
                const normalizedItemNoPrefix = normalizedItem.replace(/^(danismanlik|consulting)\//, '');
                return candidate === normalizedItem || candidate === normalizedItemNoPrefix;
            })
        );
        return byPath ?? consultingPrograms[0];
    }, [matchedConsultingKey, normalizedCandidates.join('|'), trSlugs, consultingPrograms]);

    const resolvedSlugKey =
        matchedConsultingKey ??
        consultingSlugKeys.find((key) => `/${trSlugs[key]}` === consulting.path) ??
        'consultingPayment';

    const consultingTitle = consulting.title;
    const consultingSummary = consulting.summary;

    const cmsSlug = matchedConsultingKey ? trSlugs[matchedConsultingKey] : (normalizedCandidates[0] || '');
    const cmsSlugEncoded = encodeURIComponent(cmsSlug);
    const [cmsContent, setCmsContent] = useState<any | null>(null);
    const isCmsMode = new URLSearchParams(location.search).get('cms') === '1';
    const API_BASE = API_BASE_URL;
    const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null);
    const [cmsEditorData, setCmsEditorData] = useState<any | null>(null);
    const [cmsPageId, setCmsPageId] = useState<number | null>(null);
    const [cmsSection, setCmsSection] = useState<'hero' | 'video' | 'features' | 'faqs'>('hero');
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
    const [activeFaqIndex, setActiveFaqIndex] = useState(0);
    const [cmsSaving] = useState(false);
    const [cmsLoading, setCmsLoading] = useState(false);
    const [cmsError, setCmsError] = useState('');
    const canShowCms = isCmsMode && typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));

    useEffect(() => {
        setCmsContent(null);
        setCmsAllContent(null);
        setCmsEditorData(null);
        setCmsPageId(null);
        setCmsError('');
        setActiveFeatureIndex(0);
        setActiveFaqIndex(0);
        setCmsSection('hero');
    }, [cmsSlug, currentLang]);

    useEffect(() => {
        const fetchCms = async () => {
            if (!cmsSlug) return;
            try {
                const res = await fetch(`${API_BASE}/pages/slug/${cmsSlugEncoded}?lang=${currentLang}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!data?.content) return;
                if (currentLang === 'en' && hasTurkishContentLeak(data.content)) return;
                setCmsContent(data.content);
            } catch {
                // ignore CMS failures and fallback to static content
            }
        };
        fetchCms();
    }, [cmsSlug, currentLang, API_BASE]);

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
                if (!pagesRes.ok) {
                    const errTxt = await pagesRes.text();
                    setCmsError(`Admin sayfaları okunamadı (${pagesRes.status}): ${errTxt}`);
                    return;
                }
                const pages = await pagesRes.json();
                const normalizedCmsSlug = String(cmsSlug || '').replace(/^\/+/, '');
                let page = (pages || []).find((p: any) => String(p?.slug || '').replace(/^\/+/, '') === normalizedCmsSlug);

                if (!page?.id) {
                    const createRes = await fetch(`${API_BASE}/admin/pages`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: consultingTitle || normalizedCmsSlug,
                            slug: normalizedCmsSlug,
                            meta_title: '',
                            meta_description: ''
                        })
                    });
                    if (!createRes.ok) {
                        const errTxt = await createRes.text();
                        setCmsError(`Admin sayfası oluşturulamadı (${createRes.status}): ${errTxt}`);
                        return;
                    }
                    const created = await createRes.json();
                    page = { id: created?.id };
                }

                setCmsPageId(Number(page.id));
                const res = await fetch(`${API_BASE}/admin/pages/${page.id}/content`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok && res.status !== 404) {
                    const errTxt = await res.text();
                    setCmsError(`Admin CMS içeriği okunamadı (${res.status}): ${errTxt}`);
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    let raw: any = null;
                    if (data?.content_json) {
                        if (typeof data.content_json === 'string') {
                            try {
                                raw = JSON.parse(data.content_json);
                            } catch {
                                raw = null;
                            }
                        } else if (typeof data.content_json === 'object') {
                            raw = data.content_json;
                        }
                    }
                    if (raw && typeof raw === 'object') {
                        setCmsAllContent(raw);
                        setCmsEditorData(raw[currentLang] || null);
                    }
                }
            } catch {
                setCmsError('Admin CMS içeriği okunamadı.');
            } finally {
                setCmsLoading(false);
            }
        };
        fetchAdminCms();
    }, [canShowCms, cmsSlug, currentLang, API_BASE]);

    const isPaymentSystems = consulting.productKey === 'consulting-odeme-sistemlerinde-buyume';
    const isB2B = consulting.productKey === 'consulting-b2b-sektorunde-buyume';
    const isManufacturing = consulting.productKey === 'consulting-uretim-sektorunde-buyume';
    const isFintech = consulting.productKey === 'consulting-fintech-sektorunde-buyume';
    const isSoftware = consulting.productKey === 'consulting-teknoloji-yazilim-buyume';
    const isEnergy = consulting.productKey === 'consulting-enerji-sektorunde-buyume';
    const isInteriorDesign = consulting.productKey === 'consulting-ofis-kurumsal-ic-tasarim-buyume';
    const isFleetRental = consulting.productKey === 'consulting-filo-kiralama-sektorunde-buyume';
    const isIndustrialFood = consulting.productKey === 'consulting-endustriyel-gida-sektorunde-buyume';

    /*
    const defaultFeatures = isEn
        ? [ ... ]
        : [ ... ];
    */

    const advancedFeatures = isEn
        ? [
            { title: 'Growth Marketing Foundations: Blueprint to Revenue', description: 'Build a practical strategic framework that links marketing actions directly to sales outcomes.', icon: <HiRocketLaunch /> },
            { title: 'Decision Unit Mapping and Stakeholder Prioritization', description: 'Identify buyer, influencer, and approver roles to sharpen targeting and pipeline quality.', icon: <HiUserGroup /> },
            { title: 'Pain-Point Discovery Workshop', description: 'Convert audience friction points into insight-backed messaging priorities.', icon: <HiPencilSquare /> },
            { title: 'Value Proposition Engineering', description: 'Design persuasive narratives with logical, emotional, and credibility triggers.', icon: <HiPresentationChartLine /> },
            { title: 'Role-Based Messaging Systems', description: 'Create role-specific copy structures for faster comprehension and stronger conversion intent.', icon: <HiPuzzlePiece /> },
            { title: 'Funnel Messaging by Stage and Channel', description: 'Align content, timing, and distribution with each funnel stage to reduce drop-off.', icon: <HiFunnel /> },
            { title: 'Baseline Metrics and Growth Dashboarding', description: 'Define measurement baselines and build decision-ready reporting workflows.', icon: <HiChartBar /> },
            { title: 'Three Core Marketing Objectives', description: 'Balance acquisition, expansion, and retention through a clear growth operating model.', icon: <HiBolt /> },
            { title: 'Website-Led Demand Architecture', description: 'Assign conversion roles to each key page and optimize your digital journey structure.', icon: <HiGlobeAlt /> },
            { title: 'Post-Lead Sequence Design', description: 'Run high-converting follow-up flows with timing psychology and multi-channel touchpoints.', icon: <HiComputerDesktop /> },
            { title: 'From First Contact to Closed Deal', description: 'Improve sales conversations through objection handling, sequencing, and disciplined follow-up.', icon: <HiChatBubbleLeftRight /> }
        ]
        : [
            { title: 'Büyüme Odaklı Pazarlamaya Giriş: Satışa Giden Yolun Haritası', description: 'Büyüme odaklı pazarlamanın temel çerçevesini kurun ve satışa giden yolu haritalayın.', icon: <HiRocketLaunch /> },
            { title: 'Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak', description: 'Karar verici ve onaylayıcı rolleri doğru ayrıştırarak hedef kitle analizini netleştirin.', icon: <HiUserGroup /> },
            { title: 'Egzersiz: Hedef Kitle Sorunlarını Not Etmek', description: 'Hedef kitlenin sorunlarını sistematik biçimde not ederek içgörü üretin.', icon: <HiPencilSquare /> },
            { title: 'Değer Önerisi: Ethos, Pathos, Logos ile Fark Yaratmak', description: 'Ethos, Pathos ve Logos yaklaşımıyla güçlü bir değer önerisi geliştirin.', icon: <HiPresentationChartLine /> },
            { title: 'Değer Önerisini Sistematik Kurmak: Pain Point ve Rol Bazlı Mesaj', description: 'Pain point odaklı ve rol bazlı mesajlarla değer önerinizi sistematik hale getirin.', icon: <HiPuzzlePiece /> },
            { title: 'Satış Hunisi: Mesajı Zaman, Mecra ve Aşamaya Göre Uyarlamak', description: 'Satış hunisinin her aşaması için doğru mesajı doğru mecrada sunun.', icon: <HiFunnel /> },
            { title: 'Başlangıç Metrikleri: Büyümenin Sayısal Pusulası', description: 'Büyümeyi ölçmek için temel metrikleri belirleyin ve takip sistemi kurun.', icon: <HiChartBar /> },
            { title: 'Pazarlamanın Üç Net Hedefi: Kazanmak, Derinleşmek, Korumak', description: 'Kazanma, derinleşme ve koruma hedeflerini dengeli bir büyüme modeliyle yönetin.', icon: <HiBolt /> },
            { title: 'Web Sitesi ile Büyümek: Web Sitesindeki Sayfaların Görevleri', description: 'Web sitenizdeki her sayfaya dönüşüm rolü atayın ve dijital yolculuğu optimize edin.', icon: <HiGlobeAlt /> },
            { title: 'Lead Sonrası Akış: Psikoloji, Zamanlama ve Çok Kanallı Temas', description: 'Lead sonrası yüksek dönüşüm sağlayan takip akışları ve çok kanallı temas tasarlayın.', icon: <HiComputerDesktop /> },
            { title: 'İlk Temastan Satışa: Etkili İletişim, İtiraz Yönetimi ve Takip', description: 'Her satış görüşmesini daha etkili kılmak için itiraz yönetimi ve takip sistemleri geliştirin.', icon: <HiChatBubbleLeftRight /> }
        ];

    const checkoutPath = `${langPrefix}/${activeSlugs.checkout ?? ''}`.replace(/\/{2,}/g, '/');

    const heroPriceFeatures = isEn
        ? [
            'Who It\'s For: CEO, CMO, CSO, Marketing and Sales Professionals',
            'Why Choose It: Hands-on, face-to-face consulting at your company premises.'
        ]
        : [
            'Kimler için Uygun: CEO, CMO, CSO, Pazarlama ve Satış Profesyonelleri',
            'Neden Tercih Edilmeli: Şirketinizde yüz yüze, uygulamalı danışmanlık desteği.'
        ];

    const sectorName = (() => {
        if (isPaymentSystems) return isEn ? 'Payment Systems' : 'Ödeme Sistemleri';
        if (isB2B) return isEn ? 'B2B' : 'B2B';
        if (isFintech) return isEn ? 'Fintech' : 'Fintech';
        if (isSoftware) return isEn ? 'Technology & Software' : 'Teknoloji & Yazılım';
        if (isManufacturing) return isEn ? 'Manufacturing' : 'Üretim';
        if (isEnergy) return isEn ? 'Energy' : 'Enerji';
        if (isInteriorDesign) return isEn ? 'Corporate Interior Design' : 'Ofis & Kurumsal İç Tasarım';
        if (isFleetRental) return isEn ? 'Fleet Rental' : 'Filo Kiralama';
        if (isIndustrialFood) return isEn ? 'Industrial Food' : 'Endüstriyel Gıda';
        return '';
    })();

    const introBlock = isEn
        ? {
            title: 'Consulting Program Content',
            description: 'Hands-on, face-to-face consulting sessions delivered at your company.',
            paragraphs: [
                `This consulting program is a systematic growth marketing framework delivered directly at your ${sectorName} company. Led by experienced CMO Bora Işık, the 10+1 session program is tailored for marketing and sales teams in your sector.`,
                'Throughout the consulting program, your team will learn:'
            ],
            bullets: [
                `How to read target audiences by role (CEO, CFO, CTO, and relevant ${sectorName.toLowerCase()} decision-makers)`,
                'How to structure strong value propositions and sales narratives',
                'How to adapt messages to funnel stages and channel context',
                'How to evaluate core marketing metrics such as CAC, LTV, ROAS, and ROI',
                'How to connect post-lead flow, sales conversations, and customer experience into one operating system'
            ],
            note: 'This program gives executives a strategic lens while providing managers and specialists with concrete frameworks they can apply immediately — all delivered face-to-face at your premises.',
            listTitle: 'Program Modules',
            listItems: [
                'Growth Marketing Foundations: Blueprint to Revenue',
                `Target Audience in ${sectorName}: Reading Decision-Makers and Approvers`,
                'Exercise: Mapping Audience Pain Points',
                'Value Proposition: Creating Differentiation with Ethos, Pathos, Logos',
                'Systematic Value Proposition: Pain-Point and Role-Based Messaging',
                'Sales Funnel: Adapting Messages by Time, Channel, and Stage',
                'Baseline Metrics: The Compass of Growth',
                'Three Core Marketing Objectives: Win, Deepen, Retain',
                'Growing with Your Website: The Role of Each Page',
                'Post-Lead Flow: Psychology, Timing, and Multi-Channel Touchpoints',
                'From First Contact to Closed Deal: Communication, Objection Handling, and Follow-Up'
            ]
        }
        : {
            title: 'Danışmanlık Programı İçeriği',
            description: 'Şirketinizde yüz yüze, uygulamalı danışmanlık seansları.',
            paragraphs: [
                `Bu danışmanlık programı, pazarlamayı ürün ya da teknolojiyle değil, doğrudan hedef kitleyle başlatan sistematik bir çerçeveyi şirketinizde sunar. Deneyimli CMO Bora Işık'ın perspektifiyle hazırlanmış 10+1 seanslık program, ${sectorName} sektöründeki tüm pazarlama ve satış profesyonellerine yönelik tasarlanmıştır.`,
                'Danışmanlık boyunca ekibiniz:'
            ],
            bullets: [
                `Hedef kitleyi rol bazında (CEO, CFO, CTO ve ${sectorName} sektörüne özel karar vericiler) nasıl okuyabileceğini`,
                'Güçlü değer ve satış önerilerini nasıl kurgulayabileceğini',
                'Mesajları satış hunisi aşamalarına ve mecralara nasıl uyarlayabileceğini',
                'Pazarlamanın temel metriklerini (CAC, LTV, ROAS, ROI) nasıl değerlendirebileceğini',
                'Lead sonrası akışı, satış görüşmelerini ve müşteri deneyimi yönetimini tek bir akış içinde ele almayı öğrenir.'
            ],
            note: `Bu program; ${sectorName} sektörü CEO/CMO/CSO'ları için stratejik bakış açısı, orta ve başlangıç düzeyindeki satış ve pazarlama yönetici ve uzmanları için uygulamaya dönük pratik çerçeveler sunar. Tüm içerik şirketinizde yüz yüze aktarılır.`,
            listTitle: 'Program Modülleri',
            listItems: [
                'Büyüme Odaklı Pazarlamaya Giriş: Satışa Giden Yolun Haritası',
                `${sectorName} Sektöründe Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak`,
                'Egzersiz: Hedef Kitle Sorunlarını Not Etmek',
                'Değer Önerisi: Ethos, Pathos, Logos ile Fark Yaratmak',
                'Değer Önerisini Sistematik Kurmak: Pain Point ve Rol Bazlı Mesaj',
                'Satış Hunisi: Mesajı Zaman, Mecra ve Aşamaya Göre Uyarlamak',
                'Başlangıç Metrikleri: Büyümenin Sayısal Pusulası',
                'Pazarlamanın Üç Net Hedefi: Kazanmak, Derinleşmek, Korumak',
                'Web Sitesi ile Büyümek: Web Sitesindeki Sayfaların Görevleri',
                'Lead Sonrası Akış: Psikoloji, Zamanlama ve Çok Kanallı Temas',
                'İlk Temastan Satışa: Etkili İletişim, İtiraz Yönetimi ve Takip'
            ]
        };

    const baseConfig = {
        hero: {
            title: consultingTitle,
            subtitle: isEn ? 'Growth-Focused Marketing Consulting' : 'Büyüme Odaklı Pazarlama Danışmanlığı',
            description: consultingSummary,
            buttonText: isEn ? 'Start Consulting' : 'Danışmanlığı Başlat',
            buttonLink: '#pricing',
            image: '/hero-image.png',
            badgeText: isEn ? 'On-Site Consulting' : 'Şirketinizde Danışmanlık',
            badgeIcon: <HiBriefcase />
        },
        breadcrumbs: [
            { label: isEn ? 'Consulting' : 'Danışmanlık', path: `/${activeSlugs.consulting ?? ''}` },
            { label: consultingTitle }
        ],
        videoShowcase: {
            tag: isEn ? 'Program Overview' : 'Danışmanlık Tanıtımı',
            title: (
                <>
                    {isEn
                        ? `Win in ${sectorName} with`
                        : `${sectorName} Sektöründe`}
                    <br />
                    {isEn
                        ? 'Growth-Focused Marketing Consulting'
                        : 'Büyüme Odaklı Pazarlama Danışmanlığı ile'}
                    <br />
                    {isEn ? 'to Reach Better Outcomes' : 'Başarıya Ulaşın'}
                </>
            ),
            description: isEn
                ? 'Generate more engagement and more conversions with face-to-face consulting sessions at your company. Our experts work directly with your team to build a growth-focused marketing system.'
                : 'Şirketinizde yüz yüze danışmanlık seanslarıyla daha fazla etkileşim, daha fazla dönüşüm elde edin. Uzmanlarımız ekibinizle birlikte büyüme odaklı pazarlama sistemi kurar.',
            videoUrl: 'https://player.vimeo.com/video/1045939223'
        },
        featuresSection: {
            tag: isEn ? 'Program Content' : 'Program İçeriği',
            title: isEn ? 'Consulting Program Modules' : 'Danışmanlık Programı Modülleri',
            description: isEn
                ? 'A field-ready curriculum designed to move teams from strategy to execution, delivered at your company.'
                : 'Temelden uygulamaya uzanan, şirketinizde sahada uygulanan danışmanlık akışı.',
            features: advancedFeatures,
            compact: false,
            introBlock
        },
        pricingSection: {
            tag: isEn ? 'Enrollment' : 'Kayıt',
            title: isEn ? 'Consulting Program' : 'Danışmanlık Programı',
            description: isEn
                ? 'Start the consulting program to build a growth-focused marketing system at your company.'
                : 'Danışmanlık programını başlatarak şirketinizde büyüme odaklı pazarlama sistemini kurun.',
            packages: [
                {
                    id: consulting.productKey,
                    name: consultingTitle,
                    price: '5.000 USD',
                    period: isEn ? 'one-time' : 'tek seferlik',
                    description: isEn
                        ? 'Consulting · Face-to-face, At Your Company'
                        : 'Danışmanlık · Yüz yüze, Şirketinizde',
                    isPopular: true,
                    icon: <HiBriefcase />,
                    features: isEn
                        ? [
                            '10+1 structured consulting sessions at your company',
                            'Applied tasks and practical frameworks',
                            'Sector-specific growth methodology',
                            'Performance measurement templates',
                            'Team-based implementation support'
                        ]
                        : [
                            'Şirketinizde 10+1 yüz yüze danışmanlık seansı',
                            'Uygulamalı görev ve çerçeveler',
                            'Sektör odaklı büyüme yaklaşımı',
                            'Ölçümleme şablonları',
                            'Ekip bazlı uygulama desteği'
                        ],
                    buttonText: isEn ? 'Get Started' : 'Başlayın',
                    buttonLink: checkoutPath
                }
            ]
        },
        heroPriceCard: {
            packageId: consulting.productKey,
            priceOnly: true,
            features: heroPriceFeatures
        },
        testimonial: {
            quote: isEn
                ? 'The on-site consulting sessions aligned our marketing and sales teams around one operating language. Lead quality and close rates improved noticeably.'
                : 'Şirketimizde gerçekleştirilen danışmanlık seansları sonrasında pazarlama ve satış ekiplerimizin dili aynılaştı; lead kalitesi ve kapanış oranları belirgin şekilde arttı.',
            author: isEn ? 'khilonfast Consulting Client' : 'khilonfast Danışmanlık Müşterisi',
            role: isEn ? 'Program Graduate' : 'Program Mezunu'
        },
        faqs: [
            {
                question: isEn ? 'How are the consulting sessions conducted?' : 'Danışmanlık seansları nasıl gerçekleştirilir?',
                answer: isEn
                    ? 'Sessions are conducted face-to-face at your company premises by our expert consultants.'
                    : 'Seanslar, uzman danışmanlarımız tarafından şirketinizde yüz yüze gerçekleştirilir.'
            },
            {
                question: isEn ? 'Which experience levels is this program suitable for?' : 'Program hangi seviyeye uygundur?',
                answer: isEn
                    ? 'The program is designed for both leadership and operational teams, combining strategy with real implementation.'
                    : 'Program hem yönetici seviyesine hem de operasyon ekiplerine uygundur; strateji ve uygulama birlikte ele alınır.'
            },
            {
                question: isEn ? 'How many people can participate?' : 'Kaç kişi katılabilir?',
                answer: isEn
                    ? 'The consulting program is structured for your full marketing and sales team to participate together for maximum alignment.'
                    : 'Danışmanlık programı, maksimum uyum sağlamak amacıyla pazarlama ve satış ekibinizin tamamının birlikte katılabileceği şekilde tasarlanmıştır.'
            }
        ],
        audienceTabsSection: {
            title: isEn ? 'Who Is This Consulting Program For?' : 'Bu Danışmanlık Programı Kimler İçin?',
            tabs: [
                {
                    label: 'CEO',
                    reasonTitle: isEn ? 'Why This Program?' : 'Neden Bu Program?',
                    reason: isEn ? 'To see the company\'s growth roadmap more clearly and align marketing with sales at the strategic level.' : 'Şirketin büyüme yol haritasını anlamak ve pazarlama-satış uyumunu en üst seviyede görmek için.',
                    outcomeTitle: isEn ? 'What Will They Gain?' : 'Ne Kazanacaklar?',
                    outcome: isEn ? 'They gain measurable marketing signals that support clearer decisions and better capital allocation.' : 'Daha net karar alma ve stratejik yatırımlar için ölçülebilir pazarlama verileriyle donanırlar.'
                },
                {
                    label: 'CMO',
                    reasonTitle: isEn ? 'Why This Program?' : 'Neden Bu Program?',
                    reason: isEn ? 'To improve ROAS and ROI while allocating marketing budgets with stronger operational discipline.' : 'Pazarlama bütçesini en verimli şekilde kullanmak ve ROAS/ROI metriklerini iyileştirmek için.',
                    outcomeTitle: isEn ? 'What Will They Gain?' : 'Ne Kazanacaklar?',
                    outcome: isEn ? 'They sharpen campaign design, audience messaging, and funnel optimization skills with a data-led approach.' : 'Veri odaklı kampanyalar oluşturma, hedef kitleye özel mesajlar geliştirme ve satış hunisini optimize etme becerisi kazanırlar.'
                },
                {
                    label: 'CSO',
                    reasonTitle: isEn ? 'Why This Program?' : 'Neden Bu Program?',
                    reason: isEn ? 'To help the sales team convert more leads coming from the marketing funnel.' : 'Satış ekibinin pazarlama hunisinden gelen lead\'leri daha yüksek oranda kapatmasını sağlamak için.',
                    outcomeTitle: isEn ? 'What Will They Gain?' : 'Ne Kazanacaklar?',
                    outcome: isEn ? 'They create a stronger shared language between marketing and sales and improve objection handling and follow-up execution.' : 'Pazarlama ve satış arasındaki dil birliğini sağlar, itiraz yönetimi ve etkili takip teknikleriyle donanırlar.'
                },
                {
                    label: isEn ? 'Marketing and Sales Managers' : 'Pazarlama ve Satış Yöneticileri',
                    reasonTitle: isEn ? 'Why This Program?' : 'Neden Bu Program?',
                    reason: isEn ? 'To align teams around one growth objective and run a more integrated demand-generation strategy.' : 'Ekiplerini ortak bir hedef doğrultusunda yönetmek ve bütünleşik bir büyüme stratejisi uygulamak için.',
                    outcomeTitle: isEn ? 'What Will They Gain?' : 'Ne Kazanacaklar?',
                    outcome: isEn ? 'They improve leadership, interpret performance signals more clearly, and guide teams with a shared operating framework.' : 'Liderlik becerilerini geliştirir, performans metriklerini yorumlayarak ekiplerine yol gösterir ve motive ederler.'
                },
                {
                    label: isEn ? 'Marketing and Sales Specialists' : 'Pazarlama ve Satış Uzmanları',
                    reasonTitle: isEn ? 'Why This Program?' : 'Neden Bu Program?',
                    reason: isEn ? 'To execute the integrated growth model with more confidence in day-to-day campaign and pipeline work.' : 'Günlük kampanya ve pipeline çalışmalarında büyüme modelini daha güvenle uygulamak için.',
                    outcomeTitle: isEn ? 'What Will They Gain?' : 'Ne Kazanacaklar?',
                    outcome: isEn ? 'They become more confident in implementation, reporting, and cross-functional collaboration around revenue goals.' : 'Uygulama, raporlama ve gelir hedefleri etrafında işlevler arası iş birliğinde daha güçlü hale gelirler.'
                }
            ]
        },
        approachSection: {
            compact: true,
            items: [
                {
                    title: isEn ? 'The Path\nto Revenue' : 'Satışa\nGiden Yol',
                    subtitle: '',
                    description: isEn
                        ? 'Learn the first steps of customer acquisition and the growth-minded go-to-market moves that create momentum.'
                        : 'Müşteri kazanımına giden ilk adımları keşfederek pazarlama ve büyüme odaklı giriş stratejilerini öğrenirsiniz.',
                    image: '/growth_strategies_handshake.png',
                    buttonText: isEn ? 'Get Started' : 'Başlayın',
                    buttonLink: '#pricing'
                },
                {
                    title: isEn ? 'Strategy, Audience,\nand Value Proposition' : 'Strateji, Hedef Kitle Ve\nDeğer Önerisi',
                    subtitle: '',
                    description: isEn
                        ? 'Build stronger messaging and learn how to reach each audience with a clearer value proposition.'
                        : 'Doğru mesajları oluşturmayı ve hedef kitleye net bir değer önerisiyle ulaşmayı keşfedersiniz.',
                    image: '/data_driven_marketing.png',
                    buttonText: isEn ? 'Get Started' : 'Başlayın',
                    buttonLink: '#pricing'
                },
                {
                    title: isEn ? 'Measurement\nand Goals' : 'Ölçüm Ve\nHedefler',
                    subtitle: '',
                    description: isEn
                        ? 'Understand the metrics that define success and use them to shape more effective growth decisions.'
                        : 'Başarıyı belirleyen metrikleri analiz ederek, büyüme odaklı pazarlama stratejilerini şekillendirmeyi öğrenirsiniz.',
                    image: '/why-khilon.png',
                    buttonText: isEn ? 'Get Started' : 'Başlayın',
                    buttonLink: '#pricing'
                },
                {
                    title: isEn ? 'Digital Infrastructure\nand Sales' : 'Dijital Altyapı\nVe Satış',
                    subtitle: '',
                    description: isEn
                        ? 'See how digital infrastructure, lead capture, and sales execution connect into one integrated revenue system.'
                        : 'Dijital altyapıdan lead toplamaya ve satışa kadar tüm süreci uçtan uca pazarlama-satış entegrasyonuyla görürsünüz.',
                    image: '/service-model.png',
                    buttonText: isEn ? 'Get Started' : 'Başlayın',
                    buttonLink: '#pricing'
                }
            ]
        }
    };

    const useOrFallback = (value: any, fallback: any) =>
        value !== undefined && value !== null && value !== '' ? value : fallback;

    const config = cmsContent
        ? {
            ...baseConfig,
            hero: {
                ...baseConfig.hero,
                title: useOrFallback(cmsContent?.hero?.title, baseConfig.hero.title),
                subtitle: useOrFallback(cmsContent?.hero?.subtitle, baseConfig.hero.subtitle),
                description: useOrFallback(cmsContent?.hero?.description, baseConfig.hero.description),
                buttonText: useOrFallback(cmsContent?.hero?.buttonText, baseConfig.hero.buttonText),
                buttonLink: useOrFallback(cmsContent?.hero?.buttonLink, baseConfig.hero.buttonLink),
                badgeText: useOrFallback(cmsContent?.hero?.badgeText, baseConfig.hero.badgeText),
                image: useOrFallback(cmsContent?.hero?.image, baseConfig.hero.image)
            },
            videoShowcase: {
                ...baseConfig.videoShowcase,
                tag: useOrFallback(cmsContent?.videoShowcase?.tag, baseConfig.videoShowcase.tag),
                title: <>{useOrFallback(cmsContent?.videoShowcase?.title, baseConfig.videoShowcase.title)}</>,
                description: useOrFallback(cmsContent?.videoShowcase?.description, baseConfig.videoShowcase.description),
                videoUrl: useOrFallback(cmsContent?.videoShowcase?.videoUrl, baseConfig.videoShowcase.videoUrl)
            },
            featuresSection: {
                ...baseConfig.featuresSection,
                tag: useOrFallback(cmsContent?.featuresSection?.tag, baseConfig.featuresSection.tag),
                title: useOrFallback(cmsContent?.featuresSection?.title, baseConfig.featuresSection.title),
                description: useOrFallback(cmsContent?.featuresSection?.description, baseConfig.featuresSection.description),
                features: Array.isArray(cmsContent?.featuresSection?.features) && cmsContent.featuresSection.features.length > 0
                    ? cmsContent.featuresSection.features.map((f: any, idx: number) => ({
                        title: f.title,
                        description: f.description,
                        icon: (baseConfig.featuresSection.features?.[idx]?.icon) || baseConfig.featuresSection.features?.[0]?.icon
                    }))
                    : baseConfig.featuresSection.features
            },
            pricingSection: {
                ...baseConfig.pricingSection,
                tag: useOrFallback(cmsContent?.pricingSection?.tag, baseConfig.pricingSection.tag),
                title: useOrFallback(cmsContent?.pricingSection?.title, baseConfig.pricingSection.title),
                description: useOrFallback(cmsContent?.pricingSection?.description, baseConfig.pricingSection.description)
            },
            testimonial: {
                ...baseConfig.testimonial,
                quote: useOrFallback(cmsContent?.testimonial?.quote, baseConfig.testimonial.quote),
                author: useOrFallback(cmsContent?.testimonial?.author, baseConfig.testimonial.author),
                role: useOrFallback(cmsContent?.testimonial?.role, baseConfig.testimonial.role)
            },
            faqs: Array.isArray(cmsContent?.faqs) && cmsContent.faqs.length > 0 ? cmsContent.faqs : baseConfig.faqs
        }
        : baseConfig;

    // Suppress unused variable warnings for CMS state used in future admin UI
    void cmsAllContent;
    void cmsEditorData;
    void cmsPageId;
    void cmsSection;
    void activeFeatureIndex;
    void activeFaqIndex;
    void cmsSaving;
    void cmsLoading;
    void cmsError;
    void resolvedSlugKey;

    return (
        <ServicePageTemplate
            {...config}
        />
    );
}
