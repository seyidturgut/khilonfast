import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { productsAPI } from '../services/api';

export interface CartItem {
    id: string;
    product_id: number;
    product_key: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    quantity: number;
    duration_days?: number;
    category?: string;
}

interface CurrencyConflict {
    existingCurrency: string;
    incomingCurrency: string;
    pendingProduct: Omit<CartItem, 'quantity'>;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Omit<CartItem, 'quantity'>) => boolean;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
    refreshPrices: () => Promise<void>;
    currencyConflict: CurrencyConflict | null;
    resolveCurrencyConflict: (replace: boolean) => void;
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
        return parsed.map((item) => ({ ...item, quantity: 1 }));
    });

    const [currencyConflict, setCurrencyConflict] = useState<CurrencyConflict | null>(null);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    /**
     * Sepetteki ürünlerin fiyatlarını backend'den taze çek ve güncelle.
     * Kullanıcı sepetini açtığında / checkout'a girdiğinde admin tarafından
     * güncellenmiş yeni fiyatların görünmesi için.
     * Aynı zamanda artık aktif olmayan / silinmiş ürünleri sepetten temizler.
     */
    const refreshPrices = useCallback(async () => {
        if (!items.length) return;
        try {
            const res = await productsAPI.getAll();
            const all = Array.isArray(res.data?.products) ? res.data.products : (Array.isArray(res.data) ? res.data : []);
            const byKey = new Map(all.map((p: any) => [p.product_key, p]));
            const byId = new Map(all.map((p: any) => [String(p.id), p]));

            setItems(prev => {
                const next: CartItem[] = [];
                let changed = false;
                for (const item of prev) {
                    const fresh: any = byKey.get(item.product_key) || byId.get(String(item.product_id));
                    if (!fresh || fresh.is_active === 0 || fresh.is_active === false) {
                        // Ürün silinmiş veya pasifleştirilmiş → sepetten düş
                        changed = true;
                        continue;
                    }
                    const newPrice = Number(fresh.price);
                    const newCurrency = String(fresh.currency || item.currency);
                    if (Number.isFinite(newPrice) && (newPrice !== item.price || newCurrency !== item.currency || fresh.name !== item.name)) {
                        changed = true;
                        next.push({
                            ...item,
                            price: newPrice,
                            currency: newCurrency,
                            name: fresh.name || item.name,
                            description: fresh.description || item.description
                        });
                    } else {
                        next.push(item);
                    }
                }
                return changed ? next : prev;
            });
        } catch (err) {
            // Sessiz başarısızlık — eski fiyat kalır, kullanıcı engellenmesin
            console.warn('Cart refreshPrices failed:', err);
        }
    }, [items]);

    // Sayfa yüklendiğinde bir kez senkronla (kullanıcı dün sepete ekleyip bugün açtıysa fiyat güncellensin)
    useEffect(() => {
        refreshPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addToCart = (product: Omit<CartItem, 'quantity'>): boolean => {
        const existingCurrency = items[0]?.currency;
        if (existingCurrency && product.currency !== existingCurrency) {
            setCurrencyConflict({
                existingCurrency,
                incomingCurrency: product.currency,
                pendingProduct: product,
            });
            return false;
        }

        setItems(prevItems => {
            if (prevItems.find(item => item.id === product.id)) return prevItems;
            return [...prevItems, { ...product, quantity: 1 }];
        });
        return true;
    };

    const resolveCurrencyConflict = (replace: boolean) => {
        if (!currencyConflict) return;
        if (replace) {
            const { pendingProduct } = currencyConflict;
            localStorage.removeItem('cart');
            setItems([{ ...pendingProduct, quantity: 1 }]);
        }
        setCurrencyConflict(null);
    };

    const removeFromCart = (productId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('cart');
    };

    const getTotalPrice = () => items.reduce((total, item) => total + item.price, 0);
    const getTotalItems = () => items.length;

    const value = {
        items,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getTotalItems,
        refreshPrices,
        currencyConflict,
        resolveCurrencyConflict,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
