import { execFileSync } from 'node:child_process';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

function buildInfoPlugin(buildInfo: {
  version: string;
  builtAt: string;
}): Plugin {
  const content = JSON.stringify(buildInfo);

  return {
    name: 'build-info',
    configureServer(server) {
      server.middlewares.use('/build-info.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(content);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'build-info.json',
        source: content,
      });
    },
  };
}

const version =
  process.env.VITE_APP_VERSION ??
  execFileSync('git', ['describe', '--tags', '--always'], {
    encoding: 'utf8',
  }).trim();
const builtAt = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/epub-bookshelf/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_DATE__: JSON.stringify(builtAt),
  },
  plugins: [
    react(),
    tailwindcss(),
    buildInfoPlugin({ version, builtAt }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'EPUB Bookshelf',
        short_name: 'Bookshelf',
        description: 'Browse your EPUB library from Google Drive.',
        theme_color: '#f8f4eb',
        background_color: '#f8f4eb',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
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
    host: '0.0.0.0',
    watch: {
      usePolling: true,
      ignored: ['**/local-test-data/**'],
    },
  },
}));
