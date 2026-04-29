import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';

const ADMIN_API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const FIELD_LABELS: Record<string, string> = {
    firma_unvani: 'Firma Ünvanı', web_sitesi: 'Web Sitesi', iletisim_kisi: 'İletişim Kişisi / Ünvan', email: 'Email',
    firma_tanimi: 'Firma Tanımı', gelir_getiren_urun: 'En Çok Gelir Getiren Ürün/Hizmet', rakiplerden_fark: 'Rakiplerden Farkınız',
    rakip1: 'Rakip 1 — Firma Adı', rakip1_site: 'Rakip 1 — Web Sitesi', rakip2: 'Rakip 2 — Firma Adı', rakip2_site: 'Rakip 2 — Web Sitesi',
    rakip3: 'Rakip 3 — Firma Adı', rakip3_site: 'Rakip 3 — Web Sitesi',
    rakip_guclu: 'Rakiplerin Güçlü Alanları', rakip_zayif: 'Rakiplerin Zayıf Alanları',
    hedef_sektorler: 'Hedef Sektörler', sirket_buyuklugu: 'Hedef Şirket Büyüklüğü',
    karar_pozisyon: 'Karar Verici Pozisyon', karar_departman: 'Karar Verici Departman', karar_sorumluluk: 'Karar Vericinin Sorumlulukları',
    onaylayici_pozisyon: 'Onaylayıcı Pozisyon', onaylayici_departman: 'Onaylayıcı Departman', onaylayici_sorumluluk: 'Onaylayıcının Sorumlulukları',
    temel_ihtiyaclar: 'Temel İhtiyaçlar', ana_problemler: 'Ana Problemler', cozum_aranan: 'Çözüm Aradıkları Konular',
    iletisim_araclari: 'İletişim Araçları', satin_alma_faktorleri: 'Satın Alma Faktörleri',
    ana_sorun: 'Çözülen Ana Sorun', ikincil_sorun: 'Çözülen İkincil Sorun', diger_problemler: 'Diğer Çözülen Problemler',
    ana_fayda: 'Ana Fayda', ikincil_fayda: 'İkincil Fayda', diger_faydalar: 'Diğer Faydalar',
    satin_alma_adimlari: 'Satın Alma Adımları', karar_faktorleri: 'Karar Faktörleri', gerekli_belgeler: 'Gerekli Belgeler', referans_turleri: 'Referans Türleri',
    hizmet_sonrasi_beklenti: 'Hizmet Sonrası Beklenti', kpi_iyilestirme: 'İyileştirilmek İstenen KPIlar',
    onceki_kanallar: 'Önceki Kanallar', en_iyi_kanal: 'En İyi Kanal', aylik_lead: 'Aylık Lead',
    crm_kullanimi: 'CRM Kullanımı', analytics_kurulum: 'Analytics Kurulumu', conversion_tracking: 'Conversion Tracking',
    iletisim_kisi_operasyon: 'Operasyon İletişim Kişisi', onay_suresi: 'Onay Süresi',
    buyume_engeli: 'Büyüme Engeli', pazarlama_problemi: 'Pazarlama Problemi', is_birligi_beklenti: 'İş Birliği Beklentisi',
};

const SECTION_TITLES: Record<string, string> = {
    bolum1: 'Temel Bilgiler', bolum2: 'İş & Ürün Tanımı', bolum3: 'Rekabet Analizi',
    bolum4: 'Hedef Kitle & Organizasyon', bolum5: 'Müşteri İhtiyaç & Problem', bolum6: 'Değer Önerileri',
    bolum7: 'Satın Alma Davranışı', bolum8: 'Beklenti & Sonuç', bolum9: 'Kanal & Performans',
    bolum10: 'Teknoloji & Altyapı', bolum11: 'Operasyon Süreci', bolum12: 'Stratejik Gerçekler',
};

interface FormRow {
    id: number;
    user_id: number;
    order_id: number;
    user_name: string;
    user_email: string;
    order_number: string;
    product_names: string;
    status: 'new' | 'reviewed';
    submitted_at: string;
}

interface FormDetail extends FormRow {
    form_data: Record<string, Record<string, string>>;
}

export default function OnboardingFormsList() {
    const [forms, setForms] = useState<FormRow[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedForm, setSelectedForm] = useState<FormDetail | null>(null);
    const [panelLoading, setPanelLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    const token = localStorage.getItem('token');

    const fetchForms = useCallback(async (p = page, s = search, sf = statusFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p) });
            if (s) params.set('search', s);
            if (sf) params.set('status', sf);
            const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/all?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setForms(data.forms || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchForms(1, search, statusFilter); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchForms(1, search, statusFilter);
    };

    const handleStatusFilter = (sf: string) => {
        setStatusFilter(sf);
        setPage(1);
        fetchForms(1, search, sf);
    };

    const openPanel = async (row: FormRow) => {
        setPanelLoading(true);
        const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${row.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const detail: FormDetail = await res.json();
        setSelectedForm(detail);
        setPanelLoading(false);

        // Yeni formsa otomatik reviewed yap
        if (row.status === 'new') {
            await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${row.id}/status`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'reviewed' })
            });
            setForms(prev => prev.map(f => f.id === row.id ? { ...f, status: 'reviewed' } : f));
        }
    };

    const downloadPdf = async (formId: number, orderNumber: string) => {
        setPdfLoading(true);
        try {
            const res = await fetch(`${ADMIN_API_BASE}/onboarding-form/admin/${formId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `onboarding-${orderNumber}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Onboarding Formları</h1>
                        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>{total} form</p>
                    </div>
                </div>

                {/* Filtreler */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="İsim veya email ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', width: '240px' }}
                        />
                        <button type="submit" style={{ padding: '8px 16px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Ara</button>
                    </form>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[{ val: '', label: 'Tümü' }, { val: 'new', label: 'Yeni' }, { val: 'reviewed', label: 'İncelendi' }].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => handleStatusFilter(opt.val)}
                                style={{
                                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #d1d5db',
                                    background: statusFilter === opt.val ? '#0f766e' : '#fff',
                                    color: statusFilter === opt.val ? '#fff' : '#374151',
                                    cursor: 'pointer', fontSize: '0.875rem', fontWeight: statusFilter === opt.val ? 600 : 400
                                }}
                            >{opt.label}</button>
                        ))}
                    </div>
                </div>

                {/* Tablo */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                {['Kullanıcı', 'Sipariş No', 'Ürün', 'Tarih', 'Durum', 'Aksiyonlar'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Yükleniyor…</td></tr>
                            ) : forms.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Form bulunamadı</td></tr>
                            ) : forms.map(form => (
                                <tr key={form.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '10px 14px' }}>
                                        <div style={{ fontWeight: 600, color: '#111827' }}>{form.user_name}</div>
                                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{form.user_email}</div>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#374151' }}>#{form.order_number}</td>
                                    <td style={{ padding: '10px 14px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {form.product_names || '—'}
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                        {new Date(form.submitted_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                            background: form.status === 'new' ? '#fef3c7' : '#d1fae5',
                                            color: form.status === 'new' ? '#92400e' : '#065f46'
                                        }}>
                                            {form.status === 'new' ? 'Yeni' : 'İncelendi'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => openPanel(form)}
                                                style={{ padding: '5px 12px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >Görüntüle</button>
                                            <button
                                                onClick={() => downloadPdf(form.id, form.order_number)}
                                                disabled={pdfLoading}
                                                style={{ padding: '5px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >PDF</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
                        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => { setPage(p); fetchForms(p, search, statusFilter); }}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: p === page ? '#0f766e' : '#fff', color: p === page ? '#fff' : '#374151', cursor: 'pointer' }}>
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Slideout Panel */}
            {(selectedForm || panelLoading) && (
                <>
                    <div
                        onClick={() => setSelectedForm(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
                    />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: '560px', maxWidth: '100vw',
                        background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column',
                        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)'
                    }}>
                        {panelLoading ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Yükleniyor…</div>
                        ) : selectedForm && (
                            <>
                                {/* Panel header */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#0f766e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedForm.user_name}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{selectedForm.user_email} · #{selectedForm.order_number}</div>
                                        {selectedForm.product_names && <div style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: '2px' }}>{selectedForm.product_names}</div>}
                                    </div>
                                    <button onClick={() => setSelectedForm(null)}
                                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                                </div>

                                {/* Form içeriği */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                                    {Object.entries(selectedForm.form_data || {}).map(([bolumKey, fields]) => {
                                        const sectionTitle = SECTION_TITLES[bolumKey] || bolumKey;
                                        const entries = Object.entries(fields).filter(([, v]) => v);
                                        if (entries.length === 0) return null;
                                        return (
                                            <div key={bolumKey} style={{ marginBottom: '20px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>
                                                    {sectionTitle}
                                                </div>
                                                {entries.map(([fieldKey, value]) => (
                                                    <div key={fieldKey} style={{ marginBottom: '10px' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>
                                                            {FIELD_LABELS[fieldKey] || fieldKey}
                                                        </div>
                                                        <div style={{ fontSize: '0.875rem', color: '#111827', background: '#f9fafb', borderRadius: '6px', padding: '8px 10px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                            {value}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Panel footer */}
                                <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', background: '#f9fafb' }}>
                                    <button
                                        onClick={() => downloadPdf(selectedForm.id, selectedForm.order_number)}
                                        disabled={pdfLoading}
                                        style={{ flex: 1, padding: '10px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                                    >PDF İndir</button>
                                    <button onClick={() => setSelectedForm(null)}
                                        style={{ padding: '10px 16px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>Kapat</button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
