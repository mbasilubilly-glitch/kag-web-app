import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    // Fall through to the next free port instead of hard-failing, and let
    // HMR's websocket follow whichever port the server actually lands on
    // (no hardcoded hmr.port) — otherwise, whenever 5173 is taken by
    // another project on the same machine, the HMR client hammers a dead
    // port and the page reload-loops trying to reconnect.
    strictPort: false,
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: false,
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[Vite Proxy Error] Backend may not be running on port 8000:', err.message)
          })
        },
      },
    },
  },
  define: {
    'process.env': {},
  },
})