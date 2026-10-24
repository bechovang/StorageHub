import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['qrcode'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'https://storagehub.phucnn.io.vn',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
