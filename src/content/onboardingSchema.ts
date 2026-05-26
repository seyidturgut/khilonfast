// src/content/onboardingSchema.ts
// Onboarding form 12 bölüm + field tanımları — TEK YERDEN.
// OnboardingForm.tsx, OnboardingFormsList.tsx ve OnboardingPresentation.tsx import eder.

export type OnboardingFieldType = 'text' | 'textarea' | 'email';

export interface OnboardingField {
    key: string;
    label: string;
    label_en: string;
    type: OnboardingFieldType;
}

export interface OnboardingSection {
    key: string;          // 'bolum1' ... 'bolum12'
    title: string;        // TR başlık
    title_en: string;     // EN başlık
    description?: string;
    description_en?: string;
    fields: OnboardingField[];
}

export const ONBOARDING_SECTIONS: OnboardingSection[] = [
    {
        key: 'bolum1', title: 'Temel Bilgiler', title_en: 'Basic Information',
        description: 'Firma ve iletişim bilgileri',
        description_en: 'Company and contact details',
        fields: [
            { key: 'firma_unvani', label: 'Firma Ünvanı', label_en: 'Company Name', type: 'text' },
            { key: 'web_sitesi', label: 'Web Sitesi', label_en: 'Website', type: 'text' },
            { key: 'iletisim_kisi', label: 'İletişim Kişisi / Ünvan', label_en: 'Contact Person / Title', type: 'text' },
            { key: 'email', label: 'Email', label_en: 'Email', type: 'email' },
        ]
    },
    {
        key: 'bolum2', title: 'İş & Ürün Tanımı', title_en: 'Business & Product Definition',
        description: 'Ne yaptığınızı ve farkınızı anlatın',
        description_en: 'Tell us what you do and your differentiator',
        fields: [
            { key: 'firma_tanimi', label: 'Firma Tanımı (Ne yapıyorsunuz? Kısaca anlatın)', label_en: 'Company Description (What do you do? Brief overview)', type: 'textarea' },
            { key: 'gelir_getiren_urun', label: 'En Çok Gelir Getiren Ürün/Hizmet', label_en: 'Top Revenue-Generating Product/Service', type: 'textarea' },
            { key: 'rakiplerden_fark', label: 'Rakiplerden Farkınız Nedir?', label_en: 'What Sets You Apart from Competitors?', type: 'textarea' },
        ]
    },
    {
        key: 'bolum3', title: 'Rekabet Analizi', title_en: 'Competitive Analysis',
        description: '3 rakip + güçlü/zayıf analizi',
        description_en: '3 competitors + strengths/weaknesses',
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
        key: 'bolum4', title: 'Hedef Kitle & Organizasyon', title_en: 'Target Audience & Organization',
        description: 'Karar verici / onaylayıcı rolleri',
        description_en: 'Decision maker / approver roles',
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
        key: 'bolum5', title: 'Müşteri İhtiyaç & Problem Haritası', title_en: 'Customer Needs & Problem Map',
        description: 'Hedef kitlenin ihtiyaçları ve problemleri',
        description_en: 'Audience needs and pain points',
        fields: [
            { key: 'temel_ihtiyaclar', label: 'Hedef Kitlenizin Temel İhtiyaçları', label_en: 'Core Needs of Your Target Audience', type: 'textarea' },
            { key: 'ana_problemler', label: 'Yaşadıkları Ana Problemler', label_en: 'Main Problems They Face', type: 'textarea' },
            { key: 'cozum_aranan', label: 'Çözüm Aradıkları Konular', label_en: 'Topics They Seek Solutions For', type: 'textarea' },
            { key: 'iletisim_araclari', label: 'Kullandıkları İletişim Araçları (LinkedIn, email, vb.)', label_en: 'Communication Channels They Use (LinkedIn, email, etc.)', type: 'text' },
            { key: 'satin_alma_faktorleri', label: 'Satın Alma Kararlarını Etkileyen Faktörler', label_en: 'Factors Influencing Purchase Decisions', type: 'textarea' },
        ]
    },
    {
        key: 'bolum6', title: 'Değer Önerileri', title_en: 'Value Propositions',
        description: 'Çözdüğünüz sorunlar ve sağladığınız faydalar',
        description_en: 'Problems you solve and benefits you deliver',
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
        key: 'bolum7', title: 'Satın Alma Davranışı', title_en: 'Buying Behavior',
        description: 'Müşterinizin satın alma süreci',
        description_en: 'Your customer\'s buying journey',
        fields: [
            { key: 'satin_alma_adimlari', label: 'Satın Alma Süreci Adımları', label_en: 'Steps in the Buying Process', type: 'textarea' },
            { key: 'karar_faktorleri', label: 'Karar Faktörleri (fiyat, kalite, referans vb.)', label_en: 'Decision Factors (price, quality, references, etc.)', type: 'textarea' },
            { key: 'gerekli_belgeler', label: 'Gerekli Bilgi/Belgeler', label_en: 'Required Information/Documents', type: 'textarea' },
            { key: 'referans_turleri', label: 'Önem Verilen Referans Türleri', label_en: 'Types of References That Matter', type: 'textarea' },
        ]
    },
    {
        key: 'bolum8', title: 'Beklenti & Sonuç', title_en: 'Expectations & Outcomes',
        description: 'Hizmet sonrası beklentiler ve KPI hedefleri',
        description_en: 'Post-service expectations and KPI goals',
        fields: [
            { key: 'hizmet_sonrasi_beklenti', label: 'Hizmet Sonrası Beklenti', label_en: 'Post-Service Expectations', type: 'textarea' },
            { key: 'kpi_iyilestirme', label: 'İyileştirilmek İstenen KPI\'lar', label_en: 'KPIs to Improve', type: 'textarea' },
        ]
    },
    {
        key: 'bolum9', title: 'Kanal & Performans', title_en: 'Channels & Performance',
        description: 'Pazarlama kanalları ve mevcut performans',
        description_en: 'Marketing channels and current performance',
        fields: [
            { key: 'onceki_kanallar', label: 'Daha Önce Kullanılan Pazarlama Kanalları', label_en: 'Previously Used Marketing Channels', type: 'textarea' },
            { key: 'en_iyi_kanal', label: 'En İyi Performans Gelen Kanal', label_en: 'Best Performing Channel', type: 'text' },
            { key: 'aylik_lead', label: 'Aylık Lead Sayısı (yaklaşık)', label_en: 'Monthly Lead Count (approximate)', type: 'text' },
        ]
    },
    {
        key: 'bolum10', title: 'Teknoloji & Altyapı', title_en: 'Technology & Infrastructure',
        description: 'CRM, analytics ve conversion tracking',
        description_en: 'CRM, analytics and conversion tracking',
        fields: [
            { key: 'crm_kullanimi', label: 'CRM Kullanımı (hangi araç, aktif mi?)', label_en: 'CRM Usage (which tool, is it active?)', type: 'text' },
            { key: 'analytics_kurulum', label: 'Analytics Kurulumu (GA4, Pixel vb.)', label_en: 'Analytics Setup (GA4, Pixel, etc.)', type: 'text' },
            { key: 'conversion_tracking', label: 'Conversion Tracking (var mı, hangi araçlar?)', label_en: 'Conversion Tracking (do you have it, which tools?)', type: 'text' },
        ]
    },
    {
        key: 'bolum11', title: 'Operasyon Süreci', title_en: 'Operational Process',
        description: 'Süreç sahibi ve onay akışı',
        description_en: 'Process owner and approval flow',
        fields: [
            { key: 'iletisim_kisi_operasyon', label: 'Bizimle İletişimde Olacak Kişi / Ünvan', label_en: 'Point of Contact for Our Team / Title', type: 'text' },
            { key: 'onay_suresi', label: 'Onay Süresi (içerik, raporlama vb. için beklenen gün)', label_en: 'Approval Timeline (expected days for content, reports, etc.)', type: 'text' },
        ]
    },
    {
        key: 'bolum12', title: 'Stratejik Gerçekler', title_en: 'Strategic Realities',
        description: 'Büyüme engelleri ve iş birliği beklentileri',
        description_en: 'Growth blockers and partnership expectations',
        fields: [
            { key: 'buyume_engeli', label: 'Büyümenin Önündeki En Büyük Engel', label_en: 'Biggest Obstacle to Growth', type: 'textarea' },
            { key: 'pazarlama_problemi', label: 'Pazarlamada Yaşanan En Büyük Problem', label_en: 'Biggest Marketing Challenge', type: 'textarea' },
            { key: 'is_birligi_beklenti', label: 'İş Birliğinden Beklentiniz', label_en: 'What You Expect from This Partnership', type: 'textarea' },
        ]
    },
];

/** Tüm bölümlerde alanları boş string'le başlatan helper */
export function buildInitialFormData(): Record<string, Record<string, string>> {
    const out: Record<string, Record<string, string>> = {};
    for (const s of ONBOARDING_SECTIONS) {
        const fields: Record<string, string> = {};
        for (const f of s.fields) fields[f.key] = '';
        out[s.key] = fields;
    }
    return out;
}

/** Bir field'ın label'ını lokalize döndür */
export function getFieldLabel(sectionKey: string, fieldKey: string, isEn: boolean): string {
    const sec = ONBOARDING_SECTIONS.find(s => s.key === sectionKey);
    if (!sec) return fieldKey;
    const field = sec.fields.find(f => f.key === fieldKey);
    if (!field) return fieldKey;
    return isEn ? field.label_en : field.label;
}

/** Section başlığını lokalize döndür */
export function getSectionTitle(sectionKey: string, isEn: boolean): string {
    const sec = ONBOARDING_SECTIONS.find(s => s.key === sectionKey);
    if (!sec) return sectionKey;
    return isEn ? sec.title_en : sec.title;
}
