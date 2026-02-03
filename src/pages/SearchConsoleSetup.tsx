import { useState } from 'react'
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
import './SearchConsoleSetup.css'

export default function SearchConsoleSetup() {
    const [path, setPath] = useState<'yes' | 'no' | null>(null)

    return (
        <div className="sc-setup-page">
            <div className="container sc-setup-container">
                {/* Header Section */}
                <header className="sc-header">
                    <h1 className="sc-title">Google Search Console Kurulum Akışı</h1>
                    <p className="sc-subtitle">
                        Web sitenizin Google arama sonuçlarındaki görünürlüğünü analiz etmek ve teknik hataları izleyebilmek için Search Console kurulumu yapılır.
                    </p>

                    <div className="sc-purpose-box">
                        <div className="purpose-header">
                            <HiMagnifyingGlass className="purpose-icon" />
                            <h3>Amaç</h3>
                        </div>
                        <p>
                            Web sitenizin Google arama sonuçlarındaki görünürlüğünü analiz etmek ve teknik hataları izleyebilmek için Search Console kurulumu yapılır.
                            <strong> GTM kurulumu zorunludur.</strong>
                        </p>
                    </div>

                    <div className="sc-top-video">
                        <div className="video-glass-wrapper">
                            <div className="video-container">
                                <iframe
                                    src="https://player.vimeo.com/video/1128164782"
                                    title="khilonfast | Google Search Console Yetkilendirme Rehberi"
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
                        <h2>Karar Noktası</h2>
                        <p className="decision-question">Google Search Console hesabınız var mı?</p>

                        <div className="decision-buttons">
                            <button
                                className={`btn-decision btn-yes ${path === 'yes' ? 'active' : ''}`}
                                onClick={() => setPath('yes')}
                            >
                                EVET, Hesabım Var
                            </button>
                            <button
                                className={`btn-decision btn-no ${path === 'no' ? 'active' : ''}`}
                                onClick={() => setPath('no')}
                            >
                                HAYIR, Hesabım Yok
                            </button>
                        </div>
                    </div>

                    {/* Path Viewport */}
                    <div className="sc-path-viewport">
                        {path === 'yes' && (
                            <div className="path-content animate-fade-in">
                                <div className="path-header yes">EVET, Hesabım Var</div>
                                <div className="steps-container">
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiArrowRightOnRectangle /></div>
                                        <div className="step-text">
                                            <h3>Adım 1</h3>
                                            <p>Search Console hesabınıza giriş yapın.</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiUserPlus /></div>
                                        <div className="step-text">
                                            <h3>Adım 2</h3>
                                            <p>"Kullanıcı Ekle" menüsünden KhilonFast e-posta adresini ekleyin.</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiShieldCheck /></div>
                                        <div className="step-text">
                                            <h3>Adım 3</h3>
                                            <p>GTM kurulumu tamamlandıysa ek bir aksiyona gerek yoktur.</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-completion-card">
                                        <div className="completion-content">
                                            <HiCheckBadge className="completion-icon" />
                                            <div>
                                                <h3>Kurulum Tamamlandı</h3>
                                                <p>KhilonFast, site performans ve indeksleme verilerinize erişebilir.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {path === 'no' && (
                            <div className="path-content animate-fade-in">
                                <div className="path-header no">HAYIR, Hesabım Yok</div>
                                <div className="steps-container">
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiUsers /></div>
                                        <div className="step-text">
                                            <h3>Adım 1</h3>
                                            <p>KhilonFast, uygun paket kapsamında sizin adınıza Search Console hesabı oluşturur.</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiDocumentText /></div>
                                        <div className="step-text">
                                            <h3>Adım 2</h3>
                                            <p>Oluşturulan mülk (property) için doğrulama (verify) kodu sağlanır.</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-step-card">
                                        <div className="step-icon-wrap"><HiCodeBracket /></div>
                                        <div className="step-text">
                                            <h3>Adım 3</h3>
                                            <p>Bu kodu web sitenizin anasayfasındaki <code>&lt;head&gt;</code> alanına ekleyin.</p>
                                        </div>
                                    </div>
                                    <div className="step-connector"></div>
                                    <div className="sc-completion-card">
                                        <div className="completion-content">
                                            <HiCheckBadge className="completion-icon" />
                                            <div>
                                                <h3>Kurulum Tamamlandı</h3>
                                                <p>Search Console kurulumu tamamlanır ve site verileriniz izlenmeye başlanır.</p>
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
