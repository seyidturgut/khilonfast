import { HiCheckCircle } from 'react-icons/hi2'
import './About.css'
import AboutVisual from './AboutVisual'

export default function About() {
    return (
        <section id="about" className="about">
            <div className="container about-container">
                <div className="about-visual">
                    <AboutVisual />
                </div>

                <div className="about-content">
                    <h2 className="about-title">
                        Strateji, Yaratıcılık ve Teknolojiyi Birleştiren Pazarlama Çözümleri
                    </h2>
                    <p className="about-description">
                        khilonfast olarak, işletmenizin ihtiyaçlarına göre uyarlanmış benzersiz
                        pazarlama çözümleri sunuyoruz. Strateji, yaratıcılık ve teknolojiyi
                        birleştirerek fark yaratan sonuçlar sunuyoruz.
                    </p>

                    <ul className="about-list">
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>Stratejik Planlama</span>
                        </li>
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>Yaratıcı Stratejiler</span>
                        </li>
                        <li className="about-item">
                            <HiCheckCircle className="about-icon" />
                            <span>Teknolojik İnovasyon</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    )
}
