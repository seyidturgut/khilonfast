import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { useCart } from '../context/CartContext'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'
import ConsentCheckboxes from './ConsentCheckboxes'
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
        booking_type?: 'slot' | 'fixed_day' | 'lead_form'
        duration_minutes?: number | null
        fixed_start_time?: string | null
        fixed_end_time?: string | null
    }
}

interface AvailabilitySlot {
    id?: number // runtime slot'larda id yok; start_at kullanılır
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
    const [policyTerms, setPolicyTerms] = useState(false)
    const [policyPrivacy, setPolicyPrivacy] = useState(false)
    const [policyCookie, setPolicyCookie] = useState(false)
    const [policyRefund, setPolicyRefund] = useState(false)
    const [, setPolicyEtk] = useState(false)
    const allPoliciesOk = policyTerms && policyPrivacy && policyCookie && policyRefund

    // Confirmation state
    const [bookingId, setBookingId] = useState<number | null>(null)

    // Lead form state (Fractional CMO — booking_type='lead_form')
    const bookingType = service.booking_type || 'slot'
    const isLeadForm = bookingType === 'lead_form'
    const [leadPosition, setLeadPosition] = useState('')
    const [leadWebsite, setLeadWebsite] = useState('')
    const [leadNeeds, setLeadNeeds] = useState('')
    const [leadKvkk, setLeadKvkk] = useState(false)
    const [leadDone, setLeadDone] = useState(false)

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
            setPolicyTerms(false)
            setPolicyPrivacy(false)
            setPolicyCookie(false)
            setPolicyRefund(false)
            setPolicyEtk(false)
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
            // Yeni model: seçilen slot'tan start_at gönder (backend end_at'i süreden hesaplar).
            if (selectedSlot) {
                const d = selectedSlot.available_date.includes('T')
                    ? selectedSlot.available_date.split('T')[0]
                    : selectedSlot.available_date
                body.start_at = `${d} ${String(selectedSlot.start_time).slice(0, 8).padEnd(8, ':00')}`
                if (selectedSlot.id) body.availability_id = selectedSlot.id // legacy uyum
            }

            const res = await fetch(`${API_BASE_URL}/consultants/bookings/hold`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || errData.message || `HTTP ${res.status}`)
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

    // Fractional CMO lead/başvuru formu gönderimi (takvimsiz)
    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        if (!name.trim() || !email.trim()) {
            setFormError('Ad Soyad ve E-posta alanları zorunludur.')
            return
        }
        if (!leadKvkk) {
            setFormError('Devam etmek için KVKK onayı gereklidir.')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch(`${API_BASE_URL}/consultants/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consultant_slug: consultant.slug,
                    service_id: service.id,
                    name: name.trim(),
                    company: company.trim(),
                    position: leadPosition.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    website: leadWebsite.trim(),
                    needs: leadNeeds.trim(),
                    kvkk_consent: leadKvkk
                })
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || `HTTP ${res.status}`)
            }
            setLeadDone(true)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Başvuru gönderilemedi. Lütfen tekrar deneyin.')
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
                        {isLeadForm ? service.title : (step === 3 ? 'Rezervasyon Onayı' : service.title)}
                    </h3>
                    <button
                        className="booking-modal-close"
                        onClick={onClose}
                        aria-label="Kapat"
                    >
                        ✕
                    </button>
                </div>

                {/* ── Fractional CMO / Lead başvuru formu (takvimsiz) ────── */}
                {isLeadForm && (
                    <div className="booking-step-content" key="lead-form">
                        {leadDone ? (
                            <div className="booking-confirmation" style={{ textAlign: 'center', padding: '12px 4px' }}>
                                <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>✅</div>
                                <h4 style={{ margin: '0 0 8px' }}>Başvurunuz Alındı</h4>
                                <p style={{ color: '#475569', lineHeight: 1.6 }}>
                                    <strong>{service.title}</strong> başvurunuz/satın alma talebiniz alınmıştır.
                                    Ekibimiz en kısa sürede sizinle iletişime geçecektir.
                                </p>
                                <button type="button" className="booking-btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
                                    Kapat
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleLeadSubmit} className="booking-form">
                                <p className="slots-message" style={{ marginBottom: 12 }}>
                                    Bu program aylık olarak yürütülür. Başvuru formunu doldurun, ekibimiz sizinle iletişime geçsin.
                                </p>
                                <div className="form-row">
                                    <label>Ad Soyad *<input type="text" value={name} onChange={e => setName(e.target.value)} required /></label>
                                    <label>Şirket<input type="text" value={company} onChange={e => setCompany(e.target.value)} /></label>
                                </div>
                                <div className="form-row">
                                    <label>Pozisyon<input type="text" value={leadPosition} onChange={e => setLeadPosition(e.target.value)} /></label>
                                    <label>Şirket Web Sitesi<input type="text" value={leadWebsite} onChange={e => setLeadWebsite(e.target.value)} placeholder="ornek.com" /></label>
                                </div>
                                <div className="form-row">
                                    <label>E-posta *<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
                                    <label>Telefon<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
                                </div>
                                <label>İhtiyaç / Beklenti
                                    <textarea rows={3} value={leadNeeds} onChange={e => setLeadNeeds(e.target.value)} placeholder="Aradığınız desteği kısaca anlatın..." />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem', marginTop: 8 }}>
                                    <input type="checkbox" checked={leadKvkk} onChange={e => setLeadKvkk(e.target.checked)} style={{ marginTop: 3 }} />
                                    <span>Kişisel verilerimin KVKK kapsamında işlenmesini onaylıyorum. *</span>
                                </label>
                                {formError && <p className="slots-message error" style={{ marginTop: 8 }}>{formError}</p>}
                                <button type="submit" className="booking-btn-primary" disabled={submitting} style={{ marginTop: 14, width: '100%' }}>
                                    {submitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {!isLeadForm && <StepIndicator current={step} />}

                {/* ── Step 1: Calendar ──────────────────────────────────── */}
                {!isLeadForm && step === 1 && (
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
                                        <p className="time-slots-label">{formatDateDisplay(selectedDate)} — {bookingType === 'fixed_day' ? 'Blok Seçin' : 'Saat Seçin'}:</p>
                                        <div className="time-slots">
                                            {slotsByDate[selectedDate].map((slot) => {
                                                const slotKey = `${slot.available_date}_${slot.start_time}`
                                                const selKey = selectedSlot ? `${selectedSlot.available_date}_${selectedSlot.start_time}` : ''
                                                return (
                                                    <button
                                                        key={slotKey}
                                                        type="button"
                                                        className={`slot-btn${selKey === slotKey ? ' selected' : ''}`}
                                                        onClick={() => handleSlotSelect(slot)}
                                                    >
                                                        {formatTimeRange(slot.start_time, slot.end_time)}
                                                    </button>
                                                )
                                            })}
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
                {!isLeadForm && step === 2 && (
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

                            <div className="booking-policy-checkboxes">
                                <ConsentCheckboxes
                                    context="booking"
                                    isEn={currentLang === 'en'}
                                    onChange={s => {
                                        // Tek main_legal onayı 4 eski policy alanını dolu sayar (sadece submit guard)
                                        setPolicyTerms(s.main_legal);
                                        setPolicyPrivacy(s.main_legal);
                                        setPolicyCookie(s.main_legal);
                                        setPolicyRefund(s.main_legal);
                                        setPolicyEtk(s.etk);
                                    }}
                                />
                            </div>

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
                                    disabled={submitting || !allPoliciesOk}
                                >
                                    {submitting ? 'Gönderiliyor...' : 'Rezervasyon Talebi Gönder'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Step 3: Confirmation ──────────────────────────────── */}
                {!isLeadForm && step === 3 && (
                    <div className="booking-step-content booking-confirmation">
                        <div className="confirmation-icon">✅</div>
                        <h4 className="confirmation-title">
                            {bookingType === 'fixed_day'
                                ? 'Executive Strategy Day Rezervasyonunuz Oluşturuldu!'
                                : 'Randevunuz Oluşturuldu!'}
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
                                product_id: 0, // danışmanlık hizmeti products tablosunda değil — backend product_key ile çözer
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
                        <button className="booking-btn-secondary" style={{ marginTop: 8 }} onClick={() => {
                            // "Daha Sonra Öde" → ödeme son-adım maili tetiklenir
                            if (bookingId) {
                                fetch(`${API_BASE_URL}/consultants/bookings/${bookingId}/defer`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' }
                                }).catch(() => { /* sessiz — mail başarısızsa booking yine de durur */ })
                            }
                            onClose()
                        }}>
                            Daha Sonra Öde
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
