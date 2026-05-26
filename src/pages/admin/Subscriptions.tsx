import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../layouts/AdminLayout'

interface SubRow {
    id: number
    status: 'active' | 'expired' | 'cancelled'
    starts_at: string | null
    expires_at: string | null
    next_renewal_at: string | null
    auto_renew: number
    payment_method: 'credit_card' | 'manual_transfer' | null
    cancellation_requested_at: string | null
    cancelled_at: string | null
    last_renewal_at: string | null
    user_id: number
    user_email: string
    user_name: string
    product_name: string
    product_key: string
    card_masked: string | null
    card_brand: string | null
}

interface Summary {
    active_total: number
    auto_renew_on: number
    cancel_pending: number
    due_7d: number
}

function fmt(s: string | null) {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Subscriptions() {
    const API = import.meta.env.VITE_API_URL || '/api'
    const [rows, setRows] = useState<SubRow[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)
    const [statusF, setStatusF] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)
    const [busyId, setBusyId] = useState<number | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const qs = new URLSearchParams()
            if (statusF) qs.set('status', statusF)
            if (search.trim()) qs.set('search', search.trim())
            qs.set('page', String(page))
            const res = await fetch(`${API}/admin/subscriptions?${qs.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) { setRows([]); return }
            const d = await res.json()
            setRows(Array.isArray(d.subscriptions) ? d.subscriptions : [])
            setSummary(d.summary || null)
            setPages(d.pages || 1)
        } catch {
            setRows([])
        } finally {
            setLoading(false)
        }
    }, [API, statusF, search, page])

    useEffect(() => { load() }, [load])

    const cancelSub = async (id: number) => {
        if (!window.confirm('Bu abonelik dönem sonunda sonlandırılacak (otomatik yenileme kapatılır). Onaylıyor musunuz?')) return
        setBusyId(id)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API}/admin/subscriptions/${id}/cancel`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) await load()
            else alert('İşlem başarısız.')
        } catch {
            alert('Bağlantı hatası.')
        } finally {
            setBusyId(null)
        }
    }

    const badge = (s: SubRow) => {
        if (s.status === 'expired') return { t: 'Süresi doldu', bg: '#fee2e2', c: '#b91c1c' }
        if (s.status === 'cancelled') return { t: 'İptal edildi', bg: '#f1f5f9', c: '#64748b' }
        if (s.cancellation_requested_at) return { t: 'Dönem sonu bitiyor', bg: '#fef3c7', c: '#92400e' }
        return { t: 'Aktif', bg: '#dcfce7', c: '#166534' }
    }

    const kpi = (label: string, val: number, color: string) => (
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
        </div>
    )

    return (
        <AdminLayout>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800, margin: 0 }}>Abonelikler</h1>
                <p style={{ color: '#6b7280', marginTop: '0.4rem' }}>Aylık abonelik ürünlerinin durumu, yenileme tarihi ve ödeme yöntemi.</p>
            </div>

            {summary && (
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                    {kpi('Aktif abonelik', summary.active_total, '#1a3a52')}
                    {kpi('Otomatik yenileme açık', summary.auto_renew_on, '#166534')}
                    {kpi('İptal bekleyen', summary.cancel_pending, '#92400e')}
                    {kpi('7 gün içinde yenilenecek', summary.due_7d, '#b45309')}
                </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={statusF} onChange={e => { setPage(1); setStatusF(e.target.value) }}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                    <option value="">Tüm durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="expired">Süresi doldu</option>
                    <option value="cancelled">İptal edildi</option>
                </select>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load() } }}
                    placeholder="E-posta veya isim ara…"
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 240 }}
                />
                <button onClick={() => { setPage(1); load() }}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a3a52', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                    Ara
                </button>
            </div>

            {loading ? (
                <p style={{ color: '#6b7280' }}>Yükleniyor…</p>
            ) : rows.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                    Kayıt bulunamadı.
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#1a3a52', color: '#fff', textAlign: 'left' }}>
                                <th style={{ padding: '10px 12px' }}>Müşteri</th>
                                <th style={{ padding: '10px 12px' }}>Ürün</th>
                                <th style={{ padding: '10px 12px' }}>Durum</th>
                                <th style={{ padding: '10px 12px' }}>Sonraki Yenileme</th>
                                <th style={{ padding: '10px 12px' }}>Dönem Bitişi</th>
                                <th style={{ padding: '10px 12px' }}>Ödeme</th>
                                <th style={{ padding: '10px 12px' }}>Oto. Yenileme</th>
                                <th style={{ padding: '10px 12px' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((s, i) => {
                                const b = badge(s)
                                const pay = s.payment_method === 'credit_card'
                                    ? (s.card_masked ? `${s.card_brand ? s.card_brand + ' ' : ''}**** ${String(s.card_masked).slice(-4)}` : 'Kredi kartı')
                                    : s.payment_method === 'manual_transfer' ? 'Havale/EFT' : '—'
                                return (
                                    <tr key={s.id} style={{ background: i % 2 ? '#f8fafc' : '#fff', borderBottom: '1px solid #eef2f7' }}>
                                        <td style={{ padding: '10px 12px' }}>
                                            <div style={{ fontWeight: 600, color: '#102a43' }}>{s.user_name?.trim() || '—'}</div>
                                            <div style={{ color: '#64748b', fontSize: 12 }}>{s.user_email}</div>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#102a43' }}>{s.product_name}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ background: b.bg, color: b.c, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{b.t}</span>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#102a43' }}>{fmt(s.next_renewal_at)}</td>
                                        <td style={{ padding: '10px 12px', color: '#102a43' }}>{fmt(s.expires_at)}</td>
                                        <td style={{ padding: '10px 12px', color: '#475569' }}>{pay}</td>
                                        <td style={{ padding: '10px 12px', fontWeight: 600, color: Number(s.auto_renew) === 1 && !s.cancellation_requested_at ? '#166534' : '#b91c1c' }}>
                                            {Number(s.auto_renew) === 1 && !s.cancellation_requested_at ? 'Açık' : 'Kapalı'}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            {s.status === 'active' && Number(s.auto_renew) === 1 && !s.cancellation_requested_at ? (
                                                <button
                                                    onClick={() => cancelSub(s.id)}
                                                    disabled={busyId === s.id}
                                                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                                                >
                                                    {busyId === s.id ? '…' : 'İptal et'}
                                                </button>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {pages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer' }}>
                        ‹ Önceki
                    </button>
                    <span style={{ padding: '6px 12px', color: '#475569' }}>{page} / {pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: page >= pages ? 'default' : 'pointer' }}>
                        Sonraki ›
                    </button>
                </div>
            )}
        </AdminLayout>
    )
}
