// scripts/generate-llms-full.mjs
// llms.txt bir ÖZET/index — bu script prerender edilmiş GERÇEK sayfa içeriğinden
// (title, description, FAQ) tam bir AI-okunabilir döküm üretir: dist/llms-full.txt.
// Build SONRASI çalışır (dist/ hazır olmalı). Mevcut generate-seo-assets.mjs'e
// veya sayfa component'lerine DOKUNMAZ — sadece prerendered HTML'i okur.
// Kullanım: npm run build && node scripts/generate-llms-full.mjs

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const siteUrl = (process.env.SITE_URL || 'https://khilonfast.com').replace(/\/+$/, '')

async function findPrerenderedHtmlFiles(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'assets' || entry.name === 'uploads') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await findPrerenderedHtmlFiles(full, out)
    } else if (entry.name === 'index.html') {
      out.push(full)
    }
  }
  return out
}

const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

function extractPage(html, filePath) {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/)
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/)
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/)
  const robotsMatch = html.match(/<meta name="robots" content="([^"]*)"/)
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s)

  // FAQ: faq-question / faq-answer sırayla eşleşir (sayfada bu sınıflar varsa)
  const faqPairs = []
  const faqBlockRegex = /<div class="faq-item[^"]*">(.*?)<\/div>\s*<\/div>/gs
  // Basit yaklaşım: question ve answer'ları ayrı ayrı topla, aynı index'te eşleştir.
  const questions = [...html.matchAll(/faq-question"[^>]*><span>(.*?)<\/span>/gs)].map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, '')))
  const answers = [...html.matchAll(/class="faq-answer"[^>]*>\s*<p>(.*?)<\/p>/gs)].map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, '')))
  for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
    if (questions[i] && answers[i]) faqPairs.push({ q: questions[i], a: answers[i] })
  }
  void faqBlockRegex

  const robotsContent = robotsMatch ? robotsMatch[1] : ''
  const isNoindex = robotsContent.includes('noindex')

  return {
    filePath,
    title: titleMatch ? decodeEntities(titleMatch[1]) : '',
    description: descMatch ? decodeEntities(descMatch[1]) : '',
    canonical: canonicalMatch ? canonicalMatch[1] : '',
    h1: h1Match ? decodeEntities(h1Match[1].replace(/<[^>]+>/g, '')) : '',
    faq: faqPairs,
    isNoindex
  }
}

const files = await findPrerenderedHtmlFiles(distDir)
const pages = []
for (const file of files) {
  const html = await fs.readFile(file, 'utf8')
  const page = extractPage(html, file)
  // Noindex sayfaları (checkout, login, legacy vb.) llms-full.txt'e dahil etme —
  // robots.txt/llms.txt zaten bunları "non-index target" olarak işaretliyor.
  if (page.isNoindex) continue
  if (!page.canonical || !page.title) continue
  pages.push(page)
}

// Aynı canonical URL'e sahip duplicate'leri ele (alias route'lar aynı canonical'a çözülüyor)
const seen = new Set()
const uniquePages = []
for (const p of pages) {
  if (seen.has(p.canonical)) continue
  seen.add(p.canonical)
  uniquePages.push(p)
}

uniquePages.sort((a, b) => a.canonical.localeCompare(b.canonical))

const trPages = uniquePages.filter((p) => !p.canonical.includes('/en/') && !p.canonical.endsWith('/en'))
const enPages = uniquePages.filter((p) => p.canonical.includes('/en/') || p.canonical.endsWith('/en'))

function renderPage(p) {
  const lines = [`### ${p.title}`, `URL: ${p.canonical}`]
  if (p.h1 && p.h1 !== p.title) lines.push(`H1: ${p.h1}`)
  if (p.description) lines.push(`Özet: ${p.description}`)
  if (p.faq.length) {
    lines.push('SSS:')
    for (const { q, a } of p.faq) {
      lines.push(`S: ${q}`)
      lines.push(`C: ${a}`)
    }
  }
  return lines.join('\n')
}

const generatedAt = new Date().toISOString()

const content = `# khilonfast — Tam İçerik Dökümü (AI Ajanları İçin)

Bu dosya, khilonfast.com sitesindeki tüm herkese açık (indexlenebilir) sayfaların
gerçek başlık, açıklama ve SSS içeriğinin tam dökümüdür. Kısa bir özet/politika
dosyası için önce ${siteUrl}/llms.txt dosyasına bakın; bu dosya (llms-full.txt)
sayfaları tek tek taramadan doğrudan içerik bağlamı almak isteyen AI ajanları içindir.

Oluşturulma zamanı: ${generatedAt}
Toplam sayfa: ${uniquePages.length} (Türkçe: ${trPages.length}, İngilizce: ${enPages.length})

---

## TÜRKÇE SAYFALAR

${trPages.map(renderPage).join('\n\n')}

---

## ENGLISH PAGES

${enPages.map(renderPage).join('\n\n')}
`

await fs.writeFile(path.join(distDir, 'llms-full.txt'), content, 'utf8')
console.log(`llms-full.txt generated: ${uniquePages.length} pages (TR: ${trPages.length}, EN: ${enPages.length})`)
