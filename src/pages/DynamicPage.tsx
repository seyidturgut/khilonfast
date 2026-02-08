import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import HeroBlock from '../components/blocks/HeroBlock';
import FAQBlock from '../components/blocks/FAQBlock';
import FeaturesBlock from '../components/blocks/FeaturesBlock';
import CTABlock from '../components/blocks/CTABlock';
import TextBlock from '../components/blocks/TextBlock';
import ImageBlock from '../components/blocks/ImageBlock';
import ButtonBlock from '../components/blocks/ButtonBlock';
import SpacerBlock from '../components/blocks/SpacerBlock';

// Component Registry: Maps string types from DB to React components
const BLOCK_COMPONENTS: Record<string, any> = {
    // Structural blocks
    'hero': HeroBlock,
    'features': FeaturesBlock,
    'cta': CTABlock,
    'faq': FAQBlock,
    // Content elements
    'text': TextBlock,
    'image': ImageBlock,
    'button': ButtonBlock,
    'spacer': SpacerBlock,
};

export default function DynamicPage() {
    const { slug } = useParams<{ slug: string }>();
    const [pageData, setPageData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // In a real app, this would fetch from /api/pages/:slug
        // For now, let's simulate a fetch or return null
        const fetchPage = async () => {
            setLoading(true);
            try {
                // TODO: Replace with real API call
                // const res = await fetch(`/api/pages/${slug}`);
                // const data = await res.json();

                // Simulated 404 for now since we have no data
                setError(true);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchPage();
    }, [slug]);

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Yükleniyor...</div>;

    if (error || !pageData) {
        return (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
                <h1>404</h1>
                <p>Sayfa bulunamadı veya henüz oluşturulmadı.</p>
            </div>
        );
    }

    return (
        <div className="dynamic-page">
            {pageData.blocks.map((block: any, index: number) => {
                const Component = BLOCK_COMPONENTS[block.type];
                if (!Component) {
                    return <div key={index}>Bilinmeyen Blok Tipi: {block.type}</div>;
                }
                return <Component key={block.id || index} data={block.data} />;
            })}
        </div>
    );
}
