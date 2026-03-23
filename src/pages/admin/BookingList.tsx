import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Bekliyor',
    confirmed: 'Onaylandı',
    cancelled: 'İptal',
    completed: 'Tamamlandı'
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#fff3e0', color: '#e65100' },
    confirmed: { bg: '#e8f5e9', color: '#2e7d32' },
    cancelled: { bg: '#fce4ec', color: '#c62828' },
    completed: { bg: '#e3f2fd', color: '#1565c0' }
};

export default function BookingList() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ status: string; meeting_link: string; admin_notes: string }>({ status: '', meeting_link: '', admin_notes: '' });

    const fetchBookings = async () => {
        const token = localStorage.getItem('token');
        const url = statusFilter
            ? `${ADMIN_API_BASE}/admin/bookings?status=${statusFilter}`
            : `${ADMIN_API_BASE}/admin/bookings`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setBookings(data.bookings || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchBookings(); }, [statusFilter]);

    const startEdit = (b: any) => {
        setEditingId(b.id);
        setEditData({ status: b.status, meeting_link: b.meeting_link || '', admin_notes: b.admin_notes || '' });
    };

    const saveEdit = async () => {
        const token = localStorage.getItem('token');
        await fetch(`${ADMIN_API_BASE}/admin/bookings/${editingId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(editData)
        });
        setEditingId(null);
        fetchBookings();
    };

    const cancelBooking = async (id: number) => {
        const token = localStorage.getItem('token');
        await fetch(`${ADMIN_API_BASE}/admin/bookings/${id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
        });
        fetchBookings();
    };

    const deleteBooking = async (id: number) => {
        if (!window.confirm('Bu rezervasyonu kalıcı olarak silmek istediğinize emin misiniz?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${ADMIN_API_BASE}/admin/bookings/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchBookings();
    };

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Rezervasyonlar</h1>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.9rem' }}>
                        <option value="">Tüm Durumlar</option>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>

                {loading ? <p>Yükleniyor...</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {bookings.map(b => (
                            <div key={b.id} style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <strong>{b.name}</strong>
                                        {b.company && <span style={{ color: '#888', marginLeft: 8 }}>— {b.company}</span>}
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>
                                            {b.email} {b.phone && `· ${b.phone}`}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#444', marginTop: 4 }}>
                                            <strong>{b.consultant_name}</strong> — {b.service_title}
                                        </div>
                                        {b.topic && <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4, fontStyle: 'italic' }}>{b.topic}</div>}
                                        {b.meeting_link && (
                                            <div style={{ marginTop: 6 }}>
                                                <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                                                    style={{ color: '#1e3a5f', fontSize: '0.85rem' }}>🔗 Toplantı Linki</a>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        <span style={{ ...STATUS_COLORS[b.status], padding: '3px 12px', borderRadius: 20, fontSize: '0.8rem' }}>
                                            {STATUS_LABELS[b.status] || b.status}
                                        </span>
                                        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                            {new Date(b.created_at).toLocaleString('tr-TR')}
                                        </div>
                                        <button onClick={() => startEdit(b)}
                                            style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Düzenle
                                        </button>
                                        {b.status !== 'cancelled' && (
                                            <button onClick={() => cancelBooking(b.id)}
                                                style={{ background: '#e65100', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                İptal Et
                                            </button>
                                        )}
                                        <button onClick={() => deleteBooking(b.id)}
                                            style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Sil
                                        </button>
                                    </div>
                                </div>

                                {editingId === b.id && (
                                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: '#666' }}>Durum</label>
                                                <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                                                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }}>
                                                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: '#666' }}>Toplantı Linki</label>
                                                <input value={editData.meeting_link}
                                                    onChange={e => setEditData(d => ({ ...d, meeting_link: e.target.value }))}
                                                    placeholder="https://meet.google.com/..."
                                                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#666' }}>Admin Notu</label>
                                            <textarea value={editData.admin_notes}
                                                onChange={e => setEditData(d => ({ ...d, admin_notes: e.target.value }))}
                                                rows={2}
                                                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', marginTop: 4, resize: 'vertical' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={saveEdit}
                                                style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>
                                                Kaydet
                                            </button>
                                            <button onClick={() => setEditingId(null)}
                                                style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>
                                                İptal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {!bookings.length && (
                            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Rezervasyon bulunamadı.</div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
