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
    const { items, removeFromCart, getTotalPrice, clearCart, hasUsdProducts, exchangeRateInfo } = useCart();
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
                                            {item.original_currency === 'USD' && item.original_price !== undefined && (
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                                                    {currentLang === 'en' ? 'Original:' : 'Orijinal:'} ${item.original_price.toLocaleString('en-US')}
                                                </span>
                                            )}
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

                {items.length > 0 && (() => {
                    const subtotal = getTotalPrice();
                    const vatRate = 0.20;
                    const vatAmount = subtotal * vatRate;
                    const grandTotal = subtotal + vatAmount;
                    const cur = items.every(i => i.currency === items[0].currency) ? items[0].currency : 'TL';
                    return (
                    <div className="cart-footer">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', padding: '4px 0' }}>
                            <span>{currentLang === 'en' ? 'Subtotal (excl. VAT)' : 'Ara toplam (KDV hariç)'}</span>
                            <span>{formatPrice(subtotal, cur)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', padding: '4px 0' }}>
                            <span>{currentLang === 'en' ? 'VAT (20%)' : 'KDV (%20)'}</span>
                            <span>{formatPrice(vatAmount, cur)}</span>
                        </div>
                        <div className="cart-total" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
                            <span>{currentLang === 'en' ? 'Total:' : 'Toplam:'}</span>
                            <strong>
                                {formatPrice(grandTotal, cur)}
                            </strong>
                        </div>
                        {hasUsdProducts && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentLang === 'en' ? 'Rate:' : 'Kur:'}
                                {exchangeRateInfo?.rate ? ` 1 USD = ${Number(exchangeRateInfo.rate).toFixed(4)} TL · ` : ' '}
                                <a
                                    href="https://www.tcmb.gov.tr/kurlar/today.xml"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={currentLang === 'en' ? 'Central Bank of Turkey — daily official rate' : 'Türkiye Cumhuriyet Merkez Bankası — resmi günlük kur'}
                                    style={{ color: '#64748b', textDecoration: 'underline' }}
                                >
                                    TCMB
                                </a>
                            </div>
                        )}
                        <button className="btn-checkout" onClick={handleCheckout}>
                            {currentLang === 'en' ? 'Proceed to Checkout' : 'Ödemeye Geç'}
                        </button>
                        <button className="btn-clear" onClick={clearCart}>
                            {currentLang === 'en' ? 'Clear Cart' : 'Sepeti Temizle'}
                        </button>
                    </div>
                    );
                })()}
            </div>
        </>
    );
}
