import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/',
    optimizeDeps: {
        entries: ['index.html']
    },
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_PHP_API_TARGET || 'http://127.0.0.1:8099',
                changeOrigin: true
            }
        }
    }
})
