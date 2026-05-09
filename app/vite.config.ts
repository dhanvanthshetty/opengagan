import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Read .env from the monorepo root, not from app/
  envDir: '..',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: [
      '@deck.gl/react',
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/geo-layers',
      '@deck.gl/mesh-layers',
    ],
    exclude: ['react-globe.gl', 'three'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          deckgl: ['@deck.gl/react', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/geo-layers', '@deck.gl/mesh-layers'],
        },
      },
    },
  },
})
