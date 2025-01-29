import { h } from 'preact';
import { injectStyles } from '../utils/injectStyles';

const styles = {
  button: 'now-widget-button',
  rotatingText: 'now-widget-rotating-text'
};

// Inject styles when the component is imported
injectStyles(`
  .${styles.button} {
    position: fixed;
    bottom: 20px;
    width: var(--button-size);
    height: var(--button-size);
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .${styles.rotatingText} {
    position: absolute;
    width: 100%;
    height: 100%;
    animation: now-widget-rotate 10s linear infinite;
    font-size: 16px;
    letter-spacing: 1px;
    color: var(--button-color);
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }

  @keyframes now-widget-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .${styles.button}:hover .${styles.rotatingText} {
    animation-duration: 5s;
  }

  @media (prefers-reduced-motion: reduce) {
    .${styles.rotatingText} {
      animation-duration: 20s;
    }
  }
`);

interface SpinningButtonProps {
  size?: number;
  color?: string;
  position?: 'left' | 'right';
  onClick?: () => void;
}

export function SpinningButton({ 
  size = 60, 
  color = "#000",
  position = 'right',
  onClick 
}: SpinningButtonProps) {
  return (
    <button 
      className={styles.button}
      style={{
        '--button-size': `${size}px`,
        '--button-color': color,
        [position]: '20px'
      } as any}
      onClick={onClick}
      aria-label="Open Now Panel"
    >
      <div className={styles.rotatingText}>
        {Array(3).fill("now . ").join("")}
      </div>
    </button>
  );
}
