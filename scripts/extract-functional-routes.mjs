import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const appTsx = await fs.readFile(path.join(rootDir, 'src/App.tsx'), 'utf8')
const trCommon = JSON.parse(await fs.readFile(path.join(rootDir, 'src/locales/tr/common.json'), 'utf8'))
const enCommon = JSON.parse(await fs.readFile(path.join(rootDir, 'src/locales/en/common.json'), 'utf8'))
const trSlugs = trCommon.slugs
const enSlugs = enCommon.slugs

const prerenderMod = await import(path.join(rootDir, 'scripts/prerender-routes.mjs'))
const prerenderedFirstSegments = new Set(
    prerenderMod.prerenderRoutes.map((p) => p.replace(/^\//, '').split('/')[0]).filter(Boolean)
)

// Every <Route path=...> value, literal or {slugsTr.x}/{`/${slugsTr.x}`}/{slugsEn.x}-style
const routeRegex = /<Route\s+path=(\{[^}]+\}|"[^"]*")/g
const rawPaths = []
let m
while ((m = routeRegex.exec(appTsx))) {
    rawPaths.push(m[1])
}

function resolveExpr(expr) {
    // strip braces
    let e = expr.trim()
    if (e.startsWith('{') && e.endsWith('}')) e = e.slice(1, -1).trim()
    if (e.startsWith('"') && e.endsWith('"')) return e.slice(1, -1)
    if (e.startsWith('`') && e.endsWith('`')) e = e.slice(1, -1)

    // resolve ${slugsTr.xxx} / ${slugsEn.xxx} / ${trSlugs.xxx} interpolations
    e = e.replace(/\$\{slugsTr\.(\w+)\}/g, (_, k) => trSlugs[k] ?? '')
    e = e.replace(/\$\{slugsEn\.(\w+)\}/g, (_, k) => enSlugs[k] ?? '')

    // bare slugsTr.xxx / slugsEn.xxx (no template literal wrapper)
    const bareTr = e.match(/^slugsTr\.(\w+)$/)
    if (bareTr) return trSlugs[bareTr[1]] ?? null
    const bareEn = e.match(/^slugsEn\.(\w+)$/)
    if (bareEn) return enSlugs[bareEn[1]] ?? null

    return e
}

const resolved = rawPaths
    .map(resolveExpr)
    .filter((p) => typeof p === 'string' && p.length > 0)

const firstSegments = new Set()
for (const p of resolved) {
    if (p === '*' || p === '/') continue
    const clean = p.replace(/^\//, '')
    const seg = clean.split('/')[0]
    if (!seg || seg.includes(':')) continue // dynamic-first-segment routes (none expected) skip
    firstSegments.add(seg)
}

// Remove segments that are already prerendered as real static directories —
// those are already served correctly by the directory-exists .htaccess rule.
const needsAllowlist = [...firstSegments].filter((s) => !prerenderedFirstSegments.has(s)).sort()

console.log('Total unique first-segments found in routes:', firstSegments.size)
console.log('Already covered by prerendered directories:', firstSegments.size - needsAllowlist.length)
console.log('\n--- Needs explicit .htaccess allowlist (not prerendered) ---')
console.log(needsAllowlist.join('|'))
