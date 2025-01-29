import { render } from 'preact';
import App from './App';
import './index.css';
import type { WidgetInstance } from './types';

interface MountOptions {
  target: HTMLElement;
  props?: Record<string, unknown>;
}

export function mount({ target, props = {} }: MountOptions): WidgetInstance {
  // Create a container div
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  target.appendChild(container);

  render(<App {...props} />, container);

  return {
    unmount: () => {
      render(null, container);
      target.removeChild(container);
    },
  };
}

// Auto-mount if the script is loaded directly
if (typeof window !== 'undefined') {
  const target = document.getElementById('now-widget');
  if (target) {
    mount({ target });
  }
}

export type { WidgetInstance } from './types';
