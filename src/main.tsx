import { signal } from "@preact/signals";
import { h, render } from "preact";
import App from "./App";
import { NowButton } from "./components/NowButton";
import { apiStore as importedApiStore } from "./config/api";
import "./index.css";
import "./styles/nowWidgetStyles.css";
import "./styles/customWidgetStyles.css";
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
  `%c[ORIGINAL APPROACH] Now Widget - Build timestamp: ${formatBuildTime(
    BUILD_TIMESTAMP
  )} (Montreal time)`,
  "background: #ff5722; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
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
  script.hasAttribute("now-data-org-id") &&
  script.hasAttribute("now-data-token");

const getCurrentScript = (): HTMLScriptElement => {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript && isNowWidgetScript(currentScript)) {
    return currentScript;
  }

  const scripts = Array.from(document.getElementsByTagName("script"));
  const widgetScript = scripts.find(isNowWidgetScript);

  if (!widgetScript) {
    throw new Error(
      "Now Widget: Script element not found. Make sure to include now-data-org-id and now-data-token attributes."
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
  const orgId = currentScript.getAttribute("now-data-org-id");
  const token = currentScript.getAttribute("now-data-token");

  if (!orgId || !token) {
    throw new Error(
      "Now Widget: Missing required configuration (orgId and token). Make sure to include both now-data-org-id and now-data-token attributes."
    );
  }

  return {
    orgId,
    token,
    theme: (currentScript.getAttribute("now-data-theme") || "light") as
      | "light"
      | "dark",
    position: (currentScript.getAttribute("now-data-position") || "left") as
      | "right"
      | "left",
    buttonColor:
      currentScript.getAttribute("now-data-button-color") || "#000000",
    buttonSize: parseButtonSize(
      currentScript.getAttribute("now-data-button-size")
    ),
  };
};

const nowPanelStyles = `
  /* Load the Crimson Text font for journal aesthetics */
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

  :host {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(95%, 480px);
    z-index: 2147483646;
    pointer-events: none;
  }

  @media (max-width: 480px) {
    :host {
      width: calc(100% - 24px);
    }
  }

  @media (min-width: 481px) and (max-width: 767px) {
    :host {
      width: min(95%, 450px);
    }
  }

  @media (min-width: 768px) {
    :host {
      width: min(90%, 520px);
    }
  }

  @media (min-width: 1200px) {
    :host {
      width: min(90%, 580px);
    }
  }

  .nownownow-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(3px);
    opacity: 0;
    transition: opacity 0.3s ease;
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
    background: rgb(255, 255, 255);
    transition: transform 0.3s ease;
    pointer-events: all;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .nownownow-panel[now-data-theme="dark"] {
    background: #111827;
  }

  .nownownow-panel[now-data-position="left"] {
    left: 0;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    transform: translateX(-100%);
  }

  .nownownow-panel[now-data-position="right"] {
    right: 0;
    left: auto;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
  }

  .nownownow-panel[now-data-theme="dark"][now-data-position="left"] {
    border-right-color: rgba(255, 255, 255, 0.1);
  }

  .nownownow-panel[now-data-theme="dark"][now-data-position="right"] {
    border-left-color: rgba(255, 255, 255, 0.1);
  }

  .nownownow-panel.nownownow-open {
    transform: translateX(0);
  }

  .nownownow-close-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .nownownow-close-button:hover {
    background: rgba(0, 0, 0, 0.5);
  }

  .nownownow-panel-content {
    flex: 1;
    overflow-y: auto;
    position: relative;
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

    // Create nowPanel container with shadow DOM
    const nowPanelContainer = document.createElement("div");
    nowPanelContainer.id = "nownownow-widget-panel";
    const nowPanelShadow = nowPanelContainer.attachShadow({ mode: "closed" });

    // Inject shared widget styles
    injectWidgetStyles(nowPanelShadow);

    const nowPanelStyle = document.createElement("style");
    nowPanelStyle.textContent = nowPanelStyles;
    nowPanelShadow.appendChild(nowPanelStyle);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "nownownow-overlay";
    nowPanelShadow.appendChild(overlay);

    // Create nowPanel
    const nowPanel = document.createElement("div");
    nowPanel.className = "nownownow-panel";
    // Set the nowPanel position attribute
    nowPanel.setAttribute("now-data-position", config.position || "right");
    // Set the nowPanel theme attribute
    nowPanel.setAttribute("now-data-theme", config.theme || "light");

    // We're using the close button from LastUpdatesSidePanel component instead of creating one here

    // Create nowPanel content
    const content = document.createElement("div");
    content.className = "nownownow-panel-content";
    content.style.cssText = `
      height: 100%;
      overflow-y: auto;
    `;
    nowPanel.appendChild(content);

    nowPanelShadow.appendChild(nowPanel);

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
        transform: translateX(min(95%, 480px));
        transition: transform 0.3s ease;
        transform-origin: right top;
      }

      @media (max-width: 480px) {
        html.nownownow-widget-open[data-panel-position="left"] #root,
        html.nownownow-widget-open[data-panel-position="left"] [id="root"],
        html.nownownow-widget-open[data-panel-position="left"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(calc(100% - 24px));
        }
      }

      @media (min-width: 481px) and (max-width: 767px) {
        html.nownownow-widget-open[data-panel-position="left"] #root,
        html.nownownow-widget-open[data-panel-position="left"] [id="root"],
        html.nownownow-widget-open[data-panel-position="left"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(min(95%, 450px));
        }
      }

      @media (min-width: 768px) {
        html.nownownow-widget-open[data-panel-position="left"] #root,
        html.nownownow-widget-open[data-panel-position="left"] [id="root"],
        html.nownownow-widget-open[data-panel-position="left"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(min(90%, 520px));
        }
      }

      @media (min-width: 1200px) {
        html.nownownow-widget-open[data-panel-position="left"] #root,
        html.nownownow-widget-open[data-panel-position="left"] [id="root"],
        html.nownownow-widget-open[data-panel-position="left"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(min(90%, 580px));
        }
      }

      html.nownownow-widget-open[data-panel-position="right"] #root,
      html.nownownow-widget-open[data-panel-position="right"] [id="root"],
      html.nownownow-widget-open[data-panel-position="right"] > body > div:not([id^="nownownow-widget"]) {
        transform: translateX(min(-95%, -480px));
        transition: transform 0.3s ease;
        transform-origin: left top;
      }

      @media (max-width: 480px) {
        html.nownownow-widget-open[data-panel-position="right"] #root,
        html.nownownow-widget-open[data-panel-position="right"] [id="root"],
        html.nownownow-widget-open[data-panel-position="right"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(calc(-100% + 24px));
        }
      }

      @media (min-width: 481px) and (max-width: 767px) {
        html.nownownow-widget-open[data-panel-position="right"] #root,
        html.nownownow-widget-open[data-panel-position="right"] [id="root"],
        html.nownownow-widget-open[data-panel-position="right"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(min(-95%, -450px));
        }
      }

      @media (min-width: 768px) {
        html.nownownow-widget-open[data-panel-position="right"] #root,
        html.nownownow-widget-open[data-panel-position="right"] [id="root"],
        html.nownownow-widget-open[data-panel-position="right"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(min(-90%, -520px));
        }
      }

      @media (min-width: 1200px) {
        html.nownownow-widget-open[data-panel-position="right"] #root,
        html.nownownow-widget-open[data-panel-position="right"] [id="root"],
        html.nownownow-widget-open[data-panel-position="right"] > body > div:not([id^="nownownow-widget"]) {
          transform: translateX(min(-90%, -580px));
        }
      }

      html:not(.nownownow-widget-open) #root,
      html:not(.nownownow-widget-open) [id="root"],
      html:not(.nownownow-widget-open) > body > div:not([id^="nownownow-widget"]) {
        transition: transform 0.3s ease;
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
      widgetContainer.appendChild(nowPanelContainer);
      widgetContainer.appendChild(buttonContainer);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }

    // Create state for nowPanel
    let isNowPanelOpen = false;

    // Check if we're on homepage - exclude auth and other paths with a more robust check
    const isLandingPage = () => {
      // Get the current path and remove trailing slash if present
      const path = window.location.pathname.replace(/\/$/, "");
      const hostname = window.location.hostname;
      const url = window.location.href;

      // Only show on domain root - exclude any path segments
      // Check if URL matches domain name with optional protocol and www prefix
      // but no additional path segments beyond the root
      const isExactDomainMatch = !!url.match(
        new RegExp(`^https?://(www\\.)?${hostname.replace(/\./g, "\\.")}/?$`)
      );

      return (
        path === "" ||
        path === "/" ||
        path === "/index.html" ||
        isExactDomainMatch
      );
    };

    let isButtonVisible = isLandingPage();
    const SCROLL_THRESHOLD = 800; // Threshold for button visibility

    // Define toggle nowPanel function early
    const toggleNowPanel = (forceClose = false) => {
      isNowPanelOpen = forceClose ? false : !isNowPanelOpen;
      nowPanel.classList.toggle("nownownow-open", isNowPanelOpen);
      overlay.classList.toggle("nownownow-open", isNowPanelOpen);

      // Set the nowPanel position as a data attribute on the html element
      if (isNowPanelOpen) {
        document.documentElement.setAttribute(
          "data-panel-position",
          config.position || "right"
        );
      } else {
        document.documentElement.removeAttribute("data-panel-position");
      }

      document.documentElement.classList.toggle(
        "nownownow-widget-open",
        isNowPanelOpen
      );
      renderButton();
    };

    // Render button - define this function before any code that uses it
    const renderButton = () => {
      render(
        h(NowButton, {
          size: String(config.buttonSize || 48),
          color: config.buttonColor || "#f59e0b",
          position: (config.position || "right") as WidgetPosition,
          onClick: () => toggleNowPanel(),
          isNowPanelOpen: isNowPanelOpen,
          isVisible: isButtonVisible,
        }),
        buttonWrapper
      );
    };

    // Handle scroll visibility using functional approach
    const handleScroll = () => {
      if (isLandingPage()) {
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
      const onLandingPage = isLandingPage();

      // Log for debugging
      console.debug("Now Widget: Path changed", {
        path: window.location.pathname,
        isLandingPage: onLandingPage,
      });

      if (!onLandingPage) {
        // Not on landing page - hide button immediately
        isButtonVisible = false;
        renderButton();

        // If nowPanel is open, close it when navigating away from landing page
        if (isNowPanelOpen) {
          toggleNowPanel(true);
        }
      } else {
        // On landing page - check scroll position to determine visibility
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

    // Add click handler for overlay
    overlay.addEventListener("click", () => toggleNowPanel(true));

    // Render nowPanel content with preload flag to indicate data should be loaded immediately
    render(
      h(App, {
        theme: config.theme || "light",
        orgId: config.orgId,
        token: config.token,
        onToggle: () => toggleNowPanel(),
        preloadData: true, // Add preload flag to load data immediately
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
