import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { useCart } from '../context/CartContext'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'

// "Daha Sonra Öde" mailindeki ödeme butonu bu sayfaya gelir.
// Booking'i çeker, danışmanlık hizmetini sepete ekler, checkout'a yönlendirir.
type Booking = {
    id: number
    name: string
    email: string
    status: string
    service_id: number
    service_title: string
    price: number
    currency: string
    plus_vat: number
    consultant_name: string
    consultant_slug: string
}

export default function DanismanlikOdeme() {
    const { bookingId } = useParams<{ bookingId: string }>()
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const currentLang = useRouteLocale()
    const checkoutPath = getLocalizedPathByKey(currentLang, 'checkout')
    const [error, setError] = useState('')
    const handled = useRef(false)

    useEffect(() => {
        if (handled.current || !bookingId) return
        handled.current = true

        ;(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/consultants/bookings/${bookingId}`)
                const data = await res.json()
                if (!res.ok || !data.booking) {
                    setError('Randevu bulunamadı. Lütfen bağlantıyı kontrol edin.')
                    return
                }
                const b: Booking = data.booking
                if (b.status === 'confirmed') {
                    setError('Bu randevunun ödemesi zaten tamamlanmış.')
                    return
                }
                if (b.status === 'cancelled') {
                    setError('Bu randevu iptal edilmiş.')
                    return
                }

                addToCart({
                    id: `consultant-${b.service_id}-booking-${b.id}`,
                    product_id: 0, // danışmanlık hizmeti products tablosunda değil — backend product_key ile çözer
                    product_key: `consultant-service-${b.service_id}`,
                    name: `${b.consultant_name} — ${b.service_title}`,
                    description: `Danışmanlık rezervasyonu #${b.id}`,
                    price: Number(b.price),
                    currency: b.currency,
                })
                navigate(checkoutPath, {
                    state: { email: b.email, name: b.name, country: 'Türkiye' },
                    replace: true,
                })
            } catch {
                setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
            }
        })()
    }, [bookingId, addToCart, navigate, checkoutPath])

    return (
        <div style={{
            minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif',
        }}>
            {error ? (
                <div style={{ maxWidth: 460 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
                    <h2 style={{ color: '#1a3a52', marginBottom: '0.5rem' }}>Ödeme Başlatılamadı</h2>
                    <p style={{ color: '#475569', lineHeight: 1.6 }}>{error}</p>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                        Yardım için: <a href="mailto:info@khilonfast.com" style={{ color: '#89b004', fontWeight: 700 }}>info@khilonfast.com</a>
                    </p>
                </div>
            ) : (
                <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
                    <p style={{ color: '#475569' }}>Ödeme sayfasına yönlendiriliyorsunuz…</p>
                </div>
            )}
        </div>
    )
}
