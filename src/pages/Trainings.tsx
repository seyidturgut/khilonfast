import { Link, useLocation } from 'react-router-dom';
import { HiAcademicCap, HiArrowRight } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../components/Breadcrumbs';
import './Trainings.css';
import trCommon from '../locales/tr/common.json';
import enCommon from '../locales/en/common.json';
import { getTrainingPrograms } from '../data/trainingPrograms';
import FAQ from '../components/FAQ';

const TRAININGS_FAQS_TR = [
    {
        question: 'khilonfast Academy eğitim programları kimler içindir?',
        answer: 'Pazarlama, satış ve büyüme süreçlerinden sorumlu ekiplere, işletme sahiplerine ve kariyerinde ilerlemek isteyen pazarlama profesyonellerine yöneliktir. Her program belirli bir sektöre özel olarak tasarlanmıştır.'
    },
    {
        question: 'Eğitimler online mu, canlı mı yapılıyor?',
        answer: 'Eğitimlere satın alma sonrası dijital platform üzerinden istediğiniz zaman erişebilir, kendi hızınızda ilerleyebilirsiniz.'
    },
    {
        question: 'Eğitim içeriğine ne kadar süre erişimim olur?',
        answer: 'Erişim süresi programa göre değişir; satın alma sonrası hesabınızdan içeriklere erişim ve süre bilgisine ulaşabilirsiniz.'
    },
    {
        question: 'Hangi sektörlere özel eğitim programı var?',
        answer: 'Ödeme sistemleri, B2B, fintech, teknoloji, üretim, enerji, ofis & kurumsal iç tasarım, filo kiralama ve endüstriyel gıda sektörlerine özel programlarımız bulunuyor.'
    }
];

const TRAININGS_FAQS_EN = [
    {
        question: 'Who are khilonfast Academy training programs for?',
        answer: 'They are designed for teams responsible for marketing, sales, and growth, business owners, and marketing professionals looking to advance their careers. Each program is tailored to a specific industry.'
    },
    {
        question: 'Are the trainings live or self-paced online?',
        answer: 'After purchase, you can access the training on our digital platform anytime and progress at your own pace.'
    },
    {
        question: 'How long do I have access to the training content?',
        answer: 'Access duration varies by program; you can check content access and duration details from your account after purchase.'
    },
    {
        question: 'Which industries have dedicated training programs?',
        answer: 'We offer dedicated programs for payment systems, B2B, fintech, technology, manufacturing, energy, office & corporate interior design, fleet rental, and industrial food sectors.'
    }
];

export default function Trainings() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr';
    const slugs = (currentLang === 'en' ? enCommon.slugs : trCommon.slugs) as Record<string, string>;
    const langPrefix = currentLang === 'en' ? '/en' : '';

    const trainingCards = [
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
        path: getTrainingPrograms(currentLang).find((program) => program.path.endsWith(`/${slugs[slugKey] ?? ''}`))?.path
            ?? `${langPrefix}/${slugs[slugKey] ?? ''}`.replace(/\/{2,}/g, '/'),
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
                    <h1>{t('trainingsPage.hero.title')}</h1>
                    <p>{t('trainingsPage.hero.description')}</p>
                </div>
            </section>

            <section className="trainings-list">
                <div className="container">
                    <h2 style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                        {t('trainingsPage.list.title', { defaultValue: 'Sektörel Eğitim Programları' })}
                    </h2>
                    <div className="trainings-grid">
                        {trainingCards.map((program) => (
                            <article key={program.path} className="training-card">
                                <div className="training-card-image">
                                    <img src={program.image} alt={program.title} width={400} height={225} loading="lazy" />
                                    <div className="training-card-badge">
                                        <HiAcademicCap />
                                    </div>
                                </div>
                                <div className="training-card-content">
                                    <h3>{program.title}</h3>
                                    <p>{program.summary}</p>
                                    <Link to={program.path} className="training-link">
                                        {t('trainingsPage.list.open')} <HiArrowRight />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <FAQ items={currentLang === 'en' ? TRAININGS_FAQS_EN : TRAININGS_FAQS_TR} />
        </div>
    );
}
