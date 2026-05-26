import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI } from '../../../services/api';
import { HiUsers, HiMail, HiChartBar, HiLightningBolt } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

export default function CrmDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await crmAPI.getDashboard(30);
                setStats(res.data?.stats || null);
            } finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <AdminLayout><div className="crm-page"><div className="loading">Yükleniyor…</div></div><CrmPageStyles /></AdminLayout>;
    if (!stats) return <AdminLayout><div className="crm-page"><div className="error-banner">Dashboard yüklenemedi</div></div><CrmPageStyles /></AdminLayout>;

    const sparklineMax = Math.max(...stats.growth_timeseries.map((p: any) => p.count), 1);

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiChartBar /> CRM Dashboard</div>
                </header>

                {/* Hero KPIs */}
                <div className="kpi-grid">
                    <KpiCard label="Toplam Kişi" value={stats.contacts.total} icon={<HiUsers />} accent="#2563eb" />
                    <KpiCard label="Aktif Abone" value={stats.contacts.subscribed || 0} icon={<HiUsers />} accent="#16a34a" />
                    <KpiCard label="Son 30 Gün" value={`+${stats.growth_30d}`} icon={<HiChartBar />} accent="#9333ea" />
                    <KpiCard label="Son 7 Gün" value={`+${stats.growth_7d}`} icon={<HiLightningBolt />} accent="#a16207" />
                </div>

                <div className="dash-grid">
                    {/* Growth chart */}
                    <section className="dash-card">
                        <h3>Büyüme (Son 30 Gün)</h3>
                        {stats.growth_timeseries.length > 1 ? (
                            <div className="bar-chart">
                                {stats.growth_timeseries.map((p: any, i: number) => (
                                    <div key={i} className="bar-col" title={`${p.date}: ${p.count} kişi`}>
                                        <div className="bar-fill" style={{ height: `${(p.count / sparklineMax) * 100}%` }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-tip">Henüz yeterli veri yok.</div>
                        )}
                    </section>

                    {/* Score distribution */}
                    <section className="dash-card">
                        <h3>Lead Skoru Dağılımı</h3>
                        <div className="score-bars">
                            <ScoreBar label="🔥 Sıcak (>10)" count={stats.score_distribution.hot} total={stats.contacts.total} color="#dc2626" />
                            <ScoreBar label="🌡️ Ilık (1-10)" count={stats.score_distribution.warm} total={stats.contacts.total} color="#f59e0b" />
                            <ScoreBar label="❄️ Soğuk (≤0)" count={stats.score_distribution.cold} total={stats.contacts.total} color="#2563eb" />
                        </div>
                    </section>

                    {/* Top sources */}
                    <section className="dash-card">
                        <h3>En Çok Kaynak</h3>
                        {stats.top_sources.length === 0 ? <div className="empty-tip">—</div> : (
                            <ul className="bar-list">
                                {stats.top_sources.map((s: any, i: number) => (
                                    <li key={i}>
                                        <span className="bar-label">{s.source}</span>
                                        <span className="bar-count">{s.count}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Top tags */}
                    <section className="dash-card">
                        <h3>En Çok Kullanılan Etiketler</h3>
                        {stats.top_tags.length === 0 ? <div className="empty-tip">Etiket yok</div> : (
                            <ul className="bar-list">
                                {stats.top_tags.map((t: any, i: number) => (
                                    <li key={i}>
                                        <span className="tag-pill" style={{ background: t.color + '22', color: t.color, borderColor: t.color + '55' }}>{t.name}</span>
                                        <span className="bar-count">{t.count}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* List health */}
                    <section className="dash-card span-2">
                        <h3>Liste Sağlığı (Deliverable %)</h3>
                        {stats.list_health.length === 0 ? <div className="empty-tip">Liste yok</div> : (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Liste</th><th>Tür</th><th>Toplam</th><th>Aktif</th><th>Sağlık</th></tr>
                                </thead>
                                <tbody>
                                    {stats.list_health.map((l: any) => (
                                        <tr key={l.id}>
                                            <td><Link to={`/admin/crm/lists/${l.id}`} className="row-link">{l.name}</Link></td>
                                            <td>{l.type}</td>
                                            <td>{l.count}</td>
                                            <td>{l.deliverable}</td>
                                            <td>
                                                <div className="health-bar">
                                                    <div className="health-fill" style={{ width: `${l.health}%`, background: l.health > 90 ? '#16a34a' : l.health > 70 ? '#f59e0b' : '#dc2626' }} />
                                                    <span>{l.health}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    {/* Campaigns summary */}
                    <section className="dash-card span-2">
                        <h3>Kampanya Performansı</h3>
                        <div className="kpi-row">
                            <div><b>{stats.campaigns.total}</b><span>Toplam</span></div>
                            <div><b>{stats.campaigns.sent}</b><span>Gönderilen</span></div>
                            <div><b>%{stats.campaigns.avg_open_rate}</b><span>Ortalama Açılma</span></div>
                            <div><b>%{stats.campaigns.avg_click_rate}</b><span>Ortalama Tıklama</span></div>
                        </div>
                        <div style={{ marginTop: 14 }}>
                            <h4 style={{ fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Son Kampanyalar</h4>
                            {stats.recent_campaigns.length === 0 ? <div className="empty-tip">Henüz kampanya yok</div> : (
                                <ul className="bar-list">
                                    {stats.recent_campaigns.map((c: any) => (
                                        <li key={c.id}>
                                            <Link to={`/admin/crm/campaigns/${c.id}`} className="row-link">{c.name}</Link>
                                            <span className={`status-pill status-${c.status}`}>{c.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* Activity heatmap */}
                    <section className="dash-card">
                        <h3>Son 30 Gün Aktivite</h3>
                        <ul className="activity-list">
                            <li><HiMail style={{ color: '#2563eb' }} /> <b>{stats.activity_30d.email_events}</b> e-posta olayı</li>
                            <li>📦 <b>{stats.activity_30d.orders}</b> sipariş</li>
                            <li>✓ <b>{stats.activity_30d.consents}</b> onay</li>
                            <li>🌐 <b>{stats.activity_30d.web_visits}</b> sayfa ziyareti</li>
                            <li>📋 <b>{stats.activity_30d.form_submissions}</b> form gönderimi</li>
                        </ul>
                    </section>

                    {/* Forms */}
                    <section className="dash-card">
                        <h3>Top Formlar</h3>
                        <div style={{ marginBottom: 10 }}>
                            <span style={{ fontSize: 22, fontWeight: 700 }}>{stats.forms.submissions_30d}</span>
                            <span style={{ marginLeft: 6, color: '#64748b', fontSize: 13 }}>son 30g gönderim</span>
                        </div>
                        {stats.forms.top_forms.length === 0 ? <div className="empty-tip">—</div> : (
                            <ul className="bar-list">
                                {stats.forms.top_forms.map((f: any) => (
                                    <li key={f.id}>
                                        <Link to={`/admin/crm/forms/${f.id}`} className="row-link">{f.name}</Link>
                                        <span className="bar-count">{f.count}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
            <CrmPageStyles />
            <style>{`
                .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 18px; }
                .kpi-card { background: white; border: 1px solid #e2e8f0; border-left: 4px solid; border-radius: 10px; padding: 16px; display: flex; gap: 12px; align-items: center; }
                .kpi-icon { font-size: 26px; }
                .kpi-num { font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1; }
                .kpi-label { font-size: 12px; color: #64748b; }
                .dash-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
                .dash-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
                .dash-card.span-2 { grid-column: span 2; }
                .dash-card h3 { margin: 0 0 12px; font-size: 14px; color: #0f172a; }
                .dash-card h4 { margin: 0 0 8px; font-size: 11px; }
                .empty-tip { color: #94a3b8; font-style: italic; padding: 16px; text-align: center; font-size: 13px; }
                .bar-chart { display: flex; align-items: flex-end; gap: 2px; height: 80px; padding-top: 4px; }
                .bar-col { flex: 1; min-height: 100%; display: flex; align-items: flex-end; }
                .bar-fill { width: 100%; background: #2563eb; border-radius: 2px 2px 0 0; min-height: 2px; }
                .bar-fill:hover { background: #1d4ed8; }
                .bar-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
                .bar-list li { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                .bar-list li:last-child { border-bottom: none; }
                .bar-count { font-weight: 700; color: #0f172a; }
                .bar-label { color: #475569; }
                .tag-pill { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; border: 1px solid; }
                .score-bars { display: flex; flex-direction: column; gap: 10px; }
                .score-bar { display: flex; align-items: center; gap: 10px; }
                .score-bar-label { width: 130px; font-size: 13px; }
                .score-bar-track { flex: 1; height: 22px; background: #f1f5f9; border-radius: 4px; overflow: hidden; position: relative; }
                .score-bar-fill { height: 100%; }
                .score-bar-count { font-weight: 700; min-width: 36px; text-align: right; font-size: 13px; }
                .health-bar { position: relative; height: 18px; background: #f1f5f9; border-radius: 4px; overflow: hidden; min-width: 80px; }
                .health-fill { height: 100%; }
                .health-bar span { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: 700; color: #0f172a; mix-blend-mode: difference; }
                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .kpi-row > div { padding: 10px; background: #f8fafc; border-radius: 6px; text-align: center; }
                .kpi-row b { display: block; font-size: 22px; color: #0f172a; }
                .kpi-row span { font-size: 11px; color: #64748b; }
                .activity-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
                .activity-list li { display: flex; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
                .activity-list b { color: #0f172a; }
                .status-pill { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
                .status-draft { background: #f1f5f9; color: #475569; }
                .status-sent { background: #dcfce7; color: #15803d; }
                .status-sending { background: #fef3c7; color: #a16207; }
                .row-link { color: #2563eb; font-weight: 600; text-decoration: none; }
                .data-table th { padding: 8px 10px; background: #f8fafc; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; }
                .data-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                @media (max-width: 1024px) {
                    .dash-grid { grid-template-columns: 1fr 1fr; }
                    .dash-card.span-2 { grid-column: span 2; }
                }
                @media (max-width: 640px) {
                    .dash-grid { grid-template-columns: 1fr; }
                    .dash-card.span-2 { grid-column: span 1; }
                }
            `}</style>
        </AdminLayout>
    );
}

function KpiCard({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
    return (
        <div className="kpi-card" style={{ borderLeftColor: accent }}>
            <div className="kpi-icon" style={{ color: accent }}>{icon}</div>
            <div>
                <div className="kpi-num">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</div>
                <div className="kpi-label">{label}</div>
            </div>
        </div>
    );
}

function ScoreBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="score-bar">
            <div className="score-bar-label">{label}</div>
            <div className="score-bar-track">
                <div className="score-bar-fill" style={{ width: pct + '%', background: color }} />
            </div>
            <div className="score-bar-count">{count}</div>
        </div>
    );
}
