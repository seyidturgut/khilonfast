import { useTranslation } from 'react-i18next'
import './ContactPage.css'

export default function ContactPage() {
    const { t } = useTranslation();

    return (
        <div className="contact-page">
            <section className="contact-hero">
                <div className="container contact-hero-grid">
                    <div>
                        <p className="contact-eyebrow">{t('contact.hero.eyebrow')}</p>
                        <h1>{t('contact.hero.title')}</h1>
                        <p className="contact-lead">
                            {t('contact.hero.lead')}
                        </p>
                        <div className="contact-badges">
                            <span>{t('contact.hero.badge1')}</span>
                            <span>{t('contact.hero.badge2')}</span>
                        </div>
                    </div>
                    <div className="contact-hero-card">
                        <div className="contact-card-title">{t('contact.card.title')}</div>
                        <div className="contact-card-item">
                            <span className="label">{t('contact.card.email')}</span>
                            <span className="value">info@khilonfast.com</span>
                        </div>
                        <div className="contact-card-item">
                            <span className="label">{t('contact.card.phone')}</span>
                            <span className="value">+90 (5XX) XXX XX XX</span>
                        </div>
                        <div className="contact-card-item">
                            <span className="label">{t('contact.card.address')}</span>
                            <span className="value">{t('contact.card.location')}</span>
                        </div>
                        <div className="contact-card-foot">
                            {t('contact.card.hours')}
                        </div>
                    </div>
                </div>
            </section>

            <section className="contact-main">
                <div className="container contact-main-grid">
                    <div className="contact-form-card">
                        <h2>{t('contact.form.title')}</h2>
                        <p>{t('contact.form.description')}</p>
                        <form className="contact-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('contact.form.firstName')}</label>
                                    <input type="text" placeholder={t('contact.form.firstNamePlaceholder')} />
                                </div>
                                <div className="form-group">
                                    <label>{t('contact.form.lastName')}</label>
                                    <input type="text" placeholder={t('contact.form.lastNamePlaceholder')} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('contact.form.email')}</label>
                                    <input type="email" placeholder={t('contact.form.emailPlaceholder')} />
                                </div>
                                <div className="form-group">
                                    <label>{t('contact.form.phone')}</label>
                                    <input type="tel" placeholder={t('contact.form.phonePlaceholder')} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{t('contact.form.brand')}</label>
                                <input type="text" placeholder={t('contact.form.brandPlaceholder')} />
                            </div>
                            <div className="form-group">
                                <label>{t('contact.form.detail')}</label>
                                <textarea rows={6} placeholder={t('contact.form.detailPlaceholder')} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full">{t('contact.form.submit')}</button>
                        </form>
                    </div>

                    <div className="contact-side">
                        <div className="contact-side-card">
                            <h3>{t('contact.side.helpTitle')}</h3>
                            <ul>
                                <li>{t('contact.side.list1')}</li>
                                <li>{t('contact.side.list2')}</li>
                                <li>{t('contact.side.list3')}</li>
                                <li>{t('contact.side.list4')}</li>
                                <li>{t('contact.side.list5')}</li>
                            </ul>
                        </div>
                        <div className="contact-side-card highlight">
                            <h3>{t('contact.side.meeting.title')}</h3>
                            <p>
                                {t('contact.side.meeting.description')}
                            </p>
                            <a className="btn btn-secondary" href="mailto:info@khilonfast.com">{t('contact.side.meeting.button')}</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
