import { Link } from 'react-router-dom';
import { HiAcademicCap, HiArrowRight } from 'react-icons/hi2';
import Breadcrumbs from '../components/Breadcrumbs';
import { trainingPrograms } from '../data/trainingPrograms';
import './Trainings.css';

export default function Trainings() {
    return (
        <div className="page-container trainings-page">
            <section className="trainings-hero">
                <Breadcrumbs items={[{ label: 'Eğitimler' }]} />
                <div className="container trainings-hero-inner">
                    <div className="trainings-badge">
                        <HiAcademicCap />
                        <span>Khilonfast Academy</span>
                    </div>
                    <h1>Eğitim Programları</h1>
                    <p>
                        Sektöre özel büyüme odaklı pazarlama eğitimlerini mevcut sistemimize entegre ettik.
                        Programları inceleyip size en uygun eğitim akışıyla başlayabilirsiniz.
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
                                <Link to={program.path} className="training-link">
                                    Eğitimi Aç <HiArrowRight />
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
