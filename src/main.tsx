import { signal } from "@preact/signals";
import { h, render } from "preact";
import App from "./App";
import { SpinningButton } from "./components/SpinningButton";
import { apiStore as importedApiStore } from "./config/api";
import "./index.css";
import "./styles/nowWidgetStyles.css";
import type {
  WidgetConfig,
  WidgetInstance,
  WidgetPosition,
  WidgetStateData,
} from "./types/widget";
import { injectWidgetStyles } from "./utils/styleUtils";

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
  `Now Widget - Build timestamp: ${formatBuildTime(
    BUILD_TIMESTAMP
  )} (Montreal time)`
);

// Use a safe reference to the API store with fallback
let apiStore: any;
try {
  // Use the imported apiStore
  apiStore = importedApiStore;
} catch (error) {
  console.error("Failed to load API configuration:", error);
  // Provide a fallback configuration
  apiStore = {
    baseUrl: "http://localhost:3000",
    config: {
      VERSION: "/api/v1",
      ENDPOINTS: {
        WIDGET: {
          ORG_INFO: "/widget/org-info",
          ORG_POSTS: "/widget/org-posts",
        },
      },
    },
  };
}

// Define custom event types
interface NowWidgetEvents {
  nowWidgetInitialized: CustomEvent<{ success: boolean }>;
}

declare global {
  interface WindowEventMap extends NowWidgetEvents {}
}

const isNowWidgetScript = (script: HTMLScriptElement): boolean =>
  script.src.includes("now-widget.js") &&
  script.hasAttribute("data-org-id") &&
  script.hasAttribute("data-token");

const getCurrentScript = (): HTMLScriptElement => {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript && isNowWidgetScript(currentScript)) {
    return currentScript;
  }

  const scripts = Array.from(document.getElementsByTagName("script"));
  const widgetScript = scripts.find(isNowWidgetScript);

  if (!widgetScript) {
    throw new Error(
      "Now Widget: Script element not found. Make sure to include data-org-id and data-token attributes."
    );
  }

  return widgetScript;
};

const parseButtonSize = (value: string | null): number => {
  const size = parseInt(value || "60", 10);
  return isNaN(size) ? 60 : Math.max(40, Math.min(size, 120));
};

const getScriptConfig = (): WidgetConfig => {
  const currentScript = getCurrentScript();
  const orgId = currentScript.getAttribute("data-org-id");
  const token = currentScript.getAttribute("data-token");

  if (!orgId || !token) {
    throw new Error(
      "Now Widget: Missing required configuration (orgId and token). Make sure to include both data-org-id and data-token attributes."
    );
  }

  return {
    orgId,
    token,
    theme: (currentScript.getAttribute("data-theme") || "light") as
      | "light"
      | "dark",
    position: (currentScript.getAttribute("data-position") || "left") as
      | "right"
      | "left",
    buttonColor: currentScript.getAttribute("data-button-color") || "#000000",
    buttonSize: parseButtonSize(currentScript.getAttribute("data-button-size")),
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

  .nownownow-overlay {
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

  .nownownow-overlay.nownownow-open {
    opacity: 1;
    pointer-events: all;
  }

  .nownownow-panel {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    background: rgb(15, 23, 42);
    transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
    pointer-events: all;
  }

  .nownownow-panel[data-position="left"] {
    left: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
  }

  .nownownow-panel[data-position="right"] {
    right: 0;
    left: auto;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(100%);
  }

  .nownownow-panel.nownownow-open {
    transform: translateX(0);
  }

  .nownownow-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nownownow-panel-title {
    color: rgb(226, 232, 240); /* slate-200 */
    font-weight: 600;
    font-size: 0.875rem;
  }

  .nownownow-close-button {
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: rgb(148, 163, 184); /* slate-400 */
    cursor: pointer;
    border-radius: 0.375rem;
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .nownownow-close-button:hover {
    color: rgb(226, 232, 240); /* slate-200 */
    background: rgba(255, 255, 255, 0.1);
  }

  .nownownow-close-button svg {
    width: 1rem;
    height: 1rem;
  }

  .nownownow-panel-content {
    padding: 1rem;
    color: rgb(226, 232, 240);
    overflow-y: auto;
    height: calc(100% - 3.5rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .nownownow-panel, .nownownow-overlay {
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
    // Log when widget is mounted in Montreal timezone
    const mountTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Montreal",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

    console.log(`Now Widget - Mounted at: ${mountTime} (Montreal time)`);

    // Create a container for our widget elements
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "nownownow-widget-container";
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
    const panelContainer = document.createElement("div");
    panelContainer.id = "nownownow-widget-panel";
    const panelShadow = panelContainer.attachShadow({ mode: "closed" });

    // Inject shared widget styles
    injectWidgetStyles(panelShadow);

    const panelStyle = document.createElement("style");
    panelStyle.textContent = panelStyles;
    panelShadow.appendChild(panelStyle);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "nownownow-overlay";
    panelShadow.appendChild(overlay);

    // Create panel
    const panel = document.createElement("div");
    panel.className = "nownownow-panel";
    // Set the panel position attribute
    panel.setAttribute("data-position", config.position || "right");

    // Create panel header
    const header = document.createElement("div");
    header.className = "nownownow-panel-header";

    const title = document.createElement("div");
    title.className = "nownownow-panel-title";
    title.textContent = "Now";
    header.appendChild(title);

    const closeButton = document.createElement("button");
    closeButton.className = "nownownow-close-button";
    closeButton.setAttribute("aria-label", "Close Now Panel");
    closeButton.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    header.appendChild(closeButton);

    panel.appendChild(header);

    // Create panel content
    const content = document.createElement("div");
    content.className = "nownownow-panel-content";
    panel.appendChild(content);

    panelShadow.appendChild(panel);

    // Create button container with shadow DOM
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "nownownow-widget-button-container";
    const buttonShadow = buttonContainer.attachShadow({ mode: "closed" });

    // Inject shared widget styles
    injectWidgetStyles(buttonShadow);

    const buttonStyle = document.createElement("style");
    buttonStyle.textContent = containerStyles;
    buttonShadow.appendChild(buttonStyle);

    const buttonWrapper = document.createElement("div");
    buttonShadow.appendChild(buttonWrapper);

    // Create style tag for the main document
    const mainStyle = document.createElement("style");
    mainStyle.dataset.nowWidget = "styles";
    mainStyle.textContent = `
      html.nownownow-widget-open {
        overflow: hidden;
      }

      html.nownownow-widget-open[data-panel-position="left"] #root,
      html.nownownow-widget-open[data-panel-position="left"] [id="root"],
      html.nownownow-widget-open[data-panel-position="left"] > body > div:not([id^="nownownow-widget"]) {
        transform: translateX(300px);
        transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform-origin: right top;
      }

      html.nownownow-widget-open[data-panel-position="right"] #root,
      html.nownownow-widget-open[data-panel-position="right"] [id="root"],
      html.nownownow-widget-open[data-panel-position="right"] > body > div:not([id^="nownownow-widget"]) {
        transform: translateX(-300px);
        transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform-origin: left top;
      }

      html:not(.nownownow-widget-open) #root,
      html:not(.nownownow-widget-open) [id="root"],
      html:not(.nownownow-widget-open) > body > div:not([id^="nownownow-widget"]) {
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

    // Wait for document ready
    const init = () => {
      document.head.appendChild(mainStyle);
      document.body.appendChild(widgetContainer);
      widgetContainer.appendChild(panelContainer);
      widgetContainer.appendChild(buttonContainer);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }

    // Create state for panel
    let isOpen = false;

    // Check if we're on homepage - exclude auth and other paths
    const isHomePage = () => {
      // Get the current path and remove trailing slash if present
      const path = window.location.pathname.replace(/\/$/, "");

      // Only consider exact root path or index.html as homepage
      // This ensures paths like /organization, /profile, etc. don't show the button
      return path === "" || path === "/" || path === "/index.html";
    };

    let isButtonVisible = isHomePage();
    const SCROLL_THRESHOLD = 800; // Threshold for button visibility

    // Define toggle panel function early
    const togglePanel = (forceClose = false) => {
      isOpen = forceClose ? false : !isOpen;
      panel.classList.toggle("nownownow-open", isOpen);
      overlay.classList.toggle("nownownow-open", isOpen);

      // Set the panel position as a data attribute on the html element
      if (isOpen) {
        document.documentElement.setAttribute(
          "data-panel-position",
          config.position || "right"
        );
      } else {
        document.documentElement.removeAttribute("data-panel-position");
      }

      document.documentElement.classList.toggle(
        "nownownow-widget-open",
        isOpen
      );
      renderButton();
    };

    // Render button - define this function before any code that uses it
    const renderButton = () => {
      render(
        h(SpinningButton, {
          size: String(config.buttonSize || 48),
          color: config.buttonColor || "#f59e0b",
          position: (config.position || "right") as WidgetPosition,
          onClick: () => togglePanel(),
          isOpen,
          isVisible: isButtonVisible,
        }),
        buttonWrapper
      );
    };

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
          documentHeight - (currentScrollY + viewportHeight) < 100 ||
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

      // Log for debugging
      console.debug("Now Widget: Path changed", {
        path: window.location.pathname,
        isHomePage: onHomePage,
      });

      if (!onHomePage) {
        // Not on homepage - hide button immediately
        isButtonVisible = false;
        renderButton();

        // If panel is open, close it when navigating away from homepage
        if (isOpen) {
          togglePanel(true);
        }
      } else {
        // On homepage - check scroll position to determine visibility
        handleScroll();
      }
    }

    // Add scroll and navigation listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("popstate", handlePathChange);

    // Use a safer approach for URL change detection that doesn't interfere with host website
    let observer: MutationObserver | undefined;
    try {
      // Watch for URL changes using a polling mechanism instead of history API interception
      // This avoids conflicts with the host website's JavaScript
      let lastUrl = window.location.href;

      // Set up MutationObserver to watch for DOM changes that might indicate navigation
      observer = new MutationObserver(() => {
        // Don't directly call handlePathChange from MutationObserver callback
        // Instead, just check if URL has changed and schedule the check with RAF
        requestAnimationFrame(() => {
          // Only trigger if URL has actually changed
          const currentUrl = window.location.href;
          if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.debug("Now Widget: URL changed via DOM mutation", {
              from: lastUrl,
              to: currentUrl,
            });
            handlePathChange();
          }
        });
      });

      // Observe the body instead of head to catch content changes
      const targetNode = document.body;
      if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
      }

      // Set up polling for URL changes as a fallback (less intensive than history API interception)
      const pollInterval = setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          console.debug("Now Widget: URL changed via polling", {
            from: lastUrl,
            to: currentUrl,
          });
          handlePathChange();
        }
      }, 300); // Check every 300ms - less frequent to reduce performance impact

      // Store interval ID for cleanup
      widgetState.value = {
        ...widgetState.value,
        pollIntervalId: pollInterval,
      };
    } catch (error) {
      console.warn("Failed to setup URL change detection:", error);
      // Continue without the observer as it's not critical for core functionality
    }

    // Handle initial visibility
    handlePathChange();

    // Add click handlers
    closeButton.addEventListener("click", () => togglePanel(true));
    overlay.addEventListener("click", () => togglePanel(true));

    // Render panel content
    render(
      h(App, {
        theme: config.theme || "light",
        orgId: config.orgId,
        token: config.token,
        onToggle: () => togglePanel(),
      }),
      content
    );

    // Initial button render
    renderButton();

    return {
      unmount: () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("popstate", handlePathChange);

        // Clear polling interval if it exists
        if (widgetState.value.pollIntervalId) {
          clearInterval(widgetState.value.pollIntervalId);
        }

        if (observer) {
          try {
            observer.disconnect();
          } catch (error) {
            console.warn("Failed to disconnect observer:", error);
          }
        }

        render(null, content);
        render(null, buttonWrapper);
        widgetContainer.remove();
        mainStyle.remove();
        document.documentElement.classList.remove("nownownow-widget-open");
      },
    };
  } catch (error) {
    console.error("Failed to mount Now Widget:", error);
    throw error;
  }
};

// Define custom event types
interface NowWidgetEvents {
  nowWidgetInitialized: CustomEvent<{ success: boolean }>;
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
  initializationPromise: null,
  lastPathChecked: "",
});

// Initialization function with retry logic and promise handling
const initializeWidget = async (): Promise<void> => {
  if (widgetState.value.initializationPromise) {
    return widgetState.value.initializationPromise;
  }

  const initPromise = new Promise<void>((resolve, reject) => {
    function attemptInitialization() {
      if (widgetState.value.mountAttempts >= widgetState.value.maxAttempts) {
        const error = new Error(
          "Now Widget: Failed to initialize after multiple attempts"
        );
        console.error(error);
        reject(error);
        return;
      }

      try {
        if (!widgetState.value.config) {
          const config = getScriptConfig();
          // Update API configuration before initializing widget
          if (config.apiUrl) {
            apiStore.baseUrl = config.apiUrl;
          }
          widgetState.value = {
            ...widgetState.value,
            config,
          };
        }

        if (!widgetState.value.instance && widgetState.value.config) {
          const instance = mount(widgetState.value.config);
          widgetState.value = {
            ...widgetState.value,
            instance,
            initialized: true,
          };

          // Dispatch initialization event
          window.dispatchEvent(
            new CustomEvent("nowWidgetInitialized", {
              detail: { success: true },
            })
          );

          resolve();
        }
      } catch (error) {
        console.error("Now Widget: Initialization attempt failed:", error);
        widgetState.value = {
          ...widgetState.value,
          mountAttempts: widgetState.value.mountAttempts + 1,
        };

        // Retry initialization after a delay with exponential backoff
        setTimeout(
          attemptInitialization,
          500 * Math.pow(2, widgetState.value.mountAttempts)
        );
      }
    }

    attemptInitialization();
  });

  widgetState.value = {
    ...widgetState.value,
    initializationPromise: initPromise,
  };
  return initPromise;
};

// Auto-initialize when the script loads, with delayed execution to avoid conflicts
(function () {
  if (typeof window !== "undefined") {
    // Delay widget initialization to ensure host website is fully loaded
    const initWithDelay = () => {
      // Use a longer delay to ensure host website's JavaScript is fully initialized
      setTimeout(() => {
        try {
          console.debug("Now Widget: Starting initialization...");
          initializeWidget().catch((error) => {
            console.error("Now Widget: Initialization failed:", error);
          });

          // Extra safety check after initialization
          // No need to create custom events - just update state directly
          setTimeout(() => {
            console.debug("Now Widget: Performing final visibility check");
            if (widgetState.value.instance) {
              try {
                // Simple path check without accessing potentially problematic global variables
                const currentPath = window.location.pathname;
                console.debug("Now Widget: Current path is", currentPath);

                // Update widget state if needed
                if (widgetState.value.lastPathChecked !== currentPath) {
                  console.debug(
                    "Now Widget: Path changed since initialization"
                  );
                  widgetState.value = {
                    ...widgetState.value,
                    lastPathChecked: currentPath,
                  };

                  // Trigger a path change if the instance exists
                  if (
                    widgetState.value.instance &&
                    typeof widgetState.value.instance === "object"
                  ) {
                    // Call handlePathChange safely through instance if possible
                    console.debug("Now Widget: Triggering visibility update");
                  }
                }
              } catch (error) {
                console.warn(
                  "Now Widget: Error in final visibility check:",
                  error
                );
              }
            }
          }, 1500);
        } catch (error) {
          console.error("Now Widget: Critical initialization error:", error);
        }
      }, 500); // Longer delay to ensure host site is fully initialized
    };

    // Ensure DOM is ready before initialization
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initWithDelay);
    } else {
      initWithDelay();
    }
  }
})();

// Export for UMD
export { mount };

// Expose to window for direct browser usage
if (typeof window !== "undefined") {
  (window as any).NowWidget = { mount };
}

export type { WidgetInstance } from "./types";
