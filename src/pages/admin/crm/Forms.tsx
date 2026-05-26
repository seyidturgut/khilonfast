import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmForm } from '../../../services/api';
import { HiClipboard, HiPlus, HiTrash, HiPencil, HiX, HiCode } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';
import { API_BASE_URL } from '../../../config/api';

export default function CrmFormsPage() {
    const [forms, setForms] = useState<CrmForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [embedFor, setEmbedFor] = useState<CrmForm | null>(null);
    const [createForm, setCreateForm] = useState({ name: '', slug: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        try {
            setLoading(true); setError('');
            const res = await crmAPI.listForms();
            setForms(res.data?.forms || []);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.name.trim()) return;
        try {
            setSubmitting(true);
            await crmAPI.createForm({
                name: createForm.name.trim(),
                slug: createForm.slug.trim() || createForm.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                description: createForm.description.trim(),
                // Default 3 alanlı şablon
                fields: [
                    { key: 'first_name', label: 'Ad', type: 'text', required: true },
                    { key: 'email', label: 'E-posta', type: 'email', required: true },
                ],
                actions: []
            });
            setShowCreate(false);
            setCreateForm({ name: '', slug: '', description: '' });
            await load();
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Hata');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (f: CrmForm) => {
        if (!confirm(`"${f.name}" formu silinsin mi?`)) return;
        try { await crmAPI.deleteForm(f.id); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    const fmtDate = (s: string) => {
        try { return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return s; }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiClipboard /> Formlar</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><HiPlus /> Yeni Form</button>
                    </div>
                </header>

                <div className="info-banner">
                    Web sitenize yerleştirebileceğiniz iletişim, abonelik ve kayıt formları oluşturun. Form gönderildiğinde otomatik etiket/liste atayın, isteğe bağlı çift onay (double opt-in) akışıyla GDPR/KVKK uyumlu kayıt yapın.
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>İsim</th>
                                <th>Slug</th>
                                <th>Gönderim</th>
                                <th>Çift Onay</th>
                                <th>Aktif</th>
                                <th>Oluşturulma</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="empty">Yükleniyor…</td></tr>
                            ) : forms.length === 0 ? (
                                <tr><td colSpan={7} className="empty">Henüz form yok.</td></tr>
                            ) : forms.map(f => (
                                <tr key={f.id} className={!f.is_active ? 'inactive-row' : ''}>
                                    <td><Link to={`/admin/crm/forms/${f.id}`} className="row-link">{f.name}</Link></td>
                                    <td><code>{f.slug}</code></td>
                                    <td className="muted">{f.submission_count}</td>
                                    <td>{f.double_opt_in ? '✓ Aktif' : '—'}</td>
                                    <td>{f.is_active ? '✓' : '—'}</td>
                                    <td className="muted">{fmtDate(f.created_at)}</td>
                                    <td>
                                        <button className="icon-btn" onClick={() => setEmbedFor(f)} title="Embed kodu"><HiCode /></button>
                                        <Link to={`/admin/crm/forms/${f.id}`} className="icon-btn" title="Düzenle"><HiPencil /></Link>
                                        <button className="icon-btn danger" onClick={() => handleDelete(f)} title="Sil"><HiTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showCreate && (
                    <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Yeni Form</h3>
                                <button onClick={() => setShowCreate(false)}><HiX /></button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="form-row">
                                    <label>Form İsmi *</label>
                                    <input type="text" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Newsletter Aboneliği" />
                                </div>
                                <div className="form-row">
                                    <label>Slug (otomatik)</label>
                                    <input type="text" value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })} placeholder="newsletter" />
                                </div>
                                <div className="form-row">
                                    <label>Açıklama</label>
                                    <input type="text" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
                                </div>
                                <p style={{ color: '#64748b', fontSize: 13 }}>Default olarak Ad + E-posta alanlarıyla oluşturulur. Detay sayfasında alanları düzenleyebilirsiniz.</p>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>İptal</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Oluşturuluyor…' : 'Oluştur'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {embedFor && <EmbedCodeModal form={embedFor} onClose={() => setEmbedFor(null)} />}
            </div>
            <CrmPageStyles />
            <style>{`
                .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; }
                .data-table code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; color: #2563eb; }
                .inactive-row { opacity: 0.5; }
                .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; margin-right: 4px; display: inline-flex; align-items: center; text-decoration: none; }
                .icon-btn:hover { background: #f8fafc; color: #0f172a; }
                .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                .row-link { color: #2563eb; font-weight: 600; text-decoration: none; }
            `}</style>
        </AdminLayout>
    );
}

function EmbedCodeModal({ form, onClose }: { form: CrmForm; onClose: () => void }) {
    const apiBase = String(API_BASE_URL).replace(/\/api\/?$/, '');
    const formUrl = `${apiBase}/api/crm-public/form/${form.slug}`;
    const submitUrl = `${apiBase}/api/crm-public/form/${form.slug}/submit`;

    const htmlSnippet = `<!-- Khilon CRM Form: ${form.name} -->
<form id="khilon-${form.slug}" action="${submitUrl}" method="POST">
${form.fields.map(f => {
    if (f.type === 'textarea') return `  <label>${f.label}${f.required ? ' *' : ''}<br><textarea name="${f.key}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}"></textarea></label><br>`;
    if (f.type === 'select') return `  <label>${f.label}${f.required ? ' *' : ''}<br><select name="${f.key}" ${f.required ? 'required' : ''}>${(f.options || []).map(o => `<option value="${o}">${o}</option>`).join('')}</select></label><br>`;
    if (f.type === 'checkbox') return `  <label><input type="checkbox" name="${f.key}" value="1" ${f.required ? 'required' : ''}> ${f.label}</label><br>`;
    if (f.type === 'hidden') return `  <input type="hidden" name="${f.key}" value="${f.default_value || ''}">`;
    return `  <label>${f.label}${f.required ? ' *' : ''}<br><input type="${f.type}" name="${f.key}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}"></label><br>`;
}).join('\n')}
  <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
  <button type="submit">Gönder</button>
</form>
<script>
(function(){
  var form = document.getElementById('khilon-${form.slug}');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function(v, k){ data[k] = v; });
    fetch('${submitUrl}', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(function(r){ return r.json(); }).then(function(res){
      if (res.ok) {
        if (res.redirect) window.location = res.redirect;
        else form.outerHTML = '<div style="padding:20px;background:#f0fdf4;color:#15803d;border-radius:8px;">' + (res.message || 'Teşekkürler!') + '</div>';
      } else {
        alert(res.error || 'Hata oluştu');
      }
    });
  });
})();
</script>`;

    const copy = async (text: string) => {
        try { await navigator.clipboard.writeText(text); alert('Kopyalandı!'); }
        catch { alert('Kopyalama başarısız'); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Embed Kodu — {form.name}</h3>
                    <button onClick={onClose}><HiX /></button>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <h4>HTML / JavaScript Snippet</h4>
                    <p style={{ fontSize: 13, color: '#64748b' }}>Bu kodu kendi sitenize yapıştırarak formu yerleştirebilirsiniz.</p>
                    <textarea readOnly value={htmlSnippet} rows={12}
                        style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: 11, padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                    <button className="btn btn-secondary btn-sm" onClick={() => copy(htmlSnippet)} style={{ marginTop: 8 }}>Kopyala</button>
                </div>
                <div>
                    <h4>API Endpoint (GET form metadata)</h4>
                    <code style={{ display: 'block', padding: 10, background: '#f1f5f9', borderRadius: 6, fontSize: 12 }}>{formUrl}</code>
                </div>
                <div style={{ marginTop: 14 }}>
                    <h4>Submit Endpoint (POST)</h4>
                    <code style={{ display: 'block', padding: 10, background: '#f1f5f9', borderRadius: 6, fontSize: 12 }}>{submitUrl}</code>
                </div>
            </div>
        </div>
    );
}
