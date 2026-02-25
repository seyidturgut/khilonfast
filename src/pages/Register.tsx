import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HiUser, HiMail, HiLockClosed, HiPhone } from 'react-icons/hi';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './Login.css';

export default function Register() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, googleLogin, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setLoading(true);

        try {
            await register({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone?.trim() || undefined
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Kayıt başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCredential = async (credential: string) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(credential);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google ile giriş başarısız');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card auth-card-compact">
                    <h1>Kayıt Ol</h1>
                    <p className="auth-subtitle">Yeni hesap oluşturun</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="first_name">
                                    <HiUser /> Ad
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Adınız"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="last_name">
                                    <HiUser /> Soyad
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Soyadınız"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                <HiMail /> E-posta
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="ornek@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                <HiPhone /> Telefon (Opsiyonel)
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+90 5XX XXX XX XX"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <HiLockClosed /> Şifre
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder="En az 6 karakter"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm_password">
                                <HiLockClosed /> Şifre (Tekrar)
                            </label>
                            <input
                                type="password"
                                id="confirm_password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder="Şifreyi tekrar girin"
                            />
                        </div>

                        <button type="submit" className="btn-auth-primary" disabled={loading}>
                            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>veya</span>
                    </div>
                    <div className="auth-google">
                        <GoogleLoginButton onCredential={handleGoogleCredential} />
                    </div>

                    <p className="auth-link">
                        Zaten hesabınız var mı? <Link to="/giris">Giriş Yap</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
