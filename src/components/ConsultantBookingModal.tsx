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

function formatDateDisplay(dateStr: string, isEn = false): string {
    if (!dateStr) return '';
    // dateStr: YYYY-MM-DD or ISO
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    const parts = cleanDate.split('-').map(Number)
    if (parts.length < 3 || parts.some(isNaN)) return dateStr;
    const [y, m, d] = parts
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTimeRange(start: string, end: string): string {
    if (!start || !end) return '';
    return `${String(start).slice(0, 5)} – ${String(end).slice(0, 5)}`
}

function getMonthLabel(year: number, month: number, isEn = false): string {
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })
}

function formatPrice(price: number, currency: string, plusVat: boolean, isEn = false): string {
    if (typeof price !== 'number') return '';
    return `${price.toLocaleString(isEn ? 'en-US' : 'tr-TR')} ${currency || ''}${plusVat ? (isEn ? ' + VAT' : ' + KDV') : ''}`
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

function StepIndicator({ current, isEn = false }: { current: Step; isEn?: boolean }) {
    const labels = isEn ? { 1: 'Date', 2: 'Details', 3: 'Confirm' } : { 1: 'Tarih', 2: 'Bilgiler', 3: 'Onay' }
    return (
        <div className="booking-steps">
            {([1, 2, 3] as Step[]).map((n) => (
                <div
                    key={n}
                    className={`booking-step${current === n ? ' active' : ''}${current > n ? ' done' : ''}`}
                >
                    <span className="step-circle">{current > n ? '✓' : n}</span>
                    <span className="step-label">
                        {labels[n]}
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
    const isEn = currentLang === 'en'
    const tt = (tr: string, en: string) => (isEn ? en : tr)
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
                setSlotsError(tt('Müsaitlik bilgisi alınamadı.', 'Could not load availability.'))
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
            setFormError(tt('Ad Soyad ve E-posta alanları zorunludur.', 'Full name and email are required.'))
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
                    : tt('Rezervasyon gönderilemedi. Lütfen tekrar deneyin.', 'Could not submit booking. Please try again.')
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
            setFormError(tt('Ad Soyad ve E-posta alanları zorunludur.', 'Full name and email are required.'))
            return
        }
        if (!leadKvkk) {
            setFormError(tt('Devam etmek için KVKK onayı gereklidir.', 'You must accept the privacy consent to continue.'))
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
            setFormError(err instanceof Error ? err.message : tt('Başvuru gönderilemedi. Lütfen tekrar deneyin.', 'Could not submit application. Please try again.'))
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
                        {isLeadForm ? service.title : (step === 3 ? tt('Rezervasyon Onayı', 'Booking Confirmation') : service.title)}
                    </h3>
                    <button
                        className="booking-modal-close"
                        onClick={onClose}
                        aria-label={tt('Kapat', 'Close')}
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
                                <h4 style={{ margin: '0 0 8px' }}>{tt('Başvurunuz Alındı', 'Application Received')}</h4>
                                <p style={{ color: '#475569', lineHeight: 1.6 }}>
                                    {isEn ? (
                                        <><strong>{service.title}</strong> application has been received. Our team will contact you shortly.</>
                                    ) : (
                                        <><strong>{service.title}</strong> başvurunuz/satın alma talebiniz alınmıştır. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</>
                                    )}
                                </p>
                                <button type="button" className="booking-btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
                                    {tt('Kapat', 'Close')}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleLeadSubmit} className="booking-form">
                                <p className="slots-message" style={{ margin: '0 0 6px' }}>
                                    {tt('Bu program aylık olarak yürütülür. Başvuru formunu doldurun, ekibimiz sizinle iletişime geçsin.', 'This program runs on a monthly basis. Fill out the form and our team will get in touch with you.')}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                    <div className="form-group">
                                        <label htmlFor="lf-name">{tt('Ad Soyad', 'Full Name')} <span className="required">*</span></label>
                                        <input id="lf-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lf-company">{tt('Şirket', 'Company')}</label>
                                        <input id="lf-company" type="text" value={company} onChange={e => setCompany(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lf-position">{tt('Pozisyon', 'Position')}</label>
                                        <input id="lf-position" type="text" value={leadPosition} onChange={e => setLeadPosition(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lf-website">{tt('Şirket Web Sitesi', 'Company Website')}</label>
                                        <input id="lf-website" type="text" value={leadWebsite} onChange={e => setLeadWebsite(e.target.value)} placeholder="ornek.com" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lf-email">{tt('E-posta', 'Email')} <span className="required">*</span></label>
                                        <input id="lf-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lf-phone">{tt('Telefon', 'Phone')}</label>
                                        <input id="lf-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lf-needs">{tt('İhtiyaç / Beklenti', 'Needs / Expectations')}</label>
                                    <textarea id="lf-needs" rows={3} value={leadNeeds} onChange={e => setLeadNeeds(e.target.value)} placeholder={tt('Aradığınız desteği kısaca anlatın...', 'Briefly describe the support you are looking for...')} />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={leadKvkk} onChange={e => setLeadKvkk(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
                                    <span>{tt('Kişisel verilerimin KVKK kapsamında işlenmesini onaylıyorum.', 'I consent to the processing of my personal data under the privacy policy.')} <span className="required">*</span></span>
                                </label>
                                {formError && <p className="form-error">{formError}</p>}
                                <button type="submit" className="booking-btn-primary" disabled={submitting} style={{ marginTop: 6, width: '100%' }}>
                                    {submitting ? tt('Gönderiliyor...', 'Submitting...') : tt('Başvuruyu Gönder', 'Submit Application')}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {!isLeadForm && <StepIndicator current={step} isEn={isEn} />}

                {/* ── Step 1: Calendar ──────────────────────────────────── */}
                {!isLeadForm && step === 1 && (
                    <div className="booking-step-content" key="step-1">
                        <div className="calendar-nav">
                            <button type="button" className="cal-nav-btn" onClick={handlePrevMonth} aria-label={tt('Önceki ay', 'Previous month')}>‹</button>
                            <span className="calendar-month-label">{getMonthLabel(year, month, isEn)}</span>
                            <button type="button" className="cal-nav-btn" onClick={handleNextMonth} aria-label={tt('Sonraki ay', 'Next month')}>›</button>
                        </div>

                        {slotsLoading && <p className="slots-message">{tt('Müsaitlik durumu yükleniyor...', 'Loading availability...')}</p>}
                        {slotsError && <p className="slots-message error">{slotsError}</p>}

                        {!slotsLoading && !slotsError && (
                            <>
                                {availableDates.length > 0 ? (
                                    <div className="calendar-container">
                                        <div className="calendar-weekdays">
                                            {(isEn ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : ['Pt', 'Sa', 'Çr', 'Pr', 'Cu', 'Ct', 'Pz']).map((d, i) => <span key={i}>{d}</span>)}
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
                                        <p>{tt('Seçili ay için uygun randevu bulunamadı.', 'No available appointments for the selected month.')}</p>
                                        <button type="button" className="booking-btn-secondary" onClick={handleContinueToForm}>{tt('Tarih Seçmeden Devam Et', 'Continue Without Selecting a Date')}</button>
                                    </div>
                                )}

                                {selectedDate && slotsByDate[selectedDate] && (
                                    <div className="time-slots-section animate-fade-in">
                                        <p className="time-slots-label">{formatDateDisplay(selectedDate, isEn)} — {bookingType === 'fixed_day' ? tt('Blok Seçin', 'Select Block') : tt('Saat Seçin', 'Select Time')}:</p>
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
                                        {!selectedDate ? tt('Lütfen Tarih Seçin', 'Please Select a Date') : (slotsByDate[selectedDate] && !selectedSlot) ? tt('Lütfen Saat Seçin', 'Please Select a Time') : tt('Devam Et', 'Continue')}
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
                                <span className="booking-summary-label">{tt('Hizmet', 'Service')}</span>
                                <span className="booking-summary-value">{service.title}</span>
                            </div>
                            <div className="booking-summary-price">
                                {formatPrice(service.price, service.currency, service.plus_vat, isEn)}
                            </div>
                            {selectedSlot && selectedDate && (
                                <div className="booking-summary-slot">
                                    <span>📅 {formatDateDisplay(selectedDate, isEn)}</span>
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
                                    {tt('Ad Soyad', 'Full Name')} <span className="required">*</span>
                                </label>
                                <input
                                    id="bm-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={tt('Adınız Soyadınız', 'Your Full Name')}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-email">
                                    {tt('E-posta', 'Email')} <span className="required">*</span>
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
                                <label htmlFor="bm-phone">{tt('Telefon', 'Phone')}</label>
                                <input
                                    id="bm-phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+90 5xx xxx xx xx"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-company">{tt('Şirket', 'Company')}</label>
                                <input
                                    id="bm-company"
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder={tt('Şirket adı', 'Company name')}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-topic">{tt('Danışmanlık Konusu', 'Consulting Topic')}</label>
                                <textarea
                                    id="bm-topic"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={tt('Danışmanlık almak istediğiniz konuyu kısaca açıklayın...', 'Briefly describe the topic you would like consulting on...')}
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
                                    ← {tt('Geri', 'Back')}
                                </button>
                                <button
                                    type="submit"
                                    className="booking-btn-primary"
                                    disabled={submitting || !allPoliciesOk}
                                >
                                    {submitting ? tt('Gönderiliyor...', 'Submitting...') : tt('Rezervasyon Talebi Gönder', 'Submit Booking Request')}
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
                                ? tt('Executive Strategy Day Rezervasyonunuz Oluşturuldu!', 'Your Executive Strategy Day Booking Is Created!')
                                : tt('Randevunuz Oluşturuldu!', 'Your Appointment Is Created!')}
                        </h4>
                        {bookingId && (
                            <p className="confirmation-id">
                                {tt('Rezervasyon No', 'Booking No')}: #{bookingId}
                            </p>
                        )}
                        <div className="confirmation-summary">
                            <div className="confirmation-row">
                                <span className="conf-label">{tt('Hizmet', 'Service')}</span>
                                <span className="conf-value">{service.title}</span>
                            </div>
                            {selectedSlot && selectedDate && (
                                <>
                                    <div className="confirmation-row">
                                        <span className="conf-label">{tt('Tarih', 'Date')}</span>
                                        <span className="conf-value">
                                            {formatDateDisplay(selectedDate, isEn)}
                                        </span>
                                    </div>
                                    <div className="confirmation-row">
                                        <span className="conf-label">{tt('Saat', 'Time')}</span>
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
                                    <span className="conf-label">{tt('İsim', 'Name')}</span>
                                    <span className="conf-value">{name}</span>
                                </div>
                            )}
                            {email && (
                                <div className="confirmation-row">
                                    <span className="conf-label">{tt('E-posta', 'Email')}</span>
                                    <span className="conf-value">{email}</span>
                                </div>
                            )}
                        </div>
                        <div className="confirmation-price-box">
                            <span className="conf-price-label">{tt('Ödenecek Tutar', 'Amount Due')}</span>
                            <span className="conf-price-value">
                                {service.price.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {service.currency}
                                {service.plus_vat && <small> {tt('+ KDV', '+ VAT')}</small>}
                            </span>
                        </div>
                        <p className="confirmation-message">
                            {tt('Ödemeyi tamamlamak için aşağıdaki butona tıklayın.', 'Click the button below to complete your payment.')}
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
                            💳 {tt('Ödeme ile Tamamla', 'Complete with Payment')}
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
                            {tt('Daha Sonra Öde', 'Pay Later')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
