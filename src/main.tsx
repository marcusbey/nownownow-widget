import { h, render } from 'preact';
import { signal } from '@preact/signals';
import type { WidgetInstance, WidgetConfig, WidgetStateData, WidgetPosition } from './types/widget';
import { SpinningButton } from './components/SpinningButton';
import App from './App';

// Define custom event types
interface NowWidgetEvents {
  nowWidgetInitialized: CustomEvent<{ success: boolean }>
}

declare global {
  interface WindowEventMap extends NowWidgetEvents {}
}

const isNowWidgetScript = (script: HTMLScriptElement): boolean => 
  script.src.includes('now-widget.js') && 
  script.hasAttribute('data-user-id') && 
  script.hasAttribute('data-token');

const getCurrentScript = (): HTMLScriptElement => {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript && isNowWidgetScript(currentScript)) {
    return currentScript;
  }

  const scripts = Array.from(document.getElementsByTagName('script'));
  const widgetScript = scripts.find(isNowWidgetScript);

  if (!widgetScript) {
    throw new Error('Now Widget: Script element not found. Make sure to include data-user-id and data-token attributes.');
  }

  return widgetScript;
};

const parseButtonSize = (value: string | null): number => {
  const size = parseInt(value || '60', 10);
  return isNaN(size) ? 60 : Math.max(40, Math.min(size, 120));
};

const getScriptConfig = (): WidgetConfig => {
  const currentScript = getCurrentScript();
  const orgId = currentScript.getAttribute('data-user-id');
  const token = currentScript.getAttribute('data-token');

  if (!orgId || !token) {
    throw new Error('Now Widget: Missing required configuration (orgId and token). Make sure to include both data-user-id and data-token attributes.');
  }

  return {
    orgId,
    token,
    theme: (currentScript.getAttribute('data-theme') || 'light') as 'light' | 'dark',
    position: (currentScript.getAttribute('data-position') || 'left') as 'right' | 'left',
    buttonColor: currentScript.getAttribute('data-button-color') || '#000000',
    buttonSize: parseButtonSize(currentScript.getAttribute('data-button-size')),
  };
};

const panelStyles = `
  :host {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(600px, 80%);
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
    transition: opacity 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
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
    background: rgb(15, 23, 42);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
    transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
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

const mount = (config: WidgetConfig): WidgetInstance => {
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
        transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform: translateX(min(600px, 80vw));
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
        transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
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

    // Create state for panel
    let isOpen = false;
    
    // Check if we're on homepage - exclude auth and other paths
    const isHomePage = () => {
      const path = window.location.pathname;
      return path === '/' || path === '/index.html';
    };

    let isButtonVisible = isHomePage();
    const SCROLL_THRESHOLD = 800; // Threshold for button visibility

    // Handle scroll visibility using functional approach
    const handleScroll = () => {
      if (isHomePage()) {
        const currentScrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Show button if:
        // 1. User is near the top (within threshold)
        // 2. User is near the bottom of the page
        // 3. Page is shorter than threshold
        const shouldShow = 
          currentScrollY <= SCROLL_THRESHOLD ||
          (documentHeight - (currentScrollY + viewportHeight)) < 100 ||
          documentHeight <= SCROLL_THRESHOLD;
        
        if (shouldShow !== isButtonVisible) {
          isButtonVisible = shouldShow;
          renderButton();
        }
      }
    };

    // Define handlePathChange function before using it
    function handlePathChange() {
      const onHomePage = isHomePage();
      if (!onHomePage) {
        isButtonVisible = false;
        renderButton();
      } else {
        handleScroll(); // Check scroll position if we're on homepage
      }
    }

    // Add scroll and navigation listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('popstate', handlePathChange);

    // Also listen for URL changes that don't trigger popstate
    const observer = new MutationObserver(handlePathChange);
    const targetNode = document.querySelector('head > base') || document.querySelector('head');
if (targetNode) {
  observer.observe(targetNode, { subtree: true, childList: true });
}

    // Handle initial visibility
    handlePathChange();

    // Add click handlers
    const togglePanel = (forceClose = false) => {
      isOpen = forceClose ? false : !isOpen;
      panel.classList.toggle('open', isOpen);
      overlay.classList.toggle('open', isOpen);
      document.documentElement.classList.toggle('now-widget-open', isOpen);
      renderButton();
    };

    closeButton.addEventListener('click', () => togglePanel(true));
    overlay.addEventListener('click', () => togglePanel(true));

    // Render panel content
    render(h(App, { 
      theme: config.theme || 'light',
      orgId: config.orgId,
      token: config.token,
      onToggle: () => togglePanel()
    }), content);

    // Render button
    const renderButton = () => {
      render(
        h(SpinningButton, {
          size: String(config.buttonSize || 48),
          color: config.buttonColor || '#f59e0b',
          position: (config.position || 'right') as WidgetPosition,
          onClick: () => togglePanel(),
          isOpen,
          isVisible: isButtonVisible,
        }),
        buttonWrapper
      );
    };

    renderButton();

    return {
      unmount: () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('popstate', handlePathChange);
        observer.disconnect();
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

// Define custom event types
interface NowWidgetEvents {
  nowWidgetInitialized: CustomEvent<{ success: boolean }>
}

declare global {
  interface WindowEventMap extends NowWidgetEvents {}
}

// Initialize widget state with signals
const widgetState = signal<WidgetStateData>({
  initialized: false,
  instance: null,
  config: null,
  mountAttempts: 0,
  maxAttempts: 3,
  initializationPromise: null
});

// Initialization function with retry logic and promise handling
const initializeWidget = async (): Promise<void> => {
  if (widgetState.value.initializationPromise) {
    return widgetState.value.initializationPromise;
  }

  const initPromise = new Promise<void>((resolve, reject) => {
    function attemptInitialization() {
      if (widgetState.value.mountAttempts >= widgetState.value.maxAttempts) {
        const error = new Error('Now Widget: Failed to initialize after multiple attempts');
        console.error(error);
        reject(error);
        return;
      }

      try {
        if (!widgetState.value.config) {
          widgetState.value = {
            ...widgetState.value,
            config: getScriptConfig()
          };
        }

        if (!widgetState.value.instance && widgetState.value.config) {
          const instance = mount(widgetState.value.config);
          widgetState.value = {
            ...widgetState.value,
            instance,
            initialized: true
          };
          
          // Dispatch initialization event
          window.dispatchEvent(new CustomEvent('nowWidgetInitialized', {
            detail: { success: true }
          }));

          resolve();
        }
      } catch (error) {
        console.error('Now Widget: Initialization attempt failed:', error);
        widgetState.value = {
      ...widgetState.value,
      mountAttempts: widgetState.value.mountAttempts + 1
    };
        
        // Retry initialization after a delay with exponential backoff
        setTimeout(attemptInitialization, 500 * Math.pow(2, widgetState.value.mountAttempts));
      }
    }

    attemptInitialization();
  });

  widgetState.value = {
    ...widgetState.value,
    initializationPromise: initPromise
  };
  return initPromise;
}

// Auto-initialize when the script loads
(function () {
  if (typeof window !== 'undefined') {
    // Ensure DOM is ready before initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initializeWidget().catch(error => {
          console.error('Now Widget: Initialization failed:', error);
        });
      });
    } else {
      initializeWidget().catch(error => {
        console.error('Now Widget: Initialization failed:', error);
      });
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
