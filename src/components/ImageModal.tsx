import type { FunctionComponent } from "preact";
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";

interface ImageModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  isOpen: boolean;
}

export const ImageModal: FunctionComponent<ImageModalProps> = ({
  images,
  initialIndex,
  onClose,
  isOpen,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);
  
  // Reset current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);
  
  if (!isOpen) return null;
  
  const handlePrevious = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };
  
  const handleNext = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };
  
  return (
    <div className="nownownow-widget-modal-backdrop" onClick={onClose}>
      <div className="nownownow-widget-image-modal" onClick={(e) => e.stopPropagation()}>
        <button className="nownownow-widget-modal-close" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="nownownow-widget-image-container">
          <img 
            src={images[currentIndex]} 
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className="nownownow-widget-modal-image"
          />
        </div>
        
        {images.length > 1 && (
          <div className="nownownow-widget-image-navigation">
            <button 
              className="nownownow-widget-image-nav-button nownownow-widget-image-prev"
              onClick={handlePrevious}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div className="nownownow-widget-image-counter">
              {currentIndex + 1} / {images.length}
            </div>
            
            <button 
              className="nownownow-widget-image-nav-button nownownow-widget-image-next"
              onClick={handleNext}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
