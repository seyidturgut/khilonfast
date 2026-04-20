import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import type { AutomationLog } from '../types';
import { getLogs } from '../services/automationService';

const statusColors: Record<string, string> = {
  completed: '#22c55e',
  running:   '#3b82f6',
  failed:    '#ef4444',
  paused:    '#f59e0b',
};

const statusLabels: Record<string, string> = {
  completed: 'Tamamlandı',
  running:   'Çalışıyor',
  failed:    'Başarısız',
  paused:    'Duraklatıldı',
};

export default function AutomationLogsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    getLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filtered = statusFilter === 'all'
    ? logs
    : logs.filter(l => l.status === statusFilter);

  return (
    <AdminLayout>
      <div style={{ padding: '0 0 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a3a52' }}>
            Otomasyon Logları
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Otomasyon çalışma geçmişi ve sonuçları
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all', 'completed', 'running', 'failed', 'paused'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter === s ? '#1a3a52' : '#fff',
                color: statusFilter === s ? '#fff' : '#374151',
                border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '7px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {s === 'all' ? 'Tümü' : statusLabels[s]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Log List */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>
                Bu kriterlerde log bulunamadı.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(log => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log.id === selectedLog?.id ? null : log)}
                    style={{
                      background: '#fff', borderRadius: 10,
                      border: log.id === selectedLog?.id
                        ? '2px solid #1a3a52'
                        : '1px solid #e2e8f0',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: statusColors[log.status], flexShrink: 0,
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1a3a52', marginBottom: 3 }}>
                        {log.automation_name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {log.contact_email && <>{log.contact_email} · </>}
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                        {' · '}Son işlem: {log.last_action}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        {log.steps.length} adım
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                        background: statusColors[log.status] + '22',
                        color: statusColors[log.status],
                        border: `1px solid ${statusColors[log.status]}44`,
                      }}>
                        {statusLabels[log.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Drawer */}
          {selectedLog && (
            <div style={{
              width: 340, background: '#fff', borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              padding: 20, flexShrink: 0,
              position: 'sticky', top: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a3a52' }}>
                  Log Detayı
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DetailRow label="Otomasyon" value={selectedLog.automation_name} />
                <DetailRow label="Durum">
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 10,
                    background: statusColors[selectedLog.status] + '22',
                    color: statusColors[selectedLog.status],
                  }}>
                    {statusLabels[selectedLog.status]}
                  </span>
                </DetailRow>
                {selectedLog.contact_email && (
                  <DetailRow label="Kişi" value={selectedLog.contact_email} />
                )}
                <DetailRow label="Tetikleyici" value={selectedLog.triggered_event} />
                <DetailRow label="Tarih" value={new Date(selectedLog.created_at).toLocaleString('tr-TR')} />
                <DetailRow label="Son İşlem" value={selectedLog.last_action} />

                {selectedLog.steps.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                      Adımlar
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedLog.steps.map((step, i) => (
                        <div
                          key={step.node_id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', background: '#f8fafc',
                            borderRadius: 8, fontSize: 12,
                          }}
                        >
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: step.result === 'success' ? '#22c55e' : step.result === 'failed' ? '#ef4444' : '#94a3b8',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ flex: 1, color: '#374151', fontWeight: 500 }}>
                            {step.label || step.node_id}
                          </span>
                          {step.detail && (
                            <span style={{ color: '#94a3b8', fontSize: 11 }}>{step.detail}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLog.error && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>
                      HATA
                    </div>
                    <div style={{ fontSize: 12, color: '#7f1d1d', fontFamily: 'monospace' }}>
                      {selectedLog.error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1a3a52', fontWeight: 600, textAlign: 'right' }}>
        {children ?? value}
      </span>
    </div>
  );
}
