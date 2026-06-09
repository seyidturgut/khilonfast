import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HiShoppingBag, HiUser, HiLockClosed, HiBriefcase, HiPlay, HiClipboardList, HiCreditCard, HiPhotograph } from 'react-icons/hi';
import EyeTrackingPanel from '../components/dashboard/EyeTrackingPanel';
import { useRouteLocale, getLocalizedPathByKey } from '../utils/locale';
import { API_BASE_URL } from '../config/api';
import './Dashboard.css';

interface OrderItem {
    id: number;
    order_item_id?: number;
    product_id: number;
    product_name: string;
    product_category?: string;
    product_key?: string;
    product_type?: 'service' | 'subscription' | 'video_course' | 'digital_download';
    duration_days?: number | null;
    requires_onboarding?: boolean | number;
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
    has_started?: boolean;
    // Abonelik alanları
    next_renewal_at?: string | null;
    auto_renew?: number;
    payment_method?: 'credit_card' | 'manual_transfer' | null;
    cancellation_requested_at?: string | null;
    cancelled_at?: string | null;
    card_masked?: string | null;
    card_brand?: string | null;
    duration_days?: number | null;
    is_subscription?: boolean;
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
    // Onboarding status: "${orderId}-${orderItemId}" → {exists, status}
    // Ürün-bazlı: her sipariş kalemi için ayrı durum tutulur.
    type OnboardingStatusEntry = { exists: boolean; status?: 'new' | 'reviewed' | 'awaiting_user_response' | 'approved' | null };
    const [onboardingStatus, setOnboardingStatus] = useState<Record<string, OnboardingStatusEntry>>({});
    const obKey = (orderId: number, orderItemId: number) => `${orderId}-${orderItemId}`;
    // Sipariş seviyesinde özet: ilk eksik form, en kötü durum vs.
    const getOrderObSummary = (order: Order) => {
        const items = (order.items || []).filter(i => i.requires_onboarding === true || i.requires_onboarding === 1);
        if (items.length === 0) return null;
        const entries = items.map(i => {
            const oiId = i.order_item_id || i.id;
            return { item: i, oiId, entry: onboardingStatus[obKey(order.id, oiId)] };
        });
        const firstPending = entries.find(e => !e.entry || e.entry.exists === false);
        if (firstPending) {
            return { state: 'pending' as const, order_id: order.id, order_item_id: firstPending.oiId };
        }
        if (entries.some(e => e.entry?.status === 'awaiting_user_response')) {
            return { state: 'awaiting' as const, order_id: order.id };
        }
        if (entries.every(e => e.entry?.status === 'approved')) {
            return { state: 'approved' as const, order_id: order.id };
        }
        return { state: 'preparing' as const, order_id: order.id };
    };

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
            subscriptions: isEn ? 'My Subscriptions' : 'Aboneliklerim',
            eyeTracking: isEn ? 'Ad Analyses' : 'Reklam Analizleri',
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
        if (tab === 'eye_tracking' || tab === 'eyeTracking') {
            setActiveTab('eye_tracking');
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
            fetchTrainingRoutes(),
            fetchBookings()
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

    const [subBusyId, setSubBusyId] = useState<number | null>(null);

    // ── Danışmanlık randevuları (müşteri kendi iptal eder) ──
    const [bookings, setBookings] = useState<any[]>([]);
    const [bookingBusyId, setBookingBusyId] = useState<number | null>(null);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/profile/consultant-bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const d = await res.json();
                setBookings(Array.isArray(d.bookings) ? d.bookings : []);
            } else { setBookings([]); }
        } catch { setBookings([]); }
    };

    const cancelBooking = async (bookingId: number) => {
        const ok = window.confirm(isEn
            ? 'Your consultation appointment will be cancelled and a refund request will be sent to our team. Continue?'
            : 'Danışmanlık randevunuz iptal edilecek ve iade talebiniz ekibimize iletilecek. Onaylıyor musunuz?');
        if (!ok) return;
        setBookingBusyId(bookingId);
        setError(''); setMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/profile/consultant-bookings/${bookingId}/cancel`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                setMessage(isEn ? 'Your appointment has been cancelled. Refund request sent.' : 'Randevunuz iptal edildi. İade talebiniz iletildi.');
                await fetchBookings();
            } else {
                setError(d.error || (isEn ? 'Could not cancel.' : 'İptal edilemedi.'));
            }
        } catch {
            setError(isEn ? 'Network error.' : 'Bağlantı hatası.');
        } finally {
            setBookingBusyId(null);
        }
    };

    const cancelSubscription = async (subscriptionId: number) => {
        const ok = window.confirm(isEn
            ? 'Auto-renewal will be turned off. Your access continues until the end of the current period. Continue?'
            : 'Otomatik yenileme kapatılacak. Erişiminiz mevcut dönem sonuna kadar devam eder. Onaylıyor musunuz?');
        if (!ok) return;
        setSubBusyId(subscriptionId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/profile/subscriptions/${subscriptionId}/cancel`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                setMessage(isEn ? 'Subscription will end at period close.' : 'Aboneliğiniz dönem sonunda sonlandırılacak.');
                await fetchContents();
            } else {
                setError(d.error || (isEn ? 'Could not cancel.' : 'İptal edilemedi.'));
            }
        } catch {
            setError(isEn ? 'Network error.' : 'Bağlantı hatası.');
        } finally {
            setSubBusyId(null);
        }
    };

    const resumeSubscription = async (subscriptionId: number) => {
        setSubBusyId(subscriptionId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/profile/subscriptions/${subscriptionId}/resume`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                setMessage(isEn ? 'Auto-renewal re-enabled.' : 'Otomatik yenileme yeniden aktif edildi.');
                await fetchContents();
            } else {
                setError(d.error || (isEn ? 'Could not resume.' : 'İşlem başarısız.'));
            }
        } catch {
            setError(isEn ? 'Network error.' : 'Bağlantı hatası.');
        } finally {
            setSubBusyId(null);
        }
    };

    const fmtDate = (s?: string | null) =>
        s ? new Date(s).toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

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

                // Onboarding gerektiren item: backend'den gelen requires_onboarding flag'i
                const requiresOnboarding = (i: OrderItem) => i.requires_onboarding === true || i.requires_onboarding === 1;
                const serviceOrders = fetchedOrders.filter(o => o.items?.some(requiresOnboarding));
                if (serviceOrders.length > 0) {
                    const statusMap: Record<string, OnboardingStatusEntry> = {};
                    await Promise.all(serviceOrders.map(async (order) => {
                        try {
                            const res = await fetch(`${API_BASE}/onboarding-form/order/${order.id}/items`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const d = await res.json();
                            const items = Array.isArray(d.items) ? d.items : [];
                            for (const it of items) {
                                if (!it.requires_onboarding) continue;
                                statusMap[obKey(order.id, it.order_item_id)] = {
                                    exists: it.exists === true,
                                    status: it.status ?? null,
                                };
                            }
                        } catch {
                            // Bu siparişin formu yoklanamadı; pending olarak bırak
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
                        className={`tab-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('subscriptions'); setMessage(''); setError(''); }}
                    >
                        <HiCreditCard /> <span className="tab-label">{copy.tabs.subscriptions}</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'eye_tracking' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('eye_tracking'); setMessage(''); setError(''); }}
                    >
                        <HiPhotograph /> <span className="tab-label">{copy.tabs.eyeTracking}</span>
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
                                                        {/* Ödeme henüz onaylanmamışsa form butonu yerine "ödeme bekleniyor" göster */}
                                                        {order.status === 'processing' && (
                                                            <span className="status-badge status-pending" style={{ marginLeft: 6 }}>
                                                                {isEn ? 'Awaiting Payment' : 'Ödeme Bekleniyor'}
                                                            </span>
                                                        )}
                                                        {order.status === 'completed' && (() => {
                                                            const sum = getOrderObSummary(order);
                                                            if (!sum) return null;
                                                            const presPath = `${isEn ? '/en/onboarding-presentation' : '/onboarding-sunumu'}/${order.id}`;
                                                            if (sum.state === 'pending') {
                                                                return (
                                                                    <Link to={`${onboardingFormPath}?order_id=${sum.order_id}&order_item_id=${sum.order_item_id}`} className="btn-fill-form">
                                                                        {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                                    </Link>
                                                                );
                                                            }
                                                            if (sum.state === 'awaiting') {
                                                                return (
                                                                    <Link to={presPath} className="btn-fill-form" style={{ background: '#fbbf24' }}>
                                                                        {isEn ? 'New Questions' : 'Yeni Sorular Var'}
                                                                    </Link>
                                                                );
                                                            }
                                                            if (sum.state === 'approved') {
                                                                return (
                                                                    <Link to={presPath} className="btn-fill-form" style={{ background: '#22c55e' }}>
                                                                        {isEn ? 'Strategic Brief' : 'Stratejik Brifim'}
                                                                    </Link>
                                                                );
                                                            }
                                                            return (
                                                                <span className="status-badge" style={{ background: '#e2e8f0', color: '#64748b' }}>
                                                                    {isEn ? 'Preparing strategy...' : 'Strateji hazırlanıyor...'}
                                                                </span>
                                                            );
                                                        })()}
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
                                                    {order.status === 'processing' && (
                                                        <span className="status-badge status-pending">
                                                            {isEn ? 'Awaiting Payment' : 'Ödeme Bekleniyor'}
                                                        </span>
                                                    )}
                                                    {order.status === 'completed' && (() => {
                                                        const sum = getOrderObSummary(order);
                                                        const presPath = `${isEn ? '/en/onboarding-presentation' : '/onboarding-sunumu'}/${order.id}`;
                                                        if (!sum) return null;
                                                        if (sum.state === 'pending') {
                                                            return (
                                                                <Link to={`${onboardingFormPath}?order_id=${sum.order_id}&order_item_id=${sum.order_item_id}`} className="btn-fill-form">
                                                                    {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                                </Link>
                                                            );
                                                        }
                                                        if (sum.state === 'awaiting') {
                                                            return (
                                                                <Link to={presPath} className="btn-fill-form" style={{ background: '#fbbf24' }}>
                                                                    {isEn ? 'New Questions' : 'Yeni Sorular'}
                                                                </Link>
                                                            );
                                                        }
                                                        if (sum.state === 'approved') {
                                                            return (
                                                                <Link to={presPath} className="btn-fill-form" style={{ background: '#22c55e' }}>
                                                                    {isEn ? 'Strategic Brief' : 'Stratejik Brifim'}
                                                                </Link>
                                                            );
                                                        }
                                                        return (
                                                            <span className="status-badge" style={{ background: '#e2e8f0', color: '#64748b' }}>
                                                                {isEn ? 'Preparing...' : 'Hazırlanıyor...'}
                                                            </span>
                                                        );
                                                    })()}
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
                                // Pending: sadece COMPLETED siparişlerin form-required kalemlerinden
                                // henüz formu doldurulmamış olanlar. Aynı kullanıcı aynı ürünü 2 ayrı siparişle
                                // aldıysa 2 ayrı kart çıkar — her sipariş kalemi ayrı form ister.
                                const completedOrders = orders.filter(o => o.status === 'completed');

                                type PendingCard = {
                                    product_id: number;
                                    product_name: string;
                                    order_id: number;
                                    order_item_id: number;
                                };
                                // Subscription'ı OLAN ürünler için form CTA'sı içeride gösterilir,
                                // ayrıca sarı pending kart açılmaz (duplicate UX).
                                // PHP PDO bazen integer'ları string döndürür → Number() ile cast et
                                const productsWithSubscription = new Set<number>(contents.map(c => Number(c.product_id)));
                                const pendingCards: PendingCard[] = [];
                                // pendingFormByProduct: subscription kartına item link basabilmek için
                                // ürün → {order_id, order_item_id} eşlemesi (en güncel pending item)
                                const pendingFormByProduct: Record<number, { order_id: number; order_item_id: number }> = {};

                                for (const order of completedOrders) {
                                    const serviceItems = (order.items || []).filter(i =>
                                        i.requires_onboarding === true || i.requires_onboarding === 1
                                    );
                                    for (const item of serviceItems) {
                                        const oiId = item.order_item_id || item.id;
                                        const entry = onboardingStatus[obKey(order.id, oiId)];
                                        if (entry?.exists) continue; // form doldurulmuş — pending değil
                                        // En güncel pending item'ı subscription kartı için tut (sonuncu yazılan kalır)
                                        pendingFormByProduct[item.product_id] = { order_id: order.id, order_item_id: oiId };
                                        if (!productsWithSubscription.has(item.product_id)) {
                                            pendingCards.push({
                                                product_id: item.product_id,
                                                product_name: item.product_name || '-',
                                                order_id: order.id,
                                                order_item_id: oiId
                                            });
                                        }
                                    }
                                }

                                const hasContent = contents.length > 0 || pendingCards.length > 0;
                                if (!hasContent) return (
                                    <div className="empty-state">
                                        <p>{copy.contents.empty}</p>
                                    </div>
                                );
                                return (
                                <div className="content-library-grid">
                                    {pendingCards.map(card => (
                                        <article key={`pending-${card.order_id}-${card.order_item_id}`} className="onboarding-pending-card">
                                            <div className="content-library-header">
                                                <h3>{card.product_name}</h3>
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
                                                    to={`${onboardingFormPath}?order_id=${card.order_id}&order_item_id=${card.order_item_id}`}
                                                    className="onboarding-pending-btn"
                                                >
                                                    <HiClipboardList />
                                                    {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                </Link>
                                            </div>
                                        </article>
                                    ))}
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
                                                            {content.has_started
                                                                ? (isEn ? 'Continue Training' : 'Eğitime Devam Et')
                                                                : (isEn ? 'Start Training' : 'Eğitime Başla')}
                                                        </Link>
                                                    </div>
                                                    {(() => {
                                                        const ref = pendingFormByProduct[Number(content.product_id)];
                                                        if (!ref) return null;
                                                        const entry = onboardingStatus[obKey(ref.order_id, ref.order_item_id)];
                                                        const presPath = `${isEn ? '/en/onboarding-presentation' : '/onboarding-sunumu'}/${ref.order_id}`;

                                                        if (!entry || entry.exists === false) {
                                                            return (
                                                                <div style={{ marginTop: 8, padding: 10, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                                    <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                                                        {isEn ? 'Onboarding form pending' : 'Onboarding formu bekliyor'}
                                                                    </span>
                                                                    <Link to={`${onboardingFormPath}?order_id=${ref.order_id}&order_item_id=${ref.order_item_id}`} className="onboarding-pending-btn" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                                                                        <HiClipboardList />
                                                                        {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                                    </Link>
                                                                </div>
                                                            );
                                                        }
                                                        if (entry.status === 'awaiting_user_response') {
                                                            return (
                                                                <div style={{ marginTop: 8, padding: 10, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                                    <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                                                        {isEn ? 'New questions from our team' : 'Ekibimizden yeni sorular var'}
                                                                    </span>
                                                                    <Link to={presPath} className="onboarding-pending-btn" style={{ fontSize: '0.85rem', padding: '6px 14px', background: '#fbbf24' }}>
                                                                        {isEn ? 'Answer' : 'Cevapla'}
                                                                    </Link>
                                                                </div>
                                                            );
                                                        }
                                                        if (entry.status === 'approved') {
                                                            return (
                                                                <div style={{ marginTop: 8, padding: 10, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                                    <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                                                                        ✨ {isEn ? 'Your strategic brief is ready' : 'Stratejik brifiniz hazır'}
                                                                    </span>
                                                                    <Link to={presPath} className="onboarding-pending-btn" style={{ fontSize: '0.85rem', padding: '6px 14px', background: '#22c55e' }}>
                                                                        {isEn ? 'View' : 'Görüntüle'}
                                                                    </Link>
                                                                </div>
                                                            );
                                                        }
                                                        // new / reviewed → hazırlanıyor
                                                        return (
                                                            <div style={{ marginTop: 8, padding: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                                    {isEn ? '⏳ Strategy preparing — we\'ll email you when ready' : '⏳ Stratejimiz hazırlanıyor — hazır olduğunda mail göndereceğiz'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
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
                                                {String(content.product_key || '').toLowerCase().startsWith('eye-') ? (
                                                    <div style={{
                                                        marginTop: 12, padding: 14, background: '#f0f9ff', border: '1px solid #bae6fd',
                                                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
                                                    }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#075985' }}>
                                                            {isEn
                                                                ? 'Upload your ad image for analysis from the Ad Analyses tab.'
                                                                : 'Analiz için reklam görselinizi Reklam Analizleri sekmesinden yükleyin.'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setActiveTab('eye_tracking'); }}
                                                            className="onboarding-pending-btn"
                                                            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                                                        >
                                                            {isEn ? 'Upload Image' : 'Görsel Yükle'}
                                                        </button>
                                                    </div>
                                                ) : isTraining && embedUrl ? (
                                                    <div className="content-video-frame">
                                                        <iframe
                                                            src={embedUrl}
                                                            title={isEn ? (content.name_en || content.name) : content.name}
                                                            allow="autoplay; fullscreen; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                ) : isTraining ? (
                                                    // Eğitim ürünü ama video linki henüz yok
                                                    <div className="content-video-placeholder">
                                                        {copy.contents.missingVideo}
                                                    </div>
                                                ) : null /* Eğitim-dışı ürün (danışmanlık/GTM/Maestro): video bölümü gösterilmez */}
                                                {/* Form gerekiyorsa content kartı içinde küçük CTA */}
                                                {pendingFormByProduct[Number(content.product_id)] && (
                                                    <div style={{ marginTop: 12, padding: 10, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                                            {isEn ? 'Onboarding form pending' : 'Onboarding formu bekliyor'}
                                                        </span>
                                                        <Link
                                                            to={`${onboardingFormPath}?order_id=${pendingFormByProduct[Number(content.product_id)].order_id}&order_item_id=${pendingFormByProduct[Number(content.product_id)].order_item_id}`}
                                                            className="onboarding-pending-btn"
                                                            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                                                        >
                                                            <HiClipboardList />
                                                            {isEn ? 'Fill Form' : 'Formu Doldur'}
                                                        </Link>
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

                    {/* Subscriptions Tab */}
                    {activeTab === 'subscriptions' && (
                        <div className="tab-content">
                            {/* Danışmanlık Randevuları — müşteri kendi iptal edebilir */}
                            {bookings.filter(b => b.status !== 'cancelled').length > 0 && (
                                <div style={{ marginBottom: 28 }}>
                                    <h2>{isEn ? 'My Consultation Appointments' : 'Danışmanlık Randevularım'}</h2>
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        {bookings.filter(b => b.status !== 'cancelled').map((b: any) => {
                                            const dt = b.start_at ? new Date(String(b.start_at).replace(' ', 'T')) : null;
                                            const dateStr = dt ? dt.toLocaleString(isEn ? 'en-US' : 'tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                                            const title = isEn ? (b.service_title_en || b.service_title) : b.service_title;
                                            const statusMap: Record<string, { label: string; bg: string; color: string }> = {
                                                pending: { label: isEn ? 'Pending' : 'Onay Bekliyor', bg: '#fef9c3', color: '#854d0e' },
                                                confirmed: { label: isEn ? 'Confirmed' : 'Onaylandı', bg: '#dcfce7', color: '#166534' },
                                                completed: { label: isEn ? 'Completed' : 'Tamamlandı', bg: '#e0e7ff', color: '#3730a3' },
                                            };
                                            const stt = statusMap[b.status] || { label: b.status, bg: '#f3f4f6', color: '#6b7280' };
                                            return (
                                                <div key={b.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#1f2937' }}>{title || (isEn ? 'Consultation' : 'Danışmanlık')}</div>
                                                        <div style={{ fontSize: '0.88rem', color: '#6b7280', marginTop: 4 }}>
                                                            {b.consultant_name ? `${b.consultant_name} · ` : ''}{dateStr}
                                                        </div>
                                                        <span style={{ display: 'inline-block', marginTop: 8, background: stt.bg, color: stt.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem' }}>{stt.label}</span>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {b.cancellable ? (
                                                            <button
                                                                onClick={() => cancelBooking(b.id)}
                                                                disabled={bookingBusyId === b.id}
                                                                style={{ background: '#fff', color: '#b91c1c', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: bookingBusyId === b.id ? 'wait' : 'pointer', fontSize: 13 }}
                                                            >
                                                                {bookingBusyId === b.id ? (isEn ? 'Cancelling...' : 'İptal ediliyor...') : (isEn ? 'Cancel' : 'İptal Et')}
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: '0.78rem', color: '#9ca3af', maxWidth: 180, display: 'inline-block' }}>
                                                                {isEn ? 'Cannot be cancelled within 48 hours of the appointment.' : 'Randevuya 48 saatten az kala iptal edilemez.'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <h2>{copy.tabs.subscriptions}</h2>
                            {(() => {
                                const subs = contents.filter(c => c.is_subscription === true || c.type === 'subscription');
                                if (subs.length === 0) {
                                    return (
                                        <div className="empty-state">
                                            <p>{isEn ? 'You have no active subscriptions yet.' : 'Henüz aktif aboneliğiniz bulunmuyor.'}</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="content-library-grid">
                                        {subs.map((s) => {
                                            const pname = isEn ? (s.name_en || s.name) : s.name;
                                            const cancelPending = !!s.cancellation_requested_at;
                                            const autoOn = Number(s.auto_renew) === 1 && !cancelPending;
                                            const payLabel = s.payment_method === 'credit_card'
                                                ? (s.card_masked
                                                    ? `${s.card_brand ? s.card_brand + ' ' : ''}**** ${String(s.card_masked).slice(-4)}`
                                                    : (isEn ? 'Credit card' : 'Kredi kartı'))
                                                : (isEn ? 'Bank transfer' : 'Havale / EFT');
                                            return (
                                                <article key={s.subscription_id} className="content-library-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                    <div className="content-library-header">
                                                        <h3>{pname}</h3>
                                                        <span className="content-badge" style={{
                                                            background: cancelPending ? '#fef3c7' : '#dcfce7',
                                                            color: cancelPending ? '#92400e' : '#166534'
                                                        }}>
                                                            {cancelPending
                                                                ? (isEn ? 'Ending' : 'Dönem sonu bitiyor')
                                                                : (isEn ? 'Active' : 'Aktif')}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: '0.88rem' }}>
                                                        <div>
                                                            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>{isEn ? 'Next renewal' : 'Sonraki yenileme'}</div>
                                                            <div style={{ color: '#1a3a52', fontWeight: 600 }}>{fmtDate(s.next_renewal_at)}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>{isEn ? 'Current period ends' : 'Mevcut dönem bitişi'}</div>
                                                            <div style={{ color: '#1a3a52', fontWeight: 600 }}>{fmtDate(s.expires_at)}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>{isEn ? 'Payment method' : 'Ödeme yöntemi'}</div>
                                                            <div style={{ color: '#1a3a52', fontWeight: 600 }}>{payLabel}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>{isEn ? 'Auto-renewal' : 'Otomatik yenileme'}</div>
                                                            <div style={{ color: autoOn ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                                                                {autoOn ? (isEn ? 'On' : 'Açık') : (isEn ? 'Off' : 'Kapalı')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {cancelPending && (
                                                        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: '#92400e' }}>
                                                            {isEn
                                                                ? `Auto-renewal is off. Your access continues until ${fmtDate(s.expires_at)}.`
                                                                : `Otomatik yenileme kapalı. Erişiminiz ${fmtDate(s.expires_at)} tarihine kadar devam eder.`}
                                                        </div>
                                                    )}

                                                    <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                                                        {autoOn ? (
                                                            <button
                                                                onClick={() => cancelSubscription(s.subscription_id)}
                                                                disabled={subBusyId === s.subscription_id}
                                                                style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                {subBusyId === s.subscription_id
                                                                    ? (isEn ? 'Processing…' : 'İşleniyor…')
                                                                    : (isEn ? 'Cancel renewal' : 'Yenilemeyi iptal et')}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => resumeSubscription(s.subscription_id)}
                                                                disabled={subBusyId === s.subscription_id}
                                                                style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#1a3a52', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                {subBusyId === s.subscription_id
                                                                    ? (isEn ? 'Processing…' : 'İşleniyor…')
                                                                    : (isEn ? 'Resume auto-renewal' : 'Yenilemeyi sürdür')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Eye Tracking Tab */}
                    {activeTab === 'eye_tracking' && (
                        <EyeTrackingPanel isEn={isEn} />
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
