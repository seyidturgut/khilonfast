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

    return {
        plugins: [
            react(),
            ...(enablePrerender ? [prerender({
                routes: prerenderRoutes,
                renderer: '@prerenderer/renderer-puppeteer',
                rendererOptions: {
                    headless: true,
                    timeout: 120000,
                    maxConcurrentRoutes: 3,
                    renderAfterTime: 2000,
                    skipThirdPartyRequests: true,
                    inject: { __PRERENDER__: true },
                    launchOptions: {
                        protocolTimeout: 180000,
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
        server: {
            host: '127.0.0.1',
            proxy: {
                '/api': {
                    target: env.VITE_API_TARGET || 'http://localhost:3002',
                    changeOrigin: true
                }
            }
        }
    }
})
