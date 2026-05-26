import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './PotentialCTA.css'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'

export default function PotentialCTA({ tx }: { tx: (key: string) => string }) {
    useTranslation('common')
    const currentLang = useRouteLocale();
    const contactPath = getLocalizedPathByKey(currentLang, 'contact');

    return (
        <section className="potential-cta">
            <div className="container potential-container">
                <div className="potential-content">
                    <h2 className="potential-title">
                        {tx('potentialCTA.title')}
                    </h2>
                    <p className="potential-description">
                        {tx('potentialCTA.description')}
                    </p>
                    <Link to={contactPath} className="btn btn-primary">
                        {tx('potentialCTA.button')}
                    </Link>
                </div>
                <div className="potential-image">
                    <img src="/potential-cta.webp" alt="işletme büyüme potansiyelini ve pazarlama fırsatlarını temsil eden görsel" width={800} height={600} loading="lazy" decoding="async" />
                </div>
            </div>
        </section>
    )
}
