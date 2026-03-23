const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

declare global {
    interface Window {
        __khilonApiDebugLogged?: boolean
    }
}

export { API_BASE_URL }

export function getApiUrl(path = ''): string {
    const normalizedPath = String(path || '').replace(/^\/+/, '')
    return normalizedPath ? `${API_BASE_URL}/${normalizedPath}` : API_BASE_URL
}

export function logApiTarget() {
    if (!import.meta.env.DEV || typeof window === 'undefined' || window.__khilonApiDebugLogged) {
        return
    }

    window.__khilonApiDebugLogged = true
    const mode = API_BASE_URL.startsWith('http')
        ? 'absolute'
        : 'relative-via-vite-proxy'

    console.info('[api]', {
        baseUrl: API_BASE_URL,
        mode,
        origin: window.location.origin
    })
}
