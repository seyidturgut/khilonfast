import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { useRouteLocale } from '../utils/locale'

type Phase = 'processing' | 'done' | 'invalid'

const REASONS = [
    { value: 'too_frequent', tr: 'Çok sık e-posta alıyorum', en: 'I receive emails too often' },
    { value: 'not_relevant', tr: 'İçerik benimle alakalı değil', en: 'The content is not relevant to me' },
    { value: 'never_subscribed', tr: 'Abone olduğumu hatırlamıyorum', en: "I don't remember subscribing" },
    { value: 'not_interested', tr: 'Artık ilgilenmiyorum', en: 'I am no longer interested' },
    { value: 'spam', tr: 'İçerik rahatsız edici / spam', en: 'The emails are spammy / annoying' },
    { value: 'other', tr: 'Diğer', en: 'Other' },
]

export default function UnsubscribePage() {
    const [params] = useSearchParams()
    const lang = useRouteLocale()
    const isEn = lang === 'en'
    const tt = (tr: string, en: string) => (isEn ? en : tr)

    const email = (params.get('e') || params.get('email') || '').trim()
    const token = (params.get('t') || params.get('token') || '').trim()

    const [phase, setPhase] = useState<Phase>('processing')
    const [reason, setReason] = useState('')
    const [detail, setDetail] = useState('')
    const [reasonSent, setReasonSent] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Sayfa açılınca ANINDA abonelikten çık
    useEffect(() => {
        let active = true
        if (!email || !token) { setPhase('invalid'); return }
        fetch(`${API_BASE_URL}/crm-public/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token }),
        })
            .then(async (r) => {
                if (!active) return
                if (r.ok) setPhase('done')
                else setPhase('invalid')
            })
            .catch(() => { if (active) setPhase('invalid') })
        return () => { active = false }
    }, [email, token])

    const submitReason = async () => {
        if (!reason || submitting) return
        setSubmitting(true)
        try {
            await fetch(`${API_BASE_URL}/crm-public/unsubscribe-reason`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, reason, detail: reason === 'other' ? detail : '' }),
            })
            setReasonSent(true)
        } catch { /* sessiz — çıkış zaten geçerli */ setReasonSent(true) }
        finally { setSubmitting(false) }
    }

    const wrap: React.CSSProperties = { minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', background: '#f4f7fb' }
    const card: React.CSSProperties = { maxWidth: 520, width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 8px 30px rgba(16,42,67,0.08)', padding: '36px 32px', textAlign: 'center' as const }

    if (phase === 'processing') {
        return <div style={wrap}><div style={card}><p style={{ color: '#627d98' }}>{tt('İşleminiz gerçekleştiriliyor...', 'Processing your request...')}</p></div></div>
    }

    if (phase === 'invalid') {
        return (
            <div style={wrap}><div style={card}>
                <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>⚠️</div>
                <h1 style={{ fontSize: '1.3rem', margin: '0 0 10px', color: '#102a43' }}>{tt('Bağlantı geçersiz', 'Invalid link')}</h1>
                <p style={{ color: '#627d98', lineHeight: 1.6 }}>
                    {tt('Abonelikten çıkma bağlantısı geçersiz veya süresi dolmuş. Lütfen e-postadaki güncel bağlantıyı kullanın.',
                        'This unsubscribe link is invalid or expired. Please use the latest link from your email.')}
                </p>
            </div></div>
        )
    }

    // phase === 'done'
    return (
        <div style={wrap}><div style={card}>
            <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>✅</div>
            <h1 style={{ fontSize: '1.35rem', margin: '0 0 8px', color: '#102a43' }}>
                {tt('Abonelikten çıkarıldınız', 'You have been unsubscribed')}
            </h1>
            <p style={{ color: '#627d98', lineHeight: 1.6, margin: '0 0 6px' }}>
                {tt('Artık pazarlama e-postalarımızı almayacaksınız.', 'You will no longer receive our marketing emails.')}
            </p>
            {email && <p style={{ color: '#9fb3c8', fontSize: '0.85rem', margin: '0 0 20px' }}>{email}</p>}

            {reasonSent ? (
                <p style={{ color: '#2e7d32', fontWeight: 600, marginTop: 18 }}>
                    {tt('Geri bildiriminiz için teşekkür ederiz 🙏', 'Thank you for your feedback 🙏')}
                </p>
            ) : (
                <div style={{ marginTop: 22, textAlign: 'left' as const, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                    <p style={{ fontWeight: 600, color: '#243b53', margin: '0 0 12px', textAlign: 'center' as const }}>
                        {tt('Bize sebebini söyler misiniz? (opsiyonel)', 'Would you tell us why? (optional)')}
                    </p>
                    {REASONS.map((r) => (
                        <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: reason === r.value ? '#eef3f8' : 'transparent' }}>
                            <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                            <span style={{ fontSize: '0.92rem', color: '#334e68' }}>{isEn ? r.en : r.tr}</span>
                        </label>
                    ))}
                    {reason === 'other' && (
                        <textarea
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            placeholder={tt('Kısaca açıklayabilirsiniz...', 'You can briefly explain...')}
                            rows={3}
                            style={{ width: '100%', marginTop: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical' as const }}
                        />
                    )}
                    <button
                        type="button"
                        onClick={submitReason}
                        disabled={!reason || submitting}
                        style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: !reason || submitting ? '#cbd5e1' : '#1a3a52', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: !reason || submitting ? 'default' : 'pointer' }}
                    >
                        {submitting ? tt('Gönderiliyor...', 'Submitting...') : tt('Gönder', 'Submit')}
                    </button>
                </div>
            )}
        </div></div>
    )
}
