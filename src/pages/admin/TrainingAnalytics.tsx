import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'

interface TrainingSummary {
    product_key: string
    total_viewers: number
    total_seconds: number
    last_access: string
}

interface TrainingDetail {
    product_key: string
    user_id: number
    user_name: string
    user_email: string
    total_seconds: number
    last_access: string
}

const PRODUCT_LABELS: Record<string, string> = {
    'training-odeme-sistemlerinde-buyume': 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama'
}

function formatMinutes(seconds: number) {
    const mins = Math.round(Number(seconds) / 60)
    if (mins < 60) return `${mins} dk`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}s ${m}dk`
}

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function TrainingAnalytics() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api'
    const [summary, setSummary] = useState<TrainingSummary[]>([])
    const [details, setDetails] = useState<TrainingDetail[]>([])
    const [expanded, setExpanded] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token')
                const res = await fetch(`${ADMIN_API_BASE}/admin/training-analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (!res.ok) return
                const data = await res.json()
                setSummary(Array.isArray(data.summary) ? data.summary : [])
                setDetails(Array.isArray(data.details) ? data.details : [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [ADMIN_API_BASE])

    const getDetails = (productKey: string) =>
        details.filter((d) => d.product_key === productKey)

    return (
        <AdminLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800, margin: 0 }}>Eğitim Analitikleri</h1>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Eğitim içeriklerinin izlenme süresi ve kullanıcı bazlı veriler.</p>
            </div>

            {loading ? (
                <p style={{ color: '#6b7280' }}>Yükleniyor...</p>
            ) : summary.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    Henüz izlenme verisi yok.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {summary.map((row) => {
                        const label = PRODUCT_LABELS[row.product_key] || row.product_key
                        const userRows = getDetails(row.product_key)
                        const isOpen = expanded === row.product_key

                        return (
                            <div key={row.product_key} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                {/* Summary row */}
                                <div
                                    style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 200px 100px', alignItems: 'center', padding: '20px 24px', cursor: 'pointer', borderBottom: isOpen ? '1px solid #f3f4f6' : 'none' }}
                                    onClick={() => setExpanded(isOpen ? null : row.product_key)}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1a3a52', fontSize: '1rem' }}>{label}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>{row.product_key}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a3a52' }}>{row.total_viewers}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>izleyici</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4d6b00' }}>{formatMinutes(row.total_seconds)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>toplam izlenme</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#374151' }}>{formatDate(row.last_access)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>son erişim</div>
                                    </div>
                                    <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '1.2rem' }}>
                                        {isOpen ? '▲' : '▼'}
                                    </div>
                                </div>

                                {/* User breakdown */}
                                {isOpen && (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 180px', padding: '10px 24px', background: '#f9fafb', fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <div>Kullanıcı</div>
                                            <div>E-posta</div>
                                            <div>İzlenme</div>
                                            <div>Son Erişim</div>
                                        </div>
                                        {userRows.map((u) => (
                                            <div key={u.user_id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 180px', padding: '14px 24px', borderTop: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                                                <div style={{ color: '#1f2937', fontWeight: 500 }}>{u.user_name || `#${u.user_id}`}</div>
                                                <div style={{ color: '#6b7280' }}>{u.user_email}</div>
                                                <div style={{ color: '#4d6b00', fontWeight: 600 }}>{formatMinutes(u.total_seconds)}</div>
                                                <div style={{ color: '#6b7280' }}>{formatDate(u.last_access)}</div>
                                            </div>
                                        ))}
                                        {userRows.length === 0 && (
                                            <div style={{ padding: '20px 24px', color: '#9ca3af', fontSize: '0.9rem' }}>Kullanıcı verisi yok.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </AdminLayout>
    )
}
