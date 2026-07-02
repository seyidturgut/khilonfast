import { useEffect, useState } from 'react';
import { adminOrdersAPI } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import { HiCheckCircle, HiXCircle, HiClock, HiCreditCard, HiBanknotes, HiUserCircle, HiArrowPath, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';

interface OrderListItem {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface OrderRow {
    id: number;
    order_number: string;
    order_status: string;
    total_amount: number;
    subtotal_amount: number;
    coupon_discount_amount: number;
    coupon_code: string | null;
    currency: string;
    created_at: string;
    user_id: number | null;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    payment_method: string | null;
    payment_status: string | null;
    items_count: number;
    items: OrderListItem[];
}

interface OrderDetail extends OrderRow {
    address: string | null;
    payments: Array<{
        id: number;
        payment_method: string;
        lidio_transaction_id: string | null;
        amount: number;
        currency: string;
        status: string;
        created_at: string;
    }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    manual_transfer: 'Banka Havalesi',
    lidio: 'Kredi/Banka Kartı',
    card: 'Kredi/Banka Kartı'
};

const paymentMethodLabel = (method: string | null) => {
    if (!method) return '—';
    return PAYMENT_METHOD_LABELS[method] || method;
};

const paymentMethodIcon = (method: string | null) => {
    if (method === 'manual_transfer') return <HiBanknotes />;
    return <HiCreditCard />;
};

export default function AllOrders() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const perPage = 25;

    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [detailId, setDetailId] = useState<number | null>(null);
    const [detail, setDetail] = useState<OrderDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminOrdersAPI.listAllOrders({
                page,
                per_page: perPage,
                status: statusFilter,
                payment_method: methodFilter,
                q: q || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            });
            setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
            setTotal(Number(res.data?.total || 0));
            setPages(Number(res.data?.pages || 1));
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Liste alınamadı');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [page, statusFilter, methodFilter, q, dateFrom, dateTo]);

    const openDetail = async (orderId: number) => {
        setDetailId(orderId);
        setDetail(null);
        setDetailLoading(true);
        try {
            const res = await adminOrdersAPI.getOrderDetail(orderId);
            setDetail(res.data?.order || null);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Detay alınamadı');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => { setDetailId(null); setDetail(null); };

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setQ(qInput.trim());
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

    const statusBadge = (s: string) => {
        const styles: Record<string, { bg: string; color: string; icon: any; label: string }> = {
            pending:    { bg: '#f1f5f9', color: '#475569', icon: <HiClock />, label: 'Bekliyor' },
            processing: { bg: '#fef3c7', color: '#92400e', icon: <HiClock />, label: 'İşlemde' },
            completed:  { bg: '#dcfce7', color: '#166534', icon: <HiCheckCircle />, label: 'Tamamlandı' },
            cancelled:  { bg: '#fee2e2', color: '#991b1b', icon: <HiXCircle />, label: 'İptal' },
            failed:     { bg: '#fee2e2', color: '#991b1b', icon: <HiXCircle />, label: 'Başarısız' }
        };
        const s2 = styles[s] || styles.pending;
        return <span style={{ background: s2.bg, color: s2.color, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>{s2.icon} {s2.label}</span>;
    };

    return (
        <AdminLayout>
            <div className="admin-page" style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Tüm Siparişler</h1>
                        <p style={{ color: '#64748b', margin: '6px 0 0' }}>
                            Kart ve havale ile alınan tüm satın alımlar — {total} sipariş.
                        </p>
                    </div>
                    <button onClick={load} disabled={loading} style={{ background: '#1a3a52', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <HiArrowPath /> Yenile
                    </button>
                </div>

                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

                {/* Filtreler */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={submitSearch} style={{ display: 'flex', gap: 6 }}>
                        <input
                            type="text"
                            placeholder="Sipariş no, ad, e-posta ara..."
                            value={qInput}
                            onChange={(e) => setQInput(e.target.value)}
                            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', width: 240, fontSize: 13 }}
                        />
                        <button type="submit" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 12px', cursor: 'pointer' }}>
                            <HiMagnifyingGlass />
                        </button>
                    </form>

                    <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                        <option value="all">Tüm Durumlar</option>
                        <option value="pending">Bekliyor</option>
                        <option value="processing">İşlemde</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                        <option value="failed">Başarısız</option>
                    </select>

                    <select value={methodFilter} onChange={(e) => { setPage(1); setMethodFilter(e.target.value); }} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                        <option value="all">Tüm Ödeme Yöntemleri</option>
                        <option value="lidio">Kredi/Banka Kartı</option>
                        <option value="manual_transfer">Banka Havalesi</option>
                    </select>

                    <input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                    <span style={{ color: '#94a3b8' }}>—</span>
                    <input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />

                    {(statusFilter !== 'all' || methodFilter !== 'all' || q || dateFrom || dateTo) && (
                        <button
                            onClick={() => { setStatusFilter('all'); setMethodFilter('all'); setQ(''); setQInput(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
                        >
                            Filtreleri Temizle
                        </button>
                    )}
                </div>

                {loading && <p>Yükleniyor...</p>}
                {!loading && orders.length === 0 && (
                    <div style={{ background: '#f8fafc', padding: 40, borderRadius: 12, textAlign: 'center', color: '#64748b' }}>
                        Bu filtre için sipariş yok.
                    </div>
                )}

                {!loading && orders.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px' }}>Sipariş</th>
                                    <th style={{ padding: '10px 14px' }}>Müşteri</th>
                                    <th style={{ padding: '10px 14px' }}>Ürün(ler)</th>
                                    <th style={{ padding: '10px 14px' }}>Ödeme Yöntemi</th>
                                    <th style={{ padding: '10px 14px' }}>Durum</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr
                                        key={o.id}
                                        onClick={() => openDetail(o.id)}
                                        style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td style={{ padding: '10px 14px' }}>
                                            <strong>{o.order_number}</strong>
                                            <div style={{ color: '#94a3b8', fontSize: 12 }}>{formatDate(o.created_at)}</div>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <HiUserCircle style={{ color: '#94a3b8' }} />
                                                <span>{o.first_name} {o.last_name}</span>
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: 12 }}>{o.email}</div>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            {o.items.slice(0, 2).map((it, idx) => (
                                                <div key={idx}>{it.product_name}{it.quantity > 1 ? ` × ${it.quantity}` : ''}</div>
                                            ))}
                                            {o.items_count > 2 && <div style={{ color: '#94a3b8' }}>+{o.items_count - 2} daha</div>}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                {paymentMethodIcon(o.payment_method)} {paymentMethodLabel(o.payment_method)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>{statusBadge(o.order_status)}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{formatPrice(o.total_amount, o.currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Önceki</button>
                        <span style={{ padding: '8px 12px', color: '#64748b', fontSize: 13 }}>Sayfa {page} / {pages}</span>
                        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: page >= pages ? 'not-allowed' : 'pointer', opacity: page >= pages ? 0.5 : 1 }}>Sonraki</button>
                    </div>
                )}

                {/* Detay paneli */}
                {detailId !== null && (
                    <div
                        onClick={closeDetail}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: '#fff', width: 460, maxWidth: '100%', height: '100%', overflowY: 'auto', padding: 24, boxShadow: '-8px 0 24px rgba(0,0,0,0.15)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h2 style={{ margin: 0, fontSize: 18 }}>Sipariş Detayı</h2>
                                <button onClick={closeDetail} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}><HiXMark /></button>
                            </div>

                            {detailLoading && <p>Yükleniyor...</p>}

                            {!detailLoading && detail && (
                                <div style={{ display: 'grid', gap: 18 }}>
                                    <div>
                                        <strong style={{ fontSize: 16 }}>{detail.order_number}</strong>
                                        <div style={{ marginTop: 6 }}>{statusBadge(detail.order_status)}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{formatDate(detail.created_at)}</div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Müşteri</div>
                                        <div>{detail.first_name} {detail.last_name}</div>
                                        <div style={{ color: '#64748b', fontSize: 13 }}>{detail.email}</div>
                                        {detail.phone && <div style={{ color: '#64748b', fontSize: 13 }}>{detail.phone}</div>}
                                        {detail.address && <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{detail.address}</div>}
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Ürünler</div>
                                        <div style={{ display: 'grid', gap: 6 }}>
                                            {detail.items.map((it, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: '#f8fafc', padding: '8px 10px', borderRadius: 8 }}>
                                                    <span>{it.product_name}{it.quantity > 1 ? ` × ${it.quantity}` : ''}</span>
                                                    <strong>{formatPrice(it.total_price, detail.currency)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: 4, fontSize: 13, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ara Toplam</span><span>{formatPrice(detail.subtotal_amount, detail.currency)}</span></div>
                                        {detail.coupon_discount_amount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                                                <span>İndirim {detail.coupon_code ? `(${detail.coupon_code})` : ''}</span>
                                                <span>-{formatPrice(detail.coupon_discount_amount, detail.currency)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                                            <span>Toplam</span><span>{formatPrice(detail.total_amount, detail.currency)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Ödeme</div>
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {detail.payments.map((p) => (
                                                <div key={p.id} style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 13 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                                        {paymentMethodIcon(p.payment_method)} {paymentMethodLabel(p.payment_method)}
                                                        <span style={{ marginLeft: 'auto' }}>{statusBadge(p.status)}</span>
                                                    </div>
                                                    <div style={{ color: '#64748b', marginTop: 4 }}>{formatPrice(p.amount, p.currency)} · {formatDate(p.created_at)}</div>
                                                    {p.lidio_transaction_id && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2, fontFamily: 'monospace' }}>İşlem: {p.lidio_transaction_id}</div>}
                                                </div>
                                            ))}
                                            {detail.payments.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>Ödeme kaydı yok.</div>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
