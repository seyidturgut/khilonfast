import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiSave, HiArrowLeft } from 'react-icons/hi';

export default function ProductEditor() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({
        product_key: '',
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        features: '',
        features_en: '',
        slug: '',
        slug_en: '',
        meta_title: '',
        meta_title_en: '',
        meta_description: '',
        meta_description_en: '',
        hero_vimeo_id: '',
        hero_vimeo_id_en: '',
        hero_image: '',
        hero_image_en: '',
        price: '',
        currency: 'TRY',
        category: 'hizmetler',
        type: 'service', // service, subscription, video_course
        duration_days: '',
        access_content_url: '',
        is_active: true,
        parent_id: ''
    });

    const [allProducts, setAllProducts] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState<{ tr: boolean; en: boolean }>({ tr: false, en: false });
    const [uploadProgress, setUploadProgress] = useState<{ tr: number; en: number }>({ tr: 0, en: 0 });

    useEffect(() => {
        if (isEdit) {
            const fetchProduct = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${ADMIN_API_BASE}/admin/products`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) return;
                    const data = await res.json();
                    const product = data.find((item: any) => Number(item.id) === Number(id));
                    if (!product) return;

                    setForm({
                        product_key: product.product_key || '',
                        name: product.name || '',
                        name_en: product.name_en || '',
                        description: product.description || '',
                        description_en: product.description_en || '',
                        features: product.features || '',
                        features_en: product.features_en || '',
                        slug: product.slug || '',
                        slug_en: product.slug_en || '',
                        meta_title: product.meta_title || '',
                        meta_title_en: product.meta_title_en || '',
                        meta_description: product.meta_description || '',
                        meta_description_en: product.meta_description_en || '',
                        hero_vimeo_id: product.hero_vimeo_id || '',
                        hero_vimeo_id_en: product.hero_vimeo_id_en || '',
                        hero_image: product.hero_image || '',
                        hero_image_en: product.hero_image_en || '',
                        price: product.price?.toString() || '',
                        currency: product.currency || 'TRY',
                        category: product.category || 'hizmetler',
                        type: product.type || 'service',
                        duration_days: product.duration_days?.toString() || '',
                        access_content_url: product.access_content_url || '',
                        is_active: Boolean(product.is_active),
                        parent_id: product.parent_id?.toString() || ''
                    });
                } catch (err) {
                    console.error(err);
                }
            };
            fetchProduct();
        }

        const fetchAllProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${ADMIN_API_BASE}/admin/products`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllProducts(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchAllProducts();
    }, [isEdit, id]);

    const translateField = async (field: 'name' | 'description' | 'features') => {
        const textToTranslate = (form as any)[field];
        if (!textToTranslate) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: textToTranslate,
                    target_lang: 'EN'
                })
            });

            if (!res.ok) throw new Error('Çeviri başarısız');
            const data = await res.json();
            setForm(prev => ({ ...prev, [`${field}_en`]: data.translation }));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const normalizeSlugInput = (value: string) =>
        value
            .trim()
            .replace(/^https?:\/\/[^/]+/i, '')
            .replace(/^\/+/, '')
            .replace(/^en\//, '')
            .replace(/\/{2,}/g, '/')
            .replace(/\/+$/, '');

    const uploadHeroImage = async (locale: 'tr' | 'en', file: File) => {
        setError('');
        setUploading(prev => ({ ...prev, [locale]: true }));
        setUploadProgress(prev => ({ ...prev, [locale]: 0 }));

        const token = localStorage.getItem('token');
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${ADMIN_API_BASE}/admin/products/upload-hero-image`);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.upload.onprogress = (evt) => {
                if (!evt.lengthComputable) return;
                const pct = Math.round((evt.loaded / evt.total) * 100);
                setUploadProgress(prev => ({ ...prev, [locale]: pct }));
            };
            xhr.onerror = () => reject(new Error('Yükleme sırasında ağ hatası oluştu.'));
            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText || '{}');
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(new Error(data.error || 'Görsel yükleme başarısız.'));
                        return;
                    }
                    const imagePath = data.path || '';
                    if (!imagePath) {
                        reject(new Error('Sunucudan görsel yolu alınamadı.'));
                        return;
                    }
                    setForm(prev => ({
                        ...prev,
                        [locale === 'tr' ? 'hero_image' : 'hero_image_en']: imagePath
                    }));
                    resolve();
                } catch {
                    reject(new Error('Sunucu yanıtı işlenemedi.'));
                }
            };

            const body = new FormData();
            body.append('file', file);
            body.append('locale', locale);
            body.append('product_key', form.product_key || 'product');
            xhr.send(body);
        }).finally(() => {
            setUploading(prev => ({ ...prev, [locale]: false }));
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const url = isEdit
                ? `${ADMIN_API_BASE}/admin/products/${id}`
                : `${ADMIN_API_BASE}/admin/products`;

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'İşlem başarısız');
            }

            navigate('/admin/products');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/products')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', cursor: 'pointer', marginBottom: '1rem' }}>
                    <HiArrowLeft /> Listeye Dön
                </button>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800 }}>
                    {isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                </h1>
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '800px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Ürün Adı (TR)</label>
                            <input
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Product Name (EN) - <button type="button" onClick={() => translateField('name')} style={{ color: '#0369a1', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}>DeepL ile Çevir</button></label>
                            <input
                                value={form.name_en}
                                onChange={e => setForm({ ...form, name_en: e.target.value })}
                                className="form-control"
                                placeholder="English product name"
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Ürün Key (Benzersiz ID)</label>
                            <input
                                required
                                disabled={isEdit}
                                value={form.product_key}
                                onChange={e => setForm({ ...form, product_key: e.target.value })}
                                className="form-control"
                                placeholder="ornek-urun-key"
                            />
                        </div>
                        <div className="form-group">
                            <label>Slug (TR URL yolu)</label>
                            <input
                                value={form.slug}
                                onChange={e => setForm({ ...form, slug: normalizeSlugInput(e.target.value) })}
                                className="form-control"
                                placeholder="hizmetlerimiz/ornek-slug"
                            />
                            <small style={{ color: '#64748b' }}>TR URL: /{normalizeSlugInput(form.slug)}</small>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 1' }}>
                            <label>Slug (EN URL yolu)</label>
                            <input
                                value={form.slug_en}
                                onChange={e => setForm({ ...form, slug_en: normalizeSlugInput(e.target.value) })}
                                className="form-control"
                                placeholder="services/example-slug"
                            />
                            <small style={{ color: '#64748b' }}>EN URL: /en/{normalizeSlugInput(form.slug_en)}</small>
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Fiyat</label>
                            <input
                                required
                                type="number"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Para Birimi</label>
                            <select
                                value={form.currency}
                                onChange={e => setForm({ ...form, currency: e.target.value })}
                                className="form-control"
                            >
                                <option value="TRY">TRY</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Kategori</label>
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="form-control"
                                required
                            >
                                <option value="egitimler">Eğitimler</option>
                                <option value="hizmetler">Hizmetler</option>
                                <option value="sektorler">Sektörler</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ürün Tipi</label>
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className="form-control"
                                style={{ borderColor: '#1a3a52', borderWidth: '2px' }}
                            >
                                <option value="service">Hizmet (Standart)</option>
                                <option value="video_course">Video Eğitim</option>
                                <option value="subscription">Abonelik</option>
                                <option value="digital_download">Dijital İndirme</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Bağlı Olduğu Ürün (Üst Hizmet)</label>
                        <select
                            value={form.parent_id}
                            onChange={e => setForm({ ...form, parent_id: e.target.value })}
                            className="form-control"
                        >
                            <option value="">-- Ana Ürün (Yok) --</option>
                            {allProducts.filter(p => !p.parent_id && p.id != (id as any)).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <small style={{ color: '#64748b' }}>Eğer bu bir paket ise (Core, Growth vb.), bağlı olduğu ana hizmeti seçin.</small>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>SEO ve Meta Bilgileri</h4>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label>Meta Title (TR)</label>
                                <input value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} className="form-control" />
                            </div>
                            <div className="form-group">
                                <label>Meta Title (EN)</label>
                                <input value={form.meta_title_en} onChange={e => setForm({ ...form, meta_title_en: e.target.value })} className="form-control" />
                            </div>
                        </div>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Meta Description (TR)</label>
                                <textarea rows={2} value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} className="form-control" />
                            </div>
                            <div className="form-group">
                                <label>Meta Description (EN)</label>
                                <textarea rows={2} value={form.meta_description_en} onChange={e => setForm({ ...form, meta_description_en: e.target.value })} className="form-control" />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#9a3412' }}>Hero Medya (Video & Görsel)</h4>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label>Hero Vimeo ID (TR)</label>
                                <input value={form.hero_vimeo_id} onChange={e => setForm({ ...form, hero_vimeo_id: e.target.value })} className="form-control" placeholder="Örn: 1134206542" />
                            </div>
                            <div className="form-group">
                                <label>Hero Vimeo ID (EN)</label>
                                <input value={form.hero_vimeo_id_en} onChange={e => setForm({ ...form, hero_vimeo_id_en: e.target.value })} className="form-control" />
                            </div>
                        </div>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Hero Image URL (TR)</label>
                                <input value={form.hero_image} onChange={e => setForm({ ...form, hero_image: e.target.value })} className="form-control" />
                                <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                await uploadHeroImage('tr', file);
                                            } catch (err: any) {
                                                setError(err.message);
                                            }
                                        }}
                                        className="form-control"
                                    />
                                    {uploading.tr && (
                                        <div style={{ height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress.tr}%`, height: '100%', background: '#1a3a52' }} />
                                        </div>
                                    )}
                                    {uploading.tr && <small style={{ color: '#1a3a52' }}>Yükleniyor: %{uploadProgress.tr}</small>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Hero Image URL (EN)</label>
                                <input value={form.hero_image_en} onChange={e => setForm({ ...form, hero_image_en: e.target.value })} className="form-control" />
                                <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                await uploadHeroImage('en', file);
                                            } catch (err: any) {
                                                setError(err.message);
                                            }
                                        }}
                                        className="form-control"
                                    />
                                    {uploading.en && (
                                        <div style={{ height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress.en}%`, height: '100%', background: '#1a3a52' }} />
                                        </div>
                                    )}
                                    {uploading.en && <small style={{ color: '#1a3a52' }}>Yükleniyor: %{uploadProgress.en}</small>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conditional Fields based on Type */}
                    {(form.type === 'video_course' || form.type === 'subscription' || form.type === 'digital_download') && (
                        <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1' }}>Dijital Ürün Ayarları</h4>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Erişim Süresi (Gün)</label>
                                    <input
                                        type="number"
                                        value={form.duration_days}
                                        onChange={e => setForm({ ...form, duration_days: e.target.value })}
                                        className="form-control"
                                        placeholder="Örn: 30, 365"
                                    />
                                    <small style={{ color: '#64748b' }}>Sınırsız ise boş bırakın.</small>
                                </div>
                                <div className="form-group">
                                    <label>İçerik URL / Video Sayfası</label>
                                    <input
                                        value={form.access_content_url}
                                        onChange={e => setForm({ ...form, access_content_url: e.target.value })}
                                        className="form-control"
                                        placeholder="/egitim/video-1 veya https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Açıklama (TR)</label>
                            <textarea
                                rows={4}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (EN) - <button type="button" onClick={() => translateField('description')} style={{ color: '#0369a1', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}>DeepL ile Çevir</button></label>
                            <textarea
                                rows={4}
                                value={form.description_en}
                                onChange={e => setForm({ ...form, description_en: e.target.value })}
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Ürün Özellikleri (TR)</label>
                            <textarea
                                rows={6}
                                value={form.features}
                                onChange={e => setForm({ ...form, features: e.target.value })}
                                className="form-control"
                                placeholder={'Her satıra bir özellik girin.'}
                            />
                        </div>
                        <div className="form-group">
                            <label>Features (EN) - <button type="button" onClick={() => translateField('features')} style={{ color: '#0369a1', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}>DeepL ile Çevir</button></label>
                            <textarea
                                rows={6}
                                value={form.features_en}
                                onChange={e => setForm({ ...form, features_en: e.target.value })}
                                className="form-control"
                                placeholder={'Enter each feature on a new line.'}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HiSave /> {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div >

            <style>{`
                .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151; }
                .form-control { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; }
                .form-control:focus { outline: none; border-color: #1a3a52; box-shadow: 0 0 0 2px rgba(26, 58, 82, 0.2); }
                .form-control:disabled { background: #f3f4f6; color: #9ca3af; }
                @media (max-width: 980px) {
                    .form-row { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </AdminLayout >
    );
}
