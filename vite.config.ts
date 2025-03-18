import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { defineConfig, Plugin } from 'vite';

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
      const jsChunk = Object.keys(bundle).find(key => key.endsWith('.js') && !key.endsWith('.map.js'));

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
    // Create a stylesheet for the document (for global styles)
    const docStyle = document.createElement('style');
    docStyle.textContent = ${JSON.stringify(allCssContent)};
    document.head.appendChild(docStyle);
    
    // Store CSS for shadow DOM injection
    window.__NOW_WIDGET_STYLES__ = ${JSON.stringify(allCssContent)};
    
    // Create a function to inject styles into shadow roots
    window.__injectNowWidgetStyles = function(shadowRoot) {
      if (!shadowRoot) return;
      const style = document.createElement('style');
      style.textContent = window.__NOW_WIDGET_STYLES__;
      shadowRoot.appendChild(style);
    };
    
    console.log('Now Widget - CSS styles prepared successfully');
  } catch (err) {
    console.error('Failed to prepare CSS:', err);
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

// Plugin to replace build timestamp placeholder
function buildTimestampPlugin(): Plugin {
  return {
    name: 'build-timestamp-plugin',
    transform(code) {
      // Replace the placeholder with the current timestamp
      if (code.includes('__BUILD_TIMESTAMP__')) {
        const timestamp = new Date().toISOString();
        const result = code.replace('__BUILD_TIMESTAMP__', timestamp);
        return {
          code: result,
          map: null // Explicitly return null map to avoid sourcemap warnings
        };
      }
      return null; // Return null for files that don't need transformation
    }
  };
}

// Plugin to ensure files are in the correct output directory
function fixOutputPathPlugin(): Plugin {
  return {
    name: 'fix-output-path-plugin',
    enforce: 'post',
    apply: 'build',
    generateBundle(_, bundle) {
      // Make sure all assets are in the root dist directory, not in subdirectories
      const assetsToRename: Record<string, any> = {};

      Object.keys(bundle).forEach(fileName => {
        if (fileName.includes('/')) {
          const newFileName = fileName.split('/').pop()!;
          assetsToRename[fileName] = { ...bundle[fileName], fileName: newFileName };
        }
      });

      Object.entries(assetsToRename).forEach(([oldName, asset]) => {
        delete bundle[oldName];
        this.emitFile(asset);
      });
    }
  };
}

export default defineConfig({
  plugins: [
    preact(),
    inlineStylesPlugin(),
    buildTimestampPlugin(),
    fixOutputPathPlugin()
  ],
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
        entryFileNames: 'now-widget.js',
        chunkFileNames: 'now-widget.js',
        assetFileNames: 'now-widget.[ext]',
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined, // Disable code splitting
      },
    },
  },
  css: {
    modules: {
      generateScopedName: 'nownownow-widget-[local]',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    watch: {
      usePolling: true,
    },
  },
  publicDir: 'public',
  base: './',
});