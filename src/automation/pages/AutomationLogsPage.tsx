import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';

const ADMIN_API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

interface KPI {
  total: number;
  running: number;
  completed: number;
  cancelled: number;
  failed: number;
  avg_duration_sec: number | null;
  mail_sent: number;
}

interface PerAutomation {
  id: number;
  name: string;
  status: string;
  total_runs: number;
  completed: number;
  running: number;
  failed: number;
  cancelled: number;
  last_run_at: string | null;
}

interface DailyPoint {
  d: string;
  total: number;
  completed: number;
  failed: number;
}

interface TriggerStat {
  trigger_event: string;
  cnt: number;
}

interface ErrorStat {
  error: string;
  cnt: number;
}

interface RecentExecution {
  id: number;
  automation_id: number;
  automation_name: string | null;
  contact_email: string;
  trigger_event: string;
  status: 'running' | 'completed' | 'cancelled' | 'failed';
  current_node_id: string | null;
  next_run_at: string | null;
  attempts: number;
  last_error: string | null;
  started_at: string;
  completed_at: string | null;
}

interface AllTime {
  total: number;
  running: number;
  completed: number;
  failed: number;
}

interface AnalyticsResponse {
  period_days: number;
  kpi: KPI;
  all_time?: AllTime;
  per_automation: PerAutomation[];
  daily: DailyPoint[];
  top_triggers: TriggerStat[];
  top_errors: ErrorStat[];
  recent_executions?: RecentExecution[];
}

const triggerLabels: Record<string, string> = {
  purchase_completed: 'Satın alma tamamlandı',
  checkout_email_entered: 'Ödeme e-postası girildi',
  checkout_abandoned: 'Sepet terk edildi',
  purchase_completed_no_onboarding: 'Aldı / Onboarding doldurmadı',
  onboarding_not_completed: 'Onboarding tamamlanmadı',
  service_not_used: 'Servis kullanılmadı',
  payment_failed: 'Ödeme başarısız',
  subscription_cancelled: 'Abonelik iptal edildi',
  course_purchased_not_started: 'Eğitim — Aldı, başlamadı',
  course_started_incomplete: 'Eğitim — Başladı, tamamlamadı',
  course_completed: 'Eğitim — Tamamlandı',
  course_yearly_reactivation: 'Eğitim — Yıllık reactivation',
  consulting_appointment: 'Danışmanlık — Randevu',
  maestro_lifecycle: 'Maestro AI — Lifecycle',
  eyetracking_pending_upload: 'Eye Tracking — Görsel beklemede',
};

interface ManualTriggerState {
  automationId: number;
  automationName: string;
  email: string;
  firstName: string;
  orderId: string;
}

export default function AutomationAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [manualTrigger, setManualTrigger] = useState<ManualTriggerState | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string>('');

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${ADMIN_API_BASE}/admin/automations/analytics?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (!cancel) setData(d); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [days]);

  const completionRate = data && data.kpi.total > 0
    ? Math.round((data.kpi.completed / data.kpi.total) * 100)
    : 0;
  const failureRate = data && data.kpi.total > 0
    ? Math.round((data.kpi.failed / data.kpi.total) * 100)
    : 0;
  const avgDur = data?.kpi.avg_duration_sec;

  const submitManualTrigger = async () => {
    if (!manualTrigger) return;
    if (!manualTrigger.email || !manualTrigger.email.includes('@')) {
      setTriggerResult('❌ Geçerli bir email girin.');
      return;
    }
    setTriggering(true);
    setTriggerResult('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${ADMIN_API_BASE}/admin/automations/${manualTrigger.automationId}/manual-trigger`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: manualTrigger.email.trim(),
          first_name: manualTrigger.firstName.trim(),
          order_id: manualTrigger.orderId.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setTriggerResult('❌ Hata: ' + (body.error || res.status));
      } else {
        const r = body.result || {};
        setTriggerResult(`✓ Tetiklendi: ${r.triggered ?? 0} yeni execution, ${r.skipped_duplicate ?? 0} duplicate atlandı, ${r.cancelled_by_stop ?? 0} stop ile iptal.`);
        // Veriyi tazele
        setTimeout(() => {
          setManualTrigger(null);
          setTriggerResult('');
          // Reload analytics
          const t = localStorage.getItem('token');
          fetch(`${ADMIN_API_BASE}/admin/automations/analytics?days=${days}`, { headers: { Authorization: `Bearer ${t}` } })
            .then(r => r.json()).then(d => setData(d)).catch(() => {});
        }, 2500);
      }
    } catch (e: any) {
      setTriggerResult('❌ Hata: ' + (e.message || 'Network'));
    } finally {
      setTriggering(false);
    }
  };

  const formatDuration = (sec: number | null) => {
    if (sec === null) return '—';
    if (sec < 60) return sec + ' sn';
    if (sec < 3600) return Math.round(sec / 60) + ' dk';
    if (sec < 86400) return Math.round(sec / 3600) + ' sa';
    return Math.round(sec / 86400) + ' gün';
  };

  return (
    <AdminLayout>
      <div style={{ padding: '0 0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a3a52' }}>
              Otomasyon Analizi
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Son {days} gün — performans, başarı oranları ve hatalar
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 30, 90].map(n => (
              <button
                key={n}
                onClick={() => setDays(n)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid ' + (days === n ? '#1a3a52' : '#cbd5e1'),
                  background: days === n ? '#1a3a52' : '#fff',
                  color: days === n ? '#fff' : '#1a3a52',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {n} gün
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
        ) : !data ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Veri alınamadı.</div>
        ) : (
          <>
            {/* All-time özet bandı (period filtresinden bağımsız) */}
            {data.all_time && (
              <div style={{ background: 'linear-gradient(90deg, #1a3a52, #2d5570)', borderRadius: 10, padding: '14px 18px', color: '#fff', marginBottom: 18, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>Tüm Zamanlar</div>
                <div><strong style={{ fontSize: 20 }}>{data.all_time.total}</strong> <span style={{ opacity: 0.8, fontSize: 12, marginLeft: 4 }}>toplam</span></div>
                <div><strong style={{ fontSize: 20, color: '#86efac' }}>{data.all_time.completed}</strong> <span style={{ opacity: 0.8, fontSize: 12, marginLeft: 4 }}>tamamlanan</span></div>
                <div><strong style={{ fontSize: 20, color: '#bfdbfe' }}>{data.all_time.running}</strong> <span style={{ opacity: 0.8, fontSize: 12, marginLeft: 4 }}>devam eden</span></div>
                <div><strong style={{ fontSize: 20, color: '#fca5a5' }}>{data.all_time.failed}</strong> <span style={{ opacity: 0.8, fontSize: 12, marginLeft: 4 }}>hatalı</span></div>
              </div>
            )}

            {/* KPI Cards (period bazlı) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
              <KpiCard label={`Son ${days} gün — Toplam`} value={data.kpi.total} color="#1a3a52" />
              <KpiCard label="Devam Eden" value={data.kpi.running} color="#3b82f6" />
              <KpiCard label="Tamamlanan" value={data.kpi.completed} color="#22c55e" hint={completionRate + '%'} />
              <KpiCard label="Hatalı" value={data.kpi.failed} color="#ef4444" hint={failureRate + '%'} />
              <KpiCard label="İptal" value={data.kpi.cancelled} color="#94a3b8" />
              <KpiCard label="Mail Gönderim" value={data.kpi.mail_sent} color="#7c3aed" />
              <KpiCard label="Ortalama Süre" value={formatDuration(avgDur ?? null)} color="#0891b2" small />
            </div>

            {/* Aktif Akışlar paneli */}
            {(() => {
              const activeFlows = data.per_automation.filter(a => a.status === 'active');
              return (
                <Section
                  title={`🟢 Şu An Aktif Akışlar (${activeFlows.length})`}
                  subtitle="Customer event geldiğinde bu akışlar otomatik çalışır. Test için tek tıkla manuel tetikleyebilirsiniz."
                >
                  {activeFlows.length === 0 ? (
                    <div style={{ padding: 20, background: '#fef3c7', borderRadius: 8, border: '1px solid #fbbf24' }}>
                      <strong style={{ color: '#92400e' }}>⚠ Aktif akış yok.</strong>
                      <span style={{ color: '#78350f', marginLeft: 8, fontSize: 13 }}>
                        <Link to="/admin/automations" style={{ color: '#1a3a52', textDecoration: 'underline' }}>Otomasyon Akışları</Link> sayfasından bir akış aktive edin.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {activeFlows.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 0 3px rgba(34,197,94,0.18)' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a3a52' }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: '#475569' }}>
                              {a.total_runs > 0 ? `${a.total_runs} çalıştırma · son: ${a.last_run_at ? new Date(a.last_run_at).toLocaleString('tr-TR') : '—'}` : 'Henüz tetiklenmedi'}
                            </div>
                          </div>
                          <button
                            onClick={() => setManualTrigger({ automationId: a.id, automationName: a.name, email: '', firstName: '', orderId: '' })}
                            style={{ padding: '7px 14px', background: '#1a3a52', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            title="Bu akışı bir email/sipariş için manuel tetikle"
                          >
                            🚀 Test Tetikle
                          </button>
                          <Link to={`/admin/automations/${a.id}/executions`} style={{ fontSize: 12, color: '#1a3a52', textDecoration: 'none', fontWeight: 600 }}>
                            Loglar →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              );
            })()}

            {/* Daily trend */}
            <Section title="Günlük Trend" subtitle={`Son ${data.period_days} gün`}>
              {data.daily.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Veri yok.</div>
              ) : (
                <DailyChart points={data.daily} />
              )}
            </Section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
              {/* Top triggers */}
              <Section title="En Çok Tetiklenen" subtitle="Trigger event sıralaması">
                {data.top_triggers.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Veri yok.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {data.top_triggers.map(t => {
                      const max = Math.max(...data.top_triggers.map(x => x.cnt));
                      const pct = Math.round((t.cnt / max) * 100);
                      return (
                        <div key={t.trigger_event}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                            <span style={{ color: '#1a3a52' }}>{triggerLabels[t.trigger_event] || t.trigger_event}</span>
                            <strong style={{ color: '#1a3a52' }}>{t.cnt}</strong>
                          </div>
                          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4 }}>
                            <div style={{ width: pct + '%', height: '100%', background: '#1a3a52', borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Top errors */}
              <Section title="En Çok Karşılaşılan Hatalar" subtitle="Failed execution last_error sıralaması">
                {data.top_errors.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Hata yok.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {data.top_errors.map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 8px', background: '#fef2f2', borderRadius: 6, fontSize: 12 }}>
                        <strong style={{ color: '#dc2626', minWidth: 30 }}>{e.cnt}×</strong>
                        <span style={{ color: '#7f1d1d', wordBreak: 'break-word' }}>{e.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Per-automation table */}
            <Section title="Akış Bazında Performans" subtitle="Her otomasyonun çalıştırma istatistiği">
              {data.per_automation.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Otomasyon yok.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={th}>Akış</th>
                        <th style={th}>Status</th>
                        <th style={{ ...th, textAlign: 'right' }}>Toplam</th>
                        <th style={{ ...th, textAlign: 'right' }}>Tamamlanan</th>
                        <th style={{ ...th, textAlign: 'right' }}>Çalışan</th>
                        <th style={{ ...th, textAlign: 'right' }}>Hata</th>
                        <th style={{ ...th, textAlign: 'right' }}>İptal</th>
                        <th style={{ ...th, textAlign: 'right' }}>Başarı %</th>
                        <th style={th}>Son Çalıştırma</th>
                        <th style={th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.per_automation.map(a => {
                        const success = a.total_runs > 0 ? Math.round((a.completed / a.total_runs) * 100) : 0;
                        return (
                          <tr key={a.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={td}>
                              <div style={{ fontWeight: 600, color: '#1a3a52' }}>{a.name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>#{a.id}</div>
                            </td>
                            <td style={td}>
                              <span style={{ ...statusBadge, background: a.status === 'active' ? '#22c55e' : a.status === 'draft' ? '#f59e0b' : '#94a3b8' }}>
                                {a.status === 'active' ? 'Aktif' : a.status === 'draft' ? 'Taslak' : a.status}
                              </span>
                            </td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{a.total_runs}</td>
                            <td style={{ ...td, textAlign: 'right', color: '#22c55e' }}>{a.completed}</td>
                            <td style={{ ...td, textAlign: 'right', color: '#3b82f6' }}>{a.running}</td>
                            <td style={{ ...td, textAlign: 'right', color: '#ef4444' }}>{a.failed}</td>
                            <td style={{ ...td, textAlign: 'right', color: '#94a3b8' }}>{a.cancelled}</td>
                            <td style={{ ...td, textAlign: 'right' }}>
                              {a.total_runs > 0 ? (
                                <span style={{ color: success >= 80 ? '#22c55e' : success >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                                  %{success}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={td}>{a.last_run_at ? new Date(a.last_run_at).toLocaleString('tr-TR') : '—'}</td>
                            <td style={td}>
                              <Link to={`/admin/automations/${a.id}/executions`} style={{ color: '#1a3a52', fontSize: 12, fontWeight: 600 }}>Detay →</Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* Son Çalıştırmalar */}
            <Section title="Son Çalıştırmalar" subtitle="Tüm zamanlardan son 15 — debug & izleme">
              {(!data.recent_executions || data.recent_executions.length === 0) ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                  Hiç çalıştırma kaydı yok. Bir akış aktive edip ilgili event'i tetikleyince burada görünür.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={th}>Email</th>
                        <th style={th}>Akış</th>
                        <th style={th}>Trigger</th>
                        <th style={th}>Durum</th>
                        <th style={th}>Node</th>
                        <th style={th}>Sonraki</th>
                        <th style={th}>Başladı</th>
                        <th style={th}>Hata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_executions.map(r => {
                        const statusColors: Record<string, string> = {
                          running: '#3b82f6',
                          completed: '#22c55e',
                          cancelled: '#94a3b8',
                          failed: '#ef4444',
                        };
                        return (
                          <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={td}>{r.contact_email}</td>
                            <td style={td}>
                              <div style={{ fontWeight: 600, color: '#1a3a52' }}>{r.automation_name || '—'}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>#{r.automation_id}</div>
                            </td>
                            <td style={td}><code style={{ fontSize: 10, color: '#64748b' }}>{r.trigger_event}</code></td>
                            <td style={td}>
                              <span style={{ background: statusColors[r.status] || '#94a3b8', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                                {r.status}
                              </span>
                            </td>
                            <td style={td}>{r.current_node_id || '-'}</td>
                            <td style={td}>{r.next_run_at ? new Date(r.next_run_at).toLocaleString('tr-TR') : '-'}</td>
                            <td style={td}>{new Date(r.started_at).toLocaleString('tr-TR')}</td>
                            <td style={{ ...td, fontSize: 11, color: '#dc2626', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.last_error || ''}>
                              {r.last_error || ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </>
        )}
      </div>

      {manualTrigger && (
        <div
          onClick={() => { if (!triggering) { setManualTrigger(null); setTriggerResult(''); } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#102a43' }}>Akışı Manuel Tetikle</h3>
            <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: '#64748b' }}>{manualTrigger.automationName}</p>

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>E-posta *</label>
            <input
              type="email"
              value={manualTrigger.email}
              autoFocus
              onChange={(e) => setManualTrigger({ ...manualTrigger, email: e.target.value })}
              placeholder="ornek@email.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.92rem', marginBottom: 14, boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Ad (opsiyonel)</label>
            <input
              type="text"
              value={manualTrigger.firstName}
              onChange={(e) => setManualTrigger({ ...manualTrigger, firstName: e.target.value })}
              placeholder="Boş bırakılırsa sistemden alınır"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.92rem', marginBottom: 14, boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Sipariş No (opsiyonel)</label>
            <input
              type="text"
              value={manualTrigger.orderId}
              onChange={(e) => setManualTrigger({ ...manualTrigger, orderId: e.target.value })}
              placeholder="—"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.92rem', marginBottom: 18, boxSizing: 'border-box' }}
            />

            {triggerResult && (
              <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, fontSize: '0.85rem', background: triggerResult.startsWith('✓') ? '#dcfce7' : '#fef2f2', color: triggerResult.startsWith('✓') ? '#166534' : '#b91c1c' }}>
                {triggerResult}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { if (!triggering) { setManualTrigger(null); setTriggerResult(''); } }}
                disabled={triggering}
                style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: triggering ? 'default' : 'pointer' }}
              >
                İptal
              </button>
              <button
                onClick={submitManualTrigger}
                disabled={triggering}
                style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: triggering ? '#94a3b8' : '#1a3a52', color: '#fff', fontWeight: 600, cursor: triggering ? 'default' : 'pointer' }}
              >
                {triggering ? 'Tetikleniyor…' : 'Tetikle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function KpiCard({ label, value, color, hint, small }: { label: string; value: number | string; color: string; hint?: string; small?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: small ? 18 : 26, fontWeight: 800, color }}>{value}</div>
        {hint && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{hint}</div>}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, marginBottom: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a3a52' }}>{title}</h3>
        {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function DailyChart({ points }: { points: DailyPoint[] }) {
  const max = Math.max(1, ...points.map(p => p.total));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, padding: '10px 0', overflowX: 'auto' }}>
      {points.map(p => {
        const h = Math.max(2, Math.round((p.total / max) * 110));
        const completedH = p.total > 0 ? Math.round((p.completed / p.total) * h) : 0;
        const failedH = p.total > 0 ? Math.round((p.failed / p.total) * h) : 0;
        const otherH = Math.max(0, h - completedH - failedH);
        const date = new Date(p.d);
        return (
          <div key={p.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{p.total}</div>
            <div style={{ height: h, width: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: 3, overflow: 'hidden' }} title={`${p.d}: ${p.total} (${p.completed} ok, ${p.failed} fail)`}>
              {failedH > 0 && <div style={{ height: failedH, background: '#ef4444' }} />}
              {otherH > 0 && <div style={{ height: otherH, background: '#94a3b8' }} />}
              {completedH > 0 && <div style={{ height: completedH, background: '#22c55e' }} />}
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
              {date.getDate()}/{date.getMonth() + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' };
const td: React.CSSProperties = { padding: '10px 12px', color: '#102a43', verticalAlign: 'middle' };
const statusBadge: React.CSSProperties = { color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, display: 'inline-block' };
