import '../Hero.css';
import HeroBackgroundEffect from '../HeroBackgroundEffect';

interface HeroBlockProps {
    data: {
        subtitle?: string;
        title?: string;
        titleHighlight?: string;
        description?: string;
        button1Text?: string;
        button1Link?: string;
        button2Text?: string;
        button2Link?: string;
    };
}

export default function HeroBlock({ data }: HeroBlockProps) {
    const {
        subtitle = 'KHILONFAST PAZARLAMA ÇÖZÜMLERİ',
        title = 'Daha Az Zaman,',
        titleHighlight = 'Daha Fazla Sonuç!',
        description = 'khilonfast, pazarlama çözümlerinde hızlı yolunuz. Büyümeyi destekleyen ve ölçülebilir sonuçlar sunan pazarlama stratejileri ile işinize değer katıyoruz.',
        button1Text = 'Hemen Başlayın',
        button1Link = '#contact',
        button2Text = 'Hizmetlerimiz',
        button2Link = '#services'
    } = data;

    return (
        <section id="home" className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background Layer: Full-screen Data Flow Lines */}
            <HeroBackgroundEffect />

            <div className="container hero-container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="hero-content">
                    <span className="hero-subtitle">{subtitle}</span>
                    <h1 className="hero-title">
                        {title}<br />
                        <span className="text-highlight">{titleHighlight}</span>
                    </h1>
                    <p className="hero-description">{description}</p>
                    <div className="hero-actions">
                        <a href={button1Link} className="btn btn-primary">{button1Text}</a>
                        {button2Text && <a href={button2Link} className="btn btn-secondary">{button2Text}</a>}
                    </div>
                </div>

                <div className="hero-image">
                    {/* Background lines provide the primary visual now */}
                </div>
            </div>
        </section>
    );
}
