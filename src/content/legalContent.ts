import type { AppLocale } from '../utils/locale'

export type LegalDocumentKey = 'privacyPolicy' | 'cookiePolicy' | 'termsOfService' | 'refundPolicy'

type LegalSection = {
    title: string
    paragraphs: string[]
    bullets?: string[]
}

type LegalDocument = {
    seoTitle: string
    seoDescription: string
    eyebrow: string
    title: string
    intro: string
    updatedLabel: string
    updatedAt: string
    sections: LegalSection[]
}

type CheckoutLegalCopy = {
    privacyLabel: string
    termsTitle: string
    termsDescription: string
    termsHeading: string
    termsIntro: string
    termsBullets: string[]
    termsReviewHint: string
    policyLinksLabel: string
}

export const legalContent: Record<AppLocale, Record<LegalDocumentKey, LegalDocument>> = {
    tr: {
        privacyPolicy: {
            seoTitle: 'Gizlilik Politikası | khilonfast',
            seoDescription: 'Khilonfast gizlilik politikası; kişisel verilerin hangi amaçlarla işlendiğini, saklandığını ve kullanıcı haklarının nasıl yönetildiğini açıklar.',
            eyebrow: 'Yasal Bilgilendirme',
            title: 'Gizlilik Politikası',
            intro: 'Bu politika, khilonfast tarafından sunulan web sitesi, dijital ürünler, eğitimler, danışmanlık programları ve ödeme süreçleri kapsamında kişisel verilerin nasıl işlendiğini açıklar.',
            updatedLabel: 'Son güncelleme',
            updatedAt: '30 Mart 2026',
            sections: [
                {
                    title: '1. Topladığımız bilgiler',
                    paragraphs: [
                        'Khilonfast; iletişim formları, hesap oluşturma, satın alma, brief toplama, danışmanlık başvuruları ve destek süreçlerinde kullanıcıların paylaştığı kişisel verileri işler.',
                        'Bu veriler; ad-soyad, e-posta adresi, telefon, şirket bilgileri, fatura bilgileri, sipariş kayıtları, hizmet tercihleri ve kullanıcı tarafından sağlanan proje içeriklerini kapsayabilir.'
                    ],
                    bullets: [
                        'Kimlik ve iletişim bilgileri',
                        'Şirket, fatura ve vergi bilgileri',
                        'Sipariş, ödeme ve teslim kayıtları',
                        'Form, brief ve iletişim içerikleri',
                        'Site kullanımına ilişkin teknik kayıtlar ve güvenlik logları'
                    ]
                },
                {
                    title: '2. Verileri hangi amaçlarla kullanıyoruz?',
                    paragraphs: [
                        'Toplanan veriler; hizmetin kurulması, siparişin tamamlanması, ödeme süreçlerinin yönetilmesi, kullanıcı hesabına içerik erişiminin tanımlanması ve müşteri destek taleplerinin yürütülmesi amacıyla kullanılır.',
                        'Ayrıca ölçümleme, güvenlik, dolandırıcılık önleme, sözleşmesel yükümlülüklerin yerine getirilmesi ve yasal saklama yükümlülükleri için de veri işlenebilir.'
                    ]
                },
                {
                    title: '3. Ödeme ve üçüncü taraf hizmet sağlayıcılar',
                    paragraphs: [
                        'Ödeme işlemleri, güvenli sanal POS altyapısı sağlayan Lidio ve ilgili banka/ödeme kuruluşları aracılığıyla yürütülür. Kart verileri khilonfast tarafından saklanmaz; ödeme sağlayıcının güvenli altyapısında işlenir.',
                        'Analitik, e-posta, altyapı ve müşteri deneyimi hizmetleri için yalnızca hizmetin sunulması açısından gerekli olan üçüncü taraf araçlar kullanılabilir.'
                    ]
                },
                {
                    title: '4. Saklama süresi ve güvenlik',
                    paragraphs: [
                        'Veriler, ilgili hizmetin yürütülmesi, muhasebe ve yasal yükümlülüklerin yerine getirilmesi için gerekli süre boyunca saklanır. Süre sonunda veriler silinir, anonimleştirilir veya mevzuata uygun şekilde imha edilir.',
                        'Khilonfast, verilerin yetkisiz erişime, kayba, kötüye kullanıma ve hukuka aykırı işlenmeye karşı korunması için makul teknik ve idari tedbirler uygular.'
                    ]
                },
                {
                    title: '5. Kullanıcı hakları',
                    paragraphs: [
                        'İlgili kişiler; kendileriyle ilgili veri işlenip işlenmediğini öğrenme, veriye erişim talep etme, düzeltme, silme veya kısıtlama isteme ve ilgili mevzuat kapsamındaki diğer haklarını kullanma hakkına sahiptir.',
                        'Bu talepler için bizimle info@khilonfast.com adresi üzerinden iletişime geçebilirsiniz.'
                    ]
                }
            ]
        },
        cookiePolicy: {
            seoTitle: 'Çerez Politikası | khilonfast',
            seoDescription: 'Khilonfast çerez politikası; sitede kullanılan zorunlu, analitik ve reklam çerezlerinin amaçlarını ve kullanıcı tercih yönetimini açıklar.',
            eyebrow: 'Yasal Bilgilendirme',
            title: 'Çerez Politikası',
            intro: 'Bu politika, khilonfast web sitesinde kullanılan çerezleri, benzer teknolojileri ve kullanıcı tercih yönetimini açıklar. Yapı; Google’ın çerez kategorileri yaklaşımına paralel olarak zorunlu, analiz ve reklam/pazarlama grupları üzerinden ele alınır.',
            updatedLabel: 'Son güncelleme',
            updatedAt: '30 Mart 2026',
            sections: [
                {
                    title: '1. Çerez nedir?',
                    paragraphs: [
                        'Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınızda veya cihazınızda saklanan küçük veri dosyalarıdır. Benzer teknolojiler; yerel depolama, piksel etiketleri ve oturum bazlı tanımlayıcılar gibi araçları da içerebilir.',
                        'Bu teknolojiler; oturumun sürdürülmesi, tercihlerin hatırlanması, güvenlik, kullanım analizi ve izin verilmesi halinde reklam performansı ölçümü için kullanılabilir.'
                    ]
                },
                {
                    title: '2. Kullandığımız çerez kategorileri',
                    paragraphs: [
                        'Khilonfast, sitede kullanılan teknolojileri aşağıdaki kategoriler altında yönetir. Zorunlu kategoriler, sitenin temel şekilde çalışması için gereklidir ve kapatılamaz.',
                        'Analitik ve reklam/pazarlama kategorileri ise yalnızca kullanıcı tercihi doğrultusunda etkinleştirilir.'
                    ],
                    bullets: [
                        'Zorunlu çerezler: güvenlik, oturum devamlılığı, sepet ve temel site işlevleri için kullanılır.',
                        'Analitik çerezler: site kullanımını anlamak, performansı ölçmek ve deneyimi iyileştirmek için kullanılır.',
                        'Reklam / pazarlama çerezleri: reklam ölçümü, dönüşüm izleme ve izin verildiğinde kişiselleştirme amaçlarıyla kullanılır.'
                    ]
                },
                {
                    title: '3. Google etiketleri ve izin yönetimi',
                    paragraphs: [
                        'Sitemizde Google Tag Manager altyapısı kullanılmaktadır. Ancak analitik veya reklam amaçlı Google etiketleri, kullanıcı tercih etmeden etkinleştirilmez.',
                        'İzin yönetimimiz Consent Mode v2 mantığına göre çalışır. Reklam ve analitik için varsayılan durum reddedilmiş olarak başlar; kullanıcı tercih verdiğinde ilgili izin sinyalleri güncellenir.'
                    ],
                    bullets: [
                        'analytics_storage',
                        'ad_storage',
                        'ad_user_data',
                        'ad_personalization'
                    ]
                },
                {
                    title: '4. Tercihlerinizi nasıl yönetebilirsiniz?',
                    paragraphs: [
                        'İlk ziyaretinizde gösterilen çerez bannerı üzerinden tümünü kabul edebilir, reddedebilir veya tercihlerinizi ayrı ayrı yönetebilirsiniz.',
                        'Tercihlerinizi daha sonra sitenin alt kısmındaki “Çerez Tercihlerini Yönet” bağlantısı üzerinden yeniden güncelleyebilirsiniz. Ayrıca tarayıcı ayarlarınız üzerinden de çerezleri silebilir veya engelleyebilirsiniz.'
                    ]
                },
                {
                    title: '5. Politika güncellemeleri',
                    paragraphs: [
                        'Çerez kategorileri, kullanılan araçlar veya hukuki gereklilikler değişirse bu politika güncellenebilir. Önemli değişikliklerde çerez tercihlerinizi yeniden gözden geçirmenizi isteyebiliriz.'
                    ]
                }
            ]
        },
        termsOfService: {
            seoTitle: 'Hizmet Şartları | khilonfast',
            seoDescription: 'Khilonfast hizmet şartları; dijital ürün, eğitim, danışmanlık ve ödeme süreçlerine ilişkin kullanım koşullarını ve taraf yükümlülüklerini açıklar.',
            eyebrow: 'Yasal Bilgilendirme',
            title: 'Hizmet Şartları',
            intro: 'Bu hizmet şartları, khilonfast üzerinden sunulan dijital ürünler, eğitim programları, danışmanlık hizmetleri ve bağlantılı satın alma süreçlerinde tarafların hak ve yükümlülüklerini düzenler.',
            updatedLabel: 'Son güncelleme',
            updatedAt: '30 Mart 2026',
            sections: [
                {
                    title: '1. Hizmet kapsamı',
                    paragraphs: [
                        'Khilonfast, dijital pazarlama hizmetleri, eğitim programları, yapay zeka destekli ürünler, analiz araçları ve danışmanlık çözümleri sunar.',
                        'Satın alınan hizmet veya içerik; ürün sayfasında, teklif metninde ya da satın alma ekranında belirtilen kapsama göre ifa edilir.'
                    ]
                },
                {
                    title: '2. Hesap, erişim ve kullanım',
                    paragraphs: [
                        'Satın alma sonrasında ilgili içerik veya hizmet erişimi kullanıcı hesabına tanımlanır. Kullanıcı, hesap ve erişim bilgilerinin güvenliğini korumakla yükümlüdür.',
                        'İçeriklerin izinsiz paylaşılması, çoğaltılması, yeniden satılması veya üçüncü taraflara devredilmesi yasaktır.'
                    ]
                },
                {
                    title: '3. Satın alma ve ödeme',
                    paragraphs: [
                        'Ödemeler güvenli ödeme altyapısı üzerinden yürütülür. Fiyatlandırma, ilgili ürün veya hizmet sayfasında belirtilen paket, kapsam ve para birimine göre uygulanır.',
                        'İşletme adına yapılan satın alımlarda fatura bilgileri kullanıcının beyanına dayanır. Hatalı veya eksik bilgi verilmesinden doğan sorumluluk kullanıcıya aittir.'
                    ]
                },
                {
                    title: '4. Teslim ve ifa modeli',
                    paragraphs: [
                        'Dijital ürünler ve eğitim içerikleri, ödeme sonrasında kullanıcı paneline erişim olarak teslim edilebilir. Danışmanlık ve hizmet paketlerinde süreç; brief, analiz, onay ve uygulama aşamalarına göre ilerler.',
                        'Khilonfast, bakım, güvenlik veya operasyonel nedenlerle planlı güncellemeler ve hizmet kesintileri yapabilir.'
                    ]
                },
                {
                    title: '5. Sorumluluk sınırları',
                    paragraphs: [
                        'Khilonfast, hizmetleri profesyonel özen çerçevesinde sunar; ancak kullanıcı tarafından sağlanan eksik/hatalı bilgi, üçüncü taraf platform kaynaklı kesintiler veya kullanıcı tarafındaki operasyonel gecikmelerden doğan sonuçlardan sınırsız sorumluluk kabul etmez.',
                        'Yasal olarak zorunlu olmayan hallerde dolaylı zarar, kâr kaybı veya veri kaybı gibi sonuçsal zararlardan sorumluluk üstlenilmez.'
                    ]
                }
            ]
        },
        refundPolicy: {
            seoTitle: 'İade ve İptal Politikası | khilonfast',
            seoDescription: 'Khilonfast iade ve iptal politikası; dijital ürünler, eğitimler ve hizmet paketlerinde iptal, cayma ve geri ödeme koşullarını açıklar.',
            eyebrow: 'Yasal Bilgilendirme',
            title: 'İade ve İptal Politikası',
            intro: 'Bu politika, khilonfast üzerinden satın alınan dijital ürünler, eğitim programları, analiz hizmetleri ve danışmanlık paketleri için iptal ve geri ödeme süreçlerini açıklar.',
            updatedLabel: 'Son güncelleme',
            updatedAt: '30 Mart 2026',
            sections: [
                {
                    title: '1. Genel yaklaşım',
                    paragraphs: [
                        'Khilonfast üzerinden sunulan hizmetlerin önemli bir bölümü dijital içerik, erişim tanımı, uzman zamanı ve proje bazlı hizmet niteliğindedir.',
                        'Bu nedenle iade ve iptal talepleri; hizmetin niteliği, erişimin tanımlanıp tanımlanmadığı, çalışmanın başlayıp başlamadığı ve yasal zorunluluklara göre değerlendirilir.'
                    ]
                },
                {
                    title: '2. Dijital ürünler ve eğitimler',
                    paragraphs: [
                        'Dijital ürün veya eğitim erişimi kullanıcı hesabına tanımlanmadan önce yazılı olarak iptal talep edilirse başvuru değerlendirilir.',
                        'Erişim tanımlandıktan, içerik açıldıktan veya dijital teslim gerçekleştiğinde; ürün niteliği gereği iade hakkı sınırlanabilir ya da uygulanmayabilir.'
                    ]
                },
                {
                    title: '3. Hizmet ve danışmanlık paketleri',
                    paragraphs: [
                        'Brief toplama, strateji çalışması, analiz, kurulum, içerik üretimi, raporlama veya danışmanlık oturumu başladıysa; kullanılan emek ve ayrılan kapasite dikkate alınarak kısmi ya da sıfır iade değerlendirmesi yapılabilir.',
                        'Henüz çalışma başlamamış ve operasyonel planlama yapılmamış satın almalarda, talep özelinde iptal değerlendirmesi yapılır.'
                    ]
                },
                {
                    title: '4. İade talebi nasıl yapılır?',
                    paragraphs: [
                        'İptal veya iade taleplerinizi sipariş numaranız, ad-soyadınız ve talep gerekçenizle birlikte info@khilonfast.com adresine iletebilirsiniz.',
                        'Başvurular mümkün olan en kısa sürede incelenir. Onaylanan iadelerde geri ödeme, ödeme aracı ve banka süreçlerine bağlı olarak ilgili kart veya hesap üzerinden tamamlanır.'
                    ]
                },
                {
                    title: '5. İstisnalar',
                    paragraphs: [
                        'Aşağıdaki durumlarda iade talebi reddedilebilir veya kısmi değerlendirmeye alınabilir.'
                    ],
                    bullets: [
                        'Dijital erişimin teslim edilmiş veya kullanılmış olması',
                        'Projeye özel strateji, analiz veya içerik üretimine başlanmış olması',
                        'Randevulu danışmanlık / eğitim oturumunun gerçekleştirilmiş olması',
                        'Kullanıcının eksik bilgi vermesi nedeniyle süreçte yaşanan gecikmeler',
                        'Yasal olarak iade zorunluluğu doğurmayan kullanım ve teslim senaryoları'
                    ]
                }
            ]
        }
    },
    en: {
        privacyPolicy: {
            seoTitle: 'Privacy Policy | khilonfast',
            seoDescription: 'The khilonfast privacy policy explains what personal data is processed, why it is processed, and how user rights can be exercised.',
            eyebrow: 'Legal Information',
            title: 'Privacy Policy',
            intro: 'This policy explains how personal data is processed across the khilonfast website, digital products, trainings, consulting programs, and payment-related workflows.',
            updatedLabel: 'Last updated',
            updatedAt: 'March 30, 2026',
            sections: [
                {
                    title: '1. Information we collect',
                    paragraphs: [
                        'Khilonfast may process personal data shared through contact forms, account creation, purchases, brief collection, consulting requests, and support workflows.',
                        'This may include name, email address, phone number, company details, invoicing details, order records, service preferences, and project materials provided by the user.'
                    ],
                    bullets: [
                        'Identity and contact information',
                        'Company, invoicing, and tax information',
                        'Order, payment, and delivery records',
                        'Form, brief, and communication content',
                        'Technical logs and security records related to site usage'
                    ]
                },
                {
                    title: '2. Why we use the data',
                    paragraphs: [
                        'We use personal data to deliver services, complete orders, manage payments, grant access to purchased content, and respond to support requests.',
                        'Data may also be processed for analytics, security, fraud prevention, contractual performance, and compliance with legal retention obligations.'
                    ]
                },
                {
                    title: '3. Payments and third-party providers',
                    paragraphs: [
                        'Payments are processed through Lidio and affiliated banking/payment institutions. Card data is not stored by khilonfast and is handled within the secure infrastructure of the payment provider.',
                        'Third-party tools may also be used for analytics, email delivery, infrastructure, and customer experience only to the extent needed to operate the service.'
                    ]
                },
                {
                    title: '4. Retention and security',
                    paragraphs: [
                        'Personal data is retained for as long as required to provide the service, fulfill accounting obligations, and comply with applicable legal duties. After that, data is deleted, anonymized, or destroyed in accordance with the law.',
                        'Khilonfast applies reasonable technical and organizational safeguards to protect data against unauthorized access, loss, misuse, and unlawful processing.'
                    ]
                },
                {
                    title: '5. User rights',
                    paragraphs: [
                        'Data subjects may request information about whether their data is processed, ask for access, correction, deletion, restriction, or exercise other rights granted under applicable law.',
                        'To submit a request, contact us at info@khilonfast.com.'
                    ]
                }
            ]
        },
        cookiePolicy: {
            seoTitle: 'Cookie Policy | khilonfast',
            seoDescription: 'The khilonfast cookie policy explains the purpose of essential, analytics, and advertising cookies and how preferences are managed.',
            eyebrow: 'Legal Information',
            title: 'Cookie Policy',
            intro: 'This policy explains the cookies and similar technologies used on the khilonfast website. The structure follows Google’s transparency model by grouping technologies under essential, analytics, and advertising / marketing categories.',
            updatedLabel: 'Last updated',
            updatedAt: 'March 30, 2026',
            sections: [
                {
                    title: '1. What is a cookie?',
                    paragraphs: [
                        'Cookies are small data files stored in your browser or device when you visit a website. Similar technologies may also include local storage, pixels, and session-based identifiers.',
                        'These technologies can be used to keep a session active, remember preferences, maintain security, understand site usage, and, where permitted, measure advertising performance.'
                    ]
                },
                {
                    title: '2. Cookie categories we use',
                    paragraphs: [
                        'Khilonfast manages site technologies under the categories below. Essential categories are required for the site to function and cannot be switched off.',
                        'Analytics and advertising / marketing categories are activated only based on the user’s preference.'
                    ],
                    bullets: [
                        'Essential cookies: security, session continuity, cart, and core site functions',
                        'Analytics cookies: used to understand usage, measure performance, and improve the experience',
                        'Advertising / marketing cookies: used for ad measurement, conversion tracking, and, when permitted, personalization'
                    ]
                },
                {
                    title: '3. Google tags and consent management',
                    paragraphs: [
                        'Our website uses Google Tag Manager infrastructure. However, analytics or advertising-related Google tags are not activated before the user makes a choice.',
                        'Our implementation follows Consent Mode v2 logic. Advertising and analytics start in a denied state by default, and consent signals are updated only after user selection.'
                    ],
                    bullets: [
                        'analytics_storage',
                        'ad_storage',
                        'ad_user_data',
                        'ad_personalization'
                    ]
                },
                {
                    title: '4. How to manage your preferences',
                    paragraphs: [
                        'On your first visit, you can accept all cookies, reject optional cookies, or manage your choices in detail through the cookie banner.',
                        'You can later update your choices at any time through the “Manage Cookie Preferences” link in the footer. You may also remove or block cookies in your browser settings.'
                    ]
                },
                {
                    title: '5. Policy updates',
                    paragraphs: [
                        'This policy may be updated if cookie categories, tools, or legal requirements change. If a material update occurs, we may ask you to review your consent preferences again.'
                    ]
                }
            ]
        },
        termsOfService: {
            seoTitle: 'Terms of Service | khilonfast',
            seoDescription: 'The khilonfast terms of service define the conditions governing digital products, trainings, consulting services, and payment-related obligations.',
            eyebrow: 'Legal Information',
            title: 'Terms of Service',
            intro: 'These terms govern the use of digital products, training programs, consulting services, and related purchase flows offered through khilonfast.',
            updatedLabel: 'Last updated',
            updatedAt: 'March 30, 2026',
            sections: [
                {
                    title: '1. Scope of services',
                    paragraphs: [
                        'Khilonfast offers digital marketing services, training programs, AI-assisted products, analytics solutions, and consulting services.',
                        'Each purchase is fulfilled according to the scope described on the relevant product page, offer, or checkout flow.'
                    ]
                },
                {
                    title: '2. Accounts, access, and permitted use',
                    paragraphs: [
                        'After purchase, access to the relevant content or service may be assigned to the user account. The user is responsible for maintaining the security of account and access credentials.',
                        'Unauthorized sharing, copying, resale, redistribution, or transfer of content is prohibited.'
                    ]
                },
                {
                    title: '3. Purchases and payments',
                    paragraphs: [
                        'Payments are handled through secure payment infrastructure. Pricing follows the package, scope, and currency stated on the relevant product or service page.',
                        'For business purchases, invoicing is based on the information declared by the user. The user remains responsible for inaccurate or incomplete billing details.'
                    ]
                },
                {
                    title: '4. Delivery and performance model',
                    paragraphs: [
                        'Digital products and training materials may be delivered as account-based access after payment. Service and consulting packages progress through stages such as brief, analysis, approval, and implementation.',
                        'Khilonfast may perform planned updates or interruptions for maintenance, security, or operational reasons.'
                    ]
                },
                {
                    title: '5. Limitation of liability',
                    paragraphs: [
                        'Khilonfast provides services with professional care, but does not accept unlimited liability for outcomes caused by incomplete user input, third-party platform interruptions, or operational delays on the client side.',
                        'Unless required by law, khilonfast does not assume liability for indirect, incidental, consequential, or lost-profit damages.'
                    ]
                }
            ]
        },
        refundPolicy: {
            seoTitle: 'Cancellation and Refund Policy | khilonfast',
            seoDescription: 'The khilonfast cancellation and refund policy explains cancellation, withdrawal, and refund conditions for digital products, trainings, and service packages.',
            eyebrow: 'Legal Information',
            title: 'Cancellation and Refund Policy',
            intro: 'This policy explains how cancellation and refund requests are handled for digital products, training programs, analytics services, and consulting packages purchased through khilonfast.',
            updatedLabel: 'Last updated',
            updatedAt: 'March 30, 2026',
            sections: [
                {
                    title: '1. General approach',
                    paragraphs: [
                        'Many services offered through khilonfast are digital content, account-based access, expert time, or project-based professional services.',
                        'For that reason, cancellation and refund requests are assessed based on the nature of the service, whether access has been granted, whether work has started, and what applicable law requires.'
                    ]
                },
                {
                    title: '2. Digital products and trainings',
                    paragraphs: [
                        'If cancellation is requested in writing before digital access is assigned to the user account, the request may be reviewed.',
                        'Once access has been assigned, content has been opened, or digital delivery has taken place, refund rights may be limited or may no longer apply depending on the nature of the product.'
                    ]
                },
                {
                    title: '3. Service and consulting packages',
                    paragraphs: [
                        'If brief collection, strategy work, analysis, setup, content production, reporting, or consulting sessions have already started, a partial or zero-refund evaluation may apply depending on the work already performed and the capacity reserved.',
                        'Where no work has started and no operational planning has been made, cancellation may be reviewed on a case-by-case basis.'
                    ]
                },
                {
                    title: '4. How to request a refund',
                    paragraphs: [
                        'To request a cancellation or refund, email info@khilonfast.com with your order number, full name, and the reason for the request.',
                        'Approved refunds are returned through the relevant payment method, subject to bank and payment provider processing times.'
                    ]
                },
                {
                    title: '5. Exceptions',
                    paragraphs: [
                        'Refunds may be declined or partially evaluated in the following situations.'
                    ],
                    bullets: [
                        'Digital access has already been delivered or used',
                        'Custom strategy, analysis, or content production has already started',
                        'A scheduled consulting or training session has already taken place',
                        'The process was delayed because the user failed to provide required information',
                        'The scenario does not create a mandatory refund obligation under applicable law'
                    ]
                }
            ]
        }
    }
}

export const checkoutLegalContent: Record<AppLocale, CheckoutLegalCopy> = {
    tr: {
        privacyLabel: 'Gizlilik Politikası’nı okudum ve kabul ediyorum.',
        termsTitle: 'Hizmet şartlarını ve iade politikasını gözden geçirin',
        termsDescription: 'Devam etmeden önce satın alma, teslim, erişim ve iade koşullarını inceleyin.',
        termsHeading: 'Satın alma özeti',
        termsIntro: 'Bu adımda, ödeme öncesi kabul ettiğiniz temel koşulların kısa özetini görürsünüz. Tam metinlere aşağıdaki bağlantılardan ulaşabilirsiniz.',
        termsBullets: [
            'Satın alınan dijital içerik ve hizmetler kullanıcı hesabına tanımlanır.',
            'Ödeme güvenli sanal POS altyapısı üzerinden gerçekleştirilir.',
            'Dijital erişim teslim edildikten veya hizmet başladıktan sonra iade hakkı sınırlı olabilir.',
            'Fatura ve şirket bilgileri kullanıcı beyanına göre işlenir.',
            'Gizlilik, çerez ve hizmet şartları satın alma sürecinin ayrılmaz parçasıdır.'
        ],
        termsReviewHint: 'Devam etmek için bu özet alanının sonuna inin ve tam metin bağlantılarını inceleyin.',
        policyLinksLabel: 'Tam metinler'
    },
    en: {
        privacyLabel: 'I have read and accept the Privacy Policy.',
        termsTitle: 'Review the terms of service and refund policy',
        termsDescription: 'Before continuing, review the key conditions related to purchase, delivery, access, and refunds.',
        termsHeading: 'Purchase summary',
        termsIntro: 'This step shows a short summary of the main terms you accept before payment. Full documents are available through the links below.',
        termsBullets: [
            'Purchased digital content and services are assigned to the user account.',
            'Payments are completed through secure virtual POS infrastructure.',
            'Refund rights may be limited once digital access has been delivered or service work has started.',
            'Company and invoicing data are processed based on user declarations.',
            'Privacy, cookies, and terms of service form an integral part of the purchase flow.'
        ],
        termsReviewHint: 'Scroll to the end of this summary and review the full policy links before continuing.',
        policyLinksLabel: 'Full documents'
    }
}
