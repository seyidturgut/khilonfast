import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function PaymentCallback() {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [message, setMessage] = useState('Ödeme sonucu doğrulanıyor...');
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
                    setMessage('Ödeme başarılı. Yönlendiriliyorsunuz...');
                    setTimeout(() => navigate('/dashboard?tab=orders&success=true', { replace: true }), 1200);
                } else {
                    setIsError(true);
                    setMessage(`Ödeme tamamlanamadı (${response?.data?.status || 'failed'}).`);
                }
            } catch (error: any) {
                if (!active) return;
                setIsError(true);
                setMessage(error?.response?.data?.error || 'Ödeme dönüşü doğrulanamadı.');
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [location.search, navigate, clearCart]);

    return (
        <div style={{ maxWidth: 720, margin: '80px auto', padding: '24px', textAlign: 'center' }}>
            <h1 style={{ marginBottom: 12 }}>{isError ? 'Ödeme Hatası' : 'Ödeme Sonucu'}</h1>
            <p style={{ marginBottom: 20 }}>{message}</p>
            {isError && (
                <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    style={{ padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                    Ödeme Adımına Dön
                </button>
            )}
        </div>
    );
}
