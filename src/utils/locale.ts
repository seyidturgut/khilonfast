import { useLocation } from 'react-router-dom'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'
import { productProgramCatalog } from '../data/productPrograms'
import { trainingProgramCatalog } from '../data/trainingPrograms'
import { consultingProgramCatalog } from '../data/consultingPrograms'
import type { LocalizedProgram } from './localizedContent'

export type AppLocale = 'tr' | 'en'

const trSlugs = trCommon.slugs as Record<string, string>
const enSlugs = enCommon.slugs as Record<string, string>
const localizedCatalogs: LocalizedProgram[] = [
    ...productProgramCatalog,
    ...trainingProgramCatalog,
    ...consultingProgramCatalog
]

function normalizePathname(pathname: string): string {
    const [cleanPath] = String(pathname || '').split(/[?#]/)
    const normalized = cleanPath.replace(/\/+$/, '')
    return normalized || '/'
}

function resolveCatalogLocalizedPath(targetLocale: AppLocale, pathname: string): string | null {
    const normalizedPath = normalizePathname(pathname)
    const strippedPath = `/${stripLocalePrefix(normalizedPath)}`.replace(/\/{2,}/g, '/')

    const matchedProgram = localizedCatalogs.find((program) => {
        const trPath = normalizePathname(program.path.tr)
        const enPath = normalizePathname(program.path.en)
        return (
            normalizedPath === trPath ||
            normalizedPath === enPath ||
            strippedPath === trPath ||
            strippedPath === enPath
        )
    })

    if (!matchedProgram) return null
    return targetLocale === 'en' ? matchedProgram.path.en : matchedProgram.path.tr
}

export function resolveLocaleFromPath(pathname: string): AppLocale {
    return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'tr'
}

export function useRouteLocale(): AppLocale {
    const location = useLocation()
    return resolveLocaleFromPath(location.pathname)
}

export function getLocalePrefix(locale: AppLocale): string {
    return locale === 'en' ? '/en' : ''
}

export function stripLocalePrefix(pathname: string): string {
    const normalized = pathname.replace(/^\/+/, '')
    return normalized.replace(/^en(\/|$)/, '').replace(/^\/+/, '')
}

export function buildLocalizedPath(locale: AppLocale, slug: string): string {
    const normalized = String(slug || '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')

    if (!normalized) {
        return locale === 'en' ? '/en' : '/'
    }

    return `${getLocalePrefix(locale)}/${normalized}`.replace(/\/{2,}/g, '/')
}

export function getSlugMap(locale: AppLocale): Record<string, string> {
    return locale === 'en' ? enSlugs : trSlugs
}

export function getLocalizedPathByKey(locale: AppLocale, key: string): string {
    return buildLocalizedPath(locale, getSlugMap(locale)[key] ?? '')
}

export function translatePathnameToLocale(targetLocale: AppLocale, pathname: string): string {
    const sourceLocale = resolveLocaleFromPath(pathname)
    const cleanPath = stripLocalePrefix(pathname).replace(/\/+$/, '')
    const sourceSlugs = getSlugMap(sourceLocale)
    const targetSlugs = getSlugMap(targetLocale)
    const catalogPath = resolveCatalogLocalizedPath(targetLocale, pathname)

    if (catalogPath) {
        return catalogPath
    }

    const matchedKey = Object.keys(sourceSlugs).find((key) => sourceSlugs[key] === cleanPath)

    if (matchedKey && targetSlugs[matchedKey] !== undefined) {
        return buildLocalizedPath(targetLocale, targetSlugs[matchedKey])
    }

    if (!cleanPath) {
        return buildLocalizedPath(targetLocale, '')
    }

    const dynamicPrefixMap: Record<AppLocale, Array<[RegExp, string]>> = {
        tr: [
            [/^services\/?/, 'hizmetlerimiz/'],
            [/^sectoral-services\/?/, 'sektorel-hizmetler/'],
            [/^trainings\/?/, 'egitimler/'],
            [/^products\/?/, 'urunler/']
        ],
        en: [
            [/^hizmetlerimiz\/?/, 'services/'],
            [/^sektorel-hizmetler\/?/, 'sectoral-services/'],
            [/^egitimler\/?/, 'trainings/'],
            [/^urunler\/?/, 'products/']
        ]
    }

    let translatedPath = cleanPath
    for (const [pattern, replacement] of dynamicPrefixMap[targetLocale]) {
        if (pattern.test(translatedPath)) {
            translatedPath = translatedPath.replace(pattern, replacement)
            break
        }
    }

    return buildLocalizedPath(targetLocale, translatedPath)
}
