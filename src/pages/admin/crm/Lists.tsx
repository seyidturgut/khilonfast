import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmList, type CrmTag, type CrmListRules } from '../../../services/api';
import { HiCollection, HiPlus, HiTrash, HiPencil, HiX, HiArrowLeft, HiLightningBolt, HiClipboardList, HiSave, HiEye, HiDownload } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';
import SmartListRuleBuilder from '../../../components/admin/crm/SmartListRuleBuilder';

export default function CrmListsPage() {
    const [lists, setLists] = useState<CrmList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [form, setForm] = useState<{ name: string; slug: string; type: 'static' | 'smart'; description: string; rules: CrmListRules }>({
        name: '', slug: '', type: 'static', description: '',
        rules: { match: 'all', rules: [] }
    });
    const [tags, setTags] = useState<CrmTag[]>([]);
    const [campaigns, setCampaigns] = useState<{ id: number; name: string }[]>([]);
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [exportingId, setExportingId] = useState<number | null>(null);

    const load = async () => {
        try {
            setLoading(true); setError('');
            const [lr, tr, cr] = await Promise.all([crmAPI.listLists(), crmAPI.listTags(), crmAPI.listCampaigns()]);
            setLists(lr.data?.lists || []);
            setTags(tr.data?.tags || []);
            setCampaigns((cr.data?.campaigns || []).map((c: any) => ({ id: c.id, name: c.name })));
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setForm({ name: '', slug: '', type: 'static', description: '', rules: { match: 'all', rules: [] } });
        setFormError(''); setPreviewCount(null);
        setShowModal(true);
    };

    const handlePreview = async () => {
        try {
            const res = await crmAPI.previewList(form.rules);
            setPreviewCount(Number(res.data?.total || 0));
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Önizleme hatası');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.name.trim()) { setFormError('İsim zorunlu'); return; }
        if (form.type === 'smart' && !form.rules.rules.length) {
            setFormError('Smart liste için en az bir kural ekleyin');
            return;
        }
        try {
            setSubmitting(true);
            await crmAPI.createList({
                name: form.name.trim(),
                slug: form.slug.trim() || undefined,
                type: form.type,
                description: form.description.trim(),
                rules: form.type === 'smart' ? form.rules : undefined
            });
            setShowModal(false);
            await load();
        } catch (e: any) {
            setFormError(e?.response?.data?.error || 'Kayıt hatası');
        } finally {
            setSubmitting(false);
        }
    };

    // Listeyi CSV indir — akıllı listeler dahil (yetkili istek, token header'da gider)
    const handleExport = async (l: CrmList) => {
        try {
            setExportingId(l.id);
            const safe = (l.slug || l.name || 'liste').toString().replace(/[^\w.-]+/g, '-').toLowerCase();
            await crmAPI.downloadCsv({ list_id: l.id }, `${safe}-${new Date().toISOString().slice(0, 10)}.csv`);
        } catch (e: any) {
            alert(e?.response?.data?.error || 'CSV indirilemedi');
        } finally {
            setExportingId(null);
        }
    };

    const handleDelete = async (l: CrmList) => {
        if (!confirm(`"${l.name}" listesi silinsin mi?`)) return;
        try { await crmAPI.deleteList(l.id); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiCollection /> Listeler</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={openCreate}><HiPlus /> Yeni Liste</button>
                    </div>
                </header>

                {error && <div className="error-banner">{error}</div>}

                <div className="lists-grid">
                    {loading ? (
                        <div className="empty-tip">Yükleniyor…</div>
                    ) : lists.length === 0 ? (
                        <div className="empty-tip">Henüz liste yok.</div>
                    ) : lists.map(l => (
                        <div key={l.id} className="list-card">
                            <div className="list-card-head">
                                <div>
                                    <span className={`list-type-badge ${l.type}`}>
                                        {l.type === 'smart' ? <><HiLightningBolt /> Smart</> : <><HiClipboardList /> Static</>}
                                    </span>
                                    <Link to={`/admin/crm/lists/${l.id}`} className="list-name">{l.name}</Link>
                                </div>
                                <span className="list-count">{l.contact_count} kişi</span>
                            </div>
                            {l.description && <div className="list-desc">{l.description}</div>}
                            <div className="list-actions">
                                <Link to={`/admin/crm/lists/${l.id}`} className="btn btn-secondary btn-sm">Aç</Link>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleExport(l)}
                                    disabled={exportingId === l.id}
                                    title="Bu listeyi CSV olarak indir"
                                >
                                    <HiDownload /> {exportingId === l.id ? 'İndiriliyor…' : 'CSV'}
                                </button>
                                <button className="icon-btn danger" onClick={() => handleDelete(l)} title="Sil"><HiTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Yeni Liste</h3>
                                <button onClick={() => setShowModal(false)}><HiX /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>İsim *</label>
                                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ör: Premium Aboneler" />
                                </div>
                                <div className="form-row two-col">
                                    <div>
                                        <label>Slug (otomatik)</label>
                                        <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="premium-aboneler" />
                                    </div>
                                    <div>
                                        <label>Tip</label>
                                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'static' | 'smart' })}>
                                            <option value="static">Static — manuel ekleme</option>
                                            <option value="smart">Smart — kural tabanlı, otomatik</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label>Açıklama</label>
                                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                {form.type === 'smart' && (
                                    <div className="form-row">
                                        <label>Kurallar</label>
                                        <SmartListRuleBuilder
                                            value={form.rules}
                                            onChange={(rules) => { setForm({ ...form, rules }); setPreviewCount(null); }}
                                            availableTags={tags}
                                            availableLists={lists.map(l => ({ id: l.id, name: l.name }))}
                                            availableCampaigns={campaigns}
                                        />
                                        <div className="preview-bar">
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePreview}>
                                                <HiEye /> Önizleme
                                            </button>
                                            {previewCount !== null && (
                                                <span className="preview-result">→ {previewCount} kişi eşleşiyor</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {formError && <div className="error-banner">{formError}</div>}
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Kaydediliyor…' : 'Oluştur'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <CrmPageStyles />
            <ListsStyles />
        </AdminLayout>
    );
}

// ─── Liste Detay (üyeler) ────────────────────────────────────────────────────
export function CrmListDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [list, setList] = useState<CrmList | null>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [editingRules, setEditingRules] = useState(false);
    const [rules, setRules] = useState<CrmListRules>({ match: 'all', rules: [] });
    const [tags, setTags] = useState<CrmTag[]>([]);
    const [lists, setLists] = useState<CrmList[]>([]);
    const [campaigns, setCampaigns] = useState<{ id: number; name: string }[]>([]);
    const [savingRules, setSavingRules] = useState(false);

    const load = async () => {
        if (!id) return;
        try {
            setLoading(true); setError('');
            const [lr, cr, tr, all, camps] = await Promise.all([
                crmAPI.getList(id),
                crmAPI.getListContacts(id, { page, per_page: 50 }),
                crmAPI.listTags(),
                crmAPI.listLists(),
                crmAPI.listCampaigns()
            ]);
            const l = lr.data?.list as CrmList;
            setList(l);
            setRules(l?.rules || { match: 'all', rules: [] });
            setContacts(cr.data?.contacts || []);
            setTotal(Number(cr.data?.total || 0));
            setPages(Number(cr.data?.pages || 0));
            setTags(tr.data?.tags || []);
            setLists(all.data?.lists || []);
            setCampaigns((camps.data?.campaigns || []).map((c: any) => ({ id: c.id, name: c.name })));
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [id, page]);

    const saveRules = async () => {
        if (!id) return;
        try {
            setSavingRules(true);
            await crmAPI.updateList(id, { rules });
            setEditingRules(false);
            await load();
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Kayıt hatası');
        } finally {
            setSavingRules(false);
        }
    };

    if (!list && loading) return <AdminLayout><div className="crm-page"><div className="loading">Yükleniyor…</div></div><CrmPageStyles /></AdminLayout>;
    if (!list) return <AdminLayout><div className="crm-page"><div className="error-banner">{error || 'Bulunamadı'}</div></div><CrmPageStyles /></AdminLayout>;

    return (
        <AdminLayout>
            <div className="crm-page">
                <Link to="/admin/crm/lists" className="back-link"><HiArrowLeft /> Listelere Dön</Link>

                <header className="page-header">
                    <div>
                        <span className={`list-type-badge ${list.type}`}>
                            {list.type === 'smart' ? <><HiLightningBolt /> Smart</> : <><HiClipboardList /> Static</>}
                        </span>
                        <h1 className="list-detail-name">{list.name}</h1>
                        {list.description && <p className="list-detail-desc">{list.description}</p>}
                    </div>
                    <div className="list-stats">
                        <div className="ls-num">{list.contact_count}</div>
                        <div className="ls-label">kişi</div>
                    </div>
                </header>

                {error && <div className="error-banner">{error}</div>}

                {list.type === 'smart' && (
                    <section className="rules-section">
                        <div className="section-head">
                            <h3>Kurallar</h3>
                            {!editingRules ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingRules(true)}>
                                    <HiPencil /> Düzenle
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingRules(false); setRules(list.rules || { match: 'all', rules: [] }); }}>İptal</button>
                                    <button className="btn btn-primary btn-sm" onClick={saveRules} disabled={savingRules}>
                                        <HiSave /> {savingRules ? 'Kaydediliyor…' : 'Kaydet'}
                                    </button>
                                </div>
                            )}
                        </div>
                        {editingRules ? (
                            <SmartListRuleBuilder
                                value={rules}
                                onChange={setRules}
                                availableTags={tags}
                                availableLists={lists.filter(l => l.id !== Number(id))}
                                availableCampaigns={campaigns}
                            />
                        ) : (
                            <div className="rules-readonly">
                                <span>Kişiler şu kuralların <b>{list.rules?.match === 'any' ? 'en az birini' : 'tümünü'}</b> karşılarsa:</span>
                                <ul>
                                    {(list.rules?.rules || []).map((r, idx) => (
                                        <li key={idx}><code>{r.field}</code> {r.op} <code>{Array.isArray(r.value) ? r.value.join('-') : String(r.value)}</code></li>
                                    ))}
                                    {!(list.rules?.rules?.length) && <li className="muted">Kural yok</li>}
                                </ul>
                            </div>
                        )}
                    </section>
                )}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>E-posta</th>
                                <th>Ad Soyad</th>
                                <th>Skor</th>
                                <th>Durum</th>
                                <th>Kaynak</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.length === 0 ? (
                                <tr><td colSpan={5} className="empty">Eşleşen kişi yok.</td></tr>
                            ) : contacts.map(c => (
                                <tr key={c.id}>
                                    <td><Link to={`/admin/crm/contacts/${c.id}`} className="row-link">{c.email}</Link></td>
                                    <td>{`${c.first_name || ''} ${c.last_name || ''}`.trim() || '—'}</td>
                                    <td><span className="score-pill">{c.score}</span></td>
                                    <td>{c.status}</td>
                                    <td className="muted">{c.source}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pages > 1 && (
                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Önceki</button>
                        <span>{page} / {pages} ({total})</span>
                        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Sonraki →</button>
                    </div>
                )}
            </div>
            <CrmPageStyles />
            <ListsStyles />
        </AdminLayout>
    );
}

function ListsStyles() {
    return (
        <style>{`
            .lists-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
            .list-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
            .list-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
            .list-type-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin-right: 8px; vertical-align: middle; }
            .list-type-badge.smart { background: #fef3c7; color: #a16207; }
            .list-type-badge.static { background: #dbeafe; color: #1d4ed8; }
            .list-name { font-size: 15px; font-weight: 700; color: #0f172a; text-decoration: none; }
            .list-name:hover { color: #2563eb; }
            .list-count { font-size: 12px; color: #64748b; }
            .list-desc { font-size: 13px; color: #475569; margin-bottom: 10px; }
            .list-actions { display: flex; gap: 6px; justify-content: flex-end; }
            .btn-sm { padding: 5px 10px; font-size: 12px; }
            .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; }
            .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
            .empty-tip { grid-column: 1/-1; text-align: center; padding: 50px; color: #94a3b8; background: white; border: 1px dashed #e2e8f0; border-radius: 10px; }
            .modal-card.large { max-width: 720px; max-height: 90vh; overflow-y: auto; }
            .preview-bar { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
            .preview-result { color: #16a34a; font-weight: 600; font-size: 13px; }
            .list-detail-name { margin: 6px 0 4px; font-size: 22px; color: #0f172a; }
            .list-detail-desc { margin: 0; color: #64748b; font-size: 14px; }
            .list-stats { text-align: right; }
            .ls-num { font-size: 32px; font-weight: 700; color: #2563eb; line-height: 1; }
            .ls-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
            .rules-section { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
            .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .section-head h3 { margin: 0; font-size: 15px; }
            .rules-readonly { font-size: 13px; color: #475569; }
            .rules-readonly ul { margin: 8px 0 0; padding-left: 20px; }
            .rules-readonly code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; color: #2563eb; }
            .back-link { display: inline-flex; align-items: center; gap: 6px; color: #64748b; text-decoration: none; margin-bottom: 14px; font-size: 14px; }
        `}</style>
    );
}
