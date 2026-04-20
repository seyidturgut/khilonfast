import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { emailAutomationAPI } from '../../services/api';

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

interface Step {
    id: number;
    sequence_id: number;
    step_order: number;
    delay_minutes: number;
    subject: string;
    body_html: string;
    created_at: string;
}

interface Sequence {
    id: number;
    name: string;
    trigger_event: string;
    is_active: boolean;
    restart_after_days: number | null;
    created_at: string;
    steps: Step[];
}

interface QueueItem {
    id: number;
    email: string;
    subject: string;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    scheduled_at: string;
    sent_at: string | null;
    sequence_name: string | null;
    step_order: number | null;
    error_message: string | null;
}

interface Stats {
    by_status: { pending: number; sent: number; failed: number; cancelled: number };
    today_sent: number;
    week_sent: number;
    month_sent: number;
    success_rate: number;
    top_sequences: { name: string; sent_count: number }[];
}

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

function delayLabel(minutes: number): string {
    if (minutes < 60) return `${minutes}dk`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}sa`;
    if (minutes < 10080) return `${Math.round(minutes / 1440)}gün`;
    if (minutes < 43200) return `${Math.round(minutes / 10080)}hf`;
    if (minutes < 129600) return `${Math.round(minutes / 43200)}ay`;
    return `${Math.round(minutes / 43200)}ay`;
}

function triggerLabel(t: string): string {
    const map: Record<string, string> = {
        checkout_abandoned: 'Terk Edilen Sepet',
        purchase_completed: 'Satın Alma Sonrası',
        no_login_after_purchase: 'Satın Alma Sonrası Giriş Yok'
    };
    return map[t] ?? t;
}

function statusBadge(status: string) {
    const colors: Record<string, string> = {
        pending: '#f59e0b',
        sent: '#22c55e',
        failed: '#ef4444',
        cancelled: '#94a3b8'
    };
    const labels: Record<string, string> = {
        pending: 'Bekliyor', sent: 'Gönderildi', failed: 'Hata', cancelled: 'İptal'
    };
    return (
        <span style={{
            background: colors[status] ?? '#94a3b8',
            color: '#fff', padding: '2px 10px', borderRadius: '12px',
            fontSize: '0.78rem', fontWeight: 600
        }}>
            {labels[status] ?? status}
        </span>
    );
}

function formatDt(dt: string | null) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

// ──────────────────────────────────────────────────────
// Step Edit Modal
// ──────────────────────────────────────────────────────

function StepEditModal({ step, onClose, onSaved }: {
    step: Step;
    onClose: () => void;
    onSaved: (updated: Partial<Step>) => void;
}) {
    const [subject, setSubject] = useState(step.subject);
    const [bodyHtml, setBodyHtml] = useState(step.body_html);
    const [delayMinutes, setDelayMinutes] = useState(String(step.delay_minutes));
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setErr('');
        try {
            await emailAutomationAPI.updateStep(step.id, {
                subject,
                body_html: bodyHtml,
                delay_minutes: parseInt(delayMinutes, 10) || step.delay_minutes
            });
            onSaved({ subject, body_html: bodyHtml, delay_minutes: parseInt(delayMinutes, 10) || step.delay_minutes });
            onClose();
        } catch {
            setErr('Kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: '#fff', borderRadius: '12px', padding: '1.5rem',
                width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Adım Düzenle — Adım {step.step_order}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                </div>
                {err && <p style={{ color: '#ef4444' }}>{err}</p>}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>Gecikme (dakika)</label>
                    <input
                        type="number"
                        value={delayMinutes}
                        onChange={e => setDelayMinutes(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>Konu</label>
                    <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>
                        HTML İçerik
                        <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                            Değişkenler: {'{{first_name}}'} {'{{cart_link}}'} {'{{unsubscribe_link}}'}
                        </span>
                    </label>
                    <textarea
                        value={bodyHtml}
                        onChange={e => setBodyHtml(e.target.value)}
                        rows={14}
                        style={{
                            width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0',
                            borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>
                        İptal
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{
                        padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none',
                        background: '#1a3a52', color: '#fff', fontWeight: 700, cursor: 'pointer'
                    }}>
                        {saving ? 'Kaydediliyor…' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────
// Tab 1: Sequences
// ──────────────────────────────────────────────────────

function SequencesTab() {
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [editingStep, setEditingStep] = useState<Step | null>(null);
    const [toggling, setToggling] = useState<number | null>(null);

    useEffect(() => {
        emailAutomationAPI.getSequences()
            .then(res => setSequences(res.data.sequences ?? []))
            .catch(() => setSequences([]))
            .finally(() => setLoading(false));
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleActive = async (seq: Sequence) => {
        setToggling(seq.id);
        try {
            await emailAutomationAPI.updateSequence(seq.id, { is_active: !seq.is_active });
            setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, is_active: !s.is_active } : s));
        } catch {
            // ignore
        } finally {
            setToggling(null);
        }
    };

    const handleStepSaved = (seqId: number, stepId: number, updated: Partial<Step>) => {
        setSequences(prev => prev.map(s => {
            if (s.id !== seqId) return s;
            return { ...s, steps: s.steps.map(st => st.id === stepId ? { ...st, ...updated } : st) };
        }));
    };

    if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Yükleniyor…</div>;

    return (
        <div>
            {editingStep && (
                <StepEditModal
                    step={editingStep}
                    onClose={() => setEditingStep(null)}
                    onSaved={updated => {
                        const seq = sequences.find(s => s.steps.some(st => st.id === editingStep.id));
                        if (seq) handleStepSaved(seq.id, editingStep.id, updated);
                        setEditingStep(null);
                    }}
                />
            )}

            {sequences.length === 0 && (
                <p style={{ color: '#94a3b8', padding: '1rem' }}>Henüz sekans yok. Veritabanı migration çalıştırıldı mı?</p>
            )}

            {sequences.map(seq => (
                <div key={seq.id} style={{
                    border: '1px solid #e2e8f0', borderRadius: '10px',
                    marginBottom: '1rem', overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.25rem', background: '#f8fafc', cursor: 'pointer'
                    }} onClick={() => toggleExpand(seq.id)}>
                        <div>
                            <strong style={{ fontSize: '1rem', color: '#1a3a52' }}>{seq.name}</strong>
                            <span style={{
                                marginLeft: '0.75rem', fontSize: '0.8rem', color: '#64748b',
                                background: '#e2e8f0', padding: '2px 8px', borderRadius: '8px'
                            }}>
                                {triggerLabel(seq.trigger_event)}
                            </span>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                · {seq.steps.length} adım
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                onClick={e => { e.stopPropagation(); toggleActive(seq); }}
                                disabled={toggling === seq.id}
                                style={{
                                    padding: '4px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.82rem',
                                    background: seq.is_active ? '#22c55e' : '#94a3b8', color: '#fff'
                                }}
                            >
                                {seq.is_active ? 'Aktif' : 'Pasif'}
                            </button>
                            <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                                {expandedIds.has(seq.id) ? '▲' : '▼'}
                            </span>
                        </div>
                    </div>

                    {expandedIds.has(seq.id) && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', fontSize: '0.82rem', color: '#64748b' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>#</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Gecikme</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Konu</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {seq.steps.map(step => (
                                    <tr key={step.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.85rem' }}>{step.step_order}</td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: '#1a3a52', fontWeight: 600 }}>{delayLabel(step.delay_minutes)}</td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: '#334155' }}>{step.subject}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setEditingStep(step)}
                                                style={{
                                                    padding: '4px 12px', fontSize: '0.78rem', borderRadius: '6px',
                                                    border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#1a3a52', fontWeight: 600
                                                }}
                                            >
                                                Düzenle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ))}
        </div>
    );
}

// ──────────────────────────────────────────────────────
// Tab 2: Queue
// ──────────────────────────────────────────────────────

function QueueTab() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const load = (p: number, s: string) => {
        setLoading(true);
        emailAutomationAPI.getQueue({ page: p, ...(s ? { status: s } : {}) })
            .then(res => {
                setQueue(res.data.queue ?? []);
                setTotal(res.data.total ?? 0);
                setPage(res.data.page ?? 1);
                setPages(res.data.pages ?? 1);
            })
            .catch(() => setQueue([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(1, statusFilter); }, [statusFilter]);

    const statuses = [
        { value: '', label: 'Tümü' },
        { value: 'pending', label: 'Bekliyor' },
        { value: 'sent', label: 'Gönderildi' },
        { value: 'failed', label: 'Hata' },
        { value: 'cancelled', label: 'İptal' }
    ];

    return (
        <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {statuses.map(s => (
                    <button
                        key={s.value}
                        onClick={() => setStatusFilter(s.value)}
                        style={{
                            padding: '5px 14px', borderRadius: '20px', border: '1px solid #e2e8f0',
                            cursor: 'pointer', fontWeight: statusFilter === s.value ? 700 : 400,
                            background: statusFilter === s.value ? '#1a3a52' : '#fff',
                            color: statusFilter === s.value ? '#fff' : '#334155',
                            fontSize: '0.85rem'
                        }}
                    >
                        {s.label}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.85rem', alignSelf: 'center' }}>
                    {total} kayıt
                </span>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8', padding: '1rem' }}>Yükleniyor…</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>E-posta</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Sekans / Adım</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Konu</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Durum</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Zamanlandı</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Gönderildi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            )}
                            {queue.map(item => (
                                <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 10px', color: '#1a3a52' }}>{item.email}</td>
                                    <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                        {item.sequence_name ? `${item.sequence_name}${item.step_order ? ` #${item.step_order}` : ''}` : '—'}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.subject}
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>{statusBadge(item.status)}</td>
                                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{formatDt(item.scheduled_at)}</td>
                                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{formatDt(item.sent_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pages > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => load(page - 1, statusFilter)}
                        disabled={page <= 1}
                        style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                    >
                        ‹ Önceki
                    </button>
                    <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                        Sayfa {page} / {pages}
                    </span>
                    <button
                        onClick={() => load(page + 1, statusFilter)}
                        disabled={page >= pages}
                        style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                    >
                        Sonraki ›
                    </button>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────
// Tab 3: Stats
// ──────────────────────────────────────────────────────

function StatsTab() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        emailAutomationAPI.getStats()
            .then(res => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ color: '#94a3b8', padding: '1rem' }}>Yükleniyor…</div>;
    if (!stats) return <div style={{ color: '#ef4444', padding: '1rem' }}>İstatistikler yüklenemedi.</div>;

    const statCards = [
        { label: 'Bugün Gönderilen', value: stats.today_sent, color: '#1a3a52' },
        { label: 'Bu Hafta', value: stats.week_sent, color: '#2d5570' },
        { label: 'Bu Ay', value: stats.month_sent, color: '#475569' },
        { label: 'Başarı Oranı', value: `${stats.success_rate}%`, color: '#22c55e' },
        { label: 'Toplam Gönderildi', value: stats.by_status.sent, color: '#22c55e' },
        { label: 'Hatalı', value: stats.by_status.failed, color: '#ef4444' },
        { label: 'Bekliyor', value: stats.by_status.pending, color: '#f59e0b' },
        { label: 'İptal', value: stats.by_status.cancelled, color: '#94a3b8' }
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {statCards.map(card => (
                    <div key={card.label} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                        padding: '1rem', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: card.color }}>{card.value}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{card.label}</div>
                    </div>
                ))}
            </div>

            {stats.top_sequences.length > 0 && (
                <div>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1a3a52' }}>En Çok Gönderilen Sekanslar</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Sekans Adı</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Gönderilen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.top_sequences.map((s, i) => (
                                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 12px', color: '#334155' }}>{s.name}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>{s.sent_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────

const TABS = [
    { key: 'sequences', label: 'Akışlar' },
    { key: 'queue', label: 'E-posta Kuyruğu' },
    { key: 'stats', label: 'İstatistikler' }
] as const;

type TabKey = typeof TABS[number]['key'];

export default function EmailAutomation() {
    const [activeTab, setActiveTab] = useState<TabKey>('sequences');

    return (
        <AdminLayout>
        <div style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem', color: '#1a3a52' }}>E-posta Akışları</h2>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '0.5rem 1.25rem', border: 'none', background: 'none',
                            cursor: 'pointer', fontWeight: activeTab === tab.key ? 700 : 400,
                            color: activeTab === tab.key ? '#1a3a52' : '#64748b',
                            borderBottom: activeTab === tab.key ? '2px solid #1a3a52' : '2px solid transparent',
                            marginBottom: '-2px', fontSize: '0.95rem', transition: 'color 0.15s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'sequences' && <SequencesTab />}
            {activeTab === 'queue' && <QueueTab />}
            {activeTab === 'stats' && <StatsTab />}
        </div>
        </AdminLayout>
    );
}
