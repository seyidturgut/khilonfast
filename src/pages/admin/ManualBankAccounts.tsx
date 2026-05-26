import { useEffect, useState, FormEvent } from 'react';
import { adminManualBankAccountsAPI } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface ManualBankAccount {
    id: number;
    bank_name: string;
    account_holder: string;
    iban: string;
    swift: string | null;
    currency: 'TRY' | 'USD';
    notes: string | null;
    is_active: number | boolean;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

const emptyForm = {
    bank_name: '',
    account_holder: '',
    iban: '',
    swift: '',
    currency: 'TRY' as 'TRY' | 'USD',
    notes: '',
    is_active: true,
    display_order: 0
};

export default function ManualBankAccountsAdmin() {
    const [accounts, setAccounts] = useState<ManualBankAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<typeof emptyForm>(emptyForm);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await adminManualBankAccountsAPI.list();
            setAccounts(Array.isArray(res.data?.accounts) ? res.data.accounts : []);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Hesaplar alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

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
            bank_name: form.bank_name.trim(),
            account_holder: form.account_holder.trim(),
            iban: form.iban.replace(/\s+/g, '').toUpperCase(),
            swift: form.swift.trim() || null,
            currency: form.currency,
            notes: form.notes.trim() || null,
            is_active: form.is_active,
            display_order: Number(form.display_order || 0)
        };

        if (!payload.bank_name || !payload.account_holder || !payload.iban) {
            setError('Banka adı, hesap sahibi ve IBAN zorunlu.');
            return;
        }

        try {
            if (editingId) {
                await adminManualBankAccountsAPI.update(editingId, payload);
                setMessage('Hesap güncellendi.');
            } else {
                await adminManualBankAccountsAPI.create(payload);
                setMessage('Hesap eklendi.');
            }
            resetForm();
            fetchAccounts();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Kayıt başarısız.');
        }
    };

    const handleEdit = (acc: ManualBankAccount) => {
        setEditingId(acc.id);
        setForm({
            bank_name: acc.bank_name,
            account_holder: acc.account_holder,
            iban: acc.iban,
            swift: acc.swift || '',
            currency: acc.currency,
            notes: acc.notes || '',
            is_active: Boolean(acc.is_active),
            display_order: acc.display_order
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bu manuel havale hesabını silmek istediğine emin misin?')) return;
        try {
            await adminManualBankAccountsAPI.delete(id);
            setMessage('Hesap silindi.');
            fetchAccounts();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Silme başarısız.');
        }
    };

    return (
        <AdminLayout>
            <div className="admin-page" style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
                <h1 style={{ marginBottom: 16 }}>Manuel Havale Hesapları</h1>
                <p style={{ color: '#64748b', marginBottom: 24 }}>
                    Müşterilerin manuel havale ile ödeme yapacağı banka hesaplarını yönetin.
                    TR siparişleri için TRY, EN/uluslararası siparişler için USD hesabı tanımlayabilirsin.
                </p>

                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
                {message && <div style={{ background: '#dcfce7', color: '#166534', padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}

                <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 32 }}>
                    <h2 style={{ marginTop: 0 }}>{editingId ? 'Hesabı Düzenle' : 'Yeni Hesap Ekle'}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Banka Adı *</label>
                            <input
                                type="text"
                                value={form.bank_name}
                                onChange={e => setForm({ ...form, bank_name: e.target.value })}
                                required
                                placeholder="Garanti BBVA"
                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Hesap Sahibi *</label>
                            <input
                                type="text"
                                value={form.account_holder}
                                onChange={e => setForm({ ...form, account_holder: e.target.value })}
                                required
                                placeholder="Khilonfast Pazarlama Ltd. Şti."
                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>IBAN *</label>
                            <input
                                type="text"
                                value={form.iban}
                                onChange={e => setForm({ ...form, iban: e.target.value })}
                                required
                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, fontFamily: 'monospace' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>SWIFT / BIC</label>
                            <input
                                type="text"
                                value={form.swift}
                                onChange={e => setForm({ ...form, swift: e.target.value })}
                                placeholder="TGBATRIS"
                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Para Birimi *</label>
                            <select
                                value={form.currency}
                                onChange={e => setForm({ ...form, currency: e.target.value as 'TRY' | 'USD' })}
                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}
                            >
                                <option value="TRY">TRY (Türk Lirası)</option>
                                <option value="USD">USD (Dolar)</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Notlar</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                rows={2}
                                placeholder="Açıklama kısmına sipariş numarası yazılması rica olunur."
                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, resize: 'vertical' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Sıralama</label>
                            <input
                                type="number"
                                value={form.display_order}
                                onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
                                style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 28 }}>
                            <input
                                type="checkbox"
                                id="active"
                                checked={form.is_active}
                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                            />
                            <label htmlFor="active">Aktif (müşterilere göster)</label>
                        </div>
                    </div>
                    <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                        <button
                            type="submit"
                            style={{ background: '#1a3a52', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                        >
                            {editingId ? 'Güncelle' : 'Ekle'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} style={{ background: '#e2e8f0', color: '#1a3a52', padding: '12px 24px', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                                İptal
                            </button>
                        )}
                    </div>
                </form>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                    <h2 style={{ marginTop: 0 }}>Tanımlı Hesaplar</h2>
                    {loading && <p>Yükleniyor...</p>}
                    {!loading && accounts.length === 0 && <p style={{ color: '#64748b' }}>Henüz hesap eklenmemiş.</p>}
                    {!loading && accounts.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Banka</th>
                                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Hesap Sahibi</th>
                                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>IBAN</th>
                                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Para</th>
                                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Aktif</th>
                                    <th style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(acc => (
                                    <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 10 }}>{acc.bank_name}</td>
                                        <td style={{ padding: 10 }}>{acc.account_holder}</td>
                                        <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 13 }}>{acc.iban}</td>
                                        <td style={{ padding: 10 }}>{acc.currency}</td>
                                        <td style={{ padding: 10 }}>
                                            <span style={{ background: acc.is_active ? '#dcfce7' : '#fee2e2', color: acc.is_active ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                                                {acc.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td style={{ padding: 10, textAlign: 'right' }}>
                                            <button onClick={() => handleEdit(acc)} style={{ background: 'transparent', border: '1px solid #1a3a52', color: '#1a3a52', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginRight: 6 }}>Düzenle</button>
                                            <button onClick={() => handleDelete(acc.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Sil</button>
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
