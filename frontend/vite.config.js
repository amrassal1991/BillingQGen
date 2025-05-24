import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/BillingQGen/',  // your repo name as base path
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Disable host checking entirely as requested
    allowedHosts: 'all',
    cors: true,
    hmr: {
      clientPort: 443 // Use 443 for HTTPS connections
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: 'all',
    cors: true
  }
})

