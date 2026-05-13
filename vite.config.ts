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
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          charts: ['apexcharts', 'react-apexcharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? (['console', 'debugger'] as ('console' | 'debugger')[]) : [],
  },
}));
