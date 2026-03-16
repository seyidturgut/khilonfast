import './Pricing.css'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'

export default function Pricing({ tx }: { tx?: (key: string) => string }) {
    const { t } = useTranslation('common')
    const currentLang = useRouteLocale()
    const toLocalized = (key: string) => getLocalizedPathByKey(currentLang, key)
    const text = (key: string) => tx?.(key) ?? t(key)

    return (
        <section id="pricing" className="pricing">
            <div className="pricing-background">
                <img src="/oval-top.png" alt="" className="oval-pattern" />
            </div>

            <div className="container pricing-container">
                <div className="pricing-content">
                    <h2 className="pricing-title">
                        {text('pages.home.pricing.titleLine1')}<br />
                        {text('pages.home.pricing.titleLine2')}
                    </h2>
                    <p className="pricing-description">
                        {text('pages.home.pricing.description')}
                    </p>
                    <Link to={toLocalized('idm')} className="btn btn-pricing">
                        {text('pages.home.pricing.cta')}
                    </Link>
                </div>
            </div>
        </section>
    )
}
