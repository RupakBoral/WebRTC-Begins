import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      protocol: 'wss',
      host: 'acquiescently-silky-clint.ngrok-free.dev',
    }
  }
})