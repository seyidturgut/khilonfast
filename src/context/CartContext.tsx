import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api, { productsAPI, paymentAPI } from '../services/api';

interface BankAccountSummary {
    id: number;
    bank_name: string;
    currency?: string;
    bank_code?: string | null;
    logo_url?: string | null;
}

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
    // USD ürün için orijinal fiyat ve kur bilgisi (display amaçlı)
    original_price?: number;
    original_currency?: string;
    usd_try_rate?: number;
}

interface CurrencyConflict {
    existingCurrency: string;
    incomingCurrency: string;
    pendingProduct: Omit<CartItem, 'quantity'>;
}

export interface ExchangeRateInfo {
    rate: number;
    source: 'manual' | 'auto';
    updated_at: string | null;
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
    exchangeRateInfo: ExchangeRateInfo | null;
    hasUsdProducts: boolean;
    enPurchaseBlocked: boolean;
    dismissEnPurchaseBlock: () => void;
    bankAccounts: BankAccountSummary[];
    isEnLocale: boolean;
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
        // SEO/reliability fix: localStorage can throw (Safari Private Mode,
        // restricted in-app browser storage sandboxes) and a corrupted/legacy
        // 'cart' value can fail JSON.parse — either would crash the whole app
        // during React's render phase with no boundary to catch it (blank page).
        try {
            const saved = localStorage.getItem('cart');
            if (!saved) return [];
            const parsed = JSON.parse(saved) as CartItem[];
            return parsed.map((item) => ({ ...item, quantity: 1 }));
        } catch {
            return [];
        }
    });

    const [currencyConflict, setCurrencyConflict] = useState<CurrencyConflict | null>(null);
    const [exchangeRateInfo, setExchangeRateInfo] = useState<ExchangeRateInfo | null>(null);
    const [enPurchaseBlocked, setEnPurchaseBlocked] = useState<boolean>(false);
    const [bankAccounts, setBankAccounts] = useState<BankAccountSummary[]>([]);
    const hasUsdProducts = items.some(i => (i.original_currency || '').toUpperCase() === 'USD');

    const location = useLocation();
    const isEnLocale = location.pathname === '/en' || location.pathname.startsWith('/en/');
    const dismissEnPurchaseBlock = () => setEnPurchaseBlocked(false);

    // Mount'ta TCMB kuru çek
    useEffect(() => {
        let cancelled = false;
        api.get('/exchange-rate').then((res) => {
            if (cancelled) return;
            const data = res.data || {};
            if (Number.isFinite(Number(data.rate)) && Number(data.rate) > 0) {
                setExchangeRateInfo({
                    rate: Number(data.rate),
                    source: data.source || 'manual',
                    updated_at: data.updated_at || null
                });
            }
        }).catch(() => { /* sessiz — refreshPrices() yine de denyecek */ });

        // EN locale'de USD bank account var mı? Yoksa addToCart bloklanır.
        if (isEnLocale) {
            paymentAPI.getManualBankAccounts('USD').then((res) => {
                if (cancelled) return;
                const accounts = Array.isArray(res.data?.accounts) ? res.data.accounts : [];
                setBankAccounts(accounts);
            }).catch(() => { /* boş kalır */ });
        }

        return () => { cancelled = true; };
    }, [isEnLocale]);

    useEffect(() => {
        try {
            localStorage.setItem('cart', JSON.stringify(items));
        } catch {
            // Storage unavailable/full (private mode, restricted in-app browser) — cart still works in-memory.
        }
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

            // En son kullanılan kuru sepet UI'ında göstermek için yakala (USD ürün varsa)
            const usdProduct = all.find((p: any) => p.currency === 'USD' && p.usd_try_rate);
            if (usdProduct) {
                setExchangeRateInfo({
                    rate: Number(usdProduct.usd_try_rate),
                    source: 'auto',
                    updated_at: null
                });
            }

            setItems(prev => {
                const next: CartItem[] = [];
                let changed = false;
                for (const item of prev) {
                    // Danışmanlık hizmeti products tablosunda değil — yeniden çözümleme,
                    // addToCart'tan gelen isim/fiyatı koru (aksi halde yanlış ürüne denk gelir).
                    if ((item.product_key || '').startsWith('consultant-service-')) {
                        next.push(item);
                        continue;
                    }
                    const fresh: any = byKey.get(item.product_key) || byId.get(String(item.product_id));
                    if (!fresh || fresh.is_active === 0 || fresh.is_active === false) {
                        // Ürün silinmiş veya pasifleştirilmiş → sepetten düş
                        changed = true;
                        continue;
                    }

                    // Locale'a göre fiyat normalizasyonu:
                    //   TR → her ürün TRY (USD ürün display_price_try ile çevrilir)
                    //   EN → her ürün USD (TRY ürün display_price_usd ile çevrilir)
                    let newPrice: number;
                    let newCurrency: string;
                    let originalPrice: number | undefined;
                    let originalCurrency: string | undefined;
                    let usdTryRate: number | undefined;

                    if (isEnLocale) {
                        if (fresh.currency === 'TRY' && Number.isFinite(Number(fresh.display_price_usd))) {
                            newPrice = Number(fresh.display_price_usd);
                            newCurrency = 'USD';
                            originalPrice = Number(fresh.price);
                            originalCurrency = 'TRY';
                            usdTryRate = Number(fresh.usd_try_rate);
                        } else {
                            newPrice = Number(fresh.price);
                            newCurrency = String(fresh.currency || item.currency);
                        }
                    } else if (fresh.currency === 'USD' && Number.isFinite(Number(fresh.display_price_try))) {
                        newPrice = Number(fresh.display_price_try);
                        newCurrency = 'TRY';
                        originalPrice = Number(fresh.price);
                        originalCurrency = 'USD';
                        usdTryRate = Number(fresh.usd_try_rate);
                    } else {
                        newPrice = Number(fresh.price);
                        newCurrency = String(fresh.currency || item.currency);
                    }

                    const priceChanged = Number.isFinite(newPrice) && (
                        newPrice !== item.price ||
                        newCurrency !== item.currency ||
                        fresh.name !== item.name ||
                        originalCurrency !== item.original_currency ||
                        originalPrice !== item.original_price
                    );
                    if (priceChanged) {
                        changed = true;
                        next.push({
                            ...item,
                            price: newPrice,
                            currency: newCurrency,
                            name: fresh.name || item.name,
                            description: fresh.description || item.description,
                            original_price: originalPrice,
                            original_currency: originalCurrency,
                            usd_try_rate: usdTryRate
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
    }, [items, isEnLocale]);

    // Sayfa yüklendiğinde bir kez senkronla (kullanıcı dün sepete ekleyip bugün açtıysa fiyat güncellensin)
    useEffect(() => {
        refreshPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addToCart = (product: Omit<CartItem, 'quantity'>): boolean => {
        // EN locale + USD banka hesabı YOK ise blok modal göster.
        // Admin USD birimli bank ekleyince EN'de havale ile ödeme otomatik açılır.
        if (isEnLocale && bankAccounts.length === 0) {
            setEnPurchaseBlocked(true);
            return false;
        }

        // EN locale'de USD fiyatı korunur (TL'ye çevirme yok). TR'de eski davranış.
        if (isEnLocale) {
            setItems(prevItems => {
                if (prevItems.find(item => item.id === product.id)) return prevItems;
                return [...prevItems, { ...product, quantity: 1 }];
            });
            setTimeout(() => { refreshPrices().catch(() => {}); }, 0);
            return true;
        }

        // USD ürünü, mount'ta yüklenmiş kurla SYNCHRONOUS olarak TL'ye çevir.
        // Böylece sepet açıldığında ilk anda zaten TL görünür (refresh beklemeye gerek yok).
        let normalizedProduct = product;
        if ((product.currency || '').toUpperCase() === 'USD' && exchangeRateInfo?.rate) {
            const rate = Number(exchangeRateInfo.rate);
            normalizedProduct = {
                ...product,
                price: Math.round(product.price * rate * 100) / 100,
                currency: 'TRY',
                original_price: product.price,
                original_currency: 'USD',
                usd_try_rate: rate
            };
        }

        const existingCurrency = items[0]?.currency;
        if (existingCurrency && normalizedProduct.currency !== existingCurrency) {
            setCurrencyConflict({
                existingCurrency,
                incomingCurrency: normalizedProduct.currency,
                pendingProduct: normalizedProduct,
            });
            return false;
        }

        setItems(prevItems => {
            if (prevItems.find(item => item.id === normalizedProduct.id)) return prevItems;
            return [...prevItems, { ...normalizedProduct, quantity: 1 }];
        });

        // Backend'de fiyat güncellendiyse veya yeni kur varsa arkada senkronla
        setTimeout(() => { refreshPrices().catch(() => {}); }, 0);
        return true;
    };

    const resolveCurrencyConflict = (replace: boolean) => {
        if (!currencyConflict) return;
        if (replace) {
            const { pendingProduct } = currencyConflict;
            try { localStorage.removeItem('cart'); } catch { /* storage unavailable */ }
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
        exchangeRateInfo,
        hasUsdProducts,
        enPurchaseBlocked,
        dismissEnPurchaseBlock,
        bankAccounts,
        isEnLocale,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
            {enPurchaseBlocked && <EnPurchaseBlockedModal onClose={dismissEnPurchaseBlock} />}
        </CartContext.Provider>
    );
};

// EN locale satın alma kapalı modal — basit, bağımsız, dış dependency yok
function EnPurchaseBlockedModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 14, maxWidth: 460, width: '100%',
                    padding: '32px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    textAlign: 'center'
                }}
            >
                <div style={{
                    width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
                    background: '#fef3c7', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 28
                }}>
                    🔒
                </div>
                <h2 style={{ margin: '0 0 12px', fontSize: '1.3rem', color: '#102a43', fontWeight: 700 }}>
                    Online Payment Unavailable
                </h2>
                <p style={{ margin: '0 0 22px', color: '#475569', fontSize: '0.95rem', lineHeight: 1.55 }}>
                    Online payment is being set up for international purchases.
                    Please contact us at <a href="mailto:info@khilonfast.com" style={{ color: '#1a3a52', fontWeight: 600 }}>info@khilonfast.com</a> to complete your order.
                </p>
                <button
                    onClick={onClose}
                    style={{
                        background: 'linear-gradient(90deg,#1a3a52,#89b004)', color: '#fff',
                        border: 'none', padding: '11px 28px', borderRadius: 8,
                        fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
}
