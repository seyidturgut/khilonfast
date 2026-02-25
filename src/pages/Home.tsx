import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero'
import About from '../components/About'
import Solutions from '../components/Solutions'
import Services from '../components/Services'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import FAQ from '../components/FAQ'

export default function Home() {
    const { t } = useTranslation('common')

    useEffect(() => {
        document.title = t('pages.home.seo.title')

        const upsertMeta = (name: string, content: string) => {
            let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
            if (!tag) {
                tag = document.createElement('meta')
                tag.setAttribute('name', name)
                document.head.appendChild(tag)
            }
            tag.setAttribute('content', content)
        }

        upsertMeta('description', t('pages.home.seo.description'))
    }, [t])

    return (
        <>
            <Hero />
            <About />
            <Solutions />
            <Services />
            <Features />
            <Pricing />
            <FAQ />
        </>
    )
}
