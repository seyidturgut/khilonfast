import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { HiChevronDown, HiChevronUp, HiPencil, HiPlus, HiTrash, HiUsers, HiX } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

interface PurchasedProduct {
    product_id: number;
    product_name: string;
    product_key: string;
    purchased_at: string;
    purchase_count: number;
}

interface AdminUser {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: 'user' | 'admin' | 'editor';
    must_change_password?: boolean;
    created_at: string;
    total_orders: number;
    total_spent: number;
    purchased_products: PurchasedProduct[];
    last_purchase_at?: string | null;
}

interface OrderItem {
    order_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_id: number;
    product_name: string;
    product_key: string;
}

interface UserOrder {
    id: number;
    order_number: string;
    total_amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    items: OrderItem[];
}

interface UserFormState {
    id: number | null;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: 'user' | 'admin' | 'editor';
    password: string;
    must_change_password: boolean;
}

const defaultFormState: UserFormState = {
    id: null,
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user',
    password: '',
    must_change_password: false
};

export default function UsersPage() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const { user: loggedUser } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openUserId, setOpenUserId] = useState<number | null>(null);
    const [orderMap, setOrderMap] = useState<Record<number, UserOrder[]>>({});
    const [orderLoading, setOrderLoading] = useState<Record<number, boolean>>({});
    const [query, setQuery] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formState, setFormState] = useState<UserFormState>(defaultFormState);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Kullanıcılar alınamadı');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const fetchOrdersForUser = async (userId: number) => {
        if (orderMap[userId] || orderLoading[userId]) return;

        try {
            setOrderLoading((prev) => ({ ...prev, [userId]: true }));
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/users/${userId}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Sipariş detayı alınamadı');
            const data = await res.json();
            setOrderMap((prev) => ({ ...prev, [userId]: Array.isArray(data) ? data : [] }));
        } catch {
            setOrderMap((prev) => ({ ...prev, [userId]: [] }));
        } finally {
            setOrderLoading((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const toggleUserOrders = async (userId: number) => {
        if (openUserId === userId) {
            setOpenUserId(null);
            return;
        }
        setOpenUserId(userId);
        await fetchOrdersForUser(userId);
    };

    const openCreateModal = () => {
        setFormState(defaultFormState);
        setFormError('');
        setShowFormModal(true);
    };

    const openEditModal = (u: AdminUser) => {
        setFormState({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            phone: u.phone || '',
            role: u.role || 'user',
            password: '',
            must_change_password: Boolean(u.must_change_password)
        });
        setFormError('');
        setShowFormModal(true);
    };

    const closeModal = () => {
        if (formSubmitting) return;
        setShowFormModal(false);
    };

    const submitUserForm = async () => {
        setFormError('');

        if (!formState.email || !formState.first_name || !formState.last_name) {
            setFormError('E-posta, ad ve soyad zorunludur.');
            return;
        }
        if (!formState.id && formState.password.length < 6) {
            setFormError('Yeni kullanıcı için şifre en az 6 karakter olmalıdır.');
            return;
        }
        if (formState.id && formState.password && formState.password.length < 6) {
            setFormError('Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }

        try {
            setFormSubmitting(true);
            const token = localStorage.getItem('token');
            const method = formState.id ? 'PUT' : 'POST';
            const endpoint = formState.id
                ? `${ADMIN_API_BASE}/admin/users/${formState.id}`
                : `${ADMIN_API_BASE}/admin/users`;

            const payload = {
                email: formState.email.trim(),
                first_name: formState.first_name.trim(),
                last_name: formState.last_name.trim(),
                phone: formState.phone.trim(),
                role: formState.role,
                password: formState.password,
                must_change_password: formState.must_change_password
            };

            const res = await fetch(endpoint, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.error || 'İşlem başarısız');
            }

            await loadUsers();
            setShowFormModal(false);
        } catch (err: any) {
            setFormError(err.message || 'Kullanıcı kaydedilemedi.');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteUser = async (targetUser: AdminUser) => {
        if (targetUser.id === loggedUser?.id) {
            alert('Kendi hesabınızı silemezsiniz.');
            return;
        }

        const ok = window.confirm(`${targetUser.first_name} ${targetUser.last_name} kullanıcısını silmek istediğinize emin misiniz?`);
        if (!ok) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${ADMIN_API_BASE}/admin/users/${targetUser.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Kullanıcı silinemedi');

            await loadUsers();
            if (openUserId === targetUser.id) {
                setOpenUserId(null);
            }
        } catch (err: any) {
            alert(err.message || 'Kullanıcı silinemedi.');
        }
    };

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }, [users, query]);

    const isEditing = Boolean(formState.id);

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800, margin: 0 }}>Kullanıcı Yönetimi</h1>
                    <p style={{ marginTop: '0.45rem', color: '#64748b' }}>Admin kullanıcı ekleyebilir, düzenleyebilir, silebilir ve tüm değişiklikler DB'ye kaydedilir.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: '320px', justifyContent: 'flex-end' }}>
                    <input
                        className="form-control"
                        placeholder="Ad veya e-posta ara..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ minWidth: '220px' }}
                    />
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <HiPlus /> Yeni Kullanıcı
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                        <HiUsers size={34} style={{ marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>Kullanıcı bulunamadı.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1280px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Kullanıcı</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Rol</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Sipariş</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Toplam Tutar</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Son Satın Alma</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Alınan Ürünler</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: 700 }}>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => {
                                    const isOpen = openUserId === u.id;
                                    return (
                                        <Fragment key={u.id}>
                                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 700, color: '#111827' }}>{u.first_name} {u.last_name}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{u.email}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ background: '#eef6b6', color: '#4d5f09', borderRadius: '999px', fontSize: '0.78rem', padding: '3px 10px', fontWeight: 700 }}>
                                                        {u.role || 'user'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#111827', fontWeight: 600 }}>{u.total_orders}</td>
                                                <td style={{ padding: '1rem', color: '#111827', fontWeight: 700 }}>{u.total_spent.toLocaleString('tr-TR')} TRY</td>
                                                <td style={{ padding: '1rem', color: '#475569' }}>
                                                    {u.last_purchase_at ? new Date(u.last_purchase_at).toLocaleString('tr-TR') : '-'}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {u.purchased_products.length === 0 ? (
                                                        <span style={{ color: '#94a3b8' }}>-</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {u.purchased_products.slice(0, 3).map((p) => (
                                                                <span key={`${u.id}-${p.product_key}`} style={{ background: '#f1f5f9', color: '#334155', borderRadius: '999px', fontSize: '0.8rem', padding: '3px 10px' }}>
                                                                    {p.product_name}
                                                                </span>
                                                            ))}
                                                            {u.purchased_products.length > 3 && (
                                                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>+{u.purchased_products.length - 3}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            onClick={() => openEditModal(u)}
                                                            style={{ padding: '8px 10px' }}
                                                            title="Düzenle"
                                                        >
                                                            <HiPencil />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            onClick={() => handleDeleteUser(u)}
                                                            style={{ padding: '8px 10px', color: '#b91c1c', borderColor: '#fecaca' }}
                                                            title="Sil"
                                                            disabled={u.id === loggedUser?.id}
                                                        >
                                                            <HiTrash />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            onClick={() => toggleUserOrders(u.id)}
                                                            style={{ padding: '8px 12px' }}
                                                            title="Sipariş Detayı"
                                                        >
                                                            {isOpen ? <HiChevronUp /> : <HiChevronDown />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isOpen && (
                                                <tr style={{ background: '#fbfdff' }}>
                                                    <td colSpan={7} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb' }}>
                                                        {orderLoading[u.id] ? (
                                                            <div style={{ color: '#64748b' }}>Siparişler yükleniyor...</div>
                                                        ) : (orderMap[u.id]?.length || 0) === 0 ? (
                                                            <div style={{ color: '#64748b' }}>Bu kullanıcıya ait sipariş bulunamadı.</div>
                                                        ) : (
                                                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                                {orderMap[u.id].map((order) => (
                                                                    <div key={order.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.8rem 1rem', background: '#fff' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                                                            <strong>#{order.id} • {new Date(order.created_at).toLocaleString('tr-TR')}</strong>
                                                                            <span style={{ color: '#0f172a', fontWeight: 700 }}>{order.total_amount.toLocaleString('tr-TR')} {order.currency}</span>
                                                                        </div>
                                                                        <div style={{ display: 'grid', gap: '0.35rem', color: '#475569' }}>
                                                                            {order.items.map((item) => (
                                                                                <div key={`${order.id}-${item.product_id}-${item.product_key}`}>
                                                                                    {item.product_name} ({item.product_key}) • {item.quantity} adet
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showFormModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3000,
                        padding: '1rem'
                    }}
                    onClick={closeModal}
                >
                    <div
                        className="card"
                        style={{ width: '100%', maxWidth: '700px', padding: '1.2rem' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#0f172a' }}>{isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</h3>
                            <button type="button" className="btn btn-secondary" onClick={closeModal} style={{ padding: '6px 8px' }}>
                                <HiX />
                            </button>
                        </div>

                        {formError && (
                            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 0.9rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                {formError}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">E-posta</label>
                                <input className="form-control" value={formState.email} onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Ad</label>
                                <input className="form-control" value={formState.first_name} onChange={(e) => setFormState((s) => ({ ...s, first_name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Soyad</label>
                                <input className="form-control" value={formState.last_name} onChange={(e) => setFormState((s) => ({ ...s, last_name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Telefon</label>
                                <input className="form-control" value={formState.phone} onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Rol</label>
                                <select className="form-control" value={formState.role} onChange={(e) => setFormState((s) => ({ ...s, role: e.target.value as UserFormState['role'] }))}>
                                    <option value="user">user</option>
                                    <option value="editor">editor</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">{isEditing ? 'Yeni Şifre (opsiyonel)' : 'Şifre'}</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={formState.password}
                                    onChange={(e) => setFormState((s) => ({ ...s, password: e.target.value }))}
                                    placeholder={isEditing ? 'Boş bırakırsanız değişmez' : 'En az 6 karakter'}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    id="must-change-password"
                                    type="checkbox"
                                    checked={formState.must_change_password}
                                    onChange={(e) => setFormState((s) => ({ ...s, must_change_password: e.target.checked }))}
                                />
                                <label htmlFor="must-change-password">Sonraki girişte şifre değiştirmesi zorunlu olsun</label>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={formSubmitting}>İptal</button>
                            <button type="button" className="btn btn-primary" onClick={submitUserForm} disabled={formSubmitting}>
                                {formSubmitting ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Oluştur')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
