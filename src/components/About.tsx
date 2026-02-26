import { HiCheckCircle } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import './About.css'
import AboutVisual from './AboutVisual'

type AboutContentOverrides = {
    title?: string;
    description?: string;
    item1?: string;
    item2?: string;
    item3?: string;
};

export default function About({ content }: { content?: AboutContentOverrides }) {
    const { t } = useTranslation('common')

    return (
        <section id="about" className="about">
            <div className="container about-container">
                <div className="about-visual">
                    <AboutVisual />
                </div>

                <div className="about-content">
                    <h2 className="about-title">
                        {content?.title || t('about.title')}
                    </h2>
                    <p className="about-description">
                        {content?.description || t('about.description')}
                    </p>

                    <ul className="about-list">
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>{content?.item1 || t('about.item1')}</span>
                        </li>
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>{content?.item2 || t('about.item2')}</span>
                        </li>
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>{content?.item3 || t('about.item3')}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    )
}
