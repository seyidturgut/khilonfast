import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Breadcrumbs from '../components/Breadcrumbs'
import ConsultantBookingModal from '../components/ConsultantBookingModal'
import { useRouteLocale } from '../utils/locale'
import { API_BASE_URL } from '../config/api'
import './ConsultantDetail.css'

interface SubPackage {
    id: number
    title: string
    title_en?: string | null
    description: string
    description_en?: string | null
    scope_items: string | string[]
    scope_items_en?: string | string[] | null
    duration_text: string
    sessions_text: string | null
    price: number
    currency: string
    plus_vat: boolean
    cta_text: string
    cta_text_en?: string | null
    badge_text: string | null
    booking_type?: 'slot' | 'fixed_day' | 'lead_form'
    duration_minutes?: number | null
    fixed_start_time?: string | null
    fixed_end_time?: string | null
}

interface Service {
    id: number
    category: string
    title: string
    title_en?: string | null
    description: string
    description_en?: string | null
    scope_items: string | string[]
    scope_items_en?: string | string[] | null
    duration_text: string
    sessions_text: string | null
    price: number
    currency: string
    plus_vat: boolean
    cta_text: string
    cta_text_en?: string | null
    badge_text: string | null
    sub_packages: SubPackage[]
    booking_type?: 'slot' | 'fixed_day' | 'lead_form'
    duration_minutes?: number | null
    fixed_start_time?: string | null
    fixed_end_time?: string | null
}

interface ConsultantDetail {
    id: number
    slug: string
    name: string
    title: string
    bio: string
    photo_url: string | null
    stars: number
    review_count: number
    sectors: string[]
    services: Service[]
}

const SECTOR_LABELS: Record<string, string> = {
    'fintech': 'FinTech',
    'odeme-sistemleri': 'Ödeme Sistemleri',
    'teknoloji-yazilim': 'Teknoloji / Yazılım',
    'b2b': 'B2B',
    'filo-kiralama': 'Filo Kiralama',
    'enerji': 'Enerji',
    'uretim': 'Üretim',
    'ic-tasarim': 'İç Tasarım',
    'endustriyel-gida': 'Endüstriyel Gıda',
}

const SECTOR_LABELS_EN: Record<string, string> = {
    'fintech': 'FinTech',
    'odeme-sistemleri': 'Payment Systems',
    'teknoloji-yazilim': 'Technology / Software',
    'b2b': 'B2B',
    'filo-kiralama': 'Fleet Leasing',
    'enerji': 'Energy',
    'uretim': 'Manufacturing',
    'ic-tasarim': 'Interior Design',
    'endustriyel-gida': 'Industrial Food',
}

// Locale'e göre sektör etiketi (yoksa TR'ye, o da yoksa slug'a düş).
function sectorLabel(slug: string, isEn: boolean): string {
    if (isEn) return SECTOR_LABELS_EN[slug] || SECTOR_LABELS[slug] || slug;
    return SECTOR_LABELS[slug] || slug;
}

function parseScopeItems(raw: string | string[]): string[] {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed
        } catch {
            // not JSON
        }
        return raw ? [raw] : []
    }
    return []
}

function formatPriceNum(price: number | string): string {
    const num = typeof price === 'string' ? parseFloat(price) : price
    return isNaN(num) ? '0' : num.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
}

function StarRating({ stars }: { stars: number }) {
    return (
        <span className="consultant-stars" aria-label={`${stars} yıldız`}>
            {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < stars ? 'star filled' : 'star empty'}>★</span>
            ))}
        </span>
    )
}

function ConsultantAvatarLarge({ name }: { name: string }) {
    const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    return <div className="consultant-avatar-large">{initials}</div>
}

interface BookingServicePayload {
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

interface ServiceCardProps {
    service: Service | SubPackage
    isSubPackage?: boolean
    isEn: boolean
    onBook: (service: BookingServicePayload) => void
}

function ServiceCard({ service, isSubPackage = false, isEn, onBook }: ServiceCardProps) {
    // EN locale → varsa _en alanını kullan, yoksa TR'ye düş (fallback).
    const title = (isEn && service.title_en) ? service.title_en : service.title
    const description = (isEn && service.description_en) ? service.description_en : service.description
    const scopeItems = parseScopeItems((isEn && service.scope_items_en) ? service.scope_items_en : service.scope_items)
    const ctaText = (isEn && service.cta_text_en) ? service.cta_text_en : service.cta_text

    return (
        <div className={`service-card${isSubPackage ? ' sub-package' : ''}`}>
            <div className="service-card-body">
                {service.badge_text && (
                    <div className="badge-popular">{service.badge_text}</div>
                )}
                <h4 className="service-card-title">{title}</h4>
                {description && (
                    <p className="service-card-desc">{description}</p>
                )}
                {scopeItems.length > 0 && (
                    <ul className="scope-list">
                        {scopeItems.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                )}
                {(service.duration_text || service.sessions_text) && (
                    <div className="service-meta">
                        {service.duration_text && (
                            <span className="service-duration">⏱ {service.duration_text}</span>
                        )}
                        {service.sessions_text && (
                            <span className="service-sessions">{service.sessions_text}</span>
                        )}
                    </div>
                )}
            </div>
            <div className="service-card-footer">
                <div className="service-price">
                    <span className="price-amount">{formatPriceNum(service.price)}</span>
                    <span className="price-currency"> {service.currency}</span>
                    {service.plus_vat && <span className="price-vat"> + KDV</span>}
                </div>
                <button
                    className="service-cta-btn"
                    onClick={() => onBook({
                        id: service.id,
                        title: title,
                        price: service.price,
                        currency: service.currency,
                        plus_vat: service.plus_vat,
                        cta_text: ctaText,
                        booking_type: service.booking_type,
                        duration_minutes: service.duration_minutes,
                        fixed_start_time: service.fixed_start_time,
                        fixed_end_time: service.fixed_end_time
                    })}
                >
                    {ctaText || (isEn ? 'Book Now' : 'Rezervasyon Yap')}
                </button>
            </div>
        </div>
    )
}

export default function ConsultantDetail() {
    const { slug } = useParams<{ slug: string }>()
    useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const langPrefix = isEn ? '/en' : ''

    const [consultant, setConsultant] = useState<ConsultantDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedService, setSelectedService] = useState<BookingServicePayload | null>(null)

    useEffect(() => {
        if (!slug) return
        setLoading(true)
        setError(null)
        fetch(`${API_BASE_URL}/consultants/${encodeURIComponent(slug)}?lang=${isEn ? 'en' : 'tr'}`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((data) => {
                const c = data.consultant ?? null;
                setConsultant(c);
                if (c) {
                    document.title = `${c.name} | khilonfast`;
                }
            })
            .catch(() => setError(isEn ? 'Could not load consultant profile.' : 'Danışman profili yüklenemedi.'))
            .finally(() => setLoading(false))
    }, [slug, isEn])

    const handleBook = (service: BookingServicePayload) => {
        setSelectedService(service)
        setModalOpen(true)
    }

    const consultantsBasePath = isEn ? '/en/consultants' : '/danismanlar'

    if (loading) {
        return (
            <div className="page-container consultant-detail-page">
                <div className="consultant-detail-loading">
                    <span>{isEn ? 'Loading...' : 'Yükleniyor...'}</span>
                </div>
            </div>
        )
    }

    if (error || !consultant) {
        return (
            <div className="page-container consultant-detail-page">
                <div className="consultant-detail-error">
                    <p>{error ?? (isEn ? 'Consultant not found.' : 'Danışman bulunamadı.')}</p>
                </div>
            </div>
        )
    }

    const breadcrumbItems = [
        { label: isEn ? 'Consultants' : 'Danışmanlar', path: consultantsBasePath },
        { label: consultant.name }
    ]

    const sectors = Array.isArray(consultant.sectors)
        ? consultant.sectors
        : (typeof consultant.sectors === 'string' ? JSON.parse(consultant.sectors) : [])

    const hizliServices = consultant.services.filter((s) => s.category === 'hizli')
    const stratejiServices = consultant.services.filter((s) => s.category === 'strateji')
    const ustDuzeyServices = consultant.services.filter((s) => s.category === 'ust_duzey')

    const DISCLAIMER_TR = 'Danışmanlık hizmetinin İstanbul dışında gerçekleştirilmesi halinde ulaşım, konaklama ve diğer seyahat giderleri danışmanlık ücretine dahil değildir. Bu giderler danışmanlık öncesinde danışana bildirilir ve karşı taraf tarafından doğrudan karşılanır veya danışmanlık öncesinde ayrıca faturalandırılarak tahsil edilir. Seyahat süresinin danışmanlık hizmetine ek zaman gerektirmesi durumunda, gerekli görülmesi halinde ek danışmanlık günü planlanabilir ve bu süre ayrıca ücretlendirilir.'
    const DISCLAIMER_EN = 'Travel, accommodation, and other travel expenses are not included in the consulting fee if the service is conducted outside Istanbul. These expenses are communicated to the consultant before the engagement and are either covered directly by the client or invoiced separately prior to the consulting session. If travel time requires additional time beyond the consulting service, additional consulting days may be scheduled if deemed necessary and will be charged separately.'

    return (
        <div className="page-container consultant-detail-page">
            {/* Hero */}
            <section className="consultant-hero">
                <Breadcrumbs items={breadcrumbItems} homePath={langPrefix + '/'} />
                <div className="container">
                    <div className="consultant-hero-inner">
                        {/* Info — left */}
                        <div className="consultant-hero-info">
                            <div className="consultant-hero-badge">
                                {isEn ? '✦ Expert Consultant' : '✦ Uzman Danışman'}
                            </div>
                            <h1 className="consultant-hero-name">{consultant.name}</h1>
                            <p className="consultant-hero-title">{consultant.title}</p>
                            <div className="consultant-hero-rating">
                                <StarRating stars={consultant.stars} />
                                {consultant.review_count > 0 && (
                                    <span className="consultant-review-count">
                                        {consultant.review_count} {isEn ? 'reviews' : 'değerlendirme'}
                                    </span>
                                )}
                            </div>
                            {sectors.length > 0 && (
                                <div className="consultant-hero-sectors">
                                    {sectors.map((s: string) => (
                                        <span key={s} className="sector-tag">
                                            {sectorLabel(s, isEn)}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {consultant.bio && (
                                <p className="consultant-hero-bio">{consultant.bio}</p>
                            )}
                        </div>

                        {/* Photo — right */}
                        <div className="consultant-hero-photo-wrap">
                            <div className="consultant-hero-photo-ring">
                                {consultant.photo_url ? (
                                    <img
                                        src={consultant.photo_url}
                                        alt={consultant.name}
                                        className="consultant-hero-photo"
                                        width={480}
                                        height={480}
                                        loading="eager"
                                        decoding="async"
                                        onError={(e) => {
                                            const target = e.currentTarget
                                            target.style.display = 'none'
                                            const fallback = target.nextElementSibling as HTMLElement | null
                                            if (fallback) fallback.style.display = 'flex'
                                        }}
                                        onLoad={(e) => {
                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                                            if (fallback) fallback.style.display = 'none'
                                        }}
                                    />
                                ) : null}
                                <ConsultantAvatarLarge name={consultant.name} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section className="consultant-services">
                <div className="container">
                    {/* Category 1 */}
                    {hizliServices.length > 0 && (
                        <div className="service-category">
                            <div className="service-category-header">
                                <div className="category-number">1</div>
                                <h2 className="service-category-title">
                                    {isEn ? 'Quick Consultations' : 'Hızlı Danışmanlıklar'}
                                </h2>
                            </div>
                            <div className="service-cards-grid two-col">
                                {hizliServices.map((service) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        isEn={isEn}
                                        onBook={handleBook}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category 2 */}
                    {stratejiServices.length > 0 && (
                        <div className="service-category">
                            <div className="service-category-header">
                                <div className="category-number">2</div>
                                <h2 className="service-category-title">
                                    {isEn ? 'Strategy Workshops' : 'Strateji Çalışmaları'}
                                </h2>
                            </div>
                            <div className="service-cards-grid">
                                {stratejiServices.map((service) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        isEn={isEn}
                                        onBook={handleBook}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category 3 */}
                    {ustDuzeyServices.length > 0 && (
                        <div className="service-category">
                            <div className="service-category-header">
                                <div className="category-number">3</div>
                                <h2 className="service-category-title">
                                    {isEn ? 'Senior Consulting' : 'Üst Düzey Danışmanlık'}
                                </h2>
                            </div>
                            {ustDuzeyServices.map((service) => {
                                // EN locale → varsa _en, yoksa TR fallback.
                                const sTitle = (isEn && service.title_en) ? service.title_en : service.title
                                const sDesc = (isEn && service.description_en) ? service.description_en : service.description
                                const sCta = (isEn && service.cta_text_en) ? service.cta_text_en : service.cta_text
                                const scopeItems = parseScopeItems((isEn && service.scope_items_en) ? service.scope_items_en : service.scope_items)
                                const hasSubPackages = service.sub_packages && service.sub_packages.length > 0
                                return (
                                    <div key={service.id} className="ust-duzey-block">
                                        <div className="ust-duzey-parent">
                                            {service.badge_text && (
                                                <div className="badge-popular">{service.badge_text}</div>
                                            )}
                                            <h3 className="ust-duzey-title">{sTitle}</h3>
                                            {sDesc && (
                                                <p className="ust-duzey-desc">{sDesc}</p>
                                            )}
                                            {scopeItems.length > 0 && (
                                                <ul className="scope-list">
                                                    {scopeItems.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {service.duration_text && (
                                                <div className="service-meta" style={{ marginTop: '1rem' }}>
                                                    <span className="service-duration">⏱ {service.duration_text}</span>
                                                </div>
                                            )}
                                        </div>

                                        {hasSubPackages ? (
                                            <div className="sub-packages-wrap">
                                                <div className="sub-packages-grid">
                                                    {service.sub_packages.map((pkg) => (
                                                        <ServiceCard
                                                            key={pkg.id}
                                                            service={pkg}
                                                            isSubPackage
                                                            isEn={isEn}
                                                            onBook={handleBook}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="ust-duzey-cta-row">
                                                <div className="service-price">
                                                    <span className="price-amount">{formatPriceNum(service.price)}</span>
                                                    <span className="price-currency"> {service.currency}</span>
                                                    {service.plus_vat && <span className="price-vat"> + KDV</span>}
                                                </div>
                                                <button
                                                    className="service-cta-btn"
                                                    onClick={() => handleBook({
                                                        id: service.id,
                                                        title: sTitle,
                                                        price: service.price,
                                                        currency: service.currency,
                                                        plus_vat: service.plus_vat,
                                                        cta_text: sCta,
                                                        booking_type: service.booking_type,
                                                        duration_minutes: service.duration_minutes,
                                                        fixed_start_time: service.fixed_start_time,
                                                        fixed_end_time: service.fixed_end_time
                                                    })}
                                                >
                                                    {sCta || (isEn ? 'Book Now' : 'Rezervasyon Yap')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="disclaimer-box">
                        <p>{isEn ? DISCLAIMER_EN : DISCLAIMER_TR}</p>
                    </div>
                </div>
            </section>

            {selectedService && (
                <ConsultantBookingModal
                    isOpen={modalOpen}
                    onClose={() => { setModalOpen(false); setSelectedService(null) }}
                    consultant={{ slug: consultant.slug, name: consultant.name }}
                    service={selectedService}
                />
            )}
        </div>
    )
}
