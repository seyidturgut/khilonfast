import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiPlus, HiPencil, HiEye, HiEyeOff } from 'react-icons/hi';

export default function ConsultantList() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [consultants, setConsultants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConsultants = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/consultants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConsultants(data.consultants || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConsultants(); }, []);

    const toggleActive = async (id: number, current: boolean) => {
        const token = localStorage.getItem('token');
        const consultant = consultants.find(c => c.id === id);
        if (!consultant) return;
        await fetch(`${ADMIN_API_BASE}/admin/consultants/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...consultant, sectors: consultant.sectors || [], is_active: current ? 0 : 1 })
        });
        fetchConsultants();
    };

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Danışmanlar</h1>
                    <Link to="/admin/consultants/new" style={{
                        display: 'flex', alignItems: 'center', gap: 6, background: '#1e3a5f',
                        color: '#fff', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem'
                    }}>
                        <HiPlus /> Yeni Danışman
                    </Link>
                </div>

                {loading ? (
                    <p>Yükleniyor...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#666' }}>Danışman</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#666' }}>Unvan</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>Yıldız</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>Durum</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consultants.map(c => (
                                <tr key={c.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <strong>{c.name}</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>/{c.slug}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#555', fontSize: '0.9rem' }}>{c.title}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>⭐ {c.stars} ({c.review_count})</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            background: c.is_active ? '#e8f5e9' : '#fce4ec',
                                            color: c.is_active ? '#2e7d32' : '#c62828',
                                            padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem'
                                        }}>
                                            {c.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button onClick={() => toggleActive(c.id, c.is_active)}
                                                title={c.is_active ? 'Pasif yap' : 'Aktif yap'}
                                                style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#666' }}>
                                                {c.is_active ? <HiEyeOff /> : <HiEye />}
                                            </button>
                                            <Link to={`/admin/consultants/${c.id}`}
                                                style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                                                <HiPencil /> Düzenle
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!consultants.length && (
                                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#888' }}>Henüz danışman eklenmemiş.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                <div style={{ marginTop: 32 }}>
                    <Link to="/admin/bookings" style={{ color: '#1e3a5f', textDecoration: 'underline', fontSize: '0.9rem' }}>
                        → Rezervasyonları görüntüle
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}
