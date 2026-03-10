import { Link, useLocation } from 'react-router-dom';
import { HiAcademicCap, HiArrowRight } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../components/Breadcrumbs';
import './Trainings.css';
import trCommon from '../locales/tr/common.json';
import enCommon from '../locales/en/common.json';

export default function Trainings() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr';
    const slugs = (currentLang === 'en' ? enCommon.slugs : trCommon.slugs) as Record<string, string>;
    const langPrefix = currentLang === 'en' ? '/en' : '';

    const trainingPrograms = [
        { slugKey: 'trainingPayment', menuKey: 'payment', image: '/images/TR_Odeme_Sistemleri-2.avif' },
        { slugKey: 'trainingB2B', menuKey: 'b2b', image: '/images/TR_Butunlesik.avif' },
        { slugKey: 'trainingFintech', menuKey: 'fintech', image: '/images/fintech.avif' },
        { slugKey: 'trainingTech', menuKey: 'tech', image: '/images/teknoloji.avif' },
        { slugKey: 'trainingManufacturing', menuKey: 'manufacturing', image: '/images/uretim.avif' },
        { slugKey: 'trainingEnergy', menuKey: 'energy', image: '/images/enerji.avif' },
        { slugKey: 'trainingDesign', menuKey: 'design', image: '/images/ofis.avif' },
        { slugKey: 'trainingFleet', menuKey: 'fleet', image: '/images/filo.avif' },
        { slugKey: 'trainingFood', menuKey: 'food', image: '/images/sef.avif' }
    ].map(({ slugKey, menuKey, image }) => ({
        path: `${langPrefix}/${slugs[slugKey] ?? ''}`.replace(/\/{2,}/g, '/'),
        title: t(`header.menuItems.trainings.${menuKey}.title`),
        summary: t(`header.menuItems.trainings.${menuKey}.desc`),
        image
    }));

    return (
        <div className="page-container trainings-page">
            <section className="trainings-hero">
                <Breadcrumbs items={[{ label: t('header.trainings') }]} />
                <div className="container trainings-hero-inner">
                    <div className="trainings-badge">
                        <HiAcademicCap />
                        <span>khilonfast Academy</span>
                    </div>
                    <h1>{t('trainingsPage.hero.title', 'Eğitim Programları')}</h1>
                    <p>
                        {t('trainingsPage.hero.description', 'Sektöre özel büyüme odaklı pazarlama eğitimlerini mevcut sistemimize entegre ettik. Programları inceleyip size en uygun eğitim akışıyla başlayabilirsiniz.')}
                    </p>
                </div>
            </section>

            <section className="trainings-list">
                <div className="container">
                    <div className="trainings-grid">
                        {trainingPrograms.map((program) => (
                            <article key={program.path} className="training-card">
                                <div className="training-card-image">
                                    <img src={program.image} alt={program.title} />
                                    <div className="training-card-badge">
                                        <HiAcademicCap />
                                    </div>
                                </div>
                                <div className="training-card-content">
                                    <h3>{program.title}</h3>
                                    <p>{program.summary}</p>
                                    <Link to={program.path} className="training-link">
                                        {t('trainingsPage.list.open', 'Eğitimi Aç')} <HiArrowRight />
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
