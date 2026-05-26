/**
 * Ürün sayfasında gösterilecek (price, currency) çiftini locale'a göre döndürür.
 *
 * Kurallar:
 * - TR + TRY ürün → TRY (native)
 * - TR + USD ürün → USD (native — sayfada $ kalır, TRY'a çevirme YALNIZCA sepete eklendiğinde olur)
 * - EN + USD ürün → USD (native)
 * - EN + TRY ürün → USD (display_price_usd ile çevrilmiş)
 */
export function pickLocalizedPriceAndCurrency(
    product: { price?: number | string; currency?: string; display_price_try?: number; display_price_usd?: number },
    locale: 'tr' | 'en'
): { price: number; currency: string } {
    const native = Number(product.price ?? 0);
    const nativeCurrency = (product.currency || 'TRY').toUpperCase();

    // EN locale'de TRY ürün → USD'ye çevirilmiş display
    if (locale === 'en' && nativeCurrency === 'TRY' && Number.isFinite(Number(product.display_price_usd)) && Number(product.display_price_usd) > 0) {
        return { price: Number(product.display_price_usd), currency: 'USD' };
    }

    // Diğer durumlarda native fiyat — USD ürünler her dilde $ olarak gözükür
    return { price: native, currency: nativeCurrency };
}

/**
 * Lokal formatla fiyat string'i üretir. Currency ve locale uyumlu Intl.NumberFormat kullanır.
 */
export function formatLocalizedPrice(price: number, currency: string, locale: 'tr' | 'en'): string {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        style: 'currency',
        currency: currency || 'TRY',
        maximumFractionDigits: 0
    }).format(Number.isFinite(price) ? price : 0);
}

export function parseLocalizedPrice(input: string): number {
    const cleaned = String(input || '')
        .replace(/[^\d.,-]/g, '')
        .trim();

    if (!cleaned) return 0;

    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');
        const decimalSep = lastComma > lastDot ? ',' : '.';
        const thousandSep = decimalSep === ',' ? '.' : ',';
        const normalized = cleaned
            .split(thousandSep).join('')
            .replace(decimalSep, '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    if (hasComma || hasDot) {
        const sep = hasComma ? ',' : '.';
        const parts = cleaned.split(sep);
        const last = parts[parts.length - 1] || '';

        // Prices on cards are mostly integers with thousand separators.
        if (parts.length > 1 && last.length === 3) {
            const parsed = Number(parts.join(''));
            return Number.isFinite(parsed) ? parsed : 0;
        }

        const normalized = `${parts.slice(0, -1).join('')}.${last}`;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}
