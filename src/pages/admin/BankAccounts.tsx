import { useEffect, useState, FormEvent } from 'react';
import { adminBankAccountsAPI } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface BankAccount {
    id: number;
    lidio_bank_account_id: number;
    bank_name: string;
    bank_code: string | null;
    logo_url: string | null;
    is_active: number | boolean;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

const emptyForm = {
    lidio_bank_account_id: '',
    bank_name: '',
    bank_code: '',
    logo_url: '',
    is_active: true,
    display_order: 0
};

export default function BankAccountsAdmin() {
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<typeof emptyForm>(emptyForm);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchBanks = async () => {
        setLoading(true);
        try {
            const res = await adminBankAccountsAPI.list();
            setBanks(Array.isArray(res.data?.banks) ? res.data.banks : []);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Banka listesi alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBanks(); }, []);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const payload = {
            lidio_bank_account_id: Number(form.lidio_bank_account_id),
            bank_name: form.bank_name.trim(),
            bank_code: form.bank_code.trim() || null,
            logo_url: form.logo_url.trim() || null,
            is_active: form.is_active,
            display_order: Number(form.display_order || 0)
        };

        if (!payload.lidio_bank_account_id || !payload.bank_name) {
            setError('Lidio Bank Account ID ve Banka Adı zorunlu.');
            return;
        }

        try {
            if (editingId) {
                await adminBankAccountsAPI.update(editingId, payload);
                setMessage('Banka güncellendi.');
            } else {
                await adminBankAccountsAPI.create(payload);
                setMessage('Banka eklendi.');
            }
            resetForm();
            fetchBanks();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Kayıt başarısız.');
        }
    };

    const handleEdit = (bank: BankAccount) => {
        setEditingId(bank.id);
        setForm({
            lidio_bank_account_id: String(bank.lidio_bank_account_id),
            bank_name: bank.bank_name,
            bank_code: bank.bank_code || '',
            logo_url: bank.logo_url || '',
            is_active: !!bank.is_active,
            display_order: bank.display_order || 0
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bu bankayı silmek istediğinize emin misiniz?')) return;
        try {
            await adminBankAccountsAPI.delete(id);
            setMessage('Banka silindi.');
            fetchBanks();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Silme başarısız.');
        }
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
                <header style={{ marginBottom: 24 }}>
                    <h1 style={{ margin: '0 0 6px', fontSize: 24 }}>Anında Havale — Banka Hesapları</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                        Lidio merchant panelinizde tanımlı her banka için <strong>Lidio Bank Account ID</strong>'yi buraya ekleyin. Boş bırakılırsa
                        Anında Havale checkout'ta gizlenir.
                    </p>
                </header>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                        {error}
                    </div>
                )}
                {message && (
                    <div style={{ background: '#f0fdf4', color: '#15803d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                        {message}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                    <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>
                        {editingId ? 'Banka Düzenle' : 'Yeni Banka Ekle'}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Lidio Bank Account ID *</label>
                            <input
                                type="number"
                                value={form.lidio_bank_account_id}
                                onChange={(e) => setForm({ ...form, lidio_bank_account_id: e.target.value })}
                                placeholder="örn. 123"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Banka Adı *</label>
                            <input
                                value={form.bank_name}
                                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                placeholder="örn. Yapı Kredi"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Banka Kodu</label>
                            <input
                                value={form.bank_code}
                                onChange={(e) => setForm({ ...form, bank_code: e.target.value })}
                                placeholder="örn. YKBNK"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Logo URL</label>
                            <input
                                value={form.logo_url}
                                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                                placeholder="https://..."
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Sıralama</label>
                            <input
                                type="number"
                                value={form.display_order}
                                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={!!form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            />
                            <label htmlFor="is_active" style={{ fontSize: 14 }}>Aktif</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button type="submit" style={primaryBtn}>
                            {editingId ? 'Güncelle' : 'Ekle'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} style={secondaryBtn}>İptal</button>
                        )}
                    </div>
                </form>

                {/* Liste */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
                    ) : banks.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                            Henüz banka eklenmemiş. Yukarıdaki formdan ekleyebilirsin.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={thStyle}>Sıra</th>
                                    <th style={thStyle}>Lidio ID</th>
                                    <th style={thStyle}>Banka</th>
                                    <th style={thStyle}>Kod</th>
                                    <th style={thStyle}>Durum</th>
                                    <th style={thStyle}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {banks.map(bank => (
                                    <tr key={bank.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                        <td style={tdStyle}>{bank.display_order}</td>
                                        <td style={tdStyle}>{bank.lidio_bank_account_id}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {bank.logo_url && <img src={bank.logo_url} alt="" width={80} height={22} loading="lazy" decoding="async" style={{ height: 22, width: 'auto' }} />}
                                                <strong>{bank.bank_name}</strong>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{bank.bank_code || '—'}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                                fontSize: 12,
                                                background: bank.is_active ? '#dcfce7' : '#f1f5f9',
                                                color: bank.is_active ? '#166534' : '#475569'
                                            }}>
                                                {bank.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button onClick={() => handleEdit(bank)} style={smallBtn}>Düzenle</button>
                                            <button onClick={() => handleDelete(bank.id)} style={{ ...smallBtn, color: '#dc2626' }}>Sil</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 };
const primaryBtn: React.CSSProperties = { background: '#0f766e', color: '#fff', border: 0, padding: '9px 18px', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontWeight: 600 };
const secondaryBtn: React.CSSProperties = { background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '9px 18px', borderRadius: 6, fontSize: 14, cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#475569', textTransform: 'uppercase', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '12px 14px', fontSize: 14, color: '#0f172a' };
const smallBtn: React.CSSProperties = { background: 'transparent', border: 0, padding: '4px 8px', fontSize: 13, cursor: 'pointer', color: '#0f766e', marginRight: 6 };
