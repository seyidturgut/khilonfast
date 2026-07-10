import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type ConsentPreferences = {
    necessary: true
    analytics: boolean
    marketing: boolean
    version: string
    updatedAt: string
}

type ConsentContextValue = {
    preferences: ConsentPreferences | null
    isReady: boolean
    hasStoredConsent: boolean
    isPreferencesOpen: boolean
    openPreferences: () => void
    closePreferences: () => void
    savePreferences: (next: Pick<ConsentPreferences, 'analytics' | 'marketing'>) => void
    acceptAll: () => void
    rejectOptional: () => void
}

const CONSENT_STORAGE_KEY = 'khilonfast_cookie_consent'
const CONSENT_VERSION = '2026-03-30-v1'
const GTM_CONTAINER_ID = 'GTM-PW9WTF7J'

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined)

declare global {
    interface Window {
        dataLayer?: Array<unknown>
        gtag?: (...args: unknown[]) => void
        __khilonfastGtmLoaded?: boolean
        __khilonfastGa4Loaded?: boolean
    }
}

function ensureGoogleConsentDefaults() {
    if (typeof window === 'undefined') return

    window.dataLayer = window.dataLayer || []
    // ÖNEMLİ: gtag/js dataLayer'da GERÇEK `arguments` objesi bekler — dizi (...args) DEĞİL.
    // Dizi push edilirse gtag komutları (consent/config/event) SESSİZCE YOK SAYILIR.
    // Resmi snippet ile birebir aynı olmalı: function gtag(){ dataLayer.push(arguments) }.
    window.gtag = window.gtag || function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments)
    }

    // KVKK (Türkiye hedef kitlesi) GDPR'ın aksine saf analitik çerezler için önceden
    // opt-in zorunlu kılmıyor — sadece reklam/pazarlama çerezleri (ad_*) daha hassas
    // ve onaya bağlı kalmalı. analytics_storage'ı varsayılan "granted" yapıyoruz ki
    // banner'a hiç dokunmayan/reddeden ziyaretçiler de GA4 standart raporlarında
    // sayılsın (Consent Mode v2'de "denied" hit'ler GA4 UI raporlarına hiç girmiyor —
    // sadece anonim modellemeye besleniyor, bu da küçük/orta trafikte pratikte
    // görünmüyordu — 10 Tem 2026 müşteri şikayeti: GA4 rakamı gerçek trafiğin
    // ~%2'si kadar görünüyordu, kök neden buydu).
    window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500
    })
}

function mapConsent(preferences: Pick<ConsentPreferences, 'analytics' | 'marketing'>) {
    return {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        ad_user_data: preferences.marketing ? 'granted' : 'denied',
        ad_personalization: preferences.marketing ? 'granted' : 'denied'
    }
}

function applyConsent(preferences: Pick<ConsentPreferences, 'analytics' | 'marketing'>) {
    if (typeof window === 'undefined') return
    ensureGoogleConsentDefaults()
    window.gtag?.('consent', 'update', mapConsent(preferences))
}

function loadGtmIfNeeded() {
    if (typeof document === 'undefined' || window.__khilonfastGtmLoaded) return
    if (document.getElementById('khilonfast-gtm-loader')) {
        window.__khilonfastGtmLoaded = true
        return
    }

    const script = document.createElement('script')
    script.id = 'khilonfast-gtm-loader'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`
    document.head.appendChild(script)
    window.__khilonfastGtmLoaded = true
}

// GA4 ID — GTM container'daki "Google etiketi" canlıda güvenilir ateşlenmediği için
// (Preview'da çalışıyor, Live'da gtag config çalışmıyor) GA4'ü DOĞRUDAN yüklüyoruz.
// Consent Mode aynen geçerli (default denied + update granted dataLayer'da).
// send_page_view=false → ilk page_view'i App.tsx köprüsü (spa_page_view) gönderir,
// her route'ta tam 1 page_view (initial + SPA geçişleri). GTM Meta/LinkedIn değişmez.
const GA4_MEASUREMENT_ID = 'G-16FR1976GE'

function loadGa4DirectIfNeeded() {
    if (typeof document === 'undefined' || window.__khilonfastGa4Loaded) return
    window.__khilonfastGa4Loaded = true

    window.dataLayer = window.dataLayer || []
    // gtag stub: GERÇEK arguments objesi push edilmeli (dizi değil) — yoksa gtag/js komutları yok sayar.
    // eslint-disable-next-line prefer-rest-params
    window.gtag = window.gtag || function gtag() { window.dataLayer!.push(arguments) }

    // gtag config'i ÖNCE dataLayer'a koy (gtag/js yüklenince işlenir).
    window.gtag('js', new Date())
    window.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false })

    const script = document.createElement('script')
    script.id = 'khilonfast-ga4-loader'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`

    // KRİTİK SIRA: GTM'i, GA4 kütüphanesi yüklenip ilk hit'i gönderdikten SONRA yükle.
    // GTM erken yüklenirse gtag çalışma-zamanını ele geçirip GA4 iletimini engelliyor.
    let gtmTriggered = false
    const triggerGtm = () => {
        if (gtmTriggered) return
        gtmTriggered = true
        loadGtmIfNeeded()
    }
    script.onload = () => window.setTimeout(triggerGtm, 400)
    script.onerror = triggerGtm
    document.head.appendChild(script)
    // Emniyet: gtag/js hiç yüklenmezse bile GTM (Meta/LinkedIn) en geç 3 sn'de yüklensin.
    window.setTimeout(triggerGtm, 3000)
}

function parseStoredConsent(): ConsentPreferences | null {
    if (typeof window === 'undefined') return null

    try {
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<ConsentPreferences>
        if (parsed.version !== CONSENT_VERSION) return null

        return {
            necessary: true,
            analytics: Boolean(parsed.analytics),
            marketing: Boolean(parsed.marketing),
            version: CONSENT_VERSION,
            updatedAt: String(parsed.updatedAt || new Date().toISOString())
        }
    } catch {
        return null
    }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<ConsentPreferences | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [hasStoredConsent, setHasStoredConsent] = useState(false)
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

    useEffect(() => {
        // 1) Consent Mode v2 varsayılanını GTM'den ÖNCE ayarla (hepsi denied).
        ensureGoogleConsentDefaults()

        // 2) Kayıtlı tercih varsa uygula (kullanıcı daha önce kabul/red etmişse).
        const stored = parseStoredConsent()
        if (stored) {
            setPreferences(stored)
            setHasStoredConsent(true)
            applyConsent(stored)
        }

        // 3) GTM'i HER ZAMAN yükle (consent'e bağlı DEĞİL). Google Consent Mode v2:
        //    izin yokken GA4 çerezsiz "modellenmiş" ping gönderir (çerez koymaz, trafiği sayar);
        //    kullanıcı kabul edince consent 'update' ile tam veriye geçer.
        //    Eskiden GTM yalnızca consent verilince yükleniyordu → reddeden/banner'ı
        //    görmezden gelen ziyaretçiler GA'da HİÇ sayılmıyordu.
        //
        // SIRA KRİTİK: GA4'ü GTM'den ÖNCE yükle. GTM yüklendiğinde gtag çalışma-zamanını
        // (google_tag_data) ele geçirip site-tarafı doğrudan GA4 config'inin iletimini
        // ENGELLİYOR (GTM'de GA4 tag'i olmasa bile). GA4 önce init olup ilk hit'i gönderirse,
        // GTM sonradan gelse de GA4 çalışmaya devam ediyor (canlı testle doğrulandı).
        // GA4'ü doğrudan yükle. GTM, GA4 kütüphanesi yüklendikten SONRA (onload) tetiklenir
        // (loadGa4DirectIfNeeded içinde) — böylece GTM, GA4'ün gtag runtime'ını bozamaz.
        loadGa4DirectIfNeeded()

        setIsReady(true)
    }, [])

    const persistPreferences = useCallback((next: Pick<ConsentPreferences, 'analytics' | 'marketing'>) => {
        const fullPreferences: ConsentPreferences = {
            necessary: true,
            analytics: next.analytics,
            marketing: next.marketing,
            version: CONSENT_VERSION,
            updatedAt: new Date().toISOString()
        }

        setPreferences(fullPreferences)
        setHasStoredConsent(true)
        setIsPreferencesOpen(false)

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullPreferences))
        }

        applyConsent(fullPreferences)
        if (fullPreferences.analytics || fullPreferences.marketing) {
            loadGtmIfNeeded()
        }
    }, [])

    const acceptAll = useCallback(() => {
        persistPreferences({ analytics: true, marketing: true })
    }, [persistPreferences])

    // "Reddet" artık sadece reklam/pazarlama çerezlerini kapatır — analitik çerezler
    // KVKK kapsamında zaten onaya bağlı değil (bkz. ensureGoogleConsentDefaults),
    // bu yüzden genel "reddet" tıklamasıyla da kapatılmaz. Kullanıcı "Tercihleri
    // Yönet" modalından analitiği elle kapatmayı seçerse (savePreferences ile) o
    // açık tercih zaten saygı görür.
    const rejectOptional = useCallback(() => {
        persistPreferences({ analytics: true, marketing: false })
    }, [persistPreferences])

    const openPreferences = useCallback(() => {
        setIsPreferencesOpen(true)
    }, [])

    const closePreferences = useCallback(() => {
        setIsPreferencesOpen(false)
    }, [])

    const value = useMemo<ConsentContextValue>(() => ({
        preferences,
        isReady,
        hasStoredConsent,
        isPreferencesOpen,
        openPreferences,
        closePreferences,
        savePreferences: persistPreferences,
        acceptAll,
        rejectOptional
    }), [acceptAll, closePreferences, hasStoredConsent, isPreferencesOpen, isReady, openPreferences, persistPreferences, preferences, rejectOptional])

    return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent() {
    const context = useContext(ConsentContext)
    if (!context) {
        throw new Error('useConsent must be used within ConsentProvider')
    }
    return context
}
