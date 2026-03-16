import { HiRocketLaunch, HiChartBar, HiMagnifyingGlass, HiSparkles, HiCommandLine, HiXMark } from 'react-icons/hi2'
import Breadcrumbs from '../components/Breadcrumbs'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { resolveLocalizedText } from '../utils/localizedContent'
import { API_BASE_URL } from '../config/api'
import './About.css'

const ABOUT_TEXT_KEYS = [
    'header.about',
    'common.explore',
    'common.startNow',
    'common.contactUs',
    'aboutPage.hero.title',
    'aboutPage.hero.description',
    'aboutPage.who.title', 'aboutPage.who.description',
    'aboutPage.who.feature1.title', 'aboutPage.who.feature1.desc',
    'aboutPage.who.feature2.title', 'aboutPage.who.feature2.desc',
    'aboutPage.who.feature3.title', 'aboutPage.who.feature3.desc',
    'aboutPage.who.feature4.title', 'aboutPage.who.feature4.desc',
    'aboutPage.birth.title',
    'aboutPage.birth.card1.title', 'aboutPage.birth.card1.desc',
    'aboutPage.birth.card2.title', 'aboutPage.birth.card2.desc',
    'aboutPage.birth.card3.title', 'aboutPage.birth.card3.desc',
    'aboutPage.quote.title', 'aboutPage.quote.highlight',
    'aboutPage.model.title', 'aboutPage.model.description',
    'aboutPage.model.sub1.title', 'aboutPage.model.sub1.desc',
    'aboutPage.model.sub2.title', 'aboutPage.model.sub2.desc',
    'aboutPage.why.title', 'aboutPage.why.description',
    'aboutPage.why.stat1.title', 'aboutPage.why.stat1.desc',
    'aboutPage.why.stat2.title', 'aboutPage.why.stat2.desc',
    'aboutPage.why.stat3.title', 'aboutPage.why.stat3.desc',
    'aboutPage.why.stat4.title', 'aboutPage.why.stat4.desc',
    'aboutPage.quickBanner.title',
    'aboutPage.notFor.title', 'aboutPage.notFor.description',
    'aboutPage.notFor.item1.title', 'aboutPage.notFor.item1.desc',
    'aboutPage.notFor.item2.title', 'aboutPage.notFor.item2.desc',
    'aboutPage.notFor.item3.title', 'aboutPage.notFor.item3.desc',
    'aboutPage.brandStatement.title',
    'aboutPage.discover.title', 'aboutPage.discover.description'
] as const

export default function About() {
    const { t, i18n } = useTranslation('common');
    const location = useLocation();
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr';
    const langPrefix = currentLang === 'en' ? '/en' : '';
    const toLocalized = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/');
    const isCmsMode = new URLSearchParams(location.search).get('cms') === '1';
    const canShowCms = isCmsMode && typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));
    const API_BASE = API_BASE_URL;
    const [cmsPageId, setCmsPageId] = useState<number | null>(null);
    const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null);
    const [cmsTexts, setCmsTexts] = useState<Record<string, string> | null>(null);
    const [cmsSaving, setCmsSaving] = useState(false);
    const tx = (key: string) => resolveLocalizedText({
        locale: currentLang,
        cmsValue: cmsTexts?.[key],
        t,
        localeKey: key
    });

    useEffect(() => {
        const activeLang = i18n.language.split('-')[0];
        if (activeLang !== currentLang) {
            void i18n.changeLanguage(currentLang);
        }
    }, [currentLang, i18n]);

    const defaultTexts = ABOUT_TEXT_KEYS.reduce((acc, key) => {
        acc[key] = t(key);
        return acc;
    }, {} as Record<string, string>);
    const staticCopy = currentLang === 'en'
        ? {
            teamAlt: 'Team visual representing the khilonfast strategy and marketing vision',
            birthCards: [
                {
                    imageAlt: 'From traditional to digital',
                    title: 'From Traditional to Digital',
                    description: 'More than 20 years of experience showed us that companies need deep changes in the way they approach marketing. We founded Khilonfast after recognizing that traditional methods were too slow and inefficient. Our goal is to solve marketing problems with innovative and fast solutions by helping companies:',
                    bullets: [
                        'Increase brand awareness',
                        'Support sustainable growth',
                        'Help existing customers get more value from their services'
                    ]
                },
                {
                    imageAlt: 'Innovation and speed',
                    title: 'Innovation and Speed',
                    description: 'Khilonfast is a business partner that operates at the speed of modern business. Knowing the cost of slow processes, we design our services around changing business dynamics. From day one, we have differentiated ourselves through these values:',
                    bullets: [
                        'Innovation: Helping businesses reach goals through strategic, modern, and creative solutions.',
                        'Speed: Removing friction from business processes through rapid action.',
                        'Result Orientation: Delivering measurable and sustainable outcomes.'
                    ]
                },
                {
                    imageAlt: 'An inspiring journey',
                    title: 'An Inspiring Journey',
                    description: 'Khilonfast was founded to challenge the limits of traditional methods and respond to the needs of modern businesses. Our inspiration comes from:',
                    bullets: [
                        'Faster growth: Helping businesses grow more quickly',
                        'Broader reach: Enabling access to wider audiences',
                        'Sustainable success: Making success repeatable and durable'
                    ],
                    outro: 'We continue writing success stories together with our clients on this journey.'
                }
            ],
            modelImageAlt: 'Visual describing khilonfast membership-based strategy and marketing service model',
            modelDetail: {
                title: 'Strategy and Marketing Services',
                description: 'Khilonfast removes the burden of agency and team management by delivering strategy and execution through a membership-based service model.',
                strategyTitle: 'Strategy Services',
                strategyDescription: 'Creating a sector-specific marketing strategy aligned with your short-term and long-term goals.',
                marketingTitle: 'Marketing Services',
                marketingItems: [
                    'Support in implementing and managing the prepared strategy.',
                    'Membership-based sector packages or a la carte service options.',
                    'Managing the full process on your behalf so you can stay focused on growth.'
                ],
                benefitsTitle: 'Why a Membership Model?',
                benefits: [
                    'Convenience: We handle the full process without making you manage an agency or in-house marketing team.',
                    'Flexibility: Services can be shaped around your current needs.',
                    'Continuity: A strong strategy continues to grow under one coordinated model.',
                    'Speed: We mobilize the right resources quickly to move you toward your goals.'
                ],
                closing: 'When you start working with khilonfast, we build a growth-aligned strategy and support every stage of your marketing processes. You choose what you need and we handle the rest.'
            },
            whyImageAlt: 'Visual describing the khilonfast strategy and execution approach',
            whyStats: [
                {
                    title: 'Speed and Expertise',
                    intro: 'khilonfast knows that timing is everything in business. We deliver work on time with a high professional standard.',
                    bullets: [
                        'Fast delivery: We help your marketing projects go live on schedule.',
                        'Expert team: With more than 20 years of experience, we provide creative and strategic solutions for every sector.'
                    ]
                },
                {
                    title: 'Depth and Customization',
                    intro: 'Every company is different, so we design our solutions around your specific reality.',
                    bullets: [
                        'End-to-end support: We cover the full journey from strategy to execution.',
                        'Customized solutions: We design around your goals, industry, and growth priorities.'
                    ]
                },
                {
                    title: 'What You Can Expect from Us',
                    bullets: [
                        'Results orientation: We support business growth with measurable outcomes.',
                        'Long-term partnership: We plan for your future, not only your current moment.',
                        'Transparency and trust: We work with clear communication and a straightforward operating model.'
                    ]
                },
                {
                    title: 'What Makes Us Different',
                    bullets: [
                        'Integrated strategy and execution: We do not stop at strategy creation; we manage implementation in the field as well.',
                        'Sector-specific solutions: We bring experience-backed practices tailored to each market.',
                        'Fast and scalable services: We provide solutions that can adapt quickly to your changing needs.'
                    ]
                }
            ],
            notSuitableAlt: 'Visual describing work styles that do not align with the khilonfast operating model',
            notForItems: [
                {
                    title: 'Businesses That Prefer Traditional Ways of Working',
                    bullets: [
                        'Those who require meetings for everything: If meetings are non-negotiable, Khilonfast may not be the right fit.',
                        'Those who avoid clear goals: Our process requires clear and concrete goals from the start.',
                        'Those who prefer verbal communication: Written communication is essential for speed and clarity in our workflow.'
                    ]
                },
                {
                    title: 'Businesses That Struggle with Modern Approaches',
                    intro: 'khilonfast\'s fast and expert-led service model may not fit the following expectations:',
                    bullets: [
                        'Those who ignore expert recommendations: If you want every process to move only according to your own methods, our collaboration may not be productive.',
                        'Those who decide by instinct rather than data: We ground strategy in evidence and analysis, not gut feeling.'
                    ]
                },
                {
                    title: 'Kind and Direct: Our Way of Working',
                    intro: 'khilonfast looks for a working rhythm that helps both sides succeed. If the approaches above match your style more closely, the partnership may struggle to deliver strong outcomes.',
                    bullets: [
                        'Clear and transparent: We offer our services to companies that want to work in a compatible and accountable way.',
                        'Strategic partner mindset: Mutual trust and understanding make faster and more sustainable success possible.'
                    ]
                }
            ],
            cmsLoading: 'Saving...',
            cmsSave: 'Save'
        }
        : {
            teamAlt: 'khilonfast strateji ve pazarlama vizyonunu temsil eden ekip görseli',
            birthCards: [
                {
                    imageAlt: 'Gelenekselden Dijitale',
                    title: 'Gelenekselden Dijitale',
                    description: '20 yılı aşkın deneyimimiz, şirketlerin pazarlama yaklaşımlarında köklü değişiklikler gerektiğini gösterdi. Geleneksel yöntemlerin hız ve verimlilik açısından yetersiz olduğunu fark ederek, Khilonfast’ı oluşturduk. Amacımız, firmaların pazarlama sorunlarına yenilikçi ve hızlı çözümler sunarak:',
                    bullets: [
                        'Bilinirliklerini artırmak',
                        'Büyümelerini desteklemek',
                        'Mevcut müşterilerinin hizmetlerden daha fazla yararlanmalarını sağlamak'
                    ]
                },
                {
                    imageAlt: 'Yenilik ve Hız',
                    title: 'Yenilik ve Hız',
                    description: 'Khilonfast, iş dünyasının hızını yöneten bir iş ortağıdır. Yavaş süreçlerin maliyetini bilerek, hizmetlerini iş dünyasının hızına ve değişen dinamiklerine uygun şekilde tasarlar. Kuruluşundan itibaren şu değerlerle fark yaratır:',
                    bullets: [
                        'Yenilik: Stratejik, modern ve yaratıcı çözümlerle işletmeleri hedeflerine ulaştırmak.',
                        'Hız: Hızlı aksiyon alarak iş süreçlerini kolaylaştırmak.',
                        'Sonuç Odaklılık: Ölçülebilir ve sürdürülebilir başarılar sağlamak.'
                    ]
                },
                {
                    imageAlt: 'İlham Verici Bir Yolculuk',
                    title: 'İlham Verici Bir Yolculuk',
                    description: 'Khilonfast, geleneksel yöntemlerin sınırlarını zorlayarak modern işletmelerin ihtiyaçlarına cevap vermek amacıyla kurulmuştur. İlham kaynağımız:',
                    bullets: [
                        'Hızlı büyüme: İşletmelerin daha hızlı büyümesini sağlamak',
                        'Geniş kitlelere ulaşma: Daha geniş bir kitleye erişim imkânı sunmak',
                        'Sürdürülebilir başarı: Başarılarını sürdürülebilir kılmak'
                    ],
                    outro: 'Müşterilerimizle birlikte bu yolculukta başarı hikayeleri yazmaya devam ediyoruz.'
                }
            ],
            modelImageAlt: 'khilonfast üyelik temelli strateji ve pazarlama hizmet modeli görseli',
            modelDetail: {
                title: 'Strateji ve Pazarlama Hizmetleri',
                description: 'Khilonfast, işletmelere üyelik temelli bir modelle pazarlama stratejisi ve uygulama hizmetleri sunarak ajans ve ekip yönetimi yükünü ortadan kaldırır.',
                strategyTitle: 'Strateji Hizmetleri',
                strategyDescription: 'Şirketiniz için sektöre özel, kısa ve uzun vadeli hedeflerinize uygun pazarlama stratejisi oluşturma.',
                marketingTitle: 'Pazarlama Hizmetleri',
                marketingItems: [
                    'Hazırlanan stratejiyi uygulama ve yönetme desteği.',
                    'Uyelik sistemiyle sektöre özel paketler veya a la carte hizmet seçenekleri sunma.',
                    'Tüm süreçleri sizin adınıza yöneterek hedeflerinize ulaşmanızı sağlama.'
                ],
                benefitsTitle: 'Neden Üyelik Modeli?',
                benefits: [
                    'Kolaylık: Pazarlama ekibi veya ajans yönetme derdi olmadan tüm süreci biz üstleniyoruz.',
                    'Esneklik: Hizmetlerimizi, ihtiyaçlarınıza göre şekillendirebilirsiniz.',
                    'Devamlılık: Başarılı bir stratejiyle başlayan süreç, tek elden yönetilerek büyümeye devam eder.',
                    'Hız: Hedeflerinize ulaşmanız için gerekli tüm kaynakları hızla mobilize ederiz.'
                ],
                closing: 'khilonfast ile iş birliğine başladığınızda, işinizin büyümesine uygun bir strateji oluşturulur ve bu strateji, pazarlama süreçlerinizin her aşamasında desteklenir. Sadece neye ihtiyacınız olduğunu seçin; biz gerisini hallederiz.'
            },
            whyImageAlt: 'khilonfast strateji ve yürütme yaklaşımını anlatan görsel',
            whyStats: [
                {
                    title: 'Hız ve Uzmanlık',
                    intro: 'khilonfast, iş dünyasında hızın her şey olduğunu bilir. İşlerinizi tam zamanında, yüksek bir profesyonellik standardıyla teslim ediyoruz.',
                    bullets: [
                        'Hızlı Teslimat: Pazarlama projelerinizin zamanında hayata geçmesini sağlıyoruz.',
                        'Uzman Kadro: 20 yılı aşkın tecrübemizle, her sektöre uygun yaratıcı ve stratejik çözümler sunuyoruz.'
                    ]
                },
                {
                    title: 'Kapsamlılık ve Özelleştirme',
                    intro: 'Her işletme farklıdır; bu yüzden çözümlerimizi size özel olarak tasarlarız.',
                    bullets: [
                        'Kapsamlı Yaklaşım: Stratejiden uygulamaya, her aşamada tam destek sağlıyoruz.',
                        'Özelleştirilmiş Çözümler: İşletmenizin hedeflerine, sektörüne ve ihtiyaçlarına uygun stratejiler geliştiriyoruz.'
                    ]
                },
                {
                    title: 'Bizden Ne Bekleyebilirsiniz?',
                    bullets: [
                        'Sonuç Odaklılık: Ölçülebilir sonuçlarla işinizin büyümesini destekliyoruz.',
                        'Uzun Vadeli İş Birliği: Sadece bugünü değil, geleceğinizi de planlıyoruz.',
                        'Şeffaflık ve Güven: İş süreçlerinde açık iletişim ve net bir yaklaşımla çalışıyoruz.'
                    ]
                },
                {
                    title: 'Rakiplerden Farkımız',
                    bullets: [
                        'Strateji ve Yürütmenin Bütünleşik Yaklaşımı: Strateji oluşturmakla kalmıyor, bu stratejilerin sahada uygulanmasını da eksiksiz bir şekilde yönetiyoruz.',
                        'Sektöre Özel Çözümler: Her sektörün ihtiyaçlarına uygun, deneyimle desteklenmiş uygulamalar sunuyoruz.',
                        'Hızlı ve Ölçeklenebilir Hizmetler: İhtiyaçlarınıza göre kolayca uyarlanabilir çözümler sağlıyoruz.'
                    ]
                }
            ],
            notSuitableAlt: 'khilonfast çalışma biçimine uygun olmayan iş yapış modellerini anlatan görsel',
            notForItems: [
                {
                    title: 'Geleneksel Çalışmayı Tercih Eden İşletmeler',
                    bullets: [
                        'Toplantı Talep Edenler: Toplantı vazgeçilmezse, Khilonfast sizin için uygun olmayabilir.',
                        'Net Hedeflerden Kaçınanlar: Çalışma sürecimizin başında net ve somut hedefler belirlemeniz gereklidir. Belirsiz hedeflerle çalışmak istiyorsanız, Khilonfast uygun bir iş ortağı olmayabilir.',
                        'Sözlü İletişimi Tercih Edenler: Tüm iletişim ve taleplerin yazılı olması, süreçlerin hızlı ve doğru yönetimi için şarttır. Sözlü iletişimi tercih ediyorsanız, Khilonfast sizin için uygun olmayabilir.'
                    ]
                },
                {
                    title: 'Modern Yaklaşımlara Uyum Sağlayamayanlar',
                    intro: 'khilonfast\'ın hızlı ve uzman odaklı hizmet anlayışı, aşağıdaki yaklaşımlarla uyumlu olmayabilir:',
                    bullets: [
                        'Uzman Önerilerini Dikkate Almayanlar: Eğer süreçlerin yalnızca kendi yöntemlerinizle ilerlemesini talep ediyorsanız, bu yaklaşım iş birliğimizle uyuşmayabilir.',
                        'Verilere Değil, Hislere Dayalı Karar Verenler: Stratejilerimizi somut verilere ve analitik sonuçlara dayandırırız. His ve sezgilere göre ilerlemek isteyenler için bu çalışma tarzı uygun olmayabilir.'
                    ]
                },
                {
                    title: 'Nazik ve Net: İş Yapış Biçimimiz',
                    intro: 'khilonfast, iş birliğine başlarken her iki tarafın da başarılı olmasını sağlayacak bir uyum arar. Eğer yukarıdaki yaklaşımlardan biri çalışma tarzınıza daha yakınsa, bu durum iş birliğimizin verimli olmasını zorlaştırabilir.',
                    bullets: [
                        'Net ve Şeffaf: Hizmetlerimizi, bizimle uyumlu bir şekilde iş yapmak isteyen firmalara sunuyoruz.',
                        'Stratejik İş Ortağı: Karşılıklı güven ve anlayışla daha hızlı ve sürdürülebilir başarılar elde edilebilir.'
                    ]
                }
            ],
            cmsLoading: 'Kaydediliyor...',
            cmsSave: 'Kaydet'
        };

    useEffect(() => {
        const fetchPublicCms = async () => {
            try {
                const res = await fetch(`${API_BASE}/pages/slug/about?lang=${currentLang}`);
                if (!res.ok) return;
                const data = await res.json();
                const texts = data?.content?.texts;
                if (texts && typeof texts === 'object') setCmsTexts(texts);
            } catch {
                // no-op
            }
        };
        fetchPublicCms();
    }, [API_BASE, currentLang]);

    useEffect(() => {
        const fetchAdminCms = async () => {
            if (!canShowCms) return;
            const token = localStorage.getItem('token');
            if (!token) return;
            const pagesRes = await fetch(`${API_BASE}/admin/pages`, { headers: { Authorization: `Bearer ${token}` } });
            if (!pagesRes.ok) return;
            const pages = await pagesRes.json();
            let page = (pages || []).find((p: any) => p?.slug === 'about');
            if (!page?.id) {
                const createRes = await fetch(`${API_BASE}/admin/pages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ title: 'About', slug: 'about', meta_title: '', meta_description: '' })
                });
                if (!createRes.ok) return;
                const created = await createRes.json();
                page = { id: created?.id };
            }
            setCmsPageId(Number(page.id));
            const contentRes = await fetch(`${API_BASE}/admin/pages/${page.id}/content`, { headers: { Authorization: `Bearer ${token}` } });
            if (!contentRes.ok) return;
            const contentData = await contentRes.json();
            let raw: any = null;
            if (contentData?.content_json && typeof contentData.content_json === 'object') raw = contentData.content_json;
            else if (typeof contentData?.content_json === 'string') {
                try { raw = JSON.parse(contentData.content_json); } catch { raw = null; }
            }
            if (raw && typeof raw === 'object') {
                setCmsAllContent(raw);
                const texts = raw[currentLang]?.texts;
                setCmsTexts(texts && typeof texts === 'object' ? texts : defaultTexts);
            } else {
                setCmsTexts(defaultTexts);
            }
        };
        fetchAdminCms();
    }, [API_BASE, canShowCms, currentLang, t]);

    const handleSave = async () => {
        if (!canShowCms || !cmsPageId || !cmsTexts) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        setCmsSaving(true);
        const nextAll = { ...(cmsAllContent || {}), [currentLang]: { texts: cmsTexts } };
        await fetch(`${API_BASE}/admin/pages/${cmsPageId}/content`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content_json: nextAll, is_published: true })
        });
        setCmsAllContent(nextAll);
        setCmsSaving(false);
    };

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <Breadcrumbs items={[{ label: tx('header.about') }]} />
                <div className="container">
                    <div className="about-hero-content">
                        <h1 className="about-hero-title" dangerouslySetInnerHTML={{ __html: tx('aboutPage.hero.title') }}></h1>
                        <p className="about-hero-description">
                            {tx('aboutPage.hero.description')}
                        </p>
                        <Link to={toLocalized('idm')} className="btn btn-white">{tx('common.explore')}</Link>
                    </div>
                </div>
                <div className="about-hero-bg-accent"></div>
            </section>

            {/* Who is khilonfast Section */}
            <section className="about-who">
                <div className="container">
                    <div className="about-grid reverse">
                        <div className="about-text-content">
                            <h2 className="section-title">{tx('aboutPage.who.title')}</h2>
                            <p className="section-description">
                                {tx('aboutPage.who.description')}
                            </p>
                            <div className="about-features-list">
                                <div className="feature-item">
                                    <div className="feature-icon"><HiRocketLaunch /></div>
                                    <div className="feature-text">
                                        <h4>{tx('aboutPage.who.feature1.title')}</h4>
                                        <p>{tx('aboutPage.who.feature1.desc')}</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiChartBar /></div>
                                    <div className="feature-text">
                                        <h4>{tx('aboutPage.who.feature2.title')}</h4>
                                        <p>{tx('aboutPage.who.feature2.desc')}</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiMagnifyingGlass /></div>
                                    <div className="feature-text">
                                        <h4>{tx('aboutPage.who.feature3.title')}</h4>
                                        <p>{tx('aboutPage.who.feature3.desc')}</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiCommandLine /></div>
                                    <div className="feature-text">
                                        <h4>{tx('aboutPage.who.feature4.title')}</h4>
                                        <p>{tx('aboutPage.who.feature4.desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <div className="image-frame">
                                <img src="/images/about/1-1.avif" alt={staticCopy.teamAlt} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How was khilonfast Born? Section */}
            <section className="about-birth">
                <div className="container">
                    <h2 className="section-title centered">{tx('aboutPage.birth.title')}</h2>
                    <div className="birth-grid">
                        {staticCopy.birthCards.map((card, index) => (
                            <div className="birth-card" key={index}>
                                <div className="birth-image">
                                    <img
                                        src={index === 0 ? '/images/about/Gelenekselden-Dijitale.avif' : index === 1 ? '/images/about/Yenilik-ve-Hiz.avif' : '/images/about/ilham-veri.avif'}
                                        alt={card.imageAlt}
                                    />
                                </div>
                                <h3>{card.title}</h3>
                                <p>
                                    {card.description}
                                    <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                                        {card.bullets.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                    {card.outro ? ` ${card.outro}` : null}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Banner Quote */}
            <section className="about-banner-quote">
                <div className="container">
                    <h3>{tx('aboutPage.quote.title')} <span>{tx('aboutPage.quote.highlight')}</span></h3>
                </div>
            </section>

            {/* Service Model Section */}
            <section className="about-model">
                <div className="container">
                    <div className="about-model-top">
                        <div className="about-text-content">
                            <h2 className="section-title">{tx('aboutPage.model.title')}</h2>
                            <p className="section-description">
                                {tx('aboutPage.model.description')}
                            </p>
                            <div className="model-sub-sections">
                                <div className="model-sub">
                                    <h4>{tx('aboutPage.model.sub1.title')}</h4>
                                    <p>{tx('aboutPage.model.sub1.desc')}</p>
                                </div>
                                <div className="model-sub">
                                    <h4>{tx('aboutPage.model.sub2.title')}</h4>
                                    <p>{tx('aboutPage.model.sub2.desc')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual model-hero-visual">
                            <img src="/service-model.png" alt={staticCopy.modelImageAlt} className="rounded-img" />
                        </div>
                    </div>
                    <div className="model-detail-panel">
                        <div className="model-detail-card">
                            <h3>{staticCopy.modelDetail.title}</h3>
                            <p>{staticCopy.modelDetail.description}</p>
                        </div>

                        <div className="model-detail-grid">
                            <div className="model-detail-item">
                                <h4>{staticCopy.modelDetail.strategyTitle}</h4>
                                <p>{staticCopy.modelDetail.strategyDescription}</p>
                            </div>
                            <div className="model-detail-item">
                                <h4>{staticCopy.modelDetail.marketingTitle}</h4>
                                <ul>
                                    {staticCopy.modelDetail.marketingItems.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="model-benefits-box">
                            <h4>{staticCopy.modelDetail.benefitsTitle}</h4>
                            <div className="model-benefits-grid">
                                {staticCopy.modelDetail.benefits.map((item) => (
                                    <div key={item}>{item}</div>
                                ))}
                            </div>
                        </div>

                        <div className="model-closing-note">
                            <p>{staticCopy.modelDetail.closing}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why khilonfast Section */}
            <section className="why-khilon">
                <div className="container">
                    <div className="about-grid reverse">
                        <div className="about-text-content">
                            <h2 className="section-title">{tx('aboutPage.why.title')}</h2>
                            <p className="section-description">
                                {tx('aboutPage.why.description')}
                            </p>
                            <div className="why-stats-grid">
                                {staticCopy.whyStats.map((item, index) => (
                                    <div className="why-stat-item" key={item.title}>
                                        {index === 0 ? <HiChartBar className="stat-icon" /> : index === 1 ? <HiRocketLaunch className="stat-icon" /> : index === 2 ? <HiSparkles className="stat-icon" /> : <HiMagnifyingGlass className="stat-icon" />}
                                        <h4>{item.title}</h4>
                                        {item.intro ? <p className="why-stat-intro">{item.intro}</p> : null}
                                        <ul>
                                            {item.bullets.map((bullet) => (
                                                <li key={bullet}>{bullet}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/images/about/3-2.webp" alt={staticCopy.whyImageAlt} className="floating-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Banner */}
            <section className="quick-banner">
                <div className="container">
                    <h2>{tx('aboutPage.quickBanner.title')}</h2>
                </div>
            </section>

            {/* Who is it NOT for Section */}
            <section className="not-for">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-text-content">
                            <h2 className="section-title">{tx('aboutPage.notFor.title')}</h2>
                            <p className="section-description">
                                {tx('aboutPage.notFor.description')}
                            </p>
                            <div className="not-for-list">
                                {staticCopy.notForItems.map((item) => (
                                    <div className="not-item" key={item.title}>
                                        <div className="not-icon"><HiXMark /></div>
                                        <div className="not-text">
                                            <h4>{item.title}</h4>
                                            {item.intro ? <p className="not-text-intro">{item.intro}</p> : null}
                                            <ul>
                                                {item.bullets.map((bullet) => (
                                                    <li key={bullet}>{bullet}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/not-suitable.png" alt={staticCopy.notSuitableAlt} className="rounded-img shadow-lg" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Statement */}
            <section className="brand-statement">
                <div className="container">
                    <div className="statement-box">
                        <img src="/fast-logo-big.svg" alt="Khilon" className="statement-logo" />
                        <h3>{tx('aboutPage.brandStatement.title')}</h3>
                    </div>
                </div>
            </section>

            {/* Discover Section */}
            <section className="discover-banner">
                <div className="container">
                    <h2>{tx('aboutPage.discover.title')}</h2>
                    <p>{tx('aboutPage.discover.description')}</p>
                    <div className="discover-actions">
                        <Link to={toLocalized('sectoralB2B')} className="btn btn-primary">{tx('common.startNow')}</Link>
                        <Link to={toLocalized('contact')} className="btn btn-outline">{tx('common.contactUs')}</Link>
                    </div>
                </div>
            </section>
            {canShowCms && (
                <div style={{ position: 'fixed', top: 90, right: 16, width: 420, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 14, boxShadow: '0 18px 40px rgba(15,23,42,0.15)', zIndex: 9999, padding: 14 }}>
                    <div style={{ fontWeight: 800, marginBottom: 10, color: '#0f172a' }}>CMS Editor ({currentLang.toUpperCase()})</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {ABOUT_TEXT_KEYS.map((key) => (
                            <div key={key} style={{ display: 'grid', gap: 4 }}>
                                <label style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{key}</label>
                                <textarea
                                    rows={key.includes('description') || key.includes('desc') ? 3 : 2}
                                    value={cmsTexts?.[key] || ''}
                                    onChange={(e) => setCmsTexts((prev) => ({ ...(prev || defaultTexts), [key]: e.target.value }))}
                                />
                            </div>
                        ))}
                        <button onClick={handleSave} disabled={cmsSaving} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 12px', cursor: 'pointer', opacity: cmsSaving ? 0.7 : 1, fontWeight: 700 }}>{cmsSaving ? staticCopy.cmsLoading : staticCopy.cmsSave}</button>
                    </div>
                </div>
            )}
        </div>
    )
}
