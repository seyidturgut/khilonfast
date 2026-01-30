// import { HiEnvelope, HiPhone, HiMapPin } from 'react-icons/hi2'
import { FaLinkedinIn, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-pattern-bg">
                <img src="/footer-pattern.svg" alt="" className="footer-pattern" />
            </div>

            <div className="container footer-container">
                <div className="footer-main">
                    <div className="footer-brand">
                        <img src="/fast-logo-big.svg" alt="Khilonfast" className="footer-logo" />
                        <p className="footer-description">
                            khilon olarak, hem veri analitiği bilimini hem de yaratıcılık sanatını kullanarak
                            en pazarlama faaliyetlerini ölçülmesine yardımcı olmaya çalışıyoruz. Misyonumuz, pazarlamanızı
                            dönüştürmek, onları yalnızca daha verimli değil, aynı zamanda iş hedeflerinize
                            ulaşmada etkili hale getirmektir.
                        </p>

                        <div className="footer-social">
                            <a href="#" className="social-link" aria-label="LinkedIn">
                                <FaLinkedinIn />
                            </a>
                            <a href="#" className="social-link" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <FaTwitter />
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h3 className="footer-column-title">Khilon</h3>
                            <ul className="footer-list">
                                <li><Link to="/">ana sayfa</Link></li>
                                <li><Link to="/hakkimizda">hakkımızda</Link></li>
                                <li><Link to="/#contact">bize ulaşın</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-column-title">Servisler</h3>
                            <ul className="footer-list">
                                <li><a href="#services">Go to Market Stratejisi</a></li>
                                <li><a href="#services">İçerik Stratejisi</a></li>
                                <li><a href="#services">Bütünleşik Dijital Pazarlama</a></li>
                                <li><a href="#services">Google Ads</a></li>
                                <li><a href="#services">Sosyal Medya Reklamcılığı</a></li>
                                <li><a href="#services">SEO</a></li>
                                <li><a href="#services">İçerik Üretimi</a></li>
                                <li><a href="#services">B2B Email Pazarlama</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-column-title">Bilgilendirme</h3>
                            <ul className="footer-list">
                                <li><a href="#pricing">Kariyer Fırsatları</a></li>
                                <li><a href="#privacy">Gizlilik politikası</a></li>
                                <li><a href="#terms">Hizmet Şartları Bağlantıları</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} khilonfast. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    )
}
