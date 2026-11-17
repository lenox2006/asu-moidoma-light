import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Сборка кладётся в backend/public/app — Laravel отдаёт index.html на любой не-API маршрут.
export default defineConfig({
  plugins: [react()],
  base: '/app/',
  build: {
    outDir: '../backend/public/app',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      // В режиме разработки API проксируется на локальный backend.
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
