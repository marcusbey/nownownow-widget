// Import the Web Component class and ensure it's registered
import './widget-component';

// Log build timestamp for tracking purposes
const BUILD_TIMESTAMP = "__BUILD_TIMESTAMP__"; // This will be replaced during build

const formatBuildTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Montreal",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch (e) {
    return timestamp;
  }
};

console.log(
  `%c[WEB COMPONENT APPROACH] Now Widget - Build timestamp: ${formatBuildTime(
    BUILD_TIMESTAMP
  )} (Montreal time)`,
  'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
);

// Initialize the widget when the script loads
(function() {
  if (typeof window === 'undefined') return;
  
  // Wait for DOM to be ready
  const initWidget = () => {
    try {
      // Get current script
      const scripts = Array.from(document.getElementsByTagName('script'));
      const widgetScript = scripts.find(script => 
        script.src.includes('now-widget.js') && 
        script.hasAttribute('now-data-org-id') && 
        script.hasAttribute('now-data-token')
      );
      
      if (!widgetScript) {
        console.error('Now Widget: Script element not found. Make sure to include now-data-org-id and now-data-token attributes.');
        return;
      }
      
      // Create global styles for host page
      const globalStyle = document.createElement('style');
      globalStyle.textContent = `
        html.nownownow-widget-open {
          overflow: hidden;
        }
        
        html.nownownow-widget-open[data-panel-position="left"] #root,
        html.nownownow-widget-open[data-panel-position="left"] [id="root"],
        html.nownownow-widget-open[data-panel-position="left"] > body > div:not(now-panel) {
          transform: translateX(300px);
          transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          transform-origin: right top;
        }
        
        html.nownownow-widget-open[data-panel-position="right"] #root,
        html.nownownow-widget-open[data-panel-position="right"] [id="root"],
        html.nownownow-widget-open[data-panel-position="right"] > body > div:not(now-panel) {
          transform: translateX(-300px);
          transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          transform-origin: left top;
        }
        
        html:not(.nownownow-widget-open) #root,
        html:not(.nownownow-widget-open) [id="root"],
        html:not(.nownownow-widget-open) > body > div:not(now-panel) {
          transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          transform: translateX(0);
          transform-origin: center top;
          will-change: transform;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            transition-duration: 0s !important;
          }
        }
      `;
      document.head.appendChild(globalStyle);
      
      // Create the web component
      const nowPanel = document.createElement('now-panel');
      
      // Transfer attributes from script to component
      ['now-data-org-id', 'now-data-token', 'now-data-theme', 'now-data-position', 'now-data-button-color', 'now-data-button-size'].forEach(attr => {
        const value = widgetScript.getAttribute(attr);
        if (value) {
          // Convert data-attribute-name to attribute-name
          const componentAttr = attr.replace('data-', '');
          nowPanel.setAttribute(componentAttr, value);
        }
      });
      
      // Add the component to the page
      document.body.appendChild(nowPanel);
      
      // Dispatch initialization event
      window.dispatchEvent(new CustomEvent('nowWidgetInitialized', { 
        detail: { success: true } 
      }));
      
      console.log(
        '%c[WEB COMPONENT] Now Widget successfully initialized',
        'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      );
      
      // Log DOM structure for debugging
      console.log('Now Widget DOM structure:', {
        'component': nowPanel,
        'attributes': {
          'org-id': nowPanel.getAttribute('org-id'),
          'token': nowPanel.getAttribute('token') ? '***' : 'missing', // Don't log actual token
          'theme': nowPanel.getAttribute('theme'),
          'position': nowPanel.getAttribute('position')
        }
      });
    } catch (error) {
      console.error('Now Widget: Failed to initialize', error);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('nowWidgetInitialized', { 
        detail: { success: false } 
      }));
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    // Add a small delay to ensure the host page is fully loaded
    setTimeout(initWidget, 100);
  }
})();
