import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
    HiUserGroup, HiCurrencyDollar, HiShoppingCart, HiExclamationCircle,
    HiDocumentText, HiCalendar, HiClipboardList, HiMail
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

interface RecentOrder {
    order_number: string;
    total_amount: number;
    currency: string;
    status: string;
    created_at: string | null;
    customer: string;
}

const emptyStats = {
    total_users: 0,
    total_revenue: 0,
    total_orders: 0,
    stats_since: null as string | null,
    recent_orders: [] as RecentOrder[],
    failed_payments: { count: 0, total: 0 },
    pending_invoices: { pending: 0, failed: 0 },
    consultant_bookings: { pending: 0, upcoming: 0 },
    onboarding: { new: 0, reviewed: 0, awaiting: 0, approved: 0 },
    email_campaigns: { campaigns: 0, recipients: 0, sent: 0, opened: 0, clicked: 0 },
};

// Sipariş durumu renk rozeti
const ORDER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
    completed: { label: 'Tamamlandı', bg: '#e8f5e9', color: '#2e7d32' },
    processing: { label: 'İşleniyor', bg: '#fff8e1', color: '#a16207' },
    pending: { label: 'Bekliyor', bg: '#eef2ff', color: '#4338ca' },
    failed: { label: 'Başarısız', bg: '#fce4ec', color: '#c62828' },
    cancelled: { label: 'İptal', bg: '#f3f4f6', color: '#6b7280' },
};

export default function AdminDashboard() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [d, setD] = useState(emptyStats);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${ADMIN_API_BASE}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                setD({ ...emptyStats, ...data });
            } catch (err) {
                console.error('Stats fetch error:', err);
            }
        };
        fetchStats();
    }, []);

    const fmtTL = (n: number) => `₺${Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    const fmtDate = (s: string | null) => s ? new Date(s.replace(' ', 'T')).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const openRate = d.email_campaigns.recipients > 0
        ? Math.round((d.email_campaigns.opened / d.email_campaigns.recipients) * 100) : 0;

    const stats = [
        { label: 'Toplam Kullanıcı', value: d.total_users.toLocaleString('tr-TR'), icon: HiUserGroup, color: '#1a3a52', bg: '#e3edf4' },
        { label: 'Toplam Gelir', value: fmtTL(d.total_revenue), icon: HiCurrencyDollar, color: '#4d6b00', bg: '#eef6d9' },
        { label: 'Toplam Sipariş', value: d.total_orders.toLocaleString('tr-TR'), icon: HiShoppingCart, color: '#2d5570', bg: '#e6eff4' },
    ];

    // Küçük durum kartları
    const miniCards = [
        {
            label: 'Başarısız Ödemeler', icon: HiExclamationCircle, color: '#c62828', bg: '#fdecec',
            value: d.failed_payments.count.toLocaleString('tr-TR'),
            sub: d.failed_payments.total > 0 ? fmtTL(d.failed_payments.total) : 'sorun yok',
        },
        {
            label: 'Bekleyen Faturalar', icon: HiDocumentText, color: '#a16207', bg: '#fff8e1',
            value: d.pending_invoices.pending.toLocaleString('tr-TR'),
            sub: d.pending_invoices.failed > 0 ? `${d.pending_invoices.failed} başarısız` : 'kuyruk temiz',
        },
        {
            label: 'Danışmanlık Randevuları', icon: HiCalendar, color: '#1a3a52', bg: '#e3edf4',
            value: d.consultant_bookings.pending.toLocaleString('tr-TR'),
            sub: `${d.consultant_bookings.upcoming} yaklaşan onaylı`,
        },
        {
            label: 'Bekleyen Brief', icon: HiClipboardList, color: '#6d28d9', bg: '#f1ebfd',
            value: (d.onboarding.new + d.onboarding.awaiting).toLocaleString('tr-TR'),
            sub: `${d.onboarding.approved} onaylı / ${d.onboarding.reviewed} incelendi`,
        },
        {
            label: 'E-posta Kampanya', icon: HiMail, color: '#0369a1', bg: '#e0f2fe',
            value: `%${openRate}`,
            sub: `${d.email_campaigns.campaigns} kampanya · ${d.email_campaigns.sent} gönderim`,
        },
    ];

    return (
        <AdminLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800, margin: 0 }}>Hoş Geldiniz, Admin</h1>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                    Site genel durum özeti ve hızlı işlemler.
                    {d.stats_since && (
                        <span style={{ marginLeft: 8, fontSize: '0.8rem', background: '#eef2ff', color: '#4338ca', padding: '2px 10px', borderRadius: 20 }}>
                            Gelir/Sipariş {fmtDate(d.stats_since)} tarihinden itibaren
                        </span>
                    )}
                </p>
            </div>

            {/* Ana 3 kart */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '12px', background: stat.bg, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Küçük durum kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {miniCards.map((c, i) => (
                    <div key={i} style={{ background: 'white', padding: '1.1rem 1.25rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div style={{ padding: '0.7rem', borderRadius: '10px', background: c.bg, color: c.color, display: 'flex' }}>
                            <c.icon size={20} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{c.label}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>{c.value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{c.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Son Satışlar */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '2rem', overflow: 'hidden' }}>
                <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#111827' }}>Son Satışlar</h2>
                    <Link to="/admin/orders" style={{ fontSize: '0.85rem', color: '#1a3a52' }}>Tümü →</Link>
                </div>
                {d.recent_orders.length === 0 ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', margin: 0 }}>Henüz sipariş yok.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', textAlign: 'left', color: '#6b7280' }}>
                                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Sipariş No</th>
                                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Müşteri</th>
                                    <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Tutar</th>
                                    <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'center' }}>Durum</th>
                                    <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Tarih</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.recent_orders.map((o, i) => {
                                    const st = ORDER_STATUS[o.status] || { label: o.status, bg: '#f3f4f6', color: '#6b7280' };
                                    return (
                                        <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '11px 16px', fontWeight: 600, color: '#1f2937' }}>{o.order_number || '—'}</td>
                                            <td style={{ padding: '11px 16px', color: '#374151' }}>{o.customer}</td>
                                            <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600 }}>
                                                {o.currency === 'USD' ? '$' : o.currency === 'EUR' ? '€' : '₺'}
                                                {Number(o.total_amount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                                                <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{st.label}</span>
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'right', color: '#6b7280' }}>{fmtDate(o.created_at)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#111827' }}>Hızlı İşlemler</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/admin/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>Ürün Ekle</Link>
                    <Link to="/admin/users" className="btn btn-primary" style={{ textDecoration: 'none' }}>Kullanıcılar</Link>
                    <Link to="/admin/settings" className="btn btn-primary" style={{ textDecoration: 'none' }}>Ayarları Düzenle</Link>
                </div>
            </div>
        </AdminLayout>
    );
}
