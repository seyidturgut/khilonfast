import { useTranslation } from 'react-i18next'
import './Hero.css'
import HeroBackgroundEffect from './HeroBackgroundEffect'
import { Link } from 'react-router-dom'

// Slides data now managed via translations

export default function Hero() {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language.split('-')[0];
    const prefix = currentLang === 'en' ? '/en' : '';
    const toLocalized = (key: string) => `${prefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/');
    return (
        <section id="home" className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background Layer: Full-screen Data Flow Lines */}
            <HeroBackgroundEffect />

            <div className="container hero-container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="hero-content">
                    <span className="hero-subtitle">{t('hero.subtitle')}</span>
                    <h1 className="hero-title">
                        {t('hero.title')}<br />
                        <span className="text-highlight">{t('hero.titleHighlight')}</span>
                    </h1>
                    <p className="hero-description">{t('hero.description')}</p>
                    <div className="hero-actions">
                        <Link to={toLocalized('gtm')} className="btn btn-primary">{t('common.startNow')}</Link>
                        <Link to={toLocalized('idm')} className="btn btn-secondary">{t('header.services')}</Link>
                    </div>
                </div>

                <div className="hero-image">
                    {/* Background lines provide the primary visual now */}
                </div>
            </div>
        </section>
    )
}
