import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './PotentialCTA.css'

export default function PotentialCTA({ tx }: { tx: (key: string) => string }) {
    const { t, i18n } = useTranslation('common')
    
    // Resolve localized path for contact
    const currentLang = i18n.language.split('-')[0];
    const prefix = currentLang === 'en' ? '/en' : '';
    const contactSlug = t('slugs.contact', { defaultValue: 'iletisim' });
    const contactPath = `${prefix}/${contactSlug}`.replace(/\/{2,}/g, '/');

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
                    <img src="/potential-cta.png" alt="işletme büyüme potansiyelini ve pazarlama fırsatlarını temsil eden görsel" />
                </div>
            </div>
        </section>
    )
}
