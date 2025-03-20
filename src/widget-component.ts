import { h, render } from 'preact';
import App from './App';
import { NowButton } from './components/NowButton';
import './index.css';
import './styles/nowWidgetStyles.css';
import type { WidgetPosition } from './types/widget';
import { injectWidgetStyles } from './utils/styleUtils';

// Define the Now Panel Web Component
export class NowPanelElement extends HTMLElement {
  private shadow: ShadowRoot;
  private panelContainer: HTMLDivElement;
  private buttonContainer: HTMLDivElement;
  private panel: HTMLDivElement;
  private overlay: HTMLDivElement;
  private isOpen = false;
  private isButtonVisible = true;
  private observer: MutationObserver | null = null;
  private pollIntervalId: number | null = null;

  // Define observed attributes
  static get observedAttributes() {
    return ['org-id', 'token', 'theme', 'position', 'button-color', 'button-size', 'has-updates'];
  }

  constructor() {
    super();
    
    // Create shadow DOM
    this.shadow = this.attachShadow({ mode: 'closed' });
    
    // Create panel container
    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'nownownow-panel-container';
    
    // Create button container
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'nownownow-button-container';
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'nownownow-overlay';
    this.overlay.addEventListener('click', () => this.togglePanel(true));
    
    // Create panel
    this.panel = document.createElement('div');
    this.panel.className = 'nownownow-panel';
    
    // Add elements to shadow DOM
    this.shadow.appendChild(this.panelContainer);
    this.shadow.appendChild(this.buttonContainer);
    this.panelContainer.appendChild(this.overlay);
    this.panelContainer.appendChild(this.panel);
    
    // Add styles
    this.addStyles();
  }

  // When element is added to DOM
  connectedCallback() {
    console.log(
      '%c[WEB COMPONENT] Now Panel custom element connected to DOM',
      'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );
    
    // Initialize panel content
    this.initializePanel();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial visibility check
    this.handlePathChange();
    
    // Render button
    this.renderButton();
    
    // Log DOM structure for debugging
    console.log('Now Panel DOM structure:', {
      'shadow-root': this.shadow,
      'panel-container': this.panelContainer,
      'button-container': this.buttonContainer,
      'attributes': {
        'org-id': this.getAttribute('org-id'),
        'token': this.getAttribute('token') ? '***' : 'missing', // Don't log actual token
        'theme': this.getAttribute('theme'),
        'position': this.getAttribute('position')
      }
    });
  }
  
  // When element is removed from DOM
  disconnectedCallback() {
    // Clean up event listeners
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('popstate', this.handlePathChange);
    
    // Clean up observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clean up interval
    if (this.pollIntervalId) {
      window.clearInterval(this.pollIntervalId);
    }
  }
  
  // When attributes change
  attributeChangedCallback(attributeName: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    
    // Re-render when attributes change
    if (this.isConnected) {
      console.debug(`Now Widget: Attribute '${attributeName}' changed from '${oldValue}' to '${newValue}'`);
      this.renderButton();
      this.renderPanel();
    }
  }
  
  // Add styles to shadow DOM
  private addStyles() {
    // Inject widget styles
    injectWidgetStyles(this.shadow);
    
    // Add component-specific styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483646;
      }
      
      .nownownow-panel-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      
      .nownownow-button-container {
        position: fixed;
        pointer-events: all;
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
        width: min(600px, 80%);
        background: rgb(255, 255, 255);
        transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        pointer-events: all;
      }
      
      .nownownow-panel[now-data-theme="dark"] {
        background: rgb(15, 23, 42);
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
      
      @media (prefers-reduced-motion: reduce) {
        * {
          transition-duration: 0s !important;
        }
      }
    `;
    
    this.shadow.appendChild(styleElement);
  }
  
  // Initialize panel content
  private initializePanel() {
    // Set panel attributes
    this.panel.setAttribute('now-data-position', this.getAttribute('position') || 'right');
    this.panel.setAttribute('now-data-theme', this.getAttribute('theme') || 'light');
    
    // Create panel content
    const content = document.createElement('div');
    content.className = 'nownownow-panel-content';
    this.panel.appendChild(content);
    
    // Render panel content
    this.renderPanel();
  }
  
  // Setup event listeners
  private setupEventListeners() {
    // Bind methods to this
    this.handleScroll = this.handleScroll.bind(this);
    this.handlePathChange = this.handlePathChange.bind(this);
    
    // Add scroll and navigation listeners
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('popstate', this.handlePathChange);
    
    // Setup URL change detection
    this.setupUrlChangeDetection();
  }
  
  // Setup URL change detection
  private setupUrlChangeDetection() {
    try {
      let lastUrl = window.location.href;
      
      // Set up MutationObserver
      this.observer = new MutationObserver(() => {
        requestAnimationFrame(() => {
          const currentUrl = window.location.href;
          if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            this.handlePathChange();
          }
        });
      });
      
      // Observe body
      if (document.body) {
        this.observer.observe(document.body, { childList: true, subtree: true });
      }
      
      // Set up polling as fallback
      this.pollIntervalId = window.setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          this.handlePathChange();
        }
      }, 300);
    } catch (error) {
      console.warn('Failed to setup URL change detection:', error);
    }
  }
  
  // Handle scroll
  private handleScroll() {
    if (this.isHomePage()) {
      const SCROLL_THRESHOLD = 800;
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show button if user is near top or bottom, or page is short
      const shouldShow =
        currentScrollY <= SCROLL_THRESHOLD ||
        documentHeight - (currentScrollY + viewportHeight) < 100 ||
        documentHeight <= SCROLL_THRESHOLD;
      
      if (shouldShow !== this.isButtonVisible) {
        this.isButtonVisible = shouldShow;
        this.renderButton();
      }
    }
  }
  
  // Handle path change
  private handlePathChange() {
    const onHomePage = this.isHomePage();
    
    if (!onHomePage) {
      // Not on homepage - hide button
      this.isButtonVisible = false;
      this.renderButton();
      
      // Close panel if open
      if (this.isOpen) {
        this.togglePanel(true);
      }
    } else {
      // On homepage - check scroll position
      this.handleScroll();
    }
  }
  
  // Check if current page is homepage
  private isHomePage() {
    const path = window.location.pathname.replace(/\/$/, '');
    return path === '' || path === '/' || path === '/index.html';
  }
  
  // Toggle panel
  private togglePanel(forceClose = false) {
    this.isOpen = forceClose ? false : !this.isOpen;
    this.panel.classList.toggle('nownownow-open', this.isOpen);
    this.overlay.classList.toggle('nownownow-open', this.isOpen);
    
    // Update document class for host page styling
    if (this.isOpen) {
      document.documentElement.classList.add('nownownow-widget-open');
      document.documentElement.setAttribute(
        'data-panel-position',
        this.getAttribute('position') || 'right'
      );
    } else {
      document.documentElement.classList.remove('nownownow-widget-open');
      document.documentElement.removeAttribute('data-panel-position');
    }
    
    // Re-render button
    this.renderButton();
  }
  
  // Render button
  private renderButton() {
    // Check if there are new updates to show in the button
    const hasUpdates = this.getAttribute('has-updates') === 'true';
    
    // Get button color from attribute or dataset
    let buttonColor = this.getAttribute('button-color');
    if (!buttonColor && this.dataset.buttonColor) {
      buttonColor = this.dataset.buttonColor;
    }
    
    render(
      h(NowButton, {
        size: this.getAttribute('button-size') || '60',
        color: buttonColor || '#f59e0b', // Default to orange if no color specified
        position: (this.getAttribute('position') || 'right') as WidgetPosition,
        onClick: () => this.togglePanel(),
        isOpen: this.isOpen,
        isVisible: this.isButtonVisible,
        updated: hasUpdates,
      }),
      this.buttonContainer
    );
  }
  
  // Render panel
  private renderPanel() {
    const content = this.shadow.querySelector('.nownownow-panel-content');
    if (!content) return;
    
    const orgId = this.getAttribute('org-id');
    const token = this.getAttribute('token');
    
    if (!orgId || !token) {
      console.error('Now Widget: Missing required attributes (org-id and token)');
      return;
    }
    
    render(
      h(App, {
        theme: (this.getAttribute('theme') || 'light') as 'light' | 'dark',
        orgId,
        token,
        onToggle: () => this.togglePanel(),
      }),
      content
    );
  }
}

// Define the custom element
if (!customElements.get('now-panel')) {
  customElements.define('now-panel', NowPanelElement);
}
