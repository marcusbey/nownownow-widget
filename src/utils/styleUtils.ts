/**
 * Injects widget styles into a shadow root
 * @param shadowRoot - The shadow root to inject styles into
 */
export function injectWidgetStyles(shadowRoot: ShadowRoot): void {
    if (!shadowRoot) return;

    // First add any global styles that were bundled
    if (window.__injectNowWidgetStyles && typeof window.__injectNowWidgetStyles === 'function') {
        try {
            window.__injectNowWidgetStyles(shadowRoot);
            console.log('[StyleUtils] Global widget styles injected into shadow root');
        } catch (error) {
            console.error('[StyleUtils] Error injecting global widget styles:', error);
        }
    }

    // Add base theme variables
    const themeStyles = document.createElement('style');
    themeStyles.textContent = `
        :host {
            /* Ensure HR styling is isolated */
            & hr, & .border-t {
                margin: 0.5rem 0 !important;
                padding: 2px !important;
                border-top-width: 1px !important;
                opacity: 0.9 !important;
            }
            /* Light theme variables */
            --now-bg-color: #ffffff;
            --now-text-color: #333333;
            --now-secondary-text-color: #666666;
            --now-time-text-color: #888888;
            --now-border-color: #eeeeee;
            --now-hover-color: #f5f5f5;
            --now-accent-color: #0066ff;
            --now-tag-color: #0066ff;
            --now-avatar-bg: #f0f0f0;
            
            /* Font settings */
            --now-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --now-font-size-normal: 14px;
            --now-font-size-small: 12px;
            --now-line-height: 1.5;
            
            /* Spacing */
            --now-spacing-xs: 4px;
            --now-spacing-sm: 8px;
            --now-spacing-md: 16px;
            --now-spacing-lg: 24px;
            
            /* Shadows */
            --now-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            
            /* Rounded corners */
            --now-border-radius: 8px;
        }
        
        :host(.dark-theme) {
            /* Dark theme variables */
            --now-bg-color: #1e1e1e;
            --now-text-color: #f0f0f0;
            --now-secondary-text-color: #bbbbbb;
            --now-time-text-color: #999999;
            --now-border-color: #333333;
            --now-hover-color: #2a2a2a;
            --now-accent-color: #3b82f6;
            --now-tag-color: #3b82f6;
            --now-avatar-bg: #333333;
        }
    `;

    shadowRoot.appendChild(themeStyles);
}

// Add TypeScript interface to global Window object
declare global {
    interface Window {
        __NOW_WIDGET_STYLES__?: string;
        __injectNowWidgetStyles?: (shadowRoot: ShadowRoot) => void;
    }
} 