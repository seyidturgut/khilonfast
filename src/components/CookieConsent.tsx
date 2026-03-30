import { useEffect, useState } from 'react'
import { useConsent } from '../context/ConsentContext'
import { useRouteLocale } from '../utils/locale'
import './CookieConsent.css'

const copy = {
    tr: {
        title: 'Çerez tercihlerinizi yönetin',
        description: 'Sitemizde zorunlu çerezlerin yanında, izin vermeniz halinde analiz ve reklam ölçümü için çerezler kullanabiliriz. İsterseniz tümünü kabul edebilir, reddedebilir veya tercihlerinizi yönetebilirsiniz.',
        acceptAll: 'Tümünü Kabul Et',
        reject: 'Reddet',
        manage: 'Tercihleri Yönet',
        modalTitle: 'Çerez tercih merkezi',
        modalDescription: 'Aşağıdaki kategorileri dilediğiniz gibi yönetebilirsiniz. Zorunlu çerezler sitenin temel işlevleri için gereklidir ve kapatılamaz.',
        save: 'Tercihleri Kaydet',
        close: 'Kapat',
        alwaysOn: 'Her zaman aktif',
        necessary: {
            title: 'Zorunlu Çerezler',
            desc: 'Oturum, güvenlik, sepet ve temel site işlevlerinin çalışması için gereklidir.'
        },
        analytics: {
            title: 'Analitik Çerezler',
            desc: 'Site kullanımını anlamamıza, performansı ölçmemize ve deneyimi geliştirmemize yardımcı olur.'
        },
        marketing: {
            title: 'Reklam / Pazarlama Çerezleri',
            desc: 'Reklam ölçümü, dönüşüm takibi ve izin verilmesi halinde pazarlama performansı analizi için kullanılır.'
        }
    },
    en: {
        title: 'Manage your cookie preferences',
        description: 'Alongside essential cookies, we may use analytics and advertising measurement cookies if you allow them. You can accept all, reject optional cookies, or manage your choices in detail.',
        acceptAll: 'Accept All',
        reject: 'Reject',
        manage: 'Manage Preferences',
        modalTitle: 'Cookie preference center',
        modalDescription: 'You can manage the categories below at any time. Essential cookies are required for the core site experience and cannot be disabled.',
        save: 'Save Preferences',
        close: 'Close',
        alwaysOn: 'Always active',
        necessary: {
            title: 'Essential Cookies',
            desc: 'Required for session continuity, security, cart behavior, and core site functionality.'
        },
        analytics: {
            title: 'Analytics Cookies',
            desc: 'Help us understand site usage, measure performance, and improve the experience.'
        },
        marketing: {
            title: 'Advertising / Marketing Cookies',
            desc: 'Used for advertising measurement, conversion tracking, and marketing performance analysis where allowed.'
        }
    }
} as const

export default function CookieConsent() {
    const locale = useRouteLocale()
    const {
        isReady,
        preferences,
        hasStoredConsent,
        isPreferencesOpen,
        openPreferences,
        closePreferences,
        savePreferences,
        acceptAll,
        rejectOptional
    } = useConsent()

    const isEn = locale === 'en'
    const tx = copy[isEn ? 'en' : 'tr']
    const [analytics, setAnalytics] = useState(Boolean(preferences?.analytics))
    const [marketing, setMarketing] = useState(Boolean(preferences?.marketing))

    useEffect(() => {
        setAnalytics(Boolean(preferences?.analytics))
        setMarketing(Boolean(preferences?.marketing))
    }, [preferences])

    const showBanner = isReady && !hasStoredConsent

    return (
        <>
            {showBanner && (
                <div className="cookie-banner" role="dialog" aria-live="polite" aria-label={tx.title}>
                    <div className="cookie-banner__content">
                        <div>
                            <p className="cookie-banner__eyebrow">{isEn ? 'Cookie Policy' : 'Çerez Politikası'}</p>
                            <h2>{tx.title}</h2>
                            <p>{tx.description}</p>
                        </div>
                        <div className="cookie-banner__actions">
                            <button type="button" className="cookie-btn cookie-btn--ghost" onClick={rejectOptional}>
                                {tx.reject}
                            </button>
                            <button type="button" className="cookie-btn cookie-btn--ghost" onClick={openPreferences}>
                                {tx.manage}
                            </button>
                            <button type="button" className="cookie-btn cookie-btn--primary" onClick={acceptAll}>
                                {tx.acceptAll}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPreferencesOpen && (
                <div className="cookie-modal-backdrop" role="presentation" onClick={closePreferences}>
                    <div className="cookie-modal" role="dialog" aria-modal="true" aria-label={tx.modalTitle} onClick={(event) => event.stopPropagation()}>
                        <div className="cookie-modal__header">
                            <div>
                                <p className="cookie-banner__eyebrow">{isEn ? 'Cookie Policy' : 'Çerez Politikası'}</p>
                                <h2>{tx.modalTitle}</h2>
                                <p>{tx.modalDescription}</p>
                            </div>
                            <button type="button" className="cookie-modal__close" onClick={closePreferences} aria-label={tx.close}>
                                ×
                            </button>
                        </div>

                        <div className="cookie-modal__list">
                            <div className="cookie-category">
                                <div>
                                    <h3>{tx.necessary.title}</h3>
                                    <p>{tx.necessary.desc}</p>
                                </div>
                                <span className="cookie-category__pill">{tx.alwaysOn}</span>
                            </div>

                            <label className="cookie-category cookie-category--interactive">
                                <div>
                                    <h3>{tx.analytics.title}</h3>
                                    <p>{tx.analytics.desc}</p>
                                </div>
                                <span className="cookie-toggle">
                                    <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
                                    <span className="cookie-toggle__track" />
                                </span>
                            </label>

                            <label className="cookie-category cookie-category--interactive">
                                <div>
                                    <h3>{tx.marketing.title}</h3>
                                    <p>{tx.marketing.desc}</p>
                                </div>
                                <span className="cookie-toggle">
                                    <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
                                    <span className="cookie-toggle__track" />
                                </span>
                            </label>
                        </div>

                        <div className="cookie-modal__footer">
                            <button type="button" className="cookie-btn cookie-btn--ghost" onClick={rejectOptional}>
                                {tx.reject}
                            </button>
                            <button
                                type="button"
                                className="cookie-btn cookie-btn--primary"
                                onClick={() => savePreferences({ analytics, marketing })}
                            >
                                {tx.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
