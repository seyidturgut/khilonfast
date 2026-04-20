import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { HiLockClosed, HiPlay, HiDocumentText, HiCheckCircle, HiMenuAlt3, HiChevronLeft } from 'react-icons/hi'

interface PurchasedContent {
    subscription_status: 'active' | 'expired' | 'cancelled'
    product_key: string
}

interface Lesson {
    id: number
    title_tr: string
    title_en: string
    description_tr: string
    description_en: string
    vimeo_url_tr: string
    vimeo_url_en: string
    pdf_url: string
    order_index: number
    duration_label: string
}

interface TrainingConfig {
    id: number
    slug: string
    product_key: string
    title_tr: string
    title_en: string
    description_tr: string
    description_en: string
    vimeo_url_tr: string
    vimeo_url_en: string
    canva_url_tr: string
    canva_url_en: string
    pdf_url: string
    lessons: Lesson[]
}

const HEARTBEAT_INTERVAL_MS = 30_000

function extractSrc(input: string): string {
    if (!input) return ''
    const match = input.match(/src=['"]([^'"]+)['"]/)
    return match ? match[1] : input.trim()
}

function vimeoEmbedUrl(raw: string): string {
    if (!raw) return ''
    const src = extractSrc(raw)
    // Already a player URL
    if (src.includes('player.vimeo.com')) return src
    // Extract video ID from vimeo.com/XXXXXXX
    const m = src.match(/vimeo\.com\/(\d+)/)
    if (m) return `https://player.vimeo.com/video/${m[1]}?badge=0&autopause=0&player_id=0&app_id=58479`
    return src
}

export default function TrainingContentPage() {
    const { slug } = useParams<{ slug: string }>()
    const { user } = useAuth()
    const navigate = useNavigate()
    const API_BASE = API_BASE_URL
    const isEn = window.location.pathname.startsWith('/en/')

    const [config, setConfig] = useState<TrainingConfig | null | 'not_found'>(null)
    const [hasAccess, setHasAccess] = useState<boolean | null>(null)
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
    const [completedIds, setCompletedIds] = useState<Set<number>>(new Set())
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const secondsRef = useRef(0)
    const lastHeartbeatRef = useRef(Date.now())
    const pageVisibleRef = useRef(true)
    const activeLessonRef = useRef<Lesson | null>(null)

    useEffect(() => { activeLessonRef.current = activeLesson }, [activeLesson])

    // Auth guard
    useEffect(() => {
        if (!user) navigate('/giris')
    }, [user, navigate])

    // Fetch config (lessons dahil)
    useEffect(() => {
        if (!slug) return
        fetch(`${API_BASE}/training-analytics/config/${encodeURIComponent(slug)}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) { setConfig('not_found'); return }
                setConfig(data)
                if (data.lessons?.length > 0) {
                    setActiveLesson(data.lessons[0])
                }
            })
            .catch(() => setConfig('not_found'))
    }, [slug, API_BASE])

    // Subscription check
    useEffect(() => {
        if (!user || !config || config === 'not_found') return
        const token = localStorage.getItem('token')
        fetch(`${API_BASE}/profile/contents`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const contents: PurchasedContent[] = Array.isArray(data?.contents) ? data.contents : []
                setHasAccess(!!contents.find(c => c.product_key === (config as TrainingConfig).product_key && c.subscription_status === 'active'))
            })
            .catch(() => setHasAccess(false))
    }, [user, config, API_BASE])

    // Heartbeat (lesson_id destekli)
    useEffect(() => {
        if (!hasAccess || !config || config === 'not_found') return
        const onVisibility = () => { pageVisibleRef.current = !document.hidden }
        document.addEventListener('visibilitychange', onVisibility)

        const sendBeat = (delta: number) => {
            if (delta <= 0) return
            const token = localStorage.getItem('token')
            const body: Record<string, unknown> = {
                product_key: (config as TrainingConfig).product_key,
                seconds_delta: delta
            }
            if (activeLessonRef.current) body.lesson_id = activeLessonRef.current.id
            fetch(`${API_BASE}/training-analytics/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            }).catch(() => {})
        }

        const tick = setInterval(() => {
            if (pageVisibleRef.current) secondsRef.current += 5
            if (Date.now() - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS) {
                const delta = secondsRef.current
                secondsRef.current = 0
                lastHeartbeatRef.current = Date.now()
                sendBeat(delta)
            }
        }, 5_000)

        return () => {
            clearInterval(tick)
            document.removeEventListener('visibilitychange', onVisibility)
            sendBeat(secondsRef.current)
        }
    }, [hasAccess, config, API_BASE])

    useEffect(() => {
        if (config && config !== 'not_found') {
            document.title = isEn ? config.title_en : config.title_tr
        }
    }, [config, isEn])

    if (config === 'not_found') {
        return (
            <div style={{ padding: '120px 24px', textAlign: 'center' }}>
                <h1 style={{ color: '#1a3a52' }}>Eğitim bulunamadı</h1>
                <Link to="/egitimler" style={{ color: '#2563eb' }}>Tüm eğitimlere dön</Link>
            </div>
        )
    }

    if (config === null || hasAccess === null) {
        return <div style={{ padding: '120px 24px', textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</div>
    }

    const title = isEn ? config.title_en : config.title_tr
    const description = isEn ? config.description_en : config.description_tr
    const lessons = config.lessons || []
    const hasLessons = lessons.length > 0

    if (!hasAccess) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#f8fafc' }}>
                <div style={{ maxWidth: '460px', textAlign: 'center', background: 'white', borderRadius: '20px', padding: '48px 40px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '26px', color: '#9ca3af' }}>
                        <HiLockClosed />
                    </div>
                    <h2 style={{ color: '#1a3a52', fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>
                        {isEn ? 'You do not have access to this training' : 'Bu eğitime erişiminiz yok'}
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '28px', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        {isEn ? 'You need to purchase this training to view the content.' : 'İçeriği görüntülemek için önce satın almanız gerekiyor.'}
                    </p>
                    <Link to={`/egitimler/${config.slug}`} style={{ display: 'inline-block', background: '#1a3a52', color: 'white', padding: '13px 32px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                        {isEn ? 'Buy Training' : 'Eğitimi Satın Al'}
                    </Link>
                </div>
            </div>
        )
    }

    // ── Udemy-tarzı multi-lesson layout ─────────────────────────────────────
    if (hasLessons) {
        const activeLessonTitle = activeLesson ? (isEn ? (activeLesson.title_en || activeLesson.title_tr) : activeLesson.title_tr) : ''
        const activeVideoUrl = activeLesson ? vimeoEmbedUrl(isEn ? (activeLesson.vimeo_url_en || activeLesson.vimeo_url_tr) : activeLesson.vimeo_url_tr) : ''
        // PDF eğitim seviyesinde — tüm dersler için aynı
        const trainingPdf = config.pdf_url || null

        const selectLesson = (lesson: Lesson) => {
            setActiveLesson(lesson)
            setSidebarOpen(false)
            // slides panel removed
            // Ders seçilince tamamlandı sayılır
            if (!completedIds.has(lesson.id)) {
                // Sadece önceki dersi tamamlandı işaretle
                if (activeLesson && activeLesson.id !== lesson.id) {
                    setCompletedIds(prev => new Set([...prev, activeLesson.id]))
                }
            }
        }

        return (
            <div style={{ minHeight: '100vh', background: '#0f1117' }}>
                {/* Top bar */}
                <div style={{ background: '#1a1f2e', borderBottom: '1px solid #2d3748', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'sticky', top: 0, zIndex: 50 }}>
                    {/* Logo */}
                    <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            <span style={{ color: '#e5e7eb' }}>khilon</span><span style={{ color: '#facc15' }}>fast</span>
                        </span>
                    </Link>
                    <div style={{ width: '1px', height: '16px', background: '#374151' }} />
                    {/* Geri */}
                    <Link to="/hesabim" style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500, flexShrink: 0 }}>
                        <HiChevronLeft style={{ fontSize: '1rem' }} />
                        {isEn ? 'My Account' : 'Hesabım'}
                    </Link>
                    <div style={{ width: '1px', height: '16px', background: '#374151' }} />
                    {/* Eğitim başlığı */}
                    <h1 style={{ fontSize: '0.88rem', color: '#e5e7eb', fontWeight: 600, margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {title}
                    </h1>
                    <span style={{ background: '#16a34a22', color: '#4ade80', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                        ✓ {isEn ? 'Active' : 'Aktif'}
                    </span>
                    {/* Mobile: dersler butonu */}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'none', alignItems: 'center', gap: '6px', background: '#374151', color: '#e5e7eb', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                            ['@media (max-width: 768px)' as any]: { display: 'flex' }
                        }}
                        className="lesson-sidebar-toggle">
                        <HiMenuAlt3 /> {isEn ? 'Lessons' : 'Dersler'}
                    </button>
                </div>

                {/* Main layout */}
                <div style={{ display: 'flex', height: 'calc(100vh - 53px)', overflow: 'hidden' }}>

                    {/* Video / content area */}
                    <div style={{ flex: 1, overflow: 'auto', background: '#0f1117' }}>
                        {/* Video */}
                        <div style={{ background: '#000', position: 'relative', paddingBottom: '56.25%' }}>
                            {activeVideoUrl ? (
                                <iframe
                                    key={activeVideoUrl}
                                    src={activeVideoUrl}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title={activeLessonTitle}
                                />
                            ) : (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <HiPlay style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.9rem' }}>{isEn ? 'No video added yet' : 'Henüz video eklenmemiş'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Below video: ders başlığı */}
                        <div style={{ padding: '20px 28px', borderBottom: '1px solid #1f2937' }}>
                            <h2 style={{ color: '#f3f4f6', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                                {activeLesson ? `${activeLesson.order_index}. ${activeLessonTitle}` : ''}
                            </h2>
                        </div>

                        {/* Description */}
                        {(activeLesson?.description_tr || description) && (
                            <div style={{ padding: '20px 28px', borderBottom: '1px solid #1f2937' }}>
                                <p style={{ color: '#9ca3af', lineHeight: 1.7, fontSize: '0.92rem', margin: 0 }}>
                                    {activeLesson ? (isEn ? (activeLesson.description_en || activeLesson.description_tr) : activeLesson.description_tr) : description}
                                </p>
                            </div>
                        )}

                        {/* PDF Görüntüleyici */}
                        {trainingPdf && (
                            <div style={{ padding: '24px 28px' }}>
                                {/* Başlık + indirme */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <HiDocumentText style={{ color: '#a78bfa', fontSize: '1.3rem' }} />
                                        <span style={{ color: '#f3f4f6', fontWeight: 700, fontSize: '1rem' }}>
                                            {isEn ? 'Course Material' : 'Eğitim Materyali'}
                                        </span>
                                        <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                                            {isEn ? '(scroll or use arrows to navigate pages)' : '(sayfalar arası geçiş için ok tuşlarını veya kaydırmayı kullanın)'}
                                        </span>
                                    </div>
                                    <a
                                        href={trainingPdf}
                                        download
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#7c3aed', color: 'white', padding: '8px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}
                                    >
                                        ⬇ {isEn ? 'Download PDF' : 'İndir'}
                                    </a>
                                </div>

                                {/* PDF iframe — tarayıcının kendi görüntüleyicisi (sayfa navigasyonu dahil) */}
                                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #2d3748', background: '#1a1f2e' }}>
                                    <iframe
                                        src={`${trainingPdf}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                                        style={{ width: '100%', height: '820px', border: 'none', display: 'block' }}
                                        title={isEn ? 'Course Material' : 'Eğitim Materyali'}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: ders listesi */}
                    <div style={{
                        width: '340px', flexShrink: 0, background: '#1a1f2e', borderLeft: '1px solid #2d3748',
                        overflow: 'auto', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2d3748', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#f3f4f6', fontWeight: 700, fontSize: '0.9rem' }}>
                                {isEn ? 'Course Content' : 'Ders İçeriği'}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                                {completedIds.size}/{lessons.length} {isEn ? 'completed' : 'tamamlandı'}
                            </span>
                        </div>

                        <div style={{ flex: 1 }}>
                            {lessons.map(lesson => {
                                const isActive = activeLesson?.id === lesson.id
                                const isDone = completedIds.has(lesson.id)
                                const lTitle = isEn ? (lesson.title_en || lesson.title_tr) : lesson.title_tr
                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => selectLesson(lesson)}
                                        style={{
                                            width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                                            padding: '14px 20px',
                                            background: isActive ? '#1e3a52' : 'transparent',
                                            borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                                            transition: 'background 0.15s',
                                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                                            borderBottom: '1px solid #1f2937'
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                            {isDone ? (
                                                <HiCheckCircle style={{ color: '#4ade80', fontSize: '1.1rem' }} />
                                            ) : isActive ? (
                                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <HiPlay style={{ color: 'white', fontSize: '0.65rem', marginLeft: '1px' }} />
                                                </div>
                                            ) : (
                                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #374151', background: 'transparent' }} />
                                            )}
                                        </div>
                                        {/* Text */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.83rem', color: isActive ? '#e5e7eb' : '#9ca3af', fontWeight: isActive ? 600 : 400, lineHeight: 1.4, marginBottom: '3px' }}>
                                                <span style={{ color: '#6b7280', marginRight: '6px', fontSize: '0.75rem' }}>{lesson.order_index}.</span>
                                                {lTitle}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                {lesson.duration_label && (
                                                    <span style={{ fontSize: '0.72rem', color: '#4b5563' }}>⏱ {lesson.duration_label}</span>
                                                )}
                                                {lesson.pdf_url && (
                                                    <span style={{ fontSize: '0.7rem', color: '#7c3aed' }}>📄</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Mobile sidebar overlay */}
                <style>{`
                    @media (max-width: 768px) {
                        .lesson-sidebar-toggle { display: flex !important; }
                    }
                `}</style>
            </div>
        )
    }

    // ── Tek video (eski / henüz ders eklenmemiş) layout ─────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
            <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', paddingTop: '100px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {isEn ? 'Training' : 'Eğitim'}
                        </span>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
                            ✓ {isEn ? 'Access Active' : 'Erişim Aktif'}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '1.7rem', color: '#1a3a52', fontWeight: 800, margin: '0 0 10px', lineHeight: 1.25 }}>{title}</h1>
                    {description && <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>{description}</p>}
                </div>
            </div>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px 64px' }}>
                {config.vimeo_url_tr && (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', background: '#0a0a0a', marginBottom: '24px' }}>
                        <iframe
                            src={vimeoEmbedUrl(isEn ? (config.vimeo_url_en || config.vimeo_url_tr) : config.vimeo_url_tr)}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen title={title}
                        />
                    </div>
                )}
                {config.canva_url_tr && (
                    <div style={{ borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#f9fafb' }}>
                            <iframe
                                src={extractSrc(isEn ? (config.canva_url_en || config.canva_url_tr) : config.canva_url_tr)}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                allowFullScreen title="Sunum" loading="lazy"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
