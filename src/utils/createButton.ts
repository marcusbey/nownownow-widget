import { ButtonConfig, defaultButtonConfig } from '@/types';
import { h } from "preact";
import { injectWidgetStyles } from './styleUtils';

interface ButtonInstance {
  element: HTMLElement;
  shadowRoot: ShadowRoot;
  destroy: () => void;
}

export function createNowButton(config?: ButtonConfig): ButtonInstance {
  const finalConfig = { ...defaultButtonConfig, ...config };

  const container = document.createElement('div');
  container.id = 'nownownow-widget-button-container';

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

    .nownownow-widget-button {
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

    .nownownow-widget-button:hover .rotating-text {
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
  button.className = 'nownownow-widget-button';
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

type ButtonPosition = "left" | "right";

interface ButtonProps {
  onClick: () => void;
  isOpen: boolean;
  isVisible: boolean;
  size?: string;
  color?: string;
  position?: ButtonPosition;
}

export const createButtonContainer = (): HTMLDivElement => {
  const container = document.createElement("div");
  container.id = 'nownownow-widget-button-container';
  return container;
};

export function SpinningButton({
  onClick,
  isOpen = false,
  isVisible = true,
  size = "48",
  color = "#f59e0b",
  position = "right",
}: ButtonProps) {
  // Convert size to number for calculations
  const sizeNum = parseInt(size, 10);
  const scaledFontSize = Math.max(10, Math.floor(sizeNum / 4));

  const style = `
    .nownownow-widget-button {
      position: fixed;
      ${position}: 20px;
      bottom: 20px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${color};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      border: none;
      outline: none;
      z-index: 999999;
      transform: ${isVisible ? 'scale(1)' : 'scale(0)'};
      transition: transform 0.3s ease-in-out, box-shadow 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                   Helvetica, Arial, sans-serif;
      overflow: hidden;
    }
    
    .rotating-text {
      font-size: ${scaledFontSize}px;
      font-weight: bold;
      transition: transform 0.3s ease;
      transform: ${isOpen ? 'rotate(45deg)' : 'rotate(0)'};
    }
    
    .nownownow-widget-button:hover {
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1);
    }
    
    .nownownow-widget-button:hover .rotating-text {
      transform: ${isOpen ? 'rotate(90deg)' : 'rotate(45deg)'};
    }
    
    @media (prefers-reduced-motion: reduce) {
      .nownownow-widget-button, .rotating-text {
        transition: none !important;
      }
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = style;
  document.head.appendChild(styleElement);

  // Create the button element using h()
  return h('button', {
    className: 'nownownow-widget-button',
    'aria-label': `${isOpen ? 'Close' : 'Open'} Now Panel`,
    onClick: onClick
  }, [
    h('span', { className: 'rotating-text' }, '+')
  ]);
}
