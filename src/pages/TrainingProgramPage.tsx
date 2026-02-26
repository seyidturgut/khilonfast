import { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiAcademicCap,
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
import { trainingPrograms } from '../data/trainingPrograms';
import trCommon from '../locales/tr/common.json';
import enCommon from '../locales/en/common.json';

export default function TrainingProgramPage() {
    const location = useLocation();
    const { i18n } = useTranslation('common');
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr';
    const isEn = currentLang === 'en';
    const langPrefix = isEn ? '/en' : '';
    const activeSlugs = (isEn ? enCommon.slugs : trCommon.slugs) as Record<string, string>;

    useEffect(() => {
        const activeLang = i18n.language.split('-')[0];
        if (activeLang !== currentLang) {
            i18n.changeLanguage(currentLang);
        }
    }, [currentLang, i18n]);

    const trSlugs = trCommon.slugs as Record<string, string>;
    const enSlugs = enCommon.slugs as Record<string, string>;

    const trainingSlugKeys = [
        'trainingGrowth',
        'trainingPayment',
        'trainingB2B',
        'trainingFintech',
        'trainingTech',
        'trainingManufacturing',
        'trainingEnergy',
        'trainingDesign',
        'trainingFleet',
        'trainingFood'
    ] as const;

    const trainingMenuKeyBySlugKey: Record<(typeof trainingSlugKeys)[number], string> = {
        trainingGrowth: 'growth',
        trainingPayment: 'payment',
        trainingB2B: 'b2b',
        trainingFintech: 'fintech',
        trainingTech: 'tech',
        trainingManufacturing: 'manufacturing',
        trainingEnergy: 'energy',
        trainingDesign: 'design',
        trainingFleet: 'fleet',
        trainingFood: 'food'
    };

    const normalizedPath = location.pathname
        .replace(/^\/en(\/|$)/, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');

    const normalizedCandidates = [
        normalizedPath,
        normalizedPath.replace(/^(egitimler|trainings)\//, '')
    ];

    const matchedTrainingKey = trainingSlugKeys.find((key) =>
        normalizedCandidates.some(
            (candidate) => trSlugs[key] === candidate || enSlugs[key] === candidate
        )
    );

    const training = useMemo(() => {
        if (matchedTrainingKey) {
            const resolvedPath = `/${trSlugs[matchedTrainingKey]}`;
            const bySlugKey = trainingPrograms.find((item) => item.path === resolvedPath);
            if (bySlugKey) return bySlugKey;
        }

        const byPath = trainingPrograms.find((item) =>
            normalizedCandidates.some((candidate) => {
                const normalizedItem = item.path.replace(/^\/+/, '');
                const normalizedItemNoPrefix = normalizedItem.replace(/^(egitimler|trainings)\//, '');
                return candidate === normalizedItem || candidate === normalizedItemNoPrefix;
            })
        );
        return byPath ?? trainingPrograms[0];
    }, [matchedTrainingKey, normalizedCandidates.join('|'), trSlugs]);

    const resolvedSlugKey =
        matchedTrainingKey ??
        trainingSlugKeys.find((key) => `/${trSlugs[key]}` === training.path) ??
        'trainingGrowth';

    const menuKeyByProductKey: Record<string, string> = {
        'training-buyume-odakli-pazarlama': 'growth',
        'training-odeme-sistemlerinde-buyume': 'payment',
        'training-b2b-sektorunde-buyume': 'b2b',
        'training-fintech-sektorunde-buyume': 'fintech',
        'training-teknoloji-yazilim-buyume': 'tech',
        'training-uretim-sektorunde-buyume': 'manufacturing',
        'training-enerji-sektorunde-buyume': 'energy',
        'training-ofis-kurumsal-ic-tasarim-buyume': 'design',
        'training-filo-kiralama-sektorunde-buyume': 'fleet',
        'training-endustriyel-gida-sektorunde-buyume': 'food'
    };

    const trainingMenuKey =
        menuKeyByProductKey[training.productKey] ??
        trainingMenuKeyBySlugKey[resolvedSlugKey];
    const trainingMenuCopy = (isEn ? enCommon.header.menuItems.trainings : trCommon.header.menuItems.trainings) as Record<
        string,
        { title: string; desc: string }
    >;
    const trainingTitle = trainingMenuCopy?.[trainingMenuKey]?.title ?? training.title;
    const trainingSummary = trainingMenuCopy?.[trainingMenuKey]?.desc ?? training.summary;

    const cmsSlug = matchedTrainingKey ? trSlugs[matchedTrainingKey] : (normalizedCandidates[0] || '');
    const cmsSlugEncoded = encodeURIComponent(cmsSlug);
    const [cmsContent, setCmsContent] = useState<any | null>(null);
    const isCmsMode = new URLSearchParams(location.search).get('cms') === '1';
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null);
    const [cmsEditorData, setCmsEditorData] = useState<any | null>(null);
    const [cmsPageId, setCmsPageId] = useState<number | null>(null);
    const [cmsSection, setCmsSection] = useState<'hero' | 'video' | 'features' | 'faqs'>('hero');
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
    const [activeFaqIndex, setActiveFaqIndex] = useState(0);
    const [cmsSaving, setCmsSaving] = useState(false);
    const [cmsLoading, setCmsLoading] = useState(false);
    const [cmsError, setCmsError] = useState('');
    const canShowCms = isCmsMode && typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));

    useEffect(() => {
        const fetchCms = async () => {
            if (!cmsSlug) return;
            try {
                const res = await fetch(`${API_BASE}/pages/slug/${cmsSlugEncoded}?lang=${currentLang}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.content) setCmsContent(data.content);
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
                            title: trainingTitle || normalizedCmsSlug,
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

    const isPaymentSystemsTraining = training.productKey === 'training-odeme-sistemlerinde-buyume';
    const isFintechTraining = training.productKey === 'training-fintech-sektorunde-buyume';
    const isSoftwareTraining = training.productKey === 'training-teknoloji-yazilim-buyume';
    const isEnergyTraining = training.productKey === 'training-enerji-sektorunde-buyume';
    const isInteriorDesignTraining = training.productKey === 'training-ofis-kurumsal-ic-tasarim-buyume';
    const isFleetRentalTraining = training.productKey === 'training-filo-kiralama-sektorunde-buyume';
    const isIndustrialFoodTraining = training.productKey === 'training-endustriyel-gida-sektorunde-buyume';

    const defaultFeatures = isEn
        ? [
            {
                title: 'Audience Architecture and Segmentation',
                description: 'Define decision-maker and influencer personas precisely to build channel-fit messaging.',
                icon: <HiUserGroup />
            },
            {
                title: 'Value Proposition and Message Design',
                description: 'Craft differentiated value narratives that turn attention into commercial intent.',
                icon: <HiRocketLaunch />
            },
            {
                title: 'Sales Funnel Blueprint',
                description: 'Design stage-specific actions for awareness, consideration, and conversion.',
                icon: <HiFunnel />
            },
            {
                title: 'Measurement and Optimization System',
                description: 'Use KPI-driven iteration loops to sustain predictable, compounding growth.',
                icon: <HiChartBar />
            }
        ]
        : [
            {
                title: 'Hedef Kitle ve Segmentasyon',
                description: 'Karar verici ve etkileyici rolleri doğru analiz ederek kanal planı oluşturma.',
                icon: <HiUserGroup />
            },
            {
                title: 'Değer Önerisi ve Mesaj Kurgusu',
                description: 'Fark yaratan teklif metni ve iletişim çerçevesi geliştirme.',
                icon: <HiRocketLaunch />
            },
            {
                title: 'Satış Hunisi Tasarımı',
                description: 'Awareness, consideration ve conversion aşamaları için aksiyon planı.',
                icon: <HiFunnel />
            },
            {
                title: 'Ölçümleme ve Optimizasyon',
                description: 'Performans metrikleriyle düzenli iyileştirme ve sürdürülebilir büyüme.',
                icon: <HiChartBar />
            }
        ];

    const advancedFeatures = isEn
        ? [
            {
                title: 'Growth Marketing Foundations: Blueprint to Revenue',
                description: 'Build a practical strategic framework that links marketing actions directly to sales outcomes.',
                icon: <HiRocketLaunch />
            },
            {
                title: 'Decision Unit Mapping and Stakeholder Prioritization',
                description: 'Identify buyer, influencer, and approver roles to sharpen targeting and pipeline quality.',
                icon: <HiUserGroup />
            },
            {
                title: 'Pain-Point Discovery Workshop',
                description: 'Convert audience friction points into insight-backed messaging priorities.',
                icon: <HiPencilSquare />
            },
            {
                title: 'Value Proposition Engineering',
                description: 'Design persuasive narratives with logical, emotional, and credibility triggers.',
                icon: <HiPresentationChartLine />
            },
            {
                title: 'Role-Based Messaging Systems',
                description: 'Create role-specific copy structures for faster comprehension and stronger conversion intent.',
                icon: <HiPuzzlePiece />
            },
            {
                title: 'Funnel Messaging by Stage and Channel',
                description: 'Align content, timing, and distribution with each funnel stage to reduce drop-off.',
                icon: <HiFunnel />
            },
            {
                title: 'Baseline Metrics and Growth Dashboarding',
                description: 'Define measurement baselines and build decision-ready reporting workflows.',
                icon: <HiChartBar />
            },
            {
                title: 'Three Core Marketing Objectives',
                description: 'Balance acquisition, expansion, and retention through a clear growth operating model.',
                icon: <HiBolt />
            },
            {
                title: 'Website-Led Demand Architecture',
                description: 'Assign conversion roles to each key page and optimize your digital journey structure.',
                icon: <HiGlobeAlt />
            },
            {
                title: 'Post-Lead Sequence Design',
                description: 'Run high-converting follow-up flows with timing psychology and multi-channel touchpoints.',
                icon: <HiComputerDesktop />
            },
            {
                title: 'From First Contact to Closed Deal',
                description: 'Improve sales conversations through objection handling, sequencing, and disciplined follow-up.',
                icon: <HiChatBubbleLeftRight />
            }
        ]
        : [
            {
                title: 'Büyüme Odaklı Pazarlamaya Giriş: Satışa Giden Yolun Haritası',
                description: 'Büyüme odaklı pazarlamanın temel çerçevesini kurun ve satışa giden yolu haritalayın.',
                icon: <HiRocketLaunch />
            },
            {
                title: isPaymentSystemsTraining
                    ? 'Ödeme Sistemlerinde Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak'
                    : 'Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak',
                description: isPaymentSystemsTraining
                    ? 'Ödeme sistemleri ekosisteminde karar verici ve onaylayıcı rolleri doğru ayrıştırın.'
                    : 'Karar verici ve onaylayıcı rolleri doğru ayrıştırarak hedef kitle analizini netleştirin.',
                icon: <HiUserGroup />
            },
            {
                title: 'Egzersiz: Hedef Kitle Sorunlarını Not Etmek',
                description: 'Hedef kitlenin sorunlarını sistematik biçimde not ederek içgörü üretin.',
                icon: <HiPencilSquare />
            },
            {
                title: 'Değer Önerisi: Ethos, Pathos, Logos ile Fark Yaratmak',
                description: 'Ethos, Pathos ve Logos yaklaşımıyla güçlü bir değer önerisi geliştirin.',
                icon: <HiPresentationChartLine />
            },
            {
                title: 'Değer Önerisini Sistematik Kurmak: Pain Point ve Rol Bazlı Mesaj',
                description: 'Pain point odaklı ve rol bazlı mesajlarla değer önerinizi sistematik hale getirin.',
                icon: <HiPuzzlePiece />
            },
            {
                title: 'Satış Hunisi: Mesajı Zaman, Mecra ve Aşamaya Göre Uyarlamak',
                description: 'Mesajınızı doğru zamanda, doğru mecrada ve doğru aşamada konumlandırın.',
                icon: <HiFunnel />
            },
            {
                title: 'Başlangıç Metrikleri: Büyümenin Sayısal Pusulası',
                description: 'Büyümeyi ölçmek için başlangıç metriklerini belirleyin ve takip modelini kurun.',
                icon: <HiChartBar />
            },
            {
                title: 'Pazarlamanın Üç Net Hedefi: Kazanmak, Derinleşmek, Korumak',
                description: 'Kazanım, derinleşme ve koruma ekseninde pazarlama hedeflerinizi netleştirin.',
                icon: <HiBolt />
            },
            {
                title: 'Web Sitesi ile Büyümek: Web Sitesindeki Sayfaların Görevleri',
                description: 'Web sitesi sayfalarının rollerini netleştirerek dönüşüm akışını iyileştirin.',
                icon: <HiGlobeAlt />
            },
            {
                title: 'Lead Sonrası Akış: Psikoloji, Zamanlama ve Çok Kanallı Temas',
                description: 'Lead sonrası süreçte psikoloji, zamanlama ve çok kanallı temas dengesini kurun.',
                icon: <HiComputerDesktop />
            },
            {
                title: 'İlk Temastan Satışa: Etkili İletişim, İtiraz Yönetimi ve Takip',
                description: 'İlk temastan satış kapanışına kadar iletişim, itiraz yönetimi ve takibi yönetin.',
                icon: <HiChatBubbleLeftRight />
            }
        ];

    const shouldUseAdvancedFeatures =
        isPaymentSystemsTraining ||
        isFintechTraining ||
        isSoftwareTraining ||
        isEnergyTraining ||
        isInteriorDesignTraining ||
        isFleetRentalTraining ||
        isIndustrialFoodTraining;

    const checkoutPath = `${langPrefix}/${activeSlugs.checkout ?? ''}`.replace(/\/{2,}/g, '/');

    const baseConfig = {
        hero: {
            title: trainingTitle,
            subtitle: isEn ? 'Growth-Focused Marketing Training Program' : 'Büyüme Odaklı Pazarlama Eğitimi',
            description: trainingSummary,
            buttonText: isEn ? 'Join Program' : 'Programa Katıl',
            buttonLink: '#pricing',
            image: '/hero-image.png',
            badgeText: isEn ? '10+1 Module Training' : '10+1 Modül Eğitim',
            badgeIcon: <HiAcademicCap />
        },
        breadcrumbs: [
            { label: isEn ? 'Trainings' : 'Eğitimlerimiz', path: `/${activeSlugs.trainings ?? ''}` },
            { label: trainingTitle }
        ],
        videoShowcase: {
            tag: isEn ? 'Program Overview' : 'Eğitim Tanıtımı',
            title: <>{isEn ? 'Applied Training Program Built for Revenue Outcomes' : 'Satışa Giden Yol için Uygulamalı Eğitim Programı'}</>,
            description: isEn
                ? 'This program builds a scalable growth system around audience strategy, value proposition, and performance measurement to accelerate your team\'s sales outcomes.'
                : 'Pazarlama stratejisini hedef kitle, değer önerisi ve ölçümleme odaklı kuran bu program; ekiplerinizi satışa daha hızlı taşıyan sistematik bir yöntem sunar.',
            videoUrl: ({
                'training-odeme-sistemlerinde-buyume': 'https://vimeo.com/1133021053?fl=pl&fe=cm',
                'training-b2b-sektorunde-buyume': 'https://vimeo.com/1133021053?fl=pl&fe=cm',
                'training-fintech-sektorunde-buyume': 'https://vimeo.com/1135500461?share=copy&fl=sv&fe=ci',
                'training-teknoloji-yazilim-buyume': 'https://vimeo.com/1135504861'
            } as Record<string, string>)[training.productKey] || 'https://player.vimeo.com/video/1045939223'
        },
        featuresSection: {
            tag: isEn ? 'Program Content' : 'Program İçeriği',
            title: isEn ? 'Modules Included in the Training' : 'Eğitimde Yer Alan Modüller',
            description: isEn
                ? 'A field-ready curriculum designed to move teams from strategy to execution.'
                : 'Temelden uygulamaya uzanan, sahada uygulanabilir eğitim akışı.',
            features: shouldUseAdvancedFeatures ? advancedFeatures : defaultFeatures
        },
        pricingSection: {
            tag: isEn ? 'Registration' : 'Kayıt',
            title: isEn ? 'Training Program' : 'Eğitim Programı',
            description: isEn
                ? 'Enroll to establish a growth-focused marketing operating model across your team.'
                : 'Eğitime katılarak ekibiniz için büyüme odaklı pazarlama sistemini kurun.',
            packages: [
                {
                    id: training.productKey,
                    name: trainingTitle,
                    price: '5.000 TL',
                    period: isEn ? 'one-time' : 'tek seferlik',
                    description: isEn
                        ? 'Includes video modules, practical frameworks, and an execution playbook.'
                        : 'Video modüller, pratik şablonlar ve uygulama rehberi içerir.',
                    isPopular: true,
                    icon: <HiAcademicCap />,
                    features: isEn
                        ? [
                            '10+1 structured training modules',
                            'Applied tasks and practical examples',
                            'Sector-specific growth methodology',
                            'Performance measurement templates',
                            'Team-friendly implementation structure'
                        ]
                        : [
                            '10+1 modül eğitim içeriği',
                            'Uygulamalı görev ve örnekler',
                            'Sektör odaklı büyüme yaklaşımı',
                            'Ölçümleme şablonları',
                            'Ekip kullanımına uygun içerik yapısı'
                        ],
                    buttonText: isEn ? 'Buy Now' : 'Satın Al',
                    buttonLink: checkoutPath
                }
            ]
        },
        heroPriceCard: {
            packageId: training.productKey,
            priceOnly: true
        },
        testimonial: {
            quote: isEn
                ? 'After the training, our marketing and sales teams aligned around one operating language; lead quality and close rates improved noticeably.'
                : 'Eğitim sonrası pazarlama ve satış ekiplerimizin dili aynılaştı; lead kalitesi ve kapanış oranları belirgin şekilde arttı.',
            author: isEn ? 'khilonfast Participant' : 'khilonfast Katılımcısı',
            role: isEn ? 'Program Graduate' : 'Program Mezunu'
        },
        faqs: [
            {
                question: isEn ? 'When is program access activated?' : 'Eğitime erişim ne zaman açılır?',
                answer: isEn
                    ? 'Your access is activated shortly after enrollment so you can begin immediately.'
                    : 'Kayıt sonrası erişiminiz kısa sürede aktif edilir ve eğitim modüllerine hemen başlayabilirsiniz.'
            },
            {
                question: isEn ? 'Which experience levels is this training suitable for?' : 'Eğitim içeriği hangi seviyeye uygundur?',
                answer: isEn
                    ? 'The program is designed for both leadership and operational teams, combining strategy with real implementation.'
                    : 'Program hem yönetici seviyesine hem de operasyon ekiplerine uygundur; strateji ve uygulama birlikte ele alınır.'
            },
            {
                question: isEn ? 'Is it suitable for corporate teams?' : 'Kurumsal ekipler için uygun mu?',
                answer: isEn
                    ? 'Yes. The structure is optimized for team-based adoption and cross-functional execution.'
                    : 'Evet. İçerik ekip içi kullanım için yapılandırılmıştır ve ortak çalışma akışı sağlar.'
            }
        ]
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
                tag: useOrFallback(cmsContent?.featuresSection?.tag, baseConfig.featuresSection?.tag),
                title: useOrFallback(cmsContent?.featuresSection?.title, baseConfig.featuresSection?.title),
                description: useOrFallback(cmsContent?.featuresSection?.description, baseConfig.featuresSection?.description),
                features: Array.isArray(cmsContent?.featuresSection?.features) && cmsContent.featuresSection.features.length > 0
                    ? cmsContent.featuresSection.features.map((f: any, idx: number) => ({
                        title: f.title,
                        description: f.description,
                        icon: (baseConfig.featuresSection?.features?.[idx]?.icon) || baseConfig.featuresSection?.features?.[0]?.icon
                    }))
                    : baseConfig.featuresSection?.features
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

    const defaultEditorData = {
        hero: {
            title: baseConfig.hero.title,
            subtitle: String(baseConfig.hero.subtitle),
            description: baseConfig.hero.description,
            buttonText: baseConfig.hero.buttonText,
            buttonLink: baseConfig.hero.buttonLink,
            badgeText: baseConfig.hero.badgeText,
            image: baseConfig.hero.image
        },
        videoShowcase: {
            tag: baseConfig.videoShowcase.tag,
            title: isEn ? 'Applied Training Program Built for Revenue Outcomes' : 'Satışa Giden Yol için Uygulamalı Eğitim Programı',
            description: baseConfig.videoShowcase.description,
            videoUrl: baseConfig.videoShowcase.videoUrl
        },
        featuresSection: {
            tag: baseConfig.featuresSection.tag,
            title: baseConfig.featuresSection.title,
            description: baseConfig.featuresSection.description,
            features: (baseConfig.featuresSection.features || []).map((f: any) => ({ title: f.title, description: f.description }))
        },
        pricingSection: {
            tag: baseConfig.pricingSection.tag,
            title: baseConfig.pricingSection.title,
            description: baseConfig.pricingSection.description
        },
        testimonial: {
            quote: baseConfig.testimonial.quote,
            author: baseConfig.testimonial.author,
            role: baseConfig.testimonial.role
        },
        faqs: baseConfig.faqs
    };

    useEffect(() => {
        if (!isCmsMode) return;
        if (!cmsEditorData) {
            setCmsEditorData(defaultEditorData);
            return;
        }
        setCmsContent(cmsEditorData);
    }, [isCmsMode, cmsEditorData, currentLang]);

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

    const updateFeature = (index: number, field: 'title' | 'description', value: string) => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const features = Array.isArray(base?.featuresSection?.features)
                ? [...base.featuresSection.features]
                : [];
            const current = features[index] || { title: '', description: '' };
            features[index] = { ...current, [field]: value };
            return {
                ...base,
                featuresSection: {
                    ...(base.featuresSection || {}),
                    features
                }
            };
        });
    };

    const addFeature = () => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const features = Array.isArray(base?.featuresSection?.features)
                ? [...base.featuresSection.features]
                : [];
            features.push({ title: '', description: '' });
            return {
                ...base,
                featuresSection: {
                    ...(base.featuresSection || {}),
                    features
                }
            };
        });
    };

    const removeFeature = (index: number) => {
        setCmsEditorData((prev: any) => {
            const base = prev || defaultEditorData;
            const features = Array.isArray(base?.featuresSection?.features)
                ? base.featuresSection.features.filter((_: any, i: number) => i !== index)
                : [];
            return {
                ...base,
                featuresSection: {
                    ...(base.featuresSection || {}),
                    features
                }
            };
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

    const handleCmsSave = async () => {
        if (!canShowCms || !cmsSlug || !cmsEditorData) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setCmsError('Kaydetmek için admin girişi gerekli.');
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
                        title: trainingTitle || cmsSlug,
                        slug: cmsSlug,
                        meta_title: '',
                        meta_description: ''
                    })
                });
                if (!createRes.ok) {
                    const errTxt = await createRes.text();
                    setCmsError(`Sayfa oluşturulamadı (${createRes.status}): ${errTxt}`);
                    return;
                }
                const created = await createRes.json();
                nextPageId = Number(created?.id || 0);
                if (!nextPageId) {
                    setCmsError('Sayfa oluşturuldu ama ID alınamadı.');
                    return;
                }
                setCmsPageId(nextPageId);
            }

            const res = await fetch(`${API_BASE}/admin/pages/${nextPageId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    content_json: nextAll,
                    is_published: true
                })
            });
            if (!res.ok) {
                const errTxt = await res.text();
                setCmsError(`Kaydetme başarısız (${res.status}): ${errTxt}`);
                return;
            }
            setCmsAllContent(nextAll);
            setCmsContent(cmsEditorData);
        } catch {
            setCmsError('Kaydetme başarısız oldu.');
        } finally {
            setCmsSaving(false);
        }
    };

    const handleCmsImageUpload = async (file?: File) => {
        if (!file) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setCmsError('Upload için admin girişi gerekli.');
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
                    setCmsError('Görsel upload başarısız oldu.');
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
                setCmsError('Görsel upload başarısız oldu.');
            }
        };
        reader.readAsDataURL(file);
    };
    return (
        <>
            <ServicePageTemplate
                {...config}
                serviceKey={training.productKey}
                disableApiHeroTextOverride
                cmsMode={canShowCms}
                onCmsEditSection={(section) => setCmsSection(section)}
            />
            {canShowCms && (
                <div style={{
                    position: 'fixed',
                    top: 90,
                    right: 16,
                    width: 400,
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
                    {cmsLoading && <div style={{ fontSize: 13, marginBottom: 8 }}>Yükleniyor...</div>}
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
        </>
    );
}
