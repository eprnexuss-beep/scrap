
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxy = {
  '/api': {
    target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
    changeOrigin: true,
  },
}

export default defineConfig({
  base: '/scrap/',
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },

  server: {
    port: 5173,
    proxy: apiProxy,
  },

  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
