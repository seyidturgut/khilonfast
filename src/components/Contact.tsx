import { useState } from 'react'
import './Contact.css'

export default function Contact() {
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitted(true)
    }
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
                        {isSubmitted ? (
                            <div className="contact-success">
                                <div className="success-icon">✅</div>
                                <h3>Mesajınız Alındı!</h3>
                                <p>En kısa sürede size dönüş yapacağız. İlginiz için teşekkürler.</p>
                                <button className="btn btn-primary" onClick={() => setIsSubmitted(false)}>
                                    Yeni Mesaj Gönder
                                </button>
                            </div>
                        ) : (
                            <form className="contact-form" onSubmit={handleSubmit}>
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
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
