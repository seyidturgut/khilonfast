import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'
import { prerenderRoutes } from './scripts/prerender-routes.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const isBuild = command === 'build'
    // Prerender'ı sadece build sırasında ve env ile devre dışı bırakılmamışsa çalıştır.
    // Hızlı dev build için: PRERENDER=false npm run build
    const enablePrerender = isBuild && env.PRERENDER !== 'false'

    // Build anında SABİT bir tarih (her `npm run build` çalıştığında bir kez hesaplanır,
    // koda literal olarak gömülür). schema.org dateModified için kullanılır — client'ta
    // her ziyaretçide "new Date()" ile yeniden hesaplanırsa yanlış/tutarsız "son güncelleme"
    // tarihi gösterir; bu sabit değer prerender + hydration'da hep aynı kalır.
    const buildDate = new Date().toISOString()

    return {
        define: {
            __BUILD_DATE__: JSON.stringify(buildDate)
        },
        plugins: [
            react(),
            ...(enablePrerender ? [prerender({
                routes: prerenderRoutes,
                renderer: '@prerenderer/renderer-puppeteer',
                rendererOptions: {
                    headless: true,
                    timeout: 180000,
                    maxConcurrentRoutes: 2,
                    renderAfterTime: 2000,
                    skipThirdPartyRequests: true,
                    inject: { __PRERENDER__: true },
                    launchOptions: {
                        protocolTimeout: 360000,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    }
                },
                postProcess(rendered) {
                    rendered.html = rendered.html
                        .replace(/https?:\/\/localhost:\d+/g, '')
                        .replace(/https?:\/\/127\.0\.0\.1:\d+/g, '')
                    return rendered
                }
            })] : [])
        ],
        base: '/',
        optimizeDeps: {
            entries: ['index.html']
        },
        build: {
            chunkSizeWarningLimit: 1500,
            cssCodeSplit: true,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (!id.includes('node_modules')) return
                        // React + react-dom + scheduler + react-router stay together to avoid circular deps
                        if (id.includes('react-icons') || id.includes('@heroicons')) return 'icons'
                        if (id.includes('react-i18next') || id.includes('i18next')) return 'i18n'
                        if (id.includes('/three/') || id.includes('three-') || id.includes('@react-three')) return 'three'
                        if (id.includes('react-pdf') || id.includes('pdfjs-dist')) return 'pdf'
                        if (id.includes('react-email-editor') || id.includes('embed/embed')) return 'email-editor'
                        if (id.includes('framer-motion') || id.includes('gsap') || id.includes('lottie')) return 'animation'
                        if (id.includes('chart') || id.includes('recharts') || id.includes('d3-')) return 'charts'
                        if (id.includes('swiper') || id.includes('embla')) return 'carousel'
                    }
                }
            }
        },
        server: {
            host: '127.0.0.1',
            proxy: {
                '/api': {
                    target: env.VITE_API_TARGET || 'http://localhost:8099',
                    changeOrigin: true
                }
            }
        },
        preview: {
            host: '127.0.0.1',
            proxy: {
                '/api': {
                    target: env.VITE_API_TARGET || 'http://localhost:8099',
                    changeOrigin: true
                }
            }
        }
    }
})
