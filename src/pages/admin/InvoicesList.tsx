import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { API_BASE_URL } from '../../config/api';
import { HiDocumentText, HiRefresh, HiSearch } from 'react-icons/hi';

type Row = {
    id: number;
    order_number: string;
    total_amount: number;
    currency: string;
    created_at: string;
    customer_type: 'individual' | 'company';
    invoice_status: 'pending' | 'queued' | 'processing' | 'sent' | 'failed' | 'skipped';
    parasut_invoice_id: number | null;
    parasut_invoice_type: 'e_archive' | 'e_invoice' | 'sales_invoice' | null;
    invoice_sent_at: string | null;
    email: string;
    first_name: string;
    last_name: string;
    attempts: number | null;
    last_error: string | null;
};

const LABEL: Record<Row['invoice_status'], string> = {
    pending: 'Beklemede',
    queued: 'Kuyrukta',
    processing: 'İşleniyor',
    sent: 'Gönderildi',
    failed: 'Başarısız',
    skipped: 'Atlandı',
};
const COLOR: Record<Row['invoice_status'], string> = {
    pending: '#94a3b8',
    queued: '#0ea5e9',
    processing: '#0ea5e9',
    sent: '#16a34a',
    failed: '#dc2626',
    skipped: '#f59e0b',
};

const formatDate = (s?: string | null) =>
    s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const formatAmount = (n: number, cur: string) =>
    `${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

export default function InvoicesList() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | Row['invoice_status']>('all');
    const [q, setQ] = useState('');
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState<number>(0);

    const auth = (): Record<string, string> => {
        const t = localStorage.getItem('token');
        return t ? { Authorization: `Bearer ${t}` } : {};
    };

    const load = async () => {
        setLoading(true);
        setErr('');
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.set('status', filter);
            if (q.trim()) params.set('q', q.trim());
            const res = await fetch(`${API_BASE_URL}/admin/invoices?${params}`, { headers: auth() });
            const data = await res.json();
            setRows(Array.isArray(data.invoices) ? data.invoices : []);
        } catch {
            setErr('Liste yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

    const retry = async (orderId: number) => {
        setBusy(orderId); setErr(''); setMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/invoices/${orderId}/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...auth() },
            });
            const data = await res.json();
            if (!res.ok || data.ok === false) throw new Error(data.error || 'Hata');
            setMsg(`Sipariş #${orderId} yeniden işlendi`);
            await load();
        } catch (e: any) {
            setErr(e.message || 'Yeniden deneme başarısız');
        } finally {
            setBusy(0);
        }
    };

    return (
        <AdminLayout>
            <div style={{ padding: 20 }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1a3a52' }}>
                    <HiDocumentText /> Faturalar (Paraşüt)
                </h1>

                <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(['all', 'queued', 'sent', 'failed', 'pending', 'skipped'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: '0.85rem',
                                border: '1px solid ' + (filter === f ? '#1a3a52' : '#cbd5e1'),
                                background: filter === f ? '#1a3a52' : '#fff',
                                color: filter === f ? '#fff' : '#475569',
                            }}
                        >
                            {f === 'all' ? 'Tümü' : LABEL[f as Row['invoice_status']]}
                        </button>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                        <HiSearch style={{ color: '#64748b' }} />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && load()}
                            placeholder="Sipariş no / e-posta / isim"
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: 240 }}
                        />
                        <button onClick={load} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #1a3a52', background: '#fff', color: '#1a3a52', cursor: 'pointer' }}>Ara</button>
                    </div>
                </div>

                {msg && <div style={{ background: '#ecfdf5', color: '#065f46', padding: 10, borderRadius: 8, marginBottom: 12 }}>{msg}</div>}
                {err && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 8, marginBottom: 12 }}>{err}</div>}

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 16, color: '#64748b' }}>Yükleniyor…</div>
                    ) : rows.length === 0 ? (
                        <div style={{ padding: 16, color: '#64748b' }}>Kayıt yok</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                                    <th style={{ padding: 10 }}>Sipariş No</th>
                                    <th style={{ padding: 10 }}>Müşteri</th>
                                    <th style={{ padding: 10 }}>Tip</th>
                                    <th style={{ padding: 10 }}>Tutar</th>
                                    <th style={{ padding: 10 }}>Sipariş Tarihi</th>
                                    <th style={{ padding: 10 }}>Fatura Durumu</th>
                                    <th style={{ padding: 10 }}>Paraşüt ID</th>
                                    <th style={{ padding: 10 }}>Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 10 }}>
                                            <Link to={`/admin/invoices/${r.id}`} style={{ color: '#1a3a52', fontWeight: 600 }}>{r.order_number}</Link>
                                        </td>
                                        <td style={{ padding: 10 }}>
                                            <div style={{ fontWeight: 600 }}>{`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '-'}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.email}</div>
                                        </td>
                                        <td style={{ padding: 10 }}>{r.customer_type === 'company' ? 'Kurumsal' : 'Bireysel'}</td>
                                        <td style={{ padding: 10 }}>{formatAmount(r.total_amount, r.currency)}</td>
                                        <td style={{ padding: 10 }}>{formatDate(r.created_at)}</td>
                                        <td style={{ padding: 10 }}>
                                            <span style={{
                                                background: COLOR[r.invoice_status] + '22',
                                                color: COLOR[r.invoice_status],
                                                padding: '3px 10px', borderRadius: 999, fontWeight: 600, fontSize: '0.78rem',
                                            }}>{LABEL[r.invoice_status]}</span>
                                            {r.attempts ? <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Deneme: {r.attempts}</div> : null}
                                        </td>
                                        <td style={{ padding: 10, fontSize: '0.85rem', color: '#475569' }}>
                                            {r.parasut_invoice_id ? `#${r.parasut_invoice_id}` : '-'}
                                            {r.parasut_invoice_type ? <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.parasut_invoice_type}</div> : null}
                                        </td>
                                        <td style={{ padding: 10 }}>
                                            {(r.invoice_status === 'failed' || r.invoice_status === 'pending') && (
                                                <button
                                                    onClick={() => retry(r.id)}
                                                    disabled={busy === r.id}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '5px 10px', borderRadius: 6, fontSize: '0.78rem',
                                                        border: '1px solid #1a3a52', background: '#fff', color: '#1a3a52',
                                                        cursor: busy === r.id ? 'wait' : 'pointer',
                                                    }}
                                                >
                                                    <HiRefresh /> {busy === r.id ? 'İşleniyor…' : 'Yeniden Dene'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
