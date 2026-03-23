import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiPlus, HiPencil, HiTrash, HiExternalLink, HiDocumentText } from 'react-icons/hi';

interface Page {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
}

export default function PagesList() {
    const [pages, setPages] = useState<Page[]>([]);
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        const fetchPages = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${ADMIN_API_BASE}/admin/pages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                setPages(data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPages();
    }, []);

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800 }}>Sayfalar</h1>
                <Link to="/admin/pages/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <HiPlus /> Yeni Sayfa Ekle
                </Link>
            </div>

            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Başlık</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>URL (Slug)</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Durum</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: 600 }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.map(page => (
                            <tr key={page.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '1rem', color: '#111827', fontWeight: 500 }}>{page.title}</td>
                                <td style={{ padding: '1rem', color: '#6b7280' }}>/{page.slug}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        background: page.is_active ? '#d1fae5' : '#f3f4f6',
                                        color: page.is_active ? '#065f46' : '#374151'
                                    }}>
                                        {page.is_active ? 'Yayında' : 'Taslak'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <a href={`/${page.slug}`} target="_blank" rel="noreferrer" style={{ padding: '8px', color: '#6b7280', cursor: 'pointer' }} title="Görüntüle">
                                            <HiExternalLink size={18} />
                                        </a>
                                        {page.slug?.startsWith('egitimler/') && (
                                            <Link
                                                to={`/admin/training-pages/${page.slug}`}
                                                style={{ padding: '8px', color: '#0f766e', cursor: 'pointer' }}
                                                title="Eğitim İçeriği"
                                            >
                                                <HiDocumentText size={18} />
                                            </Link>
                                        )}
                                        <Link to={`/admin/pages/edit/${page.id}`} style={{ padding: '8px', color: '#1e5f8a', cursor: 'pointer' }} title="Düzenle">
                                            <HiPencil size={18} />
                                        </Link>
                                        <button style={{ padding: '8px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} title="Sil">
                                            <HiTrash size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </AdminLayout>
    );
}
