import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import GoToMarket from './GoToMarket'
import ContentStrategy from './ContentStrategy'
import IntegratedDigitalMarketing from './IntegratedDigitalMarketing'
import GoogleAds from './GoogleAds'
import SocialMediaAds from './SocialMediaAds'
import SeoService from './SeoService'
import ContentProduction from './ContentProduction'
import B2BEmailMarketing from './B2BEmailMarketing'
import B2BThreeSixtyMarketing from './B2BThreeSixtyMarketing'
import PaymentSystemsMarketing from './PaymentSystemsMarketing'
import IndustrialFoodMarketing from './IndustrialFoodMarketing'
import FintechMarketing from './FintechMarketing'
import SoftwareMarketing from './SoftwareMarketing'
import EnergyMarketing from './EnergyMarketing'
import InteriorDesignMarketing from './InteriorDesignMarketing'
import FleetRentalMarketing from './FleetRentalMarketing'
import ManufacturingMarketing from './ManufacturingMarketing'
import MaestroAI from './MaestroAI'
import EyeTracking from './EyeTracking'
import LegacyWordpressPage from './LegacyWordpressPage'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function resolveByProductKey(productKey: string) {
    if (!productKey) return null

    const key = productKey.toLowerCase()
    const exact: Record<string, JSX.Element> = {
        'service-gtm': <GoToMarket />,
        'service-content-strategy': <ContentStrategy />,
        'service-idm': <IntegratedDigitalMarketing />,
        'service-integrated-marketing': <IntegratedDigitalMarketing />,
        'service-google-ads': <GoogleAds />,
        'service-social-ads': <SocialMediaAds />,
        'service-seo': <SeoService />,
        'service-content-production': <ContentProduction />,
        'service-b2b-email': <B2BEmailMarketing />,
        'service-b2b-360': <B2BThreeSixtyMarketing />,
        'service-payment-systems': <PaymentSystemsMarketing />,
        'service-industrial-food': <IndustrialFoodMarketing />,
        'service-fintech-360': <FintechMarketing />,
        'service-tech-software': <SoftwareMarketing />,
        'service-energy': <EnergyMarketing />,
        'service-interior-design': <InteriorDesignMarketing />,
        'service-fleet-rental': <FleetRentalMarketing />,
        'service-manufacturing': <ManufacturingMarketing />,
        'service-maestro-ai': <MaestroAI />,
        'service-eye-tracking': <EyeTracking />
    }

    if (exact[key]) return exact[key]

    // Package-level keys should resolve to their parent service pages.
    if (key.startsWith('gtm-')) return <GoToMarket />
    if (key.startsWith('idm-')) return <IntegratedDigitalMarketing />
    if (key.startsWith('service-integrated-marketing-')) return <IntegratedDigitalMarketing />
    if (key.startsWith('google-ads-')) return <GoogleAds />
    if (key.startsWith('social-ads-')) return <SocialMediaAds />
    if (key.startsWith('seo-')) return <SeoService />
    if (key.startsWith('content-production-')) return <ContentProduction />
    if (key.startsWith('b2b-email-')) return <B2BEmailMarketing />

    return null
}

export default function ProductSlugResolver() {
    const { slug } = useParams<{ slug: string }>()
    const location = useLocation()
    const [resolvedElement, setResolvedElement] = useState<JSX.Element | null>(null)
    const [loading, setLoading] = useState(true)

    const currentLang = useMemo(
        () => (location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr'),
        [location.pathname]
    )

    useEffect(() => {
        let cancelled = false

        const resolve = async () => {
            setLoading(true)
            setResolvedElement(null)

            const normalizedPath = location.pathname.replace(/^\/+/, '')
            const withoutEnPrefix = normalizedPath.replace(/^en\//, '')
            const candidates = Array.from(new Set([normalizedPath, withoutEnPrefix, `en/${withoutEnPrefix}`]))

            try {
                for (const candidate of candidates) {
                    const res = await fetch(`${API_BASE}/products/key/${encodeURIComponent(candidate)}?lang=${currentLang}`)
                    if (!res.ok) continue

                    const data = await res.json()
                    const productKey = data?.product?.product_key
                    const element = resolveByProductKey(productKey)

                    if (!cancelled && element) {
                        setResolvedElement(element)
                        setLoading(false)
                        return
                    }
                }
            } catch {
                // Intentionally ignore and fall back to legacy page.
            }

            if (!cancelled) {
                setLoading(false)
            }
        }

        if (slug) {
            void resolve()
        } else {
            setLoading(false)
        }

        return () => {
            cancelled = true
        }
    }, [slug, location.pathname, currentLang])

    if (resolvedElement) return resolvedElement
    if (loading) return null
    return <LegacyWordpressPage />
}
