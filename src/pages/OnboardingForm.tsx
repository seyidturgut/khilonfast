import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRouteLocale } from '../utils/locale';
import api from '../services/api';
import '../styles/OnboardingForm.css';

interface FormSection {
    [key: string]: string;
}

interface SectionField {
    key: string;
    label: string;
    label_en?: string;
    type: string;
}

interface Section {
    key: string;
    title: string;
    title_en?: string;
    fields: SectionField[];
}

interface FormData {
    bolum1: FormSection;
    bolum2: FormSection;
    bolum3: FormSection;
    bolum4: FormSection;
    bolum5: FormSection;
    bolum6: FormSection;
    bolum7: FormSection;
    bolum8: FormSection;
    bolum9: FormSection;
    bolum10: FormSection;
    bolum11: FormSection;
    bolum12: FormSection;
}

const initialFormData: FormData = {
    bolum1: { firma_unvani: '', web_sitesi: '', iletisim_kisi: '', email: '' },
    bolum2: { firma_tanimi: '', gelir_getiren_urun: '', rakiplerden_fark: '' },
    bolum3: { rakip1: '', rakip1_site: '', rakip2: '', rakip2_site: '', rakip3: '', rakip3_site: '', rakip_guclu: '', rakip_zayif: '' },
    bolum4: { hedef_sektorler: '', sirket_buyuklugu: '', karar_pozisyon: '', karar_departman: '', karar_sorumluluk: '', onaylayici_pozisyon: '', onaylayici_departman: '', onaylayici_sorumluluk: '' },
    bolum5: { temel_ihtiyaclar: '', ana_problemler: '', cozum_aranan: '', iletisim_araclari: '', satin_alma_faktorleri: '' },
    bolum6: { ana_sorun: '', ikincil_sorun: '', diger_problemler: '', ana_fayda: '', ikincil_fayda: '', diger_faydalar: '' },
    bolum7: { satin_alma_adimlari: '', karar_faktorleri: '', gerekli_belgeler: '', referans_turleri: '' },
    bolum8: { hizmet_sonrasi_beklenti: '', kpi_iyilestirme: '' },
    bolum9: { onceki_kanallar: '', en_iyi_kanal: '', aylik_lead: '' },
    bolum10: { crm_kullanimi: '', analytics_kurulum: '', conversion_tracking: '' },
    bolum11: { iletisim_kisi_operasyon: '', onay_suresi: '' },
    bolum12: { buyume_engeli: '', pazarlama_problemi: '', is_birligi_beklenti: '' },
};

const sections: Section[] = [
    {
        key: 'bolum1', title: 'Bölüm 1: Temel Bilgiler', title_en: 'Section 1: Basic Information',
        fields: [
            { key: 'firma_unvani', label: 'Firma Ünvanı', label_en: 'Company Name', type: 'text' },
            { key: 'web_sitesi', label: 'Web Sitesi', label_en: 'Website', type: 'text' },
            { key: 'iletisim_kisi', label: 'İletişim Kişisi / Ünvan', label_en: 'Contact Person / Title', type: 'text' },
            { key: 'email', label: 'Email', label_en: 'Email', type: 'email' },
        ]
    },
    {
        key: 'bolum2', title: 'Bölüm 2: İş & Ürün Tanımı', title_en: 'Section 2: Business & Product Definition',
        fields: [
            { key: 'firma_tanimi', label: 'Firma Tanımı (Ne yapıyorsunuz? Kısaca anlatın)', label_en: 'Company Description (What do you do? Brief overview)', type: 'textarea' },
            { key: 'gelir_getiren_urun', label: 'En Çok Gelir Getiren Ürün/Hizmet', label_en: 'Top Revenue-Generating Product/Service', type: 'textarea' },
            { key: 'rakiplerden_fark', label: 'Rakiplerden Farkınız Nedir?', label_en: 'What Sets You Apart from Competitors?', type: 'textarea' },
        ]
    },
    {
        key: 'bolum3', title: 'Bölüm 3: Rekabet Analizi', title_en: 'Section 3: Competitive Analysis',
        fields: [
            { key: 'rakip1', label: 'Rakip 1 — Firma Adı', label_en: 'Competitor 1 — Company Name', type: 'text' },
            { key: 'rakip1_site', label: 'Rakip 1 — Web Sitesi', label_en: 'Competitor 1 — Website', type: 'text' },
            { key: 'rakip2', label: 'Rakip 2 — Firma Adı', label_en: 'Competitor 2 — Company Name', type: 'text' },
            { key: 'rakip2_site', label: 'Rakip 2 — Web Sitesi', label_en: 'Competitor 2 — Website', type: 'text' },
            { key: 'rakip3', label: 'Rakip 3 — Firma Adı', label_en: 'Competitor 3 — Company Name', type: 'text' },
            { key: 'rakip3_site', label: 'Rakip 3 — Web Sitesi', label_en: 'Competitor 3 — Website', type: 'text' },
            { key: 'rakip_guclu', label: 'Rakiplerin Güçlü Olduğu Alanlar', label_en: 'Competitors\' Strengths', type: 'textarea' },
            { key: 'rakip_zayif', label: 'Rakiplerin Zayıf Olduğu Alanlar', label_en: 'Competitors\' Weaknesses', type: 'textarea' },
        ]
    },
    {
        key: 'bolum4', title: 'Bölüm 4: Hedef Kitle & Organizasyon', title_en: 'Section 4: Target Audience & Organization',
        fields: [
            { key: 'hedef_sektorler', label: 'Hedef Sektörler', label_en: 'Target Industries', type: 'textarea' },
            { key: 'sirket_buyuklugu', label: 'Hedef Şirket Büyüklüğü (çalışan sayısı, ciro vb.)', label_en: 'Target Company Size (headcount, revenue, etc.)', type: 'text' },
            { key: 'karar_pozisyon', label: 'Karar Verici Pozisyon', label_en: 'Decision Maker Position', type: 'text' },
            { key: 'karar_departman', label: 'Karar Verici Departman', label_en: 'Decision Maker Department', type: 'text' },
            { key: 'karar_sorumluluk', label: 'Karar Vericinin Sorumluluk ve Yetkileri', label_en: 'Decision Maker\'s Responsibilities & Authority', type: 'textarea' },
            { key: 'onaylayici_pozisyon', label: 'Onaylayıcı Pozisyon', label_en: 'Approver Position', type: 'text' },
            { key: 'onaylayici_departman', label: 'Onaylayıcı Departman', label_en: 'Approver Department', type: 'text' },
            { key: 'onaylayici_sorumluluk', label: 'Onaylayıcının Sorumlulukları', label_en: 'Approver\'s Responsibilities', type: 'textarea' },
        ]
    },
    {
        key: 'bolum5', title: 'Bölüm 5: Müşteri İhtiyaç & Problem Haritası', title_en: 'Section 5: Customer Needs & Problem Map',
        fields: [
            { key: 'temel_ihtiyaclar', label: 'Hedef Kitlenizin Temel İhtiyaçları', label_en: 'Core Needs of Your Target Audience', type: 'textarea' },
            { key: 'ana_problemler', label: 'Yaşadıkları Ana Problemler', label_en: 'Main Problems They Face', type: 'textarea' },
            { key: 'cozum_aranan', label: 'Çözüm Aradıkları Konular', label_en: 'Topics They Seek Solutions For', type: 'textarea' },
            { key: 'iletisim_araclari', label: 'Kullandıkları İletişim Araçları (LinkedIn, email, vb.)', label_en: 'Communication Channels They Use (LinkedIn, email, etc.)', type: 'text' },
            { key: 'satin_alma_faktorleri', label: 'Satın Alma Kararlarını Etkileyen Faktörler', label_en: 'Factors Influencing Purchase Decisions', type: 'textarea' },
        ]
    },
    {
        key: 'bolum6', title: 'Bölüm 6: Değer Önerileri', title_en: 'Section 6: Value Propositions',
        fields: [
            { key: 'ana_sorun', label: 'Çözülen Ana Sorun', label_en: 'Primary Problem Solved', type: 'textarea' },
            { key: 'ikincil_sorun', label: 'Çözülen İkincil Sorun', label_en: 'Secondary Problem Solved', type: 'textarea' },
            { key: 'diger_problemler', label: 'Diğer Çözülen Problemler', label_en: 'Other Problems Solved', type: 'textarea' },
            { key: 'ana_fayda', label: 'Ana Fayda', label_en: 'Primary Benefit', type: 'textarea' },
            { key: 'ikincil_fayda', label: 'İkincil Fayda', label_en: 'Secondary Benefit', type: 'textarea' },
            { key: 'diger_faydalar', label: 'Diğer Faydalar', label_en: 'Other Benefits', type: 'textarea' },
        ]
    },
    {
        key: 'bolum7', title: 'Bölüm 7: Satın Alma Davranışı', title_en: 'Section 7: Buying Behavior',
        fields: [
            { key: 'satin_alma_adimlari', label: 'Satın Alma Süreci Adımları', label_en: 'Steps in the Buying Process', type: 'textarea' },
            { key: 'karar_faktorleri', label: 'Karar Faktörleri (fiyat, kalite, referans vb.)', label_en: 'Decision Factors (price, quality, references, etc.)', type: 'textarea' },
            { key: 'gerekli_belgeler', label: 'Gerekli Bilgi/Belgeler', label_en: 'Required Information/Documents', type: 'textarea' },
            { key: 'referans_turleri', label: 'Önem Verilen Referans Türleri', label_en: 'Types of References That Matter', type: 'textarea' },
        ]
    },
    {
        key: 'bolum8', title: 'Bölüm 8: Beklenti & Sonuç', title_en: 'Section 8: Expectations & Outcomes',
        fields: [
            { key: 'hizmet_sonrasi_beklenti', label: 'Hizmet Sonrası Beklenti', label_en: 'Post-Service Expectations', type: 'textarea' },
            { key: 'kpi_iyilestirme', label: 'İyileştirilmek İstenen KPI\'lar', label_en: 'KPIs to Improve', type: 'textarea' },
        ]
    },
    {
        key: 'bolum9', title: 'Bölüm 9: Kanal & Performans', title_en: 'Section 9: Channels & Performance',
        fields: [
            { key: 'onceki_kanallar', label: 'Daha Önce Kullanılan Pazarlama Kanalları', label_en: 'Previously Used Marketing Channels', type: 'textarea' },
            { key: 'en_iyi_kanal', label: 'En İyi Performans Gelen Kanal', label_en: 'Best Performing Channel', type: 'text' },
            { key: 'aylik_lead', label: 'Aylık Lead Sayısı (yaklaşık)', label_en: 'Monthly Lead Count (approximate)', type: 'text' },
        ]
    },
    {
        key: 'bolum10', title: 'Bölüm 10: Teknoloji & Altyapı', title_en: 'Section 10: Technology & Infrastructure',
        fields: [
            { key: 'crm_kullanimi', label: 'CRM Kullanımı (hangi araç, aktif mi?)', label_en: 'CRM Usage (which tool, is it active?)', type: 'text' },
            { key: 'analytics_kurulum', label: 'Analytics Kurulumu (GA4, Pixel vb.)', label_en: 'Analytics Setup (GA4, Pixel, etc.)', type: 'text' },
            { key: 'conversion_tracking', label: 'Conversion Tracking (var mı, hangi araçlar?)', label_en: 'Conversion Tracking (do you have it, which tools?)', type: 'text' },
        ]
    },
    {
        key: 'bolum11', title: 'Bölüm 11: Operasyon Süreci', title_en: 'Section 11: Operational Process',
        fields: [
            { key: 'iletisim_kisi_operasyon', label: 'Bizimle İletişimde Olacak Kişi / Ünvan', label_en: 'Point of Contact for Our Team / Title', type: 'text' },
            { key: 'onay_suresi', label: 'Onay Süresi (içerik, raporlama vb. için beklenen gün)', label_en: 'Approval Timeline (expected days for content, reports, etc.)', type: 'text' },
        ]
    },
    {
        key: 'bolum12', title: 'Bölüm 12: Stratejik Gerçekler', title_en: 'Section 12: Strategic Realities',
        fields: [
            { key: 'buyume_engeli', label: 'Büyümenin Önündeki En Büyük Engel', label_en: 'Biggest Obstacle to Growth', type: 'textarea' },
            { key: 'pazarlama_problemi', label: 'Pazarlamada Yaşanan En Büyük Problem', label_en: 'Biggest Marketing Challenge', type: 'textarea' },
            { key: 'is_birligi_beklenti', label: 'İş Birliğinden Beklentiniz', label_en: 'What You Expect from This Partnership', type: 'textarea' },
        ]
    },
];

export default function OnboardingForm() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [currentSection, setCurrentSection] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [productNames, setProductNames] = useState('');

    const dashboardPath = isEn ? '/en/dashboard' : '/dashboard';

    useEffect(() => {
        if (!user) {
            navigate(isEn ? '/en/login' : '/giris');
            return;
        }
        if (!orderId) {
            navigate(dashboardPath);
            return;
        }
        api.get(`/onboarding-form/order/${orderId}`).then(res => {
            if (res.data.exists) setAlreadySubmitted(true);
        }).catch(() => {});

        api.get(`/orders/${orderId}`).then(res => {
            const order = res.data.order || res.data;
            if (order?.items) {
                const names = order.items.map((i: any) => i.name).join(', ');
                setProductNames(names);
            }
        }).catch(() => {});
    }, [orderId]);

    const updateField = (section: keyof FormData, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/onboarding-form', {
                order_id: Number(orderId),
                product_names: productNames,
                form_data: formData
            });
            navigate(`${dashboardPath}?tab=orders&onboarding=done`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Form gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    if (alreadySubmitted) {
        return (
            <div className="onboarding-page">
                <div className="onboarding-container">
                    <div className="onboarding-already-done">
                        <div className="onboarding-check">✓</div>
                        <h2>{isEn ? 'Form Already Submitted' : 'Form Daha Önce Gönderildi'}</h2>
                        <p>{isEn ? 'You have already submitted the onboarding form for this order. Our team will get back to you shortly.' : 'Bu sipariş için onboarding formunu zaten doldurdunuz. Ekibimiz en kısa sürede sizinle iletişime geçecektir.'}</p>
                        <button className="onboarding-btn-primary" onClick={() => navigate(dashboardPath)}>
                            {isEn ? 'Back to Dashboard' : 'Dashboard\'a Dön'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const section = sections[currentSection];
    const sectionKey = section.key as keyof FormData;
    const isLast = currentSection === sections.length - 1;
    const progress = Math.round(((currentSection + 1) / sections.length) * 100);

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                <div className="onboarding-header">
                    <h1>{isEn ? 'B2B Growth Onboarding Form' : 'B2B Growth Onboarding Formu'}</h1>
                    {productNames && <p className="onboarding-product-name">{productNames}</p>}
                    <p className="onboarding-intro">
                        {isEn
                            ? 'Please fill out the form below so our team can provide you with the best service. This information will form the foundation of our strategy process.'
                            : 'Ekibimizin size en iyi hizmeti sunabilmesi için lütfen aşağıdaki formu doldurun. Bu bilgiler strateji sürecimizin temelini oluşturacaktır.'}
                    </p>
                </div>

                <div className="onboarding-progress-bar">
                    <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="onboarding-progress-text">{currentSection + 1} / {sections.length} — {progress}%</p>

                <div className="onboarding-section">
                    <h2 className="onboarding-section-title">{isEn ? (section.title_en || section.title) : section.title}</h2>

                    {section.fields.map(field => {
                        const displayLabel = isEn ? (field.label_en || field.label) : field.label;
                        return (
                            <div className="onboarding-field" key={field.key}>
                                <label>{displayLabel}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={formData[sectionKey][field.key] || ''}
                                        onChange={e => updateField(sectionKey, field.key, e.target.value)}
                                        rows={3}
                                        placeholder={isEn ? `Enter ${displayLabel.toLowerCase()}...` : `${field.label} giriniz...`}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        value={formData[sectionKey][field.key] || ''}
                                        onChange={e => updateField(sectionKey, field.key, e.target.value)}
                                        placeholder={isEn ? `Enter ${displayLabel.toLowerCase()}...` : `${field.label} giriniz...`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {error && <p className="onboarding-error">{error}</p>}

                <div className="onboarding-nav">
                    {currentSection > 0 && (
                        <button className="onboarding-btn-secondary" onClick={() => setCurrentSection(s => s - 1)}>
                            {isEn ? '← Previous' : '← Önceki'}
                        </button>
                    )}
                    {!isLast ? (
                        <button className="onboarding-btn-primary" onClick={() => setCurrentSection(s => s + 1)}>
                            {isEn ? 'Next →' : 'Sonraki →'}
                        </button>
                    ) : (
                        <button className="onboarding-btn-submit" onClick={handleSubmit} disabled={loading}>
                            {loading ? (isEn ? 'Submitting...' : 'Gönderiliyor...') : (isEn ? 'Submit Form' : 'Formu Gönder')}
                        </button>
                    )}
                </div>

                <p className="onboarding-skip">
                    {isEn ? 'Want to fill it out later?' : 'Daha sonra doldurmak ister misiniz?'}{' '}
                    <button className="onboarding-link" onClick={() => navigate(dashboardPath)}>
                        {isEn ? 'Back to dashboard' : 'Dashboard\'a dön'}
                    </button>
                </p>
            </div>
        </div>
    );
}
