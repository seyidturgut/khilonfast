import { useCart } from '../context/CartContext';
import { HiX, HiShoppingCart, HiTrash } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
    const { items, removeFromCart, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="cart-overlay" onClick={onClose}></div>
            <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2>
                        <HiShoppingCart /> Sepetim
                    </h2>
                    <button className="cart-close" onClick={onClose}>
                        <HiX />
                    </button>
                </div>

                <div className="cart-body">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <HiShoppingCart className="empty-icon" />
                            <p>Sepetiniz boş</p>
                        </div>
                    ) : (
                        <>
                            {items.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-info">
                                        <h3>{item.name}</h3>
                                        <p className="cart-item-price">
                                            {item.price.toLocaleString('tr-TR')} {item.currency}
                                        </p>
                                    </div>
                                    <div className="cart-item-actions">
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFromCart(item.id)}
                                            title="Sepetten Kaldır"
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
                            <span>Toplam:</span>
                            <strong>{getTotalPrice().toLocaleString('tr-TR')} TL</strong>
                        </div>
                        <button className="btn-checkout" onClick={handleCheckout}>
                            Ödemeye Geç
                        </button>
                        <button className="btn-clear" onClick={clearCart}>
                            Sepeti Temizle
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
