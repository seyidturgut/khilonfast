// import { HiEnvelope, HiPhone, HiMapPin } from 'react-icons/hi2'
import { FaLinkedinIn, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Footer.css'

export default function Footer() {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language.split('-')[0];
    const prefix = currentLang === 'en' ? '/en' : '';
    const toLocalized = (key: string) => `${prefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/');

    return (
        <footer className="footer">
            <div className="footer-pattern-bg">
                <img src="/footer-pattern.svg" alt="" className="footer-pattern" />
            </div>

            <div className="container footer-container">
                <div className="footer-main">
                    <div className="footer-brand">
                        <img src="/fast-logo-big.svg" alt="khilonfast" className="footer-logo" />
                        <p className="footer-description">
                            {t('footer.description')}
                        </p>

                        <div className="footer-social">
                            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="social-link" aria-label="LinkedIn">
                                <FaLinkedinIn />
                            </a>
                            <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                            <a href="https://x.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Twitter">
                                <FaTwitter />
                            </a>
                            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h3 className="footer-column-title">{t('footer.columns.company')}</h3>
                            <ul className="footer-list">
                                <li><Link to={`${prefix}/`}>{t('footer.links.home')}</Link></li>
                                <li><Link to={toLocalized('about')}>{t('footer.links.about')}</Link></li>
                                <li><Link to={toLocalized('contact')}>{t('footer.links.contact')}</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-column-title">{t('footer.columns.services')}</h3>
                            <ul className="footer-list">
                                <li><Link to={toLocalized('gtm')}>{t('header.menuItems.services.gtm.title')}</Link></li>
                                <li><Link to={toLocalized('contentStrategy')}>{t('header.menuItems.services.content.title')}</Link></li>
                                <li><Link to={toLocalized('idm')}>{t('header.menuItems.services.integrated.title')}</Link></li>
                                <li><Link to={toLocalized('googleAds')}>{t('header.menuItems.services.ads.title')}</Link></li>
                                <li><Link to={toLocalized('socialAds')}>{t('header.menuItems.services.social.title')}</Link></li>
                                <li><Link to={toLocalized('seo')}>{t('header.menuItems.services.seo.title')}</Link></li>
                                <li><Link to={toLocalized('contentProduction')}>{t('header.menuItems.services.production.title')}</Link></li>
                                <li><Link to={toLocalized('b2bEmail')}>{t('header.menuItems.services.email.title')}</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-column-title">{t('footer.columns.info')}</h3>
                            <ul className="footer-list">
                                <li><Link to={toLocalized('contact')}>{t('footer.career')}</Link></li>
                                <li><Link to={toLocalized('about')}>{t('footer.privacy')}</Link></li>
                                <li><Link to={toLocalized('about')}>{t('footer.terms')}</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} khilonfast. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    )
}
