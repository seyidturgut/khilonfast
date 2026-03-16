import fs from 'node:fs'

const files = [
    ['tr', 'src/locales/tr/common.json'],
    ['en', 'src/locales/en/common.json']
]

function flatten(obj, prefix = '', out = {}) {
    for (const [key, value] of Object.entries(obj || {})) {
        const nextKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value, nextKey, out)
        } else {
            out[nextKey] = value
        }
    }
    return out
}

const maps = Object.fromEntries(
    files.map(([locale, file]) => [locale, flatten(JSON.parse(fs.readFileSync(file, 'utf8')))])
)

const trKeys = Object.keys(maps.tr)
const enKeys = Object.keys(maps.en)
const missingInEn = trKeys.filter((key) => !(key in maps.en))
const missingInTr = enKeys.filter((key) => !(key in maps.tr))

if (missingInEn.length || missingInTr.length) {
    console.error('Locale key parity check failed.')
    if (missingInEn.length) {
        console.error('\nMissing in EN:')
        console.error(missingInEn.join('\n'))
    }
    if (missingInTr.length) {
        console.error('\nMissing in TR:')
        console.error(missingInTr.join('\n'))
    }
    process.exit(1)
}

console.log(`Locale key parity OK. ${trKeys.length} keys in TR and EN.`)
