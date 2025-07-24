import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['7b4d9b7a-2b69-418f-9a38-967642d11a06-00-jfikp0pli8zu.sisko.replit.dev'],
    proxy: {
      '/api': {
        target: 'https://to-do-advanced-production.up.railway.app',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
