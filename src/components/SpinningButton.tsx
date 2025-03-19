import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

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
  position = 'right' as 'left' | 'right',
  isOpen = false,
  isVisible = true
}: SpinningButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const [buttonCenterX, setButtonCenterX] = useState(0);
  const [buttonCenterY, setButtonCenterY] = useState(0);
  const proximityThreshold = 150; // Distance in pixels to trigger proximity effect

  // Update button center coordinates when it's mounted or resized
  useEffect(() => {
    const updateButtonCenter = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setButtonCenterX(rect.left + rect.width / 2);
        setButtonCenterY(rect.top + rect.height / 2);
      }
    };

    if (buttonRef.current) {
      updateButtonCenter();
      window.addEventListener('resize', updateButtonCenter);
      return () => window.removeEventListener('resize', updateButtonCenter);
    }
    return undefined; // Explicit return for when buttonRef.current is null
  }, []);

  // Track mouse position for proximity effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (buttonRef.current) {
        const distance = Math.sqrt(
          Math.pow(e.clientX - buttonCenterX, 2) +
          Math.pow(e.clientY - buttonCenterY, 2)
        );
        setIsNear(distance < proximityThreshold);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [buttonCenterX, buttonCenterY]);
  const buttonStyle = `
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(26, 115, 232, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(26, 115, 232, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(26, 115, 232, 0); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateX(0); }
      40% { transform: translateX(-5px); }
      60% { transform: translateX(-2px); }
    }

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
      box-shadow: ${isNear ? '0 0 15px rgba(26, 115, 232, 0.6)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
      ${isHovered ? 'animation: pulse 2s infinite;' : ''}
    }

    .button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      background: ${color}ee;
    }

    .button:active {
      transform: scale(0.95);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      animation: none;
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
      ${isHovered && !isOpen ? 'animation: bounce 1s infinite;' : ''}
    }

    .button-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
      opacity: ${isNear ? '0.6' : '0'};
      transition: opacity 0.3s ease-in-out;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .button-wrapper {
        bottom: 12px;
        ${position === 'right' ? 'right: 12px;' : 'left: 12px;'}
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .button-wrapper,
      .button,
      .button svg {
        transition: none;
        animation: none !important;
      }
    }
  `;

  return (
    <div class="button-wrapper">
      <style>{buttonStyle}</style>
      <button 
        ref={buttonRef}
        class="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Toggle panel"
        aria-hidden={!isVisible}
      >
        <div class="button-glow"></div>
        <svg viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
