import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { useCart } from '../context/CartContext'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'
import './ConsultantBookingModal.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConsultantBookingModalProps {
    isOpen: boolean
    onClose: () => void
    consultant: { slug: string; name: string }
    service: {
        id: number
        title: string
        price: number
        currency: string
        plus_vat: boolean
        cta_text: string
    }
}

interface AvailabilitySlot {
    id: number
    available_date: string // YYYY-MM-DD
    start_time: string
    end_time: string
}

type Step = 1 | 2 | 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonth(year: number, month: number): string {
    // month is 1-indexed
    return `${year}-${String(month).padStart(2, '0')}`
}

function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    // dateStr: YYYY-MM-DD or ISO
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    const parts = cleanDate.split('-').map(Number)
    if (parts.length < 3 || parts.some(isNaN)) return dateStr;
    const [y, m, d] = parts
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTimeRange(start: string, end: string): string {
    if (!start || !end) return '';
    return `${String(start).slice(0, 5)} – ${String(end).slice(0, 5)}`
}

function getMonthLabel(year: number, month: number): string {
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

function formatPrice(price: number, currency: string, plusVat: boolean): string {
    if (typeof price !== 'number') return '';
    return `${price.toLocaleString('tr-TR')} ${currency || ''}${plusVat ? ' + KDV' : ''}`
}

// Group slots by date
function groupSlotsByDate(slots: AvailabilitySlot[]): Record<string, AvailabilitySlot[]> {
    const result: Record<string, AvailabilitySlot[]> = {}
    if (!slots || !Array.isArray(slots)) return result
    for (const slot of slots) {
        if (!slot || !slot.available_date) continue
        // Normalize ISO string or date string to YYYY-MM-DD
        const dateKey = slot.available_date.includes('T') ? slot.available_date.split('T')[0] : slot.available_date
        if (!result[dateKey]) result[dateKey] = []
        result[dateKey].push(slot)
    }
    return result
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
    return (
        <div className="booking-steps">
            {([1, 2, 3] as Step[]).map((n) => (
                <div
                    key={n}
                    className={`booking-step${current === n ? ' active' : ''}${current > n ? ' done' : ''}`}
                >
                    <span className="step-circle">{current > n ? '✓' : n}</span>
                    <span className="step-label">
                        {n === 1 ? 'Tarih' : n === 2 ? 'Bilgiler' : 'Onay'}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ConsultantBookingModal({
    isOpen,
    onClose,
    consultant,
    service
}: ConsultantBookingModalProps) {
    const today = new Date()
    const [step, setStep] = useState<Step>(1)

    // Calendar state
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth() + 1) // 1-indexed
    const [slots, setSlots] = useState<AvailabilitySlot[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [slotsError, setSlotsError] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [company, setCompany] = useState('')
    const [topic, setTopic] = useState('')
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Confirmation state
    const [bookingId, setBookingId] = useState<number | null>(null)

    const overlayRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const currentLang = useRouteLocale()
    const checkoutPath = getLocalizedPathByKey(currentLang, 'checkout')

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setSelectedDate(null)
            setSelectedSlot(null)
            setName('')
            setEmail('')
            setPhone('')
            setCompany('')
            setTopic('')
            setFormError(null)
            setBookingId(null)
        }
    }, [isOpen])

    // Fetch availability when step=1 and month/year changes
    useEffect(() => {
        if (!isOpen || step !== 1) return
        setSlotsLoading(true)
        setSlotsError(null)
        setSlots([])
        setSelectedDate(null)
        setSelectedSlot(null)

        const monthStr = formatMonth(year, month)
        fetch(
            `${API_BASE_URL}/consultants/${encodeURIComponent(consultant.slug)}/availability?service_id=${service.id}&month=${monthStr}`
        )
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((data) => {
                setSlots(data.slots ?? [])
            })
            .catch(() => {
                setSlotsError('Müsaitlik bilgisi alınamadı.')
            })
            .finally(() => setSlotsLoading(false))
    }, [isOpen, step, consultant.slug, service.id, year, month])

    // Trap scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) onClose()
    }

    const handlePrevMonth = () => {
        if (month === 1) {
            setYear((y) => y - 1)
            setMonth(12)
        } else {
            setMonth((m) => m - 1)
        }
    }

    const handleNextMonth = () => {
        if (month === 12) {
            setYear((y) => y + 1)
            setMonth(1)
        } else {
            setMonth((m) => m + 1)
        }
    }

    const slotsByDate = groupSlotsByDate(slots)
    const availableDates = Object.keys(slotsByDate).sort()

    const handleDateSelect = (date: string) => {
        setSelectedDate(date)
        setSelectedSlot(null)
    }

    const handleSlotSelect = (slot: AvailabilitySlot) => {
        setSelectedSlot(slot)
    }

    const handleContinueToForm = () => {
        setStep(2)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)

        if (!name.trim() || !email.trim()) {
            setFormError('Ad Soyad ve E-posta alanları zorunludur.')
            return
        }

        setSubmitting(true)
        try {
            const body: Record<string, unknown> = {
                consultant_slug: consultant.slug,
                service_id: service.id,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                company: company.trim(),
                topic: topic.trim()
            }
            if (selectedSlot) {
                body.availability_id = selectedSlot.id
            }

            const res = await fetch(`${API_BASE_URL}/consultants/bookings/hold`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || `HTTP ${res.status}`)
            }

            const data = await res.json()
            setBookingId(data.booking_id ?? null)
            setStep(3)
        } catch (err) {
            setFormError(
                err instanceof Error
                    ? err.message
                    : 'Rezervasyon gönderilemedi. Lütfen tekrar deneyin.'
            )
        } finally {
            setSubmitting(false)
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            className="booking-modal-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div className="booking-modal">
                {/* Header */}
                <div className="booking-modal-header">
                    <h3 className="booking-modal-title">
                        {step === 3 ? 'Rezervasyon Onayı' : service.title}
                    </h3>
                    <button
                        className="booking-modal-close"
                        onClick={onClose}
                        aria-label="Kapat"
                    >
                        ✕
                    </button>
                </div>

                <StepIndicator current={step} />

                {/* ── Step 1: Calendar ──────────────────────────────────── */}
                {step === 1 && (
                    <div className="booking-step-content" key="step-1">
                        <div className="calendar-nav">
                            <button type="button" className="cal-nav-btn" onClick={handlePrevMonth} aria-label="Önceki ay">‹</button>
                            <span className="calendar-month-label">{getMonthLabel(year, month)}</span>
                            <button type="button" className="cal-nav-btn" onClick={handleNextMonth} aria-label="Sonraki ay">›</button>
                        </div>

                        {slotsLoading && <p className="slots-message">Müsaitlik durumu yükleniyor...</p>}
                        {slotsError && <p className="slots-message error">{slotsError}</p>}

                        {!slotsLoading && !slotsError && (
                            <>
                                {availableDates.length > 0 ? (
                                    <div className="calendar-container">
                                        <div className="calendar-weekdays">
                                            {['Pt', 'Sa', 'Çr', 'Pr', 'Cu', 'Ct', 'Pz'].map(d => <span key={d}>{d}</span>)}
                                        </div>
                                        <div className="calendar-grid">
                                            {(() => {
                                                const firstDayAt = new Date(year, month - 1, 1).getDay();
                                                const padding = firstDayAt === 0 ? 6 : firstDayAt - 1;
                                                const daysInMonth = new Date(year, month, 0).getDate();
                                                const grid = [];
                                                for (let i = 0; i < padding; i++) grid.push(<div key={`pad-${i}`} className="calendar-day-empty"></div>);
                                                for (let d = 1; d <= daysInMonth; d++) {
                                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                    const currentDaySlots = slotsByDate[dateStr];
                                                    const hasSlots = Array.isArray(currentDaySlots) && currentDaySlots.length > 0;
                                                    const isSelected = selectedDate === dateStr;
                                                    grid.push(
                                                        <button
                                                            key={d}
                                                            type="button"
                                                            disabled={!hasSlots}
                                                            className={`calendar-day-btn${isSelected ? ' selected' : ''}${hasSlots ? ' has-slots' : ''}`}
                                                            onClick={() => handleDateSelect(dateStr)}
                                                        >
                                                            {d}
                                                        </button>
                                                    );
                                                }
                                                return grid;
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="slots-empty">
                                        <p>Seçili ay için uygun randevu bulunamadı.</p>
                                        <button type="button" className="booking-btn-secondary" onClick={handleContinueToForm}>Tarih Seçmeden Devam Et</button>
                                    </div>
                                )}

                                {selectedDate && slotsByDate[selectedDate] && (
                                    <div className="time-slots-section animate-fade-in">
                                        <p className="time-slots-label">{formatDateDisplay(selectedDate)} — Saat Seçin:</p>
                                        <div className="time-slots">
                                            {slotsByDate[selectedDate].map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    type="button"
                                                    className={`slot-btn${selectedSlot?.id === slot.id ? ' selected' : ''}`}
                                                    onClick={() => handleSlotSelect(slot)}
                                                >
                                                    {formatTimeRange(slot.start_time, slot.end_time)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="booking-step-actions">
                                    <button
                                        type="button"
                                        className="booking-btn-primary"
                                        onClick={handleContinueToForm}
                                        disabled={!selectedDate || (slotsByDate[selectedDate] && !selectedSlot)}
                                    >
                                        {!selectedDate ? 'Lütfen Tarih Seçin' : (slotsByDate[selectedDate] && !selectedSlot) ? 'Lütfen Saat Seçin' : 'Devam Et'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Step 2: Info Form ─────────────────────────────────── */}
                {step === 2 && (
                    <div className="booking-step-content">
                        {/* Summary */}
                        <div className="booking-summary">
                            <div className="booking-summary-service">
                                <span className="booking-summary-label">Hizmet</span>
                                <span className="booking-summary-value">{service.title}</span>
                            </div>
                            <div className="booking-summary-price">
                                {formatPrice(service.price, service.currency, service.plus_vat)}
                            </div>
                            {selectedSlot && selectedDate && (
                                <div className="booking-summary-slot">
                                    <span>📅 {formatDateDisplay(selectedDate)}</span>
                                    <span>
                                        🕐{' '}
                                        {formatTimeRange(
                                            selectedSlot.start_time,
                                            selectedSlot.end_time
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        <form className="booking-form" onSubmit={handleSubmit} noValidate>
                            <div className="form-group">
                                <label htmlFor="bm-name">
                                    Ad Soyad <span className="required">*</span>
                                </label>
                                <input
                                    id="bm-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Adınız Soyadınız"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-email">
                                    E-posta <span className="required">*</span>
                                </label>
                                <input
                                    id="bm-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@sirket.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-phone">Telefon</label>
                                <input
                                    id="bm-phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+90 5xx xxx xx xx"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-company">Şirket</label>
                                <input
                                    id="bm-company"
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="Şirket adı"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-topic">Danışmanlık Konusu</label>
                                <textarea
                                    id="bm-topic"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Danışmanlık almak istediğiniz konuyu kısaca açıklayın..."
                                    rows={4}
                                />
                            </div>

                            {formError && (
                                <p className="form-error">{formError}</p>
                            )}

                            <div className="booking-step-actions">
                                <button
                                    type="button"
                                    className="booking-btn-secondary"
                                    onClick={() => setStep(1)}
                                    disabled={submitting}
                                >
                                    ← Geri
                                </button>
                                <button
                                    type="submit"
                                    className="booking-btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Gönderiliyor...' : 'Rezervasyon Talebi Gönder'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Step 3: Confirmation ──────────────────────────────── */}
                {step === 3 && (
                    <div className="booking-step-content booking-confirmation">
                        <div className="confirmation-icon">✅</div>
                        <h4 className="confirmation-title">
                            Rezervasyon Talebiniz Alındı!
                        </h4>
                        {bookingId && (
                            <p className="confirmation-id">
                                Rezervasyon No: #{bookingId}
                            </p>
                        )}
                        <div className="confirmation-summary">
                            <div className="confirmation-row">
                                <span className="conf-label">Hizmet</span>
                                <span className="conf-value">{service.title}</span>
                            </div>
                            {selectedSlot && selectedDate && (
                                <>
                                    <div className="confirmation-row">
                                        <span className="conf-label">Tarih</span>
                                        <span className="conf-value">
                                            {formatDateDisplay(selectedDate)}
                                        </span>
                                    </div>
                                    <div className="confirmation-row">
                                        <span className="conf-label">Saat</span>
                                        <span className="conf-value">
                                            {formatTimeRange(
                                                selectedSlot.start_time,
                                                selectedSlot.end_time
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                            {name && (
                                <div className="confirmation-row">
                                    <span className="conf-label">İsim</span>
                                    <span className="conf-value">{name}</span>
                                </div>
                            )}
                            {email && (
                                <div className="confirmation-row">
                                    <span className="conf-label">E-posta</span>
                                    <span className="conf-value">{email}</span>
                                </div>
                            )}
                        </div>
                        <div className="confirmation-price-box">
                            <span className="conf-price-label">Ödenecek Tutar</span>
                            <span className="conf-price-value">
                                {service.price.toLocaleString('tr-TR')} {service.currency}
                                {service.plus_vat && <small> + KDV</small>}
                            </span>
                        </div>
                        <p className="confirmation-message">
                            Ödemeyi tamamlamak için aşağıdaki butona tıklayın.
                        </p>
                        <button className="booking-btn-primary" onClick={() => {
                            addToCart({
                                id: `consultant-${service.id}-booking-${bookingId}`,
                                product_id: service.id,
                                product_key: `consultant-service-${service.id}`,
                                name: `${consultant.name} — ${service.title}`,
                                description: `Danışmanlık rezervasyonu #${bookingId}`,
                                price: service.price,
                                currency: service.currency
                            })
                            onClose()
                            navigate(checkoutPath, {
                                state: {
                                    email: email,
                                    name: name,
                                    country: 'Türkiye'
                                }
                            })
                        }}>
                            💳 Ödeme ile Tamamla
                        </button>
                        <button className="booking-btn-secondary" style={{ marginTop: 8 }} onClick={onClose}>
                            Daha Sonra Öde
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
