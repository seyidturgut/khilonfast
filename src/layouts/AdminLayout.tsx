import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    HiHome,
    HiCog,
    HiShoppingBag,
    HiUsers,
    HiLogout,
    HiSparkles,
    HiDocumentText,
    HiUserGroup,
    HiCalendar,
    HiPlay,
    HiTicket,
    HiMail,
    HiLibrary,
    HiChartBar,
    HiCreditCard,
    HiPhotograph
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import '../styles/admin-light.css';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/giris', { replace: true });
    };

    const menuGroups: Array<{ label: string | null; items: Array<{ icon: any; label: string; path: string }> }> = [
        {
            label: null,
            items: [
                { icon: HiHome, label: 'Dashboard', path: '/admin' },
            ],
        },
        {
            label: 'İçerik Yönetimi',
            items: [
                { icon: HiDocumentText, label: 'Sayfalar', path: '/admin/pages' },
                { icon: HiShoppingBag, label: 'Ürünler', path: '/admin/products' },
                { icon: HiTicket, label: 'Kuponlar', path: '/admin/coupons' },
            ],
        },
        {
            label: 'Eğitimler',
            items: [
                { icon: HiPlay, label: 'Eğitim İçerikleri', path: '/admin/training-content' },
                { icon: HiChartBar, label: 'Eğitim Analitikleri', path: '/admin/training-analytics' },
            ],
        },
        {
            label: 'Danışmanlık',
            items: [
                { icon: HiUserGroup, label: 'Danışmanlar', path: '/admin/consultants' },
                { icon: HiCalendar, label: 'Rezervasyonlar', path: '/admin/bookings' },
            ],
        },
        {
            label: 'Ödeme',
            items: [
                { icon: HiCreditCard, label: 'Tüm Siparişler', path: '/admin/orders' },
                { icon: HiLibrary, label: 'Banka Hesapları (Lidio)', path: '/admin/bank-accounts' },
                { icon: HiLibrary, label: 'Manuel Havale Hesapları', path: '/admin/manual-bank-accounts' },
                { icon: HiTicket, label: 'Manuel Havale Siparişleri', path: '/admin/manual-orders' },
            ],
        },
        {
            label: 'Müşteri',
            items: [
                { icon: HiUsers, label: 'Kullanıcılar', path: '/admin/users' },
                { icon: HiDocumentText, label: 'Onboarding Formları', path: '/admin/onboarding-forms' },
                { icon: HiPhotograph, label: 'Reklam Analizleri', path: '/admin/eye-tracking-uploads' },
                { icon: HiCreditCard, label: 'Abonelikler', path: '/admin/subscriptions' },
            ],
        },
        {
            label: 'CRM',
            items: [
                { icon: HiChartBar, label: 'CRM Dashboard', path: '/admin/crm/dashboard' },
                { icon: HiUserGroup, label: 'Kişiler', path: '/admin/crm/contacts' },
                { icon: HiTicket, label: 'Etiketler', path: '/admin/crm/tags' },
                { icon: HiLibrary, label: 'Listeler', path: '/admin/crm/lists' },
                { icon: HiCog, label: 'Özel Alanlar', path: '/admin/crm/custom-fields' },
                { icon: HiChartBar, label: 'Skor Kuralları', path: '/admin/crm/scoring-rules' },
                { icon: HiPlay, label: 'Smart Linkler', path: '/admin/crm/smart-links' },
                { icon: HiMail, label: 'Kampanyalar', path: '/admin/crm/campaigns' },
                { icon: HiChartBar, label: 'Kampanya Analitiği', path: '/admin/crm/analytics' },
                { icon: HiDocumentText, label: 'Formlar', path: '/admin/crm/forms' },
                { icon: HiUsers, label: 'CSV Import / Export', path: '/admin/crm/import' },
                { icon: HiChartBar, label: 'Funnels', path: '/admin/crm/funnels' },
            ],
        },
        {
            label: 'Muhasebe',
            items: [
                { icon: HiDocumentText, label: 'Faturalar', path: '/admin/invoices' },
                { icon: HiCog, label: 'Paraşüt Ayarları', path: '/admin/settings' },
            ],
        },
        {
            label: 'Otomasyon',
            items: [
                { icon: HiPlay, label: 'Otomasyon Akışları', path: '/admin/automations' },
                { icon: HiMail, label: 'E-posta Şablonları', path: '/admin/email-templates' },
                { icon: HiChartBar, label: 'Otomasyon Analizi', path: '/admin/automation-logs' },
                { icon: HiSparkles, label: 'Otomasyon Test 🧪', path: '/admin/automation-test' },
            ],
        },
        {
            label: 'Sistem',
            items: [
                { icon: HiCog, label: 'Ayarlar', path: '/admin/settings' },
            ],
        },
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
                        <div className="user-name">{`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Admin'}</div>
                        <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Editor'}</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {menuGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="nav-group">
                            {group.label && (
                                <div className="nav-section-label">{group.label}</div>
                            )}
                            <ul className="nav-list">
                                {group.items.map((item) => {
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
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
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
                    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
                    font-family: 'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                /* ========== SIDEBAR ========== */
                .admin-sidebar {
                    width: 280px;
                    background: #ffffff;
                    border-right: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .sidebar-header {
                    padding: 1.75rem 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
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
                    color: #c5d63d;
                }

                .logo-text {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #1a3a52;
                    letter-spacing: -0.5px;
                }

                .logo-accent {
                    background: linear-gradient(135deg, #90aa23 0%, #c5d63d 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .logo-badge {
                    background: #eef6b6;
                    color: #4d5f09;
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 6px;
                    letter-spacing: 0.5px;
                }

                /* User Info */
                .user-info {
                    padding: 1.25rem 1.5rem;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .user-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #1a3a52 0%, #2d5570 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: white;
                    box-shadow: 0 8px 18px rgba(26, 58, 82, 0.16);
                }

                .user-details {
                    flex: 1;
                    min-width: 0;
                }

                .user-name {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .user-role {
                    font-size: 0.75rem;
                    color: #64748b;
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

                .nav-group {
                    margin-bottom: 1.1rem;
                }

                .nav-group:last-child {
                    margin-bottom: 0;
                }

                .nav-section-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 1.4px;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                    padding: 0 0.75rem;
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
                    color: #334155;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.95rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .nav-link:hover {
                    background: #f1f5f9;
                    color: #1a3a52;
                }

                .nav-link.active {
                    background: #edf5cc;
                    color: #1a3a52;
                    font-weight: 600;
                    box-shadow: inset 0 0 0 1px #d8e58a;
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
                    background: linear-gradient(180deg, #b5cb2f 0%, #c5d63d 100%);
                    border-radius: 2px;
                    box-shadow: none;
                }

                /* Footer */
                .sidebar-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    border-top: 1px solid #e2e8f0;
                }

                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 12px 14px;
                    background: #fff;
                    border: 1px solid #fecaca;
                    border-radius: 10px;
                    color: #b91c1c;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    background: #fef2f2;
                    border-color: #fca5a5;
                    transform: translateY(-1px);
                }

                .logout-icon {
                    font-size: 1.15rem;
                }

                .version-info {
                    margin-top: 1rem;
                    font-size: 0.7rem;
                    color: #94a3b8;
                    text-align: center;
                    font-weight: 500;
                }

                /* ========== MAIN CONTENT ========== */
                .admin-main {
                    flex: 1;
                    overflow-y: auto;
                    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
                }

                .admin-content {
                    padding: 2.5rem;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                /* Global Card Styles */
                .admin-content .card {
                    background: #fff !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06) !important;
                }

                /* Scrollbar */
                .sidebar-nav::-webkit-scrollbar,
                .admin-main::-webkit-scrollbar {
                    width: 6px;
                }

                .sidebar-nav::-webkit-scrollbar-track,
                .admin-main::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }

                .sidebar-nav::-webkit-scrollbar-thumb,
                .admin-main::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }

                .sidebar-nav::-webkit-scrollbar-thumb:hover,
                .admin-main::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                @media (max-width: 1024px) {
                    .admin-layout {
                        flex-direction: column;
                    }

                    .admin-sidebar {
                        width: 100%;
                    }

                    .admin-content {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}
