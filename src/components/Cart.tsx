import { useCart } from '../context/CartContext';
import { HiX, HiShoppingCart, HiTrash } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Cart.css';

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
    const { t, i18n } = useTranslation('common');
    const { items, removeFromCart, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const currentLang = i18n.language.split('-')[0];
    const langPrefix = currentLang === 'en' ? '/en' : '';
    const checkoutPath = `${langPrefix}/${t('slugs.checkout')}`.replace(/\/{2,}/g, '/');

    const handleCheckout = () => {
        onClose();
        navigate(checkoutPath);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="cart-overlay" onClick={onClose}></div>
            <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2>
                        <HiShoppingCart /> {currentLang === 'en' ? 'My Cart' : 'Sepetim'}
                    </h2>
                    <button className="cart-close" onClick={onClose}>
                        <HiX />
                    </button>
                </div>

                <div className="cart-body">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <HiShoppingCart className="empty-icon" />
                            <p>{currentLang === 'en' ? 'Your cart is empty' : 'Sepetiniz boş'}</p>
                        </div>
                    ) : (
                        <>
                            {items.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-info">
                                        <h3>{item.name}</h3>
                                        <p className="cart-item-price">
                                            {item.price.toLocaleString(currentLang === 'en' ? 'en-US' : 'tr-TR')} {item.currency}
                                        </p>
                                    </div>
                                    <div className="cart-item-actions">
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFromCart(item.id)}
                                            title={currentLang === 'en' ? 'Remove from cart' : 'Sepetten Kaldır'}
                                        >
                                            <HiTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span>{currentLang === 'en' ? 'Total:' : 'Toplam:'}</span>
                            <strong>{getTotalPrice().toLocaleString(currentLang === 'en' ? 'en-US' : 'tr-TR')} TL</strong>
                        </div>
                        <button className="btn-checkout" onClick={handleCheckout}>
                            {currentLang === 'en' ? 'Proceed to Checkout' : 'Ödemeye Geç'}
                        </button>
                        <button className="btn-clear" onClick={clearCart}>
                            {currentLang === 'en' ? 'Clear Cart' : 'Sepeti Temizle'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
