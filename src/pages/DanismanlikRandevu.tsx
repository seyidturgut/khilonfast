import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'

// Mailler'deki "yeni takvim seç" linki bu sayfaya gelir.
// Kullanıcı randevusunu değiştirebilir veya iptal edebilir (48 saat kuralı backend'de).
type Booking = {
    id: number
    name: string
    status: string
    service_id: number
    availability_id: number | null
    service_title: string
    consultant_name: string
    consultant_slug: string
    available_date: string | null
    start_time: string | null
    end_time: string | null
}
type Slot = {
    id: number
    available_date: string
    start_time: string
    end_time: string
    service_id: number | null
}

const hhmm = (t?: string | null) => (t ? String(t).slice(0, 5) : '')
const fmtDate = (d?: string | null) => {
    if (!d) return ''
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' })
}

export default function DanismanlikRandevu() {
    const { bookingId } = useParams<{ bookingId: string }>()
    const [params] = useSearchParams()
    const token = params.get('t') || ''

    const [booking, setBooking] = useState<Booking | null>(null)
    const [slots, setSlots] = useState<Slot[]>([])
    const [selected, setSelected] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState<'' | 'rescheduled' | 'cancelled'>('')

    useEffect(() => {
        if (!bookingId) return
        ;(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/consultants/bookings/${bookingId}`)
                const data = await res.json()
                if (!res.ok || !data.booking) { setError('Randevu bulunamadı.'); setLoading(false); return }
                const b: Booking = data.booking
                setBooking(b)
                if (b.status === 'cancelled') { setError('Bu randevu zaten iptal edilmiş.'); setLoading(false); return }
                const av = await fetch(`${API_BASE_URL}/consultants/${encodeURIComponent(b.consultant_slug)}/availability?service_id=${b.service_id}`)
                const avData = await av.json()
                setSlots(Array.isArray(avData.slots) ? avData.slots : [])
            } catch {
                setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
            } finally {
                setLoading(false)
            }
        })()
    }, [bookingId])

    // Slotları tarihe göre grupla (booking'in hizmetine uygun olanlar)
    const grouped = useMemo(() => {
        const out: Record<string, Slot[]> = {}
        slots
            .filter(s => !booking || !s.service_id || s.service_id === booking.service_id)
            .filter(s => s.id !== booking?.availability_id)
            .forEach(s => { (out[s.available_date] ||= []).push(s) })
        Object.values(out).forEach(list => list.sort((a, b) => a.start_time.localeCompare(b.start_time)))
        return out
    }, [slots, booking])

    const act = async (path: string, body: object) => {
        setBusy(true); setError('')
        try {
            const res = await fetch(`${API_BASE_URL}/consultants/bookings/${bookingId}/${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, ...body }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) { setError(data.error || 'İşlem tamamlanamadı.'); return false }
            return true
        } catch {
            setError('Bağlantı hatası. Lütfen tekrar deneyin.')
            return false
        } finally {
            setBusy(false)
        }
    }

    const wrap: React.CSSProperties = {
        maxWidth: 560, margin: '2rem auto', padding: '0 1rem',
        fontFamily: 'Arial, sans-serif', color: '#102a43',
    }
    const card: React.CSSProperties = {
        background: '#fff', border: '1px solid #dde7f0', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem',
    }

    if (loading) return <div style={wrap}><p style={{ textAlign: 'center', color: '#475569' }}>Yükleniyor…</p></div>

    if (done) return (
        <div style={wrap}><div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>{done === 'cancelled' ? '🗑️' : '✅'}</div>
            <h2 style={{ color: '#1a3a52' }}>
                {done === 'cancelled' ? 'Randevunuz İptal Edildi' : 'Randevunuz Güncellendi'}
            </h2>
            <p style={{ color: '#475569' }}>
                {done === 'cancelled'
                    ? 'Randevu iptaliniz alınmıştır.'
                    : 'Yeni randevu detaylarınız e-posta ile gönderildi.'}
            </p>
        </div></div>
    )

    if (error && !booking) return (
        <div style={wrap}><div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <h2 style={{ color: '#1a3a52' }}>Bir Sorun Oluştu</h2>
            <p style={{ color: '#475569' }}>{error}</p>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Yardım: <a href="mailto:info@khilonfast.com" style={{ color: '#89b004', fontWeight: 700 }}>info@khilonfast.com</a>
            </p>
        </div></div>
    )

    return (
        <div style={wrap}>
            <h1 style={{ color: '#1a3a52', fontSize: '1.4rem' }}>Danışmanlık Randevunuz</h1>

            <div style={card}>
                <p style={{ margin: '0 0 6px' }}><strong>{booking?.service_title}</strong></p>
                <p style={{ margin: '0 0 6px', color: '#475569' }}>Danışman: {booking?.consultant_name}</p>
                {booking?.available_date && (
                    <p style={{ margin: 0, color: '#475569' }}>
                        Mevcut randevu: <strong>{fmtDate(booking.available_date)} · {hhmm(booking.start_time)}
                        {booking.end_time ? ` - ${hhmm(booking.end_time)}` : ''}</strong>
                    </p>
                )}
            </div>

            {error && (
                <div style={{ ...card, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>{error}</div>
            )}

            <div style={card}>
                <h3 style={{ marginTop: 0, color: '#1a3a52', fontSize: '1.05rem' }}>Yeni Tarih & Saat Seçin</h3>
                {Object.keys(grouped).length === 0 ? (
                    <p style={{ color: '#64748b' }}>Şu anda uygun başka slot bulunmuyor.</p>
                ) : (
                    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => (
                        <div key={date} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>{fmtDate(date)}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {list.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelected(s.id)}
                                        style={{
                                            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                                            border: '1px solid ' + (selected === s.id ? '#1a3a52' : '#cbd5e1'),
                                            background: selected === s.id ? '#1a3a52' : '#fff',
                                            color: selected === s.id ? '#fff' : '#475569', fontSize: '0.85rem',
                                        }}
                                    >
                                        {hhmm(s.start_time)} - {hhmm(s.end_time)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
                <button
                    disabled={busy || !selected}
                    onClick={async () => {
                        if (await act('reschedule', { availability_id: selected })) setDone('rescheduled')
                    }}
                    style={{
                        marginTop: 12, padding: '10px 20px', borderRadius: 8, border: 'none',
                        background: selected && !busy ? '#1a3a52' : '#cbd5e1', color: '#fff',
                        fontWeight: 700, cursor: selected && !busy ? 'pointer' : 'not-allowed',
                    }}
                >
                    Randevuyu Değiştir
                </button>
            </div>

            <div style={{ ...card, textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#64748b' }}>
                    Randevunuza katılamayacaksanız iptal edebilirsiniz. (Randevuya 48 saatten az kala değişiklik/iptal yapılamaz.)
                </p>
                <button
                    disabled={busy}
                    onClick={async () => {
                        if (!window.confirm('Randevunuzu iptal etmek istediğinize emin misiniz?')) return
                        if (await act('cancel', {})) setDone('cancelled')
                    }}
                    style={{
                        padding: '9px 18px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer',
                        border: '1px solid #dc2626', background: '#fff', color: '#dc2626', fontWeight: 600,
                    }}
                >
                    Randevuyu İptal Et
                </button>
            </div>
        </div>
    )
}
