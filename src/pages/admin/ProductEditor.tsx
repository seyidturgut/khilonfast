import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiSave, HiArrowLeft } from 'react-icons/hi';

export default function ProductEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({
        product_key: '',
        name: '',
        description: '',
        price: '',
        currency: 'TRY',
        type: 'service', // service, subscription, video_course
        duration_days: '',
        access_content_url: '',
        is_active: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEdit) {
            // Fetch existing product data
            // For now, skipping implementation to focus on structure
        }
    }, [isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const url = isEdit
                ? `http://localhost:3001/api/admin/products/${id}`
                : 'http://localhost:3001/api/admin/products';

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
                            <label>Ürün Adı</label>
                            <input
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="form-control"
                            />
                        </div>
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
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
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
                            <label>Ürün Tipi</label>
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className="form-control"
                                style={{ borderColor: '#0ea5e9', borderWidth: '2px' }}
                            >
                                <option value="service">Hizmet (Standart)</option>
                                <option value="video_course">Video Eğitim</option>
                                <option value="subscription">Abonelik</option>
                                <option value="digital_download">Dijital İndirme</option>
                            </select>
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

                    <div className="form-group">
                        <label>Açıklama</label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="form-control"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HiSave /> {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151; }
                .form-control { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; }
                .form-control:focus { outline: none; border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2); }
                .form-control:disabled { background: #f3f4f6; color: #9ca3af; }
            `}</style>
        </AdminLayout>
    );
}
