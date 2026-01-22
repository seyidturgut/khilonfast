import { HiCheckCircle } from 'react-icons/hi2'
import './Features.css'

export default function Features() {
    return (
        <section id="features" className="features">
            <div className="container features-container">
                <div className="features-content">
                    <h2 className="features-title">
                        Büyüme Odaklı<br />
                        Pazarlama Çözümlerimizi<br />
                        Keşfedin
                    </h2>
                    <p className="features-description">
                        khilonfast olarak, iş büyümesin desteklemek için tasarlanmış ürün bazlı
                        pazarlama çözümleri sunuyoruz. Çözümlerimiz, ölçülebilir sonuçlar sağlamak
                        için strateji, yaratıcılık ve teknolojiyi bir araya getirir.
                    </p>

                    <div className="features-list">
                        <div className="feature-item-modern">
                            <div className="feature-check-modern">
                                <HiCheckCircle />
                            </div>
                            <div className="feature-text">
                                <h3 className="feature-item-title">Hedeflenmiş dijital kampanyalarımızla marka görünürlüğü artırın.</h3>
                            </div>
                        </div>

                        <div className="feature-item-modern">
                            <div className="feature-check-modern">
                                <HiCheckCircle />
                            </div>
                            <div className="feature-text">
                                <h3 className="feature-item-title">Veri odaklı pazarlama stratejilerimizle dönüşüm oranını artırın.</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="features-visual-modern">
                    <svg className="features-svg" viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Background */}
                        <defs>
                            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#2a2a2a" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#1a1a1a" stopOpacity="1" />
                            </linearGradient>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#C5D63D" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#aab835" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>

                        {/* Dark background card */}
                        <rect x="50" y="30" width="500" height="440" rx="16" fill="url(#bgGradient)" />

                        {/* Chart Bars */}
                        <g className="chart-bars-animated">
                            <rect x="100" y="320" width="35" height="100" rx="4" fill="url(#chartGradient)" opacity="0.7" />
                            <rect x="150" y="290" width="35" height="130" rx="4" fill="url(#chartGradient)" opacity="0.8" />
                            <rect x="200" y="250" width="35" height="170" rx="4" fill="url(#chartGradient)" />
                            <rect x="250" y="270" width="35" height="150" rx="4" fill="url(#chartGradient)" opacity="0.8" />
                            <rect x="300" y="230" width="35" height="190" rx="4" fill="url(#chartGradient)" />
                            <rect x="350" y="200" width="35" height="220" rx="4" fill="url(#chartGradient)" />
                            <rect x="400" y="240" width="35" height="180" rx="4" fill="url(#chartGradient)" opacity="0.9" />
                            <rect x="450" y="190" width="35" height="230" rx="4" fill="url(#chartGradient)" />
                        </g>

                        {/* Growth Arrow */}
                        <g className="growth-arrow-animated">
                            <path d="M 120 350 Q 250 200 480 150"
                                stroke="#f59e0b"
                                strokeWidth="6"
                                strokeLinecap="round"
                                fill="none"
                                strokeDasharray="8,4" />
                            <path d="M 460 165 L 480 150 L 470 130"
                                stroke="#f59e0b"
                                strokeWidth="6"
                                strokeLinecap="round"
                                fill="none" />
                        </g>

                        {/* Percentage Symbol */}
                        <text x="120" y="200" fill="#C5D63D" fontSize="48" fontWeight="800" className="percentage-symbol">%</text>

                        {/* Data Points */}
                        <g className="data-points">
                            <circle cx="235" cy="220" r="8" fill="#f59e0b" className="data-point point-1" />
                            <circle cx="385" cy="180" r="8" fill="#f59e0b" className="data-point point-2" />
                            <circle cx="485" cy="165" r="8" fill="#f59e0b" className="data-point point-3" />
                        </g>

                        {/* Floating Numbers (Stats) */}
                        <g className="floating-stats">
                            <text x="480" y="100" fill="#C5D63D" fontSize="20" fontWeight="700" className="stat-text">210.24</text>
                            <text x="430" y="140" fill="#aab835" fontSize="18" fontWeight="600" className="stat-text">1,218.38</text>
                            <text x="370" y="170" fill="#C5D63D" fontSize="16" fontWeight="600" className="stat-text">456.50</text>
                        </g>
                    </svg>
                </div>
            </div>
        </section>
    )
}
