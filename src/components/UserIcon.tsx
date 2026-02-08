import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import './UserIcon.css';

export default function UserIcon() {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleLogin = () => {
        setIsDropdownOpen(false);
        navigate('/login');
    };

    const handleRegister = () => {
        setIsDropdownOpen(false);
        navigate('/register');
    };

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
    };

    return (
        <div className="user-icon-container" ref={dropdownRef}>
            <button
                className="user-icon-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label={user ? 'Kullanıcı Menüsü' : 'Giriş Yap'}
            >
                <HiOutlineUser />
            </button>

            {isDropdownOpen && (
                <div className="user-dropdown">
                    {user ? (
                        <>
                            <div className="user-dropdown-header">
                                <div className="user-name">{user.first_name} {user.last_name}</div>
                                <div className="user-email">{user.email}</div>
                            </div>
                            <div className="user-dropdown-divider"></div>
                            {user && (user.role === 'admin' || user.role === 'editor') && (
                                <button
                                    className="user-dropdown-item"
                                    onClick={() => { setIsDropdownOpen(false); navigate('/admin'); }}
                                    style={{ color: '#0ea5e9', fontWeight: 600 }}
                                >
                                    Yönetim Paneli
                                </button>
                            )}
                            <button className="user-dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/dashboard'); }}>
                                Hesabım
                            </button>
                            <button className="user-dropdown-item" onClick={handleLogout}>
                                Çıkış Yap
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="user-dropdown-item" onClick={handleLogin}>
                                Giriş Yap
                            </button>
                            <button className="user-dropdown-item" onClick={handleRegister}>
                                Kayıt Ol
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
