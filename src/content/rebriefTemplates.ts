// src/content/rebriefTemplates.ts
// Hizmete özel re-brief şablonları — admin form cevaplarını okuyup hizmete uygun
// önceden tanımlı bölümleri doldurur. Müşteri sunumda yalnızca bu re-brief'i görür.

export interface RebriefSectionDef {
    key: string;
    title: string;
    title_en: string;
    placeholder: string;
    placeholder_en?: string;
}

export interface RebriefTemplate {
    key: string;
    name: string;
    name_en: string;
    /**
     * product_names veya product_key içinde geçecek anahtar kelimeler.
     * İlk eşleşen template kullanılır. Lowercase karşılaştırılır.
     */
    matchKeywords: string[];
    intro_placeholder: string;
    intro_placeholder_en?: string;
    sections: RebriefSectionDef[];
}

// ─── 8 hizmet şablonu ────────────────────────────────────────────────────

const TPL_GTM: RebriefTemplate = {
    key: 'gtm',
    name: 'Go-to-Market Stratejisi',
    name_en: 'Go-to-Market Strategy',
    matchKeywords: ['gtm', 'go to market', 'go-to-market'],
    intro_placeholder:
        'Khilon ekibi olarak briefinizi inceledik. Aşağıda sizin için hazırladığımız Go-to-Market yaklaşımımızı bulacaksınız. Bu yol haritası ICP, konumlandırma, kanallar ve ölçümleme dengesini gözeterek sürdürülebilir büyüme hedefliyor.',
    sections: [
        { key: 'icp', title: 'İdeal Müşteri Profili (ICP)', title_en: 'Ideal Customer Profile (ICP)',
          placeholder: 'Hedef sektör, şirket büyüklüğü, karar verici/onaylayıcı rolleri, satın alma motivasyonları...' },
        { key: 'positioning', title: 'Konumlandırma & Mesaj', title_en: 'Positioning & Messaging',
          placeholder: 'Markanın rakiplerden farkı, değer önerisi, ana mesajlar, role-bazlı mesaj kurgusu...' },
        { key: 'channels', title: 'Pazarlama Kanalları', title_en: 'Marketing Channels',
          placeholder: 'Hangi kanallarda öncelikli olmalı: Google Ads, LinkedIn, SEO, içerik pazarlama, partner network. Bütçe önerisi...' },
        { key: 'funnel', title: 'Satış Hunisi & Lead Akışı', title_en: 'Funnel & Lead Flow',
          placeholder: 'TOFU/MOFU/BOFU aşamalarında içerik ve aksiyon planı, lead-to-sale dönüşüm akışı...' },
        { key: 'roadmap', title: '12 Haftalık Yol Haritası', title_en: '12-Week Roadmap',
          placeholder: 'Hafta 1-4: kurulum & hedef kitle araştırması. Hafta 5-8: kampanya lansmanı. Hafta 9-12: optimizasyon...' },
        { key: 'kpi', title: 'Başarı KPI\'ları', title_en: 'Success KPIs',
          placeholder: 'CAC, LTV, lead/MQL/SQL dönüşüm oranları, pipeline değeri, kapanış oranı, ROI hedefleri...' },
    ],
};

const TPL_SEO: RebriefTemplate = {
    key: 'seo',
    name: 'SEO Yönetimi',
    name_en: 'SEO Management',
    matchKeywords: ['seo'],
    intro_placeholder:
        'SEO stratejimiz sitenizin organik görünürlüğünü, doğru anahtar kelimeleri ve teknik altyapıyı bütünleşik ele alır. Aşağıda sizin için hazırladığımız yaklaşımı bulabilirsiniz.',
    sections: [
        { key: 'audit', title: 'Mevcut Durum Analizi', title_en: 'Current State Audit',
          placeholder: 'Site sağlığı, indekslenme, sıralama tablosu, rakip analizi, eksiklikler...' },
        { key: 'keyword', title: 'Anahtar Kelime Stratejisi', title_en: 'Keyword Strategy',
          placeholder: 'Öncelikli short-tail ve long-tail kelimeler, niyet bazlı (informational/commercial) gruplama...' },
        { key: 'technical', title: 'Teknik SEO Aksiyonları', title_en: 'Technical SEO Actions',
          placeholder: 'Core Web Vitals, schema, mobil uyumluluk, canonical, robots.txt, sitemap iyileştirmeleri...' },
        { key: 'content', title: 'İçerik Planı', title_en: 'Content Plan',
          placeholder: 'Aylık blog yazıları, pillar/cluster yapısı, mevcut içerik optimizasyonu, içerik takvimi...' },
        { key: 'backlink', title: 'Backlink & Otorite', title_en: 'Backlink & Authority',
          placeholder: 'Link kazanım stratejisi, dijital PR, partner/sektör siteleri, broken-link build...' },
        { key: 'kpi', title: 'KPI & Raporlama', title_en: 'KPIs & Reporting',
          placeholder: 'Organik trafik, kelime sıralamaları, dönüşüm, click-through rate hedefleri, aylık rapor formatı...' },
    ],
};

const TPL_GOOGLE_ADS: RebriefTemplate = {
    key: 'google_ads',
    name: 'Google Ads',
    name_en: 'Google Ads',
    matchKeywords: ['google ads', 'search ads', 'arama reklamlari', 'arama reklamcılığı'],
    intro_placeholder:
        'Google Ads stratejimiz hedef kitlenizin arama davranışına ve dönüşüm hunisine uygun kampanya yapısı kurmak üzerine kurulu. Bütçenizi maksimum verimle kullanmak için hazırladığımız plan aşağıda.',
    sections: [
        { key: 'audit', title: 'Mevcut Hesap Analizi', title_en: 'Current Account Audit',
          placeholder: 'Mevcut kampanyalar, performans, harcama dağılımı, eksiklikler...' },
        { key: 'audience', title: 'Hedef Kitle & Niyet', title_en: 'Audience & Intent',
          placeholder: 'ICP eşlemesi, in-market segmentleri, custom intent kitlleri, remarketing havuzu...' },
        { key: 'campaign', title: 'Kampanya Yapısı', title_en: 'Campaign Structure',
          placeholder: 'Search/Display/PMax karması, ad group hiyerarşisi, anahtar kelime/kelime öbeği eşleme tipleri...' },
        { key: 'creative', title: 'Reklam Metni & Görsel', title_en: 'Ad Copy & Creative',
          placeholder: 'RSA başlık/açıklama varyasyonları, sitelink-callout uzantıları, görsel reklam yönü...' },
        { key: 'budget', title: 'Bütçe & Teklif Stratejisi', title_en: 'Budget & Bidding',
          placeholder: 'Aylık bütçe dağılımı, kampanya bazlı paylaşım, otomatik vs manuel teklif, ROAS hedefi...' },
        { key: 'kpi', title: 'KPI & Optimizasyon', title_en: 'KPIs & Optimization',
          placeholder: 'CPC, CPL, CPA, ROAS hedefleri, A/B test takvimi, haftalık optimizasyon ritmi...' },
    ],
};

const TPL_SOCIAL: RebriefTemplate = {
    key: 'social',
    name: 'Sosyal Medya Reklamcılığı',
    name_en: 'Social Media Advertising',
    matchKeywords: ['sosyal medya', 'social ads', 'social-ads', 'meta', 'linkedin', 'tiktok'],
    intro_placeholder:
        'Sosyal medya reklamcılığında yaratıcı çeşitlilik ve doğru hedefleme kombinasyonu kritik. Aşağıda markanız için hazırladığımız platform-stratejisini ve kreatif yaklaşımı bulacaksınız.',
    sections: [
        { key: 'platform', title: 'Platform Önceliği', title_en: 'Platform Priority',
          placeholder: 'Hedef kitleye göre platform sıralaması (Meta/Instagram/LinkedIn/TikTok), bütçe paylaşımı...' },
        { key: 'audience', title: 'Kitle Segmentasyonu', title_en: 'Audience Segmentation',
          placeholder: 'Soğuk/sıcak/lookalike havuzlar, ilgi alanı + davranış kombinasyonları, retargeting akışı...' },
        { key: 'creative', title: 'Kreatif Yaklaşım', title_en: 'Creative Approach',
          placeholder: 'Görsel/video/karuzel formatları, mesaj tonu, marka kimliği uygulaması, A/B test varyasyonları...' },
        { key: 'funnel', title: 'Huni Eşleşmesi', title_en: 'Funnel Mapping',
          placeholder: 'Awareness/Consideration/Conversion için ayrı kampanya hedefleri, içerik akışı...' },
        { key: 'budget', title: 'Bütçe & Test Planı', title_en: 'Budget & Test Plan',
          placeholder: 'Platform başı bütçe, test bütçesi, scale-up kuralları, haftalık ritim...' },
        { key: 'kpi', title: 'Performans KPI\'ları', title_en: 'Performance KPIs',
          placeholder: 'CPM, CTR, ThruPlay, CPL, CPA, dönüşüm oranı, ROAS hedefleri ve raporlama formatı...' },
    ],
};

const TPL_CONTENT: RebriefTemplate = {
    key: 'content',
    name: 'İçerik Üretimi & Stratejisi',
    name_en: 'Content Production & Strategy',
    matchKeywords: ['icerik', 'içerik', 'content', 'icerik-uretimi', 'content-production', 'content-strategy', 'icerik-stratejisi', 'içerik stratejisi'],
    intro_placeholder:
        'İçerik stratejimiz markanızı doğru hedef kitleye, doğru mesajla ve doğru kanaldan ulaştırmak üzerine kurulu. Aşağıda hazırladığımız yaklaşımı bulabilirsiniz.',
    sections: [
        { key: 'pillars', title: 'İçerik Pillar\'ları', title_en: 'Content Pillars',
          placeholder: '4-6 ana tema, her birinin marka/değer önerisiyle bağlantısı, alt konu örnekleri...' },
        { key: 'formats', title: 'İçerik Formatları', title_en: 'Content Formats',
          placeholder: 'Blog, video, podcast, infographic, white paper, case study karması — hangi format ne zaman?' },
        { key: 'channels', title: 'Dağıtım Kanalları', title_en: 'Distribution Channels',
          placeholder: 'Web sitesi, sosyal medya, e-posta, partner/PR, organik vs ücretli destekler...' },
        { key: 'calendar', title: 'İçerik Takvimi', title_en: 'Content Calendar',
          placeholder: 'Aylık içerik üretim hacmi, yayın ritmi, sezon/etkinlik bazlı içerik planı...' },
        { key: 'kpi', title: 'KPI & Etki Ölçümü', title_en: 'KPIs & Impact',
          placeholder: 'Organik trafik, engagement, lead, indirme, sosyal etki, dönüşüm hedefleri...' },
    ],
};

const TPL_B2B_EMAIL: RebriefTemplate = {
    key: 'b2b_email',
    name: 'B2B E-mail Marketing',
    name_en: 'B2B Email Marketing',
    matchKeywords: ['b2b email', 'b2b-email', 'email pazarlama', 'email marketing'],
    intro_placeholder:
        'B2B e-mail stratejimiz hedef listeden mesaj sırasına, otomasyon akışından yanıt yönetimine kadar bütünleşik bir akış kurar.',
    sections: [
        { key: 'list', title: 'Hedef Liste & ICP', title_en: 'Target List & ICP',
          placeholder: 'Hedef şirket/kişi profili, liste kaynağı, segmentasyon, hijyen kontrolü...' },
        { key: 'sequence', title: 'Mesaj Sıralaması', title_en: 'Message Sequence',
          placeholder: 'Cold outreach: 3-5 dokunuş akışı (intro/value/case-study/follow-up), kişiselleştirme alanları...' },
        { key: 'tone', title: 'Ton & Yaklaşım', title_en: 'Tone & Approach',
          placeholder: 'Profesyonel ama kişisel ton, role bazlı dil farklılıkları, CTA seçenekleri...' },
        { key: 'tools', title: 'Araçlar & Altyapı', title_en: 'Tools & Infrastructure',
          placeholder: 'SMTP/Brevo, CRM entegrasyonu, A/B test, deliverability (SPF/DKIM/DMARC)...' },
        { key: 'kpi', title: 'KPI & Geliştirme', title_en: 'KPIs & Iteration',
          placeholder: 'Open rate, reply rate, meeting booked, pipeline yaratımı, cost per booked meeting...' },
    ],
};

const TPL_INTEGRATED: RebriefTemplate = {
    key: 'integrated',
    name: 'Bütünleşik Dijital Pazarlama / 360 Pazarlama',
    name_en: 'Integrated Digital Marketing / 360 Marketing',
    matchKeywords: ['butunlesik', 'bütünleşik', 'integrated', '360', 'sektörel'],
    intro_placeholder:
        'Bütünleşik 360° yaklaşımımız stratejiyi, kanal yönetimini, içerik üretimini ve ölçümlemeyi tek operasyonel sistemde toplar. Sektörünüze ve hedeflerinize özel hazırladığımız plan aşağıda.',
    sections: [
        { key: 'strategy', title: 'Strateji & Konumlandırma', title_en: 'Strategy & Positioning',
          placeholder: 'Markanızın mevcut konumu, hedef pazarda farkındalık ve istenen konum, mesaj çerçevesi...' },
        { key: 'channels', title: 'Kanal Karması', title_en: 'Channel Mix',
          placeholder: 'Search + Social + Email + Content + Direct dengesi, sektöre özel kanal önerileri...' },
        { key: 'content', title: 'İçerik & Kreatif', title_en: 'Content & Creative',
          placeholder: 'Aylık içerik üretim hacmi, format çeşitliliği, marka kimliği uygulaması...' },
        { key: 'funnel', title: 'Huni & Lead Yönetimi', title_en: 'Funnel & Lead Management',
          placeholder: 'TOFU-MOFU-BOFU akışı, lead nurturing, satış ekibi handoff süreçleri...' },
        { key: 'roadmap', title: '90 Günlük Yol Haritası', title_en: '90-Day Roadmap',
          placeholder: 'İlk 30 gün: kurulum & araştırma. 31-60: lansman. 61-90: optimizasyon ve scale...' },
        { key: 'kpi', title: 'Bütünleşik KPI\'lar', title_en: 'Integrated KPIs',
          placeholder: 'CAC, LTV, MQL→SQL, ROAS, brand metrics, aylık & üç aylık rapor formatı...' },
    ],
};

const TPL_GENERIC: RebriefTemplate = {
    key: 'generic',
    name: 'Genel Strateji Yaklaşımı',
    name_en: 'General Strategy',
    matchKeywords: [],
    intro_placeholder:
        'Briefinizi inceledikten sonra hizmetinize özel hazırladığımız yaklaşım aşağıda. Her bölüm sizin durumunuza göre özelleştirildi.',
    sections: [
        { key: 'situation', title: 'Mevcut Durum', title_en: 'Current Situation',
          placeholder: 'İşletmenin mevcut konumu, güçlü ve zayıf yanlar, fırsatlar...' },
        { key: 'approach', title: 'Önerilen Yaklaşım', title_en: 'Recommended Approach',
          placeholder: 'Stratejimizin ana hatları, neye odaklanacağız, hangi yöntemi kullanacağız...' },
        { key: 'roadmap', title: 'Yol Haritası', title_en: 'Roadmap',
          placeholder: 'Aylık aksiyon planı, milestonelar, teslim takvimi...' },
        { key: 'kpi', title: 'Başarı KPI\'ları', title_en: 'Success KPIs',
          placeholder: 'Ölçeceğimiz metrikler, hedef değerler, raporlama ritmi...' },
    ],
};

export const REBRIEF_TEMPLATES: RebriefTemplate[] = [
    TPL_GTM,
    TPL_SEO,
    TPL_GOOGLE_ADS,
    TPL_SOCIAL,
    TPL_CONTENT,
    TPL_B2B_EMAIL,
    TPL_INTEGRATED,
    TPL_GENERIC,
];

/**
 * Ürün adı / product key'lerinden uygun şablonu seçer.
 * Eşleşme yoksa generic döner.
 */
export function detectRebriefTemplate(productNames?: string | null, productKeys?: string[] | null): RebriefTemplate {
    const haystack = [
        (productNames || '').toLowerCase(),
        ...(productKeys || []).map(k => (k || '').toLowerCase()),
    ].join(' ');
    if (!haystack.trim()) return TPL_GENERIC;
    for (const tpl of REBRIEF_TEMPLATES) {
        if (tpl.key === 'generic') continue;
        if (tpl.matchKeywords.some(k => haystack.includes(k))) return tpl;
    }
    return TPL_GENERIC;
}

export function getTemplateByKey(key?: string | null): RebriefTemplate {
    return REBRIEF_TEMPLATES.find(t => t.key === key) || TPL_GENERIC;
}

/** Boş re-brief data oluşturur (template seçilmiş) */
export function buildEmptyRebrief(template: RebriefTemplate): {
    template_key: string;
    intro: string;
    sections: { key: string; title: string; content: string }[];
} {
    return {
        template_key: template.key,
        intro: '',
        sections: template.sections.map(s => ({ key: s.key, title: s.title, content: '' })),
    };
}
