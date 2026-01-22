
// import { useState } from 'react'
import { HiArrowRight, HiArrowLeft } from 'react-icons/hi2'
import './Hero.css'

// Custom Animated SVG Component - Business Growth
// Custom Animated SVG Component - Business Growth
const HeroGrowthSvg = () => (
    <svg
        className="hero-svg-growth"
        viewBox="0 0 520 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', maxWidth: '600px' }}
    >
        <style>{`
            .chart-line { stroke-dasharray: 450; stroke-dashoffset: 450; animation: drawLine 3s ease-out forwards 0.5s; }
            .chart-area { opacity: 0; animation: fadeInArea 2s ease-out forwards 1.5s; }
            .axis { stroke: #1a3a52; stroke-opacity: 0.3; stroke-width: 3; stroke-linecap: round; } 
            
            .icon-content { opacity: 0; transform-origin: center; transform: scale(0.5); }
            .icon-seo .icon-content { animation: popIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 2s; }
            .icon-social .icon-content { animation: popIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 2.5s; }
            .icon-ads .icon-content { animation: popIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 3s; }
            
            .dot { opacity: 0; animation: fadeIn 0.5s ease-out forwards 3.2s; }
            .pulse { animation: pulseBig 3s infinite ease-in-out 3.5s; transform-origin: 380px 120px; }
            
            @keyframes drawLine { to { stroke-dashoffset: 0; } }
            @keyframes fadeInArea { to { opacity: 1; } }
            @keyframes popIn { 
                to { opacity: 1; transform: scale(1); } 
            }
            @keyframes fadeIn { to { opacity: 1; } }
            @keyframes pulseBig { 
                0% { transform: scale(0.9); opacity: 0.7; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(0.9); opacity: 0.7; }
            }
        `}</style>

        <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C5D63D" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#C5D63D" stopOpacity="0.0" />
            </linearGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#1a3a52" floodOpacity="0.15" />
            </filter>
        </defs>

        {/* --- AXES --- */}
        <line x1="60" y1="300" x2="460" y2="300" className="axis" />
        <line x1="60" y1="300" x2="60" y2="60" className="axis" />

        {/* --- CHART CONTENT --- */}
        <g transform="translate(0, 0)">
            <path
                className="chart-area"
                d="M60 300 L140 240 L220 260 L300 180 L380 120 V300 H60 Z"
                fill="url(#chartGrad)"
            />
            <path
                className="chart-line"
                d="M60 300 L140 240 L220 260 L300 180 L380 120"
                stroke="#1a3a52"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            {/* The Peak Dot */}
            <circle cx="380" cy="120" r="8" fill="#C5D63D" stroke="white" strokeWidth="3" className="dot" />
            <circle cx="380" cy="120" r="15" stroke="#C5D63D" strokeWidth="2" fill="none" opacity="0.5" className="dot pulse" />
        </g>

        {/* --- ICONS --- */}

        {/* 1. SEO Icon - Separated container group */}
        <g className="icon-seo" transform="translate(140, 160)">
            <g className="icon-content">
                <circle cx="0" cy="0" r="35" fill="white" filter="url(#shadow)" />
                <circle cx="0" cy="0" r="35" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                {/* Icon Graphic */}
                <circle cx="-5" cy="-5" r="12" stroke="#1a3a52" strokeWidth="3" />
                <path d="M5 5 L12 12" stroke="#1a3a52" strokeWidth="3" strokeLinecap="round" />

                <rect x="-24" y="45" width="48" height="20" rx="10" fill="#1a3a52" />
                <text x="0" y="59" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SEO</text>
            </g>
        </g>

        {/* 2. Social Icon */}
        <g className="icon-social" transform="translate(260, 100)">
            <g className="icon-content">
                <circle cx="0" cy="0" r="35" fill="white" filter="url(#shadow)" />
                <circle cx="0" cy="0" r="35" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                {/* Icon Graphic */}
                <path d="M-10 -10 H5 L15 -18 V18 L5 10 H-10 V-10 Z" fill="#C5D63D" stroke="#1a3a52" strokeWidth="2" strokeLinejoin="round" />
                <path d="M18 -5 Q22 0 18 5" stroke="#1a3a52" strokeWidth="2" strokeLinecap="round" />

                <rect x="-28" y="45" width="56" height="20" rx="10" fill="#1a3a52" />
                <text x="0" y="59" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Social</text>
            </g>
        </g>

        {/* 3. Ads Icon */}
        <g className="icon-ads" transform="translate(420, 200)">
            <g className="icon-content">
                <circle cx="0" cy="0" r="35" fill="white" filter="url(#shadow)" />
                <circle cx="0" cy="0" r="35" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                {/* Icon Graphic */}
                <circle cx="0" cy="0" r="15" stroke="#1a3a52" strokeWidth="2" />
                <circle cx="0" cy="0" r="10" stroke="#1a3a52" strokeWidth="2" />
                <circle cx="0" cy="0" r="4" fill="#C5D63D" />
                <path d="M0 -18 V-22 M0 18 V22 M-18 0 H-22 M18 0 H22" stroke="#1a3a52" strokeWidth="2" />

                <rect x="-24" y="45" width="48" height="20" rx="10" fill="#1a3a52" />
                <text x="0" y="59" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Ads</text>
            </g>
        </g>

        {/* Label */}
        <text x="410" y="125" fill="#1a3a52" fontSize="16" fontWeight="bold" fontFamily="sans-serif" className="dot">+128%</text>

    </svg>
)

const slides = [
    {
        title: 'Daha Az Zaman,',
        titleHighlight: 'Daha Fazla Sonuç!',
        description: 'khilonfast, pazarlama çözümlerinde hızlı yolunuz. Büyümeyi destekleyen ve ölçülebilir sonuçlar sunan pazarlama stratejileri ile işinize değer katıyoruz.',
        component: <HeroGrowthSvg />
    }
]

export default function Hero() {
    // Single slide static version - removed unused state for build
    // const [currentSlide, setCurrentSlide] = useState(0)

    const nextSlide = () => { /* Static */ }
    const prevSlide = () => { /* Static */ }
    const goToSlide = (_index: number) => { /* Static */ }

    return (
        <section id="home" className="hero">
            <div className="container hero-container">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            <span className="typing-line typing-line-1">Daha Az Zaman,</span>
                            <br />
                            <span className="typing-line typing-line-2 title-highlight">Daha Fazla Sonuç!</span>
                        </h1>
                        <p className="hero-description">
                            {slides[0].description}
                        </p>
                    </div>

                    <div className="hero-buttons">
                        <button className="btn btn-primary">Hemen Başlayın</button>
                        <button className="btn btn-secondary">Hizmetlerimiz</button>
                    </div>

                    <div className="hero-controls">
                        <div className="hero-arrows">
                            <button className="hero-arrow" onClick={prevSlide} aria-label="Previous">
                                <HiArrowLeft />
                            </button>
                            <button className="hero-arrow" onClick={nextSlide} aria-label="Next">
                                <HiArrowRight />
                            </button>
                        </div>
                        <div className="hero-dots">
                            {[0, 1, 2].map((_, index) => (
                                <button
                                    key={index}
                                    className={`hero-dot ${index === 0 ? 'active' : ''}`}
                                    onClick={() => goToSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="hero-image">
                    <div className="hero-image-wrapper">
                        <HeroGrowthSvg />
                    </div>
                </div>
            </div>
        </section>
    )
}
