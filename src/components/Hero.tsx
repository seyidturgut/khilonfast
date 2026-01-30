import './Hero.css'
import HeroBackgroundEffect from './HeroBackgroundEffect'

const slides = [
    {
        title: 'Daha Az Zaman,',
        titleHighlight: 'Daha Fazla Sonuç!',
        description: 'khilonfast, pazarlama çözümlerinde hızlı yolunuz. Büyümeyi destekleyen ve ölçülebilir sonuçlar sunan pazarlama stratejileri ile işinize değer katıyoruz.',
    }
]

export default function Hero() {
    return (
        <section id="home" className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background Layer: Full-screen Data Flow Lines */}
            <HeroBackgroundEffect />

            <div className="container hero-container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="hero-content">
                    <span className="hero-subtitle">KHILONFAST PAZARLAMA ÇÖZÜMLERİ</span>
                    <h1 className="hero-title">
                        {slides[0].title}<br />
                        <span className="text-highlight">{slides[0].titleHighlight}</span>
                    </h1>
                    <p className="hero-description">{slides[0].description}</p>
                    <div className="hero-actions">
                        <a href="#contact" className="btn btn-primary">Hemen Başlayın</a>
                        <a href="#services" className="btn btn-secondary">Hizmetlerimiz</a>
                    </div>
                </div>

                <div className="hero-image">
                    {/* Background lines provide the primary visual now */}
                </div>
            </div>
        </section>
    )
}
