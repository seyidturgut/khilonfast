import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { HiUserGroup, HiCurrencyDollar, HiDocumentText } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    // These stats would normally come from an API
    const stats = [
        { label: 'Toplam Kullanıcı', value: '1,234', icon: HiUserGroup, color: '#3b82f6', bg: '#dbeafe' },
        { label: 'Toplam Gelir', value: '₺874,000', icon: HiCurrencyDollar, color: '#10b981', bg: '#d1fae5' },
        { label: 'Aktif Sayfalar', value: '24', icon: HiDocumentText, color: '#8b5cf6', bg: '#ede9fe' },
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
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/admin/pages" className="btn btn-primary" style={{ textDecoration: 'none', background: '#3b82f6' }}>Yeni Sayfa Oluştur</Link>
                    <Link to="/admin/products" className="btn btn-primary" style={{ textDecoration: 'none', background: '#10b981' }}>Ürün Ekle</Link>
                    <Link to="/admin/settings" className="btn btn-primary" style={{ textDecoration: 'none', background: '#6366f1' }}>Ayarları Düzenle</Link>
                </div>
            </div>
        </AdminLayout>
    );
}
