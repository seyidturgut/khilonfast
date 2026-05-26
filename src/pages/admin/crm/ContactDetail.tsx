import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmContact, type CrmTag, type CrmList, type CrmActivityEvent, type CrmScoreHistoryItem, type CrmWebVisit } from '../../../services/api';
import { HiArrowLeft, HiSave, HiTrash, HiUser, HiMail, HiPhone, HiOfficeBuilding, HiTag, HiPlus, HiX, HiCollection, HiShoppingBag, HiShieldCheck, HiDocumentText, HiCalendar, HiMail as HiMailIcon, HiOutlineSparkles } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

const TABS = [
    { key: 'overview', label: 'Genel Bakış' },
    { key: 'timeline', label: 'Aktivite' },
    { key: 'web', label: 'Web Aktivitesi' },
    { key: 'tags', label: 'Etiketler & Listeler' },
    { key: 'custom', label: 'Özel Alanlar' },
];

export default function CrmContactDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contact, setContact] = useState<CrmContact | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [editForm, setEditForm] = useState<Partial<CrmContact>>({});
    const [saveMsg, setSaveMsg] = useState('');

    const load = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError('');
            const res = await crmAPI.getContact(id);
            const c = res.data?.contact;
            setContact(c);
            setEditForm({
                first_name: c?.first_name || '',
                last_name: c?.last_name || '',
                phone: c?.phone || '',
                company: c?.company || '',
                status: c?.status || 'subscribed',
            });
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleSave = async () => {
        if (!id) return;
        try {
            setSaving(true);
            setSaveMsg('');
            await crmAPI.updateContact(id, editForm);
            setSaveMsg('✓ Kaydedildi');
            await load();
            setTimeout(() => setSaveMsg(''), 2500);
        } catch (e: any) {
            setSaveMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !contact) return;
        if (!confirm(`"${contact.email}" CRM kaydı silinsin mi?`)) return;
        try {
            await crmAPI.deleteContact(id);
            navigate('/admin/crm/contacts');
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Silme hatası');
        }
    };

    const fmtDateTime = (s: string | null) => {
        if (!s) return '—';
        try { return new Date(s).toLocaleString('tr-TR'); } catch { return s; }
    };

    if (loading) return <AdminLayout><div className="crm-page"><div className="loading">Yükleniyor…</div></div><CrmPageStyles /></AdminLayout>;
    if (error || !contact) return (
        <AdminLayout>
            <div className="crm-page">
                <Link to="/admin/crm/contacts" className="back-link"><HiArrowLeft /> Listeye Dön</Link>
                <div className="error-banner">{error || 'Bulunamadı'}</div>
            </div>
            <CrmPageStyles />
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="crm-page">
                <Link to="/admin/crm/contacts" className="back-link"><HiArrowLeft /> Listeye Dön</Link>

                <header className="page-header">
                    <div>
                        <div className="page-title-row">
                            <div className="contact-avatar">{contact.email?.charAt(0).toUpperCase()}</div>
                            <div>
                                <div className="contact-name">{`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email}</div>
                                <div className="contact-email">{contact.email}</div>
                            </div>
                        </div>
                    </div>
                    <div className="page-actions">
                        <button className="btn btn-danger" onClick={handleDelete}><HiTrash /> Sil</button>
                    </div>
                </header>

                {/* Quick stats row */}
                <div className="quick-stats">
                    <div className="qs-item">
                        <div className="qs-label">Skor</div>
                        <div className="qs-value">{contact.score}</div>
                    </div>
                    <div className="qs-item">
                        <div className="qs-label">Durum</div>
                        <div className="qs-value">{contact.status}</div>
                    </div>
                    <div className="qs-item">
                        <div className="qs-label">Kaynak</div>
                        <div className="qs-value">{contact.source}</div>
                    </div>
                    <div className="qs-item">
                        <div className="qs-label">LTV</div>
                        <div className="qs-value">{contact.ltv.toFixed(2)} {contact.ltv_currency}</div>
                    </div>
                    <div className="qs-item">
                        <div className="qs-label">Eklenme</div>
                        <div className="qs-value muted">{fmtDateTime(contact.created_at)}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            className={`tab ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <div className="overview-grid">
                            <section className="overview-card">
                                <h3>Bilgiler</h3>
                                <div className="form-row two-col">
                                    <div>
                                        <label><HiUser /> Ad</label>
                                        <input type="text" value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label><HiUser /> Soyad</label>
                                        <input type="text" value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label><HiMail /> E-posta (değiştirilemez)</label>
                                    <input type="email" value={contact.email} disabled style={{ background: '#f8fafc' }} />
                                </div>
                                <div className="form-row">
                                    <label><HiPhone /> Telefon</label>
                                    <input type="tel" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <label><HiOfficeBuilding /> Firma</label>
                                    <input type="text" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <label>Durum</label>
                                    <select value={editForm.status as string || 'subscribed'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}>
                                        <option value="subscribed">Abone</option>
                                        <option value="unsubscribed">Çıktı</option>
                                        <option value="bounced">Bounce</option>
                                        <option value="complained">Şikayet</option>
                                        <option value="pending">Beklemede</option>
                                    </select>
                                </div>
                                <div className="form-actions">
                                    {saveMsg && <span className="save-msg">{saveMsg}</span>}
                                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                        <HiSave /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
                                    </button>
                                </div>
                            </section>

                            <section className="overview-card">
                                <ContactScorePanel contactId={Number(id)} score={contact.score} onRecomputed={load} />
                            </section>
                            <section className="overview-card">
                                <h3>Hesap Bilgileri</h3>
                                <dl className="info-list">
                                    <dt>Kullanıcı ID</dt>
                                    <dd>{contact.user_id ?? '—'} {contact.user_id ? <Link to={`/admin/users`} className="row-link">Kullanıcılar →</Link> : null}</dd>
                                    <dt>Son Aktivite</dt>
                                    <dd>{fmtDateTime(contact.last_activity_at)}</dd>
                                    <dt>Son Güncelleme</dt>
                                    <dd>{fmtDateTime(contact.updated_at)}</dd>
                                    <dt>CRM ID</dt>
                                    <dd>#{contact.id}</dd>
                                </dl>
                            </section>
                        </div>

                        <div className="next-phases-info">
                            <strong>Sonraki Fazlar:</strong> Bu kişiye ait <em>Aktivite (Timeline)</em> akışı (e-posta, sipariş, onay, brief, web ziyaret), <em>Etiketler & Listeler</em> ve <em>Özel Alanlar</em> sırayla Faz 2-3'te aktifleşecek.
                        </div>
                    </div>
                )}

                {activeTab === 'tags' && id && <ContactTagsListsTab contactId={Number(id)} />}
                {activeTab === 'timeline' && id && <ContactTimelineTab contactId={Number(id)} />}
                {activeTab === 'web' && id && <ContactWebActivityTab contactId={Number(id)} />}
                {activeTab === 'custom' && id && contact && (
                    <ContactCustomFieldsTab contact={contact} onSaved={load} />
                )}
            </div>
            <CrmPageStyles />
            <style>{`
                .back-link { display: inline-flex; align-items: center; gap: 6px; color: #64748b; text-decoration: none; margin-bottom: 14px; font-size: 14px; }
                .back-link:hover { color: #0f172a; }
                .page-title-row { display: flex; align-items: center; gap: 14px; }
                .contact-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #0f172a, #2563eb); color: white; font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
                .contact-name { font-size: 20px; font-weight: 700; color: #0f172a; }
                .contact-email { color: #64748b; font-size: 14px; }
                .quick-stats { display: flex; gap: 24px; padding: 16px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 18px; flex-wrap: wrap; }
                .qs-item { display: flex; flex-direction: column; gap: 2px; }
                .qs-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
                .qs-value { font-size: 16px; font-weight: 700; color: #0f172a; }
                .tabs { display: flex; gap: 4px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px; }
                .tab { background: none; border: none; padding: 10px 16px; cursor: pointer; font-size: 14px; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; }
                .tab.active { color: #2563eb; border-color: #2563eb; }
                .tab:disabled { opacity: 0.5; cursor: not-allowed; font-style: italic; }
                .tab-content { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; }
                .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .overview-card h3 { margin: 0 0 14px; color: #0f172a; font-size: 16px; }
                .form-row label { display: flex; align-items: center; gap: 4px; }
                .form-actions { display: flex; gap: 10px; justify-content: flex-end; align-items: center; margin-top: 12px; }
                .save-msg { color: #15803d; font-size: 13px; }
                .info-list { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; font-size: 14px; margin: 0; }
                .info-list dt { color: #64748b; font-weight: 600; }
                .info-list dd { margin: 0; color: #0f172a; }
                .next-phases-info { margin-top: 16px; padding: 12px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 13px; color: #1e40af; }
                .phase-pending { padding: 30px; text-align: center; color: #94a3b8; font-style: italic; }
                .loading { padding: 60px; text-align: center; color: #94a3b8; }
                @media (max-width: 768px) {
                    .overview-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </AdminLayout>
    );
}

// ─── Tab: Etiketler & Listeler ────────────────────────────────────────────────
function ContactTagsListsTab({ contactId }: { contactId: number }) {
    const [contactTags, setContactTags] = useState<CrmTag[]>([]);
    const [allTags, setAllTags] = useState<CrmTag[]>([]);
    const [allLists, setAllLists] = useState<CrmList[]>([]);
    const [memberships, setMemberships] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const [ctRes, tagsRes, listsRes] = await Promise.all([
                crmAPI.getContactTags(contactId),
                crmAPI.listTags(),
                crmAPI.listLists(),
            ]);
            setContactTags(ctRes.data?.tags || []);
            setAllTags(tagsRes.data?.tags || []);
            const lists: CrmList[] = listsRes.data?.lists || [];
            setAllLists(lists);
            // Static listelerde üyelik kontrolü
            const memb = new Set<number>();
            for (const l of lists) {
                if (l.type === 'static') {
                    const r = await crmAPI.getListContacts(l.id, { per_page: 200 });
                    const ids = (r.data?.contacts || []).map((c: any) => c.id);
                    if (ids.includes(contactId)) memb.add(l.id);
                }
            }
            setMemberships(memb);
        } catch (e: any) {
            // sessiz
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [contactId]);

    const addTag = async (tagId: number) => {
        try {
            setAdding(true);
            await crmAPI.addContactTags(contactId, [tagId]);
            await load();
        } finally { setAdding(false); }
    };
    const removeTag = async (tagId: number) => {
        try {
            await crmAPI.removeContactTags(contactId, [tagId]);
            await load();
        } catch (e: any) { alert(e?.response?.data?.error || 'Hata'); }
    };
    const toggleListMembership = async (list: CrmList) => {
        try {
            if (memberships.has(list.id)) {
                await crmAPI.removeFromList(list.id, [contactId]);
            } else {
                await crmAPI.addToList(list.id, [contactId]);
            }
            await load();
        } catch (e: any) { alert(e?.response?.data?.error || 'Hata'); }
    };

    const availableTags = allTags.filter(t => !contactTags.some(ct => ct.id === t.id));

    return (
        <div className="tab-content">
            {loading ? (
                <div className="phase-pending">Yükleniyor…</div>
            ) : (
                <div className="tags-lists-grid">
                    <section className="tl-card">
                        <h3><HiTag /> Etiketler</h3>
                        <div className="current-tags">
                            {contactTags.length === 0 ? (
                                <div className="muted">Henüz etiket yok.</div>
                            ) : contactTags.map(t => (
                                <span key={t.id} className="tag-pill" style={{ background: t.color + '22', color: t.color, borderColor: t.color + '55' }}>
                                    {t.name}
                                    <button onClick={() => removeTag(t.id)} title="Kaldır" className="tag-x"><HiX /></button>
                                </span>
                            ))}
                        </div>
                        {availableTags.length > 0 && (
                            <div className="add-tag-row">
                                <span className="add-label">+ Etiket ekle:</span>
                                <div className="available-tags">
                                    {availableTags.map(t => (
                                        <button
                                            key={t.id}
                                            className="add-tag-btn"
                                            onClick={() => addTag(t.id)}
                                            disabled={adding}
                                            style={{ borderColor: t.color, color: t.color }}
                                        >
                                            <HiPlus /> {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {allTags.length === 0 && (
                            <div className="muted-tip">
                                Henüz etiket tanımlanmamış. <Link to="/admin/crm/tags">Etiketler sayfasında</Link> oluşturabilirsiniz.
                            </div>
                        )}
                    </section>

                    <section className="tl-card">
                        <h3><HiCollection /> Liste Üyelikleri</h3>
                        {allLists.length === 0 ? (
                            <div className="muted-tip">Henüz liste yok. <Link to="/admin/crm/lists">Listeler sayfasında</Link> oluşturabilirsiniz.</div>
                        ) : (
                            <div className="lists-toggle">
                                {allLists.map(l => {
                                    const isStatic = l.type === 'static';
                                    const checked = memberships.has(l.id);
                                    return (
                                        <label
                                            key={l.id}
                                            className={`list-row ${isStatic ? 'static' : 'smart'} ${checked ? 'checked' : ''}`}
                                            style={{ cursor: isStatic ? 'pointer' : 'default' }}
                                        >
                                            {isStatic && (
                                                <input
                                                    type="checkbox"
                                                    className="list-checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleListMembership(l)}
                                                />
                                            )}
                                            {!isStatic && (
                                                <span className="list-icon-smart" aria-hidden>⚡</span>
                                            )}
                                            <div className="list-info">
                                                <div className="list-name">{l.name}</div>
                                                <div className="list-meta">
                                                    {isStatic ? 'Manuel üyelik' : 'Otomatik (kurallarla)'}
                                                </div>
                                            </div>
                                            <span className={`list-badge ${l.type}`}>
                                                {isStatic ? 'STATİK' : 'SMART'}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            )}
            <style>{`
                .tags-lists-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
                .tl-card h3 { margin: 0 0 12px; font-size: 15px; display: flex; align-items: center; gap: 6px; color: #0f172a; }
                .current-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
                .tag-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 14px; font-size: 13px; font-weight: 600; border: 1px solid; }
                .tag-x { background: none; border: none; color: inherit; opacity: 0.6; cursor: pointer; padding: 0 0 0 2px; display: inline-flex; }
                .tag-x:hover { opacity: 1; }
                .add-tag-row { padding-top: 10px; border-top: 1px solid #e2e8f0; }
                .add-label { font-size: 12px; color: #64748b; }
                .available-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
                .add-tag-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; background: white; border: 1px dashed; cursor: pointer; }
                .add-tag-btn:hover { background: #f8fafc; }
                .add-tag-btn:disabled { opacity: 0.5; }
                .muted { color: #94a3b8; font-style: italic; font-size: 13px; }
                .muted-tip { color: #64748b; font-size: 13px; padding: 8px 0; }
                .muted-tip a { color: #2563eb; }
                .lists-toggle { display: flex; flex-direction: column; gap: 6px; }
                .list-row {
                    display: grid;
                    grid-template-columns: 22px 1fr auto;
                    gap: 12px;
                    align-items: center;
                    padding: 10px 14px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    transition: background 0.15s, border-color 0.15s;
                }
                .list-row.static:hover { background: #f1f5f9; border-color: #cbd5e1; }
                .list-row.checked { background: #eff6ff; border-color: #bfdbfe; }
                .list-row.smart { background: #fffbeb; border-color: #fde68a; }
                .list-checkbox { width: 18px; height: 18px; margin: 0; cursor: pointer; flex-shrink: 0; accent-color: #2563eb; }
                .list-icon-smart { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #a16207; flex-shrink: 0; }
                .list-info { min-width: 0; overflow: hidden; }
                .list-name { font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .list-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
                .list-badge {
                    padding: 3px 9px;
                    border-radius: 11px;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.4px;
                    flex-shrink: 0;
                }
                .list-badge.static { background: #dbeafe; color: #1d4ed8; }
                .list-badge.smart { background: #fef3c7; color: #a16207; }
                @media (max-width: 768px) {
                    .tags-lists-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

// ─── Tab: Timeline ────────────────────────────────────────────────────────────
function ContactTimelineTab({ contactId }: { contactId: number }) {
    const [events, setEvents] = useState<CrmActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [filter, setFilter] = useState('');
    const [backfilling, setBackfilling] = useState(false);
    const [backfillMsg, setBackfillMsg] = useState('');

    const load = async (append = false) => {
        try {
            setLoading(true);
            const beforeId = append && events.length > 0 ? events[events.length - 1].id : undefined;
            const res = await crmAPI.getContactTimeline(contactId, {
                limit: 50, before_id: beforeId, type: filter || undefined
            });
            const newEvents = res.data?.events || [];
            setEvents(append ? [...events, ...newEvents] : newEvents);
            setHasMore(!!res.data?.has_more);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(false); }, [contactId, filter]);

    const handleBackfill = async () => {
        try {
            setBackfilling(true);
            setBackfillMsg('');
            const res = await crmAPI.runActivityBackfill();
            const s = res.data?.stats || {};
            setBackfillMsg(`✓ ${s.email_events || 0} e-posta + ${s.orders || 0} sipariş + ${s.consent_logs || 0} onay + ${s.onboarding_forms || 0} brief + ${s.consultant_bookings || 0} rezervasyon yüklendi (toplam ${s.total_after || 0})`);
            await load(false);
        } catch (e: any) {
            setBackfillMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setBackfilling(false);
        }
    };

    const fmtDate = (s: string) => {
        try { return new Date(s).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }); }
        catch { return s; }
    };

    const iconFor = (type: string) => {
        if (type.startsWith('email_event')) return <HiMailIcon />;
        if (type.startsWith('order')) return <HiShoppingBag />;
        if (type.startsWith('consent')) return <HiShieldCheck />;
        if (type.startsWith('onboarding')) return <HiDocumentText />;
        if (type.startsWith('booking')) return <HiCalendar />;
        return <HiOutlineSparkles />;
    };
    const colorFor = (type: string) => {
        if (type.startsWith('email_event')) return '#2563eb';
        if (type.startsWith('order')) return '#16a34a';
        if (type.startsWith('consent')) return '#9333ea';
        if (type.startsWith('onboarding')) return '#a16207';
        if (type.startsWith('booking')) return '#0891b2';
        return '#64748b';
    };

    return (
        <div className="tab-content">
            <div className="timeline-toolbar">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="">Tüm aktiviteler</option>
                    <option value="email_event">E-posta olayları</option>
                    <option value="order">Siparişler</option>
                    <option value="consent">Onaylar</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="booking">Rezervasyonlar</option>
                </select>
                <button className="btn btn-secondary btn-sm" onClick={handleBackfill} disabled={backfilling}>
                    {backfilling ? 'Yükleniyor…' : 'Geçmiş aktiviteleri içe aktar'}
                </button>
            </div>
            {backfillMsg && (
                <div className={`backfill-banner ${backfillMsg.startsWith('Hata') ? 'err' : 'ok'}`}>{backfillMsg}</div>
            )}

            {loading && events.length === 0 ? (
                <div className="phase-pending">Yükleniyor…</div>
            ) : events.length === 0 ? (
                <div className="phase-pending">
                    Henüz aktivite kaydı yok. <button className="link-btn" onClick={handleBackfill}>Geçmiş aktiviteleri içe aktar</button>
                </div>
            ) : (
                <div className="timeline">
                    {events.map((ev) => {
                        const c = colorFor(ev.type);
                        return (
                            <div key={ev.id} className="timeline-item">
                                <div className="timeline-icon" style={{ background: c + '22', color: c, borderColor: c + '55' }}>
                                    {iconFor(ev.type)}
                                </div>
                                <div className="timeline-card">
                                    <div className="timeline-head">
                                        <span className="timeline-title">{ev.title}</span>
                                        <span className="timeline-date">{fmtDate(ev.occurred_at)}</span>
                                    </div>
                                    <div className="timeline-type-badge">{ev.type}</div>
                                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                        <div className="timeline-meta">
                                            {Object.entries(ev.metadata).slice(0, 5).map(([k, v]) => (
                                                <span key={k} className="meta-chip">
                                                    <b>{k}:</b> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {hasMore && (
                        <div className="timeline-load-more">
                            <button className="btn btn-secondary btn-sm" onClick={() => load(true)} disabled={loading}>
                                {loading ? 'Yükleniyor…' : 'Daha fazla'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .timeline-toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
                .timeline-toolbar select { padding: 7px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; }
                .backfill-banner { padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; border: 1px solid; }
                .backfill-banner.ok { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
                .backfill-banner.err { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
                .timeline { display: flex; flex-direction: column; gap: 12px; }
                .timeline-item { display: flex; gap: 12px; align-items: flex-start; }
                .timeline-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid; font-size: 18px; }
                .timeline-card { flex: 1; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
                .timeline-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
                .timeline-title { font-weight: 600; color: #0f172a; font-size: 14px; }
                .timeline-date { color: #64748b; font-size: 12px; flex-shrink: 0; }
                .timeline-type-badge { display: inline-block; padding: 2px 8px; background: #f1f5f9; color: #475569; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 11px; }
                .timeline-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
                .meta-chip { background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 12px; color: #475569; }
                .timeline-load-more { display: flex; justify-content: center; padding: 12px; }
                .link-btn { background: none; border: none; color: #2563eb; cursor: pointer; padding: 0; font: inherit; text-decoration: underline; }
            `}</style>
        </div>
    );
}

// ─── Tab: Web Activity ────────────────────────────────────────────────────────
function ContactWebActivityTab({ contactId }: { contactId: number }) {
    const [visits, setVisits] = useState<CrmWebVisit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await crmAPI.getContactWebVisits(contactId);
                setVisits(res.data?.visits || []);
            } finally { setLoading(false); }
        })();
    }, [contactId]);

    const fmtDate = (s: string) => {
        try { return new Date(s).toLocaleString('tr-TR'); } catch { return s; }
    };

    return (
        <div className="tab-content">
            {loading ? (
                <div className="phase-pending">Yükleniyor…</div>
            ) : visits.length === 0 ? (
                <div className="phase-pending">
                    Henüz web ziyareti kaydı yok. Pixel kurulumu için <Link to="/admin/crm/smart-links">Smart Linkler</Link> sayfasını ziyaret edin.
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Sayfa</th>
                            <th>Kaynak</th>
                            <th>Süre</th>
                            <th>Tarih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visits.map(v => (
                            <tr key={v.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{v.title || v.path}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{v.path}</div>
                                </td>
                                <td>
                                    {v.utm_source ? (
                                        <span className="utm-pill">{v.utm_source}{v.utm_campaign ? ' · ' + v.utm_campaign : ''}</span>
                                    ) : v.referrer ? (
                                        <span className="ref-pill" title={v.referrer}>{(() => { try { return new URL(v.referrer).hostname; } catch { return 'direct'; } })()}</span>
                                    ) : '—'}
                                </td>
                                <td className="muted">{v.duration_seconds != null ? `${v.duration_seconds}s` : '—'}</td>
                                <td className="muted">{fmtDate(v.occurred_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <style>{`
                .data-table th { text-align: left; padding: 10px 12px; background: #f8fafc; font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
                .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
                .utm-pill { display: inline-block; padding: 2px 8px; background: #fef3c7; color: #a16207; border-radius: 10px; font-size: 11px; font-weight: 600; }
                .ref-pill { display: inline-block; padding: 2px 8px; background: #f1f5f9; color: #475569; border-radius: 10px; font-size: 11px; }
                .muted { color: #94a3b8; font-size: 13px; }
            `}</style>
        </div>
    );
}

// ─── Score Panel (overview tab) ───────────────────────────────────────────────
function ContactScorePanel({ contactId, score, onRecomputed }: { contactId: number; score: number; onRecomputed: () => void }) {
    const [history, setHistory] = useState<CrmScoreHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [recomputing, setRecomputing] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const res = await crmAPI.getScoreHistory(contactId);
            setHistory(res.data?.history || []);
        } catch {} finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [contactId]);

    const recompute = async () => {
        try {
            setRecomputing(true);
            await crmAPI.recomputeScore(contactId);
            onRecomputed();
            await load();
        } finally {
            setRecomputing(false);
        }
    };

    // Sparkline: son 30 history entry score_after
    const points = history.slice(0, 30).reverse();
    const max = Math.max(...points.map(p => p.score_after), 0, score);
    const min = Math.min(...points.map(p => p.score_after), 0, score);
    const range = Math.max(1, max - min);
    const w = 200; const h = 40;

    const fmtDate = (s: string) => {
        try { return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }); }
        catch { return s; }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Lead Skoru</h3>
                <button className="link-btn" onClick={recompute} disabled={recomputing} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                    {recomputing ? 'Hesaplanıyor…' : 'Geçmişten yeniden hesapla'}
                </button>
            </div>
            <div className="score-display">
                <div className={`score-num ${score > 10 ? 'hot' : score > 0 ? 'warm' : score < 0 ? 'cold' : ''}`}>{score}</div>
                <div className="score-label">{score > 10 ? '🔥 Sıcak lead' : score > 0 ? '🌡️ Ilık' : score < 0 ? '❄️ Zayıf' : '— Nötr'}</div>
            </div>
            {points.length > 1 && (
                <svg className="score-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                    <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2"
                        points={points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p.score_after - min) / range) * h}`).join(' ')}
                    />
                </svg>
            )}
            <div className="score-history">
                <h4>Son hareketler</h4>
                {loading ? (
                    <div className="muted">Yükleniyor…</div>
                ) : history.length === 0 ? (
                    <div className="muted">Henüz skor hareketi yok.</div>
                ) : (
                    <ul>
                        {history.slice(0, 8).map(h => (
                            <li key={h.id}>
                                <span className={`delta-pill ${h.delta > 0 ? 'pos' : h.delta < 0 ? 'neg' : ''}`}>
                                    {h.delta > 0 ? '+' : ''}{h.delta}
                                </span>
                                <span className="reason">{h.reason || h.rule_key}</span>
                                <span className="date muted">{fmtDate(h.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <style>{`
                .score-display { text-align: center; padding: 14px 0; }
                .score-num { font-size: 48px; font-weight: 800; line-height: 1; color: #94a3b8; }
                .score-num.hot { color: #dc2626; }
                .score-num.warm { color: #f59e0b; }
                .score-num.cold { color: #2563eb; }
                .score-label { font-size: 13px; color: #64748b; margin-top: 4px; }
                .score-sparkline { width: 100%; height: 40px; display: block; margin: 8px 0 12px; }
                .score-history h4 { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin: 8px 0 6px; }
                .score-history ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
                .score-history li { display: grid; grid-template-columns: 44px 1fr auto; gap: 8px; align-items: center; font-size: 13px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
                .score-history li:last-child { border-bottom: none; }
                .delta-pill { display: inline-block; min-width: 32px; padding: 2px 6px; border-radius: 8px; background: #f1f5f9; color: #475569; font-weight: 700; text-align: center; font-size: 11px; }
                .delta-pill.pos { background: #dcfce7; color: #15803d; }
                .delta-pill.neg { background: #fee2e2; color: #b91c1c; }
                .reason { color: #0f172a; }
                .date { font-size: 11px; }
            `}</style>
        </>
    );
}

// ─── Tab: Custom Fields ───────────────────────────────────────────────────────
function ContactCustomFieldsTab({ contact, onSaved }: { contact: CrmContact; onSaved: () => void }) {
    const [defs, setDefs] = useState<Array<{ id: number; field_key: string; label: string; type: string; options: string[] | null }>>([]);
    const [values, setValues] = useState<Record<string, unknown>>(contact.custom_fields || {});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            const res = await crmAPI.listCustomFields();
            setDefs(res.data?.fields || []);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { setValues(contact.custom_fields || {}); }, [contact]);

    const setField = (key: string, value: unknown) => setValues({ ...values, [key]: value });

    const save = async () => {
        try {
            setSaving(true);
            setSaveMsg('');
            await crmAPI.updateContact(contact.id, { custom_fields: values });
            setSaveMsg('✓ Kaydedildi');
            onSaved();
            setTimeout(() => setSaveMsg(''), 2500);
        } catch (e: any) {
            setSaveMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="tab-content"><div className="phase-pending">Yükleniyor…</div></div>;
    if (defs.length === 0) {
        return (
            <div className="tab-content">
                <div className="phase-pending">
                    Henüz özel alan tanımlanmamış. <Link to="/admin/crm/custom-fields">Özel Alanlar</Link> sayfasından oluşturabilirsiniz.
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content">
            <div className="custom-fields-grid">
                {defs.map(def => {
                    const val = values[def.field_key];
                    return (
                        <div key={def.id} className="form-row">
                            <label>{def.label} <code className="field-key">{def.field_key}</code></label>
                            {def.type === 'textarea' ? (
                                <textarea rows={3} value={String(val || '')} onChange={(e) => setField(def.field_key, e.target.value)} />
                            ) : def.type === 'number' ? (
                                <input type="number" value={String(val ?? '')} onChange={(e) => setField(def.field_key, e.target.value === '' ? null : Number(e.target.value))} />
                            ) : def.type === 'date' ? (
                                <input type="date" value={String(val || '')} onChange={(e) => setField(def.field_key, e.target.value)} />
                            ) : def.type === 'checkbox' ? (
                                <label className="cb-label">
                                    <input type="checkbox" checked={!!val} onChange={(e) => setField(def.field_key, e.target.checked)} />
                                    <span>{def.label}</span>
                                </label>
                            ) : def.type === 'select' ? (
                                <select value={String(val || '')} onChange={(e) => setField(def.field_key, e.target.value)}>
                                    <option value="">—</option>
                                    {(def.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : def.type === 'multi_select' ? (
                                <div className="multi-select">
                                    {(def.options || []).map(o => {
                                        const arr = Array.isArray(val) ? val.map(String) : [];
                                        const checked = arr.includes(o);
                                        return (
                                            <label key={o} className="cb-label">
                                                <input type="checkbox" checked={checked} onChange={(e) => {
                                                    const next = e.target.checked ? [...arr, o] : arr.filter(x => x !== o);
                                                    setField(def.field_key, next);
                                                }} />
                                                <span>{o}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <input type="text" value={String(val || '')} onChange={(e) => setField(def.field_key, e.target.value)} />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="form-actions">
                {saveMsg && <span className="save-msg">{saveMsg}</span>}
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                    <HiSave /> {saving ? 'Kaydediliyor…' : 'Özel Alanları Kaydet'}
                </button>
            </div>
            <style>{`
                .custom-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
                .field-key { font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
                .cb-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; }
                .multi-select { display: flex; flex-direction: column; gap: 4px; padding: 8px; background: #f8fafc; border-radius: 6px; }
                @media (max-width: 768px) {
                    .custom-fields-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
