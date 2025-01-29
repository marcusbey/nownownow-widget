import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';
import cssInjector from './vite-plugin-css-injector';

export default defineConfig({
  plugins: [
    preact(),
    cssInjector(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'NowWidget',
      formats: ['es'],
      fileName: 'now-widget',
    },
    rollupOptions: {
      external: ['preact'],
      output: {
        format: 'es',
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    fs: {
      strict: false,
      allow: ['..'],
    },
    open: '/index.dev.html',
  },
  preview: {
    port: 4001,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});