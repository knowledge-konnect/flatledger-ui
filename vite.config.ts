import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost',
    hmr: {
      host: 'localhost',
      port: 3000,
    },
    proxy: {
      '/api': {
        // Use VITE_DEV_PROXY_TARGET env var to avoid hardcoding the production URL.
        // Set it in .env.development — e.g. VITE_DEV_PROXY_TARGET=https://flatledger-api.onrender.com
        target: process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ['react-is', 'dompurify'],
    exclude: ['lucide-react'],
  },
  resolve: {
    // Use path.resolve so the alias works on all platforms (Windows, Linux, Docker)
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },
  build: {
    // Target modern browsers — allows smaller output (no legacy transforms)
    target: 'es2020',
    // Split CSS per chunk so each route only loads the CSS it needs
    cssCodeSplit: true,
    // xlsx and apexcharts are large but already lazy-loaded; suppress the noise
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Give chunks stable, content-hashed names for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          // Core React runtime — tiny, cached forever
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Data-fetching — stable, rarely changes
          query: ['@tanstack/react-query'],
          // Charts — largest library (~400KB), only needed on chart pages
          charts: ['apexcharts', 'react-apexcharts'],
          // Animation — only used on public/landing pages
          motion: ['framer-motion'],
          // Icons — large tree-shakeable lib; isolated so it benefits from caching
          icons: ['lucide-react'],
          // Forms — used across many pages but not on initial load
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // i18n — only needed after app initialises
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? (['console', 'debugger'] as ('console' | 'debugger')[]) : [],
  },
}));
