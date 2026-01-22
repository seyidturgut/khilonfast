import './CTA.css'

export default function CTA() {
    return (
        <section className="cta">
            <div className="container cta-container">
                <div className="cta-content">
                    <h2 className="cta-title">
                        İşletmenizin Potansiyeline<br />
                        khilonfast ile Ulaşın!
                    </h2>
                    <p className="cta-description">
                        Size özel yaklaşımımızla, işletmenizin somut sonuçlar elde etmesine ve
                        rakiplerinizin önüne geçmesine yardımcı oluyoruz.
                    </p>
                    <button className="btn btn-cta">
                        Bize Ulaşın
                    </button>
                </div>

                <div className="cta-visual">
                    <svg className="cta-svg" viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Background Gradient */}
                        <defs>
                            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#C5D63D" stopOpacity="0.1" />
                            </linearGradient>
                            <linearGradient id="stairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e8e8e8" />
                                <stop offset="100%" stopColor="#d0d0d0" />
                            </linearGradient>
                        </defs>

                        {/* Sky Background */}
                        <rect width="600" height="500" fill="url(#skyGradient)" />

                        {/* Stairs */}
                        <g className="stairs">
                            <rect x="100" y="420" width="120" height="30" rx="4" fill="url(#stairGradient)" opacity="0.9" />
                            <rect x="150" y="380" width="120" height="30" rx="4" fill="url(#stairGradient)" opacity="0.9" />
                            <rect x="200" y="340" width="120" height="30" rx="4" fill="url(#stairGradient)" opacity="0.9" />
                            <rect x="250" y="300" width="120" height="30" rx="4" fill="url(#stairGradient)" opacity="0.9" />
                            <rect x="300" y="260" width="120" height="30" rx="4" fill="url(#stairGradient)" opacity="0.9" />
                            <rect x="350" y="220" width="120" height="30" rx="4" fill="url(#stairGradient)" opacity="0.9" />
                            <rect x="400" y="180" width="120" height="30" rx="4" fill="url(#stairGradient)" opacity="0.9" />
                        </g>

                        {/* Success Person */}
                        <g className="success-person">
                            {/* Body */}
                            <ellipse cx="480" cy="160" rx="12" ry="18" fill="#1a3a52" />

                            {/* Head */}
                            <circle cx="480" cy="135" r="12" fill="#1a3a52" />

                            {/* Arms up (celebrating) */}
                            <line x1="480" y1="145" x2="465" y2="125" stroke="#1a3a52" strokeWidth="4" strokeLinecap="round" />
                            <line x1="480" y1="145" x2="495" y2="125" stroke="#1a3a52" strokeWidth="4" strokeLinecap="round" />

                            {/* Legs */}
                            <line x1="480" y1="178" x2="472" y2="200" stroke="#1a3a52" strokeWidth="4" strokeLinecap="round" />
                            <line x1="480" y1="178" x2="488" y2="200" stroke="#1a3a52" strokeWidth="4" strokeLinecap="round" />
                        </g>

                        {/* Success Stars */}
                        <g className="stars">
                            <circle cx="450" cy="100" r="4" fill="#C5D63D" className="star star-1" />
                            <circle cx="510" cy="110" r="3" fill="#C5D63D" className="star star-2" />
                            <circle cx="470" cy="80" r="3" fill="#C5D63D" className="star star-3" />
                            <circle cx="490" cy="90" r="5" fill="#C5D63D" className="star star-4" />
                        </g>

                        {/* Light Rays */}
                        <g className="light-rays" opacity="0.3">
                            <path d="M 480 120 L 420 50" stroke="#C5D63D" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 480 120 L 480 30" stroke="#C5D63D" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 480 120 L 540 50" stroke="#C5D63D" strokeWidth="3" strokeLinecap="round" />
                        </g>

                        {/* Flying Arrows (Growth) */}
                        <g className="growth-arrows">
                            <path d="M 80 400 L 120 350" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" className="arrow arrow-1" />
                            <path d="M 115 355 L 120 350 L 125 355" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" fill="none" className="arrow arrow-1" />

                            <path d="M 140 380 L 180 320" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" className="arrow arrow-2" />
                            <path d="M 175 325 L 180 320 L 185 325" stroke="#C5D63D" strokeWidth="4" strokeLinecap="round" fill="none" className="arrow arrow-2" />
                        </g>
                    </svg>
                </div>
            </div>
        </section>
    )
}
