import { Link, useLocation } from 'react-router-dom';
import { HiBriefcase, HiArrowRight } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../components/Breadcrumbs';
import './Trainings.css';
import { getConsultingPrograms } from '../data/consultingPrograms';

const CARD_IMAGES = [
    '/images/TR_Odeme_Sistemleri-2.avif',
    '/images/TR_Butunlesik.avif',
    '/images/fintech.avif',
    '/images/teknoloji.avif',
    '/images/uretim.avif',
    '/images/enerji.avif',
    '/images/ofis.avif',
    '/images/filo.avif',
    '/images/sef.avif'
];

export default function Consulting() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr';

    const programs = getConsultingPrograms(currentLang);
    const consultingCards = programs.map((program, i) => ({
        ...program,
        image: CARD_IMAGES[i] ?? ''
    }));

    const consultingLabel = currentLang === 'en' ? 'Consulting' : 'Danışmanlık';

    return (
        <div className="page-container trainings-page">
            <section className="trainings-hero">
                <Breadcrumbs items={[{ label: consultingLabel }]} />
                <div className="container trainings-hero-inner">
                    <div className="trainings-badge">
                        <HiBriefcase />
                        <span>khilonfast {consultingLabel}</span>
                    </div>
                    <h1>{t('consultingPage.hero.title')}</h1>
                    <p>{t('consultingPage.hero.description')}</p>
                </div>
            </section>

            <section className="trainings-list">
                <div className="container">
                    <div className="trainings-grid">
                        {consultingCards.map((program) => (
                            <article key={program.path} className="training-card">
                                <div className="training-card-image">
                                    <img src={program.image} alt={program.title} />
                                    <div className="training-card-badge">
                                        <HiBriefcase />
                                    </div>
                                </div>
                                <div className="training-card-content">
                                    <h3>{program.title}</h3>
                                    <p>{program.summary}</p>
                                    <Link to={program.path} className="training-link">
                                        {t('consultingPage.list.open')} <HiArrowRight />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
