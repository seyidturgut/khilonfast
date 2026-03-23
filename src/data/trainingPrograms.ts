import type { AppLocale } from '../utils/locale'
import type { LocalizedProgram } from '../utils/localizedContent'
import { getLocalizedPrograms } from '../utils/localizedContent'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'

export interface TrainingProgram {
    path: string
    productKey: string
    title: string
    summary: string
}

const trSlugs = trCommon.slugs as Record<string, string>
const enSlugs = enCommon.slugs as Record<string, string>

function buildLocalizedTrainingPath(locale: AppLocale, slugKey: string): string {
    const slugMap = locale === 'en' ? enSlugs : trSlugs
    return `/${slugMap[slugKey]}`.replace(/\/{2,}/g, '/')
}

export const trainingProgramCatalog: LocalizedProgram[] = [
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingGrowth'),
            en: buildLocalizedTrainingPath('en', 'trainingGrowth')
        },
        productKey: 'training-buyume-odakli-pazarlama',
        title: {
            tr: 'Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training'
        },
        summary: {
            tr: 'khilonfast temel büyüme odaklı pazarlama eğitim programı.',
            en: 'The core khilonfast training program for growth-oriented marketing.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingPayment'),
            en: buildLocalizedTrainingPath('en', 'trainingPayment')
        },
        productKey: 'training-odeme-sistemlerinde-buyume',
        title: {
            tr: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Payment Systems'
        },
        summary: {
            tr: 'Satış hunisi, değer önerisi ve ölçümleme odaklı uygulamalı içerik.',
            en: 'Applied content focused on sales funnels, value proposition, and measurement.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingB2B'),
            en: buildLocalizedTrainingPath('en', 'trainingB2B')
        },
        productKey: 'training-b2b-sektorunde-buyume',
        title: {
            tr: 'B2B Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the B2B Sector'
        },
        summary: {
            tr: 'B2B firmalar için pazarlama ve satış entegrasyonu eğitim seti.',
            en: 'A training set on marketing and sales integration for B2B companies.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingFintech'),
            en: buildLocalizedTrainingPath('en', 'trainingFintech')
        },
        productKey: 'training-fintech-sektorunde-buyume',
        title: {
            tr: 'Fintech Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the Fintech Sector'
        },
        summary: {
            tr: 'Fintech odaklı büyüme stratejileri ve kanal optimizasyonu.',
            en: 'Fintech-focused growth strategies and channel optimization.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingTech'),
            en: buildLocalizedTrainingPath('en', 'trainingTech')
        },
        productKey: 'training-teknoloji-yazilim-buyume',
        title: {
            tr: 'Teknoloji & Yazılım Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Tech & Software'
        },
        summary: {
            tr: 'SaaS ve teknoloji markaları için performans odaklı eğitim içeriği.',
            en: 'Performance-oriented training content for SaaS and technology brands.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingManufacturing'),
            en: buildLocalizedTrainingPath('en', 'trainingManufacturing')
        },
        productKey: 'training-uretim-sektorunde-buyume',
        title: {
            tr: 'Üretim Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the Manufacturing Sector'
        },
        summary: {
            tr: 'Üretim firmaları için sürdürülebilir talep ve dönüşüm yönetimi.',
            en: 'Sustainable demand and conversion management for manufacturing companies.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingEnergy'),
            en: buildLocalizedTrainingPath('en', 'trainingEnergy')
        },
        productKey: 'training-enerji-sektorunde-buyume',
        title: {
            tr: 'Enerji Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the Energy Sector'
        },
        summary: {
            tr: 'Enerji sektöründe karar verici odaklı pazarlama planlama yaklaşımı.',
            en: 'A decision-maker-focused marketing planning approach for the energy sector.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingDesign'),
            en: buildLocalizedTrainingPath('en', 'trainingDesign')
        },
        productKey: 'training-ofis-kurumsal-ic-tasarim-buyume',
        title: {
            tr: 'Ofis & Kurumsal İç Tasarım Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Corporate Interior Design'
        },
        summary: {
            tr: 'Kurumsal iç tasarım firmaları için tekliften satışa pazarlama modeli.',
            en: 'A marketing model for corporate interior design firms, from proposal to sale.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingFleet'),
            en: buildLocalizedTrainingPath('en', 'trainingFleet')
        },
        productKey: 'training-filo-kiralama-sektorunde-buyume',
        title: {
            tr: 'Filo Kiralama Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Fleet Rental'
        },
        summary: {
            tr: 'Filo kiralama firmalarında lead kalitesi ve dönüşüm yönetimi eğitimi.',
            en: 'Training on lead quality and conversion management for fleet rental companies.'
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingFood'),
            en: buildLocalizedTrainingPath('en', 'trainingFood')
        },
        productKey: 'training-endustriyel-gida-sektorunde-buyume',
        title: {
            tr: 'Endüstriyel Gıda Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Industrial Food'
        },
        summary: {
            tr: 'Endüstriyel gıda sektörüne özel büyüme odaklı pazarlama eğitim akışı.',
            en: 'A growth-oriented marketing training flow tailored to the industrial food sector.'
        }
    }
]

export const trainingPrograms: TrainingProgram[] = getLocalizedPrograms('tr', trainingProgramCatalog) as TrainingProgram[]

export function getTrainingPrograms(locale: AppLocale): TrainingProgram[] {
    return getLocalizedPrograms(locale, trainingProgramCatalog) as TrainingProgram[]
}
