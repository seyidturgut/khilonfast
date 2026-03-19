import { Link } from 'react-router-dom'

interface StrategyAdvisoryTabContentProps {
    isEn: boolean
    advisoryTitle: string
    gtmContext: string
    advisoryPath?: string
}

export default function StrategyAdvisoryTabContent({
    isEn,
    advisoryTitle,
    gtmContext,
    advisoryPath
}: StrategyAdvisoryTabContentProps) {
    const gtmTitle = isEn ? 'Go to market strategy' : 'Go To Market Stratejisi'
    const buyNowLabel = isEn ? 'Buy Now' : 'Satın Al'
    const learnMoreLabel = isEn ? 'Learn More' : 'Detaylı Bilgi'
    const gtmPath = isEn ? '/en/services/go-to-market-strategy' : '/hizmetlerimiz/go-to-market-stratejisi'

    const gtmDescription = isEn
        ? `Use a go-to-market strategy to bring your product or service to the right audience with the right message through the right channels. ${gtmContext} sustainable growth starts with a strong market entry and clear positioning strategy.`
        : `Go-to-market stratejisi ile ürün veya hizmetinizi doğru hedef kitleye, doğru mesajla ve doğru kanallardan ulaştırın. ${gtmContext} sürdürülebilir büyümenin temelini güçlü bir pazara giriş ve net konumlandırma stratejisi oluşturur.`

    const advisoryDescription = isEn
        ? 'Strengthen your growth strategy, reach the right audience more effectively, manage marketing investments more efficiently, and clarify your next growth opportunities.'
        : 'Büyüme odaklı pazarlama danışmanlığı ile hedef kitlenize daha etkili ulaşın, pazarlama yatırımlarınızı daha verimli yönetin ve yeni büyüme fırsatlarını netleştirin.'

    const customTitle = isEn ? 'Custom Advisory' : 'Size Özel Danışmanlık'
    const customDescription = isEn
        ? 'Get advisory support shaped around your company goals, growth priorities, and current market realities.'
        : 'Şirketinizin hedeflerine, büyüme önceliklerine ve mevcut ihtiyaçlarına göre şekillenen danışmanlık desteği alın.'

    return (
        <div className="sectoral-tabs-content">
            <div className="tab-grid grid-cols-3">
                <div className="sectoral-card" style={{ textAlign: 'center' }}>
                    <h3>{gtmTitle}</h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>{gtmDescription}</p>
                    <Link to={gtmPath} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>
                        {buyNowLabel}
                    </Link>
                </div>
                <div className="sectoral-card" style={{ textAlign: 'center' }}>
                    <h3>{advisoryTitle}</h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>{advisoryDescription}</p>
                    <Link to={advisoryPath ?? '#'} className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>
                        {learnMoreLabel}
                    </Link>
                </div>
                <div className="sectoral-card" style={{ textAlign: 'center' }}>
                    <h3>{customTitle}</h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>{customDescription}</p>
                    <Link to="#" className="sectoral-btn" style={{ width: '100%', padding: '12px' }}>
                        {learnMoreLabel}
                    </Link>
                </div>
            </div>
        </div>
    )
}
