import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api, { crmAPI, type CrmCampaign, type CrmCampaignReport } from '../../../services/api';
import { HiArrowLeft, HiPaperAirplane, HiPlay, HiTrash, HiUsers, HiEye, HiCursorClick, HiX, HiPencil, HiClock, HiMinusCircle } from 'react-icons/hi';
import { useRef as useRefHook } from 'react';
import UnlayerEmailEditor, { type UnlayerEditorHandle } from '../../../components/admin/UnlayerEmailEditor';
import { CrmPageStyles } from './Contacts';

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
    draft:     { label: 'Taslak',    bg: '#f1f5f9', fg: '#475569' },
    scheduled: { label: 'Planlandı', bg: '#dbeafe', fg: '#1d4ed8' },
    sending:   { label: 'Gönderiliyor', bg: '#fef3c7', fg: '#a16207' },
    sent:      { label: 'Gönderildi', bg: '#dcfce7', fg: '#15803d' },
    paused:    { label: 'Durduruldu', bg: '#e0e7ff', fg: '#4338ca' },
    cancelled: { label: 'İptal', bg: '#fee2e2', fg: '#b91c1c' },
};

export default function CrmCampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    // ?filter=unsubscribed ile gelince (Kampanya Analitiği'ndeki "Ayrılan" linkinden)
    // alıcı tablosu doğrudan sadece abonelikten çıkanları göstersin.
    const [showOnlyUnsub, setShowOnlyUnsub] = useState(searchParams.get('filter') === 'unsubscribed');
    const [campaign, setCampaign] = useState<CrmCampaign | null>(null);
    const [report, setReport] = useState<CrmCampaignReport | null>(null);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [actionMsg, setActionMsg] = useState('');
    const [designerOpen, setDesignerOpen] = useState(false);
    const [editorReady, setEditorReady] = useState(false);
    const editorHandle = useRefHook<UnlayerEditorHandle>(null);
    const [savingDesign, setSavingDesign] = useState(false);
    const [scheduleModal, setScheduleModal] = useState(false);
    const [scheduleAt, setScheduleAt] = useState('');
    const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
    // Analitik: liste kırılımı + top linkler + saat/gün dağılımı
    const [listBreakdown, setListBreakdown] = useState<any[]>([]);
    const [topLinks, setTopLinks] = useState<any[]>([]);
    const [timeAnalysis, setTimeAnalysis] = useState<{ by_hour: number[]; by_day: number[] } | null>(null);

    const load = async () => {
        if (!id) return;
        try {
            setLoading(true); setError('');
            const [cr, rp, rs] = await Promise.all([
                crmAPI.getCampaign(id),
                crmAPI.getCampaignReport(id),
                crmAPI.getCampaignRecipients(id)
            ]);
            setCampaign(cr.data?.campaign || null);
            setReport(rp.data?.report || null);
            setRecipients(rs.data?.recipients || []);
            // Analitik (gönderimi başlamış kampanyalarda) — hata olsa da sayfayı bozmasın
            const st = cr.data?.campaign?.status;
            if (st && ['sending', 'paused', 'sent'].includes(st)) {
                try {
                    const [lb, tl, ta] = await Promise.all([
                        crmAPI.getCampaignListBreakdown(id),
                        crmAPI.getCampaignTopLinks(id),
                        crmAPI.getCampaignTimeAnalysis(id)
                    ]);
                    setListBreakdown(lb.data?.lists || []);
                    setTopLinks(tl.data?.links || []);
                    setTimeAnalysis(ta.data || null);
                } catch { /* analitik opsiyonel */ }
            }
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [id]);

    const handleEnqueue = async (dryRun: boolean) => {
        if (!id) return;
        try {
            setSending(true);
            setActionMsg('');
            // Büyük liste koruması: gerçek gönderimden önce hedef kitleyi dry-run ile say,
            // 10.000+ kişiyse admin'e tahmini süreyle birlikte onay sor.
            if (!dryRun) {
                const preview = await crmAPI.sendCampaign(id, true);
                const count = Number(preview.data?.audience_count || 0);
                if (count >= 10000) {
                    // Gerçek hızı ayarlardan oku (batch×60, saatlik limitle kısıtlı)
                    let rate = 2000;
                    try {
                        const s = await api.get('/admin/settings');
                        const batch = Math.max(1, Math.min(500, parseInt(s.data?.crm_cron_batch_size || '50') || 50));
                        const limit = Math.max(0, parseInt(s.data?.crm_hourly_send_limit || '2000') || 0);
                        rate = limit > 0 ? Math.min(batch * 60, limit) : batch * 60;
                    } catch { /* ayar okunamazsa varsayılan */ }
                    const hours = Math.ceil((count / rate) * 10) / 10;
                    const ok = window.confirm(
                        `⚠️ BÜYÜK LİSTE: Bu kampanya ${count.toLocaleString('tr-TR')} kişiye gönderilecek.\n\n` +
                        `Mevcut hız ~${rate.toLocaleString('tr-TR')} e-posta/saat → tahmini süre ~${hours} saat.\n` +
                        `(Hızı Ayarlar → CRM Kampanya Gönderim Hızı'ndan değiştirebilirsiniz.)\n\n` +
                        `İstediğiniz an "Duraklat" ile durdurabilirsiniz. Devam edilsin mi?`
                    );
                    if (!ok) { setSending(false); return; }
                }
            }
            const res = await crmAPI.sendCampaign(id, dryRun);
            const r = res.data;
            if (dryRun) {
                setActionMsg(`Önizleme: ${r.audience_count || 0} kişi hedeflenecek (gerçek gönderim yapılmadı).`);
            } else {
                setActionMsg(`Kampanya kuyruğa eklendi: ${r.queued || 0} kişi. Gönderim cron ile saatlik limit dahilinde otomatik akar.`);
                await load();
            }
        } catch (e: any) {
            setActionMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setSending(false);
        }
    };

    const handlePauseResume = async (action: 'pause' | 'resume') => {
        if (!id) return;
        if (action === 'pause' && !confirm('Gönderim duraklatılacak. Kuyrukta bekleyenler korunur; "Devam Et" deyince kaldığı yerden sürer (gönderilenlere tekrar gitmez). Onaylıyor musunuz?')) return;
        try {
            setSending(true);
            setActionMsg('');
            const res = action === 'pause' ? await crmAPI.pauseCampaign(id) : await crmAPI.resumeCampaign(id);
            setActionMsg(action === 'pause' ? '⏸ Gönderim duraklatıldı.' : '▶️ Gönderim kaldığı yerden devam ediyor (saatlik limit dahilinde).');
            void res;
            await load();
        } catch (e: any) {
            setActionMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setSending(false);
        }
    };

    const handleDispatch = async () => {
        if (!id) return;
        try {
            setSending(true);
            setActionMsg('');
            const res = await crmAPI.dispatchCampaignBatch(id, 50);
            const r = res.data;
            setActionMsg(`Bu turda gönderildi: ${r.sent || 0}, başarısız: ${r.failed || 0}, kalan: ${r.remaining || 0}.`);
            await load();
        } catch (e: any) {
            setActionMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setSending(false);
        }
    };

    const handleCreateOpenersList = async () => {
        if (!id) return;
        try {
            setSending(true);
            setActionMsg('');
            const res = await crmAPI.createOpenersList(id);
            const r = res.data;
            setActionMsg(`✓ Açanlar listesi hazır: "${r.list?.name}" (şu an ${r.opened_count ?? 0} açan). Yeni kampanyada hedef olarak seçebilirsiniz. Liste canlı — yeni açılmalar otomatik eklenir.`);
        } catch (e: any) {
            setActionMsg('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !campaign) return;
        if (!confirm(`"${campaign.name}" silinsin mi? Geri alınamaz.`)) return;
        try { await crmAPI.deleteCampaign(id); navigate('/admin/crm/campaigns'); }
        catch (e: any) { alert(e?.response?.data?.error || 'Silme hatası'); }
    };

    const saveDesign = async () => {
        if (!id || !editorHandle.current?.isReady()) return;
        try {
            setSavingDesign(true);
            const { html, design } = await editorHandle.current.export();
            await crmAPI.updateCampaign(id, {
                body_html: html,
                design_json: JSON.stringify(design)
            });
            setDesignerOpen(false);
            await load();
        } catch (e: any) {
            alert(e?.response?.data?.error || e?.message || 'Kayıt hatası');
        } finally {
            setSavingDesign(false);
        }
    };

    if (loading) return <AdminLayout><div className="crm-page"><div className="loading">Yükleniyor…</div></div><CrmPageStyles /></AdminLayout>;
    if (!campaign) return <AdminLayout><div className="crm-page"><Link to="/admin/crm/campaigns" className="back-link"><HiArrowLeft /> Kampanyalara Dön</Link><div className="error-banner">{error || 'Bulunamadı'}</div></div><CrmPageStyles /></AdminLayout>;

    // Full-screen Unlayer designer for existing campaign
    if (designerOpen && campaign) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', background: '#1a3a52', borderBottom: '1px solid #0f2236', flexShrink: 0 }}>
                    <button onClick={() => setDesignerOpen(false)} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← İptal</button>
                    <div style={{ width: 1, height: 28, background: '#334155' }} />
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{campaign.name} — Tasarım Düzenleme</span>
                    <div style={{ flex: 1 }} />
                    {!editorReady && <span style={{ fontSize: 12, color: '#64748b' }}>Editör yükleniyor…</span>}
                    <button
                        onClick={saveDesign}
                        disabled={!editorReady || savingDesign}
                        style={{
                            background: editorReady ? '#c5d63d' : '#334155',
                            color: editorReady ? '#1a3a52' : '#64748b',
                            border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 700,
                            cursor: editorReady && !savingDesign ? 'pointer' : 'default'
                        }}
                    >
                        {savingDesign ? 'Kaydediliyor…' : '💾 Tasarımı Kaydet'}
                    </button>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <UnlayerEmailEditor
                        ref={editorHandle}
                        initialDesign={campaign.design_json || null}
                        fallbackHtml={!campaign.design_json && campaign.body_html ? campaign.body_html : null}
                        preheaderText={campaign.preview_text || ''}
                        onReady={() => setEditorReady(true)}
                    />
                </div>
            </div>
        );
    }

    const s = STATUS_LABELS[campaign.status] || STATUS_LABELS.draft;
    const canSend = campaign.status === 'draft' || campaign.status === 'scheduled';
    const isSending = campaign.status === 'sending';

    return (
        <AdminLayout>
            <div className="crm-page">
                <Link to="/admin/crm/campaigns" className="back-link"><HiArrowLeft /> Kampanyalara Dön</Link>

                <header className="page-header">
                    <div>
                        <span className="status-pill" style={{ background: s.bg, color: s.fg, marginRight: 10 }}>{s.label}</span>
                        {campaign.ab_enabled && <span className="ab-pill">A/B</span>}
                        <h1 className="campaign-name">{campaign.name}</h1>
                        <div className="campaign-subject">{campaign.subject}</div>
                    </div>
                    <div className="page-actions">
                        {canSend && (
                            <>
                                <button className="btn btn-secondary" onClick={() => handleEnqueue(true)} disabled={sending}>
                                    <HiEye /> Hedef Önizle
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        // Pre-fill with current scheduled_at or now+1h
                                        let init = campaign.scheduled_at;
                                        if (!init) {
                                            const d = new Date(Date.now() + 60 * 60 * 1000);
                                            const pad = (n: number) => String(n).padStart(2, '0');
                                            init = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                        } else {
                                            // MySQL timestamp → datetime-local input format
                                            init = String(init).replace(' ', 'T').slice(0, 16);
                                        }
                                        setScheduleAt(init);
                                        setScheduleModal(true);
                                    }}
                                    disabled={sending}
                                >
                                    <HiClock /> {campaign.status === 'scheduled' ? 'Zamanlamayı Düzenle' : 'Zamanla'}
                                </button>
                                <button className="btn btn-primary" onClick={() => handleEnqueue(false)} disabled={sending}>
                                    <HiPaperAirplane /> Hemen Kuyruğa Al
                                </button>
                            </>
                        )}
                        {isSending && (
                            <>
                                <button className="btn btn-primary" onClick={handleDispatch} disabled={sending}>
                                    <HiPlay /> Batch Gönder (50)
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handlePauseResume('pause')}
                                    disabled={sending}
                                    style={{ background: '#fef3c7', color: '#a16207', border: '1px solid #fcd34d' }}
                                >
                                    ⏸ Duraklat
                                </button>
                            </>
                        )}
                        {campaign.status === 'paused' && (
                            <button
                                className="btn btn-primary"
                                onClick={() => handlePauseResume('resume')}
                                disabled={sending}
                                style={{ background: '#16a34a' }}
                            >
                                ▶️ Devam Et
                            </button>
                        )}
                        {(campaign.status === 'sent' || campaign.status === 'sending' || campaign.status === 'paused') && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleCreateOpenersList}
                                disabled={sending}
                                title="Bu kampanyayı açanlardan canlı bir akıllı liste oluşturur. Sonraki kampanyalarda hedef olarak seçebilirsiniz."
                            >
                                <HiUsers /> Açanlardan Liste Oluştur
                            </button>
                        )}
                        <button className="btn btn-danger" onClick={handleDelete}><HiTrash /> Sil</button>
                    </div>
                </header>

                {/* Scheduled banner */}
                {campaign.status === 'scheduled' && campaign.scheduled_at && (
                    <div className="schedule-banner">
                        <HiClock />
                        <div>
                            <b>Zamanlandı:</b> Bu kampanya{' '}
                            <b>{new Date(campaign.scheduled_at).toLocaleString('tr-TR', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}</b>{' '}
                            tarihinde otomatik olarak gönderilmeye başlanacak.
                        </div>
                        <button
                            className="btn btn-secondary"
                            onClick={async () => {
                                if (!id || !confirm('Zamanlama iptal edilsin mi? Kampanya tekrar taslak olur.')) return;
                                try {
                                    await crmAPI.cancelCampaignSchedule(id);
                                    await load();
                                } catch (e: any) { alert(e?.response?.data?.error || 'Hata'); }
                            }}
                            style={{ marginLeft: 'auto' }}
                        >
                            <HiX /> İptal
                        </button>
                    </div>
                )}

                {/* Schedule modal */}
                {scheduleModal && (
                    <div className="modal-overlay" onClick={() => setScheduleModal(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                            <div className="modal-header">
                                <h3><HiClock /> Kampanyayı Zamanla</h3>
                                <button onClick={() => setScheduleModal(false)}><HiX /></button>
                            </div>
                            <div className="form-row">
                                <label>Tarih ve Saat <span style={{ color: '#dc2626' }}>*</span></label>
                                <input
                                    type="datetime-local"
                                    value={scheduleAt}
                                    min={(() => {
                                        const d = new Date(Date.now() + 5 * 60 * 1000);
                                        const pad = (n: number) => String(n).padStart(2, '0');
                                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                    })()}
                                    onChange={(e) => setScheduleAt(e.target.value)}
                                    style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }}
                                />
                                <div className="schedule-quick-detail">
                                    {[
                                        { label: '1 saat sonra', minutes: 60 },
                                        { label: 'Yarın 09:00', tomorrow9: true },
                                        { label: '1 hafta sonra', minutes: 7 * 24 * 60 },
                                    ].map((preset, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            className="quick-btn"
                                            onClick={() => {
                                                let target: Date;
                                                if ('tomorrow9' in preset && preset.tomorrow9) {
                                                    target = new Date();
                                                    target.setDate(target.getDate() + 1);
                                                    target.setHours(9, 0, 0, 0);
                                                } else {
                                                    target = new Date(Date.now() + (preset.minutes || 60) * 60 * 1000);
                                                }
                                                const pad = (n: number) => String(n).padStart(2, '0');
                                                setScheduleAt(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`);
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                {scheduleAt && (
                                    <div className="schedule-preview-modal">
                                        ✓ <b>{new Date(scheduleAt).toLocaleString('tr-TR', {
                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}</b>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setScheduleModal(false)}>İptal</button>
                                <button
                                    className="btn btn-primary"
                                    disabled={!scheduleAt || scheduleSubmitting}
                                    onClick={async () => {
                                        if (!id || !scheduleAt) return;
                                        const ts = new Date(scheduleAt).getTime();
                                        if (!ts || ts <= Date.now()) { alert('Geçerli ve gelecek bir zaman seçin'); return; }
                                        try {
                                            setScheduleSubmitting(true);
                                            const d = new Date(ts);
                                            const pad = (n: number) => String(n).padStart(2, '0');
                                            const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
                                            await crmAPI.scheduleCampaign(id, iso);
                                            setScheduleModal(false);
                                            await load();
                                        } catch (e: any) {
                                            alert(e?.response?.data?.error || 'Zamanlama hatası');
                                        } finally {
                                            setScheduleSubmitting(false);
                                        }
                                    }}
                                >
                                    {scheduleSubmitting ? 'Kaydediliyor…' : '⏰ Zamanla'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {actionMsg && (
                    <div className={`action-banner ${actionMsg.startsWith('Hata') ? 'err' : 'ok'}`}>{actionMsg}</div>
                )}

                {/* Stats grid */}
                {report && (
                    <div className="stats-grid">
                        <StatCard label="Hedef" value={report.total} icon={<HiUsers />} />
                        <StatCard label="Gönderildi" value={report.sent} icon={<HiPaperAirplane />} accent="#16a34a" />
                        <StatCard label="Açıldı" value={report.opened} icon={<HiEye />} accent="#2563eb" suffix={`%${report.open_rate}`} />
                        <StatCard label="Tıklandı" value={report.clicked} icon={<HiCursorClick />} accent="#9333ea" suffix={`%${report.click_rate}`} />
                        <StatCard label="Bounce" value={report.bounced} icon={<HiX />} accent="#dc2626" suffix={`%${report.bounce_rate}`} />
                        <StatCard
                            label="Abonelikten Çıktı"
                            value={report.unsubscribed}
                            icon={<HiMinusCircle />}
                            accent="#94a3b8"
                            suffix={showOnlyUnsub ? 'listeleniyor' : 'listelemek için tıkla'}
                            onClick={() => {
                                const next = !showOnlyUnsub;
                                setShowOnlyUnsub(next);
                                setSearchParams(next ? { filter: 'unsubscribed' } : {});
                                document.getElementById('recipients-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                        />
                    </div>
                )}

                {/* A/B comparison */}
                {campaign.ab_enabled && report && (report.variant_a.sent > 0 || report.variant_b.sent > 0) && (
                    <div className="ab-card">
                        <h3>A/B Test Sonucu</h3>
                        <div className="ab-grid">
                            <div className="ab-side">
                                <div className="ab-label">Konu A</div>
                                <div className="ab-subj">{campaign.subject}</div>
                                <div className="ab-stats">
                                    <span>{report.variant_a.sent} gönderim</span>
                                    <span>{report.variant_a.opened} açıldı</span>
                                    <span className="rate-pill">%{report.variant_a.open_rate}</span>
                                </div>
                            </div>
                            <div className="ab-vs">VS</div>
                            <div className="ab-side">
                                <div className="ab-label">Konu B</div>
                                <div className="ab-subj">{campaign.ab_subject_b || '—'}</div>
                                <div className="ab-stats">
                                    <span>{report.variant_b.sent} gönderim</span>
                                    <span>{report.variant_b.opened} açıldı</span>
                                    <span className="rate-pill">%{report.variant_b.open_rate}</span>
                                </div>
                            </div>
                        </div>
                        {(report.variant_a.sent > 5 && report.variant_b.sent > 5) && (
                            <div className="ab-winner">
                                {report.variant_a.open_rate > report.variant_b.open_rate ? '🏆 Konu A önde' :
                                 report.variant_b.open_rate > report.variant_a.open_rate ? '🏆 Konu B önde' : '🤝 Eşit'}
                            </div>
                        )}
                    </div>
                )}

                {/* Liste Performansı — hangi liste daha başarılı */}
                {listBreakdown.length > 0 && (() => {
                    const best = [...listBreakdown].filter(l => l.sent > 0).sort((a, b) => b.open_rate - a.open_rate)[0];
                    return (
                        <div className="card-block">
                            <h3>📊 Liste Performansı</h3>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Liste</th><th>Gönderildi</th><th>Açıldı</th><th>Tıklandı</th><th>Bounce</th></tr>
                                    </thead>
                                    <tbody>
                                        {listBreakdown.map((l: any) => (
                                            <tr key={l.list_id} style={best && l.list_id === best.list_id ? { background: 'rgba(22,163,74,0.08)' } : undefined}>
                                                <td>{best && l.list_id === best.list_id ? '🏆 ' : ''}{l.name}</td>
                                                <td>{l.sent}</td>
                                                <td>{l.opened} <span className="rate-pill">%{l.open_rate}</span></td>
                                                <td>{l.clicked} <span className="rate-pill">%{l.click_rate}</span></td>
                                                <td>{l.bounced}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '8px 0 0' }}>
                                💡 Bir kişi birden fazla listedeyse her listesinde sayılır; 🏆 = en yüksek açılma oranı.
                            </p>
                        </div>
                    );
                })()}

                {/* En çok tıklanan linkler */}
                {topLinks.length > 0 && (
                    <div className="card-block">
                        <h3>🔗 En Çok Tıklanan Linkler</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead><tr><th>Link</th><th>Tıklama</th><th>Tekil Kişi</th></tr></thead>
                                <tbody>
                                    {topLinks.map((l: any, i: number) => (
                                        <tr key={i}>
                                            <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.link_url}>
                                                <a href={l.link_url} target="_blank" rel="noreferrer">{l.link_url}</a>
                                            </td>
                                            <td>{l.clicks}</td>
                                            <td>{l.unique_clicks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Saat/gün açılma dağılımı */}
                {timeAnalysis && timeAnalysis.by_hour.some(v => v > 0) && (() => {
                    const maxH = Math.max(...timeAnalysis.by_hour, 1);
                    const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                    const maxD = Math.max(...timeAnalysis.by_day, 1);
                    const bestHour = timeAnalysis.by_hour.indexOf(Math.max(...timeAnalysis.by_hour));
                    return (
                        <div className="card-block">
                            <h3>🕐 Açılma Zamanları <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#94a3b8' }}>(en iyi saat: {String(bestHour).padStart(2, '0')}:00)</span></h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90, marginTop: 10 }}>
                                {timeAnalysis.by_hour.map((v, h) => (
                                    <div key={h} style={{ flex: 1, textAlign: 'center' }} title={`${String(h).padStart(2, '0')}:00 — ${v} açılma`}>
                                        <div style={{ height: Math.round((v / maxH) * 70), minHeight: v > 0 ? 4 : 1, background: h === bestHour ? '#16a34a' : '#3b82f6', borderRadius: 3 }} />
                                        {h % 3 === 0 && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>{String(h).padStart(2, '0')}</div>}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                {timeAnalysis.by_day.map((v, i) => (
                                    <div key={i} style={{ flex: 1, textAlign: 'center' }} title={`${dayLabels[i]} — ${v} açılma`}>
                                        <div style={{ height: Math.max(Math.round((v / maxD) * 40), v > 0 ? 4 : 1), background: '#9333ea', borderRadius: 3 }} />
                                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{dayLabels[i]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Recipients table */}
                <div className="card-block" id="recipients-table">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <h3>Alıcılar (son 200){showOnlyUnsub && ' — sadece abonelikten çıkanlar'}</h3>
                        {showOnlyUnsub && (
                            <button
                                type="button"
                                className="btn-link"
                                onClick={() => { setShowOnlyUnsub(false); setSearchParams({}); }}
                                style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#334e68' }}
                            >
                                Filtreyi kaldır — tümünü göster
                            </button>
                        )}
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>E-posta</th>
                                    <th>Variant</th>
                                    <th>Durum</th>
                                    <th>Gönderim</th>
                                    <th>Açılma</th>
                                    <th>Tıklama</th>
                                    <th>Abonelikten Çıktı</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const displayed = showOnlyUnsub ? recipients.filter(r => r.unsubscribed_at) : recipients;
                                    if (displayed.length === 0) {
                                        return <tr><td colSpan={7} className="empty">{showOnlyUnsub ? 'Bu kampanyadan henüz kimse abonelikten çıkmadı.' : 'Henüz alıcı yok. Kampanyayı kuyruğa alın.'}</td></tr>;
                                    }
                                    return displayed.map(r => (
                                    <tr key={r.id}>
                                        <td><Link to={`/admin/crm/contacts/${r.contact_id}`} className="row-link">{r.email}</Link></td>
                                        <td>{r.ab_variant ? <span className="variant-pill">{r.ab_variant}</span> : '—'}</td>
                                        <td>
                                            <span className={`r-status ${r.status}`}>{r.status}</span>
                                        </td>
                                        <td className="muted">{r.sent_at ? new Date(r.sent_at).toLocaleString('tr-TR') : '—'}</td>
                                        <td className="muted">{r.opened_at ? new Date(r.opened_at).toLocaleString('tr-TR') : '—'}</td>
                                        <td className="muted">{r.clicked_at ? new Date(r.clicked_at).toLocaleString('tr-TR') : '—'}</td>
                                        <td className="muted">{r.unsubscribed_at ? new Date(r.unsubscribed_at).toLocaleString('tr-TR') : '—'}</td>
                                    </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Body preview + tasarımı düzenle */}
                <div className="card-block">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0 }}>E-posta Tasarımı</h3>
                        {canSend && (
                            <button className="btn btn-secondary" onClick={() => { setEditorReady(false); setDesignerOpen(true); }}>
                                <HiPencil /> Tasarımı Düzenle
                            </button>
                        )}
                    </div>
                    {campaign.body_html ? (
                        <div className="body-preview" dangerouslySetInnerHTML={{ __html: campaign.body_html }} />
                    ) : (
                        <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Henüz tasarım yok.</div>
                    )}
                </div>
            </div>
            <CrmPageStyles />
            <style>{`
                .back-link { display: inline-flex; align-items: center; gap: 6px; color: #64748b; text-decoration: none; margin-bottom: 14px; font-size: 14px; }
                .campaign-name { margin: 6px 0 4px; font-size: 22px; color: #0f172a; }
                .campaign-subject { color: #64748b; font-size: 14px; }
                .ab-pill { display: inline-block; padding: 3px 10px; background: #fef3c7; color: #a16207; border-radius: 10px; font-size: 11px; font-weight: 700; margin-right: 8px; }
                .status-pill { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 18px 0; }
                .stat-card { background: white; border: 1px solid #e2e8f0; border-left: 3px solid #2563eb; border-radius: 10px; padding: 14px; display: flex; gap: 10px; align-items: center; }
                .stat-icon { font-size: 22px; color: #2563eb; }
                .stat-num { font-size: 20px; font-weight: 700; color: #0f172a; }
                .stat-label { font-size: 11px; color: #64748b; }
                .stat-suffix { font-size: 12px; color: #16a34a; font-weight: 600; }
                .ab-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
                .ab-card h3 { margin: 0 0 14px; }
                .ab-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 18px; align-items: stretch; }
                .ab-side { padding: 14px; background: #f8fafc; border-radius: 8px; }
                .ab-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
                .ab-subj { margin: 6px 0 12px; font-weight: 600; color: #0f172a; font-size: 14px; }
                .ab-stats { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #475569; }
                .ab-vs { display: flex; align-items: center; font-weight: 700; color: #94a3b8; }
                .rate-pill { display: inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border-radius: 10px; font-weight: 700; align-self: flex-start; margin-top: 4px; }
                .ab-winner { margin-top: 12px; text-align: center; padding: 8px; background: #fef3c7; border-radius: 6px; font-weight: 600; color: #78350f; }
                .card-block { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
                .card-block h3 { margin: 0 0 12px; font-size: 15px; }
                .body-preview { padding: 16px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; font-family: Georgia, serif; max-height: 400px; overflow-y: auto; }
                .variant-pill { display: inline-block; min-width: 22px; padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border-radius: 10px; font-size: 11px; font-weight: 700; text-align: center; }
                .r-status { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #475569; }
                .r-status.queued { background: #f1f5f9; color: #475569; }
                .r-status.sent { background: #dcfce7; color: #15803d; }
                .r-status.opened { background: #dbeafe; color: #1d4ed8; }
                .r-status.clicked { background: #e0e7ff; color: #4338ca; }
                .r-status.failed { background: #fee2e2; color: #b91c1c; }
                .r-status.bounced { background: #fed7aa; color: #c2410c; }
                .action-banner { padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 14px; border: 1px solid; }
                .action-banner.ok { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
                .action-banner.err { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
                .row-link { color: #2563eb; font-weight: 600; text-decoration: none; }
                .row-link:hover { text-decoration: underline; }
                .muted { color: #94a3b8; font-size: 13px; }

                .schedule-banner {
                    display: flex; gap: 12px; align-items: center;
                    background: #fef3c7; border: 1px solid #fcd34d;
                    color: #78350f; padding: 12px 16px; border-radius: 10px;
                    margin-bottom: 14px; font-size: 14px;
                }
                .schedule-banner svg { font-size: 22px; color: #a16207; flex-shrink: 0; }

                .schedule-quick-detail { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
                .quick-btn {
                    background: white; border: 1px solid #cbd5e1; color: #475569;
                    padding: 5px 12px; border-radius: 12px; font-size: 12px; cursor: pointer;
                }
                .quick-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
                .schedule-preview-modal {
                    margin-top: 12px; padding: 10px 14px;
                    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
                    color: #15803d; font-size: 13px; text-align: center;
                }
                .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
            `}</style>
        </AdminLayout>
    );
}

function StatCard({ label, value, icon, accent, suffix, onClick }: { label: string; value: number; icon: React.ReactNode; accent?: string; suffix?: string; onClick?: () => void }) {
    return (
        <div
            className="stat-card"
            style={{ ...(accent ? { borderLeftColor: accent } : undefined), ...(onClick ? { cursor: 'pointer' } : undefined) }}
            onClick={onClick}
            title={onClick ? 'Listeyi filtrelemek için tıkla' : undefined}
        >
            <div className="stat-icon" style={accent ? { color: accent } : undefined}>{icon}</div>
            <div>
                <div className="stat-num">{value.toLocaleString('tr-TR')}</div>
                <div className="stat-label">{label}{suffix && <span className="stat-suffix"> · {suffix}</span>}</div>
            </div>
        </div>
    );
}
