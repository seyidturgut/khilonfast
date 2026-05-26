import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { ONBOARDING_SECTIONS, getFieldLabel, getSectionTitle } from '../../content/onboardingSchema';
import {
    REBRIEF_TEMPLATES,
    detectRebriefTemplate,
    getTemplateByKey,
    buildEmptyRebrief,
} from '../../content/rebriefTemplates';

const ADMIN_API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

type FormStatus = 'new' | 'reviewed' | 'awaiting_user_response' | 'approved';

interface FormRow {
    id: number;
    user_id: number;
    order_id: number;
    user_name: string;
    user_email: string;
    order_number: string;
    product_names: string;
    status: FormStatus;
    submitted_at: string;
}

interface FollowupQuestion {
    id: string;
    question: string;
    answer: string | null;
    answered_at: string | null;
}

interface RebriefData {
    template_key: string;
    intro: string;
    sections: { key: string; title: string; content: string }[];
}

interface FormDetail extends FormRow {
    form_data: Record<string, Record<string, string>>;
    admin_general_note: string | null;
    admin_section_notes: Record<string, string> | null;
    admin_followup_questions: FollowupQuestion[] | null;
    rebrief_data: RebriefData | null;
    approved_at: string | null;
}

const STATUS_CONFIG: Record<FormStatus, { label: string; bg: string; color: string }> = {
    new:                     { label: 'Yeni',           bg: '#fef3c7', color: '#92400e' },
    reviewed:                { label: 'İncelendi',      bg: '#dbeafe', color: '#1e3a8a' },
    awaiting_user_response:  { label: 'Cevap Bekliyor', bg: '#fed7aa', color: '#9a3412' },
    approved:                { label: 'Onaylandı',      bg: '#dcfce7', color: '#166534' },
};

export default function OnboardingFormsList() {
    const [forms, setForms] = useState<FormRow[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedForm, setSelectedForm] = useState<FormDetail | null>(null);
    const [panelLoading, setPanelLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Re-brief editor state
    const [templateKey, setTemplateKey] = useState<string>('generic');
    const [rebriefIntro, setRebriefIntro] = useState('');
    const [rebriefSections, setRebriefSections] = useState<{ key: string; title: string; content: string }[]>([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [draftQuestions, setDraftQuestions] = useState<string[]>([]);
    const [savingNotes, setSavingNotes] = useState(false);
    const [sendingQuestions, setSendingQuestions] = useState(false);
    const [approving, setApproving] = useState(false);

    const token = localStorage.getItem('token');
    const currentTemplate = useMemo(() => getTemplateByKey(templateKey), [templateKey]);

    const fetchForms = useCallback(async (p = page, s = search, sf = statusFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p) });
            if (s) params.set('search', s);
            if (sf) params.set('status', sf);
            const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/all?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setForms(data.forms || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchForms(1, search, statusFilter); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchForms(1, search, statusFilter);
    };

    const handleStatusFilter = (sf: string) => {
        setStatusFilter(sf);
        setPage(1);
        fetchForms(1, search, sf);
    };

    const openPanel = async (row: FormRow) => {
        setPanelLoading(true);
        const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${row.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const detail: FormDetail = await res.json();
        setSelectedForm(detail);

        // Re-brief verisini yükle veya yeni şablon başlat
        if (detail.rebrief_data && Array.isArray(detail.rebrief_data.sections)) {
            setTemplateKey(detail.rebrief_data.template_key || 'generic');
            setRebriefIntro(detail.rebrief_data.intro || '');
            setRebriefSections(detail.rebrief_data.sections);
        } else {
            // İlk açılış: ürün adından şablonu tahmin et
            const tpl = detectRebriefTemplate(detail.product_names);
            const empty = buildEmptyRebrief(tpl);
            setTemplateKey(tpl.key);
            setRebriefIntro(detail.admin_general_note || ''); // Eski genel notu intro'ya taşı (geri uyumluluk)
            setRebriefSections(empty.sections);
        }
        setDraftQuestions([]);
        setNewQuestion('');
        setPanelLoading(false);
    };

    const closePanel = () => {
        setSelectedForm(null);
        setTemplateKey('generic');
        setRebriefIntro('');
        setRebriefSections([]);
        setDraftQuestions([]);
        setNewQuestion('');
    };

    const switchTemplate = (newKey: string) => {
        if (rebriefSections.some(s => s.content.trim())) {
            if (!confirm('Şablonu değiştirirseniz mevcut bölümlerdeki yazılarınız kaybolabilir. Devam edilsin mi?')) return;
        }
        const tpl = getTemplateByKey(newKey);
        const empty = buildEmptyRebrief(tpl);
        setTemplateKey(tpl.key);
        setRebriefSections(empty.sections);
    };

    const updateSection = (idx: number, content: string) => {
        setRebriefSections(prev => prev.map((s, i) => i === idx ? { ...s, content } : s));
    };

    const saveNotes = async () => {
        if (!selectedForm) return;
        setSavingNotes(true);
        try {
            const rebrief = {
                template_key: templateKey,
                intro: rebriefIntro,
                sections: rebriefSections,
            };
            const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${selectedForm.id}/notes`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    general_note: rebriefIntro, // Geri uyumluluk: intro'yu general_note olarak da kaydet
                    section_notes: null,
                    rebrief_data: rebrief,
                }),
            });
            if (res.ok) {
                const newStatus: FormStatus = selectedForm.status === 'new' ? 'reviewed' : selectedForm.status;
                setSelectedForm({ ...selectedForm, status: newStatus, rebrief_data: rebrief });
                setForms(prev => prev.map(f => f.id === selectedForm.id ? { ...f, status: newStatus } : f));
                alert('Re-brief kaydedildi.');
            } else {
                alert('Kaydetme hatası');
            }
        } finally {
            setSavingNotes(false);
        }
    };

    const sendQuestions = async () => {
        if (!selectedForm || draftQuestions.length === 0) {
            alert('En az bir soru ekleyin.');
            return;
        }
        if (!confirm(`${draftQuestions.length} soru müşteriye gönderilecek. Devam edilsin mi?`)) return;
        setSendingQuestions(true);
        try {
            const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${selectedForm.id}/questions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: draftQuestions.map(q => ({ question: q })) }),
            });
            if (res.ok) {
                const detail = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${selectedForm.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(r => r.json());
                setSelectedForm(detail);
                setForms(prev => prev.map(f => f.id === selectedForm.id ? { ...f, status: 'awaiting_user_response' } : f));
                setDraftQuestions([]);
                alert('Sorular müşteriye gönderildi.');
            } else {
                alert('Gönderme hatası');
            }
        } finally {
            setSendingQuestions(false);
        }
    };

    const approvePresentation = async () => {
        if (!selectedForm) return;
        if (!rebriefIntro.trim() && !rebriefSections.some(s => s.content.trim())) {
            alert('Re-brief boş — önce içerik yazın.');
            return;
        }
        if (!confirm('Re-brief onaylanıp müşteriye sunum olarak gönderilecek. Emin misiniz?')) return;

        // Önce kaydet, sonra approve
        await saveNotes();

        setApproving(true);
        try {
            const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${selectedForm.id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setSelectedForm({ ...selectedForm, status: 'approved', approved_at: new Date().toISOString() });
                setForms(prev => prev.map(f => f.id === selectedForm.id ? { ...f, status: 'approved' } : f));
                alert('Re-brief onaylandı, müşteriye mail gönderildi.');
            } else {
                alert('Onaylama hatası');
            }
        } finally {
            setApproving(false);
        }
    };

    const downloadPdf = async (formId: number, _orderNumber: string) => {
        setPdfLoading(true);
        try {
            const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${formId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                alert('Form alınamadı: HTTP ' + res.status);
                return;
            }
            const html = await res.text();
            const w = window.open('', '_blank', 'width=900,height=900');
            if (!w) {
                alert('Pop-up engellenmiş — tarayıcıda izin verin.');
                return;
            }
            w.document.open();
            w.document.write(html);
            w.document.close();
        } finally {
            setPdfLoading(false);
        }
    };

    const addDraftQuestion = () => {
        const q = newQuestion.trim();
        if (q.length < 5) return;
        setDraftQuestions(prev => [...prev, q]);
        setNewQuestion('');
    };

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Onboarding Formları</h1>
                        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>{total} form · re-brief ile sunum yönetin</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: 240 }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim / e-posta ara..."
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                        <button type="submit" style={{ padding: '8px 16px', background: '#1a3a52', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Ara</button>
                    </form>
                    <select value={statusFilter} onChange={e => handleStatusFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}>
                        <option value="">Tüm durumlar</option>
                        <option value="new">Yeni</option>
                        <option value="reviewed">İncelendi</option>
                        <option value="awaiting_user_response">Cevap Bekliyor</option>
                        <option value="approved">Onaylandı</option>
                    </select>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</div>
                ) : forms.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Henüz form yok.</div>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr>
                                    <th style={th}>Müşteri</th>
                                    <th style={th}>Ürünler</th>
                                    <th style={th}>Sipariş</th>
                                    <th style={th}>Tarih</th>
                                    <th style={th}>Durum</th>
                                    <th style={th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {forms.map(row => {
                                    const sc = STATUS_CONFIG[row.status] || STATUS_CONFIG.new;
                                    return (
                                        <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                            <td style={td}>
                                                <div style={{ fontWeight: 600 }}>{row.user_name}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{row.user_email}</div>
                                            </td>
                                            <td style={{ ...td, color: '#6b7280', fontSize: '0.78rem' }}>{row.product_names}</td>
                                            <td style={td}>#{row.order_number}</td>
                                            <td style={{ ...td, color: '#6b7280' }}>{new Date(row.submitted_at).toLocaleString('tr-TR')}</td>
                                            <td style={td}>
                                                <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td style={td}>
                                                <button onClick={() => openPanel(row)}
                                                    style={{ padding: '6px 14px', background: '#1a3a52', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                                                    Re-brief Hazırla
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => { setPage(p); fetchForms(p, search, statusFilter); }}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: p === page ? '#1a3a52' : '#fff', color: p === page ? '#fff' : '#374151', cursor: 'pointer' }}>
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Slideout Panel — 2 column layout */}
            {(selectedForm || panelLoading) && (
                <>
                    <div onClick={closePanel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100 }} />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: '95vw', maxWidth: 1200,
                        background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column',
                        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)'
                    }}>
                        {panelLoading ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Yükleniyor…</div>
                        ) : selectedForm && (
                            <>
                                {/* Header */}
                                <div style={{ padding: '14px 22px', borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(90deg,#1a3a52,#89b004)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedForm.user_name}</div>
                                        <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>{selectedForm.user_email} · #{selectedForm.order_number}</div>
                                        {selectedForm.product_names && <div style={{ fontSize: '0.74rem', opacity: 0.8, marginTop: 2 }}>{selectedForm.product_names}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                                            {STATUS_CONFIG[selectedForm.status]?.label}
                                        </span>
                                        <button onClick={closePanel} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                                    </div>
                                </div>

                                {/* 2 column body */}
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', overflow: 'hidden' }}>
                                    {/* LEFT: Re-brief editor */}
                                    <div style={{ overflowY: 'auto', padding: '20px 22px', borderRight: '1px solid #e5e7eb', background: '#fff' }}>
                                        <div style={{ marginBottom: 16, padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
                                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
                                                ✨ Hizmet Şablonu
                                            </label>
                                            <select
                                                value={templateKey}
                                                onChange={e => switchTemplate(e.target.value)}
                                                style={{ width: '100%', padding: 8, border: '1px solid #93c5fd', borderRadius: 6, fontSize: '0.875rem', background: '#fff' }}
                                            >
                                                {REBRIEF_TEMPLATES.map(t => (
                                                    <option key={t.key} value={t.key}>{t.name}</option>
                                                ))}
                                            </select>
                                            <div style={{ fontSize: '0.72rem', color: '#1e40af', marginTop: 6 }}>
                                                Müşterinin aldığı hizmete göre otomatik seçildi. Yanlışsa değiştirebilirsiniz.
                                            </div>
                                        </div>

                                        {/* Intro */}
                                        <div style={{ marginBottom: 18 }}>
                                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1a3a52', marginBottom: 6 }}>
                                                Giriş / Hero Mesajı
                                            </label>
                                            <textarea
                                                value={rebriefIntro}
                                                onChange={e => setRebriefIntro(e.target.value)}
                                                rows={3}
                                                placeholder={currentTemplate.intro_placeholder}
                                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
                                            />
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                                                Sunumun en başında büyük olarak görünür. Müşteriye genel mesajınız.
                                            </div>
                                        </div>

                                        {/* Sections */}
                                        {rebriefSections.map((sec, idx) => {
                                            const tplSec = currentTemplate.sections.find(s => s.key === sec.key);
                                            return (
                                                <div key={sec.key} style={{ marginBottom: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' }}>
                                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1a3a52', marginBottom: 6 }}>
                                                        {idx + 1}. {sec.title}
                                                    </label>
                                                    <textarea
                                                        value={sec.content}
                                                        onChange={e => updateSection(idx, e.target.value)}
                                                        rows={5}
                                                        placeholder={tplSec?.placeholder || 'Bu bölüm için yaklaşımınızı yazın...'}
                                                        style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', background: '#fff' }}
                                                    />
                                                </div>
                                            );
                                        })}

                                        {/* Ek Sorular */}
                                        <div style={{ marginTop: 24, padding: 14, background: '#fff7ed', borderRadius: 10, border: '1px solid #fdba74' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#9a3412', marginBottom: 10 }}>
                                                💬 Ek Sorular {selectedForm.admin_followup_questions && selectedForm.admin_followup_questions.length > 0 && `(${selectedForm.admin_followup_questions.length})`}
                                            </div>
                                            {Array.isArray(selectedForm.admin_followup_questions) && selectedForm.admin_followup_questions.length > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    {selectedForm.admin_followup_questions.map((q, idx) => (
                                                        <div key={q.id} style={{ marginBottom: 10, padding: 10, background: '#fff', borderRadius: 6, border: '1px solid #fde68a' }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                                                                {idx + 1}. {q.question}
                                                            </div>
                                                            {q.answer ? (
                                                                <div style={{ fontSize: '0.82rem', color: '#111827', background: '#f0fdf4', padding: 8, borderRadius: 4, borderLeft: '3px solid #22c55e' }}>
                                                                    <strong style={{ color: '#166534' }}>Cevap:</strong> {q.answer}
                                                                </div>
                                                            ) : (
                                                                <div style={{ fontSize: '0.78rem', color: '#9a3412', fontStyle: 'italic' }}>
                                                                    Müşteri henüz cevaplamadı
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {draftQuestions.length > 0 && (
                                                <div style={{ marginBottom: 10 }}>
                                                    {draftQuestions.map((q, idx) => (
                                                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, padding: 6, background: '#fff', borderRadius: 6 }}>
                                                            <span style={{ fontSize: '0.82rem', flex: 1 }}>{idx + 1}. {q}</span>
                                                            <button onClick={() => setDraftQuestions(prev => prev.filter((_, i) => i !== idx))}
                                                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <input
                                                    value={newQuestion}
                                                    onChange={e => setNewQuestion(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDraftQuestion(); } }}
                                                    placeholder="Yeni soru ekle..."
                                                    style={{ flex: 1, padding: 8, border: '1px solid #fdba74', borderRadius: 6, fontSize: '0.85rem' }}
                                                />
                                                <button onClick={addDraftQuestion}
                                                    style={{ padding: '8px 14px', background: '#fdba74', color: '#7c2d12', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+ Ekle</button>
                                            </div>
                                            {draftQuestions.length > 0 && (
                                                <button onClick={sendQuestions} disabled={sendingQuestions}
                                                    style={{ marginTop: 10, width: '100%', padding: 10, background: '#9a3412', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {sendingQuestions ? 'Gönderiliyor...' : `${draftQuestions.length} Soruyu Müşteriye Gönder`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT: Form cevapları (referans) */}
                                    <div style={{ overflowY: 'auto', padding: '20px 22px', background: '#f8fafc' }}>
                                        <div style={{ position: 'sticky', top: 0, background: '#f8fafc', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#1a3a52', fontWeight: 700 }}>
                                                📋 Müşteri Cevapları (Referans)
                                            </h3>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                                                Re-brief'i yazarken bu cevaplara bakabilirsiniz. Müşteri sunumda bu cevapları görmez.
                                            </div>
                                        </div>
                                        {ONBOARDING_SECTIONS.map(section => {
                                            const data = selectedForm.form_data?.[section.key] || {};
                                            const filled = section.fields.filter(f => (data[f.key] || '').trim());
                                            if (filled.length === 0) return null;
                                            return (
                                                <div key={section.key} style={{ marginBottom: 16 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.74rem', color: '#1a3a52', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                                                        {getSectionTitle(section.key, false)}
                                                    </div>
                                                    {filled.map(f => (
                                                        <div key={f.key} style={{ marginBottom: 6 }}>
                                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', marginBottom: 2 }}>
                                                                {getFieldLabel(section.key, f.key, false)}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#111827', background: '#fff', borderRadius: 4, padding: '6px 8px', whiteSpace: 'pre-wrap', lineHeight: 1.45, border: '1px solid #e2e8f0' }}>
                                                                {data[f.key]}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, background: '#f9fafb', flexWrap: 'wrap' }}>
                                    <button onClick={saveNotes} disabled={savingNotes}
                                        style={{ flex: '1 1 200px', padding: 11, background: '#1a3a52', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                                        {savingNotes ? 'Kaydediliyor...' : '💾 Re-brief\'i Kaydet'}
                                    </button>
                                    <button onClick={approvePresentation} disabled={approving || selectedForm.status === 'approved'}
                                        style={{ flex: '1 1 200px', padding: 11, background: selectedForm.status === 'approved' ? '#94a3b8' : '#22c55e', color: '#fff', border: 'none', borderRadius: 8, cursor: selectedForm.status === 'approved' ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                                        {approving ? 'Onaylanıyor...' : selectedForm.status === 'approved' ? '✓ Onaylandı' : '✓ Sunumu Gönder & Onayla'}
                                    </button>
                                    <button onClick={() => downloadPdf(selectedForm.id, selectedForm.order_number)} disabled={pdfLoading}
                                        style={{ padding: '11px 16px', background: '#fff', color: '#1a3a52', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem' }}>
                                        Form PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </AdminLayout>
    );
}

const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' };
const td: React.CSSProperties = { padding: '12px 14px', color: '#111827' };
