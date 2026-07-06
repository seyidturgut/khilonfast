import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { crmAPI } from '../../services/api';

const ADMIN_API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const POLL_MS = 10000;

interface LiveCampaign {
  id: number;
  name: string;
  subject: string;
  status: 'sending' | 'paused';
  started_at: string | null;
  total: number;
  sent: number;
  progress_pct: number;
}

interface LiveAutomation {
  id: number;
  name: string;
  running: number;
  next_run_at: string | null;
}

interface LiveActivityResponse {
  campaigns: LiveCampaign[];
  automations: {
    running_total: number;
    by_automation: LiveAutomation[];
  };
  generated_at: string;
}

export default function LiveActivityPage() {
  const [data, setData] = useState<LiveActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pausing, setPausing] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${ADMIN_API_BASE}/admin/live-activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      setData(body);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const togglePause = async (c: LiveCampaign) => {
    setPausing(c.id);
    try {
      if (c.status === 'sending') {
        await crmAPI.pauseCampaign(c.id);
      } else {
        await crmAPI.resumeCampaign(c.id);
      }
      await load();
    } finally {
      setPausing(null);
    }
  };

  const campaigns = data?.campaigns ?? [];
  const runningTotal = data?.automations.running_total ?? 0;
  const byAutomation = data?.automations.by_automation ?? [];

  return (
    <AdminLayout>
      <div style={{ padding: '0 0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a3a52' }}>
              Canlı Aktivite
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Şu an gönderilen kampanyalar ve çalışan otomasyon akışları — {POLL_MS / 1000} saniyede bir otomatik yenilenir.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.18)' }} />
            Canlı
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
        ) : (
          <>
            <Section
              title={`📨 Gönderim Halindeki Kampanyalar (${campaigns.length})`}
              subtitle="status = 'sending' veya 'paused' olan CRM kampanyaları"
            >
              {campaigns.length === 0 ? (
                <Empty text="Şu an gönderim yapan veya duraklatılmış kampanya yok." />
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {campaigns.map(c => (
                    <div key={c.id} style={{ padding: 12, background: c.status === 'sending' ? '#fffbeb' : '#eef2ff', border: '1px solid ' + (c.status === 'sending' ? '#fde68a' : '#c7d2fe'), borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a52' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{c.subject}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            background: c.status === 'sending' ? '#f59e0b' : '#6366f1',
                            color: '#fff', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                          }}>
                            {c.status === 'sending' ? 'Gönderiliyor' : 'Duraklatıldı'}
                          </span>
                          <button
                            onClick={() => togglePause(c)}
                            disabled={pausing === c.id}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                              cursor: pausing === c.id ? 'default' : 'pointer',
                              background: c.status === 'sending' ? '#ef4444' : '#22c55e', color: '#fff',
                            }}
                          >
                            {pausing === c.id ? '...' : c.status === 'sending' ? 'Durdur' : 'Devam Ettir'}
                          </button>
                          <Link to="/admin/crm/campaigns" style={{ fontSize: 12, color: '#1a3a52', fontWeight: 600 }}>Detay →</Link>
                        </div>
                      </div>
                      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: c.progress_pct + '%', height: '100%', background: '#1a3a52', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        <span>{c.sent} / {c.total} gönderildi</span>
                        <span>%{c.progress_pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title={`⚙️ Şu An Çalışan Otomasyon Adımları (${runningTotal})`}
              subtitle="status = 'running' olan automation_executions — bekleyen/işlenen otomasyon adımları"
            >
              {byAutomation.length === 0 ? (
                <Empty text="Şu an çalışan (running) otomasyon execution'ı yok." />
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {byAutomation.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, boxShadow: '0 0 0 3px rgba(59,130,246,0.18)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a3a52' }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>
                          {a.next_run_at ? `Sıradaki adım: ${new Date(a.next_run_at).toLocaleString('tr-TR')}` : 'Zamanlama bilgisi yok'}
                        </div>
                      </div>
                      <span style={{ background: '#3b82f6', color: '#fff', padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                        {a.running} kişi
                      </span>
                      <Link to={`/admin/automations/${a.id}/executions`} style={{ fontSize: 12, color: '#1a3a52', fontWeight: 600 }}>Detay →</Link>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </AdminLayout>
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

function Empty({ text }: { text: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{text}</div>;
}
