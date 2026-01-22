import { HiCheckCircle } from 'react-icons/hi2'
import './About.css'

export default function About() {
    return (
        <section id="about" className="about">
            <div className="container about-container">
                <div className="about-visual">
                    <svg className="about-svg" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Background Glow */}
                        <circle cx="225" cy="225" r="180" fill="url(#glow)" opacity="0.3" />

                        {/* Gradient Definitions */}
                        <defs>
                            <radialGradient id="glow">
                                <stop offset="0%" stopColor="#C5D63D" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#C5D63D" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        {/* Rocket/Growth Arrow */}
                        <g className="rocket-icon">
                            <path d="M 225 100 L 225 155 L 255 155 L 255 100 L 240 80 Z" fill="#1a3a52" />
                            <circle cx="240" cy="95" r="10" fill="#C5D63D" />
                            <path d="M 215 155 L 225 180 L 225 155 Z" fill="#C5D63D" />
                            <path d="M 255 155 L 265 180 L 255 155 Z" fill="#C5D63D" />
                        </g>

                        {/* Bar Chart */}
                        <g className="chart-bars">
                            <rect x="90" y="290" width="24" height="70" rx="5" fill="#1a3a52" />
                            <rect x="125" y="270" width="24" height="90" rx="5" fill="#C5D63D" />
                            <rect x="160" y="255" width="24" height="105" rx="5" fill="#1a3a52" />
                            <rect x="195" y="235" width="24" height="125" rx="5" fill="#C5D63D" />
                        </g>

                        {/* Target/Focus Circle */}
                        <g className="target-icon">
                            <circle cx="325" cy="310" r="45" fill="none" stroke="#C5D63D" strokeWidth="6" />
                            <circle cx="325" cy="310" r="28" fill="none" stroke="#1a3a52" strokeWidth="5" />
                            <circle cx="325" cy="310" r="12" fill="#C5D63D" />
                        </g>

                        {/* Settings/Gear */}
                        <g className="gear-icon">
                            <circle cx="330" cy="150" r="28" fill="none" stroke="#1a3a52" strokeWidth="8" />
                            <circle cx="330" cy="150" r="15" fill="#C5D63D" />
                            {/* Gear teeth */}
                            <rect x="326" y="115" width="8" height="12" rx="2" fill="#1a3a52" />
                            <rect x="326" y="173" width="8" height="12" rx="2" fill="#1a3a52" />
                            <rect x="295" y="146" width="12" height="8" rx="2" fill="#1a3a52" />
                            <rect x="353" y="146" width="12" height="8" rx="2" fill="#1a3a52" />
                        </g>

                        {/* Connecting Lines */}
                        <path className="connect-line line-1"
                            d="M 240 180 Q 200 230 195 270"
                            stroke="#C5D63D"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.4" />

                        <path className="connect-line line-2"
                            d="M 260 140 Q 290 145 302 150"
                            stroke="#1a3a52"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.4" />

                        <path className="connect-line line-3"
                            d="M 220 280 Q 270 290 290 305"
                            stroke="#C5D63D"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.4" />
                    </svg>
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
