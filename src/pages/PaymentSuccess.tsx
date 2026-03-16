import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { HiCheckCircle } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import './PaymentSuccess.css';
import { useTranslation } from 'react-i18next';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';

export default function PaymentSuccess() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const orderNumber = location.state?.orderNumber || 'N/A';
    const currentLang = useRouteLocale();
    const homePath = getLocalizedPathByKey(currentLang, 'home');

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    return (
        <div className="payment-result-page">
            <div className="result-container">
                <div className="result-card success">
                    <HiCheckCircle className="result-icon" />
                    <h1>{t('paymentStatus.success.title')}</h1>
                    <p>{t('paymentStatus.success.description')}</p>
                    <div className="order-details">
                        <p><strong>{t('paymentStatus.orderNumber')}</strong> {orderNumber}</p>
                    </div>
                    <button className="btn-home" onClick={() => navigate(homePath)}>
                        {t('paymentStatus.backHome')}
                    </button>
                </div>
            </div>
        </div>
    );
}
