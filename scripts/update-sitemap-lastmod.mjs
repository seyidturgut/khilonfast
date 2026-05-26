#!/usr/bin/env node
// Build sonrası dist/sitemap*.xml içindeki <lastmod> tarihlerini bugünün tarihine günceller.
// SEO: arama motorlarına içeriğin güncel olduğunu bildirir.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

function updateLastmodIn(dir) {
    if (!existsSync(dir)) return 0
    const files = readdirSync(dir).filter(f => f.startsWith('sitemap') && f.endsWith('.xml'))
    let total = 0
    for (const f of files) {
        const p = join(dir, f)
        const xml = readFileSync(p, 'utf8')
        const updated = xml.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`)
        if (updated !== xml) {
            writeFileSync(p, updated, 'utf8')
            console.log(`  ✓ ${f} → ${today}`)
            total++
        }
    }
    return total
}

const projectRoot = resolve(process.cwd())
const distDir = join(projectRoot, 'dist')
const publicDir = join(projectRoot, 'public')

console.log('Updating sitemap lastmod →', today)
const distCount = updateLastmodIn(distDir)
const publicCount = updateLastmodIn(publicDir)
console.log(`Done: ${distCount} in dist/, ${publicCount} in public/`)
