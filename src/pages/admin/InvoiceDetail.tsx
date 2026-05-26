import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { API_BASE_URL } from '../../config/api';
import { HiArrowLeft, HiRefresh, HiExternalLink, HiDocumentText } from 'react-icons/hi';

export default function InvoiceDetail() {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    const auth = (): Record<string, string> => {
        const t = localStorage.getItem('token');
        return t ? { Authorization: `Bearer ${t}` } : {};
    };

    const load = async () => {
        setLoading(true); setErr('');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/invoices/${orderId}`, { headers: auth() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Yüklenemedi');
            setOrder(data.order);
            setItems(data.items || []);
        } catch (e: any) {
            setErr(e.message || 'Hata');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (orderId) load(); /* eslint-disable-next-line */ }, [orderId]);

    const retry = async () => {
        setBusy(true); setErr(''); setMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/invoices/${orderId}/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...auth() },
            });
            const data = await res.json();
            if (!res.ok || data.ok === false) throw new Error(data.error || 'Yeniden deneme başarısız');
            setMsg('Fatura yeniden işlendi');
            await load();
        } catch (e: any) {
            setErr(e.message || 'Hata');
        } finally {
            setBusy(false);
        }
    };

    const card: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, marginBottom: 14 };
    const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #f1f5f9', fontSize: '0.9rem' };
    const lbl: React.CSSProperties = { color: '#64748b' };

    return (
        <AdminLayout>
            <div style={{ padding: 20, maxWidth: 920, margin: '0 auto' }}>
                <Link to="/admin/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b', marginBottom: 12, textDecoration: 'none' }}>
                    <HiArrowLeft /> Faturalara dön
                </Link>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1a3a52' }}>
                    <HiDocumentText /> Fatura Detayı
                </h1>

                {msg && <div style={{ background: '#ecfdf5', color: '#065f46', padding: 10, borderRadius: 8, marginBottom: 12 }}>{msg}</div>}
                {err && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 8, marginBottom: 12 }}>{err}</div>}

                {loading ? (
                    <p style={{ color: '#64748b' }}>Yükleniyor…</p>
                ) : !order ? (
                    <p style={{ color: '#64748b' }}>Sipariş bulunamadı.</p>
                ) : (
                    <>
                        <div style={card}>
                            <h3 style={{ margin: '0 0 10px', color: '#1a3a52' }}>Sipariş</h3>
                            <div style={row}><span style={lbl}>Sipariş No</span><strong>{order.order_number}</strong></div>
                            <div style={row}><span style={lbl}>Tarih</span><span>{new Date(order.created_at).toLocaleString('tr-TR')}</span></div>
                            <div style={row}><span style={lbl}>Tutar</span><strong>{Number(order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency}</strong></div>
                            <div style={row}><span style={lbl}>Müşteri Tipi</span><span>{order.customer_type === 'company' ? 'Kurumsal' : 'Bireysel'}</span></div>
                            <div style={row}><span style={lbl}>Fatura Durumu</span><strong style={{ textTransform: 'uppercase' }}>{order.invoice_status}</strong></div>
                            {order.parasut_invoice_id && (
                                <div style={row}>
                                    <span style={lbl}>Paraşüt Fatura</span>
                                    <a href={`https://uygulama.parasut.com/${order.parasut_invoice_id}`} target="_blank" rel="noreferrer" style={{ color: '#89b004', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        #{order.parasut_invoice_id} <HiExternalLink />
                                    </a>
                                </div>
                            )}
                            {order.invoice_sent_at && (
                                <div style={row}><span style={lbl}>Kesim Tarihi</span><span>{new Date(order.invoice_sent_at).toLocaleString('tr-TR')}</span></div>
                            )}
                            {order.parasut_invoice_type && (
                                <div style={row}><span style={lbl}>Belge Tipi</span><span>{order.parasut_invoice_type}</span></div>
                            )}
                        </div>

                        <div style={card}>
                            <h3 style={{ margin: '0 0 10px', color: '#1a3a52' }}>Müşteri</h3>
                            <div style={row}><span style={lbl}>Ad Soyad</span><span>{`${order.first_name} ${order.last_name}`}</span></div>
                            <div style={row}><span style={lbl}>E-posta</span><span>{order.email}</span></div>
                            <div style={row}><span style={lbl}>Telefon</span><span>{order.phone || '-'}</span></div>
                            {order.customer_type === 'company' ? (
                                <>
                                    <div style={row}><span style={lbl}>Şirket Ünvanı</span><span>{order.company_name || '-'}</span></div>
                                    <div style={row}><span style={lbl}>Vergi Dairesi</span><span>{order.tax_office || '-'}</span></div>
                                    <div style={row}><span style={lbl}>Vergi No</span><span>{order.tax_number || '-'}</span></div>
                                </>
                            ) : (
                                <div style={row}><span style={lbl}>TC Kimlik No</span><span>{order.national_id || '-'}</span></div>
                            )}
                        </div>

                        <div style={card}>
                            <h3 style={{ margin: '0 0 10px', color: '#1a3a52' }}>Kalemler</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#64748b' }}>
                                        <th style={{ padding: 6 }}>Ürün</th>
                                        <th style={{ padding: 6 }}>Adet</th>
                                        <th style={{ padding: 6 }}>Birim</th>
                                        <th style={{ padding: 6 }}>Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it: any) => (
                                        <tr key={it.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: 6 }}>{it.product_name}</td>
                                            <td style={{ padding: 6 }}>{it.quantity}</td>
                                            <td style={{ padding: 6 }}>{Number(it.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                            <td style={{ padding: 6 }}>{Number(it.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(order.job_id || order.attempts) && (
                            <div style={card}>
                                <h3 style={{ margin: '0 0 10px', color: '#1a3a52' }}>İşlem Geçmişi</h3>
                                <div style={row}><span style={lbl}>İş Durumu</span><span>{order.job_status || '-'}</span></div>
                                <div style={row}><span style={lbl}>Deneme Sayısı</span><span>{order.attempts ?? 0}</span></div>
                                {order.next_run_at && <div style={row}><span style={lbl}>Sonraki Deneme</span><span>{new Date(order.next_run_at).toLocaleString('tr-TR')}</span></div>}
                                {order.last_error && (
                                    <div style={{ marginTop: 8, padding: 10, background: '#fef2f2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                                        <strong>Son Hata:</strong> {order.last_error}
                                    </div>
                                )}
                            </div>
                        )}

                        {(order.invoice_status === 'failed' || order.invoice_status === 'pending') && (
                            <button
                                onClick={retry}
                                disabled={busy}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '10px 22px', borderRadius: 8, border: 'none',
                                    background: busy ? '#cbd5e1' : '#1a3a52', color: '#fff',
                                    fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
                                }}
                            >
                                <HiRefresh /> {busy ? 'İşleniyor…' : 'Yeniden Dene'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
