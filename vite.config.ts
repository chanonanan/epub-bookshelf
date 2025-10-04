import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/epub-bookshelf/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.join(__dirname, 'dist'),
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
