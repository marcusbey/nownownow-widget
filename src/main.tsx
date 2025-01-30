import { render, h } from 'preact';
import App from './App';
import { SpinningButton } from './components/SpinningButton';
import type { WidgetInstance, WidgetConfig } from './types';

function getCurrentScript(): HTMLScriptElement | null {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript) {
    return currentScript;
  }

  const scripts = Array.from(document.getElementsByTagName('script'));
  return scripts.find(script => 
    script.src.includes('now-widget.js') && 
    (script.hasAttribute('data-user-id') || script.hasAttribute('data-token'))
  ) || null;
}

function getScriptConfig(): WidgetConfig {
  const currentScript = getCurrentScript();

  if (!currentScript) {
    throw new Error('Now Widget: Script element not found. Make sure to include data-user-id and data-token attributes.');
  }

  const userId = currentScript.getAttribute('data-user-id');
  const token = currentScript.getAttribute('data-token');

  if (!userId || !token) {
    throw new Error('Now Widget: Missing required configuration (userId and token). Make sure to include both data-user-id and data-token attributes.');
  }

  return {
    userId,
    token,
    theme: (currentScript.getAttribute('data-theme') || 'light') as 'light' | 'dark',
    position: (currentScript.getAttribute('data-position') || 'left') as 'right' | 'left',
    buttonColor: currentScript.getAttribute('data-button-color') || '#000000',
    buttonSize: parseInt(currentScript.getAttribute('data-button-size') || '60', 10),
  };
}

const panelStyles = `
  :host {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(400px, 80%);
    z-index: 2147483646;
    pointer-events: none;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .overlay.open {
    opacity: 1;
    pointer-events: all;
  }

  .panel {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    background: rgb(15, 23, 42); /* slate-900 */
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: all;
  }

  .panel.open {
    transform: translateX(0);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .panel-title {
    color: rgb(226, 232, 240); /* slate-200 */
    font-weight: 600;
    font-size: 0.875rem;
  }

  .close-button {
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: rgb(148, 163, 184); /* slate-400 */
    cursor: pointer;
    border-radius: 0.375rem;
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .close-button:hover {
    color: rgb(226, 232, 240); /* slate-200 */
    background: rgba(255, 255, 255, 0.1);
  }

  .close-button svg {
    width: 1rem;
    height: 1rem;
  }

  .panel-content {
    padding: 1rem;
    color: rgb(226, 232, 240);
    overflow-y: auto;
    height: calc(100% - 3.5rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .panel, .overlay {
      transition-duration: 0s;
    }
  }
`;

const containerStyles = `
  :host {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  }
`;

function mount(config: WidgetConfig): WidgetInstance {
  try {
    // Create a container for our widget elements
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'now-widget-container';
    widgetContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483646;
    `;

    // Create panel container with shadow DOM
    const panelContainer = document.createElement('div');
    panelContainer.id = 'now-widget-panel';
    const panelShadow = panelContainer.attachShadow({ mode: 'closed' });

    const panelStyle = document.createElement('style');
    panelStyle.textContent = panelStyles;
    panelShadow.appendChild(panelStyle);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    panelShadow.appendChild(overlay);

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'panel';
    
    // Create panel header
    const header = document.createElement('div');
    header.className = 'panel-header';
    
    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = 'Latest Updates';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    closeButton.setAttribute('aria-label', 'Close panel');
    
    header.appendChild(title);
    header.appendChild(closeButton);
    panel.appendChild(header);

    // Create panel content
    const content = document.createElement('div');
    content.className = 'panel-content';
    panel.appendChild(content);

    panelShadow.appendChild(panel);

    // Create button container with shadow DOM
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'now-widget-button-container';
    const buttonShadow = buttonContainer.attachShadow({ mode: 'closed' });

    const buttonStyle = document.createElement('style');
    buttonStyle.textContent = containerStyles;
    buttonShadow.appendChild(buttonStyle);

    const buttonWrapper = document.createElement('div');
    buttonShadow.appendChild(buttonWrapper);

    // Create style tag for the main document
    const mainStyle = document.createElement('style');
    mainStyle.textContent = `
      html.now-widget-open,
      html.now-widget-open body {
        overflow: hidden;
      }

      html.now-widget-open #__next,
      html.now-widget-open [id="__next"],
      html.now-widget-open main,
      html.now-widget-open [role="main"],
      html.now-widget-open #root,
      html.now-widget-open [id="root"],
      html.now-widget-open > body > div:not([id^="now-widget"]) {
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translateX(min(400px, 80vw));
        transform-origin: left top;
        will-change: transform;
      }

      html:not(.now-widget-open) #__next,
      html:not(.now-widget-open) [id="__next"],
      html:not(.now-widget-open) main,
      html:not(.now-widget-open) [role="main"],
      html:not(.now-widget-open) #root,
      html:not(.now-widget-open) [id="root"],
      html:not(.now-widget-open) > body > div:not([id^="now-widget"]) {
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translateX(0);
        transform-origin: left top;
        will-change: transform;
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          transition-duration: 0s !important;
        }
      }
    `;

    // Wait for document ready
    const init = () => {
      document.head.appendChild(mainStyle);
      document.body.appendChild(widgetContainer);
      widgetContainer.appendChild(panelContainer);
      widgetContainer.appendChild(buttonContainer);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    // Add click handlers
    const togglePanel = () => {
      panel.classList.toggle('open');
      overlay.classList.toggle('open');
      document.documentElement.classList.toggle('now-widget-open');
    };

    closeButton.addEventListener('click', togglePanel);
    overlay.addEventListener('click', togglePanel);

    // Render panel content
    render(h(App, config), content);

    // Render button
    render(
      h(SpinningButton, {
        size: config.buttonSize,
        color: config.buttonColor,
        position: config.position,
        onClick: togglePanel,
      }),
      buttonWrapper
    );

    return {
      unmount: () => {
        render(null, content);
        render(null, buttonWrapper);
        widgetContainer.remove();
        mainStyle.remove();
        document.documentElement.classList.remove('now-widget-open');
      },
    };
  } catch (error) {
    console.error('Failed to mount Now Widget:', error);
    throw error;
  }
}

// Auto-initialize when the script loads
(function () {
  if (typeof window !== 'undefined') {
    try {
      const config = getScriptConfig();
      mount(config);
    } catch (error) {
      console.error(error);
    }
  }
})();

// Export for UMD
export { mount };

// Expose to window for direct browser usage
if (typeof window !== 'undefined') {
  (window as any).NowWidget = { mount };
}

export type { WidgetInstance } from './types';
