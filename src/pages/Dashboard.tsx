import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiShoppingBag, HiUser, HiLockClosed, HiBriefcase, HiPlay } from 'react-icons/hi';
import './Dashboard.css';

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Order {
    id: number;
    status: string;
    created_at: string;
    total_amount: number;
    currency: string;
    items: OrderItem[];
}

interface Profile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
}

interface Company {
    id: number;
    user_id: number;
    company_name?: string;
    tax_number?: string;
    company_address?: string;
    company_phone?: string;
}

interface PurchasedContent {
    subscription_id: number;
    subscription_status: 'active' | 'expired' | 'cancelled';
    starts_at: string;
    expires_at?: string | null;
    product_id: number;
    product_key: string;
    name: string;
    description?: string | null;
    features?: string | null;
    type?: string | null;
    category?: string | null;
    access_content_url?: string | null;
    order_status?: string | null;
}

export default function Dashboard() {
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [contents, setContents] = useState<PurchasedContent[]>([]);
    const [, setProfile] = useState<Profile | null>(null);
    const [, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: ''
    });
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [companyForm, setCompanyForm] = useState({
        company_name: '',
        tax_number: '',
        company_address: '',
        company_phone: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate('/giris');
        }
    }, [user, navigate]);

    // Check URL parameters for auto-switching to orders tab
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        const success = params.get('success');
        const forcePasswordChange = params.get('forcePasswordChange');

        if (tab === 'orders') {
            setActiveTab('orders');
            if (success === 'true') {
                setMessage('Ödemeniz başarıyla tamamlandı! Siparişiniz aşağıda görüntülenmektedir.');
                // Clear URL parameters
                window.history.replaceState({}, '', '/dashboard');
            }
        }
        if (tab === 'password') {
            setActiveTab('password');
            if (forcePasswordChange === 'true') {
                setError('Güvenliğiniz için ilk girişte şifrenizi değiştirmeniz zorunludur.');
            }
        }
    }, []);

    // Fetch data on mount
    useEffect(() => {
        if (user) {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchOrders(),
            fetchContents(),
            fetchProfile(),
            fetchCompany()
        ]);
        setLoading(false);
    };

    const fetchContents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/profile/contents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setContents(Array.isArray(data.contents) ? data.contents : []);
            } else {
                setContents([]);
            }
        } catch (err) {
            console.error('Error fetching contents:', err);
            setContents([]);
        }
    };

    const getFeatureList = (features?: string | null) => {
        if (!features) return [];
        return features
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const getEmbedUrl = (url?: string | null) => {
        if (!url) return null;

        if (url.includes('youtube.com/watch?v=')) {
            const id = url.split('v=')[1]?.split('&')[0];
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (url.includes('youtu.be/')) {
            const id = url.split('youtu.be/')[1]?.split('?')[0];
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (url.includes('player.vimeo.com/video/')) {
            return url;
        }
        if (url.includes('vimeo.com/')) {
            const id = url.split('vimeo.com/')[1]?.split('?')[0];
            return id ? `https://player.vimeo.com/video/${id}` : null;
        }

        return null;
    };

    const fetchOrders = async () => {
        try {
            if (!user?.id) return;

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/orders/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Backend returns { orders: [...] }
                setOrders(Array.isArray(data.orders) ? data.orders : []);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setOrders([]);
        }
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setProfileForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone: data.phone || '',
                    address: data.address || ''
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchCompany = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/company`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCompany(data);
                if (data) {
                    setCompanyForm({
                        company_name: data.company_name || '',
                        tax_number: data.tax_number || '',
                        company_address: data.company_address || '',
                        company_phone: data.company_phone || ''
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching company:', err);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Profil başarıyla güncellendi!');
                setProfile(data.user);
            } else {
                setError(data.error || 'Profil güncellenirken hata oluştu');
            }
        } catch (err) {
            setError('Sunucu hatası');
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setError('Yeni şifreler eşleşmiyor');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/profile/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: passwordForm.current_password,
                    new_password: passwordForm.new_password
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Şifre başarıyla değiştirildi!');
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                setError(data.error || 'Şifre değiştirilirken hata oluştu');
            }
        } catch (err) {
            setError('Sunucu hatası');
        }
    };

    const handleCompanyUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/company`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(companyForm)
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Firma bilgileri başarıyla kaydedildi!');
                setCompany(data.company);
            } else {
                setError(data.error || 'Firma bilgileri kaydedilirken hata oluştu');
            }
        } catch (err) {
            setError('Sunucu hatası');
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-container">
                    <div className="loading">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Hoş Geldiniz, {user?.first_name}!</h1>
                    <p>Hesap bilgilerinizi ve siparişlerinizi buradan yönetebilirsiniz.</p>
                </div>

                <div className="dashboard-tabs">
                    <button
                        className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('orders'); setMessage(''); setError(''); }}
                    >
                        <HiShoppingBag /> Siparişlerim
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'contents' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('contents'); setMessage(''); setError(''); }}
                    >
                        <HiPlay /> İçeriklerim
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('profile'); setMessage(''); setError(''); }}
                    >
                        <HiUser /> Profil Bilgileri
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('password'); setMessage(''); setError(''); }}
                    >
                        <HiLockClosed /> Şifre Değiştir
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'company' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('company'); setMessage(''); setError(''); }}
                    >
                        <HiBriefcase /> Firma Bilgileri
                    </button>
                </div>

                <div className="dashboard-content">
                    {message && <div className="success-message">{message}</div>}
                    {error && <div className="error-message">{error}</div>}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="tab-content">
                            <h2>Siparişlerim</h2>
                            {orders.length === 0 ? (
                                <div className="empty-state">
                                    <p>Henüz siparişiniz bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="orders-table-container">
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Sipariş No</th>
                                                <th>Tarih</th>
                                                <th>Ürünler</th>
                                                <th>Tutar</th>
                                                <th>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="col-id">#{order.id}</td>
                                                    <td className="col-date">{new Date(order.created_at).toLocaleDateString('tr-TR')}</td>
                                                    <td className="col-products">
                                                        {order.items && order.items.length > 0 ? (
                                                            <div className="product-list-compact">
                                                                {order.items.map((item, index) => (
                                                                    <div key={item.id} className="product-item-compact">
                                                                        <span>{item.product_name}</span>
                                                                        {item.quantity > 1 && <span className="qty-badge">x{item.quantity}</span>}
                                                                        {index < order.items.length - 1 && <span className="separator">, </span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td className="col-total">
                                                        {order.total_amount.toLocaleString('tr-TR')} {order.currency}
                                                    </td>
                                                    <td className="col-status">
                                                        <span className={`status-badge status-${order.status}`}>
                                                            {order.status === 'completed' ? 'Tamamlandı' :
                                                                order.status === 'pending' ? 'Beklemede' : 'İşleniyor'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Purchased Contents Tab */}
                    {activeTab === 'contents' && (
                        <div className="tab-content">
                            <h2>İçeriklerim</h2>
                            {contents.length === 0 ? (
                                <div className="empty-state">
                                    <p>Henüz erişime açık bir eğitim içeriğiniz bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="content-library-grid">
                                    {contents.map((content) => {
                                        const features = getFeatureList(content.features);
                                        const embedUrl = getEmbedUrl(content.access_content_url);

                                        return (
                                            <article key={`${content.subscription_id}-${content.product_id}`} className="content-library-card">
                                                <div className="content-library-header">
                                                    <h3>{content.name}</h3>
                                                    <span className="content-badge">Erişim Aktif</span>
                                                </div>
                                                {content.description && <p className="content-library-description">{content.description}</p>}
                                                {features.length > 0 && (
                                                    <ul className="content-library-features">
                                                        {features.map((feature, idx) => (
                                                            <li key={idx}>{feature}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {embedUrl ? (
                                                    <div className="content-video-frame">
                                                        <iframe
                                                            src={embedUrl}
                                                            title={content.name}
                                                            allow="autoplay; fullscreen; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="content-video-placeholder">
                                                        Video linki henüz girilmemiş.
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="tab-content">
                            <h2>Profil Bilgileri</h2>
                            <form onSubmit={handleProfileUpdate} className="dashboard-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Ad</label>
                                        <input
                                            type="text"
                                            value={profileForm.first_name}
                                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Soyad</label>
                                        <input
                                            type="text"
                                            value={profileForm.last_name}
                                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>E-posta</label>
                                    <input type="email" value={user?.email} disabled />
                                    <small>E-posta adresinizi değiştiremezsiniz</small>
                                </div>
                                <div className="form-group">
                                    <label>Telefon</label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres</label>
                                    <textarea
                                        value={profileForm.address}
                                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Değişiklikleri Kaydet</button>
                            </form>
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <div className="tab-content">
                            <h2>Şifre Değiştir</h2>
                            <form onSubmit={handlePasswordChange} className="dashboard-form">
                                <div className="form-group">
                                    <label>Mevcut Şifre</label>
                                    <input
                                        type="password"
                                        value={passwordForm.current_password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Yeni Şifre</label>
                                    <input
                                        type="password"
                                        value={passwordForm.new_password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Yeni Şifre (Tekrar)</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirm_password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Şifreyi Değiştir</button>
                            </form>
                        </div>
                    )}

                    {/* Company Tab */}
                    {activeTab === 'company' && (
                        <div className="tab-content">
                            <h2>Firma Bilgileri</h2>
                            <p className="tab-description">Fatura için firma bilgilerinizi girebilirsiniz (İsteğe bağlı)</p>
                            <form onSubmit={handleCompanyUpdate} className="dashboard-form">
                                <div className="form-group">
                                    <label>Firma Adı</label>
                                    <input
                                        type="text"
                                        value={companyForm.company_name}
                                        onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vergi Numarası</label>
                                    <input
                                        type="text"
                                        value={companyForm.tax_number}
                                        onChange={(e) => setCompanyForm({ ...companyForm, tax_number: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Firma Adresi</label>
                                    <textarea
                                        value={companyForm.company_address}
                                        onChange={(e) => setCompanyForm({ ...companyForm, company_address: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Firma Telefonu</label>
                                    <input
                                        type="tel"
                                        value={companyForm.company_phone}
                                        onChange={(e) => setCompanyForm({ ...companyForm, company_phone: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Firma Bilgilerini Kaydet</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
