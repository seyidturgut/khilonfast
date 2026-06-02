// USD/TRY kur servisi.
// - Birincil kaynak: TCMB (Türkiye Cumhuriyeti Merkez Bankası) günlük XML feed.
//   USD ForexSelling değeri kullanılır (resmi efektif satış kuru).
// - Manuel rate settings'te (`usd_try_rate`) tutulur, `usd_try_rate_auto_update=true` ise
//   24 saatten eski olduğunda TCMB'den otomatik tazelenir.
// - API erişilemezse mevcut manuel değer kullanılmaya devam eder.
// - Order oluşturulurken o anki rate "lock" edilir (orders.usd_try_rate_used).

import db from '../config/database.js';

// TCMB günlük XML — hafta sonu/tatil de eski iş günü değeri döner
const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 saat

let inMemoryCache = null; // { rate, source, updatedAt, fetchedAt }

async function readSettings() {
    const [rows] = await db.query(
        `SELECT setting_key, setting_value FROM settings
         WHERE setting_key IN ('usd_try_rate','usd_try_rate_updated_at','usd_try_rate_source','usd_try_rate_auto_update')`
    );
    const map = {};
    rows.forEach((r) => { map[r.setting_key] = r.setting_value; });
    return map;
}

async function writeRate(rate, source) {
    // settings tablosu setting_group NOT NULL → 'currency' grubu kullanılır
    const now = new Date().toISOString();
    const upsert = `INSERT INTO settings (setting_key, setting_value, setting_group)
                    VALUES (?, ?, 'currency')
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`;
    await db.query(upsert, ['usd_try_rate', String(Number(rate).toFixed(4))]);
    await db.query(upsert, ['usd_try_rate_updated_at', now]);
    await db.query(upsert, ['usd_try_rate_source', source]);
}

async function fetchFromTcmb() {
    const res = await fetch(TCMB_URL, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'khilonfast/1.0' }
    });
    if (!res.ok) throw new Error(`TCMB ${res.status}`);
    const xml = await res.text();
    // <Currency Kod="USD"...><ForexSelling>X</ForexSelling></Currency> bloğunu yakala
    const usdBlock = xml.match(/<Currency[^>]*Kod="USD"[^>]*>([\s\S]*?)<\/Currency>/);
    if (!usdBlock) throw new Error('TCMB USD block not found');
    const sell = usdBlock[1].match(/<ForexSelling>\s*([\d.]+)\s*<\/ForexSelling>/);
    if (!sell) throw new Error('TCMB ForexSelling not found');
    const rate = Number(sell[1]);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('TCMB rate invalid');
    return rate;
}

/**
 * Geçerli USD/TRY oranını döndürür.
 * 24 saatten eski + auto_update aktif ise Frankfurter'dan tazeler.
 * forceRefresh=true ise her durumda fetch eder.
 */
export async function getCurrentUsdTryRate({ forceRefresh = false } = {}) {
    const now = Date.now();

    // In-memory cache (aynı request içindeki tekrar çağrılarda DB'ye gitme)
    if (!forceRefresh && inMemoryCache && (now - inMemoryCache.fetchedAt) < 60_000) {
        return inMemoryCache;
    }

    const settings = await readSettings();
    const manualRate = Number(settings.usd_try_rate || 0);
    const updatedAt = settings.usd_try_rate_updated_at ? new Date(settings.usd_try_rate_updated_at).getTime() : 0;
    const autoUpdate = String(settings.usd_try_rate_auto_update || 'true').toLowerCase() === 'true';
    const isStale = !updatedAt || (now - updatedAt) > STALE_AFTER_MS;

    let rate = manualRate > 0 ? manualRate : 40; // emergency fallback
    let source = settings.usd_try_rate_source || 'manual';
    let updatedAtIso = settings.usd_try_rate_updated_at || null;

    if (forceRefresh || (autoUpdate && isStale)) {
        try {
            const fetched = await fetchFromTcmb();
            await writeRate(fetched, 'auto');
            rate = fetched;
            source = 'auto';
            updatedAtIso = new Date().toISOString();
        } catch (err) {
            console.warn('[currency] TCMB fetch failed, using manual rate:', err.message);
        }
    }

    inMemoryCache = { rate, source, updatedAt: updatedAtIso, fetchedAt: now };
    return inMemoryCache;
}

/**
 * USD tutarı TRY'a çevirir. Ürün currency='USD' ise display_price hesaplamak için.
 */
export async function convertUsdToTry(amount) {
    const { rate } = await getCurrentUsdTryRate();
    return Number((Number(amount) * rate).toFixed(2));
}

/**
 * USD ürünlere ek bir TRY display alanı ekler — orijinal `price`/`currency` DEĞİŞTİRİLMEZ.
 *   - Ürün sayfası: USD görüntülenir ($)
 *   - Sepet/checkout: `display_price_try` kullanılarak TL gösterimi yapılır
 * Ürün TRY ise olduğu gibi döndürülür.
 */
export async function normalizeProductToTry(product) {
    if (!product || product.currency !== 'USD') return product;
    const { rate } = await getCurrentUsdTryRate();
    return {
        ...product,
        // price ve currency olduğu gibi kalır (USD)
        display_price_try: Number((Number(product.price) * rate).toFixed(2)),
        display_currency_try: 'TRY',
        usd_try_rate: rate
    };
}

/**
 * TRY ürünlere ek bir USD display alanı ekler (EN locale için).
 * Orijinal price/currency DEĞİŞTİRİLMEZ. Checkout'ta TRY ile Lidio'ya gider.
 */
export async function normalizeProductToUsd(product) {
    if (!product || product.currency !== 'TRY') return product;
    // Manuel sabit USD fiyatı: DB'de display_price_usd > 0 ise otomatik kur yerine onu kullan.
    // (örn. eğitim ürünleri için sabit $149 — admin/migration ile set edilir)
    if (product.display_price_usd != null && Number(product.display_price_usd) > 0) {
        return {
            ...product,
            display_price_usd: Number(Number(product.display_price_usd).toFixed(2)),
            display_currency_usd: 'USD'
        };
    }
    const { rate } = await getCurrentUsdTryRate();
    if (!Number.isFinite(rate) || rate <= 0) return product;
    return {
        ...product,
        display_price_usd: Number((Number(product.price) / rate).toFixed(2)),
        display_currency_usd: 'USD',
        usd_try_rate: rate
    };
}

/**
 * Hem TRY hem USD display alanlarını tek seferde ekler.
 */
export async function normalizeProductBothCurrencies(product) {
    return normalizeProductToUsd(await normalizeProductToTry(product));
}

/**
 * Manuel rate set eder (admin panelden).
 */
export async function setManualRate(rate) {
    if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error('Geçersiz oran');
    }
    await writeRate(rate, 'manual');
    inMemoryCache = null; // invalidate
    return getCurrentUsdTryRate();
}

export async function setAutoUpdate(enabled) {
    await db.query(
        `INSERT INTO settings (setting_key, setting_value, setting_group)
         VALUES (?, ?, 'currency')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        ['usd_try_rate_auto_update', enabled ? 'true' : 'false']
    );
    inMemoryCache = null;
}

export default {
    getCurrentUsdTryRate,
    convertUsdToTry,
    normalizeProductToTry,
    setManualRate,
    setAutoUpdate
};
