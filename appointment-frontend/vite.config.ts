import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// In Docker, "localhost" points to the frontend container itself, not the backend.
// Use VITE_PROXY_TARGET to override the proxy destination (e.g. http://backend:8080).
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  define: {
    global: 'globalThis',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/components/appointment/AppointmentCard.tsx',
        'src/components/ui/modal.tsx',
        'src/hooks/usePaginatedFetch.ts',
        'src/services/apiClient.ts',
        'src/utils/index.ts',
      ],
      thresholds: {
        statements: 65,
        branches: 55,
        functions: 65,
        lines: 65,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/ws': {
        target: proxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
