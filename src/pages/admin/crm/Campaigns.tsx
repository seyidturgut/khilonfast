import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmCampaign, type CrmList, type CrmTag } from '../../../services/api';
import { getEmailTemplates } from '../../../automation/services/automationService';
import type { EmailTemplate } from '../../../automation/types';
import UnlayerEmailEditor, { type UnlayerEditorHandle, KHILON_MERGE_TAGS } from '../../../components/admin/UnlayerEmailEditor';
import { HiMail, HiPlus, HiTrash, HiChartBar, HiTemplate, HiPencil, HiClock } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
    draft:     { label: 'Taslak',    bg: '#f1f5f9', fg: '#475569' },
    scheduled: { label: 'Planlandı', bg: '#dbeafe', fg: '#1d4ed8' },
    sending:   { label: 'Gönderiliyor', bg: '#fef3c7', fg: '#a16207' },
    sent:      { label: 'Gönderildi', bg: '#dcfce7', fg: '#15803d' },
    paused:    { label: 'Durduruldu', bg: '#e0e7ff', fg: '#4338ca' },
    cancelled: { label: 'İptal', bg: '#fee2e2', fg: '#b91c1c' },
};

export default function CrmCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBuilder, setShowBuilder] = useState(false);

    const load = async () => {
        try {
            setLoading(true); setError('');
            const res = await crmAPI.listCampaigns();
            setCampaigns(res.data?.campaigns || []);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const handleDelete = async (c: CrmCampaign) => {
        if (!confirm(`"${c.name}" kampanyası silinsin mi?`)) return;
        try { await crmAPI.deleteCampaign(c.id); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    const fmtDate = (s: string | null) => {
        if (!s) return '—';
        try { return new Date(s).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }); }
        catch { return s; }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiMail /> Kampanyalar</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={() => setShowBuilder(true)}><HiPlus /> Yeni Kampanya</button>
                    </div>
                </header>

                <div className="info-banner">
                    Tek seferlik (one-off) e-posta kampanyaları gönderin. Hedef olarak listeler, etiketler veya her ikisi seçilebilir. A/B testi etkinse iki konu satırı 50/50 dağıtılır; gönderim Brevo HTTP API üzerinden yapılır.
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>İsim</th>
                                <th>Konu</th>
                                <th>Hedef</th>
                                <th>Durum</th>
                                <th>Açılma / Tıklama</th>
                                <th>Oluşturulma</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="empty">Yükleniyor…</td></tr>
                            ) : campaigns.length === 0 ? (
                                <tr><td colSpan={7} className="empty">Henüz kampanya yok.</td></tr>
                            ) : campaigns.map(c => {
                                const s = STATUS_LABELS[c.status] || STATUS_LABELS.draft;
                                const stats = c.stats as any || {};
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <Link to={`/admin/crm/campaigns/${c.id}`} className="row-link">{c.name}</Link>
                                            {c.ab_enabled && <span className="ab-pill">A/B</span>}
                                        </td>
                                        <td className="muted">{c.subject}</td>
                                        <td className="muted">
                                            {c.target_list_ids.length} liste · {c.target_tag_slugs.length} etiket
                                        </td>
                                        <td><span className="status-pill" style={{ background: s.bg, color: s.fg }}>{s.label}</span></td>
                                        <td className="muted">
                                            {stats.audience ? `${stats.audience} kişi` : '—'}
                                        </td>
                                        <td className="muted">{fmtDate(c.created_at)}</td>
                                        <td>
                                            <Link to={`/admin/crm/campaigns/${c.id}`} className="icon-btn" title="Aç"><HiChartBar /></Link>
                                            <button className="icon-btn danger" onClick={() => handleDelete(c)} title="Sil"><HiTrash /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {showBuilder && <CampaignBuilder onClose={() => { setShowBuilder(false); load(); }} />}
            </div>
            <CrmPageStyles />
            <CampaignsStyles />
        </AdminLayout>
    );
}

function CampaignBuilder({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [form, setForm] = useState({
        name: '', subject: '', preview_text: '',
        body_html: '', design_json: '' as string | object,
        from_email: '', from_name: '',
        target_list_ids: [] as number[],
        target_tag_slugs: [] as string[],
        target_status: 'subscribed',
        ab_enabled: false,
        ab_subject_b: '',
        template_id: null as number | null,
        send_mode: 'manual' as 'manual' | 'scheduled', // 'manual' = taslak, 'scheduled' = belirli zamanda
        scheduled_at: '',
    });
    const [lists, setLists] = useState<CrmList[]>([]);
    const [tags, setTags] = useState<CrmTag[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [audienceCount, setAudienceCount] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [designerOpen, setDesignerOpen] = useState(false);
    const [editorReady, setEditorReady] = useState(false);
    const editorHandle = useRef<UnlayerEditorHandle>(null);

    useEffect(() => {
        Promise.all([crmAPI.listLists(), crmAPI.listTags()]).then(([lr, tr]) => {
            setLists(lr.data?.lists || []);
            setTags(tr.data?.tags || []);
        });
        // Templates ayrı (yetki/erişim hatası kampanya akışını bozmasın)
        getEmailTemplates().then(setTemplates).catch(() => setTemplates([]));
    }, []);

    const applyTemplate = (tpl: EmailTemplate) => {
        setForm(f => ({
            ...f,
            template_id: Number(tpl.id) || null,
            subject: f.subject || tpl.subject,
            preview_text: f.preview_text || (tpl.preview_text || ''),
            from_email: f.from_email || tpl.sender_email || '',
            from_name: f.from_name || tpl.sender_name || '',
            body_html: tpl.body_html || '',
            design_json: tpl.design_json || '',
        }));
    };

    const openDesigner = () => {
        setEditorReady(false);
        setDesignerOpen(true);
    };

    const closeDesignerAndSave = async () => {
        if (!editorHandle.current?.isReady()) {
            setDesignerOpen(false);
            return;
        }
        try {
            const { html, design } = await editorHandle.current.export();
            setForm(f => ({ ...f, body_html: html, design_json: JSON.stringify(design) }));
            setDesignerOpen(false);
        } catch (e: any) {
            alert(e?.message || 'Editör export hatası');
        }
    };

    const previewAudience = async () => {
        if (form.target_list_ids.length === 0 && form.target_tag_slugs.length === 0) {
            setAudienceCount(0);
            return;
        }
        try {
            const res = await crmAPI.previewCampaignAudience({
                target_list_ids: form.target_list_ids,
                target_tag_slugs: form.target_tag_slugs,
                target_status: form.target_status,
            });
            setAudienceCount(Number(res.data?.count || 0));
        } catch { setAudienceCount(null); }
    };
    useEffect(() => { if (step === 2) previewAudience(); }, [step, form.target_list_ids, form.target_tag_slugs, form.target_status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim() || !form.subject.trim()) { setError('İsim ve konu zorunlu'); return; }
        if (form.ab_enabled && !form.ab_subject_b.trim()) { setError('A/B test için ikinci konu satırı zorunlu'); return; }
        if (form.target_list_ids.length === 0 && form.target_tag_slugs.length === 0) {
            setError('En az bir liste veya etiket seçilmeli');
            return;
        }
        // Schedule validation
        let scheduledIso: string | null = null;
        if (form.send_mode === 'scheduled') {
            if (!form.scheduled_at) {
                setError('Zamanlama için tarih ve saat seçin');
                return;
            }
            const ts = new Date(form.scheduled_at).getTime();
            if (!ts || isNaN(ts)) {
                setError('Geçersiz tarih formatı');
                return;
            }
            if (ts <= Date.now()) {
                setError('Zamanlama geçmiş veya şu anki saat olamaz — gelecek bir tarih seçin');
                return;
            }
            // datetime-local → MySQL Y-m-d H:i:s
            const d = new Date(ts);
            const pad = (n: number) => String(n).padStart(2, '0');
            scheduledIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
        }
        try {
            setSubmitting(true);
            await crmAPI.createCampaign({
                name: form.name.trim(),
                subject: form.subject.trim(),
                preview_text: form.preview_text.trim() || null,
                body_html: form.body_html,
                design_json: typeof form.design_json === 'string' ? form.design_json : JSON.stringify(form.design_json),
                from_email: form.from_email.trim() || undefined,
                from_name: form.from_name.trim() || undefined,
                template_id: form.template_id || null,
                target_list_ids: form.target_list_ids,
                target_tag_slugs: form.target_tag_slugs,
                target_status: form.target_status,
                ab_enabled: form.ab_enabled,
                ab_subject_b: form.ab_enabled ? form.ab_subject_b.trim() : null,
                scheduled_at: scheduledIso,
            });
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Oluşturma hatası');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleList = (id: number) => {
        setForm({
            ...form,
            target_list_ids: form.target_list_ids.includes(id)
                ? form.target_list_ids.filter(x => x !== id)
                : [...form.target_list_ids, id]
        });
    };
    const toggleTag = (slug: string) => {
        setForm({
            ...form,
            target_tag_slugs: form.target_tag_slugs.includes(slug)
                ? form.target_tag_slugs.filter(x => x !== slug)
                : [...form.target_tag_slugs, slug]
        });
    };

    // ─── Full-screen Unlayer designer overlay ───
    if (designerOpen) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', background: '#1a3a52', borderBottom: '1px solid #0f2236', flexShrink: 0 }}>
                    <button onClick={() => setDesignerOpen(false)} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← İptal</button>
                    <div style={{ width: 1, height: 28, background: '#334155' }} />
                    <input
                        value={form.subject}
                        onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                        placeholder="Konu satırı (örn: Merhaba {{first_name}}!)"
                        style={{ background: '#0f2236', border: '1px solid #334155', borderRadius: 8, padding: '7px 14px', fontSize: 14, fontWeight: 600, color: '#f1f5f9', outline: 'none', flex: 1 }}
                    />
                    <input
                        value={form.preview_text}
                        onChange={(e) => setForm(f => ({ ...f, preview_text: e.target.value }))}
                        placeholder="Önizleme metni…"
                        style={{ background: '#0f2236', border: '1px solid #334155', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: '#94a3b8', outline: 'none', width: 220 }}
                    />
                    <div style={{ width: 1, height: 28, background: '#334155' }} />
                    {!editorReady && <span style={{ fontSize: 12, color: '#64748b' }}>Editör yükleniyor…</span>}
                    <button
                        onClick={closeDesignerAndSave}
                        disabled={!editorReady}
                        style={{
                            background: editorReady ? '#c5d63d' : '#334155',
                            color: editorReady ? '#1a3a52' : '#64748b',
                            border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 700,
                            cursor: editorReady ? 'pointer' : 'default'
                        }}
                    >
                        💾 Tasarımı Kaydet
                    </button>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <UnlayerEmailEditor
                        ref={editorHandle}
                        initialDesign={typeof form.design_json === 'string' && form.design_json ? form.design_json : (form.design_json && typeof form.design_json === 'object' ? form.design_json : null)}
                        fallbackHtml={!form.design_json && form.body_html ? form.body_html : null}
                        preheaderText={form.preview_text}
                        onReady={() => setEditorReady(true)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Yeni Kampanya — Adım {step}/4</h3>
                    <button onClick={onClose}>×</button>
                </div>

                <div className="step-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. İçerik</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Hedef Kitle</div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Zamanlama</div>
                    <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Onay</div>
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="builder-step1">
                            {/* Bölüm: Temel Bilgiler */}
                            <div className="cb-section">
                                <div className="cb-section-head">
                                    <span className="cb-section-num">1</span>
                                    <div>
                                        <h4>Kampanya Bilgileri</h4>
                                        <p>İç kullanım için isim ve alıcılara görünecek konu satırı.</p>
                                    </div>
                                </div>
                                <div className="cb-section-body">
                                    <div className="form-row">
                                        <label>Kampanya İsmi <span className="req">*</span></label>
                                        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Mayıs 2026 Promosyon" />
                                        <div className="form-hint">Yalnızca admin panelinde görünür.</div>
                                    </div>
                                    <div className="form-row">
                                        <label>Konu Satırı <span className="req">*</span></label>
                                        <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Size özel %30 indirim — son 24 saat" />
                                        <div className="form-hint">Gelen kutusunda görünecek metin. <code>{'{{first_name}}'}</code> gibi değişkenler kullanılabilir.</div>
                                    </div>
                                    <div className="form-row">
                                        <label>Önizleme Metni <span className="opt">opsiyonel</span></label>
                                        <input type="text" value={form.preview_text} onChange={(e) => setForm({ ...form, preview_text: e.target.value })} placeholder="Konu satırının altında küçük gri olarak görünür" />
                                    </div>
                                </div>
                            </div>

                            {/* Bölüm: Gönderici */}
                            <div className="cb-section">
                                <div className="cb-section-head">
                                    <span className="cb-section-num">2</span>
                                    <div>
                                        <h4>Gönderici Kimliği</h4>
                                        <p>Boş bırakılırsa Settings'teki varsayılan kullanılır.</p>
                                    </div>
                                </div>
                                <div className="cb-section-body two-cols">
                                    <div className="form-row">
                                        <label>Gönderici İsim</label>
                                        <input type="text" value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} placeholder="Khilonfast" />
                                    </div>
                                    <div className="form-row">
                                        <label>Gönderici E-posta</label>
                                        <input type="email" value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} placeholder="info@khilon.com" />
                                    </div>
                                </div>
                            </div>

                            {/* Bölüm: Tasarım */}
                            <div className="cb-section">
                                <div className="cb-section-head">
                                    <span className="cb-section-num">3</span>
                                    <div>
                                        <h4>E-posta Tasarımı <span className="req">*</span></h4>
                                        <p>Sürükle-bırak görsel editörle e-posta gövdesini hazırlayın.</p>
                                    </div>
                                </div>
                                <div className="cb-section-body">
                                    {templates.length > 0 && (
                                        <div className="form-row">
                                            <label><HiTemplate style={{ verticalAlign: 'middle' }} /> Şablondan Başla <span className="opt">opsiyonel</span></label>
                                            <select
                                                value={form.template_id ? String(form.template_id) : ''}
                                                onChange={(e) => {
                                                    const id = e.target.value;
                                                    if (!id) { setForm(f => ({ ...f, template_id: null })); return; }
                                                    const tpl = templates.find(t => t.id === id);
                                                    if (tpl) applyTemplate(tpl);
                                                }}
                                            >
                                                <option value="">— Boş başla —</option>
                                                {templates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className={`designer-card ${form.body_html ? 'has-design' : ''}`}>
                                        {form.body_html ? (
                                            <>
                                                <div className="designer-card-preview">
                                                    <div className="designer-card-preview-inner"
                                                        dangerouslySetInnerHTML={{ __html: form.body_html.length > 1500 ? form.body_html.slice(0, 1500) + '…' : form.body_html }} />
                                                </div>
                                                <div className="designer-card-overlay">
                                                    <div className="designer-card-status">
                                                        <span className="check-dot">✓</span> Tasarım hazır — <b>düzenlemek için tıklayın</b>
                                                    </div>
                                                    <button type="button" className="btn btn-primary" onClick={openDesigner}>
                                                        <HiPencil /> Tasarımı Düzenle
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="designer-card-empty">
                                                <div className="designer-card-icon">✉️</div>
                                                <h5>Henüz tasarım yok</h5>
                                                <p>Sürükle-bırak görsel editörle profesyonel e-posta hazırlayın.<br/>
                                                    Resim, buton, metin blokları ve değişken etiketleri kullanabilirsiniz.</p>
                                                <button type="button" className="btn btn-primary btn-lg" onClick={openDesigner}>
                                                    <HiPencil /> Görsel Editörü Aç
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="merge-tag-bar">
                                        <span className="merge-tag-bar-label">Kullanılabilir değişkenler:</span>
                                        {KHILON_MERGE_TAGS.slice(0, 8).map(t => (
                                            <code key={t.value} className="merge-tag-chip" title={t.name + ' — örn: ' + t.sample}>{t.value}</code>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bölüm: A/B Test */}
                            <div className="cb-section">
                                <div className="cb-section-head">
                                    <span className="cb-section-num">4</span>
                                    <div>
                                        <h4>A/B Testi <span className="opt">opsiyonel</span></h4>
                                        <p>İki farklı konu satırını 50/50 dağıtarak hangi daha çok açıldığını ölçün.</p>
                                    </div>
                                </div>
                                <div className="cb-section-body">
                                    <div className="ab-toggle-row">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={form.ab_enabled}
                                            className={`switch ${form.ab_enabled ? 'on' : 'off'}`}
                                            onClick={() => setForm({ ...form, ab_enabled: !form.ab_enabled })}
                                        >
                                            <span className="switch-knob" />
                                        </button>
                                        <span className="ab-toggle-label">
                                            {form.ab_enabled ? 'A/B testi aktif' : 'A/B testi kapalı'}
                                        </span>
                                    </div>
                                    {form.ab_enabled && (
                                        <div className="form-row" style={{ marginTop: 12 }}>
                                            <label>İkinci Konu Satırı (Konu B) <span className="req">*</span></label>
                                            <input type="text" value={form.ab_subject_b} onChange={(e) => setForm({ ...form, ab_subject_b: e.target.value })} placeholder="Alternatif konu satırı — kişilerin yarısına bu gönderilir" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <>
                            <div className="audience-section">
                                <h4>Listeler</h4>
                                {lists.length === 0 ? (
                                    <div className="muted-tip">Liste yok. <Link to="/admin/crm/lists">Listeler</Link> sayfasında oluşturabilirsiniz.</div>
                                ) : (
                                    <div className="audience-grid">
                                        {lists.map(l => (
                                            <label key={l.id} className="audience-card">
                                                <input type="checkbox" checked={form.target_list_ids.includes(l.id)} onChange={() => toggleList(l.id)} />
                                                <div>
                                                    <div className="ac-name">{l.name}</div>
                                                    <div className="ac-meta">{l.type === 'smart' ? 'Smart' : 'Static'} · {l.contact_count} kişi</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="audience-section">
                                <h4>Etiketler</h4>
                                {tags.length === 0 ? (
                                    <div className="muted-tip">Etiket yok.</div>
                                ) : (
                                    <div className="tag-grid">
                                        {tags.map(t => (
                                            <button key={t.id} type="button"
                                                className={`tag-toggle ${form.target_tag_slugs.includes(t.slug) ? 'on' : ''}`}
                                                style={form.target_tag_slugs.includes(t.slug) ? { background: t.color + '22', color: t.color, borderColor: t.color } : {}}
                                                onClick={() => toggleTag(t.slug)}
                                            >
                                                {t.name} · {t.contact_count}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <label>Durum filtresi</label>
                                <select value={form.target_status} onChange={(e) => setForm({ ...form, target_status: e.target.value })}>
                                    <option value="subscribed">Abone (subscribed) — varsayılan</option>
                                    <option value="pending">Beklemede</option>
                                </select>
                            </div>

                            <div className="audience-preview">
                                <span>Tahmini hedef kitle:</span>
                                <span className="audience-num">{audienceCount === null ? '—' : audienceCount.toLocaleString('tr-TR')} kişi</span>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="schedule-step">
                            <div className="step-intro">
                                <h4><HiClock /> Kampanyayı Ne Zaman Göndermek İstiyorsunuz?</h4>
                                <p>İki seçenekten birini seçin: hemen taslak olarak kaydet ya da belirli bir tarihe zamanla.</p>
                            </div>

                            <div className="schedule-options">
                                <button
                                    type="button"
                                    className={`schedule-opt ${form.send_mode === 'manual' ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, send_mode: 'manual' })}
                                >
                                    <div className="schedule-opt-icon">📝</div>
                                    <div>
                                        <div className="schedule-opt-title">Taslak Olarak Kaydet</div>
                                        <div className="schedule-opt-desc">Daha sonra detay sayfasından manuel gönder.</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className={`schedule-opt ${form.send_mode === 'scheduled' ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, send_mode: 'scheduled' })}
                                >
                                    <div className="schedule-opt-icon">⏰</div>
                                    <div>
                                        <div className="schedule-opt-title">Belirli Bir Zamanda Gönder</div>
                                        <div className="schedule-opt-desc">İleri tarih + saat seç — sistem otomatik gönderir.</div>
                                    </div>
                                </button>
                            </div>

                            {form.send_mode === 'scheduled' && (
                                <div className="schedule-pickers active">
                                    <label className="big-label"><HiClock /> Gönderim Tarihi ve Saati <span className="req">*</span></label>
                                    <input
                                        type="datetime-local"
                                        value={form.scheduled_at}
                                        min={(() => {
                                            const d = new Date(Date.now() + 5 * 60 * 1000);
                                            const pad = (n: number) => String(n).padStart(2, '0');
                                            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                        })()}
                                        onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                                        className="datetime-input-big"
                                    />
                                    <div className="schedule-quick">
                                        <span>Hızlı seçim:</span>
                                        {[
                                            { label: '1 saat sonra', minutes: 60 },
                                            { label: 'Yarın 09:00', tomorrow9: true },
                                            { label: 'Pazartesi 10:00', monday10: true },
                                            { label: '1 hafta sonra', minutes: 7 * 24 * 60 },
                                        ].map((preset: any, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className="quick-btn"
                                                onClick={() => {
                                                    let target: Date;
                                                    if (preset.tomorrow9) {
                                                        target = new Date();
                                                        target.setDate(target.getDate() + 1);
                                                        target.setHours(9, 0, 0, 0);
                                                    } else if (preset.monday10) {
                                                        target = new Date();
                                                        const day = target.getDay();
                                                        const diff = (8 - day) % 7 || 7;
                                                        target.setDate(target.getDate() + diff);
                                                        target.setHours(10, 0, 0, 0);
                                                    } else {
                                                        target = new Date(Date.now() + (preset.minutes || 60) * 60 * 1000);
                                                    }
                                                    const pad = (n: number) => String(n).padStart(2, '0');
                                                    const iso = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
                                                    setForm({ ...form, scheduled_at: iso });
                                                }}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                    {form.scheduled_at && (
                                        <div className="schedule-preview">
                                            ✓ Kampanya <b>{new Date(form.scheduled_at).toLocaleString('tr-TR', {
                                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}</b> tarihinde otomatik gönderilecek.
                                            {(() => {
                                                const diffMs = new Date(form.scheduled_at).getTime() - Date.now();
                                                if (diffMs < 0) return null;
                                                const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                                                const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                                                return <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>
                                                    ⏱ {days > 0 ? `${days} gün ` : ''}{hours} saat sonra
                                                </div>;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {form.send_mode === 'manual' && (
                                <div className="manual-info">
                                    📝 Kampanya <b>taslak</b> olarak kaydedilecek. Detay sayfasından dilediğiniz zaman "Kuyruğa Al" butonuna basıp gönderebilir, ya da daha sonra zamanlayabilirsiniz.
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="confirm-summary">
                            <h4>📋 Özet</h4>
                            <dl>
                                <dt>İsim</dt><dd>{form.name}</dd>
                                <dt>Konu</dt><dd>{form.subject}{form.ab_enabled && <> + Konu B: <code>{form.ab_subject_b}</code></>}</dd>
                                <dt>Gönderici</dt><dd>{form.from_name || '(varsayılan)'} · {form.from_email || '(ayarlardan)'}</dd>
                                <dt>Listeler</dt><dd>{form.target_list_ids.length}</dd>
                                <dt>Etiketler</dt><dd>{form.target_tag_slugs.length}</dd>
                                <dt>A/B Testi</dt><dd>{form.ab_enabled ? '✓ Aktif (50/50)' : '— Kapalı'}</dd>
                                <dt>Hedef sayı</dt><dd><b>{audienceCount === null ? '—' : audienceCount.toLocaleString('tr-TR')} kişi</b></dd>
                                <dt>Gönderim</dt>
                                <dd>
                                    {form.send_mode === 'scheduled' && form.scheduled_at ? (
                                        <span className="schedule-badge">
                                            ⏰ {new Date(form.scheduled_at).toLocaleString('tr-TR', {
                                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    ) : (
                                        <span className="manual-badge">📝 Taslak — manuel başlatılacak</span>
                                    )}
                                </dd>
                            </dl>
                            <div className="confirm-tip">
                                {form.send_mode === 'scheduled'
                                    ? '⏰ Kampanya zamanlandı durumda kaydedilecek; belirlediğiniz saatte otomatik başlayacak.'
                                    : '📝 Kampanya taslak olarak kaydedilecek; detay sayfasından "Kuyruğa Al" butonuyla başlatabilirsiniz.'}
                            </div>
                        </div>
                    )}

                    {error && <div className="error-banner">{error}</div>}

                    <div className="modal-actions">
                        {step > 1 && <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1 as 1 | 2 | 3)}>← Geri</button>}
                        <div style={{ flex: 1 }} />
                        <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
                        {step < 4 ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={step === 3 && form.send_mode === 'scheduled' && !form.scheduled_at}
                                onClick={() => setStep((step + 1) as 2 | 3 | 4)}
                            >
                                İleri →
                            </button>
                        ) : (
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting
                                    ? 'Kaydediliyor…'
                                    : form.send_mode === 'scheduled'
                                        ? '⏰ Zamanla ve Kaydet'
                                        : '📝 Taslak Olarak Kaydet'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

function CampaignsStyles() {
    return (
        <style>{`
            .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; }
            .ab-pill { display: inline-block; margin-left: 8px; padding: 2px 8px; background: #fef3c7; color: #a16207; border-radius: 10px; font-size: 11px; font-weight: 700; }
            .status-pill { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; margin-right: 4px; display: inline-flex; align-items: center; text-decoration: none; }
            .icon-btn:hover { background: #f8fafc; color: #0f172a; }
            .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
            .modal-card.large { max-width: 760px; max-height: 92vh; overflow-y: auto; }
            .builder-step1 { display: flex; flex-direction: column; gap: 14px; }
            .cb-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
            .cb-section-head { display: flex; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; align-items: center; }
            .cb-section-num { width: 28px; height: 28px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
            .cb-section-head h4 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
            .cb-section-head h4 .req { color: #dc2626; font-weight: 600; }
            .cb-section-head h4 .opt { color: #94a3b8; font-weight: 400; font-size: 11px; }
            .cb-section-head p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
            .cb-section-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
            .cb-section-body.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .req { color: #dc2626; }
            .opt { color: #94a3b8; font-weight: 400; font-size: 11px; margin-left: 4px; }

            /* Designer card */
            .designer-card { border: 2px dashed #cbd5e1; border-radius: 10px; min-height: 180px; position: relative; overflow: hidden; transition: all 0.15s; }
            .designer-card.has-design { border-style: solid; border-color: #2563eb; background: white; }
            .designer-card-empty { padding: 28px 24px; text-align: center; }
            .designer-card-icon { font-size: 36px; margin-bottom: 8px; }
            .designer-card-empty h5 { margin: 0 0 6px; font-size: 15px; color: #0f172a; font-weight: 700; }
            .designer-card-empty p { margin: 0 0 16px; color: #64748b; font-size: 13px; line-height: 1.5; }
            .btn.btn-lg { padding: 11px 22px; font-size: 14px; }
            .designer-card-preview { max-height: 240px; overflow-y: auto; padding: 12px; background: #f8fafc; }
            .designer-card-preview-inner { font-size: 11px; pointer-events: none; transform-origin: top left; }
            .designer-card-overlay { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: white; border-top: 1px solid #e2e8f0; }
            .designer-card-status { font-size: 13px; color: #475569; }
            .check-dot { display: inline-block; width: 18px; height: 18px; border-radius: 50%; background: #16a34a; color: white; text-align: center; line-height: 18px; font-size: 11px; font-weight: 700; margin-right: 6px; }

            /* Merge tag chip bar */
            .merge-tag-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 10px 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; }
            .merge-tag-bar-label { font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.4px; margin-right: 4px; }
            .merge-tag-chip { background: white; padding: 3px 9px; border: 1px solid #bae6fd; border-radius: 6px; font-size: 11px; color: #0369a1; font-family: ui-monospace, monospace; cursor: help; }

            /* A/B switch */
            .ab-toggle-row { display: flex; align-items: center; gap: 12px; }
            .switch { width: 44px; height: 24px; border-radius: 12px; border: none; padding: 0; cursor: pointer; position: relative; transition: background 0.18s; flex-shrink: 0; }
            .switch.on { background: #16a34a; }
            .switch.off { background: #cbd5e1; }
            .switch-knob { position: absolute; top: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: left 0.18s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
            .switch.on .switch-knob { left: 22px; }
            .switch.off .switch-knob { left: 2px; }
            .ab-toggle-label { font-size: 14px; color: #0f172a; font-weight: 500; }

            .form-hint code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 11px; color: #2563eb; }

            @media (max-width: 600px) {
                .cb-section-body.two-cols { grid-template-columns: 1fr; }
                .schedule-options { grid-template-columns: 1fr !important; }
            }

            /* Schedule step (Step 3) */
            .schedule-step { display: flex; flex-direction: column; gap: 18px; padding: 4px 0; }
            .step-intro h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-size: 18px; color: #0f172a; }
            .step-intro h4 svg { color: #2563eb; }
            .step-intro p { margin: 0; color: #64748b; font-size: 14px; }
            .schedule-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .schedule-opt {
                display: flex; gap: 14px; align-items: flex-start; text-align: left;
                padding: 18px 16px; background: white; border: 2px solid #e2e8f0;
                border-radius: 12px; cursor: pointer; transition: all 0.15s;
            }
            .schedule-opt:hover { border-color: #cbd5e1; transform: translateY(-1px); }
            .schedule-opt.selected { border-color: #2563eb; background: #eff6ff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }
            .schedule-opt-icon { font-size: 32px; flex-shrink: 0; line-height: 1; }
            .schedule-opt-title { font-weight: 700; color: #0f172a; font-size: 15px; margin-bottom: 4px; }
            .schedule-opt-desc { font-size: 12px; color: #64748b; line-height: 1.4; }
            .schedule-pickers { padding: 18px; background: #fffbeb; border: 2px solid #fcd34d; border-radius: 12px; }
            .schedule-pickers.active { animation: pulseSch 0.5s ease-out; }
            @keyframes pulseSch { 0% { transform: scale(0.98); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
            .schedule-pickers > label.big-label { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: #78350f; margin-bottom: 10px; }
            .schedule-pickers > label.big-label svg { font-size: 18px; }
            .datetime-input-big {
                width: 100%; padding: 14px 16px; border: 2px solid #f59e0b;
                border-radius: 10px; font-size: 16px; font-family: inherit;
                background: white; font-weight: 600; color: #0f172a;
                box-sizing: border-box;
            }
            .datetime-input-big:focus { outline: none; border-color: #d97706; box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15); }
            .manual-info { padding: 14px 16px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; color: #475569; font-size: 14px; line-height: 1.5; }
            .schedule-badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #78350f; border-radius: 14px; font-weight: 600; font-size: 13px; }
            .manual-badge { display: inline-block; padding: 4px 10px; background: #f1f5f9; color: #475569; border-radius: 14px; font-weight: 500; font-size: 13px; }
            .schedule-quick { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; align-items: center; }
            .schedule-quick > span { font-size: 11px; color: #64748b; margin-right: 4px; }
            .quick-btn {
                background: white; border: 1px solid #cbd5e1; color: #475569;
                padding: 4px 10px; border-radius: 12px; font-size: 11px; cursor: pointer;
            }
            .quick-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
            .schedule-preview {
                margin-top: 10px; padding: 10px 14px;
                background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
                color: #15803d; font-size: 13px;
            }
            .step-indicator { display: flex; gap: 4px; margin-bottom: 18px; }
            .step-indicator .step { flex: 1; padding: 8px 12px; background: #f1f5f9; color: #94a3b8; font-size: 12px; font-weight: 600; text-align: center; border-radius: 6px; }
            .step-indicator .step.active { background: #2563eb; color: white; }
            .form-hint { font-size: 12px; color: #64748b; margin-top: 4px; }
            .form-hint code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 11px; color: #2563eb; }
            .cb-label { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; }
            .audience-section { margin-bottom: 18px; }
            .audience-section h4 { margin: 0 0 8px; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            .audience-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
            .audience-card { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; align-items: center; }
            .audience-card:hover { background: #f8fafc; }
            .audience-card .ac-name { font-weight: 600; color: #0f172a; font-size: 13px; }
            .audience-card .ac-meta { font-size: 11px; color: #64748b; }
            .tag-grid { display: flex; flex-wrap: wrap; gap: 6px; }
            .tag-toggle { padding: 5px 12px; border-radius: 14px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-size: 13px; }
            .tag-toggle.on { font-weight: 600; }
            .audience-preview { display: flex; justify-content: space-between; padding: 14px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; align-items: center; }
            .audience-num { font-weight: 700; color: #1d4ed8; font-size: 18px; }
            .confirm-summary dl { display: grid; grid-template-columns: 130px 1fr; gap: 8px 12px; font-size: 14px; }
            .confirm-summary dt { color: #64748b; font-weight: 600; }
            .confirm-summary dd { margin: 0; color: #0f172a; }
            .confirm-summary code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
            .confirm-tip { margin-top: 14px; padding: 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; font-size: 13px; color: #78350f; }
            .muted-tip { color: #94a3b8; font-style: italic; font-size: 13px; }
            .muted-tip a { color: #2563eb; }
            .row-link { color: #2563eb; font-weight: 600; text-decoration: none; }
            .designer-trigger { display: flex; gap: 12px; align-items: stretch; }
            .designer-preview { flex: 1; max-height: 220px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; font-size: 12px; }
            .designer-preview-html { transform: scale(0.85); transform-origin: top left; pointer-events: none; }
            .designer-empty { color: #94a3b8; text-align: center; padding: 24px; font-style: italic; }
            .btn-designer { align-self: stretch; min-width: 180px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        `}</style>
    );
}
