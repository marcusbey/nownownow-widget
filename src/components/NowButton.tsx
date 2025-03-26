import { useEffect, useRef, useState } from "preact/hooks";
import type { WidgetPosition } from "../types/widget";

/**
 * NowButton component props
 * Used for both the panel and widget implementations
 */
export interface NowButtonProps {
  onClick: () => void;
  size?: string;
  color?: string;
  position?: WidgetPosition;
  isNowPanelOpen?: boolean;
  isVisible?: boolean;
  updated?: boolean;
}

export function NowButton({
  onClick,
  size = "48",
  color = "#f59e0b",
  position = "right" as "left" | "right",
  isNowPanelOpen = false,
  isVisible = true,
  updated = false,
}: NowButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const [supportsTrig, setSupportsTrig] = useState(false);
  const [textRingSpeed, setTextRingSpeed] = useState(60);
  const proximityThreshold = 200; // Distance in pixels to trigger proximity effect

  // Check if browser supports CSS trigonometric functions
  useEffect(() => {
    try {
      setSupportsTrig(CSS.supports("(top: calc(sin(1) * 1px))"));
    } catch (e) {
      setSupportsTrig(false);
    }
  }, []);

  // No need to track button center coordinates as we calculate them on mousemove
  useEffect(() => {
    // This effect is intentionally left empty as we now calculate coordinates on mousemove
    // It's kept for potential future enhancements
  }, []);

  // Track mouse position for proximity effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const buttonCenterX = rect.left + rect.width / 2;
        const buttonCenterY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(e.clientX - buttonCenterX, 2) +
            Math.pow(e.clientY - buttonCenterY, 2)
        );
        setIsNear(distance < proximityThreshold);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Animate text ring speed based on hover and proximity
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (isHovered) {
        // Almost stop on hover (very slow rotation)
        setTextRingSpeed((prevSpeed) => {
          const targetSpeed = 120; // Very slow rotation (120 seconds per rotation)
          const newSpeed = prevSpeed + (targetSpeed - prevSpeed) * 0.1;
          return Math.abs(newSpeed - targetSpeed) < 0.1
            ? targetSpeed
            : newSpeed;
        });
      } else if (isNear) {
        // Slow down when mouse is near
        setTextRingSpeed((prevSpeed) => {
          const targetSpeed = 90; // Slower rotation (90 seconds per rotation)
          const newSpeed = prevSpeed + (targetSpeed - prevSpeed) * 0.1;
          return Math.abs(newSpeed - targetSpeed) < 0.1
            ? targetSpeed
            : newSpeed;
        });
      } else {
        // Normal speed when mouse is far away
        setTextRingSpeed((prevSpeed) => {
          const newSpeed = prevSpeed + (60 - prevSpeed) * 0.1;
          return Math.abs(newSpeed - 60) < 0.1 ? 60 : newSpeed;
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isNear, isHovered]);

  // Prepare text for the rotating ring
  const nowText = updated
    ? "NOW.NEW.NOW.NEW.NOW.NEW."
    : "NOW.NOW.NOW.NOW.NOW.NOW.";
  const chars = nowText.split("");
  const totalChars = chars.length;

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
      bottom: 20vh;
      ${position === "right" ? "right: 10vw;" : "left: 10vw;"}
      z-index: 2147483647;
      pointer-events: ${isVisible ? "auto" : "none"};
      transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1),
                  opacity 0.3s ease-in-out;
      transform: translateX(${
        isNowPanelOpen
          ? (position === "right" ? "-" : "") + "min(600px, 80vw)"
          : "0"
      });
      opacity: ${isVisible ? "1" : "0"};
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: none;
      border: none;
      background: transparent;
      cursor: pointer;
    }

    .button {
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      outline: none;
      position: relative;
    }

    .button-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }

    .text-ring {
      --total: ${totalChars};
      --character-width: 1;
      --inner-angle: calc((360 / var(--total)) * 1deg);
      --radius: ${
        supportsTrig
          ? `calc((var(--character-width, 1) / sin(var(--inner-angle))) * -1.4ch)`
          : `-4ch`
      };
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      animation: spin ${textRingSpeed}s linear infinite;
      transition: animation-duration 0.3s ease-in-out;
      cursor: pointer;
    }

    .now-char {
      position: absolute;
      top: 50%;
      left: 50%;
      font-size: 1.1rem;
      font-weight: bold;
      background: linear-gradient(45deg, ${color}, ${color}dd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
      text-shadow: 0 0 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
    }

    .arrow-icon {
      width: ${parseInt(size) * 0.3}px;
      height: ${parseInt(size) * 0.3}px;
      stroke: ${color};
      stroke-width: 2;
      fill: none;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .button-wrapper {
        bottom: 12px;
        ${position === "right" ? "right: 12px;" : "left: 12px;"}
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .button-wrapper,
      .button,
      .text-ring {
        transition: none;
        animation: none !important;
      }
    }
  `;

  // Generate styles for each character in the rotating text
  const charStyles = chars
    .map(
      (_, index) => `
    .now-char:nth-child(${index + 1}) {
      --index: ${index};
      transform: translate(-50%, -50%) rotate(calc(var(--inner-angle) * var(--index))) translateY(var(--radius, -4ch));
    }
  `
    )
    .join("");

  return (
    <div class="button-wrapper">
      <style>{buttonStyle}</style>
      <style>{charStyles}</style>
      <button
        ref={buttonRef}
        class="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Toggle panel"
        aria-hidden={!isVisible}
      >
        <div class="button-content">
          <div class="text-ring">
            {chars.map((char, index) => (
              <span key={index} class="now-char">
                {char}
              </span>
            ))}
          </div>
          <svg class="arrow-icon" viewBox="0 0 24 24">
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
