import { useCart } from '../context/CartContext';
import { HiX, HiShoppingCart, HiTrash } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Cart.css';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
    useTranslation('common');
    const { items, removeFromCart, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const currentLang = useRouteLocale();
    const checkoutPath = getLocalizedPathByKey(currentLang, 'checkout');

    const handleCheckout = () => {
        onClose();
        navigate(checkoutPath);
    };

    const formatPrice = (amount: number, currency: string) => {
        return (
            <>
                {Number(amount).toLocaleString(currentLang === 'en' ? 'en-US' : 'tr-TR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                })} <span className="price-unit">{currency}</span>
            </>
        );
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
                                            {formatPrice(item.price, item.currency)}
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
                            <strong>
                                {formatPrice(getTotalPrice(), items.length > 0 && items.every(i => i.currency === items[0].currency) ? items[0].currency : 'TL')}
                            </strong>
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
