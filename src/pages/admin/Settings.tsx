import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { HiSave, HiRefresh, HiCurrencyDollar } from 'react-icons/hi';

interface ExchangeRateInfo {
    rate: number;
    source: 'manual' | 'auto';
    updated_at: string | null;
    auto_update?: boolean;
}

export default function SettingsPage() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // USD/TRY oranı
    const [rateInfo, setRateInfo] = useState<ExchangeRateInfo | null>(null);
    const [rateInput, setRateInput] = useState('');
    const [rateAutoUpdate, setRateAutoUpdate] = useState(true);
    const [rateBusy, setRateBusy] = useState(false);

    const fetchRate = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/exchange-rate`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = (await res.json()) as ExchangeRateInfo;
            setRateInfo(data);
            setRateInput(String(data.rate));
            setRateAutoUpdate(data.auto_update !== false);
        } catch { /* ignore */ }
    };

    const saveRate = async () => {
        setRateBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/exchange-rate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rate: Number(rateInput), auto_update: rateAutoUpdate })
            });
            if (!res.ok) throw new Error('save failed');
            await fetchRate();
            setMessage({ type: 'success', text: 'USD/TRY oranı güncellendi.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Oran kaydedilemedi: ' + (err?.message || '') });
        } finally {
            setRateBusy(false);
        }
    };

    const refreshRateFromApi = async () => {
        setRateBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/exchange-rate/refresh`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('refresh failed');
            await fetchRate();
            setMessage({ type: 'success', text: 'Kur güncel piyasa verisinden yenilendi.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Kur yenilenemedi (API erişilemedi): ' + (err?.message || '') });
        } finally {
            setRateBusy(false);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${ADMIN_API_BASE}/admin/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
        fetchRate();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'lidio_test_mode') {
                next.lidio_api_url = value === 'true'
                    ? 'https://test.lidio.com/api'
                    : 'https://api.lidio.com';
            }
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi.' });
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Kaydedilirken bir hata oluştu.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout><div>Yükleniyor...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800 }}>Sistem Ayarları</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <HiSave />
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: message.type === 'success' ? '#065f46' : '#b91c1c'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* General Settings */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Genel Ayarlar</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Site Başlığı</label>
                            <input
                                value={settings.site_title || ''}
                                onChange={e => handleChange('site_title', e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>İletişim E-posta</label>
                            <input
                                value={settings.contact_email || ''}
                                onChange={e => handleChange('contact_email', e.target.value)}
                                className="form-control"
                            />
                        </div>
                    </div>
                </div>

                {/* USD/TRY Kuru */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HiCurrencyDollar /> USD/TRY Kuru
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
                        USD ürünleri sepette/ödemede bu kurla TRY'a çevrilir. Otomatik güncelleme açıksa
                        24 saatte bir piyasa verisinden yenilenir; manuel set ettiğinde override eder.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                        <div className="form-group" style={{ minWidth: 160 }}>
                            <label>Kur (1 USD = ? TL)</label>
                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={rateInput}
                                onChange={(e) => setRateInput(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', paddingBottom: 8 }}>
                            <div><strong>Kaynak:</strong> {rateInfo?.source === 'auto' ? 'Otomatik (TCMB günlük kur)' : 'Manuel'}</div>
                            <div><strong>Son güncelleme:</strong> {rateInfo?.updated_at
                                ? new Date(rateInfo.updated_at).toLocaleString('tr-TR')
                                : '—'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={refreshRateFromApi}
                            disabled={rateBusy}
                            className="btn"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', height: 38 }}
                        >
                            <HiRefresh /> {rateBusy ? '...' : 'Şimdi yenile'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={rateAutoUpdate}
                                onChange={(e) => setRateAutoUpdate(e.target.checked)}
                            />
                            24 saatte bir otomatik güncelle (TCMB günlük kur)
                        </label>
                        <button
                            type="button"
                            onClick={saveRate}
                            disabled={rateBusy}
                            className="btn btn-primary"
                            style={{ marginLeft: 'auto' }}
                        >
                            <HiSave style={{ marginRight: 6 }} />
                            {rateBusy ? 'Kaydediliyor...' : 'Kuru kaydet'}
                        </button>
                    </div>
                </div>

                {/* SEO Settings */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>SEO & Analitik</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Google Analytics ID (G-XXXXXXX)</label>
                            <input
                                value={settings.google_analytics_id || ''}
                                onChange={e => handleChange('google_analytics_id', e.target.value)}
                                placeholder="G-..."
                                className="form-control"
                            />
                        </div>
                    </div>
                </div>

                {/* Mail Settings */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>E-Posta (SMTP) Ayarları</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>SMTP Host</label>
                            <input
                                value={settings.smtp_host || ''}
                                onChange={e => handleChange('smtp_host', e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>SMTP Port</label>
                            <input
                                value={settings.smtp_port || ''}
                                onChange={e => handleChange('smtp_port', e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>SMTP Kullanıcı Adı</label>
                            <input
                                value={settings.smtp_user || ''}
                                onChange={e => handleChange('smtp_user', e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>SMTP Şifre</label>
                            <input
                                type="password"
                                value={settings.smtp_pass || ''}
                                onChange={e => handleChange('smtp_pass', e.target.value)}
                                className="form-control"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Gateway Settings */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Sanal POS Ayarları (LIDIO)</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Merchant Code</label>
                            <input
                                value={settings.lidio_merchant_code || ''}
                                onChange={e => handleChange('lidio_merchant_code', e.target.value)}
                                className="form-control"
                                placeholder="Örn: KHILON"
                            />
                        </div>
                        <div className="form-group">
                            <label>Merchant Key</label>
                            <input
                                type="password"
                                value={settings.lidio_merchant_key || settings.lidio_api_key || ''}
                                onChange={e => handleChange('lidio_merchant_key', e.target.value)}
                                className="form-control"
                                placeholder="fb0c74ec-..."
                            />
                        </div>
                        <div className="form-group">
                            <label>API Password</label>
                            <input
                                type="password"
                                value={settings.lidio_api_password || settings.lidio_secret_key || ''}
                                onChange={e => handleChange('lidio_api_password', e.target.value)}
                                className="form-control"
                                placeholder="fUUuBE4..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Authorization (Opsiyonel)</label>
                            <input
                                value={settings.lidio_authorization || ''}
                                onChange={e => handleChange('lidio_authorization', e.target.value)}
                                className="form-control"
                                placeholder="MxS2S base64(merchantKey:apiPassword)"
                            />
                        </div>
                        <div className="form-group">
                            <label>LIDIO API URL</label>
                            <input
                                value={settings.lidio_api_url || ''}
                                onChange={e => handleChange('lidio_api_url', e.target.value)}
                                className="form-control"
                                placeholder="https://api.lidio.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>LIDIO Test Modu</label>
                            <select
                                value={settings.lidio_test_mode || 'true'}
                                onChange={e => handleChange('lidio_test_mode', e.target.value)}
                                className="form-control"
                            >
                                <option value="true">Açık (Test)</option>
                                <option value="false">Kapalı (Canlı)</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Ödeme Path</label>
                                <input
                                    value={settings.lidio_process_payment_path || '/ProcessPayment'}
                                    onChange={e => handleChange('lidio_process_payment_path', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>3DS Path</label>
                                <input
                                    value={settings.lidio_process_3ds_path || '/ProcessPayment'}
                                    onChange={e => handleChange('lidio_process_3ds_path', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Sorgu Path</label>
                                <input
                                    value={settings.lidio_query_payment_path || '/payment/query/{transactionId}'}
                                    onChange={e => handleChange('lidio_query_payment_path', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Refund Path</label>
                                <input
                                    value={settings.lidio_refund_payment_path || '/payment/refund'}
                                    onChange={e => handleChange('lidio_refund_payment_path', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>3DS Zorunlu</label>
                                <select
                                    value={settings.lidio_force_3ds || 'true'}
                                    onChange={e => handleChange('lidio_force_3ds', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="true">Evet</option>
                                    <option value="false">Hayır</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Rate Limit Süresi (sn)</label>
                                <input
                                    value={settings.payment_rate_limit_window_seconds || '900'}
                                    onChange={e => handleChange('payment_rate_limit_window_seconds', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Max Deneme</label>
                                <input
                                    value={settings.payment_rate_limit_max_attempts || '5'}
                                    onChange={e => handleChange('payment_rate_limit_max_attempts', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Max Tutar (TRY)</label>
                                <input
                                    value={settings.payment_max_amount_try || '100000'}
                                    onChange={e => handleChange('payment_max_amount_try', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>DB Başarısız Deneme Eşiği</label>
                                <input
                                    value={settings.payment_failed_attempts_db_threshold || '5'}
                                    onChange={e => handleChange('payment_failed_attempts_db_threshold', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Callback Hash Zorunlu</label>
                                <select
                                    value={settings.lidio_enforce_callback_hash || 'true'}
                                    onChange={e => handleChange('lidio_enforce_callback_hash', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="true">Evet</option>
                                    <option value="false">Hayır</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Return Hash Modu</label>
                                <select
                                    value={settings.lidio_return_hash_mode || 'hmac'}
                                    onChange={e => handleChange('lidio_return_hash_mode', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="hmac">HMAC</option>
                                    <option value="plain">Plain</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notification Hash Modu</label>
                                <select
                                    value={settings.lidio_notification_hash_mode || 'hmac'}
                                    onChange={e => handleChange('lidio_notification_hash_mode', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="hmac">HMAC</option>
                                    <option value="plain">Plain</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Return Hash Fields</label>
                                <input
                                    value={settings.lidio_return_hash_fields || 'orderNumber,status,transactionId'}
                                    onChange={e => handleChange('lidio_return_hash_fields', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Notification Hash Fields</label>
                                <input
                                    value={settings.lidio_notification_hash_fields || 'orderNumber,status,transactionId'}
                                    onChange={e => handleChange('lidio_notification_hash_fields', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '-0.5rem' }}>
                            ⚠️ Bu bilgiler hassastır. Güvenli bir şekilde saklanır ve asla loglanmaz.
                        </small>
                    </div>
                </div>
            </div>

            {/* Paraşüt / Muhasebe Ayarları */}
            <div id="muhasebe" className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Paraşüt E-Fatura Ayarları</h2>
                    {/* AÇIK/KAPALI Toggle — admin tek tıkla entegrasyonu duraklat/aktifleştir */}
                    {(() => {
                        const enabled = (settings.parasut_enabled || '0') === '1';
                        return (
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: enabled ? '#16a34a' : '#94a3b8' }}>
                                    {enabled ? '✅ Aktif' : '⏸️ Pasif'}
                                </span>
                                <span
                                    role="switch"
                                    aria-checked={enabled}
                                    onClick={() => handleChange('parasut_enabled', enabled ? '0' : '1')}
                                    style={{
                                        position: 'relative', display: 'inline-block', width: 48, height: 26,
                                        background: enabled ? '#16a34a' : '#cbd5e1', borderRadius: 999,
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute', top: 3, left: enabled ? 25 : 3,
                                        width: 20, height: 20, background: '#fff', borderRadius: '50%',
                                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                </span>
                            </label>
                        );
                    })()}
                </div>
                {(settings.parasut_enabled || '0') !== '1' && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '0.9rem' }}>
                        ⚠️ Paraşüt entegrasyonu şu an <strong>pasif</strong>. Yeni siparişlerde fatura kesilmiyor. Aktifleştirmek için sağ üstteki anahtarı aç ve <strong>Ayarları Kaydet</strong>.
                    </div>
                )}
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Client ID</label>
                            <input
                                type="text"
                                value={settings.parasut_client_id || ''}
                                onChange={e => handleChange('parasut_client_id', e.target.value)}
                                className="form-control"
                                autoComplete="off"
                            />
                        </div>
                        <div className="form-group">
                            <label>Client Secret</label>
                            <input
                                type="password"
                                value={settings.parasut_client_secret || ''}
                                onChange={e => handleChange('parasut_client_secret', e.target.value)}
                                className="form-control"
                                autoComplete="new-password"
                                placeholder={settings.parasut_client_secret ? '••••••••' : ''}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Paraşüt E-posta</label>
                            <input
                                type="email"
                                value={settings.parasut_email || ''}
                                onChange={e => handleChange('parasut_email', e.target.value)}
                                className="form-control"
                                autoComplete="off"
                            />
                        </div>
                        <div className="form-group">
                            <label>Paraşüt Şifre</label>
                            <input
                                type="password"
                                value={settings.parasut_password || ''}
                                onChange={e => handleChange('parasut_password', e.target.value)}
                                className="form-control"
                                autoComplete="new-password"
                                placeholder={settings.parasut_password ? '••••••••' : ''}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Company ID (boşsa otomatik)</label>
                            <input
                                type="text"
                                value={settings.parasut_company_id || ''}
                                onChange={e => handleChange('parasut_company_id', e.target.value)}
                                className="form-control"
                                placeholder="Otomatik tespit edilecek"
                            />
                        </div>
                        <div className="form-group">
                            <label>Varsayılan KDV (%)</label>
                            <input
                                type="number"
                                value={settings.default_vat_rate || '20'}
                                onChange={e => handleChange('default_vat_rate', e.target.value)}
                                className="form-control"
                                min={0}
                                max={100}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={(settings.prices_include_vat || '0') === '1'}
                                onChange={e => handleChange('prices_include_vat', e.target.checked ? '1' : '0')}
                            />
                            <span>Ürün fiyatları <strong>KDV DAHİL</strong> (eski model — değiştirme önerilmez)</span>
                        </label>
                        <small style={{ color: '#6b7280', display: 'block', marginTop: 4 }}>
                            <strong>Kapalı (önerilen / varsayılan):</strong> Fiyatlar KDV hariç tutarlardır. Checkout'ta KDV ayrı görünür, müşteri net + KDV öder. 100 TRY ürün → 100 + 20 KDV = 120 TRY ödenir, faturaya da 120 TRY yazılır.<br />
                            <strong>Açık (eski model):</strong> 100 TRY KDV dahil. Müşteri 100 TRY öder, Paraşüt'e net 83.33 + KDV 16.67 = 100 TRY gönderilir.
                        </small>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const t = localStorage.getItem('token');
                                    const r = await fetch(`/api/admin/parasut/test-connection`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
                                    });
                                    const j = await r.json();
                                    if (!r.ok || j.ok === false) {
                                        alert('Bağlantı başarısız: ' + (j.error || 'Bilinmeyen hata'));
                                    } else {
                                        alert(`✅ Bağlantı OK\nCompany: ${j.company_name || '-'} (#${j.company_id || '-'})`);
                                    }
                                } catch (e: any) {
                                    alert('İstek hatası: ' + e.message);
                                }
                            }}
                            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #1a3a52', background: '#fff', color: '#1a3a52', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Bağlantıyı Test Et
                        </button>
                        <small style={{ color: '#6b7280' }}>
                            Önce ayarları kaydet, sonra test et. Hesap bilgileri DB'de saklanır.
                        </small>
                    </div>
                </div>
            </div>

            {/* Translation Settings */}
            <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Çeviri Ayarları (DeepL)</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group">
                        <label>DeepL API Anahtarı</label>
                        <input
                            type="password"
                            value={settings.deepl_api_key || ''}
                            onChange={e => handleChange('deepl_api_key', e.target.value)}
                            className="form-control"
                            placeholder="Örn: 12345678-abcd-..."
                        />
                    </div>
                    <div className="form-group">
                        <label>DeepL Plan Tipi</label>
                        <select
                            value={settings.deepl_plan_type || 'free'}
                            onChange={e => handleChange('deepl_plan_type', e.target.value)}
                            className="form-control"
                        >
                            <option value="free">Ücretsiz (api-free.deepl.com)</option>
                            <option value="pro">Pro (api.deepl.com)</option>
                        </select>
                    </div>
                </div>
            </div>

            <style>{`
                .form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #374151;
                }
                .form-control {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 0.95rem;
                }
                .form-control:focus {
                    outline: none;
                    border-color: #1a3a52;
                    box-shadow: 0 0 0 2px rgba(26, 58, 82, 0.2);
                }
            `}</style>
        </AdminLayout>
    );
}
