import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero'
import About from '../components/About'
import Solutions from '../components/Solutions'
import Services from '../components/Services'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import FAQ from '../components/FAQ'
import PotentialCTA from '../components/PotentialCTA'
import { resolveLocalizedText } from '../utils/localizedContent'
import { API_BASE_URL } from '../config/api'

const HOME_TEXT_KEYS = [
  'hero.subtitle', 'hero.title', 'hero.titleHighlight', 'hero.description',
  'about.title', 'about.description', 'about.item1', 'about.item2', 'about.item3',
  'solutions.header.title', 'solutions.item1.title', 'solutions.item1.description', 'solutions.item2.title', 'solutions.item2.description', 'solutions.item3.title', 'solutions.item3.description',
  'services.header.title', 'services.item1.title', 'services.item1.description', 'services.item2.title', 'services.item2.description', 'services.item3.title', 'services.item3.description',
  'potentialCTA.title', 'potentialCTA.description', 'potentialCTA.button',
  'features.title', 'features.description', 'features.list1', 'features.list2',
  'pages.home.pricing.titleLine1', 'pages.home.pricing.titleLine2', 'pages.home.pricing.description', 'pages.home.pricing.cta',
  'faq.title', 'faq.subtitle',
  'faq.item1.question', 'faq.item1.answer', 'faq.item2.question', 'faq.item2.answer', 'faq.item3.question', 'faq.item3.answer', 'faq.item4.question', 'faq.item4.answer', 'faq.item5.question', 'faq.item5.answer',
  'common.discover', 'common.startNow', 'header.services'
] as const

export default function Home() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr'
  const isCmsMode = new URLSearchParams(location.search).get('cms') === '1'
  const canShowCms = isCmsMode && typeof window !== 'undefined' && Boolean(localStorage.getItem('token'))
  const API_BASE = API_BASE_URL

  const [cmsPageId, setCmsPageId] = useState<number | null>(null)
  const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null)
  const [cmsTexts, setCmsTexts] = useState<Record<string, string> | null>(null)
  const [cmsLoading, setCmsLoading] = useState(false)
  const [cmsSaving, setCmsSaving] = useState(false)
  const [cmsError, setCmsError] = useState('')

  useEffect(() => {
    document.title = t('pages.home.seo.title')
    let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', t('pages.home.seo.description'))
  }, [t])

  const defaultTexts = useMemo(() => {
    const out: Record<string, string> = {}
    for (const key of HOME_TEXT_KEYS) out[key] = t(key)
    return out
  }, [t])

  const tx = (key: string) => resolveLocalizedText({
    locale: currentLang,
    cmsValue: cmsTexts?.[key],
    t,
    localeKey: key
  })

  useEffect(() => {
    const fetchPublicCms = async () => {
      try {
        const res = await fetch(`${API_BASE}/pages/slug/home?lang=${currentLang}`)
        if (!res.ok) return
        const data = await res.json()
        const texts = data?.content?.texts
        if (texts && typeof texts === 'object') setCmsTexts(texts)
      } catch {
        // no-op
      }
    }
    fetchPublicCms()
  }, [API_BASE, currentLang])

  useEffect(() => {
    const fetchAdminCms = async () => {
      if (!canShowCms) return
      const token = localStorage.getItem('token')
      if (!token) return
      setCmsLoading(true)
      setCmsError('')
      try {
        const pagesRes = await fetch(`${API_BASE}/admin/pages`, { headers: { Authorization: `Bearer ${token}` } })
        if (!pagesRes.ok) return
        const pages = await pagesRes.json()
        let page = (pages || []).find((p: any) => p?.slug === 'home')
        if (!page?.id) {
          const createRes = await fetch(`${API_BASE}/admin/pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: 'Home', slug: 'home', meta_title: '', meta_description: '' })
          })
          if (!createRes.ok) return
          const created = await createRes.json()
          page = { id: created?.id }
        }
        setCmsPageId(Number(page.id))
        const contentRes = await fetch(`${API_BASE}/admin/pages/${page.id}/content`, { headers: { Authorization: `Bearer ${token}` } })
        if (!contentRes.ok) return
        const contentData = await contentRes.json()
        let raw: any = null
        if (contentData?.content_json && typeof contentData.content_json === 'object') raw = contentData.content_json
        else if (typeof contentData?.content_json === 'string') {
          try { raw = JSON.parse(contentData.content_json) } catch { raw = null }
        }
        if (raw && typeof raw === 'object') {
          setCmsAllContent(raw)
          const localized = raw[currentLang]
          const texts = localized?.texts && typeof localized.texts === 'object' ? localized.texts : defaultTexts
          setCmsTexts(texts)
        } else {
          setCmsTexts(defaultTexts)
        }
      } catch {
        setCmsError('CMS icerigi okunamadi.')
      } finally {
        setCmsLoading(false)
      }
    }
    fetchAdminCms()
  }, [API_BASE, canShowCms, currentLang, defaultTexts])

  const handleSave = async () => {
    if (!canShowCms || !cmsPageId || !cmsTexts) return
    const token = localStorage.getItem('token')
    if (!token) return
    setCmsSaving(true)
    setCmsError('')
    try {
      const nextAll = { ...(cmsAllContent || {}), [currentLang]: { texts: cmsTexts } }
      const saveRes = await fetch(`${API_BASE}/admin/pages/${cmsPageId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content_json: nextAll, is_published: true })
      })
      if (!saveRes.ok) {
        setCmsError('Kaydetme basarisiz.')
        return
      }
      setCmsAllContent(nextAll)
    } finally {
      setCmsSaving(false)
    }
  }

  return (
    <>
      <Hero content={{ subtitle: tx('hero.subtitle'), title: tx('hero.title'), titleHighlight: tx('hero.titleHighlight'), description: tx('hero.description') }} />
      <About content={{ title: tx('about.title'), description: tx('about.description'), item1: tx('about.item1'), item2: tx('about.item2'), item3: tx('about.item3') }} />
      <Solutions tx={tx} />
      <PotentialCTA tx={tx} />
      <Services tx={tx} />
      <Features tx={tx} />
      <Pricing tx={tx} />
      <FAQ tx={tx} />

      {canShowCms && (
        <div style={{ position: 'fixed', top: 90, right: 16, width: 420, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 14, boxShadow: '0 18px 40px rgba(15,23,42,0.15)', zIndex: 9999, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 10, color: '#0f172a' }}>CMS Editor ({currentLang.toUpperCase()})</div>
          {cmsLoading && <div style={{ fontSize: 13, marginBottom: 8 }}>Yukleniyor...</div>}
          {cmsError && <div style={{ fontSize: 13, color: '#b91c1c', marginBottom: 8 }}>{cmsError}</div>}
          <div style={{ display: 'grid', gap: 8 }}>
            {HOME_TEXT_KEYS.map((key) => (
              <div key={key} style={{ display: 'grid', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{key}</label>
                <textarea
                  rows={key.includes('description') || key.includes('answer') ? 3 : 2}
                  value={cmsTexts?.[key] || ''}
                  onChange={(e) => setCmsTexts((prev) => ({ ...(prev || defaultTexts), [key]: e.target.value }))}
                />
              </div>
            ))}
            <button onClick={handleSave} disabled={cmsSaving} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 12px', cursor: 'pointer', opacity: cmsSaving ? 0.7 : 1, fontWeight: 700 }}>
              {cmsSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
