import type { FunctionComponent } from "preact";
import { h } from "preact";
import { useState } from "preact/hooks";
import { ImageModal } from "./ImageModal";

export interface MediaItem {
  id: string;
  url: string;
  type: string;
}

interface MediaDisplayProps {
  media: MediaItem[];
  isDark?: boolean;
}

export const MediaDisplay: FunctionComponent<MediaDisplayProps> = ({
  media,
  isDark = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  if (!media || media.length === 0) {
    return null;
  }
  
  // Filter out image media items
  const imageMedia = media.filter(item => item.type.toLowerCase() === "image");
  const imageUrls = imageMedia.map(item => item.url);
  
  // Handle image click to open modal
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setModalOpen(true);
  };
  
  // Determine grid layout based on number of images
  const getGridClass = () => {
    const count = imageMedia.length;
    if (count === 1) return "nownownow-widget-media-grid-single";
    if (count === 2) return "nownownow-widget-media-grid-two";
    if (count === 3) return "nownownow-widget-media-grid-three";
    if (count === 4) return "nownownow-widget-media-grid-four";
    return "nownownow-widget-media-grid-many";
  };
  
  return (
    <div className={`nownownow-widget-media-container ${isDark ? "nownownow-widget-media-dark" : ""}`}>
      <div className={`nownownow-widget-media-grid ${getGridClass()}`}>
        {imageMedia.slice(0, 4).map((item, index) => (
          <div 
            key={item.id} 
            className="nownownow-widget-media-item"
            onClick={() => handleImageClick(index)}
          >
            <img 
              src={item.url} 
              alt={`Media ${index + 1}`}
              className="nownownow-widget-media-image"
              loading="lazy"
            />
            {index === 3 && imageMedia.length > 4 && (
              <div className="nownownow-widget-media-more">
                +{imageMedia.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <ImageModal 
        images={imageUrls}
        initialIndex={selectedImageIndex}
        onClose={() => setModalOpen(false)}
        isOpen={modalOpen}
      />
    </div>
  );
};
