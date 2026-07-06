import type { AppLocale } from '../utils/locale'
import type { LocalizedProgram, LocalizedValue } from '../utils/localizedContent'
import { getLocalizedPrograms, pickLocalizedValue } from '../utils/localizedContent'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'

export interface ConsultingProgram {
    path: string
    productKey: string
    title: string
    summary: string
    aiAnswer: { question: string; answer: string }
}

interface ConsultingProgramCatalogEntry extends LocalizedProgram {
    aiAnswer: {
        question: LocalizedValue
        answer: LocalizedValue
    }
}

const trSlugs = trCommon.slugs as Record<string, string>
const enSlugs = enCommon.slugs as Record<string, string>

function buildLocalizedConsultingPath(locale: AppLocale, slugKey: string): string {
    const slugMap = locale === 'en' ? enSlugs : trSlugs
    const prefix = locale === 'en' ? '/en' : ''
    return `${prefix}/${slugMap[slugKey]}`.replace(/\/{2,}/g, '/')
}

export const consultingProgramCatalog: ConsultingProgramCatalogEntry[] = [
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingPayment'),
            en: buildLocalizedConsultingPath('en', 'consultingPayment')
        },
        productKey: 'consulting-odeme-sistemlerinde-buyume',
        title: {
            tr: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Payment Systems'
        },
        summary: {
            tr: 'Ödeme sistemleri şirketinizde yüz yüze, uygulamalı büyüme odaklı pazarlama danışmanlığı. Uyumlu kampanya, dönüşüm ve karar verici hedefleme planlaması.',
            en: 'Hands-on growth-focused marketing consulting for payment systems firms. Compliant campaigns, conversion planning, and decision-maker targeting.'
        },
        aiAnswer: {
            question: {
                tr: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Payment Systems?'
            },
            answer: {
                tr: 'CMO Bora Işık\'ın şirketinizde yüz yüze verdiği 10+1 seanslık danışmanlık programıdır. Ödeme sistemleri sektörüne özgü uyum gereksinimleri ve karar verici çeşitliliğini gözeterek kampanya ve dönüşüm planlaması yapılandırır.',
                en: 'A 10+1 session on-site consulting program led by CMO Bora Işık at your company. It structures campaign and conversion planning around payment systems\' compliance requirements and diverse decision-makers.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingB2B'),
            en: buildLocalizedConsultingPath('en', 'consultingB2B')
        },
        productKey: 'consulting-b2b-sektorunde-buyume',
        title: {
            tr: 'B2B Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for B2B Companies'
        },
        summary: {
            tr: 'B2B firmanızda pazarlama ve satış entegrasyonu danışmanlığı. Khilonfast ile alıcı yolculuğu, MQL/SQL süreci ve içerik stratejisi kurgusu.',
            en: 'Marketing & sales integration consulting at your B2B firm. Khilonfast designs buyer journey, MQL/SQL flow, and content strategy hands-on.'
        },
        aiAnswer: {
            question: {
                tr: 'B2B Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for B2B Companies?'
            },
            answer: {
                tr: 'Şirketinizde yüz yüze verilen 10+1 seanslık danışmanlık programıdır. B2B firmanızın uzun satış döngüsü ve çok paydaşlı karar sürecine göre alıcı yolculuğu, MQL/SQL akışı ve içerik stratejisini birlikte kurgular.',
                en: 'A 10+1 session on-site consulting program at your company. It co-builds buyer journey, MQL/SQL flow, and content strategy tailored to your B2B firm\'s long sales cycle and multi-stakeholder decisions.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingFintech'),
            en: buildLocalizedConsultingPath('en', 'consultingFintech')
        },
        productKey: 'consulting-fintech-sektorunde-buyume',
        title: {
            tr: 'Fintech Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Fintech Companies'
        },
        summary: {
            tr: 'Fintech firmanızda büyüme stratejileri ve kanal optimizasyonu danışmanlığı. Uyumlu içerik, hedefleme ve dönüşüm planlamasını yapılandırın.',
            en: 'Growth strategies and channel optimization consulting at your fintech firm. Build compliant content, targeting, and conversion plans hands-on.'
        },
        aiAnswer: {
            question: {
                tr: 'Fintech Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Fintech Companies?'
            },
            answer: {
                tr: 'Fintech firmanızda yüz yüze verilen 10+1 seanslık danışmanlık programıdır. Hızlı büyüme ve düzenleyici uyum baskısını dengeleyen kanal optimizasyonu ve dönüşüm odaklı içerik stratejisi kurgular.',
                en: 'A 10+1 session on-site consulting program at your fintech firm. It builds channel optimization and conversion-focused content strategy that balances fast growth with regulatory compliance.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingTech'),
            en: buildLocalizedConsultingPath('en', 'consultingTech')
        },
        productKey: 'consulting-teknoloji-yazilim-buyume',
        title: {
            tr: 'Teknoloji & Yazılım Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Tech & Software Companies'
        },
        summary: {
            tr: 'SaaS ve teknoloji şirketinizde performans odaklı pazarlama danışmanlığı. Ürün-pazar uyumu, talep yaratma ve aktivasyon süreçlerini birlikte ölçeklendirin.',
            en: 'Performance-driven marketing consulting at your SaaS or tech company. Scale product-market fit, demand generation, and activation together.'
        },
        aiAnswer: {
            question: {
                tr: 'Teknoloji & Yazılım Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Tech & Software Companies?'
            },
            answer: {
                tr: 'SaaS/teknoloji şirketinizde yüz yüze verilen 10+1 seanslık danışmanlık programıdır. Ürün-pazar uyumu, talep yaratma ve aktivasyon süreçlerini ekibinizle birlikte ölçeklendirir.',
                en: 'A 10+1 session on-site consulting program at your SaaS or tech company. It scales product-market fit, demand generation, and activation processes together with your team.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingManufacturing'),
            en: buildLocalizedConsultingPath('en', 'consultingManufacturing')
        },
        productKey: 'consulting-uretim-sektorunde-buyume',
        title: {
            tr: 'Üretim Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Manufacturing Companies'
        },
        summary: {
            tr: 'Üretim firmanızda sürdürülebilir talep ve dönüşüm yönetimi danışmanlığı. B2B alıcı yolculuğu, teklif süreci ve içerik stratejisini birlikte yapılandırın.',
            en: 'Sustainable demand and conversion management consulting for manufacturers. Structure B2B buyer journey, quote workflows, and content strategy.'
        },
        aiAnswer: {
            question: {
                tr: 'Üretim Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Manufacturing Companies?'
            },
            answer: {
                tr: 'Üretim firmanızda yüz yüze verilen 10+1 seanslık danışmanlık programıdır. Uzun teklif süreçlerinizi ve B2B alıcı yolculuğunuzu analiz ederek sürdürülebilir talep ve dönüşüm yönetimi kurgular.',
                en: 'A 10+1 session on-site consulting program at your manufacturing firm. It analyzes your long quote processes and B2B buyer journey to structure sustainable demand and conversion management.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingEnergy'),
            en: buildLocalizedConsultingPath('en', 'consultingEnergy')
        },
        productKey: 'consulting-enerji-sektorunde-buyume',
        title: {
            tr: 'Enerji Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Energy Companies'
        },
        summary: {
            tr: 'Enerji şirketinizde karar verici odaklı pazarlama planlama danışmanlığı. Stratejik kampanya altyapısı, içerik ve performans planlamayı birlikte kurgulayın.',
            en: 'Decision-maker-focused marketing consulting at your energy firm. Build strategic campaign infrastructure, content, and performance plans.'
        },
        aiAnswer: {
            question: {
                tr: 'Enerji Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Energy Companies?'
            },
            answer: {
                tr: 'Enerji şirketinizde yüz yüze verilen 10+1 seanslık danışmanlık programıdır. Karmaşık karar verici yapınızı analiz ederek stratejik kampanya altyapısı ve içerik planlamasını birlikte kurgular.',
                en: 'A 10+1 session on-site consulting program at your energy firm. It analyzes your complex decision-maker structure to co-build strategic campaign infrastructure and content planning.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingDesign'),
            en: buildLocalizedConsultingPath('en', 'consultingDesign')
        },
        productKey: 'consulting-ofis-kurumsal-ic-tasarim-buyume',
        title: {
            tr: 'Ofis & Kurumsal İç Tasarım Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Corporate Interior Design Companies'
        },
        summary: {
            tr: 'Kurumsal iç tasarım firmanızda tekliften satışa pazarlama danışmanlığı. Portföy temelli içerik, referans yönetimi ve teklif sürecini birlikte yapılandırın.',
            en: 'Proposal-to-sale marketing consulting for corporate interior design firms. Build portfolio-led content, referrals, and quote workflows together.'
        },
        aiAnswer: {
            question: {
                tr: 'Ofis & Kurumsal İç Tasarım Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Corporate Interior Design Companies?'
            },
            answer: {
                tr: 'Kurumsal iç tasarım firmanızda yüz yüze verilen 10+1 seanslık danışmanlık programıdır. Portföy odaklı satış sürecinizi ele alarak referans yönetimi ve teklif akışını birlikte yapılandırır.',
                en: 'A 10+1 session on-site consulting program at your corporate interior design firm. It addresses your portfolio-driven sales process to co-structure referral management and quote workflows.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingFleet'),
            en: buildLocalizedConsultingPath('en', 'consultingFleet')
        },
        productKey: 'consulting-filo-kiralama-sektorunde-buyume',
        title: {
            tr: 'Filo Kiralama Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Fleet Rental Companies'
        },
        summary: {
            tr: 'Filo kiralama firmanızda lead kalitesi ve dönüşüm yönetimi danışmanlığı. Kurumsal mobilite teklif sürecini ve müşteri elde tutmayı birlikte güçlendirin.',
            en: 'Lead quality and conversion management consulting at your fleet rental firm. Strengthen corporate mobility quote workflows and customer retention together.'
        },
        aiAnswer: {
            question: {
                tr: 'Filo Kiralama Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Fleet Rental Companies?'
            },
            answer: {
                tr: 'Filo kiralama firmanızda yüz yüze verilen 10+1 seanslık danışmanlık programıdır. Kurumsal mobilite teklif sürecinizi analiz ederek lead kalitesi ve müşteri elde tutmayı birlikte güçlendirir.',
                en: 'A 10+1 session on-site consulting program at your fleet rental firm. It analyzes your corporate mobility quote process to strengthen lead quality and customer retention together.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingFood'),
            en: buildLocalizedConsultingPath('en', 'consultingFood')
        },
        productKey: 'consulting-endustriyel-gida-sektorunde-buyume',
        title: {
            tr: 'Endüstriyel Gıda Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Industrial Food Companies'
        },
        summary: {
            tr: 'Endüstriyel gıda sektörüne özel büyüme odaklı pazarlama danışmanlığı. B2B kanal stratejisi, satış noktası ve içerik planlaması birlikte.',
            en: 'Growth-focused marketing consulting for the industrial food sector. Build B2B channel strategy, per-location performance, and content plans.'
        },
        aiAnswer: {
            question: {
                tr: 'Endüstriyel Gıda Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Industrial Food Companies?'
            },
            answer: {
                tr: 'Endüstriyel gıda firmanızda yüz yüze verilen 10+1 seanslık danışmanlık programıdır. B2B kanal stratejinizi ve tedarik zinciri dinamiklerinizi analiz ederek içerik ve performans planlamasını birlikte kurgular.',
                en: 'A 10+1 session on-site consulting program at your industrial food firm. It analyzes your B2B channel strategy and supply chain dynamics to co-build content and performance planning.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingGiftCard'),
            en: buildLocalizedConsultingPath('en', 'consultingGiftCard')
        },
        productKey: 'consulting-kurumsal-hediye-karti-buyume',
        title: {
            tr: 'Kurumsal Hediye Kartı Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Corporate Gift Card Companies'
        },
        summary: {
            tr: 'Kurumsal hediye kartı firmanızda büyüme odaklı pazarlama danışmanlığı. B2B satın alma merkezlerini besleyen kampanya ve içerik stratejisi.',
            en: 'Growth-focused marketing consulting at your corporate gift card firm. Build campaign and content strategy nurturing B2B buying centers, hands-on together.'
        },
        aiAnswer: {
            question: {
                tr: 'Kurumsal Hediye Kartı Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Corporate Gift Card Companies?'
            },
            answer: {
                tr: 'Kurumsal hediye kartı firmanızda yüz yüze verilen 10+1 seanslık danışmanlık programıdır. B2B satın alma merkezlerinizi besleyen kampanya ve içerik stratejisini birlikte kurgular.',
                en: 'A 10+1 session on-site consulting program at your corporate gift card firm. It co-builds campaign and content strategy that nurtures your B2B buying centers.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedConsultingPath('tr', 'consultingFuel'),
            en: buildLocalizedConsultingPath('en', 'consultingFuel')
        },
        productKey: 'consulting-kurumsal-akaryakit-buyume',
        title: {
            tr: 'Kurumsal Akaryakıt Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
            en: 'Growth-Focused Marketing Consulting for Corporate Fuel Solution Companies'
        },
        summary: {
            tr: 'Kurumsal akaryakıt firmanızda büyüme odaklı pazarlama danışmanlığı. Filo yöneticilerini hedefleyen içerik ve performans stratejisini birlikte yapılandırın.',
            en: 'Growth-focused marketing consulting for corporate fuel firms. Build content and performance strategy targeting fleet managers, hands-on.'
        },
        aiAnswer: {
            question: {
                tr: 'Kurumsal Akaryakıt Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı nedir?',
                en: 'What is the Growth-Focused Marketing Consulting for Corporate Fuel Solution Companies?'
            },
            answer: {
                tr: 'Kurumsal akaryakıt firmanızda yüz yüze verilen 10+1 seanslık danışmanlık programıdır. Filo yöneticilerini hedefleyen içerik ve performans stratejisini ekibinizle birlikte yapılandırır.',
                en: 'A 10+1 session on-site consulting program at your corporate fuel firm. It co-builds content and performance strategy targeting fleet managers with your team.'
            }
        }
    }
]

function localizeConsultingPrograms(locale: AppLocale): ConsultingProgram[] {
    const base = getLocalizedPrograms(locale, consultingProgramCatalog) as Omit<ConsultingProgram, 'aiAnswer'>[]
    return base.map((program, index) => ({
        ...program,
        aiAnswer: {
            question: pickLocalizedValue(locale, consultingProgramCatalog[index].aiAnswer.question),
            answer: pickLocalizedValue(locale, consultingProgramCatalog[index].aiAnswer.answer)
        }
    }))
}

export const consultingPrograms: ConsultingProgram[] = localizeConsultingPrograms('tr')

export function getConsultingPrograms(locale: AppLocale): ConsultingProgram[] {
    return localizeConsultingPrograms(locale)
}
