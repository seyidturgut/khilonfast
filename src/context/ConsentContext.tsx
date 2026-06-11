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
    window.gtag = window.gtag || function gtag(...args: unknown[]) {
        window.dataLayer?.push(args)
    }

    window.gtag('consent', 'default', {
        analytics_storage: 'denied',
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
    window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer?.push(args) }

    const script = document.createElement('script')
    script.id = 'khilonfast-ga4-loader'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    document.head.appendChild(script)

    window.gtag('js', new Date())
    window.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false })
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
        loadGtmIfNeeded()
        // 4) GA4'ü doğrudan yükle (GTM'deki Google etiketi canlıda ateşlenmiyor — bkz. yorum).
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

    const rejectOptional = useCallback(() => {
        persistPreferences({ analytics: false, marketing: false })
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
