import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiSave, HiArrowLeft, HiPlus, HiTrash } from 'react-icons/hi';

type TrainingFeature = { title: string; description: string };
type TrainingFaq = { question: string; answer: string };

type TrainingContent = {
    hero: {
        title: string;
        subtitle: string;
        description: string;
        buttonText: string;
        buttonLink: string;
        badgeText: string;
        image: string;
    };
    videoShowcase: {
        tag: string;
        title: string;
        description: string;
        videoUrl: string;
    };
    featuresSection: {
        tag: string;
        title: string;
        description: string;
        features: TrainingFeature[];
    };
    pricingSection: {
        tag: string;
        title: string;
        description: string;
    };
    testimonial: {
        quote: string;
        author: string;
        role: string;
    };
    faqs: TrainingFaq[];
};

const emptyContent = (): TrainingContent => ({
    hero: {
        title: '',
        subtitle: '',
        description: '',
        buttonText: '',
        buttonLink: '#pricing',
        badgeText: '',
        image: ''
    },
    videoShowcase: {
        tag: '',
        title: '',
        description: '',
        videoUrl: ''
    },
    featuresSection: {
        tag: '',
        title: '',
        description: '',
        features: []
    },
    pricingSection: {
        tag: '',
        title: '',
        description: ''
    },
    testimonial: {
        quote: '',
        author: '',
        role: ''
    },
    faqs: []
});

export default function TrainingContentEditor() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const navigate = useNavigate();
    const params = useParams();
    const slugParam = params['*'] || '';
    const decodedSlug = decodeURIComponent(slugParam);

    const [activeLang, setActiveLang] = useState<'tr' | 'en'>('tr');
    const [pageId, setPageId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [contentByLang, setContentByLang] = useState<{ tr: TrainingContent; en: TrainingContent }>({
        tr: emptyContent(),
        en: emptyContent()
    });

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const token = localStorage.getItem('token');
                const pagesRes = await fetch(`${ADMIN_API_BASE}/admin/pages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!pagesRes.ok) throw new Error('Sayfalar getirilemedi');
                const pages = await pagesRes.json();
                let page = pages.find((p: any) => p.slug === decodedSlug);

                if (!page) {
                    const createRes = await fetch(`${ADMIN_API_BASE}/admin/pages`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: decodedSlug || 'Eğitim Sayfası',
                            slug: decodedSlug,
                            meta_title: '',
                            meta_description: ''
                        })
                    });
                    if (!createRes.ok) throw new Error('Sayfa oluşturulamadı');
                    const created = await createRes.json();
                    page = { id: created.id, slug: decodedSlug };
                }

                setPageId(page.id);

                const contentRes = await fetch(`${ADMIN_API_BASE}/admin/pages/${page.id}/content`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (contentRes.ok) {
                    const data = await contentRes.json();
                    let raw: any = null;
                    if (data?.content_json) {
                        if (typeof data.content_json === 'string') {
                            try {
                                raw = JSON.parse(data.content_json);
                            } catch {
                                raw = null;
                            }
                        } else if (typeof data.content_json === 'object') {
                            raw = data.content_json;
                        }
                    }
                    if (raw && typeof raw === 'object') {
                        setContentByLang({
                            tr: raw.tr || emptyContent(),
                            en: raw.en || emptyContent()
                        });
                    }
                }
            } catch (err) {
                console.error(err);
                alert('İçerik yüklenirken hata oluştu.');
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, [ADMIN_API_BASE, decodedSlug]);

    const currentContent = contentByLang[activeLang];

    const updateContent = (patch: Partial<TrainingContent>) => {
        setContentByLang(prev => ({
            ...prev,
            [activeLang]: { ...prev[activeLang], ...patch }
        }));
    };

    const updateNested = <K extends keyof TrainingContent>(
        key: K,
        patch: Partial<TrainingContent[K]>
    ) => {
        setContentByLang(prev => ({
            ...prev,
            [activeLang]: {
                ...prev[activeLang],
                [key]: { ...(prev[activeLang][key] as object), ...patch }
            }
        }));
    };

    const updateFeatures = (features: TrainingFeature[]) => {
        updateNested('featuresSection', { features });
    };

    const updateFaqs = (faqs: TrainingFaq[]) => {
        updateContent({ faqs });
    };

    const handleSave = async () => {
        if (!pageId) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/pages/${pageId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content_json: contentByLang, is_published: true })
            });
            if (!res.ok) throw new Error('Kaydedilemedi');
        } catch (err) {
            console.error(err);
            alert('Kaydetme sırasında hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="card" style={{ padding: '2rem' }}>Yükleniyor...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/admin/pages')}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', cursor: 'pointer', marginBottom: '1rem' }}
                >
                    <HiArrowLeft /> Sayfalara Dön
                </button>
                <h1 style={{ fontSize: '1.6rem', color: '#1a3a52', fontWeight: 800 }}>
                    Eğitim İçeriği Düzenle
                </h1>
                <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Slug: /{decodedSlug}</div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => setActiveLang('tr')}
                        style={{
                            borderRadius: '999px',
                            padding: '0.35rem 0.9rem',
                            background: activeLang === 'tr' ? '#1a3a52' : 'transparent',
                            color: activeLang === 'tr' ? '#fff' : '#1a3a52',
                            border: '1px solid rgba(26,58,82,0.4)',
                            cursor: 'pointer'
                        }}
                    >
                        TR
                    </button>
                    <button
                        onClick={() => setActiveLang('en')}
                        style={{
                            borderRadius: '999px',
                            padding: '0.35rem 0.9rem',
                            background: activeLang === 'en' ? '#1a3a52' : 'transparent',
                            color: activeLang === 'en' ? '#fff' : '#1a3a52',
                            border: '1px solid rgba(26,58,82,0.4)',
                            cursor: 'pointer'
                        }}
                    >
                        EN
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, #1a3a52 0%, #89b004 100%)',
                            border: 'none',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '10px',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            opacity: saving ? 0.6 : 1
                        }}
                    >
                        <HiSave /> Kaydet
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Hero</h2>
                <div className="form-group">
                    <label>Başlık</label>
                    <input className="form-control" value={currentContent.hero.title} onChange={e => updateNested('hero', { title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Alt Başlık</label>
                    <input className="form-control" value={currentContent.hero.subtitle} onChange={e => updateNested('hero', { subtitle: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Açıklama</label>
                    <textarea className="form-control" rows={3} value={currentContent.hero.description} onChange={e => updateNested('hero', { description: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Buton Metni</label>
                    <input className="form-control" value={currentContent.hero.buttonText} onChange={e => updateNested('hero', { buttonText: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Buton Link</label>
                    <input className="form-control" value={currentContent.hero.buttonLink} onChange={e => updateNested('hero', { buttonLink: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Badge Metni</label>
                    <input className="form-control" value={currentContent.hero.badgeText} onChange={e => updateNested('hero', { badgeText: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Görsel URL</label>
                    <input className="form-control" value={currentContent.hero.image} onChange={e => updateNested('hero', { image: e.target.value })} />
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Video Bölümü</h2>
                <div className="form-group">
                    <label>Etiket</label>
                    <input className="form-control" value={currentContent.videoShowcase.tag} onChange={e => updateNested('videoShowcase', { tag: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Başlık</label>
                    <input className="form-control" value={currentContent.videoShowcase.title} onChange={e => updateNested('videoShowcase', { title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Açıklama</label>
                    <textarea className="form-control" rows={3} value={currentContent.videoShowcase.description} onChange={e => updateNested('videoShowcase', { description: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Video URL</label>
                    <input className="form-control" value={currentContent.videoShowcase.videoUrl} onChange={e => updateNested('videoShowcase', { videoUrl: e.target.value })} />
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Özellikler</h2>
                <div className="form-group">
                    <label>Etiket</label>
                    <input className="form-control" value={currentContent.featuresSection.tag} onChange={e => updateNested('featuresSection', { tag: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Başlık</label>
                    <input className="form-control" value={currentContent.featuresSection.title} onChange={e => updateNested('featuresSection', { title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Açıklama</label>
                    <textarea className="form-control" rows={2} value={currentContent.featuresSection.description} onChange={e => updateNested('featuresSection', { description: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {currentContent.featuresSection.features.map((item, index) => (
                        <div key={index} className="card" style={{ padding: '1rem', background: '#f8fafc' }}>
                            <div className="form-group">
                                <label>Başlık</label>
                                <input
                                    className="form-control"
                                    value={item.title}
                                    onChange={e => {
                                        const next = [...currentContent.featuresSection.features];
                                        next[index] = { ...next[index], title: e.target.value };
                                        updateFeatures(next);
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    value={item.description}
                                    onChange={e => {
                                        const next = [...currentContent.featuresSection.features];
                                        next[index] = { ...next[index], description: e.target.value };
                                        updateFeatures(next);
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const next = currentContent.featuresSection.features.filter((_, i) => i !== index);
                                    updateFeatures(next);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                            >
                                <HiTrash /> Sil
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => updateFeatures([...currentContent.featuresSection.features, { title: '', description: '' }])}
                    style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}
                >
                    <HiPlus /> Özellik Ekle
                </button>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Fiyat Bölümü</h2>
                <div className="form-group">
                    <label>Etiket</label>
                    <input className="form-control" value={currentContent.pricingSection.tag} onChange={e => updateNested('pricingSection', { tag: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Başlık</label>
                    <input className="form-control" value={currentContent.pricingSection.title} onChange={e => updateNested('pricingSection', { title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Açıklama</label>
                    <textarea className="form-control" rows={2} value={currentContent.pricingSection.description} onChange={e => updateNested('pricingSection', { description: e.target.value })} />
                </div>
                <small style={{ color: '#64748b' }}>Fiyatlar ürün yönetiminden çekilir.</small>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Referans</h2>
                <div className="form-group">
                    <label>Alıntı</label>
                    <textarea className="form-control" rows={3} value={currentContent.testimonial.quote} onChange={e => updateNested('testimonial', { quote: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>İsim</label>
                    <input className="form-control" value={currentContent.testimonial.author} onChange={e => updateNested('testimonial', { author: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Unvan</label>
                    <input className="form-control" value={currentContent.testimonial.role} onChange={e => updateNested('testimonial', { role: e.target.value })} />
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>SSS</h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {currentContent.faqs.map((item, index) => (
                        <div key={index} className="card" style={{ padding: '1rem', background: '#f8fafc' }}>
                            <div className="form-group">
                                <label>Soru</label>
                                <input
                                    className="form-control"
                                    value={item.question}
                                    onChange={e => {
                                        const next = [...currentContent.faqs];
                                        next[index] = { ...next[index], question: e.target.value };
                                        updateFaqs(next);
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Cevap</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    value={item.answer}
                                    onChange={e => {
                                        const next = [...currentContent.faqs];
                                        next[index] = { ...next[index], answer: e.target.value };
                                        updateFaqs(next);
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => updateFaqs(currentContent.faqs.filter((_, i) => i !== index))}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                            >
                                <HiTrash /> Sil
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => updateFaqs([...currentContent.faqs, { question: '', answer: '' }])}
                    style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}
                >
                    <HiPlus /> Soru Ekle
                </button>
            </div>
        </AdminLayout>
    );
}
