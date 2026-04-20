import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineRefresh, HiOutlineTicket } from 'react-icons/hi';

type DiscountType = 'percentage' | 'fixed';

interface Coupon {
    id: number;
    name: string;
    code: string;
    description?: string;
    discount_type: DiscountType;
    discount_value: number;
    minimum_cart_amount: number;
    maximum_discount_amount: number | null;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    total_usage_limit: number | null;
    per_user_limit: number | null;
    restricted_products: string[];
    restricted_categories: string[];
    new_customers_only: boolean;
    is_stackable: boolean;
    usage_count: number;
}

interface ProductOption {
    id: number;
    name: string;
    category?: string;
    parent_id?: number | null;
}

interface CouponFormState {
    name: string;
    code: string;
    description: string;
    discount_type: DiscountType;
    discount_value: string;
    minimum_cart_amount: string;
    maximum_discount_amount: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    total_usage_limit: string;
    per_user_limit: string;
    restricted_products: number[];
    restricted_categories: string[];
    new_customers_only: boolean;
    is_stackable: boolean;
}

const ADMIN_API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const emptyForm = (): CouponFormState => ({
    name: '',
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_cart_amount: '',
    maximum_discount_amount: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    total_usage_limit: '',
    per_user_limit: '',
    restricted_products: [],
    restricted_categories: [],
    new_customers_only: false,
    is_stackable: false
});

export default function CouponList() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [form, setForm] = useState<CouponFormState>(emptyForm());
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');

    const categoryOptions = useMemo(() => {
        const values = Array.from(new Set(products.map((item) => (item.category || '').trim()).filter(Boolean)));
        return values.sort((a, b) => a.localeCompare(b, 'tr'));
    }, [products]);

    const filteredCoupons = useMemo(() => {
        return coupons.filter((coupon) => {
            const matchesSearch =
                coupon.name.toLowerCase().includes(search.toLowerCase()) ||
                coupon.code.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && coupon.is_active) ||
                (statusFilter === 'inactive' && !coupon.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [coupons, search, statusFilter]);

    const filteredProducts = useMemo(() => {
        const needle = productSearch.trim().toLowerCase();
        if (!needle) return products;
        return products.filter((product) => {
            const haystack = `${product.name} ${product.category || ''}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [productSearch, products]);

    useEffect(() => {
        void Promise.all([fetchCoupons(), fetchProducts()]).finally(() => setLoading(false));
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/coupons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Kuponlar yüklenemedi.');
            }
            setCoupons(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Kuponlar yüklenemedi.');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Ürünler yüklenemedi.');
            }
            setProducts(Array.isArray(data) ? data.filter((product) => !product.parent_id) : []);
        } catch (err: any) {
            setError(err.message || 'Ürünler yüklenemedi.');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm());
        setProductSearch('');
    };

    const toDateTimeLocal = (value?: string | null) => {
        if (!value) return '';
        return value.slice(0, 16);
    };

    const hydrateForm = (coupon: Coupon) => {
        setEditingId(coupon.id);
        setForm({
            name: coupon.name,
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: String(coupon.discount_value ?? ''),
            minimum_cart_amount: String(coupon.minimum_cart_amount ?? ''),
            maximum_discount_amount: coupon.maximum_discount_amount !== null ? String(coupon.maximum_discount_amount) : '',
            starts_at: toDateTimeLocal(coupon.starts_at),
            ends_at: toDateTimeLocal(coupon.ends_at),
            is_active: coupon.is_active,
            total_usage_limit: coupon.total_usage_limit !== null ? String(coupon.total_usage_limit) : '',
            per_user_limit: coupon.per_user_limit !== null ? String(coupon.per_user_limit) : '',
            restricted_products: (coupon.restricted_products || []).map(Number).filter(Boolean),
            restricted_categories: coupon.restricted_categories || [],
            new_customers_only: coupon.new_customers_only,
            is_stackable: coupon.is_stackable
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formPayload = () => ({
        ...form,
        code: form.code.trim().toUpperCase(),
        discount_value: form.discount_value === '' ? 0 : Number(form.discount_value),
        minimum_cart_amount: form.minimum_cart_amount === '' ? 0 : Number(form.minimum_cart_amount),
        maximum_discount_amount: form.maximum_discount_amount === '' ? null : Number(form.maximum_discount_amount),
        total_usage_limit: form.total_usage_limit === '' ? null : Number(form.total_usage_limit),
        per_user_limit: form.per_user_limit === '' ? null : Number(form.per_user_limit),
        restricted_products: form.restricted_products,
        restricted_categories: form.restricted_categories
    });

    const handleSave = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch(
                editingId ? `${ADMIN_API_BASE}/admin/coupons/${editingId}` : `${ADMIN_API_BASE}/admin/coupons`,
                {
                    method: editingId ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(formPayload())
                }
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Kupon kaydedilemedi.');
            }
            setMessage(editingId ? 'Kupon güncellendi.' : 'Kupon oluşturuldu.');
            resetForm();
            await fetchCoupons();
        } catch (err: any) {
            setError(err.message || 'Kupon kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (coupon: Coupon) => {
        if (!window.confirm(`"${coupon.name}" kuponunu silmek istediğinize emin misiniz?`)) {
            return;
        }

        setMessage('');
        setError('');

        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/coupons/${coupon.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Kupon silinemedi.');
            }
            setMessage('Kupon silindi.');
            if (editingId === coupon.id) {
                resetForm();
            }
            await fetchCoupons();
        } catch (err: any) {
            setError(err.message || 'Kupon silinemedi.');
        }
    };

    const handleToggle = async (coupon: Coupon) => {
        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/coupons/${coupon.id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !coupon.is_active })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Kupon durumu güncellenemedi.');
            }
            await fetchCoupons();
        } catch (err: any) {
            setError(err.message || 'Kupon durumu güncellenemedi.');
        }
    };

    const toggleProduct = (productId: number) => {
        setForm((prev) => ({
            ...prev,
            restricted_products: prev.restricted_products.includes(productId)
                ? prev.restricted_products.filter((item) => item !== productId)
                : [...prev.restricted_products, productId]
        }));
    };

    const toggleCategory = (category: string) => {
        setForm((prev) => ({
            ...prev,
            restricted_categories: prev.restricted_categories.includes(category)
                ? prev.restricted_categories.filter((item) => item !== category)
                : [...prev.restricted_categories, category]
        }));
    };

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        return new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <AdminLayout>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '1.9rem', color: '#1a3a52', margin: 0, fontWeight: 800 }}>Kuponlar</h1>
                        <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Checkout kuponlarını buradan yönetin.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" className="btn" onClick={() => { resetForm(); setMessage(''); setError(''); }}>
                            <HiOutlinePlus /> Yeni Kupon
                        </button>
                        <button type="button" className="btn" onClick={() => void fetchCoupons()}>
                            <HiOutlineRefresh /> Yenile
                        </button>
                    </div>
                </div>

                {message && <div className="success-message" style={{ marginBottom: 0 }}>{message}</div>}
                {error && <div className="error-message" style={{ marginBottom: 0 }}>{error}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 0.9fr)', gap: '1.5rem', alignItems: 'start' }}>
                    <section className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Kupon adı veya kod ile ara"
                                style={{ flex: '1 1 280px', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #dbe3ef' }}
                            />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
                                style={{ minWidth: '180px', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #dbe3ef' }}
                            >
                                <option value="all">Tüm durumlar</option>
                                <option value="active">Sadece aktif</option>
                                <option value="inactive">Sadece pasif</option>
                            </select>
                        </div>

                        {loading ? (
                            <div style={{ padding: '2rem 0', textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                                            <th style={thStyle}>Kupon Adı</th>
                                            <th style={thStyle}>Kod</th>
                                            <th style={thStyle}>Tip</th>
                                            <th style={thStyle}>Değer</th>
                                            <th style={thStyle}>Kullanım</th>
                                            <th style={thStyle}>Başlangıç / Bitiş</th>
                                            <th style={thStyle}>Durum</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCoupons.map((coupon) => (
                                            <tr key={coupon.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: 700, color: '#1a3a52' }}>{coupon.name}</div>
                                                    {coupon.description && <div style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '0.25rem' }}>{coupon.description}</div>}
                                                </td>
                                                <td style={tdStyle}><code style={codeStyle}>{coupon.code}</code></td>
                                                <td style={tdStyle}>{coupon.discount_type === 'percentage' ? 'Yüzde' : 'Sabit'}</td>
                                                <td style={tdStyle}>
                                                    {coupon.discount_type === 'percentage'
                                                        ? `%${coupon.discount_value}`
                                                        : `${coupon.discount_value.toLocaleString('tr-TR')} TRY`}
                                                </td>
                                                <td style={tdStyle}>{coupon.usage_count}</td>
                                                <td style={tdStyle}>
                                                    <div>{formatDate(coupon.starts_at)}</div>
                                                    <div style={{ color: '#64748b', marginTop: '0.2rem' }}>{formatDate(coupon.ends_at)}</div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleToggle(coupon)}
                                                        style={{
                                                            border: 'none',
                                                            borderRadius: '999px',
                                                            padding: '0.45rem 0.8rem',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            color: coupon.is_active ? '#065f46' : '#991b1b',
                                                            background: coupon.is_active ? '#d1fae5' : '#fee2e2'
                                                        }}
                                                    >
                                                        {coupon.is_active ? 'Aktif' : 'Pasif'}
                                                    </button>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button type="button" className="btn" onClick={() => hydrateForm(coupon)}>
                                                            <HiOutlinePencil /> Düzenle
                                                        </button>
                                                        <button type="button" className="btn" onClick={() => void handleDelete(coupon)}>
                                                            <HiOutlineTrash /> Sil
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!filteredCoupons.length && (
                                            <tr>
                                                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                                    Filtreye uygun kupon bulunamadı.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1rem' }}>
                            <HiOutlineTicket style={{ color: '#1a3a52', fontSize: '1.4rem' }} />
                            <div>
                                <h2 style={{ margin: 0, color: '#1a3a52' }}>{editingId ? 'Kupon Düzenle' : 'Yeni Kupon'}</h2>
                                <p style={{ margin: '0.2rem 0 0', color: '#64748b' }}>Kupon kurallarını eksiksiz girin.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                            <div style={grid2}>
                                <Field label="Kupon Adı">
                                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required style={inputStyle} />
                                </Field>
                                <Field label="Kupon Kodu">
                                    <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required style={inputStyle} />
                                </Field>
                            </div>

                            <Field label="Açıklama">
                                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                            </Field>

                            <div style={grid2}>
                                <Field label="İndirim Tipi">
                                    <select value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value as DiscountType })} style={inputStyle}>
                                        <option value="percentage">Yüzde</option>
                                        <option value="fixed">Sabit Tutar</option>
                                    </select>
                                </Field>
                                <Field label="İndirim Değeri">
                                    <input type="number" min="0" step="0.01" value={form.discount_value} onChange={(event) => setForm({ ...form, discount_value: event.target.value })} required style={inputStyle} />
                                </Field>
                            </div>

                            <div style={grid2}>
                                <Field label="Minimum Sepet Tutarı">
                                    <input type="number" min="0" step="0.01" value={form.minimum_cart_amount} onChange={(event) => setForm({ ...form, minimum_cart_amount: event.target.value })} style={inputStyle} />
                                </Field>
                                <Field label="Maksimum İndirim">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.maximum_discount_amount}
                                        onChange={(event) => setForm({ ...form, maximum_discount_amount: event.target.value })}
                                        disabled={form.discount_type !== 'percentage'}
                                        style={{ ...inputStyle, opacity: form.discount_type !== 'percentage' ? 0.6 : 1 }}
                                    />
                                </Field>
                            </div>

                            <div style={grid2}>
                                <Field label="Başlangıç Tarihi">
                                    <input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} style={inputStyle} />
                                </Field>
                                <Field label="Bitiş Tarihi">
                                    <input type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} style={inputStyle} />
                                </Field>
                            </div>

                            <div style={grid2}>
                                <Field label="Toplam Kullanım Limiti">
                                    <input type="number" min="0" step="1" value={form.total_usage_limit} onChange={(event) => setForm({ ...form, total_usage_limit: event.target.value })} style={inputStyle} />
                                </Field>
                                <Field label="Kullanıcı Başı Limit">
                                    <input type="number" min="0" step="1" value={form.per_user_limit} onChange={(event) => setForm({ ...form, per_user_limit: event.target.value })} style={inputStyle} />
                                </Field>
                            </div>

                            <Field label="Belirli Ürünlerde Geçerli">
                                <div style={{ ...selectionBoxStyle, display: 'grid', gap: '0.75rem' }}>
                                    {form.restricted_products.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {form.restricted_products.map((productId) => {
                                                const selectedProduct = products.find((item) => item.id === productId);
                                                if (!selectedProduct) return null;
                                                return (
                                                    <button
                                                        key={productId}
                                                        type="button"
                                                        onClick={() => toggleProduct(productId)}
                                                        style={selectedChipStyle}
                                                    >
                                                        <span>{selectedProduct.name}</span>
                                                        <strong style={{ fontSize: '1rem', lineHeight: 1 }}>×</strong>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(event) => setProductSearch(event.target.value)}
                                        placeholder="Ürün ara..."
                                        style={inputStyle}
                                    />

                                    <div role="listbox" aria-multiselectable="true" style={listboxStyle}>
                                        {filteredProducts.map((product) => {
                                            const isSelected = form.restricted_products.includes(product.id);
                                            return (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    onClick={() => toggleProduct(product.id)}
                                                    style={{
                                                        ...listboxOptionStyle,
                                                        background: isSelected ? '#eef6b6' : 'transparent',
                                                        borderColor: isSelected ? '#d4e46a' : 'transparent'
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600, color: '#1f2937' }}>{product.name}</span>
                                                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                        {product.category || 'Kategori yok'} {isSelected ? '• Seçili' : ''}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                        {filteredProducts.length === 0 && (
                                            <div style={{ padding: '0.85rem', color: '#64748b', fontSize: '0.88rem' }}>
                                                Aramaya uygun ürün bulunamadı.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Field>

                            <Field label="Belirli Kategorilerde Geçerli">
                                <div style={selectionBoxStyle}>
                                    {categoryOptions.map((category) => (
                                        <label key={category} style={pillLabelStyle}>
                                            <input
                                                type="checkbox"
                                                checked={form.restricted_categories.includes(category)}
                                                onChange={() => toggleCategory(category)}
                                                style={checkboxInputStyle}
                                            />
                                            <span>{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </Field>

                            <div style={{ display: 'grid', gap: '0.7rem' }}>
                                <label style={checkboxStyle}>
                                    <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} style={checkboxInputStyle} />
                                    <span>Aktif</span>
                                </label>
                                <label style={checkboxStyle}>
                                    <input type="checkbox" checked={form.new_customers_only} onChange={(event) => setForm({ ...form, new_customers_only: event.target.checked })} style={checkboxInputStyle} />
                                    <span>Yeni müşterilere özel</span>
                                </label>
                                <label style={checkboxStyle}>
                                    <input type="checkbox" checked={form.is_stackable} onChange={(event) => setForm({ ...form, is_stackable: event.target.checked })} style={checkboxInputStyle} />
                                    <span>Diğer kuponlarla birleştirilebilir</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                {editingId && (
                                    <button type="button" className="btn" onClick={resetForm}>
                                        Vazgeç
                                    </button>
                                )}
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kupon Oluştur'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div style={{ display: 'grid', gap: '0.45rem', color: '#1a3a52' }}>
            <div style={{ fontWeight: 700 }}>{label}</div>
            {children}
        </div>
    );
}

const thStyle: CSSProperties = {
    padding: '0.9rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: 700,
    textAlign: 'left'
};

const tdStyle: CSSProperties = {
    padding: '0.95rem 0.85rem',
    verticalAlign: 'top',
    color: '#334155'
};

const inputStyle: CSSProperties = {
    width: '100%',
    padding: '0.82rem 0.9rem',
    borderRadius: '12px',
    border: '1px solid #dbe3ef',
    background: '#f8fafc'
};

const selectionBoxStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
    padding: '0.85rem',
    border: '1px solid #dbe3ef',
    borderRadius: '14px',
    background: '#f8fafc'
};

const pillLabelStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    border: '1px solid #dbe3ef',
    borderRadius: '999px',
    padding: '0.45rem 0.7rem',
    background: '#fff',
    color: '#334155',
    fontWeight: 500
};

const checkboxStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    color: '#334155',
    fontWeight: 600
};

const checkboxInputStyle: CSSProperties = {
    width: '18px',
    minWidth: '18px',
    height: '18px',
    margin: 0,
    padding: 0,
    flex: '0 0 18px'
};

const grid2: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
};

const codeStyle: CSSProperties = {
    fontWeight: 700,
    color: '#1a3a52',
    background: '#eef6b6',
    padding: '0.2rem 0.45rem',
    borderRadius: '8px'
};

const selectedChipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    border: '1px solid #d4e46a',
    borderRadius: '999px',
    padding: '0.38rem 0.7rem',
    background: '#eef6b6',
    color: '#32460a',
    fontWeight: 700,
    cursor: 'pointer'
};

const listboxStyle: CSSProperties = {
    border: '1px solid #dbe3ef',
    borderRadius: '12px',
    background: '#fff',
    maxHeight: '220px',
    overflowY: 'auto',
    padding: '0.35rem'
};

const listboxOptionStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.15rem',
    padding: '0.7rem 0.8rem',
    borderRadius: '10px',
    border: '1px solid transparent',
    cursor: 'pointer',
    textAlign: 'left'
};
