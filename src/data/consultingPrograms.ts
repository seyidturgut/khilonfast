import type { AppLocale } from '../utils/locale'
import type { LocalizedProgram } from '../utils/localizedContent'
import { getLocalizedPrograms } from '../utils/localizedContent'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'

export interface ConsultingProgram {
    path: string
    productKey: string
    title: string
    summary: string
}

const trSlugs = trCommon.slugs as Record<string, string>
const enSlugs = enCommon.slugs as Record<string, string>

function buildLocalizedConsultingPath(locale: AppLocale, slugKey: string): string {
    const slugMap = locale === 'en' ? enSlugs : trSlugs
    const prefix = locale === 'en' ? '/en' : ''
    return `${prefix}/${slugMap[slugKey]}`.replace(/\/{2,}/g, '/')
}

export const consultingProgramCatalog: LocalizedProgram[] = [
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
        }
    }
]

export const consultingPrograms: ConsultingProgram[] = getLocalizedPrograms('tr', consultingProgramCatalog) as ConsultingProgram[]

export function getConsultingPrograms(locale: AppLocale): ConsultingProgram[] {
    return getLocalizedPrograms(locale, consultingProgramCatalog) as ConsultingProgram[]
}
