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
            tr: 'B2B sektörü için özelleştirilmiş yapay zeka pazarlama stratejisti. Khilonfast ile içerik, kampanya ve dönüşüm planlamasını AI ile hızlandırın.',
            en: 'A customized AI marketing strategist for the B2B sector. Khilonfast accelerates content, campaign, and conversion planning with AI.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-b2b', en: '/en/products/maestro-ai-b2b' },
        title: { tr: 'Maestro AI B2B Pazarlama Stratejisti', en: 'Maestro AI B2B Marketing Strategist' },
        summary: {
            tr: 'B2B markalar için Maestro AI pazarlama stratejisti. Khilonfast ile alıcı yolculuğu, MQL/SQL süreci ve içerik stratejisini AI ile yönetin.',
            en: 'Maestro AI marketing strategist tailored to B2B brands. Khilonfast manages buyer journey, MQL/SQL flow, and content strategy with AI.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-odeme-sistemleri', en: '/en/products/maestro-ai-payment-systems' },
        title: { tr: 'Maestro AI (Ödeme Sistemleri)', en: 'Maestro AI (Payment Systems)' },
        summary: {
            tr: 'Ödeme sistemleri sektörüne özel Maestro AI pazarlama stratejisti. Khilonfast ile uyumlu kampanya planlama ve dönüşüm optimizasyonunu AI ile yapın.',
            en: 'Maestro AI strategist for the payment systems sector. Khilonfast runs compliant AI-powered campaign planning and conversion optimization.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-endustriyel-gida', en: '/en/products/maestro-ai-industrial-food' },
        title: { tr: 'Maestro AI (Endüstriyel Gıda)', en: 'Maestro AI (Industrial Food)' },
        summary: {
            tr: 'Endüstriyel gıda sektörüne özel Maestro AI pazarlama stratejisti. Khilonfast ile B2B kanal stratejisi, içerik ve performans planlamayı AI ile yönetin.',
            en: 'Maestro AI strategist for the industrial food sector. Khilonfast runs AI-driven B2B channel strategy, content, and performance planning.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-fintech', en: '/en/products/maestro-ai-fintech' },
        title: { tr: 'Maestro AI (FinTech)', en: 'Maestro AI (Fintech)' },
        summary: {
            tr: 'FinTech sektörüne özel Maestro AI pazarlama stratejisti. Khilonfast ile uyumlu içerik, karar verici hedeflemesi ve dönüşüm planlamasını AI ile yapın.',
            en: 'Maestro AI strategist for the fintech sector. Khilonfast runs compliant content, decision-maker targeting, and conversion planning via AI.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-enerji', en: '/en/products/maestro-ai-energy' },
        title: { tr: 'Maestro AI (Enerji)', en: 'Maestro AI (Energy)' },
        summary: {
            tr: 'Enerji sektörüne özel Maestro AI pazarlama stratejisti. Khilonfast ile B2B karar vericilere yönelik stratejik kampanya planlamayı AI ile yönetin.',
            en: 'Maestro AI strategist for the energy sector. Khilonfast plans strategic AI-powered campaigns targeting B2B decision-makers.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-ofis-tasarim', en: '/en/products/maestro-ai-office-design' },
        title: { tr: 'Maestro AI (Ofis & İç Tasarım)', en: 'Maestro AI (Office & Interior Design)' },
        summary: {
            tr: 'Ofis ve kurumsal iç tasarım sektörü için Maestro AI pazarlama stratejisti. Khilonfast ile portföy temelli içerik ve referans stratejisini AI ile yönetin.',
            en: 'Maestro AI strategist for office and corporate interior design. Khilonfast manages AI-driven portfolio-led content and referral strategy.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-filo-kiralama', en: '/en/products/maestro-ai-fleet-rental' },
        title: { tr: 'Maestro AI (Filo Kiralama)', en: 'Maestro AI (Fleet Rental)' },
        summary: {
            tr: 'Filo kiralama sektörüne özel Maestro AI pazarlama stratejisti. Khilonfast ile kurumsal mobilite teklif sürecini ve içerik planlamasını AI ile hızlandırın.',
            en: 'Maestro AI strategist for the fleet rental sector. Khilonfast accelerates corporate mobility quote flow and content planning with AI.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-teknoloji-yazilim', en: '/en/products/maestro-ai-technology-software' },
        title: { tr: 'Maestro AI (Teknoloji & Yazılım)', en: 'Maestro AI (Technology & Software)' },
        summary: {
            tr: 'Teknoloji ve yazılım şirketleri için Maestro AI pazarlama stratejisti. Khilonfast ile ürün-pazar uyumu, talep yaratma ve aktivasyonu AI ile büyütün.',
            en: 'Maestro AI strategist for tech and software firms. Khilonfast scales product-market fit, demand generation, and activation through AI.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-uretim', en: '/en/products/maestro-ai-manufacturing' },
        title: { tr: 'Maestro AI (Üretim)', en: 'Maestro AI (Manufacturing)' },
        summary: {
            tr: 'Üretim sektörüne özel Maestro AI pazarlama stratejisti. Khilonfast ile B2B alıcı yolculuğu ve teklif sürecini AI destekli içerik üretimiyle hızlandırın.',
            en: 'Maestro AI strategist for manufacturing. Khilonfast accelerates the B2B buyer journey and quote workflow with AI-powered content.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-hediye-karti', en: '/en/products/maestro-ai-corporate-gift-card' },
        title: { tr: 'Maestro AI (Kurumsal Hediye Kartı)', en: 'Maestro AI (Corporate Gift Card)' },
        summary: {
            tr: 'Kurumsal hediye kartı için Maestro AI pazarlama stratejisti. Khilonfast ile B2B satın alma merkezlerini AI destekli kampanya planlamasıyla besleyin.',
            en: 'Maestro AI strategist for corporate gift card programs. Khilonfast nurtures B2B buying centers with AI-powered campaign planning.'
        }
    },
    {
        path: { tr: '/urunler/maestro-ai-akaryakit', en: '/en/products/maestro-ai-corporate-fuel' },
        title: { tr: 'Maestro AI (Kurumsal Akaryakıt)', en: 'Maestro AI (Corporate Fuel)' },
        summary: {
            tr: 'Kurumsal akaryakıt için Maestro AI pazarlama stratejisti. Khilonfast ile filo yöneticilerini hedefleyen içerik ve performans planlamasını AI ile yönetin.',
            en: 'Maestro AI strategist for corporate fuel solutions. Khilonfast manages AI-driven content and performance strategy targeting fleet managers.'
        }
    },
    {
        path: { tr: '/urunler/eye-tracking-reklam-analizi', en: '/en/products/eye-tracking-ad-analysis' },
        title: { tr: 'Eye Tracking Reklam Analizi', en: 'Eye Tracking Ad Analysis' },
        summary: {
            tr: 'AI + Eye Tracking ile yaratıcı performans analizi ve ROI risk azaltma. Khilonfast ile reklam kreatiflerinizi yayına almadan göz takibi raporlarıyla optimize edin.',
            en: 'Creative performance analysis and ROI risk reduction with AI + Eye Tracking. Khilonfast optimizes ad creatives pre-launch via eye-tracking reports.'
        }
    }
]

export const productPrograms: ProductProgram[] = getLocalizedPrograms('tr', productProgramCatalog) as ProductProgram[]

export function getProductPrograms(locale: AppLocale): ProductProgram[] {
    return getLocalizedPrograms(locale, productProgramCatalog) as ProductProgram[]
}
