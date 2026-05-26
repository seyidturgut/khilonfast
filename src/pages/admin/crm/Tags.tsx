import { useEffect, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmTag } from '../../../services/api';
import { HiTag, HiPlus, HiTrash, HiPencil, HiX } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

const PRESET_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#a16207', '#9333ea', '#0891b2', '#db2777', '#65a30d'];

export default function CrmTagsPage() {
    const [tags, setTags] = useState<CrmTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<CrmTag | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', color: '#2563eb', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const load = async () => {
        try {
            setLoading(true); setError('');
            const res = await crmAPI.listTags();
            setTags(res.data?.tags || []);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', slug: '', color: '#2563eb', description: '' });
        setFormError('');
        setShowModal(true);
    };
    const openEdit = (t: CrmTag) => {
        setEditing(t);
        setForm({ name: t.name, slug: t.slug, color: t.color, description: t.description || '' });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.name.trim()) { setFormError('İsim zorunlu'); return; }
        try {
            setSubmitting(true);
            if (editing) {
                await crmAPI.updateTag(editing.id, {
                    name: form.name.trim(),
                    color: form.color,
                    description: form.description.trim() || null
                });
            } else {
                await crmAPI.createTag({
                    name: form.name.trim(),
                    slug: form.slug.trim() || undefined,
                    color: form.color,
                    description: form.description.trim() || null
                });
            }
            setShowModal(false);
            await load();
        } catch (e: any) {
            setFormError(e?.response?.data?.error || 'Kayıt hatası');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (t: CrmTag) => {
        if (!confirm(`"${t.name}" etiketi silinsin mi? ${t.contact_count} kişiden çıkarılacak.`)) return;
        try {
            await crmAPI.deleteTag(t.id);
            await load();
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Silme hatası');
        }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiTag /> Etiketler</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={openCreate}><HiPlus /> Yeni Etiket</button>
                    </div>
                </header>

                {error && <div className="error-banner">{error}</div>}

                <div className="tags-grid">
                    {loading ? (
                        <div className="empty-tip">Yükleniyor…</div>
                    ) : tags.length === 0 ? (
                        <div className="empty-tip">Henüz etiket yok. "Yeni Etiket" ile başlayın.</div>
                    ) : tags.map(t => (
                        <div key={t.id} className="tag-card">
                            <div className="tag-card-head">
                                <span className="tag-pill" style={{ background: t.color + '22', color: t.color, borderColor: t.color + '55' }}>
                                    {t.name}
                                </span>
                                <span className="tag-count">{t.contact_count} kişi</span>
                            </div>
                            <div className="tag-slug">{t.slug}</div>
                            {t.description && <div className="tag-desc">{t.description}</div>}
                            <div className="tag-actions">
                                <button className="icon-btn" onClick={() => openEdit(t)} title="Düzenle"><HiPencil /></button>
                                <button className="icon-btn danger" onClick={() => handleDelete(t)} title="Sil"><HiTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editing ? 'Etiketi Düzenle' : 'Yeni Etiket'}</h3>
                                <button onClick={() => setShowModal(false)}><HiX /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>İsim *</label>
                                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ör: Premium" />
                                </div>
                                {!editing && (
                                    <div className="form-row">
                                        <label>Slug (URL kısa adı, boş bırakılırsa otomatik)</label>
                                        <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="premium" />
                                    </div>
                                )}
                                <div className="form-row">
                                    <label>Renk</label>
                                    <div className="color-picker">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                                                style={{ background: c }}
                                                onClick={() => setForm({ ...form, color: c })}
                                            />
                                        ))}
                                        <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label>Açıklama (opsiyonel)</label>
                                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                {formError && <div className="error-banner">{formError}</div>}
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Kaydediliyor…' : (editing ? 'Güncelle' : 'Oluştur')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <CrmPageStyles />
            <style>{`
                .tags-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
                .tag-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
                .tag-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .tag-pill { padding: 4px 12px; border-radius: 14px; font-size: 13px; font-weight: 600; border: 1px solid; }
                .tag-count { font-size: 12px; color: #64748b; }
                .tag-slug { font-family: ui-monospace, monospace; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
                .tag-desc { font-size: 13px; color: #475569; margin-bottom: 8px; }
                .tag-actions { display: flex; gap: 6px; justify-content: flex-end; }
                .icon-btn { background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; cursor: pointer; color: #64748b; }
                .icon-btn:hover { background: #f8fafc; color: #0f172a; }
                .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                .empty-tip { grid-column: 1/-1; text-align: center; padding: 50px; color: #94a3b8; background: white; border: 1px dashed #e2e8f0; border-radius: 10px; }
                .color-picker { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
                .color-swatch { width: 28px; height: 28px; border-radius: 6px; border: 2px solid transparent; cursor: pointer; }
                .color-swatch.selected { border-color: #0f172a; box-shadow: 0 0 0 2px white inset; }
                .color-picker input[type=color] { width: 36px; height: 28px; padding: 0; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; }
            `}</style>
        </AdminLayout>
    );
}
