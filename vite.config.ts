import { defineConfig, Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

// Custom plugin to ensure CSS is inlined into JS
function inlineStylesPlugin(): Plugin {
  return {
    name: 'inline-styles-plugin',
    enforce: 'post',
    apply: 'build',
    generateBundle(_, bundle) {
      // Find CSS chunks
      const cssChunks = Object.keys(bundle).filter(key => key.endsWith('.css'));
      
      // Find the main JS chunk
      const jsChunk = Object.keys(bundle).find(key => key === 'now-widget.js');
      
      if (jsChunk && cssChunks.length > 0) {
        const js = bundle[jsChunk];
        
        if (js.type === 'chunk') {
          // Collect all CSS content
          let allCssContent = '';
          
          // For each CSS chunk, collect its content
          cssChunks.forEach(cssChunk => {
            const css = bundle[cssChunk];
            if (css.type === 'asset') {
              allCssContent += css.source.toString() + '\n';
              // Remove the CSS chunk as it's now inlined
              delete bundle[cssChunk];
            }
          });
          
          // Add code to inject the CSS into the document when the JS runs
          const injectionCode = `
// Inline styles injection
(function() {
  try {
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(allCssContent)};
    document.head.appendChild(style);
    console.log('Now Widget - CSS styles injected successfully');
  } catch (err) {
    console.error('Failed to inject CSS:', err);
  }
})();
`;
          
          // Prepend the CSS injection code to the JS
          js.code = injectionCode + js.code;
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [preact(), inlineStylesPlugin()],
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
    cssCodeSplit: false, // Prevent CSS code splitting
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