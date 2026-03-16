import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import './ContactPage.css'

const CONTACT_TEXT_KEYS = [
  'contact.hero.eyebrow', 'contact.hero.title', 'contact.hero.lead', 'contact.hero.badge1', 'contact.hero.badge2',
  'contact.card.title', 'contact.card.email', 'contact.card.phone', 'contact.card.address', 'contact.card.location', 'contact.card.hours',
  'contact.form.title', 'contact.form.description', 'contact.form.firstName', 'contact.form.firstNamePlaceholder', 'contact.form.lastName', 'contact.form.lastNamePlaceholder',
  'contact.form.email', 'contact.form.emailPlaceholder', 'contact.form.phone', 'contact.form.phonePlaceholder', 'contact.form.brand', 'contact.form.brandPlaceholder',
  'contact.form.detail', 'contact.form.detailPlaceholder', 'contact.form.submit',
  'contact.side.helpTitle', 'contact.side.list1', 'contact.side.list2', 'contact.side.list3', 'contact.side.list4', 'contact.side.list5',
  'contact.side.meeting.title', 'contact.side.meeting.description', 'contact.side.meeting.button'
] as const

export default function ContactPage() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const currentLang = location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'tr'
  const isCmsMode = new URLSearchParams(location.search).get('cms') === '1'
  const canShowCms = isCmsMode && typeof window !== 'undefined' && Boolean(localStorage.getItem('token'))
  const API_BASE = API_BASE_URL

  const [cmsPageId, setCmsPageId] = useState<number | null>(null)
  const [cmsAllContent, setCmsAllContent] = useState<Record<string, any> | null>(null)
  const [cmsTexts, setCmsTexts] = useState<Record<string, string> | null>(null)
  const [cmsSaving, setCmsSaving] = useState(false)

  const defaultTexts = useMemo(() => {
    const out: Record<string, string> = {}
    for (const key of CONTACT_TEXT_KEYS) out[key] = t(key)
    return out
  }, [t])
  const tx = (key: string) => cmsTexts?.[key] || t(key)

  useEffect(() => {
    const fetchPublicCms = async () => {
      try {
        const res = await fetch(`${API_BASE}/pages/slug/contact?lang=${currentLang}`)
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
      const pagesRes = await fetch(`${API_BASE}/admin/pages`, { headers: { Authorization: `Bearer ${token}` } })
      if (!pagesRes.ok) return
      const pages = await pagesRes.json()
      let page = (pages || []).find((p: any) => p?.slug === 'contact')
      if (!page?.id) {
        const createRes = await fetch(`${API_BASE}/admin/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: 'Contact', slug: 'contact', meta_title: '', meta_description: '' })
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
        const texts = raw[currentLang]?.texts
        setCmsTexts(texts && typeof texts === 'object' ? texts : defaultTexts)
      } else {
        setCmsTexts(defaultTexts)
      }
    }
    fetchAdminCms()
  }, [API_BASE, canShowCms, currentLang, defaultTexts])

  const handleSave = async () => {
    if (!canShowCms || !cmsPageId || !cmsTexts) return
    const token = localStorage.getItem('token')
    if (!token) return
    setCmsSaving(true)
    const nextAll = { ...(cmsAllContent || {}), [currentLang]: { texts: cmsTexts } }
    await fetch(`${API_BASE}/admin/pages/${cmsPageId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content_json: nextAll, is_published: true })
    })
    setCmsAllContent(nextAll)
    setCmsSaving(false)
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container contact-hero-grid">
          <div>
            <p className="contact-eyebrow">{tx('contact.hero.eyebrow')}</p>
            <h1>{tx('contact.hero.title')}</h1>
            <p className="contact-lead">{tx('contact.hero.lead')}</p>
            <div className="contact-badges">
              <span>{tx('contact.hero.badge1')}</span>
              <span>{tx('contact.hero.badge2')}</span>
            </div>
          </div>
          <div className="contact-hero-card">
            <div className="contact-card-title">{tx('contact.card.title')}</div>
            <div className="contact-card-item"><span className="label">{tx('contact.card.email')}</span><span className="value">info@khilonfast.com</span></div>
            <div className="contact-card-item"><span className="label">{tx('contact.card.phone')}</span><span className="value">+90 (5XX) XXX XX XX</span></div>
            <div className="contact-card-item"><span className="label">{tx('contact.card.address')}</span><span className="value">{tx('contact.card.location')}</span></div>
            <div className="contact-card-foot">{tx('contact.card.hours')}</div>
          </div>
        </div>
      </section>

      {canShowCms && (
        <div style={{ position: 'fixed', top: 90, right: 16, width: 420, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 14, boxShadow: '0 18px 40px rgba(15,23,42,0.15)', zIndex: 9999, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 10, color: '#0f172a' }}>CMS Editor ({currentLang.toUpperCase()})</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {CONTACT_TEXT_KEYS.map((key) => (
              <div key={key} style={{ display: 'grid', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{key}</label>
                <textarea
                  rows={key.includes('description') || key.includes('lead') || key.includes('Placeholder') ? 3 : 2}
                  value={cmsTexts?.[key] || ''}
                  onChange={(e) => setCmsTexts((prev) => ({ ...(prev || defaultTexts), [key]: e.target.value }))}
                />
              </div>
            ))}
            <button onClick={handleSave} disabled={cmsSaving} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 12px', cursor: 'pointer', opacity: cmsSaving ? 0.7 : 1, fontWeight: 700 }}>{cmsSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      )}

      <section className="contact-main">
        <div className="container contact-main-grid">
          <div className="contact-form-card">
            <h2>{tx('contact.form.title')}</h2>
            <p>{tx('contact.form.description')}</p>
            <form className="contact-form">
              <div className="form-row">
                <div className="form-group"><label>{tx('contact.form.firstName')}</label><input type="text" placeholder={tx('contact.form.firstNamePlaceholder')} /></div>
                <div className="form-group"><label>{tx('contact.form.lastName')}</label><input type="text" placeholder={tx('contact.form.lastNamePlaceholder')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>{tx('contact.form.email')}</label><input type="email" placeholder={tx('contact.form.emailPlaceholder')} /></div>
                <div className="form-group"><label>{tx('contact.form.phone')}</label><input type="tel" placeholder={tx('contact.form.phonePlaceholder')} /></div>
              </div>
              <div className="form-group"><label>{tx('contact.form.brand')}</label><input type="text" placeholder={tx('contact.form.brandPlaceholder')} /></div>
              <div className="form-group"><label>{tx('contact.form.detail')}</label><textarea rows={6} placeholder={tx('contact.form.detailPlaceholder')} /></div>
              <button type="submit" className="btn btn-primary btn-full">{tx('contact.form.submit')}</button>
            </form>
          </div>

          <div className="contact-side">
            <div className="contact-side-card">
              <h3>{tx('contact.side.helpTitle')}</h3>
              <ul>
                <li>{tx('contact.side.list1')}</li>
                <li>{tx('contact.side.list2')}</li>
                <li>{tx('contact.side.list3')}</li>
                <li>{tx('contact.side.list4')}</li>
                <li>{tx('contact.side.list5')}</li>
              </ul>
            </div>
            <div className="contact-side-card highlight">
              <h3>{tx('contact.side.meeting.title')}</h3>
              <p>{tx('contact.side.meeting.description')}</p>
              <a className="btn btn-secondary" href="mailto:info@khilonfast.com">{tx('contact.side.meeting.button')}</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
