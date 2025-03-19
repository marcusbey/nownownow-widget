/** @jsx h */
import { h, FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { cn } from '../utils/cn';
import type { JSX } from 'preact';
import '../styles/button.css';

// Helper function to convert any color format to rgba values
function parseColor(color: string): { r: number; g: number; b: number } {
  // Default values
  const defaultColor = { r: 0, g: 0, b: 0 };
  
  // Handle CSS variables
  if (color.startsWith('hsl(var(') || color.startsWith('rgb(var(')) {
    // For CSS variables, we'll use a default shadow color
    return { r: 255, g: 69, b: 0 }; // Default to orange-red
  }
  
  // Handle hex colors
  if (color.startsWith('#')) {
    try {
      const hex = color.slice(1);
      if (hex.length === 3) {
        // Convert shorthand hex to full hex
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b };
      } else if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
      }
    } catch (e) {
      console.error('Error parsing hex color:', e);
      return defaultColor;
    }
  }
  
  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    try {
      const rgbMatch = color.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        const r = parseInt(rgbMatch[0], 10);
        const g = parseInt(rgbMatch[1], 10);
        const b = parseInt(rgbMatch[2], 10);
        return { r, g, b };
      }
    } catch (e) {
      console.error('Error parsing rgb color:', e);
      return defaultColor;
    }
  }
  
  return defaultColor;
}

interface NowButtonProps {
  updated?: boolean;
  onClick?: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  position?: 'left' | 'right';
}

export const NowButton: FunctionComponent<NowButtonProps> = ({
  updated = false,
  onClick,
  size = 100,
  color = "hsl(var(--primary))",
  backgroundColor = "transparent",
  position = 'right'
}) => {
  const [supportsTrig, setSupportsTrig] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [textRingSpeed, setTextRingSpeed] = useState(60);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Check if browser supports trigonometric CSS functions
    setSupportsTrig(CSS.supports("(top: calc(sin(1) * 1px))"));
  }, []);

  // Text content based on updated state
  const nowText = updated
    ? "NOW.NEW.NOW.NEW.NOW.NEW."
    : "NOW.NOW.NOW.NOW.NOW.NOW.";

  const chars = nowText.split("");
  const totalChars = chars.length;

  // Handle mouse movement to detect proximity to button
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
        const proximityThreshold = 200; // Adjust this value to change the proximity sensitivity
        setIsNear(distance < proximityThreshold);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Animate text ring speed based on mouse proximity and hover state
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      if (isNear || isHovered) {
        setTextRingSpeed((prevSpeed) => {
          const targetSpeed = isHovered ? 5 : 30;
          const newSpeed = prevSpeed + (targetSpeed - prevSpeed) * 0.1;
          return Math.abs(newSpeed - targetSpeed) < 0.1
            ? targetSpeed
            : newSpeed;
        });
      } else {
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

  // Calculate styles for text ring and characters
  const textRingStyle: JSX.CSSProperties = {
    "--total": totalChars,
    "--character-width": 1,
    "--inner-angle": `calc((360 / var(--total)) * 1deg)`,
    "--radius": supportsTrig
      ? `calc((var(--character-width, 1) / sin(var(--inner-angle))) * -1.4ch)`
      : "-4ch",
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    animationDuration: `${textRingSpeed}s`,
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationName: "spin",
    transition: "animation-duration 0.3s ease-in-out",
  };

  const getCharStyle = (index: number): JSX.CSSProperties => {
    // Create a gradient that works with any color format
    const { r, g, b } = parseColor(color);
    const gradientColor = `rgb(${r}, ${g}, ${b})`;
    
    return {
      "--index": index,
      position: "absolute",
      top: "50%",
      left: "50%",
      fontSize: "1.1rem",
      fontWeight: "bold",
      background: `linear-gradient(45deg, ${gradientColor}, #FF4500)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
      transform: `
        translate(-50%, -50%)
        rotate(calc(var(--inner-angle) * var(--index)))
        translateY(var(--radius, -4ch))
      `,
    };
  };

  return (
    <div className={cn(
      "flex justify-center items-center",
      "fixed z-50",
      position === 'left' ? 'left-8 bottom-8' : 'right-8 bottom-8'
    )}>
      <button
        ref={buttonRef}
        id="now-widget-button"
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-full",
          "transition-all duration-300 ease-in-out",
          isHovered ? "hover:scale-110" : "",
          isNear ? "hover:shadow-lg" : ""
        )}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: backgroundColor,
          border: "none",
          padding: 0,
          outline: "none",
          boxShadow: isHovered ? (() => {
            const { r, g, b } = parseColor(color);
            return `0 0 15px rgba(${r}, ${g}, ${b}, 0.5)`;
          })() : "none",
          position: "relative",
          animation: isHovered ? "pulse 2s infinite" : "none"
        } as JSX.CSSProperties}
      >
        <div className="relative w-full h-full flex justify-center items-center">
          <span style={textRingStyle} className="text-ring">
            {chars.map((char, index) => (
              <span key={index} style={getCharStyle(index)} className="now-text">
                {char}
              </span>
            ))}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              width: `${size * 0.3}px`,
              height: `${size * 0.3}px`,
              color: color,
            } as JSX.CSSProperties}
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </button>
    </div>
  );
};