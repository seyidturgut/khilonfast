import type { AppLocale } from '../utils/locale'
import type { LocalizedProgram } from '../utils/localizedContent'
import { getLocalizedPrograms } from '../utils/localizedContent'

export interface ProductProgram {
    path: string
    title: string
    summary: string
}

export const productProgramCatalog: LocalizedProgram[] = [
    {
        path: { tr: '/urunler/maestro-ai', en: '/en/products/maestro-ai' },
        title: { tr: 'Maestro AI', en: 'Maestro AI' },
        summary: {
            tr: 'B2B sektörü için özelleştirilmiş yapay zeka pazarlama stratejisti.',
            en: 'A customized AI marketing strategist for the B2B sector.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-b2b', en: '/en/products/maestro-ai-b2b' },
        title: { tr: 'Maestro AI (B2B)', en: 'Maestro AI (B2B)' },
        summary: {
            tr: 'B2B sektörüne özel Maestro AI pazarlama stratejisti.',
            en: 'A Maestro AI marketing strategist tailored to the B2B sector.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-odeme-sistemleri', en: '/en/products/maestro-ai-payment-systems' },
        title: { tr: 'Maestro AI (Ödeme Sistemleri)', en: 'Maestro AI (Payment Systems)' },
        summary: {
            tr: 'Ödeme sistemleri sektörüne özel Maestro AI pazarlama stratejisti.',
            en: 'A Maestro AI marketing strategist designed for the payment systems sector.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-endustriyel-gida', en: '/en/products/maestro-ai-industrial-food' },
        title: { tr: 'Maestro AI (Endüstriyel Gıda)', en: 'Maestro AI (Industrial Food)' },
        summary: {
            tr: 'Endüstriyel gıda sektörüne özel Maestro AI pazarlama stratejisti.',
            en: 'A Maestro AI marketing strategist created for the industrial food sector.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-fintech', en: '/en/products/maestro-ai-fintech' },
        title: { tr: 'Maestro AI (FinTech)', en: 'Maestro AI (Fintech)' },
        summary: {
            tr: 'FinTech sektörüne özel Maestro AI pazarlama stratejisti.',
            en: 'A Maestro AI marketing strategist tailored to the fintech sector.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-enerji', en: '/en/products/maestro-ai-energy' },
        title: { tr: 'Maestro AI (Enerji)', en: 'Maestro AI (Energy)' },
        summary: {
            tr: 'Enerji sektörüne özel Maestro AI pazarlama stratejisti.',
            en: 'A Maestro AI marketing strategist tailored to the energy sector.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-ofis-tasarim', en: '/en/products/maestro-ai-office-design' },
        title: { tr: 'Maestro AI (Ofis & İç Tasarım)', en: 'Maestro AI (Office & Interior Design)' },
        summary: {
            tr: 'Ofis & kurumsal iç tasarım sektörüne özel Maestro AI pazarlama stratejisti.',
            en: 'A Maestro AI marketing strategist for office and corporate interior design brands.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-filo-kiralama', en: '/en/products/maestro-ai-fleet-rental' },
        title: { tr: 'Maestro AI (Filo Kiralama)', en: 'Maestro AI (Fleet Rental)' },
        summary: {
            tr: 'Filo kiralama sektörüne özel Maestro AI pazarlama stratejisti.',
            en: 'A Maestro AI marketing strategist for the fleet rental sector.'
        }
    },
    {
        path: { tr: '/urunler/eye-tracking-reklam-analizi', en: '/en/products/eye-tracking-ad-analysis' },
        title: { tr: 'Eye Tracking Reklam Analizi', en: 'Eye Tracking Ad Analysis' },
        summary: {
            tr: 'AI + Eye Tracking ile yaratıcı performans analizi ve ROI risk azaltma.',
            en: 'Creative performance analysis and ROI risk reduction with AI + Eye Tracking.'
        }
    }
]

export const productPrograms: ProductProgram[] = getLocalizedPrograms('tr', productProgramCatalog) as ProductProgram[]

export function getProductPrograms(locale: AppLocale): ProductProgram[] {
    return getLocalizedPrograms(locale, productProgramCatalog) as ProductProgram[]
}
