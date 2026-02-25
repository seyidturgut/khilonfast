import './Pricing.css'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Pricing() {
    const { t, i18n } = useTranslation('common')
    const currentLang = i18n.language.split('-')[0]
    const langPrefix = currentLang === 'en' ? '/en' : ''
    const toLocalized = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/')

    return (
        <section id="pricing" className="pricing">
            <div className="pricing-background">
                <img src="/oval-top.png" alt="" className="oval-pattern" />
            </div>

            <div className="container pricing-container">
                <div className="pricing-content">
                    <h2 className="pricing-title">
                        {t('pages.home.pricing.titleLine1')}<br />
                        {t('pages.home.pricing.titleLine2')}
                    </h2>
                    <p className="pricing-description">
                        {t('pages.home.pricing.description')}
                    </p>
                    <Link to={toLocalized('idm')} className="btn btn-pricing">
                        {t('pages.home.pricing.cta')}
                    </Link>
                </div>
            </div>
        </section>
    )
}
