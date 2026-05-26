import { useEffect, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmScoreRule } from '../../../services/api';
import { HiLightningBolt, HiPlus, HiTrash, HiPencil, HiX } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

const EVENT_TYPE_HINTS: Record<string, string> = {
    email_opened: 'E-posta açıldı (Brevo webhook)',
    email_clicked: 'E-posta linkine tıklandı',
    email_bounced: 'E-posta bounce',
    email_spam: 'Spam şikayeti',
    email_unsubscribed: 'Listeden çıkış',
    order_completed: 'Sipariş tamamlandı',
    order_failed: 'Sipariş başarısız',
    form_submitted: 'Form gönderdi',
    booking_created: 'Rezervasyon oluşturdu',
    onboarding_submitted: 'Onboarding doldurdu',
    web_page_visited: 'Sayfa ziyareti (Faz 5)',
    consent_given: 'KVKK / GDPR onayı',
    tag_added: 'Etiket eklendi',
};

export default function CrmScoringRulesPage() {
    const [rules, setRules] = useState<CrmScoreRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<CrmScoreRule | null>(null);
    const [form, setForm] = useState({
        rule_key: '', label: '', event_type: '', points: 0, decay_days: 0, is_active: true
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const load = async () => {
        try {
            setLoading(true); setError('');
            const res = await crmAPI.listScoringRules();
            setRules(res.data?.rules || []);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ rule_key: '', label: '', event_type: '', points: 0, decay_days: 0, is_active: true });
        setFormError('');
        setShowModal(true);
    };
    const openEdit = (r: CrmScoreRule) => {
        setEditing(r);
        setForm({
            rule_key: r.rule_key, label: r.label, event_type: r.event_type,
            points: r.points, decay_days: r.decay_days, is_active: r.is_active
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.label.trim() || !form.event_type.trim()) {
            setFormError('Etiket ve event_type zorunlu');
            return;
        }
        try {
            setSubmitting(true);
            if (editing) {
                await crmAPI.updateScoringRule(editing.id, {
                    label: form.label.trim(),
                    event_type: form.event_type.trim(),
                    points: form.points,
                    decay_days: form.decay_days,
                    is_active: form.is_active
                });
            } else {
                await crmAPI.upsertScoringRule({
                    rule_key: form.rule_key.trim() || form.event_type.trim(),
                    label: form.label.trim(),
                    event_type: form.event_type.trim(),
                    points: form.points,
                    decay_days: form.decay_days,
                    is_active: form.is_active
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

    const toggleActive = async (r: CrmScoreRule) => {
        try {
            await crmAPI.updateScoringRule(r.id, { is_active: !r.is_active });
            await load();
        } catch (e: any) { alert(e?.response?.data?.error || 'Hata'); }
    };

    const handleDelete = async (r: CrmScoreRule) => {
        if (!confirm(`"${r.label}" kuralı silinsin mi?`)) return;
        try { await crmAPI.deleteScoringRule(r.id); await load(); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiLightningBolt /> Lead Skorlama Kuralları</div>
                    <div className="page-actions">
                        <button className="btn btn-primary" onClick={openCreate}><HiPlus /> Yeni Kural</button>
                    </div>
                </header>

                <div className="info-banner">
                    Kişi, bir olay (event) yaptığında otomatik puan alır/kaybeder. Pozitif puan = sıcak lead, negatif puan = zayıf eşleşme. Kural değişiminde geçmiş skorlar etkilenmez; bir kişinin skoru "Skor Geçmişi"nden geriye dönük yeniden hesaplanabilir.
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Etiket</th>
                                <th>event_type</th>
                                <th>Puan</th>
                                <th>Decay</th>
                                <th>Aktif</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="empty">Yükleniyor…</td></tr>
                            ) : rules.length === 0 ? (
                                <tr><td colSpan={6} className="empty">Kural yok.</td></tr>
                            ) : rules.map(r => (
                                <tr key={r.id} className={!r.is_active ? 'inactive-row' : ''}>
                                    <td><b>{r.label}</b></td>
                                    <td><code>{r.event_type}</code></td>
                                    <td>
                                        <span className={`points-pill ${r.points > 0 ? 'pos' : r.points < 0 ? 'neg' : ''}`}>
                                            {r.points > 0 ? '+' : ''}{r.points}
                                        </span>
                                    </td>
                                    <td className="muted">{r.decay_days > 0 ? `${r.decay_days}g` : '—'}</td>
                                    <td>
                                        <button
                                            className={`toggle-btn ${r.is_active ? 'on' : 'off'}`}
                                            onClick={() => toggleActive(r)}
                                            title={r.is_active ? 'Aktif (kapatmak için tıkla)' : 'Pasif'}
                                        >
                                            <span className="toggle-knob" />
                                        </button>
                                    </td>
                                    <td>
                                        <button className="icon-btn" onClick={() => openEdit(r)} title="Düzenle"><HiPencil /></button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(r)} title="Sil"><HiTrash /></button>
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
                                <h3>{editing ? 'Kuralı Düzenle' : 'Yeni Skor Kuralı'}</h3>
                                <button onClick={() => setShowModal(false)}><HiX /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>Etiket *</label>
                                    <input type="text" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <label>Event type * (örn. email_opened, order_completed)</label>
                                    <input
                                        type="text"
                                        required
                                        list="event-type-suggestions"
                                        value={form.event_type}
                                        onChange={(e) => setForm({ ...form, event_type: e.target.value.replace(/[^a-z0-9_]/g, '') })}
                                    />
                                    <datalist id="event-type-suggestions">
                                        {Object.keys(EVENT_TYPE_HINTS).map(k => <option key={k} value={k}>{EVENT_TYPE_HINTS[k]}</option>)}
                                    </datalist>
                                </div>
                                {!editing && (
                                    <div className="form-row">
                                        <label>rule_key (otomatik = event_type)</label>
                                        <input type="text" value={form.rule_key} onChange={(e) => setForm({ ...form, rule_key: e.target.value.replace(/[^a-z0-9_]/g, '') })} />
                                    </div>
                                )}
                                <div className="form-row two-col">
                                    <div>
                                        <label>Puan</label>
                                        <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label>Decay (gün, 0=yok)</label>
                                        <input type="number" min={0} value={form.decay_days} onChange={(e) => setForm({ ...form, decay_days: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label className="cb-label">
                                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                                        <span>Aktif</span>
                                    </label>
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
                .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; }
                .data-table code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; color: #2563eb; }
                .points-pill { display: inline-block; min-width: 38px; padding: 3px 10px; border-radius: 10px; background: #f1f5f9; color: #475569; font-weight: 700; text-align: center; }
                .points-pill.pos { background: #dcfce7; color: #15803d; }
                .points-pill.neg { background: #fee2e2; color: #b91c1c; }
                .inactive-row { opacity: 0.5; }
                .toggle-btn { width: 38px; height: 22px; border-radius: 11px; border: none; padding: 0; cursor: pointer; position: relative; transition: background 0.15s; }
                .toggle-btn.on { background: #16a34a; }
                .toggle-btn.off { background: #cbd5e1; }
                .toggle-knob { position: absolute; top: 2px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: left 0.15s; }
                .toggle-btn.on .toggle-knob { left: 18px; }
                .toggle-btn.off .toggle-knob { left: 2px; }
                .icon-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; color: #64748b; margin-right: 4px; }
                .icon-btn:hover { background: #f8fafc; color: #0f172a; }
                .icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                .cb-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
            `}</style>
        </AdminLayout>
    );
}
