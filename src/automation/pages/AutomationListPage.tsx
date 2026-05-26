import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import type { Automation } from '../types';
import {
  getAutomations,
  createAutomation,
  deleteAutomation,
  duplicateAutomation,
  activateAutomation,
  deactivateAutomation,
} from '../services/automationService';

const statusColors: Record<string, string> = {
  active:   '#22c55e',
  inactive: '#94a3b8',
  draft:    '#f59e0b',
};

const statusLabels: Record<string, string> = {
  active:   'Aktif',
  inactive: 'Pasif',
  draft:    'Taslak',
};

const triggerLabels: Record<string, string> = {
  purchase_completed:       'Satın alma tamamlandı',
  checkout_email_entered:   'Ödeme e-postası girildi',
  onboarding_not_completed: 'Onboarding tamamlanmadı',
  service_not_used:         'Servis kullanılmadı',
  payment_failed:           'Ödeme başarısız',
  subscription_cancelled:   'Abonelik iptal edildi',
};

export default function AutomationListPage() {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getAutomations().then(data => {
      setAutomations(data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const auto = await createAutomation(newName.trim());
      navigate(`/admin/automations/${auto.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu otomasyonu silmek istediğinize emin misiniz?')) return;
    await deleteAutomation(id);
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const handleDuplicate = async (id: string) => {
    const copy = await duplicateAutomation(id);
    setAutomations(prev => [copy, ...prev]);
  };

  const handleToggleActive = async (auto: Automation) => {
    try {
      const updated =
        auto.status === 'active'
          ? await deactivateAutomation(auto.id)
          : await activateAutomation(auto.id);
      setAutomations(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız');
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '0 0 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a3a52' }}>
              Otomasyon Akışları
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Görsel otomasyon builder ile müşteri yolculuklarını tasarlayın
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#1a3a52', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontSize: 14,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Yeni Otomasyon
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Yükleniyor...</div>
        ) : automations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>
            Henüz otomasyon yok. İlk otomasyonunuzu oluşturun!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {automations.map(auto => {
              const triggerNode = auto.nodes.find(n => n.type === 'trigger');
              const triggerEvent = (triggerNode?.config as { trigger_event?: string })?.trigger_event;
              return (
                <div
                  key={auto.id}
                  style={{
                    background: '#fff', borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: statusColors[auto.status], flexShrink: 0,
                  }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a3a52', marginBottom: 3 }}>
                      {auto.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {triggerEvent ? triggerLabels[triggerEvent] ?? triggerEvent : '—'}
                      {' · '}
                      {auto.nodes.length} node
                      {auto.updated_at && (
                        <>
                          {' · '}
                          {new Date(auto.updated_at).toLocaleDateString('tr-TR')}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                    background: statusColors[auto.status] + '22',
                    color: statusColors[auto.status],
                    border: `1px solid ${statusColors[auto.status]}44`,
                  }}>
                    {statusLabels[auto.status]}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => navigate(`/admin/automations/${auto.id}`)}
                    style={actionBtn('#1a3a52', '#fff')}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => navigate(`/admin/automations/${auto.id}/executions`)}
                    style={actionBtn('#7c3aed', '#fff')}
                    title="Çalıştırma logları"
                  >
                    Loglar
                  </button>
                  <button
                    onClick={() => handleToggleActive(auto)}
                    style={actionBtn(auto.status === 'active' ? '#94a3b8' : '#22c55e', '#fff')}
                  >
                    {auto.status === 'active' ? 'Deaktive Et' : 'Aktive Et'}
                  </button>
                  <button
                    onClick={() => handleDuplicate(auto.id)}
                    style={actionBtn('#0284c7', '#fff')}
                  >
                    Çoğalt
                  </button>
                  <button
                    onClick={() => handleDelete(auto.id)}
                    style={actionBtn('#ef4444', '#fff')}
                  >
                    Sil
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Automation Modal */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1a3a52' }}>
              Yeni Otomasyon
            </h3>
            <input
              type="text"
              placeholder="Otomasyon adı (örn: Terk Edilen Sepet Akışı)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #e2e8f0', borderRadius: 8,
                padding: '10px 14px', fontSize: 14, marginBottom: 16,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={actionBtn('#94a3b8', '#fff')}>
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                style={actionBtn('#1a3a52', '#fff')}
              >
                {creating ? 'Oluşturuluyor…' : 'Oluştur ve Düzenle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 8,
    padding: '7px 14px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999,
};

const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 14,
  padding: 28, width: 440,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};
