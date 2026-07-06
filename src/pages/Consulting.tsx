import { Link, useLocation } from 'react-router-dom';
import { HiBriefcase, HiArrowRight } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../components/Breadcrumbs';
import './Trainings.css';
import { getConsultingPrograms } from '../data/consultingPrograms';
import FAQ from '../components/FAQ';
import AiAnswerBox from '../components/AiAnswerBox';

const AI_ANSWER_TR = {
    question: 'KhilonFast Danışmanlık Programları nedir?',
    answer: 'Sektörünüze özel bir pazarlama danışmanıyla birebir çalışarak büyüme stratejinizi hayata geçirdiğiniz online danışmanlık hizmetidir. B2B, fintech, üretim, enerji ve daha birçok sektöre özel programlar sunulur.'
};

const AI_ANSWER_EN = {
    question: 'What are KhilonFast Consulting Programs?',
    answer: 'An online consulting service where you work one-on-one with a marketing consultant specialized in your industry to execute your growth strategy. Dedicated programs are available for B2B, fintech, manufacturing, energy and many more sectors.'
};

const CONSULTING_FAQS_TR = [
    {
        question: 'Danışmanlık programları nasıl işliyor?',
        answer: 'Sektörünüze özel bir büyüme odaklı pazarlama danışmanı ile birebir online seanslar üzerinden çalışırsınız. Program süresi ve seans sayısı sektöre göre değişir, detaylar her program sayfasında yer alır.'
    },
    {
        question: 'Danışmanlık ile eğitim programları arasındaki fark nedir?',
        answer: 'Eğitim programları genel bilgi ve strateji aktarımı sağlarken, danışmanlık programları sizin firmanıza özel, birebir uygulanabilir çözümler üretmeye odaklanır.'
    },
    {
        question: 'Hangi sektörler için danışmanlık programı var?',
        answer: 'B2B, ödeme sistemleri, fintech, teknoloji, üretim, enerji, ofis & kurumsal iç tasarım, filo kiralama ve endüstriyel gıda sektörlerine özel danışmanlık programları sunuyoruz.'
    },
    {
        question: 'Danışmanlık programına nasıl kayıt olurum?',
        answer: 'İlgilendiğiniz sektörün danışmanlık sayfasına girip programı inceleyebilir, doğrudan satın alma veya bizimle iletişime geçerek kayıt sürecini başlatabilirsiniz.'
    }
];

const CONSULTING_FAQS_EN = [
    {
        question: 'How do the consulting programs work?',
        answer: "You work one-on-one with a growth-focused marketing consultant specialized in your industry through online sessions. Program duration and session count vary by sector — details are listed on each program's page."
    },
    {
        question: 'What is the difference between consulting and training programs?',
        answer: 'Training programs deliver general knowledge and strategy, while consulting programs focus on producing actionable solutions tailored specifically to your company.'
    },
    {
        question: 'Which industries have a consulting program?',
        answer: 'We offer dedicated consulting programs for B2B, payment systems, fintech, technology, manufacturing, energy, office & corporate interior design, fleet rental, and industrial food sectors.'
    },
    {
        question: 'How do I sign up for a consulting program?',
        answer: 'Visit the consulting page for your industry to review the program, then purchase directly or contact us to start the enrollment process.'
    }
];

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

            <AiAnswerBox {...(currentLang === 'en' ? AI_ANSWER_EN : AI_ANSWER_TR)} />

            <section className="trainings-list">
                <div className="container">
                    <div className="trainings-grid">
                        {consultingCards.map((program) => (
                            <article key={program.path} className="training-card">
                                <div className="training-card-image">
                                    <img src={program.image} alt={program.title} width={400} height={225} loading="lazy" />
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

            <FAQ items={currentLang === 'en' ? CONSULTING_FAQS_EN : CONSULTING_FAQS_TR} />
        </div>
    );
}
