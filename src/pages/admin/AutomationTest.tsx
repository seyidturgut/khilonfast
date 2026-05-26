import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { crmAPI } from '../../services/api';
import { HiPlay, HiBeaker, HiCheckCircle, HiExclamationCircle, HiLightningBolt, HiMail, HiArrowRight } from 'react-icons/hi';

interface Scenario {
    key: string;
    label: string;
    description: string;
}

export default function AutomationTestPage() {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [email, setEmail] = useState('seyitturgut@gmail.com');
    const [firstName, setFirstName] = useState('Seyit');
    const [lastName, setLastName] = useState('Turgut');
    const [scenarioKey, setScenarioKey] = useState('run_all');
    const [mode, setMode] = useState<'preview' | 'live'>('preview');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        crmAPI.listAutomationScenarios()
            .then(res => setScenarios(res.data?.scenarios || []))
            .catch(() => setScenarios([]));
    }, []);

    const runTest = async () => {
        setLoading(true);
        setError('');
        setReport(null);
        try {
            const res = await crmAPI.runAutomationTest({
                email: email.trim(),
                scenario: scenarioKey,
                mode,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
            });
            setReport(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || 'Test çalıştırılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="auto-test-page">
                <header className="page-head">
                    <div>
                        <h1><HiBeaker /> Otomasyon Test Simülatörü</h1>
                        <p>Belirli bir e-posta için olay (event) simüle edin, hangi otomasyonların tetiklendiğini ve hangi e-postaların kuyruğa alındığını canlı görün. <b>Preview modu</b> hiçbir kalıcı değişiklik yapmaz; <b>Live mod</b> gerçek event olarak çalışır.</p>
                    </div>
                </header>

                <div className="layout">
                    {/* Sol — Kontroller */}
                    <div className="controls-card">
                        <h3>Test Yapılandırması</h3>

                        <div className="form-group">
                            <label>Test E-postası <span className="req">*</span></label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" />
                            <div className="hint">Bu kişiymiş gibi olaylar simüle edilecek.</div>
                        </div>

                        <div className="form-group two">
                            <div>
                                <label>Ad</label>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>
                            <div>
                                <label>Soyad</label>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Senaryo <span className="req">*</span></label>
                            <div className="scenario-list">
                                {scenarios.map(s => (
                                    <label key={s.key} className={`scenario-item ${scenarioKey === s.key ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="scenario"
                                            value={s.key}
                                            checked={scenarioKey === s.key}
                                            onChange={(e) => setScenarioKey(e.target.value)}
                                        />
                                        <div>
                                            <div className="sc-label">{s.label}</div>
                                            <div className="sc-desc">{s.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Çalıştırma Modu</label>
                            <div className="mode-toggle">
                                <button
                                    type="button"
                                    className={`mode-btn ${mode === 'preview' ? 'active preview' : ''}`}
                                    onClick={() => setMode('preview')}
                                >
                                    🔍 Preview
                                    <small>DB değişikliği rollback edilir</small>
                                </button>
                                <button
                                    type="button"
                                    className={`mode-btn ${mode === 'live' ? 'active live' : ''}`}
                                    onClick={() => setMode('live')}
                                >
                                    ⚡ Live
                                    <small>Gerçek event — kalıcı</small>
                                </button>
                            </div>
                            {mode === 'live' && (
                                <div className="warning-box">
                                    ⚠️ <b>Live mod</b> seçili: Bu çalıştırma kalıcı olur. Gerçek e-postalar {email} adresine kuyruğa alınır (cron tetiklendiğinde gönderilir).
                                </div>
                            )}
                        </div>

                        <button
                            className="run-btn"
                            onClick={runTest}
                            disabled={loading || !email.trim() || !scenarioKey}
                        >
                            {loading ? '⏳ Çalışıyor…' : <><HiPlay /> Testi Başlat</>}
                        </button>
                    </div>

                    {/* Sağ — Rapor */}
                    <div className="report-area">
                        {!report && !error && !loading && (
                            <div className="empty-state">
                                <HiBeaker style={{ fontSize: 56, color: '#cbd5e1' }} />
                                <h3>Test sonuçları burada görünecek</h3>
                                <p>Sol taraftan yapılandırmayı seçip "Testi Başlat"a basın.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="empty-state">
                                <div className="spinner" />
                                <h3>Olay simülasyonu çalışıyor…</h3>
                                <p>Otomasyonlar tetikleniyor, durum izleniyor.</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-card">
                                <HiExclamationCircle />
                                <div>
                                    <h3>Test başarısız</h3>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        {report && <ReportView report={report} />}
                    </div>
                </div>
            </div>

            <style>{`
                .auto-test-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
                .page-head h1 { display: flex; align-items: center; gap: 10px; margin: 0 0 6px; font-size: 22px; color: #0f172a; }
                .page-head h1 svg { color: #9333ea; }
                .page-head p { color: #64748b; font-size: 13px; margin: 0 0 24px; max-width: 800px; line-height: 1.5; }
                .layout { display: grid; grid-template-columns: 380px 1fr; gap: 18px; align-items: start; }

                .controls-card, .report-area { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
                .controls-card h3 { margin: 0 0 14px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
                .form-group { margin-bottom: 14px; }
                .form-group > label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; }
                .form-group input[type="email"], .form-group input[type="text"] { width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 14px; box-sizing: border-box; }
                .form-group.two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .req { color: #dc2626; }
                .hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }

                .scenario-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
                .scenario-item { display: flex; gap: 8px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.15s; align-items: flex-start; }
                .scenario-item:hover { background: #f8fafc; }
                .scenario-item.selected { border-color: #9333ea; background: #faf5ff; }
                .scenario-item input[type="radio"] { margin-top: 3px; flex-shrink: 0; accent-color: #9333ea; }
                .sc-label { font-weight: 600; font-size: 13px; color: #0f172a; }
                .sc-desc { font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.4; }

                .mode-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .mode-btn { display: flex; flex-direction: column; gap: 2px; padding: 10px; border: 2px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; }
                .mode-btn small { font-weight: 400; font-size: 10px; color: #94a3b8; }
                .mode-btn.active.preview { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
                .mode-btn.active.live { border-color: #f59e0b; background: #fffbeb; color: #b45309; }

                .warning-box { margin-top: 8px; padding: 10px 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; font-size: 12px; color: #78350f; }

                .run-btn {
                    width: 100%; padding: 12px; border: none; border-radius: 8px;
                    background: linear-gradient(135deg, #9333ea, #7c3aed); color: white;
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                }
                .run-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .run-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3); }

                .empty-state { padding: 60px 30px; text-align: center; }
                .empty-state h3 { margin: 14px 0 6px; color: #475569; font-size: 16px; }
                .empty-state p { color: #94a3b8; font-size: 13px; }

                .error-card { display: flex; gap: 12px; padding: 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; }
                .error-card svg { font-size: 28px; color: #dc2626; flex-shrink: 0; }
                .error-card h3 { margin: 0 0 4px; color: #b91c1c; }
                .error-card p { margin: 0; color: #7f1d1d; font-size: 13px; }

                .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #9333ea; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 900px) {
                    .layout { grid-template-columns: 1fr; }
                }
            `}</style>
        </AdminLayout>
    );
}

function ReportView({ report }: { report: any }) {
    const before = report.before;
    const after = report.after;
    const changes = report.changes || [];
    const automations = report.new_automations || [];
    const queuedEmails = report.queued_emails || [];

    return (
        <div className="report-view">
            {/* Status banner */}
            <div className={`status-banner ${report.mode}`}>
                <HiCheckCircle />
                <div>
                    <h3>Test Tamamlandı</h3>
                    <p>
                        <b>{report.email}</b> için <b>{report.scenarios_run > 1 ? `${report.scenarios_run} senaryo` : '1 senaryo'}</b> çalıştırıldı.{' '}
                        {report.rolled_back ? '🔍 Preview modu — değişiklikler geri alındı.' : '⚡ Live mod — değişiklikler kalıcı.'}
                    </p>
                </div>
            </div>

            {/* Before / After */}
            <div className="diff-card">
                <h3>📊 Durum Karşılaştırması</h3>
                <div className="diff-grid">
                    <div className="diff-col">
                        <div className="diff-title">ÖNCE</div>
                        <DiffStat label="Contact" value={before.contact_exists ? '✓ Var' : '— Yok'} />
                        <DiffStat label="Skor" value={before.score} />
                        <DiffStat label="Etiketler" value={before.tags.length === 0 ? '—' : before.tags.join(', ')} />
                        <DiffStat label="Aktif otomasyon" value={before.active_executions} />
                        <DiffStat label="Kuyruk e-posta" value={before.queued_emails} />
                    </div>
                    <HiArrowRight className="diff-arrow" />
                    <div className="diff-col">
                        <div className="diff-title">SONRA</div>
                        <DiffStat label="Contact" value={after.contact_exists ? '✓ Var' : '— Yok'} highlight={before.contact_exists !== after.contact_exists} />
                        <DiffStat label="Skor" value={after.score} highlight={before.score !== after.score} />
                        <DiffStat label="Etiketler" value={after.tags.length === 0 ? '—' : after.tags.join(', ')} highlight={JSON.stringify(before.tags) !== JSON.stringify(after.tags)} />
                        <DiffStat label="Aktif otomasyon" value={after.active_executions} highlight={before.active_executions !== after.active_executions} />
                        <DiffStat label="Kuyruk e-posta" value={after.queued_emails} highlight={before.queued_emails !== after.queued_emails} />
                    </div>
                </div>
            </div>

            {/* Changes */}
            <div className="changes-card">
                <h3>🔄 Yapılan Değişiklikler ({changes.length})</h3>
                {changes.length === 0 ? (
                    <p className="empty-tip">Bu test bir değişiklik üretmedi. Ya event'e karşılık gelen aktif akış yok ya da contact zaten o akışta.</p>
                ) : (
                    <ul className="changes-list">
                        {changes.map((c: any, i: number) => (
                            <li key={i} className={`change-item type-${c.type}`}>
                                <span className="change-icon">{iconForChange(c.type)}</span>
                                <span>{c.detail}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Triggered automations */}
            {automations.length > 0 && (
                <div className="auto-card">
                    <h3><HiLightningBolt /> Tetiklenen Otomasyonlar ({automations.length})</h3>
                    <div className="auto-list">
                        {automations.map((a: any) => (
                            <div key={a.id} className="auto-item">
                                <div className="auto-head">
                                    <span className="auto-id">#{a.automation_id}</span>
                                    <Link to={`/admin/automations/${a.automation_id}`} className="auto-name">
                                        {a.automation_name}
                                    </Link>
                                    <span className={`auto-status status-${a.status}`}>{a.status}</span>
                                </div>
                                <div className="auto-meta">
                                    <span>Execution ID: {a.id}</span>
                                    <span>Mevcut node: <code>{a.current_node}</code></span>
                                    {a.next_run_at && <span>Sonraki çalışma: {new Date(a.next_run_at).toLocaleString('tr-TR')}</span>}
                                </div>
                                {a.next_step && (
                                    <div className="auto-next">
                                        İlk adım: <b>{a.next_step.type}</b>
                                        {a.next_step.data?.template_id && <> (template #{a.next_step.data.template_id})</>}
                                    </div>
                                )}
                                <Link to={`/admin/automations/${a.automation_id}/executions`} className="auto-link">
                                    Tüm execution'ları gör →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Queued emails */}
            {queuedEmails.length > 0 && (
                <div className="email-card">
                    <h3><HiMail /> Kuyruğa Alınan E-postalar ({queuedEmails.length})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Konu</th>
                                <th>Akış</th>
                                <th>Zamanlama</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queuedEmails.map((e: any) => (
                                <tr key={e.id}>
                                    <td>{e.subject}</td>
                                    <td className="muted">{e.sequence_name || '—'}</td>
                                    <td className="muted">{e.scheduled_at ? new Date(e.scheduled_at).toLocaleString('tr-TR') : '—'}</td>
                                    <td><span className={`q-status q-${e.status}`}>{e.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <details className="raw-details">
                <summary>🔧 Ham yanıt (debug)</summary>
                <pre>{JSON.stringify(report, null, 2)}</pre>
            </details>

            <style>{`
                .report-view { display: flex; flex-direction: column; gap: 14px; }
                .status-banner { display: flex; gap: 12px; align-items: flex-start; padding: 16px 18px; border-radius: 10px; border: 1px solid; }
                .status-banner.preview { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
                .status-banner.live { background: #fffbeb; border-color: #fcd34d; color: #78350f; }
                .status-banner svg { font-size: 26px; flex-shrink: 0; }
                .status-banner h3 { margin: 0 0 4px; font-size: 15px; }
                .status-banner p { margin: 0; font-size: 13px; line-height: 1.5; }

                .diff-card, .changes-card, .auto-card, .email-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
                .diff-card h3, .changes-card h3, .auto-card h3, .email-card h3 {
                    margin: 0 0 12px; font-size: 14px; color: #0f172a;
                    display: flex; align-items: center; gap: 6px;
                }

                .diff-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: center; }
                .diff-col { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
                .diff-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
                .diff-arrow { font-size: 24px; color: #9333ea; }

                .diff-stat { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
                .diff-stat:last-child { border-bottom: none; }
                .diff-stat .label { color: #64748b; }
                .diff-stat .value { font-weight: 600; color: #0f172a; }
                .diff-stat.highlight .value { background: #fef3c7; padding: 1px 8px; border-radius: 4px; color: #b45309; }

                .empty-tip { color: #94a3b8; font-style: italic; font-size: 13px; margin: 0; padding: 12px; text-align: center; }
                .changes-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
                .change-item { display: flex; gap: 10px; padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; align-items: center; }
                .change-icon { font-size: 18px; flex-shrink: 0; }

                .auto-list { display: flex; flex-direction: column; gap: 10px; }
                .auto-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
                .auto-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
                .auto-id { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-family: ui-monospace, monospace; }
                .auto-name { font-weight: 700; color: #0f172a; text-decoration: none; font-size: 14px; flex: 1; }
                .auto-name:hover { color: #2563eb; }
                .auto-status { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
                .status-running { background: #fef3c7; color: #a16207; }
                .status-completed { background: #dcfce7; color: #15803d; }
                .status-cancelled { background: #fee2e2; color: #b91c1c; }
                .auto-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: #64748b; margin-bottom: 6px; }
                .auto-meta code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; }
                .auto-next { font-size: 12px; color: #475569; padding: 6px 0; }
                .auto-link { font-size: 12px; color: #2563eb; text-decoration: none; }
                .auto-link:hover { text-decoration: underline; }

                .email-card table { width: 100%; border-collapse: collapse; font-size: 13px; }
                .email-card th { text-align: left; padding: 8px 10px; background: white; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
                .email-card td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; background: white; }
                .muted { color: #94a3b8; }
                .q-status { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
                .q-pending { background: #fef3c7; color: #a16207; }
                .q-sent { background: #dcfce7; color: #15803d; }
                .q-failed { background: #fee2e2; color: #b91c1c; }

                .raw-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
                .raw-details summary { cursor: pointer; font-size: 12px; color: #64748b; }
                .raw-details pre { font-size: 11px; color: #475569; max-height: 400px; overflow: auto; margin: 10px 0 0; }
            `}</style>
        </div>
    );
}

function DiffStat({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
    return (
        <div className={`diff-stat ${highlight ? 'highlight' : ''}`}>
            <span className="label">{label}</span>
            <span className="value">{value}</span>
        </div>
    );
}

function iconForChange(type: string): string {
    if (type.startsWith('contact')) return '👤';
    if (type.startsWith('score')) return '📊';
    if (type.startsWith('tag_added')) return '🏷️';
    if (type.startsWith('tag_removed')) return '🗑️';
    if (type.startsWith('status')) return '🔄';
    if (type.startsWith('automation')) return '⚡';
    if (type.startsWith('emails_queued') || type.startsWith('email')) return '📧';
    return '✓';
}
