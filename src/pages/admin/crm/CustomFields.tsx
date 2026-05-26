import { useEffect, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI } from '../../../services/api';
import { HiPlus, HiTrash, HiPencil, HiX, HiCog } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

interface FieldDef {
    id: number;
    field_key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox';
    options: string[] | null;
    sort_order: number;
}

const TYPE_LABELS: Record<string, string> = {
    text: 'Kısa metin',
    textarea: 'Uzun metin',
    number: 'Sayı',
    select: 'Tek seçim',
    multi_select: 'Çoklu seçim',
    date: 'Tarih',
    checkbox: 'Onay kutusu'
};

export default function CrmCustomFieldsPage() {
    const [fields, setFields] = useState<FieldDef[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<FieldDef | null>(null);
    const [form, setForm] = useState({
        field_key: '', label: '', type: 'text' as FieldDef['type'],
        options: '', sort_order: 0
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const load = async () => {
        try {
            setLoading(true); setError('');
            const res = await crmAPI.listCustomFields();
            setFields(res.data?.fields || []);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ field_key: '', label: '', type: 'text', options: '', sort_order: fields.length });
        setFormError('');
        setShowModal(true);
    };
    const openEdit = (f: FieldDef) => {
        setEditing(f);
        setForm({
            field_key: f.field_key, label: f.label, type: f.type,
            options: (f.options || []).join('\n'),
            sort_order: f.sort_order
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.label.trim()) { setFormError('Etiket zorunlu'); return; }
        if (!editing && !form.field_key.trim()) { setFormError('field_key zorunlu (yalnızca a-z,0-9,_)'); return; }
        try {
            setSubmitting(true);
            const opts = (form.type === 'select' || form.type === 'multi_select')
                ? form.options.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
                : null;
            await crmAPI.upsertCustomField({
                field_key: editing ? editing.field_key : form.field_key.trim(),
                label: form.label.trim(),
                type: form.type,
                options: opts,
                sort_order: form.sort_order
            });
            setShowModal(false);
            await load();
        } catch (e: any) {
            setFormError(e?.response?.data?.error || 'Kayıt hatası');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (f: FieldDef) => {
        if (!confirm(`"${f.label}" özel alanı silinsin mi? Bu alandaki kişi verileri kaybolmaz ama görünmez olur.`)) return;
        try { await crmAPI.deleteCustomField(f.id); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiCog /> Özel Alanlar</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={openCreate}><HiPlus /> Yeni Alan</button>
                    </div>
                </header>

                <div className="info-banner">
                    Özel alanlar, kişi kayıtlarına ek bilgi tutmanızı sağlar (sektör, müşteri tipi, NPS skoru vb.). Tanımlanan alanlar her kişinin "Özel Alanlar" sekmesinde düzenlenebilir.
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Etiket</th>
                                <th>field_key</th>
                                <th>Tip</th>
                                <th>Seçenekler</th>
                                <th>Sıra</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="empty">Yükleniyor…</td></tr>
                            ) : fields.length === 0 ? (
                                <tr><td colSpan={6} className="empty">Henüz özel alan yok.</td></tr>
                            ) : fields.map(f => (
                                <tr key={f.id}>
                                    <td><b>{f.label}</b></td>
                                    <td><code>{f.field_key}</code></td>
                                    <td>{TYPE_LABELS[f.type] || f.type}</td>
                                    <td className="muted">{(f.options || []).join(', ') || '—'}</td>
                                    <td>{f.sort_order}</td>
                                    <td>
                                        <button className="icon-btn" onClick={() => openEdit(f)} title="Düzenle"><HiPencil /></button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(f)} title="Sil"><HiTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editing ? 'Alanı Düzenle' : 'Yeni Özel Alan'}</h3>
                                <button onClick={() => setShowModal(false)}><HiX /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>Etiket *</label>
                                    <input type="text" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ör: Sektör" />
                                </div>
                                {!editing && (
                                    <div className="form-row">
                                        <label>field_key * (yalnızca a-z, 0-9, _)</label>
                                        <input type="text" required value={form.field_key} onChange={(e) => setForm({ ...form, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="sektor" />
                                    </div>
                                )}
                                <div className="form-row two-col">
                                    <div>
                                        <label>Tip</label>
                                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FieldDef['type'] })}>
                                            {Object.entries(TYPE_LABELS).map(([v, l]) => (
                                                <option key={v} value={v}>{l}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Sıra</label>
                                        <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                                    </div>
                                </div>
                                {(form.type === 'select' || form.type === 'multi_select') && (
                                    <div className="form-row">
                                        <label>Seçenekler (her satıra bir tane)</label>
                                        <textarea rows={5} value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="E-ticaret&#10;B2B&#10;SaaS" />
                                    </div>
                                )}
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
                .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; }
                .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; margin-right: 4px; }
                .icon-btn:hover { background: #f8fafc; color: #0f172a; }
                .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                .data-table code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; color: #2563eb; }
            `}</style>
        </AdminLayout>
    );
}
