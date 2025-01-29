import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { cn } from '../utils/cn';

interface NowButtonProps {
  color: string;
  onClick: () => void;
  position: 'left' | 'right';
}

export function NowButton({ color, onClick, position }: NowButtonProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--button-color': color } as any}
      className={cn(
        'fixed bottom-8 w-16 h-16 rounded-full flex items-center justify-center',
        'transition-all duration-300 ease-in-out transform hover:scale-110',
        'bg-[var(--button-color)] text-white shadow-lg z-50',
        position === 'left' ? 'left-8' : 'right-8'
      )}
    >
      <div className="relative w-full h-full">
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'flex items-center justify-center overflow-hidden'
          )}
        >
          <div
            className={cn(
              'absolute w-full h-full animate-spin',
              isHovered ? '[animation-duration:3s]' : '[animation-duration:6s]'
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 origin-[0_32px] whitespace-nowrap text-xs"
                style={{ 
                  transform: `rotate(${i * 45}deg) translateY(-32px)`
                }}
              >
                NOW
              </span>
            ))}
          </div>
          <span className="relative z-10 text-lg font-bold">N</span>
        </div>
      </div>
    </button>
  );
}