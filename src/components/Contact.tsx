import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './Contact.css'

export default function Contact() {
    const { i18n } = useTranslation('common')
    const isEn = i18n.language.split('-')[0] === 'en'
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
                            {isEn ? 'Let\'s Discuss Your ' : 'Projenizi '}
                            <span className="gradient-text">{isEn ? 'Project' : 'Konuşalım'}</span>
                        </h2>
                        <p className="contact-text">
                            {isEn
                                ? 'We would love to collaborate and bring your ideas to life. Reach out now and get a free consultation.'
                                : 'Fikirlerinizi hayata geçirmek için sizinle çalışmayı çok isteriz. Hemen iletişime geçin, ücretsiz danışmanlık hizmeti alalım.'}
                        </p>

                        <div className="contact-details">
                            <div className="contact-item">
                                <div className="contact-icon">📧</div>
                                <div>
                                    <h4>{isEn ? 'Email' : 'E-posta'}</h4>
                                    <p>info@khilonfast.com</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon">📱</div>
                                <div>
                                    <h4>{isEn ? 'Phone' : 'Telefon'}</h4>
                                    <p>+90 XXX XXX XX XX</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon">📍</div>
                                <div>
                                    <h4>{isEn ? 'Address' : 'Adres'}</h4>
                                    <p>{isEn ? 'Istanbul, Turkiye' : 'İstanbul, Türkiye'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-wrapper">
                        {isSubmitted ? (
                            <div className="contact-success">
                                <div className="success-icon">✅</div>
                                <h3>{isEn ? 'Your Message Has Been Received!' : 'Mesajınız Alındı!'}</h3>
                                <p>{isEn ? 'We will get back to you as soon as possible. Thank you for your interest.' : 'En kısa sürede size dönüş yapacağız. İlginiz için teşekkürler.'}</p>
                                <button className="btn btn-primary" onClick={() => setIsSubmitted(false)}>
                                    {isEn ? 'Send Another Message' : 'Yeni Mesaj Gönder'}
                                </button>
                            </div>
                        ) : (
                            <form className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder={isEn ? 'Your Full Name' : 'Adınız Soyadınız'}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        placeholder={isEn ? 'Your Email Address' : 'E-posta Adresiniz'}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="tel"
                                        placeholder={isEn ? 'Your Phone Number' : 'Telefon Numaranız'}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <textarea
                                        placeholder={isEn ? 'Your Message' : 'Mesajınız'}
                                        className="form-input form-textarea"
                                        rows={5}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary btn-full">
                                    {isEn ? 'Send Message' : 'Mesaj Gönder'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
