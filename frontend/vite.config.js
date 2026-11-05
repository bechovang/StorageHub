import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['qrcode'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/@phosphor-icons')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/motion') || id.includes('node_modules/gsap')) {
            return 'vendor-motion';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
