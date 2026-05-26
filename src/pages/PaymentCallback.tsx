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
                // SADECE backend'in nihai kararına (`finalSuccess`) güven — Lidio'nun ham `status`
                // değeri sadece 3DS aşamasını yansıtır; FinishPaymentProcess ve fraud kontrolü
                // sonrasında order yine 'failed' olabilir, bu durumda kullanıcıya başarılı deme.
                const finalSuccess = response?.data?.finalSuccess === true;
                const resolvedStatus = String(response?.data?.resolvedStatus || '').toLowerCase();
                const fraud = String(response?.data?.fraudControlResult || '').toLowerCase();
                // Defansif: idempotent response'da bile sipariş zaten completed kabul edilir
                const alreadyProcessed = response?.data?.alreadyProcessed === true;
                const success = finalSuccess || alreadyProcessed || resolvedStatus === 'completed';

                if (!active) return;
                if (success) {
                    clearCart();
                    setMessage(t('paymentStatus.callback.success'));
                    setTimeout(() => navigate(`${dashboardPath}?tab=orders&success=true`, { replace: true }), 1200);
                } else if (resolvedStatus === 'processing') {
                    // Fraud kontrolü InProcess — sipariş Dashboard'da bekliyor
                    clearCart();
                    setMessage(t('paymentStatus.callback.success'));
                    setTimeout(() => navigate(`${dashboardPath}?tab=orders`, { replace: true }), 1500);
                } else {
                    setIsError(true);
                    if (fraud === 'riskdetected') {
                        setMessage(t('paymentStatus.callback.errors.fraudDetected'));
                    } else {
                        setMessage(t('paymentStatus.callback.failed', { status: response?.data?.status || 'failed' }));
                    }
                }
            } catch (error: any) {
                if (!active) return;
                setIsError(true);
                // Backend İngilizce error string dönüyor — kullanıcıya göstermek yerine
                // bilinen mesajları yerelleştir, bilinmeyenler için generic fallback kullan
                const rawError = String(error?.response?.data?.error || '').toLowerCase();
                let key = 'paymentStatus.callback.errors.generic';
                if (rawError.includes('order not found')) key = 'paymentStatus.callback.errors.orderNotFound';
                else if (rawError.includes('fraud') || rawError.includes('risk')) key = 'paymentStatus.callback.errors.fraudDetected';
                else if (rawError.includes('payment') && rawError.includes('fail')) key = 'paymentStatus.callback.errors.paymentFailed';
                else if (!rawError) key = 'paymentStatus.callback.unverified';
                setMessage(t(key));
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
