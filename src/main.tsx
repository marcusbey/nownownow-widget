import { render, h } from 'preact';
import App from './App';
import { SpinningButton } from './components/SpinningButton';
import type { WidgetInstance, WidgetConfig } from './types';

function getCurrentScript(): HTMLScriptElement | null {
  // Try to get the script that's currently executing
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript) {
    return currentScript;
  }

  // Fallback: find script with our attributes
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
    position: (currentScript.getAttribute('data-position') || 'right') as 'right' | 'left',
    buttonColor: currentScript.getAttribute('data-button-color') || '#000000',
    buttonSize: parseInt(currentScript.getAttribute('data-button-size') || '60', 10),
  };
}

function mount(config: WidgetConfig): WidgetInstance {
  try {
    // Create panel container
    const container = document.createElement('div');
    container.id = 'now-widget-panel';
    document.body.appendChild(container);

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'now-widget-button-container';
    document.body.appendChild(buttonContainer);

    // Add global styles
    const style = document.createElement('style');
    style.textContent = `
      body.now-widget-open { 
        overflow: hidden; 
      }
      
      #now-widget-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 400px;
        background: white;
        box-shadow: -2px 0 4px rgba(0,0,0,0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 2147483646;
      }
      
      #now-widget-panel.open {
        transform: translateX(0);
      }

      @media (prefers-reduced-motion: reduce) {
        #now-widget-panel {
          transition-duration: 0s;
        }
      }
    `;
    document.head.appendChild(style);

    // Render panel
    render(h(App, config), container);

    // Render button
    render(
      h(SpinningButton, {
        size: config.buttonSize,
        color: config.buttonColor,
        position: config.position,
        onClick: () => {
          container.classList.toggle('open');
          document.body.classList.toggle('now-widget-open');
        },
      }),
      buttonContainer
    );

    return {
      unmount: () => {
        render(null, container);
        render(null, buttonContainer);
        style.remove();
        container.remove();
        buttonContainer.remove();
        document.body.classList.remove('now-widget-open');
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
