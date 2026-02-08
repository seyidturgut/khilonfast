import { useState, useEffect } from 'react';
import { api } from '../../services/api'; // We'll need to update api service
import AdminLayout from '../../layouts/AdminLayout';
import { HiSave } from 'react-icons/hi';

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial load
    useEffect(() => {
        // Since we don't have the api method yet, we'll fetch directly or add to api.ts later
        // For now let's assume direct fetch with token
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3001/api/admin/settings', {
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
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/admin/settings', {
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
                            <label>LIDIO API Key</label>
                            <input
                                type="password"
                                value={settings.lidio_api_key || ''}
                                onChange={e => handleChange('lidio_api_key', e.target.value)}
                                className="form-control"
                                placeholder="API anahtarınızı girin"
                            />
                        </div>
                        <div className="form-group">
                            <label>LIDIO Secret Key</label>
                            <input
                                type="password"
                                value={settings.lidio_secret_key || ''}
                                onChange={e => handleChange('lidio_secret_key', e.target.value)}
                                className="form-control"
                                placeholder="Gizli anahtarınızı girin"
                            />
                        </div>
                        <div className="form-group">
                            <label>LIDIO Merchant ID</label>
                            <input
                                value={settings.lidio_merchant_id || ''}
                                onChange={e => handleChange('lidio_merchant_id', e.target.value)}
                                className="form-control"
                                placeholder="Mağaza ID'nizi girin"
                            />
                        </div>
                        <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '-0.5rem' }}>
                            ⚠️ Bu bilgiler hassastır. Güvenli bir şekilde saklanır ve asla loglanmaz.
                        </small>
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
                    border-color: #0ea5e9;
                    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
                }
            `}</style>
        </AdminLayout>
    );
}
