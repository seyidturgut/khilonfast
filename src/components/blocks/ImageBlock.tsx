interface ImageBlockData {
    src: string;
    alt: string;
    size?: 'small' | 'medium' | 'large' | 'full';
    alignment?: 'left' | 'center' | 'right';
    borderRadius?: number;
}

interface ImageBlockProps {
    data: ImageBlockData;
}

export default function ImageBlock({ data }: ImageBlockProps) {
    const {
        src,
        alt,
        size = 'medium',
        alignment = 'center',
        borderRadius = 16
    } = data;

    const sizeMap = {
        small: '400px',
        medium: '600px',
        large: '800px',
        full: '100%'
    };

    const containerStyle: React.CSSProperties = {
        textAlign: alignment as any,
        padding: '2rem 0'
    };

    const imageStyle: React.CSSProperties = {
        maxWidth: sizeMap[size],
        width: '100%',
        height: 'auto',
        borderRadius: `${borderRadius}px`,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        display: alignment === 'center' ? 'block' : 'inline-block',
        margin: alignment === 'center' ? '0 auto' : '0',
        transition: 'transform 0.3s ease'
    };

    return (
        <section style={{ padding: '2rem 0' }}>
            <div className="container" style={containerStyle}>
                <img
                    src={src}
                    alt={alt}
                    style={imageStyle}
                    loading="lazy"
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
            </div>
        </section>
    );
}
