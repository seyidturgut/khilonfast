import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { legalContent, type LegalDocumentKey } from '../content/legalContent'
import { useConsent } from '../context/ConsentContext'
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale'
import './LegalPage.css'

type LegalPageProps = {
    documentKey: LegalDocumentKey
}

export default function LegalPage({ documentKey }: LegalPageProps) {
    const currentLang = useRouteLocale()
    const isEn = currentLang === 'en'
    const location = useLocation()
    const { openPreferences } = useConsent()

    const doc = legalContent[currentLang][documentKey]
    const breadcrumbLabel = useMemo(() => {
        if (isEn) {
            return [
                { label: 'Home', path: '/en' },
                { label: 'Legal', path: null },
                { label: doc.title, path: location.pathname }
            ]
        }

        return [
            { label: 'Ana Sayfa', path: '/' },
            { label: 'Yasal Bilgilendirme', path: null },
            { label: doc.title, path: location.pathname }
        ]
    }, [doc.title, isEn, location.pathname])

    const contactPath = getLocalizedPathByKey(currentLang, 'contact')

    return (
        <div className="legal-page">
            <section className="legal-hero">
                <div className="container legal-hero__inner">
                    <nav className="legal-breadcrumb" aria-label="breadcrumb">
                        {breadcrumbLabel.map((item, index) => (
                            <span key={`${item.label}-${index}`}>
                                {item.path ? <Link to={item.path}>{item.label}</Link> : item.label}
                                {index < breadcrumbLabel.length - 1 ? ' / ' : ''}
                            </span>
                        ))}
                    </nav>

                    <p className="legal-hero__eyebrow">{doc.eyebrow}</p>
                    <h1>{doc.title}</h1>
                    <p className="legal-hero__lead">{doc.intro}</p>
                    <div className="legal-hero__meta">
                        <span>{doc.updatedLabel}: {doc.updatedAt}</span>
                        {documentKey === 'cookiePolicy' && (
                            <button type="button" className="legal-hero__button" onClick={openPreferences}>
                                {isEn ? 'Manage Cookie Preferences' : 'Çerez Tercihlerini Yönet'}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="legal-body">
                <div className="container legal-body__grid">
                    <article className="legal-article">
                        {doc.sections.map((section) => (
                            <section key={section.title} className="legal-section">
                                <h2>{section.title}</h2>
                                {section.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                                {section.bullets && (
                                    <ul>
                                        {section.bullets.map((bullet) => (
                                            <li key={bullet}>{bullet}</li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </article>

                    <aside className="legal-sidebar">
                        <div className="legal-sidebar__card">
                            <h3>{isEn ? 'Need support?' : 'Yardıma mı ihtiyacınız var?'}</h3>
                            <p>
                                {isEn
                                    ? 'If you have questions about policies, payments, or purchase flows, reach us at info@khilonfast.com.'
                                    : 'Politikalar, ödeme süreçleri veya satın alma akışı hakkında sorularınız varsa bize info@khilonfast.com üzerinden ulaşabilirsiniz.'}
                            </p>
                            <a href="mailto:info@khilonfast.com" className="legal-sidebar__cta">
                                info@khilonfast.com
                            </a>
                        </div>

                        <div className="legal-sidebar__card legal-sidebar__card--soft">
                            <h3>{isEn ? 'Useful links' : 'Hızlı bağlantılar'}</h3>
                            <div className="legal-sidebar__links">
                                <Link to={getLocalizedPathByKey(currentLang, 'privacyPolicy')}>
                                    {isEn ? 'Privacy Policy' : 'Gizlilik Politikası'}
                                </Link>
                                <Link to={getLocalizedPathByKey(currentLang, 'cookiePolicy')}>
                                    {isEn ? 'Cookie Policy' : 'Çerez Politikası'}
                                </Link>
                                <Link to={getLocalizedPathByKey(currentLang, 'termsOfService')}>
                                    {isEn ? 'Terms of Service' : 'Hizmet Şartları'}
                                </Link>
                                <Link to={getLocalizedPathByKey(currentLang, 'refundPolicy')}>
                                    {isEn ? 'Cancellation & Refund Policy' : 'İade ve İptal Politikası'}
                                </Link>
                                <Link to={contactPath}>
                                    {isEn ? 'Contact' : 'İletişim'}
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    )
}
