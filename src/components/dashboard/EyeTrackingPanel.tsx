import { useEffect, useRef, useState } from 'react';
import { HiCloudArrowUp, HiCheckCircle, HiClock, HiArrowDownTray } from 'react-icons/hi2';
import { API_BASE_URL } from '../../config/api';

type EyePackage = {
    subscription_id: number;
    product_key: string;
    name: string;
    quota: number;
    used: number;
    remaining: number;
    period_started_at: string | null;
    period_ends_at: string | null;
};

type EyeUpload = {
    id: number;
    product_key: string;
    image_url: string;
    status: 'pending' | 'reviewed' | 'sent';
    admin_notes?: string | null;
    report_pdf_url?: string | null;
    sent_at?: string | null;
    created_at: string;
};

const STATUS_LABEL: Record<EyeUpload['status'], string> = {
    pending: 'Beklemede',
    reviewed: 'İnceleniyor',
    sent: 'Rapor Gönderildi'
};

const STATUS_COLOR: Record<EyeUpload['status'], string> = {
    pending: '#f59e0b',
    reviewed: '#0ea5e9',
    sent: '#16a34a'
};

const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
};

const daysUntil = (iso?: string | null): number | null => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms)) return null;
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export default function EyeTrackingPanel({ isEn = false }: { isEn?: boolean }) {
    const [packages, setPackages] = useState<EyePackage[]>([]);
    const [uploads, setUploads] = useState<EyeUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const t = (tr: string, en: string) => (isEn ? en : tr);

    const authHeaders = (): Record<string, string> => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const load = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/eye-tracking/my-uploads`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Yükleme listesi alınamadı');
            const data = await res.json();
            setPackages(data.packages || []);
            setUploads(data.uploads || []);
        } catch (e: any) {
            setError(e.message || 'Hata');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const remainingTotal = packages.reduce((s, p) => s + p.remaining, 0);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError(t('Sadece görsel dosyası yükleyebilirsiniz.', 'Only image files are allowed.'));
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            setError(t('Görsel 15 MB üzerinde olamaz.', 'Image cannot exceed 15 MB.'));
            return;
        }
        setError(''); setInfo('');
        setUploading(true);
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result));
                r.onerror = reject;
                r.readAsDataURL(file);
            });
            const res = await fetch(`${API_BASE_URL}/eye-tracking/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ dataUrl, filename: file.name })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
            setInfo(t('Görseliniz alındı! Analist en kısa sürede raporunuzu hazırlayacak.', 'Image received. Our analyst will send your report shortly.'));
            await load();
        } catch (e: any) {
            setError(e.message || 'Hata');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('Yükleniyor...', 'Loading...')}</div>;
    }

    if (packages.length === 0) {
        return (
            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: 12, textAlign: 'center', color: '#475569' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#1a3a52' }}>{t('Aktif paket bulunamadı', 'No active package')}</h3>
                <p style={{ margin: 0 }}>{t('Reklam Görsel Analizi paketlerinden birini satın aldıktan sonra burada görsel yükleyebilirsiniz.', 'After purchasing an Ad Image Analysis package, you can upload images here.')}</p>
            </div>
        );
    }

    return (
        <div className="tab-content">
            <h2>{t('Reklam Görsel Analizleri', 'Ad Image Analyses')}</h2>

            {/* Quota kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginBottom: 20 }}>
                {packages.map(p => {
                    const days = daysUntil(p.period_ends_at);
                    return (
                        <div key={p.subscription_id} style={{
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.name}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a52', marginTop: 4 }}>
                                {p.remaining} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>/ {p.quota}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
                                {t('Bu dönem kalan görsel hakkı', 'Quota remaining this period')}
                            </div>
                            {p.period_ends_at && (
                                <div style={{
                                    marginTop: 10, padding: '8px 10px', background: '#f1f5f9', borderRadius: 8,
                                    fontSize: '0.82rem', color: '#1a3a52', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <span>{t('Hak yenilenmesine', 'Renews in')}</span>
                                    <strong>{days !== null ? `${days} ${t('gün', days === 1 ? 'day' : 'days')}` : '-'}</strong>
                                </div>
                            )}
                            {p.period_ends_at && (
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6, textAlign: 'right' }}>
                                    {t('Dönem sonu', 'Period ends')}: {formatDate(p.period_ends_at)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upload area */}
            <div
                style={{
                    border: '2px dashed #94a3b8', borderRadius: 12, padding: '2rem', textAlign: 'center',
                    background: remainingTotal > 0 ? '#f8fafc' : '#fef2f2',
                    opacity: uploading ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                }}
                onDragOver={e => { e.preventDefault(); }}
                onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f && remainingTotal > 0) handleFile(f);
                }}
            >
                <HiCloudArrowUp style={{ fontSize: '2.5rem', color: remainingTotal > 0 ? '#1a3a52' : '#dc2626' }} />
                <div style={{ marginTop: 8, fontWeight: 600, color: '#1a3a52' }}>
                    {remainingTotal > 0
                        ? t('Görselinizi buraya sürükleyin veya seçin', 'Drag your image here or click to select')
                        : t('Bu dönem için kullanım hakkınız kalmadı', 'You have no remaining quota this period')}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                    PNG · JPG · WebP — max 15 MB
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <button
                    type="button"
                    disabled={remainingTotal === 0 || uploading}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        marginTop: 12, padding: '0.6rem 1.4rem',
                        background: remainingTotal > 0 ? '#1a3a52' : '#cbd5e1',
                        color: '#fff', border: 'none', borderRadius: 8,
                        fontWeight: 700, cursor: remainingTotal > 0 && !uploading ? 'pointer' : 'not-allowed'
                    }}
                >
                    {uploading ? t('Yükleniyor...', 'Uploading...') : t('Görsel Seç', 'Select Image')}
                </button>
            </div>

            {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 8, marginTop: 12 }}>{error}</div>}
            {info && <div style={{ background: '#ecfdf5', color: '#065f46', padding: 10, borderRadius: 8, marginTop: 12 }}>{info}</div>}

            {/* Geçmiş */}
            <h3 style={{ marginTop: 28, color: '#1a3a52' }}>{t('Yüklemelerim', 'My Uploads')}</h3>
            {uploads.length === 0 ? (
                <div style={{ color: '#64748b', padding: '1rem 0' }}>
                    {t('Henüz görsel yüklemediniz.', 'No uploads yet.')}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
                    {uploads.map(u => {
                        const Icon = u.status === 'sent' ? HiCheckCircle : HiClock;
                        return (
                            <div key={u.id} style={{
                                border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff'
                            }}>
                                <a href={u.image_url} target="_blank" rel="noreferrer">
                                    <img
                                        src={u.image_url}
                                        alt="upload"
                                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                                    />
                                </a>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.85rem' }}>
                                    <Icon style={{ color: STATUS_COLOR[u.status] }} />
                                    <strong style={{ color: STATUS_COLOR[u.status] }}>{STATUS_LABEL[u.status]}</strong>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                                    {formatDate(u.created_at)}
                                </div>
                                {u.admin_notes && (
                                    <div style={{ fontSize: '0.82rem', color: '#475569', background: '#f8fafc', padding: 8, borderRadius: 6, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                                        {u.admin_notes}
                                    </div>
                                )}
                                {u.report_pdf_url && (
                                    <a
                                        href={u.report_pdf_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            marginTop: 8, color: '#1a3a52', fontWeight: 600, fontSize: '0.85rem',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <HiArrowDownTray /> {t('Raporu indir (PDF)', 'Download report (PDF)')}
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
