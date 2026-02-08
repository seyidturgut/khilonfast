import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HiHome,
    HiCog,
    HiDocumentText,
    HiShoppingBag,
    HiUsers,
    HiLogout,
    HiSparkles
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import '../styles/admin-dark.css';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const { logout, user } = useAuth();

    const menuItems = [
        { icon: HiHome, label: 'Dashboard', path: '/admin' },
        { icon: HiDocumentText, label: 'Sayfalar', path: '/admin/pages' },
        { icon: HiShoppingBag, label: 'Ürünler', path: '/admin/products' },
        { icon: HiUsers, label: 'Kullanıcılar', path: '/admin/users' },
        { icon: HiCog, label: 'Ayarlar', path: '/admin/settings' },
    ];

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                {/* Logo */}
                <div className="sidebar-header">
                    <div className="logo-container">
                        <HiSparkles className="logo-icon" />
                        <h2 className="logo-text">
                            Khilon<span className="logo-accent">CMS</span>
                        </h2>
                    </div>
                    <div className="logo-badge">PRO</div>
                </div>

                {/* User Info */}
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="user-details">
                        <div className="user-name">{user?.name || 'Admin'}</div>
                        <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Editor'}</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <div className="nav-section-label">MENÜ</div>
                    <ul className="nav-list">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/admin' && location.pathname.startsWith(item.path));
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`nav-link ${isActive ? 'active' : ''}`}
                                    >
                                        <item.icon className="nav-icon" />
                                        <span className="nav-label">{item.label}</span>
                                        {isActive && <div className="nav-indicator" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button onClick={logout} className="logout-btn">
                        <HiLogout className="logout-icon" />
                        <span>Çıkış Yap</span>
                    </button>
                    <div className="version-info">v1.0.0 • Khilon Admin</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-content">
                    {children}
                </div>
            </main>

            <style>{`
                .admin-layout {
                    display: flex;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                /* ========== SIDEBAR ========== */
                .admin-sidebar {
                    width: 280px;
                    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
                    border-right: 1px solid rgba(148, 163, 184, 0.1);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    backdrop-filter: blur(10px);
                }

                .sidebar-header {
                    padding: 1.75rem 1.5rem;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-icon {
                    font-size: 1.75rem;
                    color: #f59e0b;
                    filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
                }

                .logo-text {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #f8fafc;
                    letter-spacing: -0.5px;
                }

                .logo-accent {
                    background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .logo-badge {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: #1e293b;
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 6px;
                    letter-spacing: 0.5px;
                }

                /* User Info */
                .user-info {
                    padding: 1.25rem 1.5rem;
                    background: rgba(15, 23, 42, 0.4);
                    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .user-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: white;
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
                }

                .user-details {
                    flex: 1;
                    min-width: 0;
                }

                .user-name {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #f8fafc;
                    margin-bottom: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .user-role {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 500;
                }

                /* Navigation */
                .sidebar-nav {
                    flex: 1;
                    padding: 1.5rem 1rem;
                    overflow-y: auto;
                }

                .nav-section-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #64748b;
                    letter-spacing: 1.2px;
                    margin-bottom: 0.75rem;
                    padding: 0 0.5rem;
                }

                .nav-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px;
                    border-radius: 10px;
                    color: #cbd5e1;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.95rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .nav-link:hover {
                    background: rgba(14, 165, 233, 0.1);
                    color: #0ea5e9;
                    transform: translateX(2px);
                }

                .nav-link.active {
                    background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
                    color: #0ea5e9;
                    font-weight: 600;
                    box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);
                }

                .nav-icon {
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                .nav-label {
                    flex: 1;
                }

                .nav-indicator {
                    width: 4px;
                    height: 20px;
                    background: linear-gradient(180deg, #0ea5e9 0%, #06b6d4 100%);
                    border-radius: 2px;
                    box-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
                }

                /* Footer */
                .sidebar-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    border-top: 1px solid rgba(148, 163, 184, 0.1);
                }

                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 12px 14px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 10px;
                    color: #f87171;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.3);
                    transform: translateY(-1px);
                }

                .logout-icon {
                    font-size: 1.15rem;
                }

                .version-info {
                    margin-top: 1rem;
                    font-size: 0.7rem;
                    color: #475569;
                    text-align: center;
                    font-weight: 500;
                }

                /* ========== MAIN CONTENT ========== */
                .admin-main {
                    flex: 1;
                    overflow-y: auto;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                }

                .admin-content {
                    padding: 2.5rem;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                /* Global Card Styles */
                .admin-content .card {
                    background: rgba(30, 41, 59, 0.6) !important;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(148, 163, 184, 0.1) !important;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2) !important;
                }

                /* Scrollbar */
                .sidebar-nav::-webkit-scrollbar,
                .admin-main::-webkit-scrollbar {
                    width: 6px;
                }

                .sidebar-nav::-webkit-scrollbar-track,
                .admin-main::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                }

                .sidebar-nav::-webkit-scrollbar-thumb,
                .admin-main::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.3);
                    border-radius: 3px;
                }

                .sidebar-nav::-webkit-scrollbar-thumb:hover,
                .admin-main::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.5);
                }
            `}</style>
        </div>
    );
}
