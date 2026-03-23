import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';

export default function PaymentCallback() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const currentLang = useRouteLocale();
    const dashboardPath = getLocalizedPathByKey(currentLang, 'dashboard');
    const checkoutPath = getLocalizedPathByKey(currentLang, 'checkout');
    const [message, setMessage] = useState(t('paymentStatus.callback.verifying'));
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        let active = true;

        const run = async () => {
            try {
                const search = location.search || '';
                const response = await api.get(`/payment/callback${search}`);
                const status = String(response?.data?.status || '').toLowerCase();
                const success = ['success', '3dsuccess', 'approved', 'completed'].includes(status);

                if (!active) return;
                if (success) {
                    clearCart();
                    setMessage(t('paymentStatus.callback.success'));
                    setTimeout(() => navigate(`${dashboardPath}?tab=orders&success=true`, { replace: true }), 1200);
                } else {
                    setIsError(true);
                    setMessage(t('paymentStatus.callback.failed', { status: response?.data?.status || 'failed' }));
                }
            } catch (error: any) {
                if (!active) return;
                setIsError(true);
                setMessage(error?.response?.data?.error || t('paymentStatus.callback.unverified'));
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [location.search, navigate, clearCart, dashboardPath, t]);

    return (
        <div style={{ maxWidth: 720, margin: '80px auto', padding: '24px', textAlign: 'center' }}>
            <h1 style={{ marginBottom: 12 }}>{isError ? t('paymentStatus.callback.errorTitle') : t('paymentStatus.callback.title')}</h1>
            <p style={{ marginBottom: 20 }}>{message}</p>
            {isError && (
                <button
                    type="button"
                    onClick={() => navigate(checkoutPath)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                    {t('paymentStatus.callback.backToCheckout')}
                </button>
            )}
        </div>
    );
}
