import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { API_BASE_URL } from '../../config/api';
import { HiPhotograph, HiCheckCircle, HiClock, HiPaperAirplane } from 'react-icons/hi';

type EyeUploadRow = {
    id: number;
    user_id: number;
    subscription_id: number | null;
    product_key: string;
    image_url: string;
    original_filename: string | null;
    status: 'pending' | 'reviewed' | 'sent';
    admin_notes: string | null;
    report_pdf_url: string | null;
    sent_at: string | null;
    created_at: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
};

const STATUS_LABEL: Record<EyeUploadRow['status'], string> = {
    pending: 'Beklemede',
    reviewed: 'İnceleniyor',
    sent: 'Gönderildi'
};

const STATUS_COLOR: Record<EyeUploadRow['status'], string> = {
    pending: '#f59e0b',
    reviewed: '#0ea5e9',
    sent: '#16a34a'
};

const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

type EyeUserPackage = {
    subscription_id: number;
    product_key: string;
    name: string;
    quota: number;
    used: number;
    remaining: number;
    period_started_at: string | null;
    period_ends_at: string | null;
};

const daysUntil = (iso?: string | null): number | null => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms)) return null;
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export default function EyeTrackingUploadsList() {
    const [rows, setRows] = useState<EyeUploadRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'sent'>('pending');
    const [selected, setSelected] = useState<EyeUploadRow | null>(null);
    const [selectedPackages, setSelectedPackages] = useState<EyeUserPackage[]>([]);
    const [notes, setNotes] = useState('');
    const [subject, setSubject] = useState('Reklam Görsel Analiz Raporunuz Hazır');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const pdfRef = useRef<HTMLInputElement>(null);

    const auth = (): Record<string, string> => {
        const t = localStorage.getItem('token');
        return t ? { Authorization: `Bearer ${t}` } : {};
    };

    const load = async () => {
        setLoading(true);
        try {
            const q = filter === 'all' ? '' : `?status=${filter}`;
            const res = await fetch(`${API_BASE_URL}/eye-tracking/admin${q}`, { headers: auth() });
            const data = await res.json();
            setRows(data.uploads || []);
        } catch (e) {
            console.error(e);
            setErr('Liste yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

    const handleSelect = async (r: EyeUploadRow) => {
        setSelected(r);
        setSelectedPackages([]);
        setNotes(r.admin_notes || '');
        setSubject('Reklam Görsel Analiz Raporunuz Hazır');
        setPdfFile(null);
        setMsg(''); setErr('');
        if (pdfRef.current) pdfRef.current.value = '';
        try {
            const res = await fetch(`${API_BASE_URL}/eye-tracking/admin/user/${r.user_id}/packages`, { headers: auth() });
            const data = await res.json();
            setSelectedPackages(data.packages || []);
        } catch {
            // sessiz — paket bilgisi opsiyonel
        }
    };

    const saveNotes = async () => {
        if (!selected) return;
        setBusy(true); setErr(''); setMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/eye-tracking/admin/${selected.id}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...auth() },
                body: JSON.stringify({ admin_notes: notes })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Hata');
            setMsg('Notlar kaydedildi');
            await load();
        } catch (e: any) {
            setErr(e.message || 'Hata');
        } finally {
            setBusy(false);
        }
    };

    const sendReport = async () => {
        if (!selected) return;
        if (!pdfFile) { setErr('PDF dosyası seçin'); return; }
        setBusy(true); setErr(''); setMsg('');
        try {
            const form = new FormData();
            form.append('file', pdfFile);
            form.append('admin_notes', notes);
            form.append('subject', subject);
            const res = await fetch(`${API_BASE_URL}/eye-tracking/admin/${selected.id}/report`, {
                method: 'POST',
                headers: { ...auth() }, // multipart — Content-Type otomatik
                body: form
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gönderim hatası');
            setMsg('Rapor gönderildi ve kullanıcıya mail edildi.');
            await load();
            // listede güncel selected'i bul
            setSelected(curr => curr ? { ...curr, status: 'sent', report_pdf_url: data.report_url, sent_at: new Date().toISOString() } : null);
        } catch (e: any) {
            setErr(e.message || 'Hata');
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ padding: 20 }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1a3a52' }}>
                    <HiPhotograph /> Reklam Görsel Analizleri
                </h1>

                <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px' }}>
                    {(['pending', 'reviewed', 'sent', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 14px', borderRadius: 999,
                                border: '1px solid ' + (filter === f ? '#1a3a52' : '#cbd5e1'),
                                background: filter === f ? '#1a3a52' : '#fff',
                                color: filter === f ? '#fff' : '#475569',
                                cursor: 'pointer', fontSize: '0.85rem'
                            }}
                        >
                            {f === 'all' ? 'Tümü' : STATUS_LABEL[f as 'pending' | 'reviewed' | 'sent']}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
                    {/* Liste */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: 16, color: '#64748b' }}>Yükleniyor…</div>
                        ) : rows.length === 0 ? (
                            <div style={{ padding: 16, color: '#64748b' }}>Kayıt yok</div>
                        ) : rows.map(r => {
                            const Icon = r.status === 'sent' ? HiCheckCircle : HiClock;
                            const active = selected?.id === r.id;
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => handleSelect(r)}
                                    style={{
                                        padding: 12, borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                        background: active ? '#f1f5f9' : '#fff'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '0.9rem', color: '#1a3a52' }}>
                                            {r.first_name || r.email || `Kullanıcı #${r.user_id}`} {r.last_name || ''}
                                        </strong>
                                        <Icon style={{ color: STATUS_COLOR[r.status] }} />
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                                        {r.product_key} · {formatDate(r.created_at)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detay */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, minHeight: 320 }}>
                        {!selected ? (
                            <div style={{ color: '#64748b' }}>Soldaki listeden bir yükleme seçin.</div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3a52' }}>
                                            {selected.first_name} {selected.last_name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>· {selected.email}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {selected.product_key} · Yüklendi: {formatDate(selected.created_at)}
                                            {selected.sent_at && <> · Gönderildi: {formatDate(selected.sent_at)}</>}
                                        </div>
                                    </div>
                                    <span style={{
                                        background: STATUS_COLOR[selected.status] + '22',
                                        color: STATUS_COLOR[selected.status],
                                        padding: '4px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600
                                    }}>{STATUS_LABEL[selected.status]}</span>
                                </div>

                                {/* Kullanıcının aktif paket durumu */}
                                {selectedPackages.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8, marginBottom: 12 }}>
                                        {selectedPackages.map(p => {
                                            const days = daysUntil(p.period_ends_at);
                                            return (
                                                <div key={p.subscription_id} style={{
                                                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10
                                                }}>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.name}</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a3a52', marginTop: 2 }}>
                                                        {p.remaining}<span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}> / {p.quota}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>kalan hak</span>
                                                    </div>
                                                    {days !== null && (
                                                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                                                            <strong>{days}</strong> gün sonra yenilenir
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <a href={selected.image_url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                                    <img src={selected.image_url} alt="upload" style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                </a>

                                <div style={{ marginTop: 16 }}>
                                    <label style={{ fontWeight: 600, color: '#1a3a52' }}>Analist Notu (kullanıcıya gidecek)</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={5}
                                        style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
                                        placeholder="Görsel analizine dair önemli notlar..."
                                    />
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button onClick={saveNotes} disabled={busy} style={{ padding: '6px 14px', background: '#fff', color: '#1a3a52', border: '1px solid #1a3a52', borderRadius: 8, cursor: 'pointer' }}>
                                            Notu Kaydet
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                                    <label style={{ fontWeight: 600, color: '#1a3a52' }}>Mail Konusu</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
                                    />
                                    <label style={{ display: 'block', fontWeight: 600, color: '#1a3a52', marginTop: 12 }}>Rapor PDF</label>
                                    <input
                                        ref={pdfRef}
                                        type="file"
                                        accept="application/pdf"
                                        onChange={e => setPdfFile(e.target.files?.[0] || null)}
                                        style={{ marginTop: 6 }}
                                    />
                                    {selected.report_pdf_url && (
                                        <div style={{ fontSize: '0.85rem', marginTop: 8 }}>
                                            Mevcut rapor: <a href={selected.report_pdf_url} target="_blank" rel="noreferrer">İndir</a>
                                        </div>
                                    )}
                                    <button
                                        onClick={sendReport}
                                        disabled={busy || !pdfFile}
                                        style={{
                                            marginTop: 14, padding: '10px 18px',
                                            background: pdfFile ? '#1a3a52' : '#cbd5e1', color: '#fff',
                                            border: 'none', borderRadius: 8, fontWeight: 700,
                                            cursor: pdfFile && !busy ? 'pointer' : 'not-allowed',
                                            display: 'inline-flex', alignItems: 'center', gap: 6
                                        }}
                                    >
                                        <HiPaperAirplane /> Raporu Gönder + Mail Et
                                    </button>
                                </div>

                                {msg && <div style={{ background: '#ecfdf5', color: '#065f46', padding: 10, borderRadius: 8, marginTop: 12 }}>{msg}</div>}
                                {err && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 8, marginTop: 12 }}>{err}</div>}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
