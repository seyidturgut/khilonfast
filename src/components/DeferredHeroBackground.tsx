import { useEffect, useState, type ComponentType } from 'react'

/**
 * PERFORMANS: HeroBackgroundEffect three.js kullaniyor (~486 KB ham / 120 KB gzip)
 * ve sadece dekoratif bir arka plan. Duz import edilirse index chunk'ina girip
 * SITENIN HER SAYFASINDA iniyordu.
 *
 * React.lazy de yeterli DEGIL: router/Suspense render edilmeyen rotalari da
 * "isitiyor", o yuzden /egitimler gibi hero'suz sayfalarda bile three iniyordu.
 * Effect ise YALNIZCA gercek mount'ta calisir — bu yuzden import'u buraya aldik.
 * Ayrica idle'a erteledik: ilk boyamayi (LCP) bloklamaz.
 */
export default function DeferredHeroBackground() {
    const [Effect, setEffect] = useState<ComponentType | null>(null)

    useEffect(() => {
        let alive = true
        let idleId: number | undefined
        let timerId: number | undefined

        const load = () => {
            import('./HeroBackgroundEffect')
                .then((m) => { if (alive) setEffect(() => m.default) })
                .catch(() => { /* WebGL/agi hatasi: arka plan olmadan devam et */ })
        }

        if ('requestIdleCallback' in window) {
            idleId = (window as unknown as {
                requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number
            }).requestIdleCallback(load, { timeout: 2000 })
        } else {
            timerId = window.setTimeout(load, 300)
        }

        return () => {
            alive = false
            if (idleId !== undefined && 'cancelIdleCallback' in window) {
                (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId)
            }
            if (timerId !== undefined) window.clearTimeout(timerId)
        }
    }, [])

    return Effect ? <Effect /> : null
}
