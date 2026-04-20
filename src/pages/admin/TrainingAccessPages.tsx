import { useEffect, useRef, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { HiPlus, HiPencil, HiTrash, HiSave, HiX, HiCheck, HiPlay, HiDocumentText, HiUpload } from 'react-icons/hi'

interface TrainingPage {
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
}

interface Product {
    id: number
    product_key: string
    name: string
}

interface Lesson {
    id: number
    training_id: number
    title_tr: string
    title_en: string
    vimeo_url_tr: string
    vimeo_url_en: string
    pdf_url: string
    order_index: number
    duration_label: string
    is_published: number
}

const emptyPage = (): Omit<TrainingPage, 'id'> => ({
    slug: '', product_key: '', title_tr: '', title_en: '',
    description_tr: '', description_en: '',
    vimeo_url_tr: '', vimeo_url_en: '',
    canva_url_tr: '', canva_url_en: '', pdf_url: ''
})

const emptyLesson = (trainingId: number, nextOrder: number): Omit<Lesson, 'id'> => ({
    training_id: trainingId, title_tr: '', title_en: '',
    vimeo_url_tr: '', vimeo_url_en: '', pdf_url: '',
    order_index: nextOrder, duration_label: '', is_published: 1
})

export default function TrainingAccessPages() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api'
    const [pages, setPages] = useState<TrainingPage[]>([])
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<Product[]>([])

    // Editing state
    const [editingPage, setEditingPage] = useState<TrainingPage | null>(null)    // null = new
    const [isCreating, setIsCreating] = useState(false)
    const [pageForm, setPageForm] = useState<Omit<TrainingPage, 'id'>>(emptyPage())
    const [pageLang, setPageLang] = useState<'tr' | 'en'>('tr')
    const [pageSaving, setPageSaving] = useState(false)
    const [pageSaved, setPageSaved] = useState(false)
    const [pageError, setPageError] = useState('')

    // Lessons (loaded when editing)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [lessonForm, setLessonForm] = useState<(Omit<Lesson, 'id'> & { id?: number }) | null>(null)
    const [lessonLang, setLessonLang] = useState<'tr' | 'en'>('tr')
    const [lessonSaving, setLessonSaving] = useState(false)

    const [pdfProgress, setPdfProgress] = useState<{ target: 'page' | 'lesson'; pct: number } | null>(null)
    const pagePdfInputRef = useRef<HTMLInputElement>(null)
    const lessonPdfInputRef = useRef<HTMLInputElement>(null)

    const token = () => localStorage.getItem('token') || ''

    const uploadPdf = (file: File, target: 'page' | 'lesson') => {
        setPdfProgress({ target, pct: 0 })

        const formData = new FormData()
        formData.append('file', file)

        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                setPdfProgress({ target, pct: Math.round((e.loaded / e.total) * 100) })
            }
        }

        xhr.onload = () => {
            setPdfProgress(null)
            try {
                const data = JSON.parse(xhr.responseText)
                if (xhr.status >= 200 && xhr.status < 300 && data.path) {
                    if (target === 'page') {
                        setPageForm(f => ({ ...f, pdf_url: data.path }))
                    } else {
                        setLessonForm(f => f ? { ...f, pdf_url: data.path } : f)
                    }
                } else {
                    alert(data.error || `Yükleme hatası (${xhr.status})`)
                }
            } catch {
                alert('Sunucu yanıtı okunamadı')
            }
        }

        xhr.onerror = () => {
            setPdfProgress(null)
            alert('Bağlantı hatası — backend çalışıyor mu?')
        }

        xhr.open('POST', `${ADMIN_API_BASE}/admin/media/upload-pdf`)
        xhr.setRequestHeader('Authorization', `Bearer ${token()}`)
        xhr.send(formData)
    }

    const fetchPages = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/training-access-pages`, {
                headers: { Authorization: `Bearer ${token()}` }
            })
            setPages(res.ok ? await res.json() : [])
        } finally { setLoading(false) }
    }

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/products`, {
                headers: { Authorization: `Bearer ${token()}` }
            })
            if (res.ok) {
                const data: Product[] = await res.json()
                setProducts(data.filter(p => p.product_key?.startsWith('training-')))
            }
        } catch { /* silently fail */ }
    }

    const fetchLessons = async (trainingId: number) => {
        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/training-lessons/${trainingId}`, {
                headers: { Authorization: `Bearer ${token()}` }
            })
            setLessons(res.ok ? await res.json() : [])
        } catch { setLessons([]) }
    }

    useEffect(() => { fetchPages(); fetchProducts() }, [ADMIN_API_BASE])

    // ── Open full editor ────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingPage(null)
        setIsCreating(true)
        setPageForm(emptyPage())
        setPageLang('tr')
        setPageError('')
        setLessons([])
        setLessonForm(null)
    }

    const openEdit = (page: TrainingPage) => {
        setEditingPage(page)
        setIsCreating(false)
        setPageForm({
            slug: page.slug, product_key: page.product_key,
            title_tr: page.title_tr || '', title_en: page.title_en || '',
            description_tr: page.description_tr || '', description_en: page.description_en || '',
            vimeo_url_tr: page.vimeo_url_tr || '', vimeo_url_en: page.vimeo_url_en || '',
            canva_url_tr: page.canva_url_tr || '', canva_url_en: page.canva_url_en || '',
            pdf_url: page.pdf_url || ''
        })
        setPageLang('tr')
        setPageError('')
        setLessonForm(null)
        fetchLessons(page.id)
    }

    const closeEditor = () => {
        setEditingPage(null)
        setIsCreating(false)
        setLessonForm(null)
    }

    // ── Save page ───────────────────────────────────────────────────────────
    const handlePageSave = async () => {
        setPageSaving(true)
        setPageError('')
        try {
            const url = isCreating
                ? `${ADMIN_API_BASE}/admin/training-access-pages`
                : `${ADMIN_API_BASE}/admin/training-access-pages/${editingPage!.id}`
            const res = await fetch(url, {
                method: isCreating ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify(pageForm)
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                setPageSaved(true)
                setTimeout(() => setPageSaved(false), 2000)
                await fetchPages()
                // After create: switch to edit mode with new ID
                if (isCreating && data.id) {
                    const newPage = { ...pageForm, id: data.id } as TrainingPage
                    setEditingPage(newPage)
                    setIsCreating(false)
                    fetchLessons(data.id)
                }
            } else {
                setPageError(data.error || 'Kaydetme sırasında hata oluştu.')
            }
        } catch (err: any) {
            setPageError(err.message || 'Hata.')
        } finally { setPageSaving(false) }
    }

    const handlePageDelete = async (id: number) => {
        if (!confirm('Bu eğitim içeriğini silmek istediğinize emin misiniz?')) return
        await fetch(`${ADMIN_API_BASE}/admin/training-access-pages/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
        })
        closeEditor()
        await fetchPages()
    }

    // ── Lesson handlers ─────────────────────────────────────────────────────
    const openNewLesson = () => {
        if (!editingPage) return
        setLessonForm(emptyLesson(editingPage.id, lessons.length + 1))
        setLessonLang('tr')
    }

    const openEditLesson = (lesson: Lesson) => {
        setLessonForm({ ...lesson, title_tr: lesson.title_tr || '', title_en: lesson.title_en || '', vimeo_url_tr: lesson.vimeo_url_tr || '', vimeo_url_en: lesson.vimeo_url_en || '', pdf_url: lesson.pdf_url || '', duration_label: lesson.duration_label || '' })
        setLessonLang('tr')
    }

    const handleLessonSave = async () => {
        if (!lessonForm || !editingPage) return
        setLessonSaving(true)
        try {
            const isEdit = !!lessonForm.id
            const url = isEdit
                ? `${ADMIN_API_BASE}/admin/training-lessons/${lessonForm.id}`
                : `${ADMIN_API_BASE}/admin/training-lessons`
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify(lessonForm)
            })
            if (res.ok) {
                await fetchLessons(editingPage.id)
                setLessonForm(null)
            }
        } finally { setLessonSaving(false) }
    }

    const handleLessonDelete = async (lessonId: number) => {
        if (!editingPage || !confirm('Bu dersi silmek istediğinize emin misiniz?')) return
        await fetch(`${ADMIN_API_BASE}/admin/training-lessons/${lessonId}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
        })
        await fetchLessons(editingPage.id)
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    const inp = (
        val: string,
        onChange: (v: string) => void,
        opts: { label: string; type?: 'input' | 'textarea'; placeholder?: string }
    ) => (
        <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{opts.label}</label>
            {opts.type === 'textarea'
                ? <textarea value={val} onChange={e => onChange(e.target.value)} placeholder={opts.placeholder}
                    rows={3} style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                : <input value={val} onChange={e => onChange(e.target.value)} placeholder={opts.placeholder}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
            }
        </div>
    )

    const isEditorOpen = isCreating || !!editingPage

    return (
        <AdminLayout>
            {/* ── Editor (full panel) ─────────────────────────────────────── */}
            {isEditorOpen ? (
                <div>
                    {/* Editor header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <button onClick={closeEditor}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #d1d5db', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', color: '#374151', fontSize: '0.85rem', fontWeight: 500 }}>
                            ← Listeye Dön
                        </button>
                        <h1 style={{ fontSize: '1.4rem', color: '#1a3a52', fontWeight: 800, margin: 0, flex: 1 }}>
                            {isCreating ? 'Yeni Eğitim Ekle' : (pageForm.title_tr || 'Eğitim Düzenle')}
                        </h1>
                        {!isCreating && editingPage && (
                            <button onClick={() => handlePageDelete(editingPage.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #fecaca', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', color: '#b91c1c', fontSize: '0.85rem' }}>
                                <HiTrash /> Sil
                            </button>
                        )}
                    </div>

                    {/* ── BÖLÜM 1: Genel Bilgiler ──────────────────────────── */}
                    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', marginBottom: '20px', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, color: '#1a3a52', fontSize: '0.95rem' }}>📋 Genel Bilgiler</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {(['tr', 'en'] as const).map(lang => (
                                    <button key={lang} onClick={() => setPageLang(lang)} style={{
                                        padding: '4px 14px', borderRadius: '20px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                                        background: pageLang === lang ? '#1a3a52' : 'white', color: pageLang === lang ? 'white' : '#374151'
                                    }}>{lang.toUpperCase()}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                            {pageError && (
                                <div style={{ gridColumn: '1/-1', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.875rem', marginBottom: '14px' }}>
                                    {pageError}
                                </div>
                            )}
                            {/* Sol: Slug + Product */}
                            {/* Sol: Slug + Ürün + PDF */}
                            <div>
                                {inp(pageForm.slug, v => setPageForm(f => ({ ...f, slug: v })), { label: 'Slug (URL yolu)' })}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Ürün (Product Key)</label>
                                    <select value={pageForm.product_key} onChange={e => setPageForm(f => ({ ...f, product_key: e.target.value }))}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', background: 'white', boxSizing: 'border-box' }}>
                                        <option value="">— Ürün seçin —</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.product_key}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* PDF — eğitimin tamamına ait */}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                                        📄 Eğitim PDF'i <span style={{ fontWeight: 400, color: '#9ca3af' }}>(tüm eğitime ait)</span>
                                    </label>
                                    {/* Hidden file input */}
                                    <input
                                        ref={pagePdfInputRef}
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0]
                                            if (file) uploadPdf(file, 'page')
                                            e.target.value = ''
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => pagePdfInputRef.current?.click()}
                                            disabled={!!pdfProgress}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap', opacity: pdfProgress ? 0.5 : 1 }}>
                                            <HiUpload /> PDF Yükle
                                        </button>
                                        <input
                                            value={pageForm.pdf_url}
                                            onChange={e => setPageForm(f => ({ ...f, pdf_url: e.target.value }))}
                                            placeholder="/uploads/training-pdfs/dosya.pdf"
                                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    {pdfProgress?.target === 'page' && (
                                        <div style={{ marginTop: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#374151', marginBottom: '4px' }}>
                                                <span>Yükleniyor...</span>
                                                <span style={{ fontWeight: 700 }}>{pdfProgress.pct}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${pdfProgress.pct}%`, background: 'linear-gradient(90deg, #1a3a52, #2563eb)', borderRadius: '99px', transition: 'width 0.2s ease' }} />
                                            </div>
                                        </div>
                                    )}
                                    {pageForm.pdf_url && (
                                        <a href={pageForm.pdf_url} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: '#7c3aed', textDecoration: 'none' }}>
                                            <HiDocumentText /> Önizle
                                        </a>
                                    )}
                                </div>
                            </div>
                            {/* Sağ: Dil bazlı içerik */}
                            <div>
                                {pageLang === 'tr' ? (
                                    <>
                                        {inp(pageForm.title_tr, v => setPageForm(f => ({ ...f, title_tr: v })), { label: 'Başlık (TR)' })}
                                        {inp(pageForm.description_tr, v => setPageForm(f => ({ ...f, description_tr: v })), { label: 'Açıklama (TR)', type: 'textarea' })}
                                    </>
                                ) : (
                                    <>
                                        {inp(pageForm.title_en, v => setPageForm(f => ({ ...f, title_en: v })), { label: 'Title (EN)' })}
                                        {inp(pageForm.description_en, v => setPageForm(f => ({ ...f, description_en: v })), { label: 'Description (EN)', type: 'textarea' })}
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '14px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handlePageSave} disabled={pageSaving} style={{
                                display: 'flex', alignItems: 'center', gap: '7px',
                                padding: '9px 22px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                                background: pageSaved ? '#16a34a' : '#1a3a52', color: 'white', opacity: pageSaving ? 0.7 : 1
                            }}>
                                {pageSaved ? <><HiCheck /> Kaydedildi</> : pageSaving ? 'Kaydediliyor...' : <><HiSave /> Kaydet</>}
                            </button>
                        </div>
                    </div>

                    {/* ── BÖLÜM 2: Dersler ─────────────────────────────────── */}
                    {!isCreating && editingPage && (
                        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, color: '#1a3a52', fontSize: '0.95rem' }}>
                                    🎬 Dersler <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.85rem' }}>({lessons.length} ders)</span>
                                </span>
                                <button onClick={openNewLesson}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1a3a52', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>
                                    <HiPlus /> Yeni Ders Ekle
                                </button>
                            </div>

                            {/* Ders ekleme / düzenleme formu */}
                            {lessonForm && (
                                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f0f9ff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, color: '#1a3a52', fontSize: '0.9rem' }}>
                                            {lessonForm.id ? 'Dersi Düzenle' : 'Yeni Ders'}
                                        </span>
                                        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                                            {(['tr', 'en'] as const).map(lang => (
                                                <button key={lang} onClick={() => setLessonLang(lang)} style={{
                                                    padding: '3px 10px', borderRadius: '20px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                                                    background: lessonLang === lang ? '#1a3a52' : 'white', color: lessonLang === lang ? 'white' : '#374151'
                                                }}>{lang.toUpperCase()}</button>
                                            ))}
                                        </div>
                                        <button onClick={() => setLessonForm(null)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.1rem' }}>
                                            <HiX />
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
                                        {/* Dil bazlı */}
                                        <div>
                                            {lessonLang === 'tr' ? (
                                                <>
                                                    {inp(lessonForm.title_tr, v => setLessonForm(f => f ? { ...f, title_tr: v } : f), { label: 'Ders Başlığı (TR)' })}
                                                    {inp(lessonForm.vimeo_url_tr, v => setLessonForm(f => f ? { ...f, vimeo_url_tr: v } : f), { label: 'Vimeo URL (TR)', type: 'textarea', placeholder: 'https://vimeo.com/...' })}
                                                </>
                                            ) : (
                                                <>
                                                    {inp(lessonForm.title_en || '', v => setLessonForm(f => f ? { ...f, title_en: v } : f), { label: 'Lesson Title (EN)' })}
                                                    {inp(lessonForm.vimeo_url_en || '', v => setLessonForm(f => f ? { ...f, vimeo_url_en: v } : f), { label: 'Vimeo URL (EN)', type: 'textarea', placeholder: 'https://vimeo.com/...' })}
                                                </>
                                            )}
                                        </div>
                                        {/* Ortak alanlar */}
                                        <div>
                                            {/* Ders PDF upload */}
                                            <div style={{ marginBottom: '14px' }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                                                    📄 Ders PDF'i <span style={{ fontWeight: 400, color: '#9ca3af' }}>(TR ve EN için ortak)</span>
                                                </label>
                                                <input
                                                    ref={lessonPdfInputRef}
                                                    type="file"
                                                    accept="application/pdf,.pdf"
                                                    style={{ display: 'none' }}
                                                    onChange={e => {
                                                        const file = e.target.files?.[0]
                                                        if (file) uploadPdf(file, 'lesson')
                                                        e.target.value = ''
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => lessonPdfInputRef.current?.click()}
                                                        disabled={!!pdfProgress}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: '#374151', whiteSpace: 'nowrap', opacity: pdfProgress ? 0.5 : 1 }}>
                                                        <HiUpload /> PDF Yükle
                                                    </button>
                                                    <input
                                                        value={lessonForm.pdf_url || ''}
                                                        onChange={e => setLessonForm(f => f ? { ...f, pdf_url: e.target.value } : f)}
                                                        placeholder="/uploads/training-pdfs/dosya.pdf"
                                                        style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                {pdfProgress?.target === 'lesson' && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#374151', marginBottom: '4px' }}>
                                                            <span>Yükleniyor...</span>
                                                            <span style={{ fontWeight: 700 }}>{pdfProgress.pct}%</span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${pdfProgress.pct}%`, background: 'linear-gradient(90deg, #1a3a52, #2563eb)', borderRadius: '99px', transition: 'width 0.2s ease' }} />
                                                        </div>
                                                    </div>
                                                )}
                                                {lessonForm.pdf_url && (
                                                    <a href={lessonForm.pdf_url} target="_blank" rel="noopener noreferrer"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '5px', fontSize: '0.72rem', color: '#7c3aed', textDecoration: 'none' }}>
                                                        <HiDocumentText /> Önizle
                                                    </a>
                                                )}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                                                {inp(String(lessonForm.order_index), v => setLessonForm(f => f ? { ...f, order_index: parseInt(v) || 0 } : f), { label: 'Sıra No' })}
                                                {inp(lessonForm.duration_label || '', v => setLessonForm(f => f ? { ...f, duration_label: v } : f), { label: 'Süre', placeholder: '12:30' })}
                                            </div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: 'pointer', marginTop: '4px' }}>
                                                <input type="checkbox" checked={lessonForm.is_published === 1}
                                                    onChange={e => setLessonForm(f => f ? { ...f, is_published: e.target.checked ? 1 : 0 } : f)} />
                                                Yayında (aktif)
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                        <button onClick={() => setLessonForm(null)}
                                            style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                                            İptal
                                        </button>
                                        <button onClick={handleLessonSave} disabled={lessonSaving}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', border: 'none', borderRadius: '8px', background: '#1a3a52', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: lessonSaving ? 0.7 : 1 }}>
                                            <HiSave /> {lessonSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Ders listesi */}
                            <div style={{ padding: '16px 24px' }}>
                                {lessons.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '0.9rem' }}>
                                        Henüz ders eklenmemiş. "Yeni Ders Ekle" ile başlayın.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {lessons.map((lesson) => (
                                            <div key={lesson.id}
                                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: lessonForm?.id === lesson.id ? '#f0f9ff' : '#f8fafc', borderRadius: '10px', border: `1px solid ${lessonForm?.id === lesson.id ? '#bfdbfe' : '#e5e7eb'}` }}>
                                                {/* Sıra */}
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', minWidth: '28px', textAlign: 'center' }}>
                                                    {lesson.order_index}
                                                </span>
                                                {/* Icon */}
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <HiPlay style={{ color: '#1d4ed8', fontSize: '0.85rem', marginLeft: '1px' }} />
                                                </div>
                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: '#1a3a52', fontSize: '0.9rem', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {lesson.title_tr}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        {lesson.duration_label && (
                                                            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>⏱ {lesson.duration_label}</span>
                                                        )}
                                                        {lesson.vimeo_url_tr && (
                                                            <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                <HiPlay style={{ fontSize: '0.6rem' }} /> Vimeo TR
                                                            </span>
                                                        )}
                                                        {lesson.vimeo_url_en && (
                                                            <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px' }}>Vimeo EN</span>
                                                        )}
                                                        {lesson.pdf_url && (
                                                            <span style={{ fontSize: '0.72rem', background: '#ede9fe', color: '#7c3aed', padding: '1px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                <HiDocumentText style={{ fontSize: '0.65rem' }} /> PDF
                                                            </span>
                                                        )}
                                                        {!lesson.is_published && (
                                                            <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px' }}>Gizli</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                    <button onClick={() => openEditLesson(lesson)}
                                                        style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '7px', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <HiPencil /> Düzenle
                                                    </button>
                                                    <button onClick={() => handleLessonDelete(lesson.id)}
                                                        style={{ padding: '6px 10px', border: '1px solid #fecaca', borderRadius: '7px', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#b91c1c' }}>
                                                        <HiTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            ) : (
                /* ── Liste görünümü ─────────────────────────────────────────── */
                <>
                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800, margin: 0 }}>Eğitim İçerik Sayfaları</h1>
                            <p style={{ color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>Satın alma sonrası gösterilecek eğitim içeriklerini ve derslerini yönetin.</p>
                        </div>
                        <button onClick={openCreate}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1a3a52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                            <HiPlus /> Yeni Eğitim Ekle
                        </button>
                    </div>

                    {loading ? (
                        <p style={{ color: '#6b7280' }}>Yükleniyor...</p>
                    ) : pages.length === 0 ? (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Henüz eğitim eklenmemiş.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {pages.map(page => (
                                <div key={page.id}
                                    style={{ background: 'white', borderRadius: '12px', padding: '18px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #f3f4f6', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                                    onClick={() => openEdit(page)}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: '#1a3a52', fontSize: '1rem', marginBottom: '4px' }}>{page.title_tr || <span style={{ color: '#9ca3af' }}>Başlıksız</span>}</div>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#374151', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>/{page.slug}</span>
                                            <span style={{ fontSize: '0.78rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                                {products.find(p => p.product_key === page.product_key)?.name || page.product_key || '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.85rem', flexShrink: 0 }}>
                                        <HiPencil /> Düzenle
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    )
}
