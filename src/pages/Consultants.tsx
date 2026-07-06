import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HiBriefcase, HiArrowRight } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import Breadcrumbs from '../components/Breadcrumbs'
import { useRouteLocale } from '../utils/locale'
import { API_BASE_URL } from '../config/api'
import FAQ from '../components/FAQ'
import AiAnswerBox from '../components/AiAnswerBox'
import './Consultants.css'

const CONSULTANTS_AI_ANSWER_TR = {
    question: 'khilonfast danışmanları kimlerdir?',
    answer: 'B2B SaaS, fintech, üretim, enerji, ödeme sistemleri gibi sektörlerden gelen kıdemli pazarlama uzmanlarıdır. Her danışman, sektöre özel büyüme stratejisi kurmak ve uygulamak için işletmenizle birebir online çalışır.'
};

const CONSULTANTS_AI_ANSWER_EN = {
    question: 'Who are khilonfast consultants?',
    answer: 'They are senior marketing experts from sectors such as B2B SaaS, fintech, manufacturing, energy, and payment systems. Each consultant works one-on-one online with your business to build and execute a sector-specific growth strategy.'
};

const CONSULTANTS_FAQS_TR = [
    {
        question: 'khilonfast danışmanları kimlerdir?',
        answer: 'Sektör deneyimi olan, B2B pazarlama ve büyüme stratejisi konusunda uzmanlaşmış danışmanlardan oluşur. Her danışmanın profilinde sektör odağı, uzmanlık alanı ve müşteri değerlendirmeleri yer alır.'
    },
    {
        question: 'Danışmanlık seansı nasıl planlanır?',
        answer: 'İlgilendiğiniz danışmanın profilinden uygun bir zaman dilimi seçip online olarak randevu oluşturabilirsiniz. Onay sonrası takvim daveti ve görüşme detayları e-posta ile iletilir.'
    },
    {
        question: 'Danışmanlık seansları online mu yapılıyor?',
        answer: 'Evet, tüm danışmanlık görüşmeleri video konferans üzerinden online olarak gerçekleştirilir; coğrafi kısıtlama olmadan istediğiniz danışmanla çalışabilirsiniz.'
    },
    {
        question: 'Hangi danışmanı seçeceğimi nasıl bilirim?',
        answer: 'Danışman profillerinde belirtilen sektör uzmanlığı ve deneyim alanına göre seçim yapabilir, ihtiyacınıza en uygun eşleşme için bizimle iletişime geçebilirsiniz.'
    }
]

const CONSULTANTS_FAQS_EN = [
    {
        question: 'Who are khilonfast consultants?',
        answer: 'Our consultants have real industry experience and specialize in B2B marketing and growth strategy. Each profile lists their sector focus, expertise areas, and client reviews.'
    },
    {
        question: 'How do I schedule a consulting session?',
        answer: "Pick an available time slot from the consultant's profile and book online. After confirmation, you'll receive a calendar invite and meeting details by email."
    },
    {
        question: 'Are consulting sessions held online?',
        answer: 'Yes, all consulting sessions are conducted online via video call, so you can work with any consultant regardless of location.'
    },
    {
        question: 'How do I know which consultant to choose?',
        answer: "You can choose based on the sector expertise and experience listed on each profile, or contact us for help finding the best match for your needs."
    }
]

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
        const langParam = `lang=${isEn ? 'en' : 'tr'}`
        const url = sektor
            ? `${API_BASE_URL}/consultants?sektor=${encodeURIComponent(sektor)}&${langParam}`
            : `${API_BASE_URL}/consultants?${langParam}`
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

            <AiAnswerBox {...(isEn ? CONSULTANTS_AI_ANSWER_EN : CONSULTANTS_AI_ANSWER_TR)} />

            <section className="consultants-intro" style={{ padding: '32px 0 8px' }}>
                <div className="container" style={{ maxWidth: 1080 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, fontSize: '0.98rem', lineHeight: 1.7, color: '#334155' }}>
                        {isEn ? (
                            <>
                                <p>
                                    <strong>Khilonfast consulting</strong> is a hands-on, sector-focused growth program where a senior CMO and category specialists work directly inside your team. We don't deliver generic slide decks — we build an executable growth roadmap, prioritize the highest-impact channels, and operationalize measurement so every decision is backed by data.
                                </p>
                                <p>
                                    Our consultants come from B2B SaaS, fintech, manufacturing, energy, payment systems, fleet rental, corporate interior design, industrial food, gift card, and corporate fuel sectors. Each program is tailored to your buyer journey, sales cycle, and account-based marketing needs. Whether you are launching a new product, restructuring marketing operations, or scaling demand generation, we plug in alongside your team for measurable outcomes.
                                </p>
                                <p>
                                    A typical engagement covers <strong>positioning &amp; ICP definition</strong>, <strong>integrated channel strategy</strong> (SEO, content, paid media, lifecycle email), <strong>MQL/SQL conversion frameworks</strong>, <strong>sales &amp; marketing alignment</strong>, and <strong>weekly KPI cadence</strong>. The goal is simple: a marketing function that compounds value every quarter.
                                </p>
                                <p>
                                    Pick a consultant by sector below, review their expertise and case background, and book an introductory session. We typically respond within one business day.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    <strong>Khilonfast danışmanlığı</strong>, kıdemli bir CMO ve sektör uzmanlarının ekibinizin içinde, uygulamalı çalıştığı bir büyüme programıdır. Genel sunumlar yerine; uygulanabilir bir büyüme yol haritası kurar, en yüksek etkili kanalları önceliklendirir ve her kararı veriyle destekleyecek ölçümleme altyapısını birlikte hayata geçiririz.
                                </p>
                                <p>
                                    Danışmanlarımız B2B SaaS, FinTech, üretim, enerji, ödeme sistemleri, filo kiralama, ofis &amp; kurumsal iç tasarım, endüstriyel gıda, kurumsal hediye kartı ve kurumsal akaryakıt sektörlerinden geliyor. Her program; alıcı yolculuğunuza, satış döngünüze ve hedef hesap (ABM) ihtiyaçlarınıza özel tasarlanır. Yeni ürün lansmanı, pazarlama operasyonu yeniden yapılandırması veya talep yaratma (demand generation) ölçeklendirmesi olsun, ekibinizle yan yana çalışırız.
                                </p>
                                <p>
                                    Tipik bir danışmanlık programı <strong>konumlanma ve ICP tanımı</strong>, <strong>bütünleşik kanal stratejisi</strong> (SEO, içerik, performans reklamları, yaşam döngüsü e-postası), <strong>MQL/SQL dönüşüm çerçeveleri</strong>, <strong>satış–pazarlama uyumu</strong> ve <strong>haftalık KPI takibi</strong> başlıklarını kapsar. Amaç net: her çeyrek katlanan değer üreten bir pazarlama fonksiyonu.
                                </p>
                                <p>
                                    Aşağıdan sektörünüze uygun bir danışman seçin, uzmanlık alanlarını ve referans deneyimini inceleyin ve tanışma görüşmesi planlayın. Genellikle bir iş günü içinde geri dönüş yaparız.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="consultants-list">
                <div className="container">
                    <h2 style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                        {isEn ? 'Our Expert Consultants' : 'Uzman Danışmanlarımız'}
                    </h2>
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
                                                width={240}
                                                height={240}
                                                loading="lazy"
                                                decoding="async"
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

            <FAQ items={isEn ? CONSULTANTS_FAQS_EN : CONSULTANTS_FAQS_TR} />
        </div>
    )
}
