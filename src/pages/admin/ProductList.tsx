import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiPlus, HiPencil, HiTrash, HiTag } from 'react-icons/hi';
import { HiVideoCamera, HiTicket, HiDocumentText } from 'react-icons/hi2';

export default function ProductList() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3001/api/admin/products', {
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

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800 }}>Ürün Yönetimi</h1>
                <Link to="/admin/products/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <HiPlus /> Yeni Ürün Ekle
                </Link>
            </div>

            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Ürün Adı</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Tip</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Fiyat</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Key</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Durum</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: 600 }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem', color: '#111827', fontWeight: 500 }}>{product.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                            {getTypeIcon(product.type)}
                                            {getTypeLabel(product.type)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#111827', fontFamily: 'monospace' }}>
                                        {product.price} {product.currency}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>{product.product_key}</td>
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
                                            <Link to={`/admin/products/edit/${product.id}`} style={{ padding: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Düzenle">
                                                <HiPencil size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
