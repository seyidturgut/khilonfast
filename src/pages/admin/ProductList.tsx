import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiPlus, HiPencil, HiTag } from 'react-icons/hi';
import { HiVideoCamera, HiTicket, HiDocumentText } from 'react-icons/hi2';

const CATEGORY_SECTIONS = [
    { key: 'egitimler', label: 'Eğitimler' },
    { key: 'hizmetler', label: 'Hizmetler' },
    { key: 'sektorler', label: 'Sektörler' }
];

export default function ProductList() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingSlugs, setSyncingSlugs] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${ADMIN_API_BASE}/admin/products`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const syncSlugsWithFrontend = async () => {
        try {
            setSyncingSlugs(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/products/normalize-slugs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Slug senkronizasyonu başarısız.');
            alert(`Slug senkronizasyonu tamamlandı. Güncellenen kayıt: ${data.updated ?? 0}`);

            const refreshed = await fetch(`${ADMIN_API_BASE}/admin/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (refreshed.ok) {
                setProducts(await refreshed.json());
            }
        } catch (err: any) {
            alert(err.message || 'Slug senkronizasyonu başarısız.');
        } finally {
            setSyncingSlugs(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video_course': return <HiVideoCamera className="text-purple-500" />;
            case 'subscription': return <HiTicket className="text-green-500" />;
            case 'digital_download': return <HiDocumentText className="text-blue-500" />;
            default: return <HiTag className="text-gray-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'video_course': return 'Video Eğitim';
            case 'subscription': return 'Abonelik';
            case 'digital_download': return 'Dijital Dosya';
            default: return 'Hizmet';
        }
    };

    const normalizeCategory = (category?: string) => {
        const normalized = (category || '').toLowerCase().trim();
        if (['egitimler', 'egitim', 'training', 'course', 'courses'].includes(normalized)) return 'egitimler';
        if (['sektorler', 'sektorel', 'sector', 'sectoral', 'industry'].includes(normalized)) return 'sektorler';
        if (['hizmetler', 'hizmet', 'service', 'services'].includes(normalized)) return 'hizmetler';
        return 'hizmetler';
    };

    // Filter main products (those without a parent)
    const mainProducts = products.filter(p => !p.parent_id);

    // Create a map of package counts
    const packageCounts = products.reduce((acc, p) => {
        if (p.parent_id) {
            acc[p.parent_id] = (acc[p.parent_id] || 0) + 1;
        }
        return acc;
    }, {} as Record<number, number>);

    const groupedProducts = CATEGORY_SECTIONS.reduce((acc, section) => {
        const sectionMainProducts = mainProducts.filter((product) => normalizeCategory(product.category) === section.key);

        // For each main product, find its children and insert them after it
        const nestedList: any[] = [];
        sectionMainProducts.forEach(parent => {
            nestedList.push({ ...parent, isParent: true });
            const children = products.filter(p => p.parent_id === parent.id);
            children.forEach(child => {
                nestedList.push({ ...child, isChild: true });
            });
        });

        acc[section.key] = nestedList;
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800 }}>Ürün Yönetimi</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={syncSlugsWithFrontend}
                        disabled={syncingSlugs}
                        className="btn"
                        style={{ border: '1px solid #1a3a52', color: '#1a3a52', background: 'white', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer' }}
                    >
                        {syncingSlugs ? 'Senkronize Ediliyor...' : 'Slugları Frontend ile Senkronla'}
                    </button>
                    <Link to="/admin/products/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <HiPlus /> Yeni Ürün Ekle
                    </Link>
                </div>
            </div>

            {loading ? <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div> : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {CATEGORY_SECTIONS.map((section) => (
                        <div key={section.key} className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1a3a52' }}>{section.label}</h2>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '999px' }}>
                                    {groupedProducts[section.key]?.length || 0} ürün
                                </span>
                            </div>

                            {groupedProducts[section.key]?.length ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
                                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                            <tr>
                                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Ürün Adı</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Tip</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Paket Sayısı</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Fiyat (Başlangıç)</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Key</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>İçerik URL</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Durum</th>
                                                <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: 600 }}>İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedProducts[section.key].map(product => (
                                                <tr key={product.id} style={{
                                                    borderBottom: '1px solid #e5e7eb',
                                                    background: product.isChild ? '#fdfdfd' : 'white'
                                                }}>
                                                    <td style={{
                                                        padding: '1rem',
                                                        color: product.isChild ? '#4b5563' : '#111827',
                                                        fontWeight: product.isParent ? 600 : 400,
                                                        paddingLeft: product.isChild ? '2.5rem' : '1rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        {product.isChild && <div style={{ width: '8px', height: '8px', borderLeft: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', marginTop: '-4px' }}></div>}
                                                        {product.name}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                                            {!product.isChild && getTypeIcon(product.type)}
                                                            {!product.isChild ? getTypeLabel(product.type) : <span style={{ color: '#94a3b8' }}>Paket</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#111827' }}>
                                                        {product.isParent ? (
                                                            <span style={{ fontWeight: 600 }}>{packageCounts[product.id] || 0} Paket</span>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={{ padding: '1rem', color: product.isChild ? '#10b981' : '#111827', fontWeight: product.isChild ? 600 : 400, fontFamily: 'monospace' }}>
                                                        {product.price} {product.currency}
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{product.product_key}</td>
                                                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.8rem', maxWidth: '220px' }}>
                                                        {product.access_content_url ? (
                                                            <a href={product.access_content_url} target="_blank" rel="noreferrer">
                                                                {product.access_content_url}
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85rem',
                                                            background: product.is_active ? '#d1fae5' : '#fee2e2',
                                                            color: product.is_active ? '#065f46' : '#991b1b'
                                                        }}>
                                                            {product.is_active ? 'Aktif' : 'Pasif'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                            <Link to={`/admin/products/edit/${product.id}`} style={{ padding: '8px', color: '#1e5f8a', cursor: 'pointer' }} title="Düzenle">
                                                                <HiPencil size={18} />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                                    Bu kategoride henüz ürün yok.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
