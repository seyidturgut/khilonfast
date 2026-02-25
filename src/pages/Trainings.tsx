import { Link } from 'react-router-dom';
import { HiAcademicCap, HiArrowRight } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../components/Breadcrumbs';
import './Trainings.css';

export default function Trainings() {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language.split('-')[0];

    const trainingPrograms = [
        { path: '/egitimler/buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.growth.title'), summary: t('header.menuItems.trainings.growth.desc') },
        { path: '/egitimler/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.payment.title'), summary: t('header.menuItems.trainings.payment.desc') },
        { path: '/b2b-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.b2b.title'), summary: t('header.menuItems.trainings.b2b.desc') },
        { path: '/fintech-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.fintech.title'), summary: t('header.menuItems.trainings.fintech.desc') },
        { path: '/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.tech.title'), summary: t('header.menuItems.trainings.tech.desc') },
        { path: '/uretim-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.manufacturing.title'), summary: t('header.menuItems.trainings.manufacturing.desc') },
        { path: '/enerji-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.energy.title'), summary: t('header.menuItems.trainings.energy.desc') },
        { path: '/ofis-kurumsal-ic-tasarim-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.design.title'), summary: t('header.menuItems.trainings.design.desc') },
        { path: '/filo-kiralama-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.fleet.title'), summary: t('header.menuItems.trainings.fleet.desc') },
        { path: '/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi', title: t('header.menuItems.trainings.food.title'), summary: t('header.menuItems.trainings.food.desc') }
    ];

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
                                <div className="training-card-icon">
                                    <HiAcademicCap />
                                </div>
                                <h3>{program.title}</h3>
                                <p>{program.summary}</p>
                                <Link to={program.path.startsWith('/en') ? program.path : (currentLang === 'en' ? `/en${program.path}` : program.path)} className="training-link">
                                    {t('trainingsPage.list.open', 'Eğitimi Aç')} <HiArrowRight />
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
