import { HiArrowRight } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Solutions.css'

export default function Solutions() {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language.split('-')[0];
    const langPrefix = currentLang === 'en' ? '/en' : '';
    const toLocalized = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/');

    const solutions = [
        {
            title: t('solutions.item1.title'),
            description: t('solutions.item1.description'),
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
            gradient: 'from-blue-500 to-cyan-500',
            link: toLocalized('gtm')
        },
        {
            title: t('solutions.item2.title'),
            description: t('solutions.item2.description'),
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
            gradient: 'from-purple-500 to-pink-500',
            link: toLocalized('idm')
        },
        {
            title: t('solutions.item3.title'),
            description: t('solutions.item3.description'),
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
            gradient: 'from-orange-500 to-red-500',
            link: toLocalized('sectoralB2B')
        }
    ]

    return (
        <section id="solutions" className="solutions">
            <div className="container">
                <div className="solutions-header">
                    <h2 className="solutions-title">
                        {t('solutions.header.title')}
                    </h2>
                </div>

                <div className="solutions-grid">
                    {solutions.map((solution, index) => (
                        <div
                            key={index}
                            className="solution-card"
                            style={{ animationDelay: `${index * 0.15}s` }}
                        >
                            <div className="solution-image-wrapper">
                                <div className={`solution-gradient ${solution.gradient}`}></div>
                                <img
                                    src={solution.image}
                                    alt={solution.title}
                                    className="solution-image"
                                />
                            </div>

                            <div className="solution-content">
                                <h3 className="solution-title">{solution.title}</h3>
                                <p className="solution-description">{solution.description}</p>

                                <Link to={solution.link} className="solution-button">
                                    <span>{t('common.discover')}</span>
                                    <HiArrowRight className="button-arrow" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
