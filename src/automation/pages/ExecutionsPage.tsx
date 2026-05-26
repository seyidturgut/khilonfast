import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';

const ADMIN_API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

interface Execution {
  id: number;
  automation_id: number;
  contact_email: string;
  contact_user_id: number | null;
  trigger_event: string;
  status: 'running' | 'completed' | 'cancelled' | 'failed';
  current_node_id: string | null;
  next_run_at: string | null;
  attempts: number;
  last_error: string | null;
  started_at: string;
  completed_at: string | null;
}

interface ExecutionLog {
  id: number;
  node_id: string;
  node_type: string;
  status: 'ok' | 'skipped' | 'error';
  message: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  running: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#94a3b8',
  failed: '#ef4444',
};

const statusLabels: Record<string, string> = {
  running: 'Çalışıyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  failed: 'Hata',
};

export default function ExecutionsPage() {
  const { id } = useParams<{ id: string }>();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [emailFilter, setEmailFilter] = useState('');
  const [selected, setSelected] = useState<Execution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const perPage = 25;

  const fetchExecutions = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (statusFilter) params.set('status', statusFilter);
    if (emailFilter) params.set('email', emailFilter);
    try {
      const res = await fetch(`${ADMIN_API_BASE}/admin/automations/${id}/executions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setExecutions(data.executions || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, statusFilter]);

  const handleEmailFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExecutions();
  };

  const openLogs = async (exec: Execution) => {
    setSelected(exec);
    setLogsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${ADMIN_API_BASE}/admin/automations/executions/${exec.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } finally {
      setLogsLoading(false);
    }
  };

  const cancelExecution = async (exec: Execution) => {
    if (!confirm(`${exec.contact_email} için akışı iptal edilsin mi?`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${ADMIN_API_BASE}/admin/automations/executions/${exec.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchExecutions();
    if (selected?.id === exec.id) setSelected(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <AdminLayout>
      <div style={{ padding: '0 0 40px' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/admin/automations" style={{ color: '#1a3a52', fontSize: 13, textDecoration: 'none' }}>← Otomasyonlar</Link>
        </div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a3a52' }}>
            Otomasyon Çalıştırmaları
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Otomasyon ID: {id} — toplam {total} çalıştırma
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
          >
            <option value="">Tüm durumlar</option>
            <option value="running">Çalışıyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
            <option value="failed">Hata</option>
          </select>
          <form onSubmit={handleEmailFilter} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="E-posta ara..."
              value={emailFilter}
              onChange={e => setEmailFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, width: 220 }}
            />
            <button
              type="submit"
              style={{ padding: '8px 14px', borderRadius: 6, background: '#1a3a52', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              Filtrele
            </button>
          </form>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
          ) : executions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Henüz çalıştırma yok.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={th}>Email</th>
                  <th style={th}>Trigger</th>
                  <th style={th}>Durum</th>
                  <th style={th}>Node</th>
                  <th style={th}>Sonraki</th>
                  <th style={th}>Başladı</th>
                  <th style={th}>Hata</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {executions.map(e => (
                  <tr key={e.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={td}>{e.contact_email}</td>
                    <td style={td}><code style={{ fontSize: 11, color: '#64748b' }}>{e.trigger_event}</code></td>
                    <td style={td}>
                      <span style={{ ...statusBadge, background: statusColors[e.status] || '#94a3b8' }}>
                        {statusLabels[e.status] || e.status}
                      </span>
                    </td>
                    <td style={td}>{e.current_node_id || '-'}</td>
                    <td style={td}>{e.next_run_at ? new Date(e.next_run_at).toLocaleString('tr-TR') : '-'}</td>
                    <td style={td}>{new Date(e.started_at).toLocaleString('tr-TR')}</td>
                    <td style={{ ...td, fontSize: 11, color: '#dc2626', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.last_error || ''}>
                      {e.last_error || ''}
                    </td>
                    <td style={td}>
                      <button onClick={() => openLogs(e)} style={btnLink}>Log</button>
                      {e.status === 'running' && (
                        <button onClick={() => cancelExecution(e)} style={{ ...btnLink, color: '#dc2626' }}>İptal</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtn}>‹ Önceki</button>
            <span style={{ padding: '8px 12px', color: '#64748b', fontSize: 13 }}>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pageBtn}>Sonraki ›</button>
          </div>
        )}

        {/* Logs Modal */}
        {selected && (
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 12, maxWidth: 800, width: '100%', maxHeight: '85vh', overflow: 'auto', padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1a3a52' }}>Çalıştırma Logu #{selected.id}</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{selected.contact_email}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
              </div>
              {logsLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
              ) : logs.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Log yok.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {logs.map(l => (
                    <div key={l.id} style={{ padding: 10, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                        <code style={{ color: '#1a3a52', fontWeight: 600 }}>{l.node_id} ({l.node_type})</code>
                        <span style={{ ...statusBadge, background: l.status === 'ok' ? '#22c55e' : l.status === 'error' ? '#ef4444' : '#94a3b8', fontSize: 10 }}>
                          {l.status}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 'auto' }}>
                          {new Date(l.created_at).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      {l.message && <div style={{ color: '#475569' }}>{l.message}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' };
const td: React.CSSProperties = { padding: '10px 14px', color: '#102a43', verticalAlign: 'middle' };
const statusBadge: React.CSSProperties = { color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, display: 'inline-block' };
const btnLink: React.CSSProperties = { background: 'none', border: 'none', color: '#1a3a52', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 8, padding: 0 };
const pageBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 6, background: '#1a3a52', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 };
