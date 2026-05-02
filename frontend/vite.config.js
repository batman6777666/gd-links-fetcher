import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to show startup message
const startupMessagePlugin = () => ({
  name: 'startup-message',
  configureServer(server) {
    server.httpServer?.once('listening', () => {
      const address = server.httpServer.address()
      const port = address.port
      console.log('\n========================================')
      console.log('  GD LINKS FETCHER FRONTEND')
      console.log('========================================')
      console.log(`  Local:   http://localhost:${port}/`)
      console.log('========================================\n')
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), startupMessagePlugin()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:7860',
        changeOrigin: true
      }
    }
  }
})
