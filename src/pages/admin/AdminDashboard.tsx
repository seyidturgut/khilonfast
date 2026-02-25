import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { HiUserGroup, HiCurrencyDollar } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';
    const [statsData, setStatsData] = useState({
        total_users: 0,
        total_revenue: 0,
        total_orders: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${ADMIN_API_BASE}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) return;

                const data = await res.json();
                setStatsData({
                    total_users: Number(data.total_users || 0),
                    total_revenue: Number(data.total_revenue || 0),
                    total_orders: Number(data.total_orders || 0)
                });
            } catch (err) {
                console.error('Stats fetch error:', err);
            }
        };

        fetchStats();
    }, []);

    const stats = [
        {
            label: 'Toplam Kullanıcı',
            value: statsData.total_users.toLocaleString('tr-TR'),
            icon: HiUserGroup,
            color: '#1a3a52',
            bg: '#e3edf4'
        },
        {
            label: 'Toplam Gelir',
            value: `₺${statsData.total_revenue.toLocaleString('tr-TR')}`,
            icon: HiCurrencyDollar,
            color: '#4d6b00',
            bg: '#eef6d9'
        },
        {
            label: 'Toplam Sipariş',
            value: statsData.total_orders.toLocaleString('tr-TR'),
            icon: HiCurrencyDollar,
            color: '#2d5570',
            bg: '#e6eff4'
        },
    ];

    return (
        <AdminLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1a3a52', fontWeight: 800, margin: 0 }}>Hoş Geldiniz, Admin</h1>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Site genel durum özeti ve hızlı işlemler.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '12px', background: stat.bg, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#111827' }}>Hızlı İşlemler</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/admin/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>Ürün Ekle</Link>
                    <Link to="/admin/users" className="btn btn-primary" style={{ textDecoration: 'none' }}>Kullanıcılar</Link>
                    <Link to="/admin/settings" className="btn btn-primary" style={{ textDecoration: 'none' }}>Ayarları Düzenle</Link>
                </div>
            </div>
        </AdminLayout>
    );
}
