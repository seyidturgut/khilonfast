import { useCart } from '../context/CartContext';
import { HiOutlineShoppingCart } from 'react-icons/hi2';
import './CartIcon.css';

interface CartIconProps {
    onClick: () => void;
}

export default function CartIcon({ onClick }: CartIconProps) {
    const { getTotalItems } = useCart();
    const itemCount = getTotalItems();

    return (
        <button className="cart-icon-btn" onClick={onClick} aria-label="Sepet">
            <HiOutlineShoppingCart />
            {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
            )}
        </button>
    );
}
