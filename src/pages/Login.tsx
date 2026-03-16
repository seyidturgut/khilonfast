import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './Login.css';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';

export default function Login() {
    const { t } = useTranslation('common');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin, user } = useAuth();
    const navigate = useNavigate();
    const currentLang = useRouteLocale();
    const dashboardPath = getLocalizedPathByKey(currentLang, 'dashboard');
    const registerPath = getLocalizedPathByKey(currentLang, 'register');

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.must_change_password) {
                navigate(`${dashboardPath}?tab=password&forcePasswordChange=true`);
            } else {
                navigate(dashboardPath);
            }
        }
    }, [dashboardPath, user, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loggedInUser = await login(email, password);
            if (loggedInUser.role === 'admin') {
                navigate('/admin');
            } else if (loggedInUser.must_change_password) {
                navigate(`${dashboardPath}?tab=password&forcePasswordChange=true`);
            } else {
                navigate(dashboardPath);
            }
        } catch (err: any) {
            setError(err.message || t('authPages.login.errors.default'));
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
            setError(err.message || t('authPages.login.errors.google'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1>{t('authPages.login.title')}</h1>
                    <p className="auth-subtitle">{t('authPages.login.subtitle')}</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">
                                <HiMail /> {t('authPages.fields.email')}
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder={t('authPages.placeholders.email')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <HiLockClosed /> {t('authPages.fields.password')}
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <button type="submit" className="btn-auth-primary" disabled={loading}>
                            {loading ? t('authPages.login.loading') : t('authPages.login.submit')}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>{t('authPages.or')}</span>
                    </div>
                    <div className="auth-google">
                        <GoogleLoginButton onCredential={handleGoogleCredential} />
                    </div>

                    <p className="auth-link">
                        {t('authPages.login.switchPrompt')} <Link to={registerPath}>{t('authPages.register.submit')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
