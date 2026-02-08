import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, paymentAPI } from '../services/api';
import { HiCreditCard, HiShoppingBag, HiCheckCircle } from 'react-icons/hi';
import './Checkout.css';

export default function Checkout() {
    const { user, isAuthenticated } = useAuth();
    const { items, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
        if (items.length === 0) {
            navigate('/');
        }
    }, [isAuthenticated, items, navigate]);

    const handlePayment = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Create order
            const orderData = {
                items: items.map(item => ({
                    product_id: item.product_id,
                    product_key: item.product_key,
                    quantity: 1
                }))
            };

            const orderResponse = await ordersAPI.create(orderData);
            const order = orderResponse.data.order;

            // Initiate payment (using test mode for now)
            const paymentResponse = await paymentAPI.initiate({
                order_id: order.id,
                use_3ds: false
            });

            if (paymentResponse.data.payment.success) {
                setSuccess(true);
                clearCart();

                setTimeout(() => {
                    // Redirect to dashboard orders tab
                    navigate('/dashboard?tab=orders&success=true');
                }, 1500);
            } else {
                throw new Error('Payment failed');
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.response?.data?.error || 'Ödeme işlemi başarısız');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="checkout-page">
                <div className="checkout-container">
                    <div className="success-message">
                        <HiCheckCircle className="success-icon" />
                        <h2>Ödeme Başarılı!</h2>
                        <p>Siparişiniz alındı. Yönlendiriliyorsunuz...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <h1>Ödeme</h1>

                <div className="checkout-grid">
                    {/* Order Summary */}
                    <div className="order-summary">
                        <h2>
                            <HiShoppingBag /> Sipariş Özeti
                        </h2>

                        <div className="summary-items">
                            {items.map((item) => (
                                <div key={item.id} className="summary-item">
                                    <div>
                                        <h3>{item.name}</h3>
                                    </div>
                                    <div className="item-price">
                                        {item.price.toLocaleString('tr-TR')} {item.currency}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="summary-total">
                            <span>Toplam:</span>
                            <strong>{getTotalPrice().toLocaleString('tr-TR')} TL</strong>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="payment-section">
                        <h2>
                            <HiCreditCard /> Ödeme Bilgileri
                        </h2>

                        {error && <div className="checkout-error">{error}</div>}

                        {user && (
                            <div className="user-info">
                                <p><strong>Ad Soyad:</strong> {user.first_name} {user.last_name}</p>
                                <p><strong>E-posta:</strong> {user.email}</p>
                            </div>
                        )}

                        <div className="test-mode-notice">
                            <p><strong>Test Modu:</strong> Lidio ödeme entegrasyonu için credentials eklendikten sonra gerçek ödeme alınacaktır. Şu an test modunda çalışıyor.</p>
                        </div>

                        <form onSubmit={handlePayment} className="payment-form">
                            <button
                                type="submit"
                                className="btn-pay"
                                disabled={loading}
                            >
                                {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla (Test)'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
