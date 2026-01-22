import { HiArrowRight } from 'react-icons/hi2'
import './Services.css'

export default function Services() {
    return (
        <section id="services" className="services">
            <div className="container">
                <div className="services-header">
                    <h2 className="services-title">
                        İşletmeniz İçin Kapsamlı<br />
                        Pazarlama Çözümleri
                    </h2>
                </div>

                <div className="services-grid">

                    {/* Card 1: Strategy/Code */}
                    <div className="service-card-modern" style={{ animationDelay: '0s' }}>
                        <div className="service-image-area">
                            <div className="service-anim-wrapper">
                                <svg viewBox="0 0 100 100" className="service-icon-svg code-anim">
                                    <rect x="15" y="20" width="70" height="60" rx="6" fill="rgba(197, 214, 61, 0.1)" stroke="#C5D63D" strokeWidth="3" />
                                    <path d="M 30 50 L 40 50" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" className="code-line line-1" />
                                    <path d="M 30 65 L 50 65" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" className="code-line line-2" />
                                    <path d="M 45 40 L 55 50 L 45 60" fill="none" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="bracket-right" />
                                    <path d="M 35 40 L 25 50 L 35 60" fill="none" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="bracket-left" />
                                    <circle cx="25" cy="30" r="3" fill="#C5D63D" opacity="0.5" />
                                    <circle cx="35" cy="30" r="3" fill="#C5D63D" opacity="0.5" />
                                    <circle cx="45" cy="30" r="3" fill="#C5D63D" opacity="0.5" />
                                </svg>
                            </div>
                            <div className="service-overlay"></div>
                        </div>

                        <div className="service-info">
                            <h3 className="service-title-modern">Başarıya Ulaştıran Özel Pazarlama Stratejileri</h3>
                            <p className="service-desc-modern">İşletmenizin büyümesine yönelik geniş pazarlama hizmetlerimizden yararlanın.</p>

                            <button className="service-btn-modern">
                                <span>Keşfet</span>
                                <HiArrowRight className="btn-arrow-icon" />
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Branding/Rocket */}
                    <div className="service-card-modern" style={{ animationDelay: '0.15s' }}>
                        <div className="service-image-area">
                            <div className="service-anim-wrapper">
                                <svg viewBox="0 0 100 100" className="service-icon-svg rocket-anim">
                                    <path d="M 50 20 C 50 20 70 40 70 60 C 70 70 65 75 60 75 L 40 75 C 35 75 30 70 30 60 C 30 40 50 20 50 20 Z" fill="none" stroke="#C5D63D" strokeWidth="4" strokeLinejoin="round" className="rocket-body" />
                                    <path d="M 30 60 L 20 70" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" />
                                    <path d="M 70 60 L 80 70" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" />
                                    <circle cx="50" cy="45" r="6" fill="#C5D63D" className="rocket-window" />
                                    <g className="rocket-flame">
                                        <path d="M 45 80 L 50 95 L 55 80" fill="#C5D63D" />
                                    </g>
                                    <g className="stars-anim">
                                        <circle cx="20" cy="30" r="2" fill="#C5D63D" />
                                        <circle cx="80" cy="20" r="2" fill="#C5D63D" />
                                        <circle cx="15" cy="70" r="2" fill="#C5D63D" />
                                    </g>
                                </svg>
                            </div>
                            <div className="service-overlay"></div>
                        </div>

                        <div className="service-info">
                            <h3 className="service-title-modern">Markalaşma ve İletişimde Yenilikçi Çözümler</h3>
                            <p className="service-desc-modern">Marka stratejisi ve kurumsal iletişimde kapsamlı çözümlerimizi keşfedin.</p>

                            <button className="service-btn-modern">
                                <span>Keşfet</span>
                                <HiArrowRight className="btn-arrow-icon" />
                            </button>
                        </div>
                    </div>

                    {/* Card 3: Digital/Chart */}
                    <div className="service-card-modern" style={{ animationDelay: '0.3s' }}>
                        <div className="service-image-area">
                            <div className="service-anim-wrapper">
                                <svg viewBox="0 0 100 100" className="service-icon-svg chart-anim">
                                    <rect x="20" y="60" width="12" height="20" rx="2" fill="rgba(197, 214, 61, 0.3)" stroke="#C5D63D" strokeWidth="3" className="bar bar-1" />
                                    <rect x="44" y="45" width="12" height="35" rx="2" fill="rgba(197, 214, 61, 0.3)" stroke="#C5D63D" strokeWidth="3" className="bar bar-2" />
                                    <rect x="68" y="30" width="12" height="50" rx="2" fill="rgba(197, 214, 61, 0.3)" stroke="#C5D63D" strokeWidth="3" className="bar bar-3" />
                                    <polyline points="20,55 44,40 68,25" fill="none" stroke="#C5D63D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />
                                </svg>
                            </div>
                            <div className="service-overlay"></div>
                        </div>

                        <div className="service-info">
                            <h3 className="service-title-modern">Dijitalde Güçlü Varlık için Pazarlama Uzmanlığı</h3>
                            <p className="service-desc-modern">Etkili sonuçlar elde etmek için size özel dijital pazarlama çözümlerimizi inceleyin.</p>

                            <button className="service-btn-modern">
                                <span>Keşfet</span>
                                <HiArrowRight className="btn-arrow-icon" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
