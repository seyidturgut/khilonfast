import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI } from '../../../services/api';
import { HiChartBar, HiMail, HiEye, HiCursorClick } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
    sending: { label: 'Gönderiliyor', bg: '#fef3c7', fg: '#a16207' },
    sent:    { label: 'Gönderildi', bg: '#dcfce7', fg: '#15803d' },
    paused:  { label: 'Durduruldu', bg: '#e0e7ff', fg: '#4338ca' },
};

interface Row {
    id: number; name: string; subject: string; status: string; started_at: string | null;
    total: number; sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number;
    open_rate: number; click_rate: number;
}

// Yatay oran çubuğu (0-100)
function RateBar({ value, color }: { value: number; color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
            <div style={{ flex: 1, height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 12, color: '#cbd5e1', width: 48, textAlign: 'right' }}>%{value}</span>
        </div>
    );
}

export default function CrmCampaignAnalyticsPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                setLoading(true); setError('');
                const res = await crmAPI.getCampaignAnalytics();
                setRows(res.data?.campaigns || []);
            } catch (e: any) {
                setError(e?.response?.data?.error || 'Yükleme hatası');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totals = rows.reduce(
        (a, r) => ({ sent: a.sent + r.sent, opened: a.opened + r.opened, clicked: a.clicked + r.clicked }),
        { sent: 0, opened: 0, clicked: 0 }
    );
    const bestOpen = rows.filter(r => r.sent > 0).sort((a, b) => b.open_rate - a.open_rate)[0];

    return (
        <AdminLayout>
            <CrmPageStyles />
            <div className="crm-page">
                <header className="page-header">
                    <div>
                        <h1><HiChartBar style={{ verticalAlign: '-3px' }} /> Kampanya Analitiği</h1>
                        <p className="page-sub">Tüm kampanyaların karşılaştırmalı performansı — hangi kampanya/liste daha iyi çalışıyor.</p>
                    </div>
                </header>

                {error && <div className="error-box">{error}</div>}
                {loading ? <p style={{ color: '#94a3b8' }}>Yükleniyor…</p> : (
                    <>
                        {/* Özet kartları */}
                        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                            {[
                                { label: 'Toplam Gönderim', value: totals.sent.toLocaleString('tr-TR'), icon: <HiMail />, color: '#3b82f6' },
                                { label: 'Toplam Açılma', value: totals.opened.toLocaleString('tr-TR'), icon: <HiEye />, color: '#16a34a' },
                                { label: 'Toplam Tıklama', value: totals.clicked.toLocaleString('tr-TR'), icon: <HiCursorClick />, color: '#9333ea' },
                                { label: 'En İyi Kampanya', value: bestOpen ? `${bestOpen.name} (%${bestOpen.open_rate})` : '—', icon: <HiChartBar />, color: '#f59e0b' },
                            ].map((c, i) => (
                                <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                                    <div style={{ color: c.color, fontSize: 18 }}>{c.icon}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{c.label}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Kampanya</th><th>Durum</th><th>Gönderildi</th>
                                        <th>Açılma</th><th>Tıklama</th><th>Bounce</th><th>Ayrılan</th><th>Başlangıç</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Gönderilmiş kampanya yok.</td></tr>
                                    ) : rows.map(r => {
                                        const st = STATUS_LABELS[r.status] || { label: r.status, bg: '#f1f5f9', fg: '#475569' };
                                        return (
                                            <tr key={r.id} style={bestOpen && r.id === bestOpen.id ? { background: 'rgba(245,158,11,0.07)' } : undefined}>
                                                <td>
                                                    {bestOpen && r.id === bestOpen.id ? '🏆 ' : ''}
                                                    <Link to={`/admin/crm/campaigns/${r.id}`} style={{ fontWeight: 600 }}>{r.name}</Link>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>{r.subject}</div>
                                                </td>
                                                <td><span className="status-pill" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                                                <td>{r.sent.toLocaleString('tr-TR')} <span style={{ color: '#64748b', fontSize: 11 }}>/ {r.total.toLocaleString('tr-TR')}</span></td>
                                                <td><RateBar value={r.open_rate} color="#16a34a" /></td>
                                                <td><RateBar value={r.click_rate} color="#9333ea" /></td>
                                                <td>{r.bounced}</td>
                                                <td>
                                                    {r.unsubscribed > 0 ? (
                                                        <Link to={`/admin/crm/campaigns/${r.id}?filter=unsubscribed`} style={{ color: '#f87171', textDecoration: 'underline' }} title="Kimler ayrıldı — listeye git">
                                                            {r.unsubscribed}
                                                        </Link>
                                                    ) : r.unsubscribed}
                                                </td>
                                                <td style={{ fontSize: 12, color: '#94a3b8' }}>{r.started_at ? new Date(String(r.started_at).replace(' ', 'T')).toLocaleDateString('tr-TR') : '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 10 }}>
                            💡 Liste bazlı kırılım, en çok tıklanan linkler ve saat analizi için kampanyanın detayına girin.
                        </p>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
