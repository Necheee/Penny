import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],

  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.loca.lt', 'unwanted-reapprove-reproach.ngrok-free.dev'],
    hmr: process.env.VITE_TUNNEL === 'true' ? { clientPort: 443 } : undefined,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
