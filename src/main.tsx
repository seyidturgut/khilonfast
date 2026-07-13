import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

// Build-time prerender (puppeteer) sırasında native fetch'i de stub'la — axios'u zaten api.ts'de halletim.
// Prerender server'ında /api yok, sayfalar hang'lemesin diye boş response dön.
if (typeof window !== 'undefined' && (window as any).__PRERENDER__ === true) {
    const originalFetch = window.fetch
    window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url)
        if (/\/api\//.test(url)) {
            return Promise.resolve(new Response('{}', {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }))
        }
        return originalFetch(input, init)
    }
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>,
)
