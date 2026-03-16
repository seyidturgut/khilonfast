import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HiUser, HiMail, HiLockClosed, HiPhone } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './Login.css';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';

export default function Register() {
    const { t } = useTranslation('common');
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
    const currentLang = useRouteLocale();
    const dashboardPath = getLocalizedPathByKey(currentLang, 'dashboard');
    const loginPath = getLocalizedPathByKey(currentLang, 'login');

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(dashboardPath);
        }
    }, [dashboardPath, user, navigate]);

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
            setError(t('authPages.register.errors.passwordMismatch'));
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
            navigate(dashboardPath);
        } catch (err: any) {
            setError(err.message || t('authPages.register.errors.default'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCredential = async (credential: string) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(credential);
            navigate(dashboardPath);
        } catch (err: any) {
            setError(err.message || t('authPages.register.errors.google'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card auth-card-compact">
                    <h1>{t('authPages.register.title')}</h1>
                    <p className="auth-subtitle">{t('authPages.register.subtitle')}</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="first_name">
                                    <HiUser /> {t('authPages.fields.firstName')}
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('authPages.placeholders.firstName')}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="last_name">
                                    <HiUser /> {t('authPages.fields.lastName')}
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('authPages.placeholders.lastName')}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                <HiMail /> {t('authPages.fields.email')}
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder={t('authPages.placeholders.email')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                <HiPhone /> {t('authPages.fields.phoneOptional')}
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={t('authPages.placeholders.phone')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <HiLockClosed /> {t('authPages.fields.password')}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder={t('authPages.placeholders.password')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm_password">
                                <HiLockClosed /> {t('authPages.fields.confirmPassword')}
                            </label>
                            <input
                                type="password"
                                id="confirm_password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder={t('authPages.placeholders.confirmPassword')}
                            />
                        </div>

                        <button type="submit" className="btn-auth-primary" disabled={loading}>
                            {loading ? t('authPages.register.loading') : t('authPages.register.submit')}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>{t('authPages.or')}</span>
                    </div>
                    <div className="auth-google">
                        <GoogleLoginButton onCredential={handleGoogleCredential} />
                    </div>

                    <p className="auth-link">
                        {t('authPages.register.switchPrompt')} <Link to={loginPath}>{t('authPages.login.submit')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
