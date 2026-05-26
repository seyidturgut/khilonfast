import { useEffect, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { crmAPI, type CrmTag, type CrmList } from '../../../services/api';
import { HiUpload, HiDownload, HiCheckCircle } from 'react-icons/hi';
import { CrmPageStyles } from './Contacts';

const CONTACT_FIELDS = ['email', 'first_name', 'last_name', 'phone', 'company'];

export default function CrmImportPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [csv, setCsv] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<string[][]>([]);
    const [total, setTotal] = useState(0);
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [tagSlugs, setTagSlugs] = useState<string[]>([]);
    const [listIds, setListIds] = useState<number[]>([]);
    const [status, setStatus] = useState('subscribed');
    const [updateExisting, setUpdateExisting] = useState(false);
    const [tags, setTags] = useState<CrmTag[]>([]);
    const [lists, setLists] = useState<CrmList[]>([]);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([crmAPI.listTags(), crmAPI.listLists()]).then(([tr, lr]) => {
            setTags(tr.data?.tags || []);
            setLists(lr.data?.lists || []);
        });
    }, []);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => setCsv(String(e.target?.result || ''));
        reader.readAsText(file, 'utf-8');
    };

    const parsePreview = async () => {
        if (!csv.trim()) { setError('CSV boş'); return; }
        try {
            setError('');
            const res = await crmAPI.csvPreview(csv);
            setHeaders(res.data?.headers || []);
            setPreviewRows(res.data?.rows || []);
            setTotal(Number(res.data?.total || 0));
            // Otomatik mapping (header ismi field ismine eşleşirse)
            const auto: Record<string, number> = {};
            for (const f of CONTACT_FIELDS) {
                const idx = (res.data?.headers || []).findIndex((h: string) => h.toLowerCase().replace(/[\s-]/g, '_') === f);
                if (idx >= 0) auto[f] = idx;
            }
            setMapping(auto);
            setStep(2);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Önizleme hatası');
        }
    };

    const runImport = async () => {
        if (mapping.email == null) { setError('email alanı zorunlu, mapping yapın'); return; }
        try {
            setRunning(true); setError('');
            const res = await crmAPI.csvImport({
                csv,
                mapping,
                tag_slugs: tagSlugs,
                list_ids: listIds,
                status,
                update_existing: updateExisting,
            });
            setResult(res.data?.stats);
            setStep(3);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Import hatası');
        } finally {
            setRunning(false);
        }
    };

    return (
        <AdminLayout>
            <div className="crm-page">
                <header className="page-header">
                    <div className="page-title"><HiUpload /> CSV Import / Export</div>
                </header>

                <div className="step-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. CSV Yükle</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Eşleme & Etiket</div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Sonuç</div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {step === 1 && (
                    <div className="card-block">
                        <h3>CSV Dosyası Yükle</h3>
                        <p style={{ color: '#64748b', fontSize: 13 }}>
                            Başlık satırı ilk satırda olmalı. Email kolonu zorunlu, diğer alanlar (first_name, last_name, phone, company) opsiyoneldir.
                        </p>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                            style={{ marginBottom: 14 }}
                        />
                        <textarea
                            rows={10}
                            value={csv}
                            onChange={(e) => setCsv(e.target.value)}
                            placeholder="email,first_name,last_name&#10;ahmet@example.com,Ahmet,Yilmaz&#10;ayse@example.com,Ayse,Kara"
                            style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }}
                        />
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <a href={crmAPI.csvExportUrl()} className="btn btn-secondary" download>
                                <HiDownload /> Tüm kişileri export et
                            </a>
                            <button className="btn btn-primary" onClick={parsePreview} disabled={!csv.trim()}>
                                Devam → Eşleme
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <>
                        <div className="card-block">
                            <h3>Sütun Eşleme</h3>
                            <p style={{ color: '#64748b', fontSize: 13 }}>{total} satır algılandı. CSV kolonlarını sistem alanlarına eşleyin.</p>
                            <table className="data-table" style={{ marginTop: 10 }}>
                                <thead>
                                    <tr>
                                        <th>Sistem Alanı</th>
                                        <th>CSV Kolonu</th>
                                        <th>Örnek Veri</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CONTACT_FIELDS.map(f => (
                                        <tr key={f}>
                                            <td><b>{f}</b>{f === 'email' && <span style={{ color: '#dc2626' }}> *</span>}</td>
                                            <td>
                                                <select
                                                    value={mapping[f] ?? ''}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        setMapping(prev => {
                                                            const next = { ...prev };
                                                            if (v === '') delete next[f];
                                                            else next[f] = Number(v);
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    <option value="">— Atla —</option>
                                                    {headers.map((h, i) => (
                                                        <option key={i} value={i}>{h}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="muted">{mapping[f] != null ? previewRows[0]?.[mapping[f]] || '—' : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card-block">
                            <h3>Otomatik Etiket / Liste</h3>
                            <p style={{ color: '#64748b', fontSize: 13 }}>İçe aktarılan tüm kişilere bu etiketler/listeler eklenir.</p>
                            <div className="form-row">
                                <label>Etiketler</label>
                                <div className="tag-grid">
                                    {tags.map(t => (
                                        <button key={t.id} type="button"
                                            className={`tag-toggle ${tagSlugs.includes(t.slug) ? 'on' : ''}`}
                                            style={tagSlugs.includes(t.slug) ? { background: t.color + '22', color: t.color, borderColor: t.color } : {}}
                                            onClick={() => setTagSlugs(prev => prev.includes(t.slug) ? prev.filter(x => x !== t.slug) : [...prev, t.slug])}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-row">
                                <label>Static Listeler</label>
                                <div className="tag-grid">
                                    {lists.filter(l => l.type === 'static').map(l => (
                                        <button key={l.id} type="button"
                                            className={`tag-toggle ${listIds.includes(l.id) ? 'on' : ''}`}
                                            onClick={() => setListIds(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-row two-col">
                                <div>
                                    <label>Varsayılan Durum</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                        <option value="subscribed">Abone</option>
                                        <option value="pending">Beklemede</option>
                                        <option value="unsubscribed">Çıktı</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Mevcut Kişiler</label>
                                    <label className="cb-label" style={{ marginTop: 8 }}>
                                        <input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} />
                                        <span>Var olan kayıtları güncelle (ad/soyad/telefon)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Geri</button>
                            <button className="btn btn-primary" onClick={runImport} disabled={running || mapping.email == null}>
                                {running ? 'İçe aktarılıyor…' : `${total} kişiyi içe aktar`}
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && result && (
                    <div className="card-block">
                        <div style={{ textAlign: 'center', padding: 30 }}>
                            <HiCheckCircle style={{ fontSize: 56, color: '#16a34a' }} />
                            <h2 style={{ margin: '12px 0 6px' }}>Import tamamlandı!</h2>
                            <p style={{ color: '#64748b' }}>{total} satır işlendi.</p>
                        </div>
                        <div className="result-stats">
                            <div className="result-card ok">
                                <div className="rc-num">{result.inserted}</div>
                                <div className="rc-label">Yeni</div>
                            </div>
                            <div className="result-card warn">
                                <div className="rc-num">{result.updated}</div>
                                <div className="rc-label">Güncellendi</div>
                            </div>
                            <div className="result-card neutral">
                                <div className="rc-num">{result.skipped}</div>
                                <div className="rc-label">Atlandı</div>
                            </div>
                            <div className="result-card err">
                                <div className="rc-num">{(result.errors || []).length}</div>
                                <div className="rc-label">Hata</div>
                            </div>
                        </div>
                        {result.errors && result.errors.length > 0 && (
                            <details style={{ marginTop: 14 }}>
                                <summary style={{ cursor: 'pointer', color: '#dc2626' }}>Hata detayları ({result.errors.length})</summary>
                                <ul style={{ fontSize: 12, color: '#475569' }}>
                                    {result.errors.slice(0, 30).map((err: string, i: number) => <li key={i}>{err}</li>)}
                                </ul>
                            </details>
                        )}
                        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 10 }}>
                            <button className="btn btn-secondary" onClick={() => { setStep(1); setCsv(''); setResult(null); }}>Yeni Import</button>
                            <a href="/admin/crm/contacts" className="btn btn-primary">Kişiler Sayfasına Git →</a>
                        </div>
                    </div>
                )}
            </div>
            <CrmPageStyles />
            <style>{`
                .step-indicator { display: flex; gap: 4px; margin-bottom: 18px; }
                .step-indicator .step { flex: 1; padding: 10px 14px; background: #f1f5f9; color: #94a3b8; font-size: 13px; font-weight: 600; text-align: center; border-radius: 6px; }
                .step-indicator .step.active { background: #2563eb; color: white; }
                .card-block { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 16px; }
                .card-block h3 { margin: 0 0 12px; font-size: 16px; }
                .tag-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
                .tag-toggle { padding: 5px 12px; border-radius: 14px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-size: 13px; }
                .tag-toggle.on { font-weight: 600; }
                .cb-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
                .result-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
                .result-card { padding: 18px; border-radius: 10px; text-align: center; border-left: 4px solid; }
                .result-card.ok { background: #f0fdf4; border-color: #16a34a; }
                .result-card.warn { background: #fef3c7; border-color: #a16207; }
                .result-card.neutral { background: #f8fafc; border-color: #94a3b8; }
                .result-card.err { background: #fef2f2; border-color: #dc2626; }
                .rc-num { font-size: 32px; font-weight: 700; color: #0f172a; }
                .rc-label { font-size: 12px; color: #64748b; }
            `}</style>
        </AdminLayout>
    );
}
