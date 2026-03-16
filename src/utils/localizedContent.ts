import type { TFunction } from 'i18next'
import type { AppLocale } from './locale'

export interface LocalizedValue {
    tr: string
    en: string
}

export interface LocalizedProgram {
    path: LocalizedValue
    title: LocalizedValue
    summary: LocalizedValue
    productKey?: string
}

type ResolveLocalizedTextArgs = {
    locale: AppLocale
    cmsValue?: string | null
    t?: TFunction
    localeKey?: string
    fallbackEn?: string
    fallbackTr?: string
}

export function pickLocalizedValue(locale: AppLocale, value: LocalizedValue): string {
    return locale === 'en' ? value.en : value.tr
}

export function getLocalizedPrograms(locale: AppLocale, programs: LocalizedProgram[]) {
    return programs.map((program) => ({
        path: pickLocalizedValue(locale, program.path),
        title: pickLocalizedValue(locale, program.title),
        summary: pickLocalizedValue(locale, program.summary),
        ...(program.productKey ? { productKey: program.productKey } : {})
    }))
}

export function resolveLocalizedText({
    locale,
    cmsValue,
    t,
    localeKey,
    fallbackEn = '',
    fallbackTr = ''
}: ResolveLocalizedTextArgs): string {
    const sanitizedCms = String(cmsValue || '').trim()
    if (sanitizedCms && sanitizedCms !== '[object Object]') {
        return sanitizedCms
    }

    if (t && localeKey) {
        const translated = String(t(localeKey)).trim()
        if (translated && translated !== localeKey) {
            return translated
        }
    }

    return locale === 'en' ? fallbackEn : fallbackTr
}

const TURKISH_LEAK_PATTERN = /[çğıöşüÇĞİÖŞÜ]|\b(egitim|eğitim|odeme|ödeme|buyume|büyüme|pazarlama|satis|satış|kurumsal|hedef kitle|değer önerisi|ölçümleme|katıl|satın al)\b/i

export function hasTurkishContentLeak(value: unknown): boolean {
    if (typeof value === 'string') {
        return TURKISH_LEAK_PATTERN.test(value)
    }

    if (Array.isArray(value)) {
        return value.some((item) => hasTurkishContentLeak(item))
    }

    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some((item) => hasTurkishContentLeak(item))
    }

    return false
}
