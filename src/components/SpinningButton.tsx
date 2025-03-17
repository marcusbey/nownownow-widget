import { h } from 'preact';

interface SpinningButtonProps {
  onClick: () => void;
  size?: string;
  color?: string;
  position?: 'left' | 'right';
  isOpen?: boolean;
  isVisible?: boolean;
}

export function SpinningButton({ 
  onClick, 
  size = '48', 
  color = '#f59e0b',
  position = 'bottom-right',
  isOpen = false,
  isVisible = true
}: SpinningButtonProps) {
  const buttonStyle = `
    .button-wrapper {
      position: fixed;
      bottom: 20px;
      ${position === 'right' ? 'right: 20px;' : 'left: 20px;'}
      z-index: 2147483647;
      pointer-events: ${isVisible ? 'auto' : 'none'};
      transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1),
                  opacity 0.3s ease-in-out;
      transform: translateX(${isOpen ? (position === 'right' ? '-' : '') + 'min(600px, 80vw)' : '0'});
      opacity: ${isVisible ? '1' : '0'};
    }

    .button {
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      background: ${color}ee;
    }

    .button:active {
      transform: scale(0.95);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .button svg {
      width: ${parseInt(size) * 0.5}px;
      height: ${parseInt(size) * 0.5}px;
      transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
      fill: none;
      stroke: white;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transform: rotate(${isOpen ? '180deg' : '0deg'});
    }

    @media (max-width: 768px) {
      .button-wrapper {
        ${position.includes('top') ? 'top: 12px;' : 'bottom: 12px;'}
        ${position.includes('right') ? 'right: 12px;' : 'left: 12px;'}
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .button-wrapper,
      .button,
      .button svg {
        transition: none;
      }
    }
  `;

  return (
    <div className="button-wrapper">
      <style>{buttonStyle}</style>
      <button 
        className="button"
        onClick={onClick}
        aria-label="Toggle panel"
        aria-hidden={!isVisible}
      >
        <svg viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
