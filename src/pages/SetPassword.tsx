import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiCheckCircle, HiShieldCheck } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';
import './Login.css';

export default function SetPassword() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [tokenReady, setTokenReady] = useState(false);
    const { user, loadUser, activateToken, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const lang = useRouteLocale();
    const dashboardPath = getLocalizedPathByKey(lang, 'dashboard');

    const isEn = lang === 'en';

    // E-postadaki link: /sifre-belirle?token=JWT
    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken && !isAuthenticated) {
            activateToken(urlToken).finally(() => setTokenReady(true));
        } else {
            setTokenReady(true);
        }
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError(isEn ? 'Password must be at least 6 characters.' : 'Şifre en az 6 karakter olmalıdır.');
            return;
        }
        if (password !== confirm) {
            setError(isEn ? 'Passwords do not match.' : 'Şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.setPassword(password);
            await loadUser();
            setDone(true);
            setTimeout(() => navigate(`${dashboardPath}?tab=orders`), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || (isEn ? 'An error occurred.' : 'Bir hata oluştu.'));
        } finally {
            setLoading(false);
        }
    };

    if (!tokenReady) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: '#64748b' }}>{isEn ? 'Loading…' : 'Yükleniyor…'}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <HiCheckCircle style={{ fontSize: '3rem', color: '#22c55e', marginBottom: '1rem' }} />
                        <h2 style={{ marginBottom: '0.5rem' }}>{isEn ? 'Password set!' : 'Şifreniz oluşturuldu!'}</h2>
                        <p style={{ color: '#64748b' }}>{isEn ? 'Redirecting to your dashboard…' : 'Dashboard\'a yönlendiriliyorsunuz…'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                        <HiShieldCheck style={{ fontSize: '1.6rem', color: '#1a3a52' }} />
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1a3a52' }}>
                            {isEn ? 'Create your password' : 'Şifrenizi belirleyin'}
                        </h1>
                    </div>
                    <p className="auth-subtitle">
                        {isEn
                            ? `Welcome${user?.first_name ? `, ${user.first_name}` : ''}! Your account is ready. Set a password to access your purchases anytime.`
                            : `Hoş geldiniz${user?.first_name ? `, ${user.first_name}` : ''}! Hesabınız hazır. Satın aldığınız içeriklere her zaman erişmek için bir şifre belirleyin.`
                        }
                    </p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>{isEn ? 'Password' : 'Şifre'}</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder={isEn ? 'At least 6 characters' : 'En az 6 karakter'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{isEn ? 'Confirm Password' : 'Şifre Tekrar'}</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder={isEn ? 'Repeat your password' : 'Şifrenizi tekrar girin'}
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-auth-primary" disabled={loading}>
                            {loading
                                ? (isEn ? 'Saving…' : 'Kaydediliyor…')
                                : (isEn ? 'Set Password & Continue' : 'Şifremi Belirle ve Devam Et')
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
