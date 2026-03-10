import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://flatledger-api.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react-is'],
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': '/app/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
