import { useLocation, useNavigate } from 'react-router-dom';
import { HiCheckCircle } from 'react-icons/hi';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const orderNumber = location.state?.orderNumber || 'N/A';

    return (
        <div className="payment-result-page">
            <div className="result-container">
                <div className="result-card success">
                    <HiCheckCircle className="result-icon" />
                    <h1>Ödeme Başarılı!</h1>
                    <p>Siparişiniz başarıyla alındı.</p>
                    <div className="order-details">
                        <p><strong>Sipariş No:</strong> {orderNumber}</p>
                    </div>
                    <button className="btn-home" onClick={() => navigate('/')}>
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        </div>
    );
}
