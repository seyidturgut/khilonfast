import { HiArrowRight } from 'react-icons/hi2'
import './Solutions.css'

const solutions = [
    {
        title: 'Büyüme Odaklı Stratejik Pazarlama',
        description: 'Denetim hizmetlerimiz, iş operasyonlarınızı kapsamlı bir şekilde analiz ederek iyileştirme alanlarını ve büyüme fırsatlarını belirler.',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Dijital Pazarlama Stratejileri',
        description: 'Çözümlerimiz, işletmelerin güçlü bir dijital varlık oluşturmasına ve hedef kitlelerine etkili bir şekilde ulaşmasına yardımcı olur.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        title: 'Markanıza Özel Pazarlama Çözümleri',
        description: 'Markanızın vizyonu, değerleri ve hedefleri ile uyumlu özel pazarlama stratejileri sunarak maksimum etki ve başarı sağlıyoruz.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        gradient: 'from-orange-500 to-red-500'
    }
]

export default function Solutions() {
    return (
        <section id="solutions" className="solutions">
            <div className="container">
                <div className="solutions-header">
                    <h2 className="solutions-title">
                        Ayrıntılı İş Analizi İçin<br />
                        Kapsamlı Denetim Hizmetleri
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

                                <button className="solution-button">
                                    <span>Keşfet</span>
                                    <HiArrowRight className="button-arrow" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
