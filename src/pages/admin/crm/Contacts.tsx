import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmContact } from '../../../services/api';
import { HiUsers, HiSearch, HiPlus, HiTrash, HiRefresh, HiX, HiChartBar } from 'react-icons/hi';

interface CrmStats {
    total: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
    recent_7d: number;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
    subscribed:   { bg: '#dcfce7', fg: '#15803d', label: 'Abone' },
    unsubscribed: { bg: '#fee2e2', fg: '#b91c1c', label: 'Çıktı' },
    bounced:      { bg: '#fed7aa', fg: '#c2410c', label: 'Bounce' },
    complained:   { bg: '#fde2e7', fg: '#9d174d', label: 'Şikayet' },
    pending:      { bg: '#fef3c7', fg: '#a16207', label: 'Beklemede' },
};

const SOURCE_LABEL: Record<string, string> = {
    user_account: 'Üye',
    email_event: 'Lead (E-posta)',
    order: 'Sipariş',
    manual: 'Elle Eklendi',
};

export default function CrmContactsPage() {
    const [contacts, setContacts] = useState<CrmContact[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);
    const [page, setPage] = useState(1);
    const [perPage] = useState(50);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [stats, setStats] = useState<CrmStats | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ email: '', first_name: '', last_name: '', phone: '', company: '' });
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState('');
    const [backfillRunning, setBackfillRunning] = useState(false);
    const [backfillResult, setBackfillResult] = useState<string>('');

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 300);
        return () => clearTimeout(t);
    }, [q]);

    const loadContacts = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await crmAPI.listContacts({
                q: debouncedQ || undefined,
                status: statusFilter || undefined,
                source: sourceFilter || undefined,
                page,
                per_page: perPage,
                sort: 'created_at',
                dir: 'desc',
            });
            setContacts(res.data?.contacts || []);
            setTotal(Number(res.data?.total || 0));
            setPages(Number(res.data?.pages || 0));
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || 'Yükleme hatası');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await crmAPI.getStats();
            setStats(res.data?.stats || null);
        } catch {}
    };

    useEffect(() => { loadContacts(); }, [debouncedQ, statusFilter, sourceFilter, page]);
    useEffect(() => { loadStats(); }, []);

    const toggleSelect = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };
    const toggleSelectAll = () => {
        if (selectedIds.size === contacts.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(contacts.map(c => c.id)));
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.size) return;
        if (!confirm(`${selectedIds.size} kişi silinsin mi?`)) return;
        try {
            await crmAPI.bulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
            await loadContacts();
            await loadStats();
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Silme hatası');
        }
    };

    const handleBackfill = async () => {
        if (!confirm('Mevcut kullanıcı, sipariş ve lead e-postaları CRM kayıtlarına yüklensin mi? Bu işlem mevcut kayıtları güncellemez, sadece eksikleri ekler.')) return;
        try {
            setBackfillRunning(true);
            setBackfillResult('');
            const res = await crmAPI.runBackfill();
            const s = res.data?.stats;
            setBackfillResult(`✓ Tamamlandı — Üyeler: ${s?.users || 0}, Lead'ler: ${s?.email_events || 0}, Siparişler: ${s?.orders || 0}, Toplam: ${s?.total_after || 0}`);
            await loadContacts();
            await loadStats();
        } catch (e: any) {
            setBackfillResult('Hata: ' + (e?.response?.data?.error || e.message));
        } finally {
            setBackfillRunning(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        if (!createForm.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(createForm.email.trim())) {
            setCreateError('Geçerli e-posta zorunlu');
            return;
        }
        try {
            setCreateSubmitting(true);
            await crmAPI.createContact({
                email: createForm.email.trim().toLowerCase(),
                first_name: createForm.first_name.trim(),
                last_name: createForm.last_name.trim(),
                phone: createForm.phone.trim(),
                company: createForm.company.trim(),
                source: 'manual',
            });
            setShowCreateModal(false);
            setCreateForm({ email: '', first_name: '', last_name: '', phone: '', company: '' });
            await loadContacts();
            await loadStats();
        } catch (e: any) {
            setCreateError(e?.response?.data?.error || 'Oluşturma hatası');
        } finally {
            setCreateSubmitting(false);
        }
    };

    const fmtDate = (s: string | null) => {
        if (!s) return '—';
        try { return new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return s; }
    };

    const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;

    const sourceOptions = useMemo(() => {
        const set = new Set<string>(['user_account', 'email_event', 'order', 'manual']);
        if (stats?.by_source) Object.keys(stats.by_source).forEach(s => set.add(s));
        return Array.from(set);
    }, [stats]);

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title">
                        <HiUsers /> CRM Kişiler
                    </div>
                    <div className="page-actions">
                        <button className="btn btn-secondary" onClick={handleBackfill} disabled={backfillRunning}>
                            <HiRefresh /> {backfillRunning ? 'Yükleniyor…' : 'Mevcut Verileri İçe Aktar'}
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                            <HiPlus /> Yeni Kişi
                        </button>
                    </div>
                </header>

                {backfillResult && (
                    <div className={`backfill-banner ${backfillResult.startsWith('Hata') ? 'err' : 'ok'}`}>
                        {backfillResult}
                    </div>
                )}

                {/* Stats kartları */}
                {stats && (
                    <div className="stats-grid">
                        <StatCard label="Toplam Kişi" value={stats.total} icon={<HiUsers />} />
                        <StatCard label="Son 7 Gün" value={stats.recent_7d} icon={<HiChartBar />} />
                        <StatCard label="Aktif Abone" value={stats.by_status?.subscribed || 0} icon={<HiUsers />} accent="#16a34a" />
                        <StatCard label="Ayrılan" value={stats.by_status?.unsubscribed || 0} icon={<HiUsers />} accent="#dc2626" />
                    </div>
                )}

                {/* Filter bar */}
                <div className="filter-bar">
                    <div className="search-input">
                        <HiSearch />
                        <input
                            type="text"
                            placeholder="E-posta, isim, telefon, firma..."
                            value={q}
                            onChange={(e) => { setQ(e.target.value); setPage(1); }}
                        />
                    </div>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">Tüm durumlar</option>
                        <option value="subscribed">Abone</option>
                        <option value="unsubscribed">Çıktı</option>
                        <option value="bounced">Bounce</option>
                        <option value="complained">Şikayet</option>
                        <option value="pending">Beklemede</option>
                    </select>
                    <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
                        <option value="">Tüm kaynaklar</option>
                        {sourceOptions.map(s => (
                            <option key={s} value={s}>{SOURCE_LABEL[s] || s}</option>
                        ))}
                    </select>
                    {selectedIds.size > 0 && (
                        <button className="btn btn-danger" onClick={handleBulkDelete}>
                            <HiTrash /> Seçileni Sil ({selectedIds.size})
                        </button>
                    )}
                </div>

                {error && <div className="error-banner">{error}</div>}

                {/* Tablo */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th>
                                <th>E-posta</th>
                                <th>Ad Soyad</th>
                                <th>Firma</th>
                                <th>Durum</th>
                                <th>Kaynak</th>
                                <th>Skor</th>
                                <th>Son Aktivite</th>
                                <th>Eklenme</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="empty">Yükleniyor…</td></tr>
                            ) : contacts.length === 0 ? (
                                <tr><td colSpan={9} className="empty">
                                    Henüz kayıt yok. <button className="link-btn" onClick={handleBackfill}>Mevcut verileri içe aktar</button> veya yeni kişi ekleyin.
                                </td></tr>
                            ) : contacts.map(c => {
                                const sc = STATUS_COLORS[c.status] || STATUS_COLORS.subscribed;
                                return (
                                    <tr key={c.id}>
                                        <td><input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                                        <td>
                                            <Link to={`/admin/crm/contacts/${c.id}`} className="row-link">
                                                {c.email}
                                            </Link>
                                        </td>
                                        <td>{`${c.first_name || ''} ${c.last_name || ''}`.trim() || '—'}</td>
                                        <td>{c.company || '—'}</td>
                                        <td>
                                            <span className="status-pill" style={{ background: sc.bg, color: sc.fg }}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="source-cell">{SOURCE_LABEL[c.source] || c.source}</td>
                                        <td><span className="score-pill">{c.score}</span></td>
                                        <td className="muted">{fmtDate(c.last_activity_at)}</td>
                                        <td className="muted">{fmtDate(c.created_at)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Önceki</button>
                        <span>{page} / {pages} ({total} kişi)</span>
                        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Sonraki →</button>
                    </div>
                )}

                {/* Create modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Yeni Kişi Ekle</h3>
                                <button onClick={() => setShowCreateModal(false)}><HiX /></button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="form-row">
                                    <label>E-posta *</label>
                                    <input type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                                </div>
                                <div className="form-row two-col">
                                    <div>
                                        <label>Ad</label>
                                        <input type="text" value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label>Soyad</label>
                                        <input type="text" value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label>Telefon</label>
                                    <input type="tel" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <label>Firma</label>
                                    <input type="text" value={createForm.company} onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })} />
                                </div>
                                {createError && <div className="error-banner">{createError}</div>}
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>İptal</button>
                                    <button type="submit" className="btn btn-primary" disabled={createSubmitting}>
                                        {createSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <CrmPageStyles />
        </AdminLayout>
    );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
    return (
        <div className="stat-card" style={accent ? { borderLeftColor: accent } : undefined}>
            <div className="stat-icon" style={accent ? { color: accent } : undefined}>{icon}</div>
            <div>
                <div className="stat-value">{value.toLocaleString('tr-TR')}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

export function CrmPageStyles() {
    return (
        <style>{`
            .crm-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
            .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
            .page-title { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 700; color: #0f172a; }
            .page-title svg { font-size: 28px; color: #2563eb; }
            .page-actions { display: flex; gap: 10px; }
            .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; }
            .btn-primary { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; }
            .btn-primary:hover:not(:disabled) { opacity: 0.9; }
            .btn-secondary { background: white; color: #1e293b; border: 1px solid #cbd5e1; }
            .btn-secondary:hover:not(:disabled) { background: #f8fafc; }
            .btn-danger { background: #dc2626; color: white; }
            .btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px; }
            .stat-card { background: white; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; border-left: 3px solid #2563eb; display: flex; gap: 14px; align-items: center; }
            .stat-icon { font-size: 28px; color: #2563eb; }
            .stat-value { font-size: 22px; font-weight: 700; color: #0f172a; }
            .stat-label { font-size: 12px; color: #64748b; }
            .filter-bar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
            .search-input { position: relative; flex: 1; min-width: 240px; }
            .search-input svg { position: absolute; top: 50%; left: 12px; transform: translateY(-50%); color: #94a3b8; }
            .search-input input { width: 100%; padding: 9px 12px 9px 36px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
            .filter-bar select { padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: white; cursor: pointer; }
            .table-wrapper { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .data-table th { text-align: left; padding: 12px 14px; background: #f8fafc; font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
            .data-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
            .data-table tbody tr:hover { background: #f8fafc; }
            .data-table .empty { text-align: center; padding: 40px; color: #94a3b8; }
            .row-link { color: #2563eb; font-weight: 600; text-decoration: none; }
            .row-link:hover { text-decoration: underline; }
            .status-pill { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .source-cell { font-size: 13px; color: #64748b; }
            .score-pill { display: inline-block; min-width: 28px; padding: 2px 8px; border-radius: 10px; background: #eff6ff; color: #1d4ed8; font-weight: 700; text-align: center; }
            .muted { color: #94a3b8; font-size: 13px; }
            .pagination { display: flex; gap: 12px; align-items: center; justify-content: center; padding: 16px 0; }
            .pagination button { padding: 6px 14px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; cursor: pointer; }
            .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
            .error-banner { background: #fef2f2; color: #b91c1c; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 14px; border: 1px solid #fecaca; }
            .backfill-banner { padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 14px; border: 1px solid; }
            .backfill-banner.ok { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
            .backfill-banner.err { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
            .link-btn { background: none; border: none; color: #2563eb; cursor: pointer; padding: 0; font: inherit; text-decoration: underline; }
            .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
            .modal-card { background: white; border-radius: 12px; padding: 22px; max-width: 480px; width: 90%; }
            .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .modal-header h3 { margin: 0; color: #0f172a; }
            .modal-header button { background: none; border: none; cursor: pointer; font-size: 22px; color: #64748b; }
            .form-row { margin-bottom: 12px; }
            .form-row label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
            .form-row input, .form-row textarea, .form-row select { width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
            .form-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
        `}</style>
    );
}
