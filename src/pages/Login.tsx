import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.must_change_password) {
                navigate('/dashboard?tab=password&forcePasswordChange=true');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loggedInUser = await login(email, password);
            if (loggedInUser.role === 'admin') {
                navigate('/admin');
            } else if (loggedInUser.must_change_password) {
                navigate('/dashboard?tab=password&forcePasswordChange=true');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Giriş başarısız');
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
                <div className="auth-card">
                    <h1>Giriş Yap</h1>
                    <p className="auth-subtitle">Hesabınıza giriş yapın</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">
                                <HiMail /> E-posta
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="ornek@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <HiLockClosed /> Şifre
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
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>veya</span>
                    </div>
                    <div className="auth-google">
                        <GoogleLoginButton onCredential={handleGoogleCredential} />
                    </div>

                    <p className="auth-link">
                        Hesabınız yok mu? <Link to="/kayil-ol">Kayıt Ol</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
