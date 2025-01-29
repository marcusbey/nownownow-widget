import type { Plugin } from 'vite';

export default function cssInjector(): Plugin {
  let cssCode = '';

  return {
    name: 'css-injector',
    apply: 'build',
    transform(code, id) {
      if (id.endsWith('.css')) {
        cssCode += code;
        return {
          code: `export default ${JSON.stringify(code)}`,
          map: null,
        };
      }
      return null;
    },
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.isEntry) {
          const cssString = JSON.stringify(cssCode);
          chunk.code = chunk.code.replace(
            'export function mount',
            `const style = document.createElement('style');
            style.textContent = ${cssString};
            document.head.appendChild(style);
            export function mount`
          );
        }
      }
    },
  };
}
