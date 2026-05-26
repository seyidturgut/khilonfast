import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiMail, HiCheckCircle } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';
import './Login.css';

export default function ForgotPassword() {
    const { t } = useTranslation('common');
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';
    const loginPath = getLocalizedPathByKey(currentLang, 'login');

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmed = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setError(t('authPages.forgotPassword.errors.invalidEmail'));
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword(trimmed, isEn ? 'en' : 'tr');
            setDone(true);
        } catch (err: any) {
            setError(err?.response?.data?.error || t('authPages.forgotPassword.errors.default'));
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <HiCheckCircle style={{ fontSize: '3rem', color: '#22c55e', marginBottom: '1rem' }} />
                        <h2 style={{ marginBottom: '0.5rem' }}>{t('authPages.forgotPassword.successTitle')}</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{t('authPages.forgotPassword.successMessage')}</p>
                        <Link to={loginPath} className="btn-auth-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                            {t('authPages.forgotPassword.backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1>{t('authPages.forgotPassword.title')}</h1>
                    <p className="auth-subtitle">{t('authPages.forgotPassword.subtitle')}</p>

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
                                autoFocus
                                placeholder={t('authPages.placeholders.email')}
                            />
                        </div>

                        <button type="submit" className="btn-auth-primary" disabled={loading}>
                            {loading ? t('authPages.forgotPassword.loading') : t('authPages.forgotPassword.submit')}
                        </button>
                    </form>

                    <p className="auth-link">
                        <Link to={loginPath}>{t('authPages.forgotPassword.backToLogin')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
