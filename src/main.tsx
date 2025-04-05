// /src/main.ts
import { signal } from "@preact/signals";
import { h, render } from "preact";
import App from "./App";
import { NowButton } from "./components/NowButton";
import { apiStore as importedApiStore } from "./config/api";
import "./index.css"; // Assuming this contains general utility styles if needed
import "./styles/nowWidgetStyles.css"; // Base styles from the JS file injection
import "./styles/customWidgetStyles.css"; // Any custom overrides
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
    // Use a specific locale and options that match the desired format
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Montreal",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Use 24-hour format
    }).format(date);
  } catch (e) {
    // Fallback if timestamp is invalid
    return timestamp;
  }
};

console.log(
  `%c[ORIGINAL APPROACH] Now Widget - Build timestamp: ${formatBuildTime(
    BUILD_TIMESTAMP
  )} (Montreal time)`,
  "background: #ff5722; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
);

// --- API Store Setup (Fallback included) ---
let apiStore: any;
try {
  apiStore = importedApiStore;
} catch (error) {
  console.error("Failed to load API configuration:", error);
  apiStore = {
    baseUrl: "http://localhost:3000", // Default fallback
    config: {
      VERSION: "/api/v1",
      ENDPOINTS: {
        WIDGET: {
          ORG_INFO: "/widget/org-info",
          ORG_POSTS: "/widget/org-posts",
          // Add other endpoints if needed
        },
      },
    },
  };
}
// --- End API Store Setup ---

// --- Custom Event Definitions ---
interface NowWidgetEvents {
  nowWidgetInitialized: CustomEvent<{ success: boolean }>;
  // Add other custom events if needed
}

declare global {
  interface WindowEventMap extends NowWidgetEvents {}
}
// --- End Custom Event Definitions ---

// --- Script Configuration Helpers ---
const isNowWidgetScript = (script: HTMLScriptElement): boolean =>
  script.src.includes("now-widget.js") && // Ensure this matches your built filename
  script.hasAttribute("now-data-org-id") &&
  script.hasAttribute("now-data-token");

const getCurrentScript = (): HTMLScriptElement => {
  // Attempt to get the currently executing script
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript && isNowWidgetScript(currentScript)) {
    return currentScript;
  }

  // Fallback: Find the script tag if document.currentScript is not reliable
  const scripts = Array.from(document.getElementsByTagName("script"));
  const widgetScript = scripts.find(isNowWidgetScript);

  if (!widgetScript) {
    throw new Error(
      "Now Widget: Script element not found. Make sure the script tag includes now-widget.js and has now-data-org-id and now-data-token attributes."
    );
  }

  return widgetScript;
};

const parseButtonSize = (value: string | null): number => {
  const size = parseInt(value || "60", 10); // Default to 60 if not provided
  return isNaN(size) ? 60 : Math.max(40, Math.min(size, 120)); // Clamp between 40 and 120
};

const getScriptConfig = (): WidgetConfig => {
  const currentScript = getCurrentScript();
  const orgId = currentScript.getAttribute("now-data-org-id");
  const token = currentScript.getAttribute("now-data-token");

  if (!orgId || !token) {
    throw new Error(
      "Now Widget: Missing required configuration (orgId and token). Make sure to include both now-data-org-id and now-data-token attributes on the script tag."
    );
  }

  const apiUrl = currentScript.getAttribute("now-data-api-url"); // Optional API URL override

  return {
    orgId,
    token,
    theme: (currentScript.getAttribute("now-data-theme") || "light") as
      | "light"
      | "dark",
    position: (currentScript.getAttribute("now-data-position") || "left") as // Default to left as per example
      | "right"
      | "left",
    buttonColor:
      currentScript.getAttribute("now-data-button-color") || "#000000", // Default color
    buttonSize: parseButtonSize(
      currentScript.getAttribute("now-data-button-size")
    ),
    apiUrl: apiUrl || undefined, // Add apiUrl to the config
  };
};
// --- End Script Configuration Helpers ---

// --- Styles ---
// Styles for the Panel container (including overlay and panel itself)
const nowPanelStyles = `
  /* Font import moved here for better encapsulation within shadow DOM */
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

  :host {
    /* Styles for the component host itself */
    display: block;
    position: fixed;
    top: 0;
    left: 0; /* Changed default to left based on config example */
    bottom: 0;
    width: min(95%, 480px); /* Responsive width */
    z-index: 2147483646; /* High z-index, below button */
    pointer-events: none; /* Allow clicks through initially */
  }

  /* Responsive width adjustments */
  @media (max-width: 480px) { :host { width: calc(100% - 24px); } }
  @media (min-width: 481px) and (max-width: 767px) { :host { width: min(95%, 450px); } }
  @media (min-width: 768px) { :host { width: min(90%, 520px); } }
  @media (min-width: 1200px) { :host { width: min(90%, 580px); } }

  .nownownow-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3); /* Semi-transparent black overlay */
    backdrop-filter: blur(3px); /* Blur effect */
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none; /* Initially not clickable */
    z-index: -1; /* Ensure it's behind the panel */
  }

  .nownownow-overlay.nownownow-open {
    opacity: 1;
    pointer-events: all; /* Clickable when open to close panel */
    z-index: 1; /* Bring overlay above page content but below panel */
  }

  .nownownow-panel {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    background: rgb(255, 255, 255); /* Default light theme background */
    transition: transform 0.3s ease;
    pointer-events: all; /* Panel is always interactive */
    overflow: hidden; /* Prevents content overflow issues */
    display: flex;
    flex-direction: column;
    z-index: 2; /* Panel above overlay */
    box-shadow: 0 0 20px rgba(0,0,0,0.2); /* Add shadow for depth */
  }

  .nownownow-panel[now-data-theme="dark"] {
    background: #111827; /* Dark theme background */
    border-right-color: rgba(255, 255, 255, 0.1); /* Dark theme border */
    border-left-color: rgba(255, 255, 255, 0.1);
  }

  .nownownow-panel[now-data-position="left"] {
    left: 0;
    border-right: 1px solid rgba(0, 0, 0, 0.1); /* Light theme border */
    transform: translateX(-100%); /* Initially hidden off-screen */
  }

  .nownownow-panel[now-data-position="right"] {
    right: 0;
    left: auto; /* Important for right positioning */
    border-left: 1px solid rgba(0, 0, 0, 0.1); /* Light theme border */
    transform: translateX(100%); /* Initially hidden off-screen */
  }

  .nownownow-panel.nownownow-open {
    transform: translateX(0); /* Slide in when open */
  }

  /* Removed .nownownow-close-button styles, handled by LastUpdatesSidePanel */

  .nownownow-panel-content {
    flex: 1; /* Takes up remaining space */
    overflow-y: auto; /* Allows scrolling within the panel content */
    position: relative; /* For potential internal positioning */
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .nownownow-panel, .nownownow-overlay {
      transition-duration: 0s;
    }
  }
`;

// Styles for the Button container (within its shadow DOM)
const buttonContainerStyles = `
  :host {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Container doesn't block clicks */
    z-index: 2147483647; /* Button needs highest z-index */
  }
  /* The actual button positioning is handled by NowButton component */
`;

// Styles injected into the main document HEAD for host page animation
// These are the potentially conflicting styles
const mainDocumentHostAnimationStyles = `
  /* Only apply overflow hidden when the panel is open AND animation is allowed */
  html.nownownow-widget-open[data-nownownow-animation-allowed="true"] {
    overflow: hidden;
  }

  /* Selectors for animating the host page content */
  /* TARGETING LOGIC: Try to target the main app wrapper. Common IDs/structures. */
  /* Only apply when panel is open AND animation is explicitly allowed */
  html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] #root,
  html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] [id="root"], /* Alternative ID selector */
  html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] > body > div:first-child:not([id^="nownownow-widget"]) { /* Fallback for apps without #root */
    transform: translateX(min(95%, 480px)); /* Adjust based on panel width */
    transition: transform 0.3s ease;
    transform-origin: right top; /* Animation origin */
  }

  /* Responsive adjustments for left panel animation */
  @media (max-width: 480px) {
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] #root,
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] [id="root"],
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(calc(100% - 24px));
    }
  }
   @media (min-width: 481px) and (max-width: 767px) {
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] #root,
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] [id="root"],
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(min(95%, 450px));
    }
  }
  @media (min-width: 768px) {
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] #root,
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] [id="root"],
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(min(90%, 520px));
    }
  }
   @media (min-width: 1200px) {
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] #root,
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] [id="root"],
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="left"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(min(90%, 580px));
    }
  }

  /* Animation styles for right panel */
  html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] #root,
  html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] [id="root"],
  html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] > body > div:first-child:not([id^="nownownow-widget"]) {
    transform: translateX(min(-95%, -480px)); /* Negative transform for right */
    transition: transform 0.3s ease;
    transform-origin: left top; /* Animation origin */
  }

   /* Responsive adjustments for right panel animation */
  @media (max-width: 480px) {
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] #root,
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] [id="root"],
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(calc(-100% + 24px));
    }
  }
  @media (min-width: 481px) and (max-width: 767px) {
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] #root,
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] [id="root"],
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(min(-95%, -450px));
    }
  }
  @media (min-width: 768px) {
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] #root,
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] [id="root"],
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(min(-90%, -520px));
    }
  }
  @media (min-width: 1200px) {
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] #root,
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] [id="root"],
     html[data-nownownow-animation-allowed="true"].nownownow-widget-open[data-panel-position="right"] > body > div:first-child:not([id^="nownownow-widget"]) {
      transform: translateX(min(-90%, -580px));
    }
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open #root,
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open [id="root"],
    html[data-nownownow-animation-allowed="true"].nownownow-widget-open > body > div:first-child:not([id^="nownownow-widget"]) {
      transition-duration: 0s !important;
    }
    /* Also disable internal panel transition */
     .nownownow-panel {
       transition-duration: 0s !important;
     }
     .nownownow-overlay {
       transition-duration: 0s !important;
     }
  }
`;
// --- End Styles ---

// --- Widget Mounting Function ---
const mount = (config: WidgetConfig): WidgetInstance => {
  try {
    // --- RENAMED 'k' to 'isLandingPage' ---
    const isLandingPage = () => { // <--- RENAMED HERE
      const path = window.location.pathname.replace(/\/$/, "");
      const hostname = window.location.hostname;
      const url = window.location.href;
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
    
    // Log mount time
    const mountTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Montreal",
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(new Date());
    console.log(`Now Widget - Mounted at: ${mountTime} (Montreal time)`);

    // --- Create DOM Structure ---
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "nownownow-widget-container";
    widgetContainer.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483646;`;

    const nowPanelContainer = document.createElement("div");
    nowPanelContainer.id = "nownownow-widget-panel";
    const nowPanelShadow = nowPanelContainer.attachShadow({ mode: "closed" });
    injectWidgetStyles(nowPanelShadow); // Inject base styles first
    const nowPanelStyle = document.createElement("style");
    nowPanelStyle.textContent = nowPanelStyles;
    nowPanelShadow.appendChild(nowPanelStyle);

    const overlay = document.createElement("div");
    overlay.className = "nownownow-overlay";
    nowPanelShadow.appendChild(overlay);

    const nowPanel = document.createElement("div");
    nowPanel.className = "nownownow-panel";
    nowPanel.setAttribute("now-data-position", config.position || "right");
    nowPanel.setAttribute("now-data-theme", config.theme || "light");

    const content = document.createElement("div");
    content.className = "nownownow-panel-content";
    content.style.cssText = `height: 100%; overflow-y: auto;`;
    nowPanel.appendChild(content);
    nowPanelShadow.appendChild(nowPanel);

    const buttonContainer = document.createElement("div");
    buttonContainer.id = "nownownow-widget-button-container";
    const buttonShadow = buttonContainer.attachShadow({ mode: "closed" });
    injectWidgetStyles(buttonShadow); // Inject base styles
    const buttonStyle = document.createElement("style");
    buttonStyle.textContent = buttonContainerStyles;
    buttonShadow.appendChild(buttonStyle);
    const buttonWrapper = document.createElement("div");
    buttonShadow.appendChild(buttonWrapper);

    const mainStyle = document.createElement("style");
    mainStyle.dataset.nowWidget = "styles";
    mainStyle.textContent = mainDocumentHostAnimationStyles;
    // --- End DOM Structure ---

    // --- Initialization ---
    const init = () => {
      document.head.appendChild(mainStyle);
      document.body.appendChild(widgetContainer);
      widgetContainer.appendChild(nowPanelContainer);
      widgetContainer.appendChild(buttonContainer);
      // Initial check for landing page and set attribute
      const onLandingPage = isLandingPage(); // Use the renamed function
      document.documentElement.setAttribute(
        "data-nownownow-animation-allowed",
        onLandingPage ? "true" : "false"
      );
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
    // --- End Initialization ---

    // --- State and Logic ---
    let isNowPanelOpen = false;

    let isButtonVisible = isLandingPage(); // <--- Use new name
    const SCROLL_THRESHOLD = 800;

    // **REFINED** Panel Toggle Logic
    const toggleNowPanel = (forceClose = false) => {
      const opening = !isNowPanelOpen && !forceClose;
      const closing = isNowPanelOpen && forceClose;

      isNowPanelOpen = forceClose ? false : !isNowPanelOpen;

      // Always toggle internal panel/overlay visibility
      nowPanel.classList.toggle("nownownow-open", isNowPanelOpen);
      overlay.classList.toggle("nownownow-open", isNowPanelOpen);

      // **CRITICAL FIX:** Only modify <html> attributes/classes if on a landing page
      const onLandingPage = isLandingPage(); // <--- Use new name
      document.documentElement.setAttribute(
          "data-nownownow-animation-allowed",
          onLandingPage ? "true" : "false"
      );

      if (onLandingPage) {
        // We are on a landing page, manage host animation styles
        document.documentElement.classList.toggle(
          "nownownow-widget-open",
          isNowPanelOpen
        );
        if (isNowPanelOpen) {
          document.documentElement.setAttribute(
            "data-panel-position",
            config.position || "right"
          );
        } else {
          document.documentElement.removeAttribute("data-panel-position");
        }
      } else {
         // **CRITICAL FIX:** Not on a landing page, ensure host styles are NOT applied
         document.documentElement.classList.remove("nownownow-widget-open");
         document.documentElement.removeAttribute("data-panel-position");
         document.documentElement.setAttribute("data-nownownow-animation-allowed", "false");
      }

      renderButton(); // Update button state
    };

    // Render button function
    const renderButton = () => {
      const getResponsiveSizeVariant = (): 'xs' | 'sm' | 'md' | 'lg' => {
        const width = window.innerWidth;
        if (width < 480) return 'xs';
        if (width < 768) return 'sm';
        if (width < 1200) return 'md';
        return 'lg';
      };
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

    // Handle scroll visibility (only on landing pages)
    const handleScroll = () => {
      if (isLandingPage()) { // <--- Use new name
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
      }
    };

    // --- RENAMED 't' (function) to 'handlePathChangeInternal' ---
    function handlePathChangeInternal() { // <--- RENAMED HERE
      const onLandingPage = isLandingPage(); // <--- Use new name
      console.debug("Now Widget: Path changed", {
        path: window.location.pathname, isLandingPage: onLandingPage
      });

      document.documentElement.setAttribute(
        "data-nownownow-animation-allowed",
        onLandingPage ? "true" : "false"
      );

      if (!onLandingPage) {
        isButtonVisible = false; // Hide button immediately
        if (isNowPanelOpen) {
          toggleNowPanel(true); // Force close panel if open
        }
        document.documentElement.classList.remove("nownownow-widget-open");
        document.documentElement.removeAttribute("data-panel-position");
      } else {
        handleScroll();
      }
       renderButton();
    }

    // Event Listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", renderButton, { passive: true });
    window.addEventListener("popstate", handlePathChangeInternal); // <--- Use new name

    // URL Change Detection (MutationObserver + Polling Fallback)
    let observer: MutationObserver | undefined;
    let pollIntervalId: number | undefined;
    try {
      let lastUrl = window.location.href;
      observer = new MutationObserver(() => {
        requestAnimationFrame(() => {
          const currentUrl = window.location.href;
          if (currentUrl !== lastUrl) {
             console.debug("Now Widget: URL changed via DOM mutation", { from: lastUrl, to: currentUrl });
            lastUrl = currentUrl;
            handlePathChangeInternal(); // <--- Use new name
          }
        });
      });
      const targetNode = document.body;
      if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
      }

      pollIntervalId = window.setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          console.debug("Now Widget: URL changed via polling", { from: lastUrl, to: currentUrl });
          lastUrl = currentUrl;
          handlePathChangeInternal(); // <--- Use new name
        }
      }, 300);
      if (typeof widgetState !== 'undefined' && widgetState.value) {
        widgetState.value = { ...widgetState.value, pollIntervalId };
      }

    } catch (error) {
      console.warn("Now Widget: Failed to setup URL change detection.", error);
    }

    // Initial setup
    handlePathChangeInternal(); // <--- Use new name for initial call
    overlay.addEventListener("click", () => toggleNowPanel(true));

    // Render the main App component into the panel content area
    render(
      h(App, {
        theme: config.theme || "light",
        orgId: config.orgId,
        token: config.token,
        onToggle: () => toggleNowPanel(),
        preloadData: true, // Load data immediately on mount
      }),
      content
    );

    // Initial button render
    renderButton();

    // Return instance with unmount function
    return {
      unmount: () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("popstate", handlePathChangeInternal); // <--- Use new name
        if (pollIntervalId) clearInterval(pollIntervalId);
        if (observer) observer.disconnect();

        render(null, content);
        render(null, buttonWrapper);
        widgetContainer.remove();
        mainStyle.remove();
        document.documentElement.classList.remove("nownownow-widget-open");
        document.documentElement.removeAttribute("data-panel-position");
        document.documentElement.removeAttribute("data-nownownow-animation-allowed");
        console.log("Now Widget - Unmounted");
      },
    };
  // --- RENAMED 't' in catch block to 'mountError' ---
  } catch (mountError) { // <--- RENAMED catch parameter
    console.error("Failed to mount Now Widget:", mountError);
    throw mountError; // Re-throw the specific error
  }
};
// --- End Widget Mounting Function ---

// --- Global Widget State and Initialization ---
const widgetState = signal<WidgetStateData>({
  initialized: false,
  instance: null,
  config: null,
  mountAttempts: 0,
  maxAttempts: 3,
  initializationPromise: null,
  lastPathChecked: "", // Track last checked path
  pollIntervalId: undefined, // Added for cleanup
});

const initializeWidget = async (): Promise<void> => {
  if (widgetState.value.initializationPromise) {
    return widgetState.value.initializationPromise;
  }

  const initPromise = new Promise<void>((resolve, reject) => {
    function attemptInitialization() {
      if (widgetState.value.mountAttempts >= widgetState.value.maxAttempts) {
        const error = new Error("Now Widget: Failed to initialize after multiple attempts");
        console.error(error);
        reject(error);
        return;
      }

      try {
        // Ensure config is loaded before mounting
        if (!widgetState.value.config) {
          const config = getScriptConfig();
          // Update API base URL if provided in config
          if (config.apiUrl) {
            apiStore.baseUrl = config.apiUrl;
            console.log(`Now Widget: API URL overridden to ${config.apiUrl}`);
          }
          widgetState.value = { ...widgetState.value, config };
        }

        // Mount only if config exists and instance doesn't
        if (!widgetState.value.instance && widgetState.value.config) {
          const instance = mount(widgetState.value.config); // mount now uses renamed variables
          widgetState.value = { ...widgetState.value, instance, initialized: true };
          window.dispatchEvent(new CustomEvent("nowWidgetInitialized", { detail: { success: true } }));
          console.log("Now Widget: Initialization successful.");
          resolve();
        } else if (widgetState.value.instance) {
            console.log("Now Widget: Already initialized.");
            resolve(); // Resolve if already initialized
        } else {
             // Should not happen if config logic is correct, but handle just in case
             throw new Error("Now Widget: Configuration missing during mount attempt.");
        }

      } catch (error) {
        console.error(`Now Widget: Initialization attempt ${widgetState.value.mountAttempts + 1} failed:`, error);
        widgetState.value = {
          ...widgetState.value,
          mountAttempts: widgetState.value.mountAttempts + 1,
        };
        const delay = 500 * Math.pow(2, widgetState.value.mountAttempts);
        console.log(`Now Widget: Retrying initialization in ${delay}ms...`);
        setTimeout(attemptInitialization, delay);
      }
    }
    attemptInitialization();
  });

  // Store the promise to prevent multiple initializations
  widgetState.value = { ...widgetState.value, initializationPromise: initPromise };
  return initPromise;
};

// Auto-initialize when the script loads
(function () {
  if (typeof window !== "undefined") {
    const initWithDelay = () => {
      // Delay slightly to ensure host page JS might have run
      setTimeout(() => {
        try {
          console.debug("Now Widget: Starting initialization process...");
          initializeWidget().catch((error) => {
            console.error("Now Widget: Final initialization attempt failed.", error);
          });
        } catch (error) {
          console.error("Now Widget: Critical error during initialization setup:", error);
        }
      }, 500); // 500ms delay
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initWithDelay);
    } else {
      initWithDelay();
    }
  }
})();
// --- End Global Widget State and Initialization ---

// --- Exports ---
export { mount }; // Export mount function for potential manual use

// Expose to window for direct browser usage/legacy compatibility
if (typeof window !== "undefined") {
  (window as any).NowWidget = { mount };
}

export type { WidgetInstance } from "./types"; // Export type if needed elsewhere
// --- End Exports ---