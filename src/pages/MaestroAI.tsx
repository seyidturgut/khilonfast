import { Link, useLocation } from 'react-router-dom'
import { HiBolt, HiArrowRight } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import Breadcrumbs from '../components/Breadcrumbs'
import './MaestroAIHub.css'

const sectorCards = [
    {
        sectorKey: 'b2b',
        path: '/urunler/maestro-ai-b2b',
        enPath: '/en/products/maestro-ai-b2b',
        image: '/images/TR_Butunlesik.avif'
    },
    {
        sectorKey: 'odeme-sistemleri',
        path: '/urunler/maestro-ai-odeme-sistemleri',
        enPath: '/en/products/maestro-ai-payment-systems',
        image: '/images/TR_Odeme_Sistemleri-2.avif'
    },
    {
        sectorKey: 'endustriyel-gida',
        path: '/urunler/maestro-ai-endustriyel-gida',
        enPath: '/en/products/maestro-ai-industrial-food',
        image: '/images/sef.avif'
    },
    {
        sectorKey: 'fintech',
        path: '/urunler/maestro-ai-fintech',
        enPath: '/en/products/maestro-ai-fintech',
        image: '/images/fintech.avif'
    },
    {
        sectorKey: 'enerji',
        path: '/urunler/maestro-ai-enerji',
        enPath: '/en/products/maestro-ai-energy',
        image: '/images/enerji.avif'
    },
    {
        sectorKey: 'ofis-tasarim',
        path: '/urunler/maestro-ai-ofis-tasarim',
        enPath: '/en/products/maestro-ai-office-design',
        image: '/images/ofis.avif'
    },
    {
        sectorKey: 'filo-kiralama',
        path: '/urunler/maestro-ai-filo-kiralama',
        enPath: '/en/products/maestro-ai-fleet-rental',
        image: '/images/filo.avif'
    },
    {
        sectorKey: 'teknoloji-yazilim',
        path: '/urunler/maestro-ai-teknoloji-yazilim',
        enPath: '/en/products/maestro-ai-technology-software',
        image: '/images/teknoloji.avif'
    },
    {
        sectorKey: 'uretim',
        path: '/urunler/maestro-ai-uretim',
        enPath: '/en/products/maestro-ai-manufacturing',
        image: '/images/uretim.avif'
    }
]

export default function MaestroAI() {
    const { t } = useTranslation('common')
    const location = useLocation()
    const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr'
    const langPrefix = currentLang === 'en' ? '/en' : ''

    const cards = sectorCards.map((card) => ({
        ...card,
        resolvedPath: currentLang === 'en' ? card.enPath : card.path,
        sectorLabel: t(`maestroAISectors.${card.sectorKey}.sectorLabel`),
        description: t(`maestroAISectors.${card.sectorKey}.processDescription`)
    }))

    const openLabel = currentLang === 'en' ? 'View Page' : 'Sayfayı İncele'
    const heroTitle = currentLang === 'en' ? 'Maestro AI' : 'Maestro AI'
    const heroBadge = currentLang === 'en' ? 'AI Marketing Strategist' : 'Yapay Zeka Pazarlama Stratejisti'
    const heroDesc = currentLang === 'en'
        ? 'Choose the Maestro AI version specialized for your sector. Each variant is trained with sector-specific marketing knowledge.'
        : 'Sektörünüze özel geliştirilmiş Maestro AI versiyonunu seçin. Her varyant, sektöre özgü pazarlama bilgisiyle eğitilmiştir.'
    const cardTitle = currentLang === 'en'
        ? (label: string) => `Maestro AI for ${label}`
        : (label: string) => `Maestro AI — ${label}`

    return (
        <div className="page-container maestro-hub-page">
            <section className="maestro-hub-hero">
                <Breadcrumbs items={[
                    { label: t('header.home'), path: langPrefix || '/' },
                    { label: t('header.products'), path: '#' },
                    { label: 'Maestro AI' }
                ]} />
                <div className="container maestro-hub-hero-inner">
                    <div className="maestro-hub-badge">
                        <HiBolt />
                        <span>{heroBadge}</span>
                    </div>
                    <h1>{heroTitle}</h1>
                    <p>{heroDesc}</p>
                </div>
            </section>

            <section className="maestro-hub-list">
                <div className="container">
                    <div className="maestro-hub-grid">
                        {cards.map((card) => (
                            <article key={card.sectorKey} className="maestro-hub-card">
                                <div className="maestro-hub-card-image">
                                    <img src={card.image} alt={card.sectorLabel} />
                                    <div className="maestro-hub-card-icon">
                                        <HiBolt />
                                    </div>
                                </div>
                                <div className="maestro-hub-card-content">
                                    <span className="maestro-hub-card-sector">Maestro AI</span>
                                    <h3>{cardTitle(card.sectorLabel)}</h3>
                                    <p>{card.description}</p>
                                    <Link to={card.resolvedPath} className="maestro-hub-link">
                                        {openLabel} <HiArrowRight />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
