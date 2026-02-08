import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { HiSave, HiArrowUp, HiArrowDown, HiTrash, HiCursorClick, HiArrowsExpand } from 'react-icons/hi';
import { HiRocketLaunch, HiQuestionMarkCircle, HiCurrencyDollar, HiCheckCircle, HiMegaphone, HiDocumentText, HiPhoto } from 'react-icons/hi2';

// Import all block components for rendering
import HeroBlock from '../../components/blocks/HeroBlock';
import FeaturesBlock from '../../components/blocks/FeaturesBlock';
import CTABlock from '../../components/blocks/CTABlock';
import FAQBlock from '../../components/blocks/FAQBlock';
import TextBlock from '../../components/blocks/TextBlock';
import ImageBlock from '../../components/blocks/ImageBlock';
import ButtonBlock from '../../components/blocks/ButtonBlock';
import SpacerBlock from '../../components/blocks/SpacerBlock';

// Block component registry
const BLOCK_COMPONENTS: Record<string, any> = {
    'hero': HeroBlock,
    'features': FeaturesBlock,
    'cta': CTABlock,
    'faq': FAQBlock,
    'text': TextBlock,
    'image': ImageBlock,
    'button': ButtonBlock,
    'spacer': SpacerBlock,
};

// Block types with categories
const STRUCTURAL_BLOCKS = [
    { type: 'hero', label: 'Hero', icon: HiRocketLaunch, description: 'Büyükbaşlık, açıklama ve CTA butonları' },
    { type: 'features', label: 'Özellikler', icon: HiCheckCircle, description: 'Hizmet özellikleri + grafik' },
    { type: 'cta', label: 'CTA', icon: HiMegaphone, description: 'Aksiyon odaklı bölüm' },
    { type: 'faq', label: 'SSS', icon: HiQuestionMarkCircle, description: 'Soru-cevap accordion' },
    { type: 'pricing', label: 'Fiyat', icon: HiCurrencyDollar, description: 'Fiyatlandırma tablosu' },
];

const CONTENT_BLOCKS = [
    { type: 'text', label: 'Metin', icon: HiDocumentText, description: 'Başlık + paragraf' },
    { type: 'image', label: 'Resim', icon: HiPhoto, description: 'Responsive resim' },
    { type: 'button', label: 'Buton', icon: HiCursorClick, description: 'CTA butonu' },
    { type: 'spacer', label: 'Boşluk', icon: HiArrowsExpand, description: 'Özel boşluk' },
];

const PAGE_CATEGORIES = [
    { value: 'hizmetler', label: 'Hizmetler' },
    { value: 'cozumler', label: 'Çözümler' },
    { value: 'urunler', label: 'Ürünler' },
    { value: 'kurumsal', label: 'Kurumsal' },
    { value: 'blog', label: 'Blog' },
    { value: 'diger', label: 'Diğer' },
];

export default function PageBuilder() {
    const [pageMeta, setPageMeta] = useState({ title: '', category: 'hizmetler' });
    const [blocks, setBlocks] = useState<any[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

    // Auto-generate slug
    const generateSlug = (category: string, title: string) => {
        const slugTitle = title
            .toLowerCase()
            .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
            .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return category ? `${category}/${slugTitle}` : slugTitle;
    };

    const generatedSlug = generateSlug(pageMeta.category, pageMeta.title);

    // Block Management
    const addBlock = (type: string) => {
        const newBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            data: getDefaultBlockData(type)
        };
        setBlocks([...blocks, newBlock]);
        setSelectedBlockId(newBlock.id);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...blocks];
        if (direction === 'up' && index > 0) {
            [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
        } else if (direction === 'down' && index < newBlocks.length - 1) {
            [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
        }
        setBlocks(newBlocks);
    };

    const updateBlockData = (id: string, newData: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...newData } } : b));
    };

    // Get default data for new blocks
    const getDefaultBlockData = (type: string): any => {
        const defaults: Record<string, any> = {
            hero: {
                subtitle: 'KHILONFAST PAZARLAMA ÇÖZÜMLERİ',
                title: 'Yeni Sayfanız',
                titleHighlight: 'Buraya Başlık!',
                description: 'Açıklama metni buraya gelecek...',
                button1Text: 'Hemen Başlayın',
                button1Link: '#contact',
                button2Text: 'Daha Fazla Bilgi',
                button2Link: '#info'
            },
            features: {
                title: 'Büyüme Odaklı\nPazarlama Çözümlerimizi\nKeşfedin',
                description: 'Özelliklerinizi buraya ekleyin',
                features: [
                    { title: 'Özellik 1' },
                    { title: 'Özellik 2' },
                    { title: 'Özellik 3' }
                ]
            },
            cta: {
                title: 'Harekete Geçin!',
                description: 'Açıklama metni',
                buttonText: 'Bize Ulaşın',
                buttonLink: '#contact'
            },
            faq: {
                subtitle: 'Sıkça sorulan sorular',
                items: [
                    { question: 'Soru 1?', answer: 'Cevap 1' },
                    { question: 'Soru 2?', answer: 'Cevap 2' }
                ]
            },
            text: {
                heading: 'Başlık',
                content: 'Buraya metin içeriğinizi yazın...',
                alignment: 'left',
                backgroundColor: 'none'
            },
            image: {
                src: 'https://via.placeholder.com/800x400',
                alt: 'Resim açıklaması',
                size: 'medium',
                alignment: 'center',
                borderRadius: 16
            },
            button: {
                text: 'Tıklayın',
                link: '#',
                style: 'primary',
                size: 'normal',
                icon: 'arrow',
                alignment: 'center'
            },
            spacer: {
                height: 60
            }
        };
        return defaults[type] || {};
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    // Property Editors for each block type
    const renderPropertyEditor = () => {
        if (!selectedBlock) {
            return (
                <div className="empty-editor">
                    <HiCursorClick size={48} style={{ color: '#64748b', marginBottom: '1rem' }} />
                    <p>Bir blok seçin</p>
                    <small>Canvas'ta bir bloğa tıklayarak düzenlemeye başlayın</small>
                </div>
            );
        }

        const block = selectedBlock;

        // Helper for common inputs
        const renderInput = (label: string, key: string, placeholder = '', type = 'text') => (
            <div className="form-group">
                <label>{label}</label>
                <input
                    type={type}
                    value={block.data[key] || ''}
                    onChange={e => updateBlockData(block.id, { [key]: e.target.value })}
                    className="form-control"
                    placeholder={placeholder}
                />
            </div>
        );

        const renderTextarea = (label: string, key: string, rows = 3, placeholder = '') => (
            <div className="form-group">
                <label>{label}</label>
                <textarea
                    value={block.data[key] || ''}
                    onChange={e => updateBlockData(block.id, { [key]: e.target.value })}
                    className="form-control"
                    rows={rows}
                    placeholder={placeholder}
                />
            </div>
        );

        // Block-specific editors
        if (block.type === 'text') {
            return (
                <div>
                    <h3>📄 Metin Bloğu</h3>
                    {renderInput('Başlık (H2)', 'heading', 'Opsiyonel')}
                    {renderTextarea('İçerik', 'content', 6, 'Buraya metin içeriğinizi yazın...')}
                    <div className="form-group">
                        <label>Hizalama</label>
                        <select
                            value={block.data.alignment || 'left'}
                            onChange={e => updateBlockData(block.id, { alignment: e.target.value })}
                            className="form-control"
                        >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Arka Plan</label>
                        <select
                            value={block.data.backgroundColor || 'none'}
                            onChange={e => updateBlockData(block.id, { backgroundColor: e.target.value })}
                            className="form-control"
                        >
                            <option value="none">Yok</option>
                            <option value="light-gray">Açık Gri</option>
                        </select>
                    </div>
                </div>
            );
        }

        if (block.type === 'image') {
            return (
                <div>
                    <h3>🖼️ Resim Bloğu</h3>
                    {renderInput('Resim URL', 'src', 'https://...')}
                    {renderInput('Alt Text (SEO)', 'alt', 'Resim açıklaması')}
                    <div className="form-group">
                        <label>Boyut</label>
                        <select
                            value={block.data.size || 'medium'}
                            onChange={e => updateBlockData(block.id, { size: e.target.value })}
                            className="form-control"
                        >
                            <option value="small">Küçük (400px)</option>
                            <option value="medium">Orta (600px)</option>
                            <option value="large">Büyük (800px)</option>
                            <option value="full">Tam Genişlik</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Hizalama</label>
                        <select
                            value={block.data.alignment || 'center'}
                            onChange={e => updateBlockData(block.id, { alignment: e.target.value })}
                            className="form-control"
                        >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                        </select>
                    </div>
                    {renderInput('Border Radius', 'borderRadius', '16', 'number')}
                </div>
            );
        }

        if (block.type === 'button') {
            return (
                <div>
                    <h3>🔘 Buton Bloğu</h3>
                    {renderInput('Buton Metni', 'text', 'Tıklayın')}
                    {renderInput('Link', 'link', '/iletisim')}
                    <div className="form-group">
                        <label>Stil</label>
                        <select
                            value={block.data.style || 'primary'}
                            onChange={e => updateBlockData(block.id, { style: e.target.value })}
                            className="form-control"
                        >
                            <option value="primary">Primary (Turuncu)</option>
                            <option value="secondary">Secondary (Şeffaf)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Boyut</label>
                        <select
                            value={block.data.size || 'normal'}
                            onChange={e => updateBlockData(block.id, { size: e.target.value })}
                            className="form-control"
                        >
                            <option value="small">Küçük</option>
                            <option value="normal">Normal</option>
                            <option value="large">Büyük</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>İkon</label>
                        <select
                            value={block.data.icon || 'arrow'}
                            onChange={e => updateBlockData(block.id, { icon: e.target.value })}
                            className="form-control"
                        >
                            <option value="arrow">Ok →</option>
                            <option value="mail">Mail ✉</option>
                            <option value="phone">Telefon ☎</option>
                            <option value="download">İndir ⬇</option>
                            <option value="none">İkonsuz</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Hizalama</label>
                        <select
                            value={block.data.alignment || 'center'}
                            onChange={e => updateBlockData(block.id, { alignment: e.target.value })}
                            className="form-control"
                        >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                        </select>
                    </div>
                </div>
            );
        }

        if (block.type === 'spacer') {
            return (
                <div>
                    <h3>↔️ Boşluk</h3>
                    {renderInput('Yükseklik (px)', 'height', '60', 'number')}
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                        Bloklar arasında özel boşluk ekler
                    </small>
                </div>
            );
        }

        // Existing structural blocks (Hero, Features, CTA, FAQ) - keep previous editors
        if (block.type === 'hero') {
            return (
                <div>
                    <h3>🚀 Hero Bloğu</h3>
                    {renderInput('Üst Başlık', 'subtitle')}
                    {renderInput('Ana Başlık', 'title')}
                    {renderInput('Vurgulu Başlık', 'titleHighlight')}
                    {renderTextarea('Açıklama', 'description')}
                    {renderInput('Birinci Buton Metni', 'button1Text')}
                    {renderInput('Birinci Buton Link', 'button1Link')}
                    {renderInput('İkinci Buton Metni', 'button2Text', 'Opsiyonel')}
                    {renderInput('İkinci Buton Link', 'button2Link', 'Opsiyonel')}
                </div>
            );
        }

        if (block.type === 'features') {
            return (
                <div>
                    <h3>✓ Özellikler Bloğu</h3>
                    {renderTextarea('Başlık (\\n ile alt satır)', 'title', 3)}
                    {renderTextarea('Açıklama', 'description', 2)}
                    <div className="form-group">
                        <label>Özellikler (JSON)</label>
                        <textarea
                            value={JSON.stringify(block.data.features || [], null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateBlockData(block.id, { features: parsed });
                                } catch { }
                            }}
                            className="form-control"
                            rows={6}
                        />
                        <small style={{ color: '#94a3b8' }}>
                            Örnek: [{`{"title": "Özellik 1"}`}]
                        </small>
                    </div>
                </div>
            );
        }

        if (block.type === 'cta') {
            return (
                <div>
                    <h3>📣 CTA Bloğu</h3>
                    {renderTextarea('Başlık', 'title', 2)}
                    {renderTextarea('Açıklama', 'description', 3)}
                    {renderInput('Buton Metni', 'buttonText')}
                    {renderInput('Buton Link', 'buttonLink')}
                </div>
            );
        }

        if (block.type === 'faq') {
            return (
                <div>
                    <h3>❓ SSS Bloğu</h3>
                    {renderTextarea('Alt Başlık', 'subtitle', 2, 'Opsiyonel')}
                    <div className="form-group">
                        <label>Sorular (JSON)</label>
                        <textarea
                            value={JSON.stringify(block.data.items || [], null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateBlockData(block.id, { items: parsed });
                                } catch { }
                            }}
                            className="form-control"
                            rows={8}
                        />
                        <small style={{ color: '#94a3b8' }}>
                            Örnek: [{`{"question": "Soru?", "answer": "Cevap"}`}]
                        </small>
                    </div>
                </div>
            );
        }

        return <div className="empty-editor"><p>Bu blok tipi için editor hazırlanıyor...</p></div>;
    };

    return (
        <AdminLayout>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Sayfa Oluşturucu</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Kategori</label>
                            <select
                                value={pageMeta.category}
                                onChange={e => setPageMeta({ ...pageMeta, category: e.target.value })}
                                className="form-control"
                            >
                                {PAGE_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Sayfa Başlığı</label>
                            <input
                                placeholder="Örn: SEO Optimizasyonu"
                                value={pageMeta.title}
                                onChange={e => setPageMeta({ ...pageMeta, title: e.target.value })}
                                className="form-control"
                            />
                            <small style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                📌 URL: <code>/{generatedSlug || '...'}</code>
                            </small>
                        </div>
                    </div>
                </div>
                <button
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <HiSave /> Kaydet
                </button>
            </div>

            {/* Main Layout: Toolbox + Canvas + Properties */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr 340px',
                gap: '1.5rem',
                minHeight: '70vh'
            }}>
                {/* 1. Toolbox */}
                <div className="card" style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: '80vh' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '1rem' }}>
                        YAPISAL BLOKLAR
                    </h3>
                    {STRUCTURAL_BLOCKS.map(blockType => (
                        <button
                            key={blockType.type}
                            onClick={() => addBlock(blockType.type)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                background: 'rgba(14, 165, 233, 0.05)',
                                border: '1px solid rgba(14, 165, 233, 0.2)',
                                borderRadius: '8px',
                                color: '#cbd5e1',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.2)';
                            }}
                        >
                            <blockType.icon size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{blockType.label}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{blockType.description}</div>
                            </div>
                        </button>
                    ))}

                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', margin: '1.5rem 0 1rem' }}>
                        İÇERİK ELEMANLARI
                    </h3>
                    {CONTENT_BLOCKS.map(blockType => (
                        <button
                            key={blockType.type}
                            onClick={() => addBlock(blockType.type)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                background: 'rgba(245, 158, 11, 0.05)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                borderRadius: '8px',
                                color: '#cbd5e1',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                            }}
                        >
                            <blockType.icon size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{blockType.label}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{blockType.description}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* 2. Visual Canvas */}
                <div className="canvas card" style={{
                    padding: '0',
                    background: 'rgba(15, 23, 42, 0.3)',
                    overflowY: 'auto',
                    maxHeight: '80vh'
                }}>
                    {blocks.length === 0 ? (
                        <div className="empty-editor" style={{ padding: '4rem 2rem' }}>
                            <HiRocketLaunch size={64} style={{ color: '#64748b', marginBottom: '1.5rem' }} />
                            <h3>Sayfanız Boş</h3>
                            <p>Soldaki araç çubuğundan blok ekleyerek başlayın</p>
                        </div>
                    ) : (
                        blocks.map((block, index) => {
                            const Component = BLOCK_COMPONENTS[block.type];
                            if (!Component) return null;

                            const isSelected = selectedBlockId === block.id;
                            const isHovered = hoveredBlockId === block.id;

                            return (
                                <div
                                    key={block.id}
                                    onClick={() => setSelectedBlockId(block.id)}
                                    onMouseEnter={() => setHoveredBlockId(block.id)}
                                    onMouseLeave={() => setHoveredBlockId(null)}
                                    style={{
                                        position: 'relative',
                                        border: isSelected
                                            ? '2px solid #0ea5e9'
                                            : isHovered
                                                ? '2px dashed #0ea5e9'
                                                : '2px solid transparent',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {/* Block Toolbar */}
                                    {(isSelected || isHovered) && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            display: 'flex',
                                            gap: '4px',
                                            zIndex: 10,
                                            background: 'rgba(15, 23, 42, 0.9)',
                                            padding: '4px',
                                            borderRadius: '6px',
                                            backdropFilter: 'blur(10px)'
                                        }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }}
                                                disabled={index === 0}
                                                className="action-btn"
                                                title="Yukarı Taşı"
                                            >
                                                <HiArrowUp />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }}
                                                disabled={index === blocks.length - 1}
                                                className="action-btn"
                                                title="Aşağı Taşı"
                                            >
                                                <HiArrowDown />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                                className="action-btn delete"
                                                title="Sil"
                                            >
                                                <HiTrash />
                                            </button>
                                        </div>
                                    )}

                                    {/* Render Actual Block Component */}
                                    <Component data={block.data} />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 3. Properties Panel */}
                <div className="properties card" style={{
                    padding: '1.5rem',
                    overflowY: 'auto',
                    maxHeight: '80vh'
                }}>
                    {renderPropertyEditor()}
                </div>
            </div>

            <style>{`
                .form-control {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 8px;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    background: rgba(15, 23, 42, 0.5);
                    color: #f8fafc;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #0ea5e9;
                    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #cbd5e1;
                    margin-bottom: 0.5rem;
                }

                .action-btn {
                    padding: 6px;
                    background: rgba(14, 165, 233, 0.1);
                    border: 1px solid rgba(14, 165, 233, 0.2);
                    border-radius: 4px;
                    color: #0ea5e9;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn:hover:not(:disabled) {
                    background: rgba(14, 165, 233, 0.2);
                    border-color: rgba(14, 165, 233, 0.3);
                }

                .action-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .action-btn.delete {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                }

                .action-btn.delete:hover {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.3);
                }
            `}</style>
        </AdminLayout>
    );
}
