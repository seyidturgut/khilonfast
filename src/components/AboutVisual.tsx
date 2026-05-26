import React from 'react';

const AboutVisual: React.FC = () => {
    return (
        <div className="about-visual-image-container" style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
            <div className="about-image-glow" />
            <img
                src="/images/about/visual.webp"
                alt="khilonfast dijital strateji ve pazarlama planlamasını temsil eden görsel"
                className="about-image"
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '24px',
                    display: 'block',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                    zIndex: 2,
                    position: 'relative'
                }}
            />
        </div>
    );
};

export default AboutVisual;
