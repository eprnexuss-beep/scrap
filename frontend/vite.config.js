import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In development the browser talks only to Vite (http://localhost:5173); /api is forwarded to the backend.
// That keeps everything same-origin, so the login cookie "just works" without CORS setup.
const apiProxy = {
  '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000', changeOrigin: false },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
})
