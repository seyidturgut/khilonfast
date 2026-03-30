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
        ensureGoogleConsentDefaults()
        const stored = parseStoredConsent()
        if (stored) {
            setPreferences(stored)
            setHasStoredConsent(true)
            applyConsent(stored)
            if (stored.analytics || stored.marketing) {
                loadGtmIfNeeded()
            }
        }

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
