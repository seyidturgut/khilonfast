import { useEffect, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmFunnel, type CrmFunnelStep, type CrmTag, type CrmList } from '../../../services/api';
import { HiTrendingDown, HiPlus, HiTrash, HiX, HiArrowUp, HiArrowDown, HiEye } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

const STEP_TYPES = [
    { value: 'tag', label: 'Etiketi var', placeholder: 'newsletter' },
    { value: 'list', label: 'Listede üye', placeholder: 'list_id' },
    { value: 'event', label: 'Olay yaşadı', placeholder: 'order_completed' },
    { value: 'status', label: 'Durum', placeholder: 'subscribed' },
    { value: 'min_score', label: 'Skor ≥', placeholder: '10' },
];

export default function CrmFunnelsPage() {
    const [funnels, setFunnels] = useState<CrmFunnel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [computeFor, setComputeFor] = useState<CrmFunnel | null>(null);
    const [computeResult, setComputeResult] = useState<any[] | null>(null);
    const [tags, setTags] = useState<CrmTag[]>([]);
    const [lists, setLists] = useState<CrmList[]>([]);

    const load = async () => {
        try {
            setLoading(true);
            const [fr, tr, lr] = await Promise.all([
                crmAPI.listFunnels(),
                crmAPI.listTags(),
                crmAPI.listLists(),
            ]);
            setFunnels(fr.data?.funnels || []);
            setTags(tr.data?.tags || []);
            setLists(lr.data?.lists || []);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const handleCompute = async (f: CrmFunnel) => {
        setComputeFor(f);
        setComputeResult(null);
        try {
            const res = await crmAPI.computeFunnel(f.id, 30);
            setComputeResult(res.data?.steps || []);
        } catch {}
    };

    const handleDelete = async (f: CrmFunnel) => {
        if (!confirm(`"${f.name}" funnel silinsin mi?`)) return;
        try { await crmAPI.deleteFunnel(f.id); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiTrendingDown /> Funnels</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={() => setShowBuilder(true)}><HiPlus /> Yeni Funnel</button>
                    </div>
                </header>

                <div className="info-banner">
                    Funnel, kişilerin sıralı adımlardan geçişini ölçer. Örnek: "Newsletter etiketi → form gönderdi → satın aldı". Her adımda dönüşüm yüzdesi ve drop-off hesaplanır.
                </div>

                <div className="lists-grid">
                    {loading ? (
                        <div className="empty-tip">Yükleniyor…</div>
                    ) : funnels.length === 0 ? (
                        <div className="empty-tip">Henüz funnel yok.</div>
                    ) : funnels.map(f => (
                        <div key={f.id} className="list-card">
                            <div style={{ marginBottom: 8 }}>
                                <h3 style={{ margin: 0, fontSize: 15 }}>{f.name}</h3>
                                {f.description && <p style={{ margin: '4px 0', color: '#64748b', fontSize: 13 }}>{f.description}</p>}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{f.steps.length} adım</div>
                            <div className="funnel-steps-mini">
                                {f.steps.map((s, i) => (
                                    <span key={i} className="step-chip">{s.label || s.type}</span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleCompute(f)}><HiEye /> Hesapla</button>
                                <button className="icon-btn danger" onClick={() => handleDelete(f)}><HiTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {showBuilder && <FunnelBuilder onClose={() => { setShowBuilder(false); load(); }} tags={tags} lists={lists} />}
                {computeFor && <FunnelResultModal funnel={computeFor} result={computeResult} onClose={() => { setComputeFor(null); setComputeResult(null); }} />}
            </div>
            <CrmPageStyles />
            <style>{`
                .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; }
                .lists-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
                .list-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
                .funnel-steps-mini { display: flex; flex-wrap: wrap; gap: 4px; }
                .step-chip { display: inline-flex; align-items: center; padding: 3px 8px; background: #f1f5f9; color: #475569; border-radius: 10px; font-size: 11px; }
                .step-chip:not(:last-child)::after { content: '→'; margin-left: 4px; color: #94a3b8; }
                .empty-tip { grid-column: 1/-1; padding: 50px; text-align: center; color: #94a3b8; background: white; border: 1px dashed #e2e8f0; border-radius: 10px; }
                .btn-sm { padding: 5px 10px; font-size: 12px; }
                .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; }
                .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
            `}</style>
        </AdminLayout>
    );
}

function FunnelBuilder({ onClose, tags, lists }: { onClose: () => void; tags: CrmTag[]; lists: CrmList[] }) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState<CrmFunnelStep[]>([
        { type: 'tag', value: '', label: '' },
        { type: 'event', value: 'order_completed', label: 'Satın aldı' }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [previewResult, setPreviewResult] = useState<any[] | null>(null);

    const addStep = () => setSteps([...steps, { type: 'tag', value: '', label: '' }]);
    const updateStep = (idx: number, patch: Partial<CrmFunnelStep>) => {
        setSteps(steps.map((s, i) => i === idx ? { ...s, ...patch } : s));
    };
    const removeStep = (idx: number) => setSteps(steps.filter((_, i) => i !== idx));
    const moveStep = (idx: number, dir: -1 | 1) => {
        const next = [...steps];
        const swap = idx + dir;
        if (swap < 0 || swap >= next.length) return;
        [next[idx], next[swap]] = [next[swap], next[idx]];
        setSteps(next);
    };

    const preview = async () => {
        try {
            const res = await crmAPI.previewFunnel(steps, 30);
            setPreviewResult(res.data?.steps || []);
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Önizleme hatası');
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !steps.length) { setError('İsim ve en az bir adım gerekli'); return; }
        try {
            setSubmitting(true);
            await crmAPI.createFunnel({
                name: name.trim(),
                slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                description: description.trim(),
                steps
            });
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Oluşturma hatası');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Yeni Funnel</h3>
                    <button onClick={onClose}><HiX /></button>
                </div>
                <form onSubmit={submit}>
                    <div className="form-row two-col">
                        <div>
                            <label>İsim *</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Müşteri Yolculuğu" />
                        </div>
                        <div>
                            <label>Slug</label>
                            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} />
                        </div>
                    </div>
                    <div className="form-row">
                        <label>Açıklama</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <h4 style={{ margin: '14px 0 10px' }}>Adımlar</h4>
                    <div className="steps-list">
                        {steps.map((s, idx) => (
                            <div key={idx} className="step-row">
                                <span className="step-num">{idx + 1}</span>
                                <select value={s.type} onChange={(e) => updateStep(idx, { type: e.target.value as any })}>
                                    {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {s.type === 'tag' ? (
                                    <select value={String(s.value)} onChange={(e) => updateStep(idx, { value: e.target.value })}>
                                        <option value="">— Etiket —</option>
                                        {tags.map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}
                                    </select>
                                ) : s.type === 'list' ? (
                                    <select value={String(s.value)} onChange={(e) => updateStep(idx, { value: Number(e.target.value) })}>
                                        <option value="">— Liste —</option>
                                        {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                ) : s.type === 'status' ? (
                                    <select value={String(s.value)} onChange={(e) => updateStep(idx, { value: e.target.value })}>
                                        <option value="subscribed">Abone</option>
                                        <option value="pending">Beklemede</option>
                                        <option value="unsubscribed">Çıktı</option>
                                    </select>
                                ) : (
                                    <input type="text" value={String(s.value)} onChange={(e) => updateStep(idx, { value: s.type === 'min_score' ? Number(e.target.value) : e.target.value })}
                                        placeholder={STEP_TYPES.find(t => t.value === s.type)?.placeholder} />
                                )}
                                <input type="text" value={s.label || ''} onChange={(e) => updateStep(idx, { label: e.target.value })} placeholder="Etiket (opsiyonel)" />
                                <button type="button" className="icon-btn" onClick={() => moveStep(idx, -1)} disabled={idx === 0}><HiArrowUp /></button>
                                <button type="button" className="icon-btn" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}><HiArrowDown /></button>
                                <button type="button" className="icon-btn danger" onClick={() => removeStep(idx)}><HiTrash /></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addStep} style={{ marginTop: 8 }}>
                        <HiPlus /> Adım Ekle
                    </button>

                    <div style={{ marginTop: 14, padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={preview}>
                            <HiEye /> Önizle (Son 30 gün)
                        </button>
                        {previewResult && (
                            <div style={{ marginTop: 10 }}>
                                {previewResult.map((s: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                        <span>{i + 1}. {s.label}</span>
                                        <span><b>{s.count}</b> kişi · %{s.rate_from_first} (ilk adımdan)</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <div className="error-banner" style={{ marginTop: 14 }}>{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Kaydediliyor…' : 'Funnel Oluştur'}
                        </button>
                    </div>
                </form>
                <style>{`
                    .modal-card.large { max-width: 800px; max-height: 90vh; overflow-y: auto; }
                    .steps-list { display: flex; flex-direction: column; gap: 6px; }
                    .step-row { display: grid; grid-template-columns: 30px 130px 160px 1fr 32px 32px 32px; gap: 6px; align-items: center; padding: 8px; background: #f8fafc; border-radius: 6px; }
                    .step-num { width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
                    .step-row select, .step-row input { padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
                    .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; cursor: pointer; color: #64748b; }
                    .icon-btn:hover { background: #f8fafc; color: #0f172a; }
                    .icon-btn:disabled { opacity: 0.4; }
                    .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; }
                    .btn-sm { padding: 5px 10px; font-size: 12px; }
                `}</style>
            </div>
        </div>
    );
}

function FunnelResultModal({ funnel, result, onClose }: { funnel: CrmFunnel; result: any[] | null; onClose: () => void }) {
    const maxCount = result ? Math.max(...result.map(r => r.count), 1) : 1;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{funnel.name} — Son 30 Gün</h3>
                    <button onClick={onClose}><HiX /></button>
                </div>
                {!result ? (
                    <div className="empty-tip">Hesaplanıyor…</div>
                ) : result.length === 0 ? (
                    <div className="empty-tip">Veri yok</div>
                ) : (
                    <div className="funnel-result">
                        {result.map((s: any, i: number) => (
                            <div key={i} className="funnel-row">
                                <div className="funnel-row-head">
                                    <span><b>{i + 1}.</b> {s.label}</span>
                                    <span><b>{s.count}</b> kişi</span>
                                </div>
                                <div className="funnel-bar-track">
                                    <div className="funnel-bar-fill" style={{ width: `${(s.count / maxCount) * 100}%` }}>
                                        <span>%{s.rate_from_first} (ilk adımdan)</span>
                                    </div>
                                </div>
                                {i > 0 && (
                                    <div className="funnel-drop">
                                        ↓ %{s.rate_from_prev} (önceki adımdan) · {s.drop_from_prev} kişi düştü
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <style>{`
                    .modal-card.large { max-width: 720px; }
                    .empty-tip { padding: 50px; text-align: center; color: #94a3b8; }
                    .funnel-result { display: flex; flex-direction: column; gap: 12px; padding: 10px 0; }
                    .funnel-row-head { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; }
                    .funnel-bar-track { height: 36px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
                    .funnel-bar-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #1d4ed8); display: flex; align-items: center; padding-left: 12px; color: white; font-weight: 600; font-size: 12px; min-width: 70px; }
                    .funnel-drop { margin-top: 4px; font-size: 12px; color: #dc2626; padding-left: 12px; }
                `}</style>
            </div>
        </div>
    );
}
