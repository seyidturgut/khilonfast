import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmForm, type CrmFormField, type CrmFormAction, type CrmTag, type CrmList } from '../../../services/api';
import { HiArrowLeft, HiPlus, HiTrash, HiSave, HiArrowUp, HiArrowDown } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

export default function CrmFormDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [form, setForm] = useState<CrmForm | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [tags, setTags] = useState<CrmTag[]>([]);
    const [lists, setLists] = useState<CrmList[]>([]);

    const load = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [fr, sr, tr, lr] = await Promise.all([
                crmAPI.getForm(id),
                crmAPI.getFormSubmissions(id),
                crmAPI.listTags(),
                crmAPI.listLists()
            ]);
            setForm(fr.data?.form || null);
            setSubmissions(sr.data?.submissions || []);
            setTags(tr.data?.tags || []);
            setLists(lr.data?.lists || []);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [id]);

    const updateForm = (patch: Partial<CrmForm>) => {
        if (form) setForm({ ...form, ...patch });
    };

    const addField = () => {
        if (!form) return;
        updateForm({ fields: [...form.fields, { key: 'field_' + (form.fields.length + 1), label: 'Yeni alan', type: 'text', required: false }] });
    };
    const updateField = (idx: number, patch: Partial<CrmFormField>) => {
        if (!form) return;
        const fields = [...form.fields];
        fields[idx] = { ...fields[idx], ...patch };
        updateForm({ fields });
    };
    const removeField = (idx: number) => {
        if (!form) return;
        updateForm({ fields: form.fields.filter((_, i) => i !== idx) });
    };
    const moveField = (idx: number, dir: -1 | 1) => {
        if (!form) return;
        const fields = [...form.fields];
        const swap = idx + dir;
        if (swap < 0 || swap >= fields.length) return;
        [fields[idx], fields[swap]] = [fields[swap], fields[idx]];
        updateForm({ fields });
    };

    const addAction = () => {
        if (!form) return;
        updateForm({ actions: [...(form.actions || []), { type: 'add_tag', tag_slug: '' }] });
    };
    const updateAction = (idx: number, patch: Partial<CrmFormAction>) => {
        if (!form) return;
        const actions = [...(form.actions || [])];
        actions[idx] = { ...actions[idx], ...patch };
        updateForm({ actions });
    };
    const removeAction = (idx: number) => {
        if (!form) return;
        updateForm({ actions: (form.actions || []).filter((_, i) => i !== idx) });
    };

    const save = async () => {
        if (!id || !form) return;
        try {
            setSaving(true);
            setSaveMsg('');
            await crmAPI.updateForm(id, {
                name: form.name,
                description: form.description,
                fields: form.fields,
                actions: form.actions,
                success_message: form.success_message,
                success_redirect: form.success_redirect,
                double_opt_in: form.double_opt_in,
                opt_in_subject: form.opt_in_subject,
                opt_in_body: form.opt_in_body,
                opt_in_redirect: form.opt_in_redirect,
                is_active: form.is_active
            });
            setSaveMsg('✓ Kaydedildi');
            await load();
            setTimeout(() => setSaveMsg(''), 2500);
        } catch (e: any) {
            setSaveMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading || !form) return <AdminLayout><div className="crm-page"><div className="loading">Yükleniyor…</div></div><CrmPageStyles /></AdminLayout>;

    return (
        <AdminLayout>
            <div className="crm-page">
                <Link to="/admin/crm/forms" className="back-link"><HiArrowLeft /> Formlara Dön</Link>

                <header className="page-header">
                    <div>
                        <h1 style={{ margin: '6px 0 4px', fontSize: 22 }}>{form.name}</h1>
                        <div style={{ color: '#64748b', fontSize: 13 }}>/{form.slug} · {form.submission_count} gönderim</div>
                    </div>
                    <div className="page-actions">
                        {saveMsg && <span style={{ color: saveMsg.startsWith('Hata') ? '#dc2626' : '#16a34a', fontSize: 13, marginRight: 10 }}>{saveMsg}</span>}
                        <button className="btn btn-primary" onClick={save} disabled={saving}>
                            <HiSave /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
                        </button>
                    </div>
                </header>

                {/* Genel ayarlar */}
                <section className="card-block">
                    <h3>Genel</h3>
                    <div className="form-row two-col">
                        <div>
                            <label>İsim</label>
                            <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} />
                        </div>
                        <div>
                            <label>Aktif</label>
                            <label className="cb-label" style={{ marginTop: 8 }}>
                                <input type="checkbox" checked={form.is_active} onChange={(e) => updateForm({ is_active: e.target.checked })} />
                                <span>Form yayında</span>
                            </label>
                        </div>
                    </div>
                    <div className="form-row">
                        <label>Açıklama</label>
                        <input type="text" value={form.description || ''} onChange={(e) => updateForm({ description: e.target.value })} />
                    </div>
                </section>

                {/* Alanlar */}
                <section className="card-block">
                    <div className="section-header">
                        <h3>Alanlar</h3>
                        <button className="btn btn-secondary btn-sm" onClick={addField}><HiPlus /> Alan Ekle</button>
                    </div>
                    {form.fields.length === 0 ? (
                        <div className="empty-tip">Henüz alan yok.</div>
                    ) : (
                        <div className="fields-list">
                            {form.fields.map((f, idx) => (
                                <div key={idx} className="field-card">
                                    <div className="field-grid">
                                        <input type="text" placeholder="Etiket" value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
                                        <input type="text" placeholder="key (a-z, _)" value={f.key} onChange={(e) => updateField(idx, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
                                        <select value={f.type} onChange={(e) => updateField(idx, { type: e.target.value as any })}>
                                            <option value="text">Kısa metin</option>
                                            <option value="email">E-posta</option>
                                            <option value="tel">Telefon</option>
                                            <option value="textarea">Uzun metin</option>
                                            <option value="select">Seçim</option>
                                            <option value="checkbox">Onay kutusu</option>
                                            <option value="hidden">Gizli</option>
                                        </select>
                                        <label className="cb-label">
                                            <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(idx, { required: e.target.checked })} />
                                            <span>Zorunlu</span>
                                        </label>
                                    </div>
                                    {f.type === 'select' && (
                                        <div className="form-row">
                                            <label>Seçenekler (her satıra bir tane)</label>
                                            <textarea rows={3} value={(f.options || []).join('\n')} onChange={(e) => updateField(idx, { options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} />
                                        </div>
                                    )}
                                    {f.type !== 'checkbox' && f.type !== 'hidden' && (
                                        <div className="form-row">
                                            <label>Placeholder</label>
                                            <input type="text" value={f.placeholder || ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} />
                                        </div>
                                    )}
                                    {f.type === 'hidden' && (
                                        <div className="form-row">
                                            <label>Varsayılan değer</label>
                                            <input type="text" value={f.default_value || ''} onChange={(e) => updateField(idx, { default_value: e.target.value })} />
                                        </div>
                                    )}
                                    <div className="field-actions">
                                        <button className="icon-btn" onClick={() => moveField(idx, -1)} disabled={idx === 0} title="Yukarı"><HiArrowUp /></button>
                                        <button className="icon-btn" onClick={() => moveField(idx, 1)} disabled={idx === form.fields.length - 1} title="Aşağı"><HiArrowDown /></button>
                                        <button className="icon-btn danger" onClick={() => removeField(idx)}><HiTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Aksiyonlar */}
                <section className="card-block">
                    <div className="section-header">
                        <h3>Gönderim Aksiyonları</h3>
                        <button className="btn btn-secondary btn-sm" onClick={addAction}><HiPlus /> Aksiyon Ekle</button>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 12px' }}>Form gönderildiğinde otomatik olarak çalışacak işlemler.</p>
                    {(form.actions || []).length === 0 ? (
                        <div className="empty-tip">Henüz aksiyon yok.</div>
                    ) : (
                        <div className="actions-list">
                            {form.actions.map((a, idx) => (
                                <div key={idx} className="action-row">
                                    <select value={a.type} onChange={(e) => updateAction(idx, { type: e.target.value as any })}>
                                        <option value="add_tag">Etiket ekle</option>
                                        <option value="add_to_list">Listeye ekle</option>
                                    </select>
                                    {a.type === 'add_tag' && (
                                        <select value={a.tag_slug || ''} onChange={(e) => updateAction(idx, { tag_slug: e.target.value })}>
                                            <option value="">— Etiket seç —</option>
                                            {tags.map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}
                                        </select>
                                    )}
                                    {a.type === 'add_to_list' && (
                                        <select value={a.list_id || ''} onChange={(e) => updateAction(idx, { list_id: Number(e.target.value) })}>
                                            <option value="">— Liste seç —</option>
                                            {lists.filter(l => l.type === 'static').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    )}
                                    <button className="icon-btn danger" onClick={() => removeAction(idx)}><HiTrash /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Gönderim sonrası */}
                <section className="card-block">
                    <h3>Gönderim Sonrası</h3>
                    <div className="form-row">
                        <label>Başarı mesajı</label>
                        <input type="text" value={form.success_message || ''} onChange={(e) => updateForm({ success_message: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <label>Yönlendirme URL'si (opsiyonel)</label>
                        <input type="url" value={form.success_redirect || ''} onChange={(e) => updateForm({ success_redirect: e.target.value })} />
                    </div>
                </section>

                {/* Double opt-in */}
                <section className="card-block">
                    <h3>Çift Onay (Double Opt-In)</h3>
                    <label className="cb-label" style={{ marginBottom: 12 }}>
                        <input type="checkbox" checked={form.double_opt_in} onChange={(e) => updateForm({ double_opt_in: e.target.checked })} />
                        <span><b>Çift onay aktif</b> — kullanıcıya onay e-postası gönderilir, link tıklayınca kayıt aktifleşir (GDPR/KVKK için önerilir).</span>
                    </label>
                    {form.double_opt_in && (
                        <>
                            <div className="form-row">
                                <label>Onay e-posta konusu</label>
                                <input type="text" value={form.opt_in_subject || ''} onChange={(e) => updateForm({ opt_in_subject: e.target.value })} placeholder="E-posta adresinizi onaylayın" />
                            </div>
                            <div className="form-row">
                                <label>Onay e-posta gövdesi (HTML)</label>
                                <textarea rows={5} value={form.opt_in_body || ''} onChange={(e) => updateForm({ opt_in_body: e.target.value })}
                                    placeholder="<p>Merhaba,</p><p>Kayıt isteğinizi onaylamak için aşağıdaki bağlantıya tıklayın:</p>" />
                            </div>
                            <div className="form-row">
                                <label>Onay sonrası yönlendirme URL'si</label>
                                <input type="url" value={form.opt_in_redirect || ''} onChange={(e) => updateForm({ opt_in_redirect: e.target.value })} />
                            </div>
                        </>
                    )}
                </section>

                {/* Submissions */}
                <section className="card-block">
                    <h3>Gönderimler ({submissions.length})</h3>
                    {submissions.length === 0 ? (
                        <div className="empty-tip">Henüz gönderim yok.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>E-posta</th>
                                    <th>Veri</th>
                                    <th>Durum</th>
                                    <th>Tarih</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.slice(0, 20).map(s => (
                                    <tr key={s.id}>
                                        <td>{s.contact_id ? <Link to={`/admin/crm/contacts/${s.contact_id}`} className="row-link">{s.email}</Link> : s.email}</td>
                                        <td className="muted" style={{ fontSize: 12 }}>
                                            {Object.entries(s.data || {}).filter(([k]) => k !== 'email').slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}
                                        </td>
                                        <td><span className={`status-pill status-${s.status}`}>{s.status}</span></td>
                                        <td className="muted">{new Date(s.created_at).toLocaleString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
            <CrmPageStyles />
            <style>{`
                .back-link { display: inline-flex; align-items: center; gap: 6px; color: #64748b; text-decoration: none; margin-bottom: 14px; font-size: 14px; }
                .card-block { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
                .card-block h3 { margin: 0 0 14px; font-size: 15px; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .section-header h3 { margin: 0; }
                .btn-sm { padding: 5px 10px; font-size: 12px; }
                .fields-list { display: flex; flex-direction: column; gap: 10px; }
                .field-card { padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; position: relative; }
                .field-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr auto; gap: 8px; align-items: center; margin-bottom: 8px; }
                .field-grid input, .field-grid select { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
                .field-actions { display: flex; gap: 4px; justify-content: flex-end; margin-top: 6px; }
                .actions-list { display: flex; flex-direction: column; gap: 8px; }
                .action-row { display: flex; gap: 8px; align-items: center; padding: 8px 10px; background: #f8fafc; border-radius: 6px; }
                .action-row select { flex: 1; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
                .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; }
                .icon-btn:hover { background: #f8fafc; color: #0f172a; }
                .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                .cb-label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
                .empty-tip { padding: 30px; text-align: center; color: #94a3b8; font-style: italic; }
                .status-pill { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
                .status-confirmed { background: #dcfce7; color: #15803d; }
                .status-pending_optin { background: #fef3c7; color: #a16207; }
                .status-spam, .status-rejected { background: #fee2e2; color: #b91c1c; }
                .row-link { color: #2563eb; font-weight: 600; text-decoration: none; }
                .muted { color: #94a3b8; }
            `}</style>
        </AdminLayout>
    );
}
