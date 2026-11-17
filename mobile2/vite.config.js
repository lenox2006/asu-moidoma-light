import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Вариант оформления «Мой Дом 24» — собирается в backend/public/m2, Laravel отдаёт index.html на /m2/*
export default defineConfig({
  plugins: [react()],
  base: '/m2/',
  build: { outDir: '../backend/public/m2', emptyOutDir: true, sourcemap: false },
  server: { port: 5175, proxy: { '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:8000', changeOrigin: true } } },
});
