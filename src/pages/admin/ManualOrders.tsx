import { useEffect, useState } from 'react';
import { adminOrdersAPI } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import { HiCheckCircle, HiXCircle, HiClock, HiBanknotes, HiUserCircle, HiArrowPath } from 'react-icons/hi2';

interface OrderItem {
    product_id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
}

interface BankInfo {
    bank_name?: string;
    account_holder?: string;
    iban?: string;
    swift?: string;
    currency?: string;
}

interface ManualOrder {
    id: number;
    order_number: string;
    order_status: string;
    total_amount: number;
    currency: string;
    customer_lang: string;
    created_at: string;
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    age_days: number;
    items_count: number;
    items: OrderItem[];
    bank_info: BankInfo | null;
}

type StatusFilter = 'pending' | 'completed' | 'cancelled' | 'all';

export default function ManualOrdersAdmin() {
    const [orders, setOrders] = useState<ManualOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<StatusFilter>('pending');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminOrdersAPI.listManualOrders(filter);
            setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Liste alınamadı');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filter]);

    const handleConfirm = async (orderId: number, orderNumber: string) => {
        if (!window.confirm(`${orderNumber} numaralı sipariş için ödemeyi onaylıyor musun?\n\nBu işlem:\n• Sipariş durumunu "completed" yapar\n• Ürünleri kullanıcıya aktive eder\n• Müşteriye onay maili gönderir\n• (Hizmet ürünüyse) onboarding form linki maili gönderir`)) return;
        setConfirmingId(orderId);
        setError('');
        setMessage('');
        try {
            await adminOrdersAPI.confirmManualPayment(orderId);
            setMessage(`✓ ${orderNumber} onaylandı, müşteriye mail gönderildi`);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Onay başarısız');
        } finally {
            setConfirmingId(null);
        }
    };

    const formatPrice = (amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY', maximumFractionDigits: 2 }).format(Number(amount));
        } catch {
            return `${amount} ${currency}`;
        }
    };

    const formatDate = (s: string) => {
        try { return new Date(s).toLocaleString('tr-TR'); } catch { return s; }
    };

    const ageBadge = (days: number, status: string) => {
        if (status !== 'processing') return null;
        let bg = '#dcfce7', color = '#166534', label = `${days} gün`;
        if (days >= 7) { bg = '#fee2e2'; color = '#991b1b'; label = `${days} gün ⚠ İptal!`; }
        else if (days >= 3) { bg = '#fef3c7'; color = '#92400e'; label = `${days} gün — hatırlatma`; }
        return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{label}</span>;
    };

    const statusBadge = (s: string) => {
        const styles: Record<string, { bg: string; color: string; icon: any; label: string }> = {
            processing: { bg: '#fef3c7', color: '#92400e', icon: <HiClock />, label: 'Ödeme bekleniyor' },
            completed:  { bg: '#dcfce7', color: '#166534', icon: <HiCheckCircle />, label: 'Onaylandı' },
            cancelled:  { bg: '#fee2e2', color: '#991b1b', icon: <HiXCircle />, label: 'İptal' },
            failed:     { bg: '#fee2e2', color: '#991b1b', icon: <HiXCircle />, label: 'Başarısız' }
        };
        const s2 = styles[s] || styles.processing;
        return <span style={{ background: s2.bg, color: s2.color, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{s2.icon} {s2.label}</span>;
    };

    return (
        <AdminLayout>
            <div className="admin-page" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Manuel Havale Siparişleri</h1>
                        <p style={{ color: '#64748b', margin: '6px 0 0' }}>
                            Banka havalesi ile ödeme bekleyen ve onaylanmış siparişler. Para hesaba ulaştığında "Onayla" butonuna bas.
                        </p>
                    </div>
                    <button onClick={load} disabled={loading} style={{ background: '#1a3a52', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <HiArrowPath /> Yenile
                    </button>
                </div>

                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
                {message && <div style={{ background: '#dcfce7', color: '#166534', padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
                    {([
                        { key: 'pending',   label: 'Ödeme Bekleyen', icon: <HiClock /> },
                        { key: 'completed', label: 'Onaylanmış', icon: <HiCheckCircle /> },
                        { key: 'cancelled', label: 'İptal Edilmiş', icon: <HiXCircle /> },
                        { key: 'all',       label: 'Hepsi', icon: <HiBanknotes /> }
                    ] as const).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setFilter(t.key)}
                            style={{
                                background: 'transparent',
                                color: filter === t.key ? '#1a3a52' : '#64748b',
                                border: 'none',
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: filter === t.key ? '2px solid #1a3a52' : '2px solid transparent',
                                fontWeight: filter === t.key ? 700 : 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {loading && <p>Yükleniyor...</p>}
                {!loading && orders.length === 0 && (
                    <div style={{ background: '#f8fafc', padding: 40, borderRadius: 12, textAlign: 'center', color: '#64748b' }}>
                        Bu filtre için sipariş yok.
                    </div>
                )}

                <div style={{ display: 'grid', gap: 12 }}>
                    {orders.map(o => (
                        <div key={o.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: 16 }}>{o.order_number}</strong>
                                        {statusBadge(o.order_status)}
                                        {ageBadge(o.age_days, o.order_status)}
                                        {o.customer_lang && <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{o.customer_lang.toUpperCase()}</span>}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                                        <HiUserCircle style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                        <strong>{o.first_name} {o.last_name}</strong> · {o.email} {o.phone ? '· ' + o.phone : ''}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                                        {formatDate(o.created_at)} · {o.items_count} ürün
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{formatPrice(o.total_amount, o.currency)}</div>
                                    {o.bank_info?.bank_name && (
                                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{o.bank_info.bank_name} ({o.bank_info.currency || 'TRY'})</div>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                                <strong style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Ürünler</strong>
                                <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                                    {o.items.map((it, idx) => (
                                        <li key={idx} style={{ padding: '4px 0', fontSize: 13 }}>
                                            • {it.product_name} {it.quantity > 1 ? `× ${it.quantity}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Bank IBAN expanded */}
                            {expandedId === o.id && o.bank_info && (
                                <div style={{ marginTop: 10, padding: 12, background: '#eff6ff', borderRadius: 8, fontSize: 13 }}>
                                    <strong>{o.bank_info.bank_name}</strong> · {o.bank_info.account_holder}<br />
                                    <span style={{ fontFamily: 'monospace' }}>{o.bank_info.iban}</span>
                                    {o.bank_info.swift ? <> · SWIFT: <span style={{ fontFamily: 'monospace' }}>{o.bank_info.swift}</span></> : null}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                {o.bank_info && (
                                    <button
                                        onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                                        style={{ background: 'transparent', color: '#1a3a52', border: '1px solid #1a3a52', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                                    >
                                        {expandedId === o.id ? 'IBAN Gizle' : 'IBAN Detayı'}
                                    </button>
                                )}
                                {o.order_status === 'processing' && (
                                    <button
                                        onClick={() => handleConfirm(o.id, o.order_number)}
                                        disabled={confirmingId === o.id}
                                        style={{
                                            background: '#16a34a',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '8px 18px',
                                            borderRadius: 8,
                                            fontWeight: 700,
                                            cursor: confirmingId === o.id ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: 13
                                        }}
                                    >
                                        <HiCheckCircle /> {confirmingId === o.id ? 'Onaylanıyor...' : 'Ödemeyi Onayla'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
