import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import icons from './public/icons.json';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/epub-bookshelf/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // auto update service worker
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'EPUB Bookshelf',
        short_name: 'Bookshelf',
        description: 'A digital EPUB bookshelf with cloud sync',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: icons.icons,
      },
    }),
  ],
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
