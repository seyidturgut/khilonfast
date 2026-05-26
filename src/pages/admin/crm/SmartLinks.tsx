import { useEffect, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmSmartLink } from '../../../services/api';
import { HiLink, HiPlus, HiTrash, HiPencil, HiX, HiClipboardCopy, HiEye, HiCursorClick } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';
import { API_BASE_URL } from '../../../config/api';

export default function CrmSmartLinksPage() {
    const [links, setLinks] = useState<CrmSmartLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<CrmSmartLink | null>(null);
    const [form, setForm] = useState({ slug: '', target_url: '', label: '' });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [showClicksFor, setShowClicksFor] = useState<CrmSmartLink | null>(null);
    const [clicks, setClicks] = useState<any[]>([]);
    const [clicksLoading, setClicksLoading] = useState(false);

    const load = async () => {
        try {
            setLoading(true); setError('');
            const res = await crmAPI.listSmartLinks();
            setLinks(res.data?.links || []);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ slug: '', target_url: '', label: '' });
        setFormError('');
        setShowModal(true);
    };
    const openEdit = (l: CrmSmartLink) => {
        setEditing(l);
        setForm({ slug: l.slug, target_url: l.target_url, label: l.label || '' });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.target_url.trim()) { setFormError('Hedef URL zorunlu'); return; }
        try {
            setSubmitting(true);
            if (editing) {
                await crmAPI.updateSmartLink(editing.id, {
                    target_url: form.target_url.trim(),
                    label: form.label.trim() || null
                });
            } else {
                await crmAPI.createSmartLink({
                    slug: form.slug.trim() || undefined,
                    target_url: form.target_url.trim(),
                    label: form.label.trim() || undefined
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

    const handleDelete = async (l: CrmSmartLink) => {
        if (!confirm(`"${l.slug}" linki silinsin mi?`)) return;
        try { await crmAPI.deleteSmartLink(l.id); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    const toggleActive = async (l: CrmSmartLink) => {
        try { await crmAPI.updateSmartLink(l.id, { is_active: !l.is_active }); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Hata'); }
    };

    const showClicks = async (l: CrmSmartLink) => {
        setShowClicksFor(l);
        setClicksLoading(true);
        try {
            const res = await crmAPI.getSmartLinkClicks(l.id);
            setClicks(res.data?.clicks || []);
        } finally { setClicksLoading(false); }
    };

    const shortUrl = (slug: string) => {
        const base = String(API_BASE_URL).replace(/\/api\/?$/, '');
        return `${base}/api/l/${slug}`;
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Kopyalandı: ' + text);
        } catch { alert('Kopyalama başarısız'); }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiLink /> Smart Linkler</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={openCreate}><HiPlus /> Yeni Link</button>
                    </div>
                </header>

                <div className="info-banner">
                    Smart link'ler kısa URL'ler oluşturur, her tıklamayı kayıt altına alır ve kişi ID'si parametresiyle açıldığında ilgili kişinin skorunu otomatik artırır.
                    Örnek kullanım: <code>{shortUrl('promo')}?c=123</code>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Slug</th>
                                <th>Etiket</th>
                                <th>Hedef URL</th>
                                <th>Tıklama</th>
                                <th>Aktif</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="empty">Yükleniyor…</td></tr>
                            ) : links.length === 0 ? (
                                <tr><td colSpan={6} className="empty">Henüz smart link yok.</td></tr>
                            ) : links.map(l => (
                                <tr key={l.id} className={!l.is_active ? 'inactive-row' : ''}>
                                    <td>
                                        <code className="slug-code">{l.slug}</code>
                                        <button className="icon-btn" onClick={() => copyToClipboard(shortUrl(l.slug))} title="Kısa URL'yi kopyala"><HiClipboardCopy /></button>
                                    </td>
                                    <td>{l.label || '—'}</td>
                                    <td className="target-url"><a href={l.target_url} target="_blank" rel="noreferrer">{l.target_url.length > 50 ? l.target_url.slice(0, 50) + '…' : l.target_url}</a></td>
                                    <td><span className="click-pill"><HiCursorClick /> {l.click_count}</span></td>
                                    <td>
                                        <button className={`toggle-btn ${l.is_active ? 'on' : 'off'}`} onClick={() => toggleActive(l)}>
                                            <span className="toggle-knob" />
                                        </button>
                                    </td>
                                    <td>
                                        <button className="icon-btn" onClick={() => showClicks(l)} title="Tıklamaları gör"><HiEye /></button>
                                        <button className="icon-btn" onClick={() => openEdit(l)} title="Düzenle"><HiPencil /></button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(l)} title="Sil"><HiTrash /></button>
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
                                <h3>{editing ? 'Linki Düzenle' : 'Yeni Smart Link'}</h3>
                                <button onClick={() => setShowModal(false)}><HiX /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {!editing && (
                                    <div className="form-row">
                                        <label>Slug (boş bırakılırsa otomatik üretilir)</label>
                                        <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })} placeholder="promo, may2026, vip" />
                                    </div>
                                )}
                                <div className="form-row">
                                    <label>Hedef URL *</label>
                                    <input type="url" required value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} placeholder="https://khilon.com/promo" />
                                </div>
                                <div className="form-row">
                                    <label>Etiket (admin için açıklama)</label>
                                    <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Mayıs 2026 Kampanyası" />
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

                {showClicksFor && (
                    <div className="modal-overlay" onClick={() => setShowClicksFor(null)}>
                        <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Tıklamalar — {showClicksFor.slug}</h3>
                                <button onClick={() => setShowClicksFor(null)}><HiX /></button>
                            </div>
                            <div className="modal-body">
                                {clicksLoading ? (
                                    <div className="empty">Yükleniyor…</div>
                                ) : clicks.length === 0 ? (
                                    <div className="empty">Henüz tıklama yok.</div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Kişi / Anon</th>
                                                <th>IP</th>
                                                <th>Tarih</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clicks.map(c => (
                                                <tr key={c.id}>
                                                    <td>{c.contact_email || c.anonymous_id || '—'}</td>
                                                    <td className="muted">{c.ip}</td>
                                                    <td className="muted">{new Date(c.clicked_at).toLocaleString('tr-TR')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <CrmPageStyles />
            <style>{`
                .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; }
                .info-banner code { background: white; padding: 1px 6px; border-radius: 4px; }
                .slug-code { background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 12px; color: #2563eb; margin-right: 6px; }
                .click-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: #f1f5f9; color: #475569; border-radius: 10px; font-size: 12px; font-weight: 600; }
                .target-url a { color: #64748b; text-decoration: none; }
                .target-url a:hover { color: #2563eb; text-decoration: underline; }
                .inactive-row { opacity: 0.5; }
                .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; margin-right: 4px; }
                .icon-btn:hover { background: #f8fafc; color: #0f172a; }
                .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                .toggle-btn { width: 38px; height: 22px; border-radius: 11px; border: none; padding: 0; cursor: pointer; position: relative; }
                .toggle-btn.on { background: #16a34a; }
                .toggle-btn.off { background: #cbd5e1; }
                .toggle-knob { position: absolute; top: 2px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: left 0.15s; }
                .toggle-btn.on .toggle-knob { left: 18px; }
                .toggle-btn.off .toggle-knob { left: 2px; }
                .modal-card.large { max-width: 720px; }
                .modal-body { max-height: 60vh; overflow-y: auto; }
            `}</style>
        </AdminLayout>
    );
}
