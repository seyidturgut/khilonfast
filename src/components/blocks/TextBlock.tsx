interface TextBlockData {
    heading?: string;
    content: string;
    alignment?: 'left' | 'center' | 'right';
    backgroundColor?: 'none' | 'light-gray';
}

interface TextBlockProps {
    data: TextBlockData;
}

export default function TextBlock({ data }: TextBlockProps) {
    const {
        heading,
        content,
        alignment = 'left',
        backgroundColor = 'none'
    } = data;

    return (
        <section style={{
            padding: '3rem 0',
            background: backgroundColor === 'light-gray' ? '#f9fafb' : 'transparent'
        }}>
            <div className="container" style={{ textAlign: alignment }}>
                {heading && (
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#1a3a52',
                        marginBottom: '1.5rem',
                        lineHeight: 1.3
                    }}>
                        {heading}
                    </h2>
                )}
                <p style={{
                    fontSize: '1.1rem',
                    lineHeight: 1.8,
                    color: '#4a5568',
                    maxWidth: '800px',
                    margin: alignment === 'center' ? '0 auto' : '0'
                }}>
                    {content}
                </p>
            </div>
        </section>
    );
}

