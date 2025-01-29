import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2015',
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'NowWidget',
      formats: ['es'],
      fileName: () => 'now-widget.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
        compact: true,
      },
    },
  },
  css: {
    modules: {
      generateScopedName: 'now-widget-[local]',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});