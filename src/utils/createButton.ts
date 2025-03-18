import { ButtonConfig, defaultButtonConfig } from '@/types';
import { injectWidgetStyles } from './styleUtils';

interface ButtonInstance {
  element: HTMLElement;
  shadowRoot: ShadowRoot;
  destroy: () => void;
}

export function createNowButton(config?: ButtonConfig): ButtonInstance {
  const finalConfig = { ...defaultButtonConfig, ...config };

  const container = document.createElement('div');
  container.id = 'now-widget-button-container';

  Object.assign(container.style, {
    position: 'fixed',
    bottom: '20px',
    [finalConfig.position]: '20px',
    zIndex: '2147483647',
    width: '0',
    height: '0',
    pointerEvents: 'none',
  });

  const shadow = container.attachShadow({ mode: 'open' });

  // Inject shared widget styles first
  injectWidgetStyles(shadow);

  const style = document.createElement('style');
  style.textContent = `
    :host {
      display: block;
      position: fixed !important;
      z-index: 2147483647 !important;
    }

    .now-widget-button {
      --button-size: ${finalConfig.size}px;
      position: absolute;
      bottom: 0;
      ${finalConfig.position}: 0;
      transform: translate(${finalConfig.position === 'right' ? '-50%' : '50%'}, -50%);
      width: var(--button-size);
      height: var(--button-size);
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: pointer;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .rotating-text {
      position: absolute;
      width: 100%;
      height: 100%;
      animation: rotate 10s linear infinite;
      font-size: 16px;
      letter-spacing: 1px;
      color: ${finalConfig.color};
      user-select: none;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .now-widget-button:hover .rotating-text {
      animation-duration: 5s;
    }

    @media (prefers-reduced-motion: reduce) {
      .rotating-text {
        animation-duration: 20s;
      }
    }
  `;

  shadow.appendChild(style);

  const button = document.createElement('button');
  button.className = 'now-widget-button';
  button.setAttribute('aria-label', 'Open Now Panel');

  const text = document.createElement('div');
  text.className = 'rotating-text';
  text.textContent = 'now . '.repeat(3);

  button.appendChild(text);
  shadow.appendChild(button);

  return {
    element: container,
    shadowRoot: shadow,
    destroy: () => {
      container.remove();
    },
  };
}
