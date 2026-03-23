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
    return `/${slugMap[slugKey]}`.replace(/\/{2,}/g, '/')
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
            tr: 'Ödeme sistemleri şirketinizde yüz yüze, uygulamalı büyüme odaklı pazarlama danışmanlığı.',
            en: 'Face-to-face, hands-on growth-focused marketing consulting at your payment systems company.'
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
            tr: 'B2B firmanızda yüz yüze pazarlama ve satış entegrasyonu danışmanlığı.',
            en: 'Face-to-face marketing and sales integration consulting at your B2B company.'
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
            tr: 'Fintech firmanızda büyüme stratejileri ve kanal optimizasyonu danışmanlığı.',
            en: 'Growth strategies and channel optimization consulting at your fintech company.'
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
            tr: 'SaaS ve teknoloji şirketinizde performans odaklı danışmanlık.',
            en: 'Performance-oriented consulting at your SaaS or technology company.'
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
            tr: 'Üretim firmanızda sürdürülebilir talep ve dönüşüm yönetimi danışmanlığı.',
            en: 'Sustainable demand and conversion management consulting at your manufacturing company.'
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
            tr: 'Enerji şirketinizde karar verici odaklı pazarlama planlama danışmanlığı.',
            en: 'Decision-maker-focused marketing planning consulting at your energy company.'
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
            tr: 'Kurumsal iç tasarım firmanızda tekliften satışa pazarlama danışmanlığı.',
            en: 'From proposal to sale marketing consulting at your corporate interior design company.'
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
            tr: 'Filo kiralama firmanızda lead kalitesi ve dönüşüm yönetimi danışmanlığı.',
            en: 'Lead quality and conversion management consulting at your fleet rental company.'
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
            tr: 'Endüstriyel gıda sektörüne özel büyüme odaklı pazarlama danışmanlığı.',
            en: 'Growth-focused marketing consulting tailored to the industrial food sector.'
        }
    }
]

export const consultingPrograms: ConsultingProgram[] = getLocalizedPrograms('tr', consultingProgramCatalog) as ConsultingProgram[]

export function getConsultingPrograms(locale: AppLocale): ConsultingProgram[] {
    return getLocalizedPrograms(locale, consultingProgramCatalog) as ConsultingProgram[]
}
