import { useEffect, useMemo, useState } from 'react'
import {
    HiArrowTopRightOnSquare,
    HiCheckBadge,
    HiCheckCircle,
    HiChevronDown,
    HiClipboardDocumentCheck,
    HiRocketLaunch,
    HiShieldCheck,
    HiSparkles,
    HiUsers,
    HiChartBarSquare,
    HiMagnifyingGlass,
    HiWrenchScrewdriver,
} from 'react-icons/hi2'
import Breadcrumbs from '../components/Breadcrumbs'
import './IntegratedMarketingSetupFlow.css'

type ChecklistItem = {
    id: string
    label: string
    required?: boolean
}

type FlowBranchStep = {
    title: string
    description: string
    note?: string
    badge?: string
    linkLabel?: string
    linkHref?: string
    code?: boolean
}

type FlowSection = {
    id: string
    step: number
    color: 'blue' | 'orange' | 'purple' | 'green'
    icon: string
    badge: string
    title: string
    description: string
    decision: string
    yesLabel: string
    noLabel: string
    yesSteps: FlowBranchStep[]
    noSteps: FlowBranchStep[]
    completionTitle: string
    completionDescription: string
    completionItems: string[]
    progress: number
    note?: string
}

type FaqGroup = {
    id: string
    title: string
    icon: string
    color: keyof typeof colorClassMap
    items: Array<{
        question: string
        answer: string
    }>
}

const systems = [
    {
        id: 1,
        icon: '🧩',
        title: 'Google Tag Manager',
        description: 'Tüm etiketleri tek noktadan yönetin',
        accent: 'blue',
        badge: 'Adım 1 - Temel',
        status: 'Zorunlu - İlk adım',
    },
    {
        id: 2,
        icon: '🔍',
        title: 'Google Reklamları',
        description: 'Google reklamlarını yönetin',
        accent: 'orange',
        badge: 'Adım 2 - Reklam',
        status: 'GTM sonrası',
    },
    {
        id: 3,
        icon: '📊',
        title: 'Google Analytics',
        description: 'Ziyaretçi verilerini analiz edin',
        accent: 'purple',
        badge: 'Adım 3 - Analiz',
        status: 'GTM sonrası',
    },
    {
        id: 4,
        icon: '⚙️',
        title: 'Google Search Console',
        description: 'Arama performansını izleyin',
        accent: 'green',
        badge: 'Adım 4 - SEO',
        status: 'GTM sonrası',
    },
]

const checklistItems: ChecklistItem[] = [
    { id: 'site-url', label: "Web sitesi URL'i hazır", required: true },
    { id: 'google-access', label: 'Google hesabına erişim var', required: true },
    { id: 'code-access', label: 'Web sitesine kod ekleme yetkisi var', required: true },
    { id: 'company-mail', label: 'Kurumsal e-posta adresi', required: false },
    { id: 'budget', label: 'Reklam bütçesi belirlendi (Search Ads için)', required: false },
    { id: 'sitemap', label: 'Site haritası (sitemap) hazır (Search Console için)', required: false },
]

const flowSections: FlowSection[] = [
    {
        id: 'gtm',
        step: 1,
        color: 'blue',
        icon: '🧩',
        badge: 'Adım 1 - Temel',
        title: 'Google Tag Manager Kurulumu',
        description: 'Tüm etiketleri tek noktadan yönetin',
        decision: 'GTM hesabınız var mı?',
        yesLabel: 'Evet, hesabım var',
        noLabel: 'Hayır, hesabım yok',
        yesSteps: [
            {
                title: 'Mevcut GTM hesabınıza giriş yapın',
                description: 'Doğru container ve çalışma alanını açın.',
                linkLabel: "GTM'i Aç",
                linkHref: 'https://tagmanager.google.com',
            },
            {
                title: 'KhilonFast kullanıcısını ekleyin',
                description: 'Kullanıcı Ekle menüsünden ads@khilon.com adresini tanımlayın.',
                note: 'Yönetici veya Yayınlama izni verin.',
            },
        ],
        noSteps: [
            {
                title: 'KhilonFast hesap oluşturur',
                description: 'Markanız adına yeni bir GTM hesabı ve container oluşturulur.',
                badge: 'Otomatik',
            },
            {
                title: 'GTM kodu size iletilir',
                description: 'Header ve body alanında kullanacağınız kod parçaları paylaşılır.',
            },
            {
                title: 'Kodu web sitenize ekleyin',
                description: 'Verilen kodu web sitenizin head ve body alanlarına yerleştirin.',
                code: true,
            },
        ],
        completionTitle: 'GTM Kurulumu Tamamlandı!',
        completionDescription: 'Diğer sistemler için gerekli temel altyapı hazır.',
        completionItems: ['GTM container aktif', 'Etiket yönetimi hazır', 'Diğer adımlara geçilebilir'],
        progress: 25,
    },
    {
        id: 'ads',
        step: 2,
        color: 'orange',
        icon: '🔍',
        badge: 'Adım 2 - Reklam',
        title: 'Google Reklamları Kurulumu',
        description: 'Google reklamlarını yönetin',
        decision: 'Google Ads hesabınız var mı?',
        yesLabel: 'Evet, hesabım var',
        noLabel: 'Hayır, hesabım yok',
        yesSteps: [
            {
                title: 'Google Ads kimliğinizi paylaşın',
                description: "10 haneli Google Ads kimliğinizi KhilonFast'e iletin.",
                note: 'Format: XXX-XXX-XXXX',
            },
            {
                title: 'Erişim talebini onaylayın',
                description: 'Google Ads panelinizde gelen yönetici/uzman erişim talebini kabul edin.',
                note: 'Talep genellikle birkaç dakika içinde görünür.',
            },
        ],
        noSteps: [
            {
                title: 'KhilonFast hesap kurulumunu başlatır',
                description: 'İşletmenize uygun yeni Google Ads hesabı açılır.',
                badge: 'Otomatik',
            },
            {
                title: 'Davet e-postasını onaylayın',
                description: "Google'dan gelen hesap davetini kabul ederek erişimi etkinleştirin.",
            },
        ],
        completionTitle: 'Search Ads Kurulumu Tamamlandı!',
        completionDescription: 'KhilonFast kampanya yönetimi ve optimizasyona başlayabilir.',
        completionItems: ['Reklam hesabı bağlandı', 'Kampanya yönetimi aktif', 'Dönüşüm takibi hazır'],
        progress: 50,
    },
    {
        id: 'analytics',
        step: 3,
        color: 'purple',
        icon: '📊',
        badge: 'Adım 3 - Analiz',
        title: 'Google Analytics Kurulumu',
        description: 'Ziyaretçi verilerini analiz edin',
        decision: 'Google Analytics hesabınız var mı?',
        yesLabel: 'Evet, hesabım var',
        noLabel: 'Hayır, hesabım yok',
        yesSteps: [
            {
                title: "Analytics hesabınıza giriş yapın",
                description: 'İlgili GA4 property ve yönetici alanını açın.',
                linkLabel: "Analytics'i Aç",
                linkHref: 'https://analytics.google.com',
            },
            {
                title: 'KhilonFast kullanıcısını ekleyin',
                description: 'Yönetici bölümünden ads@khilon.com hesabını kullanıcı olarak ekleyin.',
                note: 'Görüntüleyici ve Analist yetkisi yeterlidir.',
            },
        ],
        noSteps: [
            {
                title: 'KhilonFast yeni hesap oluşturur',
                description: 'Markanıza uygun GA4 property kurulumu yapılır.',
                badge: 'Otomatik',
            },
            {
                title: 'GTM üzerinden entegre edilir',
                description: "Takip kurulumu GTM üzerinden bağlanır, ayrıca kod eklemeniz gerekmez.",
                note: 'Veriler genellikle 24-48 saat içinde görünmeye başlar.',
            },
        ],
        completionTitle: 'Analytics Kurulumu Tamamlandı!',
        completionDescription: 'Ziyaretçi ve dönüşüm verileri ölçülmeye başlar.',
        completionItems: ['Veri toplama aktif', 'Raporlama hazır', 'Hedef takibi başladı'],
        progress: 75,
        note: 'İlk verilerin görünmesi 24-48 saati bulabilir.',
    },
    {
        id: 'search-console',
        step: 4,
        color: 'green',
        icon: '⚙️',
        badge: 'Adım 4 - SEO',
        title: 'Google Search Console Kurulumu',
        description: 'Arama performansını izleyin',
        decision: 'Google Search Console hesabınız var mı?',
        yesLabel: 'Evet, hesabım var',
        noLabel: 'Hayır, hesabım yok',
        yesSteps: [
            {
                title: "Search Console'a giriş yapın",
                description: 'Doğru property üzerinden kullanıcı yönetimi ekranını açın.',
                linkLabel: "Search Console'u Aç",
                linkHref: 'https://search.google.com/search-console',
            },
            {
                title: 'KhilonFast kullanıcısını ekleyin',
                description: 'Kullanıcı Ekle menüsünden ads@khilon.com adresini yetkilendirin.',
            },
        ],
        noSteps: [
            {
                title: 'KhilonFast property oluşturur',
                description: 'Yeni Search Console property ve temel yapılandırma hazırlanır.',
                badge: 'Otomatik',
            },
            {
                title: 'Doğrulama kodu size iletilir',
                description: 'Site doğrulaması için gerekli meta veya HTML doğrulama bilgisi paylaşılır.',
            },
            {
                title: 'Doğrulama kodunu ekleyin',
                description: 'Paylaşılan kodu web sitenizin head alanına ekleyin.',
                code: true,
            },
        ],
        completionTitle: 'Search Console Kurulumu Tamamlandı!',
        completionDescription: 'İndeksleme ve arama görünürlüğü verileri takip edilmeye başlanır.',
        completionItems: ['Site doğrulaması yapıldı', 'Arama verileri toplanıyor', 'Teknik takip aktif'],
        progress: 100,
    },
]

const faqGroups: FaqGroup[] = [
    {
        id: 'gtm',
        title: 'GTM ile ilgili',
        icon: '🧩',
        color: 'blue',
        items: [
            {
                question: 'GTM kodu nereye eklenir?',
                answer: 'Header kodu <head> alanına, noscript kodu ise <body> açılışının hemen altına eklenmelidir.',
            },
            {
                question: 'Kod çalışmıyorsa ne yapmalıyım?',
                answer: "Preview modu ile test edin, kodun eksiksiz yerleştirildiğini ve cache'in temizlendiğini kontrol edin.",
            },
        ],
    },
    {
        id: 'ads',
        title: 'Search Ads ile ilgili',
        icon: '🔍',
        color: 'orange',
        items: [
            {
                question: 'Google Ads kimliğimi nerede bulurum?',
                answer: 'Google Ads hesabınızın sağ üst alanında yer alan 10 haneli müşteri numarasıdır.',
            },
            {
                question: 'Erişim talebi görünmüyor',
                answer: 'Spam klasörünü ve Google Ads erişim/yetki ekranını kontrol edin. Gecikirse yeniden davet gönderilebilir.',
            },
        ],
    },
    {
        id: 'analytics',
        title: 'Analytics ile ilgili',
        icon: '📊',
        color: 'purple',
        items: [
            {
                question: 'Veriler görünmüyor',
                answer: 'GA4 verilerinin oturması 24-48 saat sürebilir. Real-time rapor ile ilk kontrol yapılmalıdır.',
            },
            {
                question: 'Hedefler nasıl tanımlanır?',
                answer: 'Form gönderimi, telefon tıklaması ve satın alma gibi hedefler GTM üzerinden olay bazlı tanımlanır.',
            },
        ],
    },
    {
        id: 'console',
        title: 'Search Console ile ilgili',
        icon: '⚙️',
        color: 'green',
        items: [
            {
                question: 'Doğrulama kodu çalışmıyor',
                answer: 'Kodun head alanına eklendiğini, sayfanın yayınlandığını ve cache temizliğinin yapıldığını doğrulayın.',
            },
            {
                question: 'Sitemap nasıl gönderilir?',
                answer: 'Search Console içindeki Sitemap bölümünden genellikle /sitemap.xml adresi gönderilmelidir.',
            },
        ],
    },
] 

const colorClassMap = {
    blue: 'imsf-blue',
    orange: 'imsf-orange',
    purple: 'imsf-purple',
    green: 'imsf-green',
}

function ExternalStepLink({ href, label }: { href?: string; label?: string }) {
    if (!href || !label) return null

    return (
        <a className="imsf-step-link" href={href} target="_blank" rel="noreferrer">
            {label}
            <HiArrowTopRightOnSquare />
        </a>
    )
}

function CodeSnippet() {
    return (
        <pre className="imsf-code-block">
            <code>{`<!-- Header kodu <head> içine -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXX');</script>

<!-- Body kodu <body> içine -->
<noscript><iframe src="..."></iframe></noscript>`}</code>
        </pre>
    )
}

export default function IntegratedMarketingSetupFlow() {
    const [selectedBranches, setSelectedBranches] = useState<Record<string, 'yes' | 'no'>>({
        gtm: 'yes',
        ads: 'yes',
        analytics: 'yes',
        'search-console': 'yes',
    })
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({})
    const [openFaq, setOpenFaq] = useState<string | null>(null)

    useEffect(() => {
        document.title = 'Bütünleşik Pazarlama Kurulum Akışı | khilonfast'

        const upsertMeta = (name: string, content: string) => {
            let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
            if (!tag) {
                tag = document.createElement('meta')
                tag.setAttribute('name', name)
                document.head.appendChild(tag)
            }
            tag.setAttribute('content', content)
        }

        upsertMeta('description', 'GTM, Search Ads, Analytics ve Search Console kurulumlarını tek akışta tamamlayın.')
    }, [])

    const completedCount = useMemo(
        () => checklistItems.filter((item) => checklistState[item.id]).length,
        [checklistState]
    )
    const readiness = (completedCount / checklistItems.length) * 100

    return (
        <div className="imsf-page">
            <div className="imsf-shell">
                <Breadcrumbs
                    items={[
                        { label: 'Hizmetler', path: '/#services' },
                        { label: 'Bütünleşik Pazarlama Kurulum Akışı' },
                    ]}
                />

                <section className="imsf-hero">
                    <div className="imsf-hero-backdrop" />
                    <div className="imsf-hero-content">
                        <div className="imsf-pill">
                            <HiSparkles />
                            <span>Eksiksiz Kurulum Rehberi</span>
                        </div>
                        <h1>Bütünleşik Pazarlama Kurulum Akışı</h1>
                        <p className="imsf-hero-brand">khilonfast</p>
                        <p className="imsf-hero-copy">Tüm pazarlama sistemlerinizi tek seferde kurun.</p>
                        <div className="imsf-channel-list">
                            <span>🧩 GTM</span>
                            <span>🔍 Search Ads</span>
                            <span>📊 Analytics</span>
                            <span>⚙️ Console</span>
                        </div>
                        <button
                            type="button"
                            className="imsf-primary-button"
                            onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Kuruluma Başla
                        </button>
                    </div>
                </section>

                <section className="imsf-quick-strip">
                    <div className="imsf-quick-item">
                        <strong>4 ana kurulum</strong>
                        <span>GTM, Ads, Analytics, Search Console</span>
                    </div>
                    <div className="imsf-quick-item">
                        <strong>Tek rehber</strong>
                        <span>Tüm yetkilendirme akışı tek sayfada</span>
                    </div>
                    <div className="imsf-quick-item">
                        <strong>Net karar akışı</strong>
                        <span>Hesabınız varsa ve yoksa ayrı ilerleyiş</span>
                    </div>
                </section>

                <section className="imsf-section" id="overview">
                    <div className="imsf-section-head">
                        <div className="imsf-pill imsf-pill-solid">
                            <HiShieldCheck />
                            <span>Genel Bakış</span>
                        </div>
                        <h2>KhilonFast Bütünleşik Pazarlama</h2>
                        <p>
                            KhilonFast&apos;in tüm pazarlama hizmetlerinin etkin şekilde çalışabilmesi için aşağıdaki
                            entegrasyonların sırasıyla tamamlanması gerekir.
                        </p>
                    </div>

                    <div className="imsf-timeline">
                        {systems.map((system) => (
                            <article key={system.id} className={`imsf-timeline-card ${colorClassMap[system.accent as keyof typeof colorClassMap]}`}>
                                <div className="imsf-timeline-index">{system.id}</div>
                                <div>
                                    <div className="imsf-system-icon">{system.icon}</div>
                                    <h3>{system.title}</h3>
                                    <p>{system.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="imsf-note-box">
                        Bu akış, KhilonFast&apos;in Bütünleşik Pazarlama Hizmet Paketi&apos;ni alan müşteriler için tek
                        bir kurulum rehberidir.
                    </div>
                </section>

                <section className="imsf-section imsf-systems">
                    <div className="imsf-section-head">
                        <h2>Kurulacak Sistemler</h2>
                        <p>Dört sistem, tek entegre çözüm.</p>
                    </div>

                    <div className="imsf-system-grid">
                        {systems.map((system) => (
                            <article
                                key={system.id}
                                className={`imsf-system-card ${colorClassMap[system.accent as keyof typeof colorClassMap]}`}
                            >
                                <span className="imsf-system-badge">{system.badge}</span>
                                <div className="imsf-system-card-head">
                                    <span className="imsf-system-card-icon">{system.icon}</span>
                                    <h3>{system.title}</h3>
                                </div>
                                <p>{system.description}</p>
                                <strong>{system.status}</strong>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="imsf-section">
                    <div className="imsf-section-head">
                        <h2>Başlamadan Önce Gerekli Bilgiler</h2>
                        <p>Kurulum için hazır olduğunuzdan emin olun.</p>
                    </div>

                    <div className="imsf-checklist-card">
                        <div className="imsf-checklist">
                            {checklistItems.map((item) => {
                                const checked = Boolean(checklistState[item.id])
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`imsf-check-item ${checked ? 'is-checked' : ''}`}
                                        onClick={() =>
                                            setChecklistState((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                                        }
                                    >
                                        {checked ? <HiCheckCircle /> : <HiClipboardDocumentCheck />}
                                        <div>
                                            <span>{item.label}</span>
                                            <small>{item.required ? 'Zorunlu' : 'Opsiyonel'}</small>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                        <div className="imsf-progress">
                            <div className="imsf-progress-meta">
                                <span>Tamamlanma Oranı</span>
                                <strong>
                                    {completedCount} / {checklistItems.length}
                                </strong>
                            </div>
                            <div className="imsf-progress-bar">
                                <div className="imsf-progress-bar-fill" style={{ width: `${readiness}%` }} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="imsf-section">
                    <div className="imsf-launchpad">
                        <div className="imsf-launchpad-icon">
                            <HiRocketLaunch />
                        </div>
                        <h2>Başlangıç Noktası</h2>
                        <p>Müşteri KhilonFast Bütünleşik Pazarlama hizmetini satın alır ve kurulum akışı başlar.</p>
                        <div className="imsf-launchpad-status">
                            <HiCheckBadge />
                            <span>Kuruluma Hazır</span>
                        </div>
                    </div>
                </section>

                {flowSections.map((section) => {
                    const selected = selectedBranches[section.id] ?? 'yes'
                    return (
                        <section
                            key={section.id}
                            className={`imsf-section imsf-flow-section ${colorClassMap[section.color]}`}
                        >
                            <div className="imsf-flow-head">
                                <div className="imsf-flow-step-number">{section.step}</div>
                                <div>
                                    <span className="imsf-flow-badge">{section.badge}</span>
                                    <h2>{section.title}</h2>
                                    <p>{section.description}</p>
                                </div>
                            </div>

                            <div className="imsf-decision-card">
                                <div className="imsf-decision-icon">
                                    {section.id === 'gtm' && <HiShieldCheck />}
                                    {section.id === 'ads' && <HiUsers />}
                                    {section.id === 'analytics' && <HiChartBarSquare />}
                                    {section.id === 'search-console' && <HiWrenchScrewdriver />}
                                </div>
                                <h3>{section.decision}</h3>
                                <div className="imsf-decision-actions">
                                    <button
                                        type="button"
                                        className={selected === 'yes' ? 'is-active' : ''}
                                        onClick={() =>
                                            setSelectedBranches((prev) => ({ ...prev, [section.id]: 'yes' }))
                                        }
                                    >
                                        {section.yesLabel}
                                    </button>
                                    <button
                                        type="button"
                                        className={selected === 'no' ? 'is-active imsf-negative' : 'imsf-negative'}
                                        onClick={() =>
                                            setSelectedBranches((prev) => ({ ...prev, [section.id]: 'no' }))
                                        }
                                    >
                                        {section.noLabel}
                                    </button>
                                </div>
                            </div>

                            <div className="imsf-branch-grid">
                                <div className="imsf-branch-column">
                                    <div className={`imsf-branch-header ${selected === 'yes' ? 'is-selected' : ''}`}>
                                        {section.yesLabel}
                                    </div>
                                    {section.yesSteps.map((step, index) => (
                                        <article key={`${section.id}-yes-${index}`} className="imsf-step-card">
                                            <div className="imsf-step-index">{index + 1}</div>
                                            <div className="imsf-step-content">
                                                <div className="imsf-step-title-row">
                                                    <h4>{step.title}</h4>
                                                    {step.badge ? <span>{step.badge}</span> : null}
                                                </div>
                                                <p>{step.description}</p>
                                                {step.note ? <small>{step.note}</small> : null}
                                                <ExternalStepLink href={step.linkHref} label={step.linkLabel} />
                                                {step.code ? <CodeSnippet /> : null}
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <div className="imsf-branch-column">
                                    <div className={`imsf-branch-header ${selected === 'no' ? 'is-selected imsf-negative' : 'imsf-negative'}`}>
                                        {section.noLabel}
                                    </div>
                                    {section.noSteps.map((step, index) => (
                                        <article key={`${section.id}-no-${index}`} className="imsf-step-card">
                                            <div className="imsf-step-index">{index + 1}</div>
                                            <div className="imsf-step-content">
                                                <div className="imsf-step-title-row">
                                                    <h4>{step.title}</h4>
                                                    {step.badge ? <span>{step.badge}</span> : null}
                                                </div>
                                                <p>{step.description}</p>
                                                {step.note ? <small>{step.note}</small> : null}
                                                <ExternalStepLink href={step.linkHref} label={step.linkLabel} />
                                                {step.code ? <CodeSnippet /> : null}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>

                            <div className="imsf-completion-card">
                                <div className="imsf-completion-top">
                                    <div className="imsf-completion-icon">
                                        <HiCheckBadge />
                                    </div>
                                    <div>
                                        <h3>{section.completionTitle}</h3>
                                        <p>{section.completionDescription}</p>
                                    </div>
                                </div>
                                <div className="imsf-completion-grid">
                                    {section.completionItems.map((item) => (
                                        <div key={item} className="imsf-completion-item">
                                            <HiCheckCircle />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                                {section.note ? <div className="imsf-completion-note">{section.note}</div> : null}
                                <div className="imsf-progress">
                                    <div className="imsf-progress-meta">
                                        <span>Kurulum İlerlemesi</span>
                                        <strong>%{section.progress}</strong>
                                    </div>
                                    <div className="imsf-progress-bar">
                                        <div className="imsf-progress-bar-fill" style={{ width: `${section.progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )
                })}

                <section className="imsf-section">
                    <div className="imsf-section-head">
                        <div className="imsf-pill imsf-pill-solid">
                            <HiMagnifyingGlass />
                            <span>Sorun Giderme</span>
                        </div>
                        <h2>Sıkça Sorulan Sorular</h2>
                        <p>Kurulum sırasında karşılaşabileceğiniz temel sorunlar ve kısa çözümler.</p>
                    </div>

                    <div className="imsf-faq-groups">
                        {faqGroups.map((group) => (
                            <div key={group.id} className={`imsf-faq-group ${colorClassMap[group.color]}`}>
                                <h3>
                                    <span>{group.icon}</span>
                                    {group.title}
                                </h3>
                                <div className="imsf-faq-list">
                                    {group.items.map((item, index) => {
                                        const faqId = `${group.id}-${index}`
                                        const isOpen = openFaq === faqId

                                        return (
                                            <div key={faqId} className="imsf-faq-item">
                                                <button
                                                    type="button"
                                                    className="imsf-faq-trigger"
                                                    onClick={() => setOpenFaq(isOpen ? null : faqId)}
                                                >
                                                    <span>{item.question}</span>
                                                    <HiChevronDown className={isOpen ? 'is-open' : ''} />
                                                </button>
                                                {isOpen ? <p className="imsf-faq-answer">{item.answer}</p> : null}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="imsf-section">
                    <div className="imsf-section-head">
                        <div className="imsf-pill imsf-pill-solid">
                            <HiSparkles />
                            <span>Video</span>
                        </div>
                        <h2>Kurulum Akışı Videosu</h2>
                        <p>Süreci görsel olarak izlemek isterseniz aşağıdaki videoyu kullanabilirsiniz.</p>
                    </div>

                    <div className="imsf-video-frame">
                        <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                            <iframe
                                src="https://vimeo.com/showcase/11932505/embed2"
                                allowFullScreen
                                frameBorder="0"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                title="KhilonFast Bütünleşik Pazarlama Kurulum Akışı Videosu"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
