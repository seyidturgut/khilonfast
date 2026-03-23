import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HiBriefcase, HiArrowRight } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import Breadcrumbs from '../components/Breadcrumbs'
import { useRouteLocale } from '../utils/locale'
import { API_BASE_URL } from '../config/api'
import './Consultants.css'

interface Consultant {
    id: number
    slug: string
    name: string
    title: string
    bio: string
    photo_url: string | null
    stars: number
    review_count: number
    sectors: string[]
}

function StarRating({ stars }: { stars: number }) {
    return (
        <span className="consultant-stars" aria-label={`${stars} yıldız`}>
            {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < stars ? 'star filled' : 'star empty'}>
                    ★
                </span>
            ))}
        </span>
    )
}

function ConsultantAvatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    return <div className="consultant-avatar-fallback">{initials}</div>
}

export default function Consultants() {
    useTranslation('common')
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const langPrefix = isEn ? '/en' : ''
    const [searchParams] = useSearchParams()
    const sektor = searchParams.get('sektor') ?? ''

    const [consultants, setConsultants] = useState<Consultant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        const url = sektor
            ? `${API_BASE_URL}/consultants?sektor=${encodeURIComponent(sektor)}`
            : `${API_BASE_URL}/consultants`
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((data) => {
                setConsultants(data.consultants ?? [])
            })
            .catch(() => {
                setError(
                    isEn
                        ? 'Could not load consultants. Please try again later.'
                        : 'Danışmanlar yüklenemedi. Lütfen daha sonra tekrar deneyin.'
                )
            })
            .finally(() => setLoading(false))
    }, [sektor, isEn])

    const consultantsBasePath = isEn ? '/en/consultants' : '/danismanlar'

    const breadcrumbItems = [
        {
            label: isEn ? 'Consultants' : 'Danışmanlar'
        }
    ]

    return (
        <div className="page-container consultants-page">
            <section className="consultants-hero">
                <Breadcrumbs items={breadcrumbItems} homePath={langPrefix + '/'} />
                <div className="container consultants-hero-inner">
                    <div className="consultants-badge">
                        <HiBriefcase />
                        <span>khilonfast Danışmanlık</span>
                    </div>
                    <h1>
                        {isEn ? 'Our Expert Consultants' : 'Uzman Danışmanlarımız'}
                    </h1>
                    <p>
                        {isEn
                            ? 'Find the right expert for sector-specific growth strategy and marketing consultancy.'
                            : 'Sektörünüze özel büyüme stratejisi ve pazarlama danışmanlığı için doğru uzmanı bulun.'}
                    </p>
                </div>
            </section>

            <section className="consultants-list">
                <div className="container">
                    {loading && (
                        <div className="consultants-loading">
                            <span>{isEn ? 'Loading...' : 'Yükleniyor...'}</span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="consultants-error">
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && consultants.length === 0 && (
                        <div className="consultants-empty">
                            <p>
                                {isEn
                                    ? 'No consultants found for this sector yet.'
                                    : 'Bu sektör için henüz danışman bulunamadı.'}
                            </p>
                        </div>
                    )}

                    {!loading && !error && consultants.length > 0 && (
                        <div className="consultants-grid">
                            {consultants.map((consultant) => (
                                <article key={consultant.id} className="consultant-card">
                                    <div className="consultant-card-photo-wrap">
                                        {consultant.photo_url ? (
                                            <img
                                                src={consultant.photo_url}
                                                alt={consultant.name}
                                                className="consultant-photo"
                                                onError={(e) => {
                                                    const target = e.currentTarget
                                                    target.style.display = 'none'
                                                    const fallback =
                                                        target.nextElementSibling as HTMLElement | null
                                                    if (fallback) fallback.style.display = 'flex'
                                                }}
                                            />
                                        ) : null}
                                        <ConsultantAvatar name={consultant.name} />
                                    </div>
                                    <div className="consultant-card-content">
                                        <h3 className="consultant-name">{consultant.name}</h3>
                                        <p className="consultant-title">{consultant.title}</p>
                                        <div className="consultant-rating">
                                            <StarRating stars={consultant.stars} />
                                            {consultant.review_count > 0 && (
                                                <span className="consultant-review-count">
                                                    ({consultant.review_count})
                                                </span>
                                            )}
                                        </div>
                                        <p className="consultant-bio">{consultant.bio}</p>
                                        <Link
                                            to={`${consultantsBasePath}/${consultant.slug}`}
                                            className="consultant-cta"
                                        >
                                            {isEn ? 'View Profile' : 'Profili İncele'}
                                            <HiArrowRight />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
