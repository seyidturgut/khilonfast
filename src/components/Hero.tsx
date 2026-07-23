import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import './Hero.css'
// PERFORMANS: three.js (~486 KB / 120 KB gzip) SADECE bu dekoratif arka plan icin
// kullaniliyor. Duz import edilirse DynamicPage uzerinden index chunk'ina girip
// SITENIN HER SAYFASINDA iniyordu. Lazy = yalniz hero'lu sayfalarda, gecikmeli.
const HeroBackgroundEffect = lazy(() => import('./HeroBackgroundEffect'))
import { Link } from 'react-router-dom'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'

// Slides data now managed via translations

type HeroContentOverrides = {
    subtitle?: string;
    title?: string;
    titleHighlight?: string;
    description?: string;
};

export default function Hero({ content }: { content?: HeroContentOverrides }) {
    const { t } = useTranslation('common');
    const currentLang = useRouteLocale();
    const toLocalized = (key: string) => getLocalizedPathByKey(currentLang, key);
    return (
        <section id="home" className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background Layer: Full-screen Data Flow Lines */}
            <Suspense fallback={null}><HeroBackgroundEffect /></Suspense>

            <div className="container hero-container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="hero-content">
                    <span className="hero-subtitle">{content?.subtitle || t('hero.subtitle')}</span>
                    <h1 className="hero-title">
                        {content?.title || t('hero.title')}<br />
                        <span className="text-highlight">{content?.titleHighlight || t('hero.titleHighlight')}</span>
                    </h1>
                    <p className="hero-description">{content?.description || t('hero.description')}</p>
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
