import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    HiMagnifyingGlass,
    HiQuestionMarkCircle,
    HiArrowRightOnRectangle,
    HiUserPlus,
    HiShieldCheck,
    HiUsers,
    HiDocumentText,
    HiCodeBracket,
    HiCheckBadge
} from 'react-icons/hi2'
import Breadcrumbs from '../components/Breadcrumbs'
import './SearchConsoleSetup.css'
import { useRouteLocale } from '../utils/locale'

export default function SearchConsoleSetup() {
    const { t } = useTranslation('common')
    const isEn = useRouteLocale() === 'en'
    const [path, setPath] = useState<'yes' | 'no' | null>(null)

    return (
        <div className="sc-setup-page">
            <div className="container sc-setup-container">
                <Breadcrumbs items={[{ label: t('header.services'), path: '/#services' }, { label: isEn ? 'Google Search Console Setup Flow' : 'Google Search Console Kurulum Akışı' }]} />
                {/* Header Section */}
                <header className="sc-header">
                    <h1 className="sc-title">{isEn ? 'Google Search Console Setup Flow' : 'Google Search Console Kurulum Akışı'}</h1>
                    <p className="sc-subtitle">
                        {isEn
                            ? 'Set up Search Console to monitor your website visibility in Google Search and track technical issues.'
                            : 'Web sitenizin Google arama sonuçlarındaki görünürlüğünü analiz etmek ve teknik hataları izleyebilmek için Search Console kurulumu yapılır.'}
                    </p>

                    <div className="sc-purpose-box">
                        <div className="purpose-header">
                            <HiMagnifyingGlass className="purpose-icon" />
                            <h3>{isEn ? 'Goal' : 'Amaç'}</h3>
                        </div>
                        <p>
                            {isEn
                                ? 'Search Console setup helps monitor search visibility and technical issues on your website.'
                                : 'Web sitenizin Google arama sonuçlarındaki görünürlüğünü analiz etmek ve teknik hataları izleyebilmek için Search Console kurulumu yapılır.'}
                            <strong>{isEn ? ' GTM setup is required.' : ' GTM kurulumu zorunludur.'}</strong>
                        </p>
                    </div>

                    <div className="sc-top-video">
                        <div className="video-glass-wrapper">
                            <div className="video-container">
                                <iframe
                                    src="https://player.vimeo.com/video/1128164782"
                                    title={isEn ? 'khilonfast | Google Search Console Authorization Guide' : 'khilonfast | Google Search Console Yetkilendirme Rehberi'}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Decision Section */}
                <section className="sc-decision-section">
                    <div className="decision-node">
                        <div className="decision-icon-box">
                            <HiQuestionMarkCircle />
                        </div>
                        <h2>{isEn ? 'Decision Point' : 'Karar Noktası'}</h2>
                        <p className="decision-question">{isEn ? 'Do you already have a Google Search Console account?' : 'Google Search Console hesabınız var mı?'}</p>

                        <div className="decision-buttons">
                            <button
                                className={`btn-decision btn-yes ${path === 'yes' ? 'active' : ''}`}
                                onClick={() => setPath('yes')}
                            >
                                {isEn ? 'YES, I Have an Account' : 'EVET, Hesabım Var'}
                            </button>
                            <button
                                className={`btn-decision btn-no ${path === 'no' ? 'active' : ''}`}
                                onClick={() => setPath('no')}
                            >
                                {isEn ? 'NO, I Do Not Have an Account' : 'HAYIR, Hesabım Yok'}
                            </button>
                        </div>
                    </div>

                    {/* Path Viewport */}
                    <div className="sc-path-viewport">
                        {path === 'yes' && (
                            <div className="path-content animate-fade-in">
                                <div className="path-header yes">{isEn ? 'YES, I Have an Account' : 'EVET, Hesabım Var'}</div>
                                <div className="steps-container">
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiArrowRightOnRectangle /></div>
                                        <div className="step-text">
                                            <h3>{isEn ? 'Step 1' : 'Adım 1'}</h3>
                                            <p>{isEn ? 'Sign in to your Search Console account.' : 'Search Console hesabınıza giriş yapın.'}</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiUserPlus /></div>
                                        <div className="step-text">
                                            <h3>{isEn ? 'Step 2' : 'Adım 2'}</h3>
                                            <p>{isEn ? 'Add the khilonfast email via the "Add User" menu.' : '"Kullanıcı Ekle" menüsünden khilonfast e-posta adresini ekleyin.'}</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiShieldCheck /></div>
                                        <div className="step-text">
                                            <h3>{isEn ? 'Step 3' : 'Adım 3'}</h3>
                                            <p>{isEn ? 'If GTM is already installed, no additional action is required.' : 'GTM kurulumu tamamlandıysa ek bir aksiyona gerek yoktur.'}</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-completion-card">
                                        <div className="completion-content">
                                            <HiCheckBadge className="completion-icon" />
                                            <div>
                                                <h3>{isEn ? 'Setup Completed' : 'Kurulum Tamamlandı'}</h3>
                                                <p>{isEn ? 'khilonfast can now access your site performance and indexing data.' : 'khilonfast, site performans ve indeksleme verilerinize erişebilir.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {path === 'no' && (
                            <div className="path-content animate-fade-in">
                                <div className="path-header no">{isEn ? 'NO, I Do Not Have an Account' : 'HAYIR, Hesabım Yok'}</div>
                                <div className="steps-container">
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiUsers /></div>
                                        <div className="step-text">
                                            <h3>{isEn ? 'Step 1' : 'Adım 1'}</h3>
                                            <p>{isEn ? 'khilonfast creates a Search Console account for you within the selected package scope.' : 'khilonfast, uygun paket kapsamında sizin adınıza Search Console hesabı oluşturur.'}</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiDocumentText /></div>
                                        <div className="step-text">
                                            <h3>{isEn ? 'Step 2' : 'Adım 2'}</h3>
                                            <p>{isEn ? 'A verification code is provided for the created property.' : 'Oluşturulan mülk (property) için doğrulama (verify) kodu sağlanır.'}</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiCodeBracket /></div>
                                        <div className="step-text">
                                            <h3>{isEn ? 'Step 3' : 'Adım 3'}</h3>
                                            <p>{isEn ? 'Add this code to the <code>&lt;head&gt;</code> section of your homepage.' : <>Bu kodu web sitenizin anasayfasındaki <code>&lt;head&gt;</code> alanına ekleyin.</>}</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-completion-card">
                                        <div className="completion-content">
                                            <HiCheckBadge className="completion-icon" />
                                            <div>
                                                <h3>{isEn ? 'Setup Completed' : 'Kurulum Tamamlandı'}</h3>
                                                <p>{isEn ? 'Search Console setup is completed and your site data starts being monitored.' : 'Search Console kurulumu tamamlanır ve site verileriniz izlenmeye başlanır.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
