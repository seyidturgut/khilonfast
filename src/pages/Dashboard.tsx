import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HiShoppingBag, HiUser, HiLockClosed, HiBriefcase, HiPlay, HiClipboardList } from 'react-icons/hi';
import { useRouteLocale, getLocalizedPathByKey } from '../utils/locale';
import { API_BASE_URL } from '../config/api';
import './Dashboard.css';

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    product_category?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Order {
    id: number;
    status: string;
    created_at: string;
    subtotal_amount: number;
    coupon_discount_amount: number;
    shipping_amount: number;
    tax_amount: number;
    total_amount: number;
    currency: string;
    coupon_code?: string | null;
    coupon_name?: string | null;
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
    name_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    features?: string | null;
    features_en?: string | null;
    type?: string | null;
    category?: string | null;
    access_content_url?: string | null;
    training_slug?: string | null;
    order_status?: string | null;
}

export default function Dashboard() {
    const API_BASE = API_BASE_URL;
    const { user } = useAuth();
    const navigate = useNavigate();
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';
    const loginPath = getLocalizedPathByKey(currentLang, 'login');
    const onboardingFormPath = getLocalizedPathByKey(currentLang, 'onboardingForm');
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [contents, setContents] = useState<PurchasedContent[]>([]);
    const [trainingRoutes, setTrainingRoutes] = useState<Record<string, string>>({});
    const [, setProfile] = useState<Profile | null>(null);
    const [, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboardingStatus, setOnboardingStatus] = useState<Record<number, boolean>>({});

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
    const copy = {
        loading: isEn ? 'Loading...' : 'Yükleniyor...',
        welcome: isEn ? 'Welcome' : 'Hoş Geldiniz',
        subtitle: isEn ? 'You can manage your account details and orders from here.' : 'Hesap bilgilerinizi ve siparişlerinizi buradan yönetebilirsiniz.',
        tabs: {
            orders: isEn ? 'My Orders' : 'Siparişlerim',
            contents: isEn ? 'My Content' : 'İçeriklerim',
            profile: isEn ? 'Profile Details' : 'Profil Bilgileri',
            password: isEn ? 'Change Password' : 'Şifre Değiştir',
            company: isEn ? 'Company Details' : 'Firma Bilgileri'
        },
        messages: {
            paymentSuccess: isEn ? 'Your payment was completed successfully. Your order is shown below.' : 'Ödemeniz başarıyla tamamlandı! Siparişiniz aşağıda görüntülenmektedir.',
            forcePasswordChange: isEn ? 'For your security, you must change your password on first login.' : 'Güvenliğiniz için ilk girişte şifrenizi değiştirmeniz zorunludur.',
            profileSaved: isEn ? 'Profile updated successfully!' : 'Profil başarıyla güncellendi!',
            profileError: isEn ? 'An error occurred while updating your profile.' : 'Profil güncellenirken hata oluştu',
            passwordMismatch: isEn ? 'The new passwords do not match.' : 'Yeni şifreler eşleşmiyor',
            passwordSaved: isEn ? 'Password changed successfully!' : 'Şifre başarıyla değiştirildi!',
            passwordError: isEn ? 'An error occurred while changing the password.' : 'Şifre değiştirilirken hata oluştu',
            companySaved: isEn ? 'Company details saved successfully!' : 'Firma bilgileri başarıyla kaydedildi!',
            companyError: isEn ? 'An error occurred while saving company details.' : 'Firma bilgileri kaydedilirken hata oluştu',
            serverError: isEn ? 'Server error.' : 'Sunucu hatası'
        },
        orders: {
            title: isEn ? 'My Orders' : 'Siparişlerim',
            empty: isEn ? 'You do not have any orders yet.' : 'Henüz siparişiniz bulunmuyor.',
            number: isEn ? 'Order No' : 'Sipariş No',
            date: isEn ? 'Date' : 'Tarih',
            products: isEn ? 'Products' : 'Ürünler',
            amount: isEn ? 'Amount' : 'Tutar',
            status: isEn ? 'Status' : 'Durum',
            completed: isEn ? 'Completed' : 'Tamamlandı',
            pending: isEn ? 'Pending' : 'Beklemede',
            processing: isEn ? 'Processing' : 'İşleniyor',
            failed: isEn ? 'Failed' : 'Başarısız',
            cancelled: isEn ? 'Cancelled' : 'İptal Edildi',
            subtotal: isEn ? 'Subtotal' : 'Ara toplam',
            discount: isEn ? 'Coupon discount' : 'Kupon indirimi',
            shipping: isEn ? 'Shipping' : 'Kargo',
            tax: isEn ? 'Tax' : 'Vergi',
            total: isEn ? 'Grand total' : 'Genel toplam',
            coupon: isEn ? 'Coupon' : 'Kupon'
        },
        contents: {
            title: isEn ? 'My Content' : 'İçeriklerim',
            empty: isEn ? 'You do not have any training content with active access yet.' : 'Henüz erişime açık bir eğitim içeriğiniz bulunmuyor.',
            activeAccess: isEn ? 'Access Active' : 'Erişim Aktif',
            missingVideo: isEn ? 'The video link has not been entered yet.' : 'Video linki henüz girilmemiş.'
        },
        profile: {
            title: isEn ? 'Profile Details' : 'Profil Bilgileri',
            firstName: isEn ? 'First Name' : 'Ad',
            lastName: isEn ? 'Last Name' : 'Soyad',
            email: isEn ? 'Email' : 'E-posta',
            emailHint: isEn ? 'You cannot change your email address.' : 'E-posta adresinizi değiştiremezsiniz',
            phone: isEn ? 'Phone' : 'Telefon',
            address: isEn ? 'Address' : 'Adres',
            save: isEn ? 'Save Changes' : 'Değişiklikleri Kaydet'
        },
        password: {
            title: isEn ? 'Change Password' : 'Şifre Değiştir',
            current: isEn ? 'Current Password' : 'Mevcut Şifre',
            next: isEn ? 'New Password' : 'Yeni Şifre',
            confirm: isEn ? 'Repeat New Password' : 'Yeni Şifre (Tekrar)',
            save: isEn ? 'Change Password' : 'Şifreyi Değiştir'
        },
        company: {
            title: isEn ? 'Company Details' : 'Firma Bilgileri',
            description: isEn ? 'You can enter your company details for invoicing (optional).' : 'Fatura için firma bilgilerinizi girebilirsiniz (İsteğe bağlı)',
            name: isEn ? 'Company Name' : 'Firma Adı',
            tax: isEn ? 'Tax Number' : 'Vergi Numarası',
            address: isEn ? 'Company Address' : 'Firma Adresi',
            phone: isEn ? 'Company Phone' : 'Firma Telefonu',
            save: isEn ? 'Save Company Details' : 'Firma Bilgilerini Kaydet'
        }
    };

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate(loginPath);
        }
    }, [loginPath, user, navigate]);

    // Check URL parameters for auto-switching to orders tab
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        const success = params.get('success');
        const forcePasswordChange = params.get('forcePasswordChange');

        if (tab === 'orders') {
            setActiveTab('orders');
            if (success === 'true') {
                setMessage(copy.messages.paymentSuccess);
                // Clear URL parameters
                window.history.replaceState({}, '', getLocalizedPathByKey(currentLang, 'dashboard'));
            }
        }
        if (tab === 'password') {
            setActiveTab('password');
            if (forcePasswordChange === 'true') {
                setError(copy.messages.forcePasswordChange);
            }
        }
    }, [copy.messages.forcePasswordChange, copy.messages.paymentSuccess, currentLang]);

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
            fetchCompany(),
            fetchTrainingRoutes()
        ]);
        setLoading(false);
    };

    const fetchTrainingRoutes = async () => {
        try {
            const res = await fetch(`${API_BASE}/training-analytics/configs`);
            if (!res.ok) return;
            const data = await res.json();
            const routes: Record<string, string> = {};
            for (const item of data) {
                routes[item.product_key] = `/egitimllerim/${item.slug}`;
            }
            setTrainingRoutes(routes);
        } catch {
            // silently fail — dashboard still works without training routes
        }
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
                const fetchedOrders: Order[] = Array.isArray(data.orders) ? data.orders : [];
                setOrders(fetchedOrders);

                const serviceOrders = fetchedOrders.filter(o =>
                    o.items?.some(i => i.product_category === 'hizmetler' || i.product_category === 'sektorler')
                );
                if (serviceOrders.length > 0) {
                    const statusMap: Record<number, boolean> = {};
                    await Promise.all(serviceOrders.map(async (order) => {
                        try {
                            const res = await fetch(`${API_BASE}/onboarding-form/order/${order.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const d = await res.json();
                            statusMap[order.id] = d.exists === true;
                        } catch {
                            statusMap[order.id] = false;
                        }
                    }));
                    setOnboardingStatus(statusMap);
                }
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
                setMessage(copy.messages.profileSaved);
                setProfile(data.user);
            } else {
                setError(data.error || copy.messages.profileError);
            }
        } catch (err) {
            setError(copy.messages.serverError);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setError(copy.messages.passwordMismatch);
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
                setMessage(copy.messages.passwordSaved);
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                setError(data.error || copy.messages.passwordError);
            }
        } catch (err) {
            setError(copy.messages.serverError);
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
                setMessage(copy.messages.companySaved);
                setCompany(data.company);
            } else {
                setError(data.error || copy.messages.companyError);
            }
        } catch (err) {
            setError(copy.messages.serverError);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-container">
                    <div className="loading">{copy.loading}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>{copy.welcome}, {user?.first_name}!</h1>
                    <p>{copy.subtitle}</p>
                </div>

                <div className="dashboard-tabs">
                    <button
                        className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('orders'); setMessage(''); setError(''); }}
                    >
                        <HiShoppingBag /> <span className="tab-label">{copy.tabs.orders}</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'contents' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('contents'); setMessage(''); setError(''); }}
                    >
                        <HiPlay /> <span className="tab-label">{copy.tabs.contents}</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('profile'); setMessage(''); setError(''); }}
                    >
                        <HiUser /> <span className="tab-label">{copy.tabs.profile}</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('password'); setMessage(''); setError(''); }}
                    >
                        <HiLockClosed /> <span className="tab-label">{copy.tabs.password}</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'company' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('company'); setMessage(''); setError(''); }}
                    >
                        <HiBriefcase /> <span className="tab-label">{copy.tabs.company}</span>
                    </button>
                </div>

                <div className="dashboard-content">
                    {message && <div className="success-message">{message}</div>}
                    {error && <div className="error-message">{error}</div>}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="tab-content">
                            <h2>{copy.orders.title}</h2>
                            {orders.length === 0 ? (
                                <div className="empty-state">
                                    <p>{copy.orders.empty}</p>
                                </div>
                            ) : (
                                <div className="orders-table-container">
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>{copy.orders.number}</th>
                                                <th>{copy.orders.date}</th>
                                                <th>{copy.orders.products}</th>
                                                <th>{copy.orders.amount}</th>
                                                <th>{copy.orders.status}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="col-id">#{order.id}</td>
                                                    <td className="col-date">{new Date(order.created_at).toLocaleDateString(isEn ? 'en-US' : 'tr-TR')}</td>
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
                                                        <div className="order-total-main">
                                                            {order.total_amount.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {order.currency}
                                                        </div>
                                                        <div className="order-pricing-breakdown">
                                                            <div><span>{copy.orders.subtotal}</span><strong>{order.subtotal_amount.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {order.currency}</strong></div>
                                                            <div><span>{copy.orders.discount}</span><strong>- {order.coupon_discount_amount.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {order.currency}</strong></div>
                                                            <div><span>{copy.orders.shipping}</span><strong>{order.shipping_amount.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {order.currency}</strong></div>
                                                            <div><span>{copy.orders.tax}</span><strong>{order.tax_amount.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {order.currency}</strong></div>
                                                        </div>
                                                    </td>
                                                    <td className="col-status">
                                                        {order.coupon_code && (
                                                            <div className="order-coupon-chip">
                                                                {copy.orders.coupon}: {order.coupon_code}
                                                            </div>
                                                        )}
                                                        <span className={`status-badge status-${order.status}`}>
                                                            {order.status === 'completed' ? copy.orders.completed :
                                                                order.status === 'pending' ? copy.orders.pending :
                                                                    order.status === 'failed' ? copy.orders.failed :
                                                                        order.status === 'cancelled' ? copy.orders.cancelled :
                                                                            copy.orders.processing}
                                                        </span>
                                                        {onboardingStatus[order.id] === false && (
                                                            <Link
                                                                to={`${onboardingFormPath}?order_id=${order.id}`}
                                                                className="btn-fill-form"
                                                            >
                                                                {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Mobil kart görünümü */}
                                    <div className="orders-cards">
                                        {orders.map((order) => (
                                            <div key={order.id} className="order-card">
                                                <div className="order-card-header">
                                                    <div>
                                                        <div className="order-card-id">#{order.id}</div>
                                                        <div className="order-card-date">{new Date(order.created_at).toLocaleDateString(isEn ? 'en-US' : 'tr-TR')}</div>
                                                    </div>
                                                    <div className="order-card-right">
                                                        {order.coupon_code && (
                                                            <span className="order-card-coupon">{order.coupon_code}</span>
                                                        )}
                                                        <span className={`status-badge status-${order.status}`}>
                                                            {order.status === 'completed' ? copy.orders.completed :
                                                                order.status === 'pending' ? copy.orders.pending :
                                                                    order.status === 'failed' ? copy.orders.failed :
                                                                        order.status === 'cancelled' ? copy.orders.cancelled :
                                                                            copy.orders.processing}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="order-card-products">
                                                    {order.items?.map(i => i.product_name).filter(Boolean).join(', ') || '-'}
                                                </div>
                                                <div className="order-card-footer">
                                                    <span className="order-card-amount">
                                                        {order.total_amount?.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {order.currency}
                                                    </span>
                                                    {onboardingStatus[order.id] === false && (
                                                        <Link
                                                            to={`${onboardingFormPath}?order_id=${order.id}`}
                                                            className="btn-fill-form"
                                                        >
                                                            {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Purchased Contents Tab */}
                    {activeTab === 'contents' && (
                        <div className="tab-content">
                            <h2>{copy.contents.title}</h2>
                            {(() => {
                                const pendingOrders = orders.filter(o => onboardingStatus[o.id] === false);
                                const hasContent = contents.length > 0 || pendingOrders.length > 0;
                                if (!hasContent) return (
                                    <div className="empty-state">
                                        <p>{copy.contents.empty}</p>
                                    </div>
                                );
                                return (
                                <div className="content-library-grid">
                                    {pendingOrders.map(order => {
                                        const serviceItems = order.items?.filter(i =>
                                            i.product_category === 'hizmetler' || i.product_category === 'sektorler'
                                        ) || order.items || [];
                                        const productLabel = serviceItems.map(i => i.product_name).filter(Boolean).join(', ') || '-';
                                        return (
                                            <article key={`pending-${order.id}`} className="onboarding-pending-card">
                                                <div className="content-library-header">
                                                    <h3>{productLabel}</h3>
                                                    <span className="onboarding-pending-badge">
                                                        {isEn ? 'Form Required' : 'Form Bekliyor'}
                                                    </span>
                                                </div>
                                                <p className="content-library-description">
                                                    {isEn
                                                        ? 'Please fill the onboarding form to get started with your service.'
                                                        : 'Hizmete başlamak için onboarding formunu doldurmanız gerekiyor.'}
                                                </p>
                                                <div style={{ marginTop: 'auto' }}>
                                                    <Link
                                                        to={`${onboardingFormPath}?order_id=${order.id}`}
                                                        className="onboarding-pending-btn"
                                                    >
                                                        <HiClipboardList />
                                                        {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                    </Link>
                                                </div>
                                            </article>
                                        );
                                    })}
                                    {contents.map((content) => {
                                        const trainingBase = isEn ? '/en/egitimllerim' : '/egitimllerim';
                                        const trainingRoute = content.training_slug
                                            ? `${trainingBase}/${content.training_slug}`
                                            : trainingRoutes[content.product_key];
                                        const isTraining = content.product_key.startsWith('training-');

                                        if (isTraining && trainingRoute) {
                                            return (
                                                <article key={`${content.subscription_id}-${content.product_id}`} className="content-library-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div className="content-library-header">
                                                        <h3>{isEn ? (content.name_en || content.name) : content.name}</h3>
                                                        <span className="content-badge">{copy.contents.activeAccess}</span>
                                                    </div>
                                                    {(isEn ? content.description_en || content.description : content.description) && <p className="content-library-description">{isEn ? content.description_en || content.description : content.description}</p>}
                                                    <div style={{ marginTop: 'auto' }}>
                                                        <Link
                                                            to={trainingRoute}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                background: '#1a3a52',
                                                                color: 'white',
                                                                padding: '12px 24px',
                                                                borderRadius: '10px',
                                                                textDecoration: 'none',
                                                                fontWeight: 600,
                                                                fontSize: '0.95rem'
                                                            }}
                                                        >
                                                            <HiPlay />
                                                            {isEn ? 'Continue Training' : 'Eğitime Devam Et'}
                                                        </Link>
                                                    </div>
                                                </article>
                                            );
                                        }

                                        const features = getFeatureList(content.features);
                                        const embedUrl = getEmbedUrl(content.access_content_url);

                                        return (
                                            <article key={`${content.subscription_id}-${content.product_id}`} className="content-library-card">
                                                <div className="content-library-header">
                                                    <h3>{isEn ? (content.name_en || content.name) : content.name}</h3>
                                                    <span className="content-badge">{copy.contents.activeAccess}</span>
                                                </div>
                                                {(isEn ? content.description_en || content.description : content.description) && <p className="content-library-description">{isEn ? content.description_en || content.description : content.description}</p>}
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
                                                            title={isEn ? (content.name_en || content.name) : content.name}
                                                            allow="autoplay; fullscreen; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="content-video-placeholder">
                                                        {copy.contents.missingVideo}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="tab-content">
                            <h2>{copy.profile.title}</h2>
                            <form onSubmit={handleProfileUpdate} className="dashboard-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{copy.profile.firstName}</label>
                                        <input
                                            type="text"
                                            value={profileForm.first_name}
                                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{copy.profile.lastName}</label>
                                        <input
                                            type="text"
                                            value={profileForm.last_name}
                                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{copy.profile.email}</label>
                                    <input type="email" value={user?.email} disabled />
                                    <small>{copy.profile.emailHint}</small>
                                </div>
                                <div className="form-group">
                                    <label>{copy.profile.phone}</label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{copy.profile.address}</label>
                                    <textarea
                                        value={profileForm.address}
                                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">{copy.profile.save}</button>
                            </form>
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <div className="tab-content">
                            <h2>{copy.password.title}</h2>
                            <form onSubmit={handlePasswordChange} className="dashboard-form">
                                <div className="form-group">
                                    <label>{copy.password.current}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.current_password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{copy.password.next}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.new_password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{copy.password.confirm}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirm_password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">{copy.password.save}</button>
                            </form>
                        </div>
                    )}

                    {/* Company Tab */}
                    {activeTab === 'company' && (
                        <div className="tab-content">
                            <h2>{copy.company.title}</h2>
                            <p className="tab-description">{copy.company.description}</p>
                            <form onSubmit={handleCompanyUpdate} className="dashboard-form">
                                <div className="form-group">
                                    <label>{copy.company.name}</label>
                                    <input
                                        type="text"
                                        value={companyForm.company_name}
                                        onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{copy.company.tax}</label>
                                    <input
                                        type="text"
                                        value={companyForm.tax_number}
                                        onChange={(e) => setCompanyForm({ ...companyForm, tax_number: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{copy.company.address}</label>
                                    <textarea
                                        value={companyForm.company_address}
                                        onChange={(e) => setCompanyForm({ ...companyForm, company_address: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{copy.company.phone}</label>
                                    <input
                                        type="tel"
                                        value={companyForm.company_phone}
                                        onChange={(e) => setCompanyForm({ ...companyForm, company_phone: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">{copy.company.save}</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
