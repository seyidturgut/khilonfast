import './Contact.css'

export default function Contact() {
    return (
        <section id="contact" className="contact">
            <div className="container">
                <div className="contact-content">
                    <div className="contact-info">
                        <h2 className="contact-title">
                            Projenizi <span className="gradient-text">Konuşalım</span>
                        </h2>
                        <p className="contact-text">
                            Fikirlerinizi hayata geçirmek için sizinle çalışmayı çok isteriz.
                            Hemen iletişime geçin, ücretsiz danışmanlık hizmeti alalım.
                        </p>

                        <div className="contact-details">
                            <div className="contact-item">
                                <div className="contact-icon">📧</div>
                                <div>
                                    <h4>E-posta</h4>
                                    <p>info@khilonfast.com</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon">📱</div>
                                <div>
                                    <h4>Telefon</h4>
                                    <p>+90 XXX XXX XX XX</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon">📍</div>
                                <div>
                                    <h4>Adres</h4>
                                    <p>İstanbul, Türkiye</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-wrapper">
                        <form className="contact-form">
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Adınız Soyadınız"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="email"
                                    placeholder="E-posta Adresiniz"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="tel"
                                    placeholder="Telefon Numaranız"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <textarea
                                    placeholder="Mesajınız"
                                    className="form-input form-textarea"
                                    rows={5}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full">
                                Mesaj Gönder
                            </button>
                        </form>
                    </div>
                </div>

                <footer className="footer">
                    <p>© 2026 Khilonfast. Tüm hakları saklıdır.</p>
                    <div className="social-links">
                        <a href="#" className="social-link">LinkedIn</a>
                        <a href="#" className="social-link">Twitter</a>
                        <a href="#" className="social-link">Instagram</a>
                    </div>
                </footer>
            </div>
        </section>
    )
}
