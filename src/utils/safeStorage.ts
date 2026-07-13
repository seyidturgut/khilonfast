// Güvenli localStorage sarmalayıcı — ASLA hata fırlatmaz.
//
// NEDEN: Instagram/Facebook uygulama-içi tarayıcısı (in-app WebView) ve
// Safari Private Mode gibi ortamlarda localStorage erişimi engellenip
// SecurityError fırlatabilir. Bu erişim React'in render aşamasında (örn.
// useState lazy initializer) korumasız yapılırsa, tüm uygulama mount olmadan
// çöker → BEYAZ EKRAN. Reklamdan gelen kullanıcılar sayfayı hiç göremez.
// Bu yardımcı, storage erişilemezse sessizce null/no-op döner; uygulama
// bellek-içi çalışmaya devam eder.

export function safeGetItem(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSetItem(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        /* storage kullanılamıyor (private mode / kısıtlı WebView) — yoksay */
    }
}

export function safeRemoveItem(key: string): void {
    try {
        window.localStorage.removeItem(key);
    } catch {
        /* storage kullanılamıyor — yoksay */
    }
}
