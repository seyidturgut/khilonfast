// GA4 e-ticaret event yardımcısı.
//
// TASARIM KURALI: Bu dosyadaki HİÇBİR fonksiyon hata fırlatmaz. Analitik kodu
// asla siteyi bozmamalı — bu projede daha önce korumasız bir üçüncü-taraf
// çağrısı (WebGL) tüm uygulamayı unmount edip BEYAZ EKRAN'a yol açtı.
// Her şey try/catch içinde, gtag yoksa sessizce no-op.
//
// NOT: `purchase` event'i BİLEREK burada YOK. Satın alma sunucu tarafından
// (Measurement Protocol) gönderiliyor — çünkü sipariş 5 farklı yerde
// 'completed' oluyor (kart callback, admin havale onayı, abonelik yenileme...)
// ve bunların çoğu tarayıcıya hiç uğramıyor. Client-side purchase hem eksik
// ölçerdi hem sayfa yenilemede çift sayardı.

type GtagFn = (...args: unknown[]) => void;

/** GA4'ün beklediği item şekli */
export interface Ga4Item {
    item_id: string;
    item_name: string;
    item_category?: string;
    price?: number;
    quantity?: number;
}

/** Sepet/ürün nesnelerinden GA4 item'a dönüşüm için gereken minimum alanlar */
export interface ProductLike {
    id?: string | number;
    product_id?: number;
    product_key?: string;
    name?: string;
    price?: number;
    currency?: string;
    quantity?: number;
    category?: string;
}

function getGtag(): GtagFn | null {
    try {
        const g = (window as unknown as { gtag?: GtagFn }).gtag;
        return typeof g === 'function' ? g : null;
    } catch {
        return null;
    }
}

/** Tek bir ürünü GA4 item formatına çevirir. */
export function toGa4Item(p: ProductLike): Ga4Item {
    const id = p.product_key || (p.product_id != null ? String(p.product_id) : '') || String(p.id ?? '');
    return {
        item_id: id || 'unknown',
        item_name: p.name || 'unknown',
        ...(p.category ? { item_category: p.category } : {}),
        ...(Number.isFinite(Number(p.price)) ? { price: Number(p.price) } : {}),
        quantity: Number(p.quantity) > 0 ? Number(p.quantity) : 1
    };
}

/** Ürün listesinin toplam değeri (GA4 `value` alanı). */
function totalValue(items: ProductLike[]): number {
    return items.reduce((sum, p) => {
        const price = Number(p.price) || 0;
        const qty = Number(p.quantity) > 0 ? Number(p.quantity) : 1;
        return sum + price * qty;
    }, 0);
}

/** Sepetteki para birimi (karışık sepet CartContext tarafından zaten engelleniyor). */
function currencyOf(items: ProductLike[], fallback = 'TRY'): string {
    return (items.find((p) => p.currency)?.currency || fallback).toUpperCase();
}

/**
 * Ham GA4 event gönderimi — asla hata fırlatmaz.
 * gtag yüklenmemişse (consent/engelleyici) sessizce hiçbir şey yapmaz.
 */
export function ga4Event(name: string, params: Record<string, unknown>): void {
    try {
        const gtag = getGtag();
        if (!gtag) return;
        gtag('event', name, params);
    } catch {
        /* analitik asla sayfayı bozmasın */
    }
}

/** Ürün/hizmet/eğitim detay sayfası görüntülendi. */
export function trackViewItem(product: ProductLike): void {
    try {
        if (!product) return;
        const item = toGa4Item(product);
        ga4Event('view_item', {
            currency: currencyOf([product]),
            value: (item.price ?? 0) * (item.quantity ?? 1),
            items: [item]
        });
    } catch { /* yut */ }
}

/** Sepete ürün eklendi. */
export function trackAddToCart(product: ProductLike): void {
    try {
        if (!product) return;
        const item = toGa4Item(product);
        ga4Event('add_to_cart', {
            currency: currencyOf([product]),
            value: (item.price ?? 0) * (item.quantity ?? 1),
            items: [item]
        });
    } catch { /* yut */ }
}

/** Sepetten ürün çıkarıldı. */
export function trackRemoveFromCart(product: ProductLike): void {
    try {
        if (!product) return;
        const item = toGa4Item(product);
        ga4Event('remove_from_cart', {
            currency: currencyOf([product]),
            value: (item.price ?? 0) * (item.quantity ?? 1),
            items: [item]
        });
    } catch { /* yut */ }
}

/** Sepet görüntülendi (drawer/sayfa açıldı). */
export function trackViewCart(items: ProductLike[]): void {
    try {
        if (!Array.isArray(items) || items.length === 0) return;
        ga4Event('view_cart', {
            currency: currencyOf(items),
            value: totalValue(items),
            items: items.map(toGa4Item)
        });
    } catch { /* yut */ }
}

/** Ödeme akışı başladı (checkout sayfası). */
export function trackBeginCheckout(items: ProductLike[], coupon?: string): void {
    try {
        if (!Array.isArray(items) || items.length === 0) return;
        ga4Event('begin_checkout', {
            currency: currencyOf(items),
            value: totalValue(items),
            ...(coupon ? { coupon } : {}),
            items: items.map(toGa4Item)
        });
    } catch { /* yut */ }
}

/**
 * GA4 client_id'yi `_ga` çerezinden okur.
 * Format: `GA1.1.<client_id>` → örn. "GA1.1.1234567890.1712345678" → "1234567890.1712345678"
 *
 * NEDEN GEREKLİ: Sunucu tarafından (Measurement Protocol) gönderilen `purchase`
 * event'inin doğru kullanıcı/oturuma ve trafik kaynağına (Meta reklamı vb.)
 * atfedilebilmesi için client_id şart. Olmadan tüm satışlar "direct" görünür
 * ve reklam ROAS'ı ölçülemez. Sipariş oluşturulurken backend'e gönderilir.
 */
export function getGa4ClientId(): string | null {
    try {
        const m = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);
        return m ? m[1] : null;
    } catch {
        return null;
    }
}
