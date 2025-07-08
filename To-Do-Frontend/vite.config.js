import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['c635b791-60c2-47ee-b59e-1cdc114c0dfd-00-3pwokcymuep0f.pike.replit.dev']
  }
})
