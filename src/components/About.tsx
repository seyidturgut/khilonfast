import { HiCheckCircle } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import './About.css'
import AboutVisual from './AboutVisual'

export default function About() {
    const { t } = useTranslation('common')

    return (
        <section id="about" className="about">
            <div className="container about-container">
                <div className="about-visual">
                    <AboutVisual />
                </div>

                <div className="about-content">
                    <h2 className="about-title">
                        {t('about.title')}
                    </h2>
                    <p className="about-description">
                        {t('about.description')}
                    </p>

                    <ul className="about-list">
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>{t('about.item1')}</span>
                        </li>
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>{t('about.item2')}</span>
                        </li>
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>{t('about.item3')}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    )
}
