import { HiRocketLaunch, HiChartBar, HiMagnifyingGlass, HiSparkles, HiCommandLine, HiXMark } from 'react-icons/hi2'
import Breadcrumbs from '../components/Breadcrumbs'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
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
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [cmsPageId, setCmsPageId] = useState<number | null>(null);
    const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null);
    const [cmsTexts, setCmsTexts] = useState<Record<string, string> | null>(null);
    const [cmsSaving, setCmsSaving] = useState(false);
    const tx = (key: string) => cmsTexts?.[key] || t(key);

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
                                <img src="/images/about/1-1.avif" alt="khilonfast strateji ve pazarlama vizyonunu temsil eden ekip görseli" />
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
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/images/about/Gelenekselden-Dijitale.avif" alt="Gelenekselden Dijitale" />
                            </div>
                            <h3>Gelenekselden Dijitale</h3>
                            <p>
                                20 yılı aşkın deneyimimiz, şirketlerin pazarlama yaklaşımlarında köklü değişiklikler gerektiğini gösterdi. Geleneksel yöntemlerin hız ve verimlilik açısından yetersiz olduğunu fark ederek, Khilonfast’ı oluşturduk. Amacımız, firmaların pazarlama sorunlarına yenilikçi ve hızlı çözümler sunarak:
                                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                                    <li>Bilinirliklerini artırmak</li>
                                    <li>Büyümelerini desteklemek</li>
                                    <li>Mevcut müşterilerinin hizmetlerden daha fazla yararlanmalarını sağlamak</li>
                                </ul>
                            </p>
                        </div>
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/images/about/Yenilik-ve-Hiz.avif" alt="Yenilik ve Hız" />
                            </div>
                            <h3>Yenilik ve Hız</h3>
                            <p>
                                Khilonfast, iş dünyasının hızını yöneten bir iş ortağıdır. Yavaş süreçlerin maliyetini bilerek, hizmetlerini iş dünyasının hızına ve değişen dinamiklerine uygun şekilde tasarlar. Kuruluşundan itibaren şu değerlerle fark yaratır:
                                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                                    <li><strong>Yenilik:</strong> Stratejik, modern ve yaratıcı çözümlerle işletmeleri hedeflerine ulaştırmak.</li>
                                    <li><strong>Hız:</strong> Hızlı aksiyon alarak iş süreçlerini kolaylaştırmak.</li>
                                    <li><strong>Sonuç Odaklılık:</strong> Ölçülebilir ve sürdürülebilir başarılar sağlamak.</li>
                                </ul>
                            </p>
                        </div>
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/images/about/ilham-veri.avif" alt="İlham Verici Bir Yolculuk" />
                            </div>
                            <h3>İlham Verici Bir Yolculuk</h3>
                            <p>
                                Khilonfast, geleneksel yöntemlerin sınırlarını zorlayarak modern işletmelerin ihtiyaçlarına cevap vermek amacıyla kurulmuştur. İlham kaynağımız:
                                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                                    <li><strong>Hızlı büyüme:</strong> İşletmelerin daha hızlı büyümesini sağlamak</li>
                                    <li><strong>Geniş kitlelere ulaşma:</strong> Daha geniş bir kitleye erişim imkânı sunmak</li>
                                    <li><strong>Sürdürülebilir başarı:</strong> Başarılarını sürdürülebilir kılmak</li>
                                </ul>
                                Müşterilerimizle birlikte bu yolculukta başarı hikayeleri yazmaya devam ediyoruz.
                            </p>
                        </div>
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
                            <img src="/service-model.png" alt="khilonfast üyelik temelli strateji ve pazarlama hizmet modeli görseli" className="rounded-img" />
                        </div>
                    </div>
                    <div className="model-detail-panel">
                        <div className="model-detail-card">
                            <h3>Strateji ve Pazarlama Hizmetleri</h3>
                            <p>
                                Khilonfast, işletmelere üyelik temelli bir modelle pazarlama stratejisi ve uygulama
                                hizmetleri sunarak ajans ve ekip yönetimi yükünü ortadan kaldırır.
                            </p>
                        </div>

                        <div className="model-detail-grid">
                            <div className="model-detail-item">
                                <h4>Strateji Hizmetleri</h4>
                                <p>Şirketiniz için sektöre özel, kısa ve uzun vadeli hedeflerinize uygun pazarlama stratejisi oluşturma.</p>
                            </div>
                            <div className="model-detail-item">
                                <h4>Pazarlama Hizmetleri</h4>
                                <ul>
                                    <li>Hazırlanan stratejiyi uygulama ve yönetme desteği.</li>
                                    <li>Uyelik sistemiyle sektöre özel paketler veya a la carte hizmet seçenekleri sunma.</li>
                                    <li>Tüm süreçleri sizin adınıza yöneterek hedeflerinize ulaşmanızı sağlama.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="model-benefits-box">
                            <h4>Neden Üyelik Modeli?</h4>
                            <div className="model-benefits-grid">
                                <div><strong>Kolaylık:</strong> Pazarlama ekibi veya ajans yönetme derdi olmadan tüm süreci biz üstleniyoruz.</div>
                                <div><strong>Esneklik:</strong> Hizmetlerimizi, ihtiyaçlarınıza göre şekillendirebilirsiniz.</div>
                                <div><strong>Devamlılık:</strong> Başarılı bir stratejiyle başlayan süreç, tek elden yönetilerek büyümeye devam eder.</div>
                                <div><strong>Hız:</strong> Hedeflerinize ulaşmanız için gerekli tüm kaynakları hızla mobilize ederiz.</div>
                            </div>
                        </div>

                        <div className="model-closing-note">
                            <p>
                                khilonfast ile iş birliğine başladığınızda, işinizin büyümesine uygun bir strateji oluşturulur ve bu strateji,
                                pazarlama süreçlerinizin her aşamasında desteklenir. Sadece neye ihtiyacınız olduğunu seçin; biz gerisini hallederiz.
                            </p>
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
                                <div className="why-stat-item">
                                    <HiChartBar className="stat-icon" />
                                    <h4>Hız ve Uzmanlık</h4>
                                    <p className="why-stat-intro">
                                        khilonfast, iş dünyasında hızın her şey olduğunu bilir. İşlerinizi tam zamanında, yüksek bir
                                        profesyonellik standardıyla teslim ediyoruz.
                                    </p>
                                    <ul>
                                        <li><strong>Hızlı Teslimat:</strong> Pazarlama projelerinizin zamanında hayata geçmesini sağlıyoruz.</li>
                                        <li><strong>Uzman Kadro:</strong> 20 yılı aşkın tecrübemizle, her sektöre uygun yaratıcı ve stratejik çözümler sunuyoruz.</li>
                                    </ul>
                                </div>
                                <div className="why-stat-item">
                                    <HiRocketLaunch className="stat-icon" />
                                    <h4>Kapsamlılık ve Özelleştirme</h4>
                                    <p className="why-stat-intro">
                                        Her işletme farklıdır; bu yüzden çözümlerimizi size özel olarak tasarlarız.
                                    </p>
                                    <ul>
                                        <li><strong>Kapsamlı Yaklaşım:</strong> Stratejiden uygulamaya, her aşamada tam destek sağlıyoruz.</li>
                                        <li><strong>Özelleştirilmiş Çözümler:</strong> İşletmenizin hedeflerine, sektörüne ve ihtiyaçlarına uygun stratejiler geliştiriyoruz.</li>
                                    </ul>
                                </div>
                                <div className="why-stat-item">
                                    <HiSparkles className="stat-icon" />
                                    <h4>Bizden Ne Bekleyebilirsiniz?</h4>
                                    <ul>
                                        <li><strong>Sonuç Odaklılık:</strong> Ölçülebilir sonuçlarla işinizin büyümesini destekliyoruz.</li>
                                        <li><strong>Uzun Vadeli İş Birliği:</strong> Sadece bugünü değil, geleceğinizi de planlıyoruz.</li>
                                        <li><strong>Şeffaflık ve Güven:</strong> İş süreçlerinde açık iletişim ve net bir yaklaşımla çalışıyoruz.</li>
                                    </ul>
                                </div>
                                <div className="why-stat-item">
                                    <HiMagnifyingGlass className="stat-icon" />
                                    <h4>Rakiplerden Farkımız</h4>
                                    <ul>
                                        <li><strong>Strateji ve Yürütmenin Bütünleşik Yaklaşımı:</strong> Strateji oluşturmakla kalmıyor, bu stratejilerin sahada uygulanmasını da eksiksiz bir şekilde yönetiyoruz.</li>
                                        <li><strong>Sektöre Özel Çözümler:</strong> Her sektörün ihtiyaçlarına uygun, deneyimle desteklenmiş uygulamalar sunuyoruz.</li>
                                        <li><strong>Hızlı ve Ölçeklenebilir Hizmetler:</strong> İhtiyaçlarınıza göre kolayca uyarlanabilir çözümler sağlıyoruz.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/images/about/visual.png" alt="khilonfast strateji ve yürütme yaklaşımını anlatan görsel" className="floating-img" />
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
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>Geleneksel Çalışmayı Tercih Eden İşletmeler</h4>
                                        <ul>
                                            <li><strong>Toplantı Talep Edenler:</strong> Toplantı vazgeçilmezse, Khilonfast sizin için uygun olmayabilir.</li>
                                            <li><strong>Net Hedeflerden Kaçınanlar:</strong> Çalışma sürecimizin başında net ve somut hedefler belirlemeniz gereklidir. Belirsiz hedeflerle çalışmak istiyorsanız, Khilonfast uygun bir iş ortağı olmayabilir.</li>
                                            <li><strong>Sözlü İletişimi Tercih Edenler:</strong> Tüm iletişim ve taleplerin yazılı olması, süreçlerin hızlı ve doğru yönetimi için şarttır. Sözlü iletişimi tercih ediyorsanız, Khilonfast sizin için uygun olmayabilir.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>Modern Yaklaşımlara Uyum Sağlayamayanlar</h4>
                                        <p className="not-text-intro">
                                            khilonfast'ın hızlı ve uzman odaklı hizmet anlayışı, aşağıdaki yaklaşımlarla uyumlu olmayabilir:
                                        </p>
                                        <ul>
                                            <li><strong>Uzman Önerilerini Dikkate Almayanlar:</strong> Eğer süreçlerin yalnızca kendi yöntemlerinizle ilerlemesini talep ediyorsanız, bu yaklaşım iş birliğimizle uyuşmayabilir.</li>
                                            <li><strong>Verilere Değil, Hislere Dayalı Karar Verenler:</strong> Stratejilerimizi somut verilere ve analitik sonuçlara dayandırırız. His ve sezgilere göre ilerlemek isteyenler için bu çalışma tarzı uygun olmayabilir.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>Nazik ve Net: İş Yapış Biçimimiz</h4>
                                        <p className="not-text-intro">
                                            khilonfast, iş birliğine başlarken her iki tarafın da başarılı olmasını sağlayacak bir uyum arar. Eğer yukarıdaki yaklaşımlardan biri çalışma tarzınıza daha yakınsa, bu durum iş birliğimizin verimli olmasını zorlaştırabilir.
                                        </p>
                                        <ul>
                                            <li><strong>Net ve Şeffaf:</strong> Hizmetlerimizi, bizimle uyumlu bir şekilde iş yapmak isteyen firmalara sunuyoruz.</li>
                                            <li><strong>Stratejik İş Ortağı:</strong> Karşılıklı güven ve anlayışla daha hızlı ve sürdürülebilir başarılar elde edilebilir.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/not-suitable.png" alt="khilonfast çalışma biçimine uygun olmayan iş yapış modellerini anlatan görsel" className="rounded-img shadow-lg" />
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
                        <button onClick={handleSave} disabled={cmsSaving} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 12px', cursor: 'pointer', opacity: cmsSaving ? 0.7 : 1, fontWeight: 700 }}>{cmsSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                    </div>
                </div>
            )}
        </div>
    )
}
