import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string;
    product_id: number;
    product_key: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('cart');
        if (!saved) return [];

        const parsed = JSON.parse(saved) as CartItem[];
        // Quantity is disabled in cart UI; keep all items as single-purchase.
        return parsed.map((item) => ({ ...item, quantity: 1 }));
    });

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Omit<CartItem, 'quantity'>) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);

            if (existingItem) {
                return prevItems;
            }

            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('cart');
    };

    const getTotalPrice = () => {
        return items.reduce((total, item) => total + item.price, 0);
    };

    const getTotalItems = () => {
        return items.length;
    };

    const value = {
        items,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getTotalItems
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
