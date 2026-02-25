import { HiRocketLaunch, HiChartBar, HiMagnifyingGlass, HiSparkles, HiCommandLine, HiXMark } from 'react-icons/hi2'
import Breadcrumbs from '../components/Breadcrumbs'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './About.css'

export default function About() {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language.split('-')[0];
    const langPrefix = currentLang === 'en' ? '/en' : '';
    const toLocalized = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/');

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <Breadcrumbs items={[{ label: t('header.about') }]} />
                <div className="container">
                    <div className="about-hero-content">
                        <h1 className="about-hero-title" dangerouslySetInnerHTML={{ __html: t('aboutPage.hero.title') }}></h1>
                        <p className="about-hero-description">
                            {t('aboutPage.hero.description')}
                        </p>
                        <Link to={toLocalized('idm')} className="btn btn-white">{t('common.explore')}</Link>
                    </div>
                </div>
                <div className="about-hero-bg-accent"></div>
            </section>

            {/* Who is khilonfast Section */}
            <section className="about-who">
                <div className="container">
                    <div className="about-grid reverse">
                        <div className="about-text-content">
                            <h2 className="section-title">{t('aboutPage.who.title')}</h2>
                            <p className="section-description">
                                {t('aboutPage.who.description')}
                            </p>
                            <div className="about-features-list">
                                <div className="feature-item">
                                    <div className="feature-icon"><HiRocketLaunch /></div>
                                    <div className="feature-text">
                                        <h4>{t('aboutPage.who.feature1.title')}</h4>
                                        <p>{t('aboutPage.who.feature1.desc')}</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiChartBar /></div>
                                    <div className="feature-text">
                                        <h4>{t('aboutPage.who.feature2.title')}</h4>
                                        <p>{t('aboutPage.who.feature2.desc')}</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiMagnifyingGlass /></div>
                                    <div className="feature-text">
                                        <h4>{t('aboutPage.who.feature3.title')}</h4>
                                        <p>{t('aboutPage.who.feature3.desc')}</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiCommandLine /></div>
                                    <div className="feature-text">
                                        <h4>{t('aboutPage.who.feature4.title')}</h4>
                                        <p>{t('aboutPage.who.feature4.desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <div className="image-frame">
                                <img src="/about-hero.png" alt="khilonfast Vision" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How was khilonfast Born? Section */}
            <section className="about-birth">
                <div className="container">
                    <h2 className="section-title centered">{t('aboutPage.birth.title')}</h2>
                    <div className="birth-grid">
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/khilon-birth-1.png" alt={t('aboutPage.birth.card1.title')} />
                            </div>
                            <h3>{t('aboutPage.birth.card1.title')}</h3>
                            <p>{t('aboutPage.birth.card1.desc')}</p>
                        </div>
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/khilon-birth-2.png" alt={t('aboutPage.birth.card2.title')} />
                            </div>
                            <h3>{t('aboutPage.birth.card2.title')}</h3>
                            <p>{t('aboutPage.birth.card2.desc')}</p>
                        </div>
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/khilon-birth-3.png" alt={t('aboutPage.birth.card3.title')} />
                            </div>
                            <h3>{t('aboutPage.birth.card3.title')}</h3>
                            <p>{t('aboutPage.birth.card3.desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Banner Quote */}
            <section className="about-banner-quote">
                <div className="container">
                    <h3>{t('aboutPage.quote.title')} <span>{t('aboutPage.quote.highlight')}</span></h3>
                </div>
            </section>

            {/* Service Model Section */}
            <section className="about-model">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-text-content">
                            <h2 className="section-title">{t('aboutPage.model.title')}</h2>
                            <p className="section-description">
                                {t('aboutPage.model.description')}
                            </p>
                            <div className="model-sub-sections">
                                <div className="model-sub">
                                    <h4>{t('aboutPage.model.sub1.title')}</h4>
                                    <p>{t('aboutPage.model.sub1.desc')}</p>
                                </div>
                                <div className="model-sub">
                                    <h4>{t('aboutPage.model.sub2.title')}</h4>
                                    <p>{t('aboutPage.model.sub2.desc')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/service-model.png" alt="Service Model" className="rounded-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Why khilonfast Section */}
            <section className="why-khilon">
                <div className="container">
                    <div className="about-grid reverse">
                        <div className="about-text-content">
                            <h2 className="section-title">{t('aboutPage.why.title')}</h2>
                            <p className="section-description">
                                {t('aboutPage.why.description')}
                            </p>
                            <div className="why-stats-grid">
                                <div className="why-stat-item">
                                    <HiChartBar className="stat-icon" />
                                    <h4>{t('aboutPage.why.stat1.title')}</h4>
                                    <p>{t('aboutPage.why.stat1.desc')}</p>
                                </div>
                                <div className="why-stat-item">
                                    <HiRocketLaunch className="stat-icon" />
                                    <h4>{t('aboutPage.why.stat2.title')}</h4>
                                    <p>{t('aboutPage.why.stat2.desc')}</p>
                                </div>
                                <div className="why-stat-item">
                                    <HiSparkles className="stat-icon" />
                                    <h4>{t('aboutPage.why.stat3.title')}</h4>
                                    <p>{t('aboutPage.why.stat3.desc')}</p>
                                </div>
                                <div className="why-stat-item">
                                    <HiMagnifyingGlass className="stat-icon" />
                                    <h4>{t('aboutPage.why.stat4.title')}</h4>
                                    <p>{t('aboutPage.why.stat4.desc')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/images/about/visual.png" alt="Why khilonfast" className="floating-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Banner */}
            <section className="quick-banner">
                <div className="container">
                    <h2>{t('aboutPage.quickBanner.title')}</h2>
                </div>
            </section>

            {/* Who is it NOT for Section */}
            <section className="not-for">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-text-content">
                            <h2 className="section-title">{t('aboutPage.notFor.title')}</h2>
                            <p className="section-description">
                                {t('aboutPage.notFor.description')}
                            </p>
                            <div className="not-for-list">
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>{t('aboutPage.notFor.item1.title')}</h4>
                                        <p>{t('aboutPage.notFor.item1.desc')}</p>
                                    </div>
                                </div>
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>{t('aboutPage.notFor.item2.title')}</h4>
                                        <p>{t('aboutPage.notFor.item2.desc')}</p>
                                    </div>
                                </div>
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>{t('aboutPage.notFor.item3.title')}</h4>
                                        <p>{t('aboutPage.notFor.item3.desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/not-suitable.png" alt="Not for everyone" className="rounded-img shadow-lg" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Statement */}
            <section className="brand-statement">
                <div className="container">
                    <div className="statement-box">
                        <img src="/fast-logo-big.svg" alt="Khilon" className="statement-logo" />
                        <h3>{t('aboutPage.brandStatement.title')}</h3>
                    </div>
                </div>
            </section>

            {/* Discover Section */}
            <section className="discover-banner">
                <div className="container">
                    <h2>{t('aboutPage.discover.title')}</h2>
                    <p>{t('aboutPage.discover.description')}</p>
                    <div className="discover-actions">
                        <Link to={toLocalized('sectoralB2B')} className="btn btn-primary">{t('common.startNow')}</Link>
                        <Link to={toLocalized('contact')} className="btn btn-outline">{t('common.contactUs')}</Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
