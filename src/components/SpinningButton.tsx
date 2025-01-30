import { h } from 'preact';

interface SpinningButtonProps {
  size?: number;
  color?: string;
  position?: 'left' | 'right';
  onClick?: () => void;
}

export function SpinningButton({ 
  size = 60, 
  color = "#000",
  position = 'left',
  onClick 
}: SpinningButtonProps) {
  const styles = `
    :host {
      display: block;
      position: absolute;
      bottom: 2rem;
      ${position}: 2rem;
      z-index: 50;
    }

    .button {
      position: relative;
      width: var(--button-size);
      height: var(--button-size);
      border-radius: 9999px;
      background: rgb(251, 191, 36); /* amber-400 */
      border: 2px solid rgba(251, 191, 36, 0.2); /* amber-400/20 */
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      pointer-events: all;
      transform: translateZ(0);
      transition: all 0.2s ease;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .button:hover {
      background: rgb(245, 158, 11); /* amber-500 */
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    }

    .button:active {
      transform: translateY(1px);
    }

    .button svg {
      width: 2rem;
      height: 2rem;
      color: rgb(15, 23, 42); /* slate-900 */
      transition: transform 0.3s ease;
    }

    .button.open svg {
      transform: rotate(180deg);
    }

    @media (prefers-reduced-motion: reduce) {
      .button, .button svg {
        transition-duration: 0s;
      }
    }
  `;

  return (
    <div 
      ref={el => {
        if (el && !el.shadowRoot) {
          const shadow = el.attachShadow({ mode: 'closed' });
          const style = document.createElement('style');
          style.textContent = styles;
          shadow.appendChild(style);

          const button = document.createElement('button');
          button.className = 'button';
          button.setAttribute('aria-label', 'Toggle panel');
          button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="${position === 'left' ? 
                'M9 5l7 7-7 7' : 
                'M15 19l-7-7 7-7'}" />
            </svg>
          `;

          button.onclick = () => {
            button.classList.toggle('open');
            onClick?.();
          };

          shadow.appendChild(button);
        }
      }}
    />
  );
}
