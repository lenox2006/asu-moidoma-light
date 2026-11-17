import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Мобильная версия собирается в backend/public/m — Laravel отдаёт её index.html на /m/*
export default defineConfig({
  plugins: [react()],
  base: '/m/',
  build: { outDir: '../backend/public/m', emptyOutDir: true, sourcemap: false },
  server: { port: 5174, proxy: { '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:8000', changeOrigin: true } } },
});
