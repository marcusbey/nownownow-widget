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
  SizeVariant
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
    const isLandingPage = () => {
      const path = window.location.pathname.replace(/\/$/, "");
      // More robust check: only true root path or index.html
      return path === "" || path === "/index.html";
      // If you need the less strict check, uncomment below:
      // const hostname = window.location.hostname;
      // const url = window.location.href;
      // const isExactDomainMatch = !!url.match(
      //   new RegExp(`^https?://(www\\.)?${hostname.replace(/\./g, "\\.")}/?(\\?.*)?$`)
      // );
      // return path === "" || path === "/" || path === "/index.html" || isExactDomainMatch;
    };

    let isNowPanelOpen = false;
    let isButtonVisible = isLandingPage();
    const SCROLL_THRESHOLD = 800;

    let toggleNowPanel: (forceClose?: boolean) => void;
    let renderButton: () => void;
    let handleScroll: () => void;
    let handlePathChange: () => void;

    renderButton = () => {
      const getResponsiveSizeVariant = (): SizeVariant => {
        const width = window.innerWidth;
        if (width < 480) return 'xs';
        if (width < 768) return 'sm';
        if (width < 1200) return 'md';
        return 'lg';
      };

      // Ensure buttonWrapper is defined before rendering into it
      if (!buttonWrapper) {
          console.warn("Now Widget: Button wrapper not ready for rendering.");
          return;
      }
      render(
        h(NowButton, {
          size: String(config.buttonSize || 48),
          color: config.buttonColor || "#f59e0b",
          position: (config.position || "right") as WidgetPosition,
          onClick: () => toggleNowPanel(),
          isNowPanelOpen: isNowPanelOpen,
          isVisible: isButtonVisible,
          sizeVariant: getResponsiveSizeVariant(),
        }),
        buttonWrapper
      );
    };

    toggleNowPanel = (forceClose = false) => {
      const nextState = forceClose ? false : !isNowPanelOpen;
      if (nextState === isNowPanelOpen) return;

      if (nextState === true && !isLandingPage()) {
        console.debug("Now Widget: Preventing panel open on non-landing page.");
        return;
      }

      isNowPanelOpen = nextState;
      nowPanel.classList.toggle("nownownow-open", isNowPanelOpen);
      overlay.classList.toggle("nownownow-open", isNowPanelOpen);
      
      // Update document classes for widget open state
      document.documentElement.classList.toggle("nownownow-widget-open", isNowPanelOpen);

      renderButton();
    };

    handleScroll = () => {
      if (isLandingPage()) {
        const currentScrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const shouldShow =
          currentScrollY <= SCROLL_THRESHOLD ||
          documentHeight - (currentScrollY + viewportHeight) < 100 ||
          documentHeight <= SCROLL_THRESHOLD;

        if (shouldShow !== isButtonVisible) {
          isButtonVisible = shouldShow;
          renderButton();
        }
      } else {
        if (isButtonVisible) {
          isButtonVisible = false;
          renderButton();
        }
      }
    };

    handlePathChange = () => {
      const onLandingPage = isLandingPage();
      console.debug("Now Widget: Path change detected", { path: window.location.pathname, onLandingPage });

      if (onLandingPage) {
        handleScroll();
      } else {
        if (isButtonVisible) {
          isButtonVisible = false;
          renderButton();
        }
        if (isNowPanelOpen) {
          toggleNowPanel(true);
        }
      }
    };

    const mountTime = new Date().toLocaleString('en-US', { timeZone: 'America/Montreal' });
    console.log(`Now Widget - Mounted at: ${mountTime} (Montreal time)`);

    const widgetContainer = document.createElement("div");
    widgetContainer.id = "nownownow-widget-container";
    widgetContainer.style.cssText = `position: fixed; z-index: 9999; pointer-events: none;`;

    const nowPanelContainer = document.createElement("div");
    nowPanelContainer.id = "nownownow-widget-panel";
    const nowPanelShadow = nowPanelContainer.attachShadow({ mode: "closed" });

    const buttonContainer = document.createElement("div");
    buttonContainer.id = "nownownow-widget-button-container";
    const buttonShadow = buttonContainer.attachShadow({ mode: "closed" });

    injectWidgetStyles(nowPanelShadow);
    injectWidgetStyles(buttonShadow);

    const nowPanelStyle = document.createElement("style");
    nowPanelStyle.textContent = nowPanelStyles;
    nowPanelShadow.appendChild(nowPanelStyle);

    const buttonStyle = document.createElement("style");
    buttonStyle.textContent = containerStyles;
    buttonShadow.appendChild(buttonStyle);

    const overlay = document.createElement("div");
    overlay.className = "nownownow-overlay";
    nowPanelShadow.appendChild(overlay);

    const nowPanel = document.createElement("div");
    nowPanel.className = "nownownow-panel";
    nowPanel.setAttribute("now-data-position", config.position || "right");
    nowPanel.setAttribute("now-data-theme", config.theme || "light");
    nowPanelShadow.appendChild(nowPanel);

    const content = document.createElement("div");
    content.className = "nownownow-panel-content";
    content.style.cssText = `height: 100%; overflow: auto; -webkit-overflow-scrolling: touch;`;
    nowPanel.appendChild(content);

    const buttonWrapper = document.createElement("div");
    buttonShadow.appendChild(buttonWrapper);

    const init = () => {
      document.body.appendChild(widgetContainer);
      widgetContainer.appendChild(nowPanelContainer);
      widgetContainer.appendChild(buttonContainer);
      handlePathChange();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", renderButton, { passive: true });
    window.addEventListener("popstate", handlePathChange);

    let observer: MutationObserver | undefined;
    try {
      let lastUrl = window.location.href;
      const targetNode = document.body;
      if (targetNode) {
        observer = new MutationObserver(() => {
          requestAnimationFrame(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
              lastUrl = currentUrl;
              console.debug("Now Widget: URL changed via DOM mutation");
              handlePathChange();
            }
          });
        });
        observer.observe(targetNode, { childList: true, subtree: true });
      }
      const pollInterval = setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          console.debug("Now Widget: URL changed via polling");
          handlePathChange();
        }
      }, 300);
      // Store interval ID for cleanup in the existing widgetState
      widgetState.value = {
        ...widgetState.value,
        pollIntervalId: pollInterval,
      };
    } catch (error) {
      console.warn("Failed to setup URL change detection:", error);
    }

    handlePathChange();

    overlay.addEventListener("click", () => toggleNowPanel(true));

    render(
      h(App, {
        theme: config.theme || "light",
        orgId: config.orgId,
        token: config.token,
        onToggle: () => toggleNowPanel(),
        preloadData: true,
      }),
      content
    );

    renderButton();

    return {
      unmount: () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("popstate", handlePathChange);
        window.removeEventListener("resize", renderButton);

        if (widgetState.value.pollIntervalId) {
          clearInterval(widgetState.value.pollIntervalId);
        }
        if (observer) observer.disconnect();

        render(null, content);
        render(null, buttonWrapper);
        widgetContainer.remove();
        document.documentElement.classList.remove("nownownow-widget-open");
        document.documentElement.removeAttribute("data-nownownow-animation-allowed");
        document.documentElement.removeAttribute("data-panel-position");
      },
    };
  } catch (error) {
    console.error("Failed to mount Now Widget:", error);
    throw error;
  }
};

declare global {
  interface WindowEventMap extends NowWidgetEvents {}
}

// Initialize widget state with signals
// Cast to any to avoid TypeScript errors with optional properties
const widgetState = signal<WidgetStateData>({
  initialized: false,
  instance: null,
  config: null,
  mountAttempts: 0,
  maxAttempts: 3,
  initializationPromise: null,
  lastPathChecked: "",
} as WidgetStateData);

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
          
          // Create a more robust initialization sequence with proper error handling
          const safeInitialize = async () => {
            try {
              await initializeWidget();
              console.debug("Now Widget: Initialization completed successfully");
              
              // Extra safety check after initialization
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
              console.error("Now Widget: Initialization failed:", error);
            }
          };
          
          // Start the safe initialization process
          safeInitialize();
        } catch (error) {
          console.error("Now Widget: Critical initialization error:", error);
        }
      }, 1000); // Longer delay to ensure host site is fully initialized
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
