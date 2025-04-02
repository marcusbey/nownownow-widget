import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";

interface ViewTrackerProps {
  postId: string;
  token: string;
}

/**
 * ViewTracker component that tracks when a post is viewed
 * Uses Intersection Observer API to detect when a post is in the viewport
 */
export function ViewTracker({ postId, token }: ViewTrackerProps) {
  const [tracked, setTracked] = useState(false);
  const [viewerId, setViewerId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // These state variables are used for debugging and future enhancements
  const elementRef = useRef<HTMLDivElement>(null);

  // Track the view when the component mounts
  useEffect(() => {
    // Function to track the view
    const trackPostView = async () => {
      if (tracked || !postId || !token) return;
      
      setLoading(true);
      try {
        console.log(`Tracking view for post: ${postId}`);
        const response = await api.trackView(postId, token);
        
        if (response.success && response.data) {
          console.log("View tracked successfully:", response.data);
          setTracked(true);
          if (response.data.viewerId) {
            setViewerId(response.data.viewerId);
            // Store viewerId in localStorage to prevent duplicate views
            localStorage.setItem(`now-post-view-${postId}`, response.data.viewerId);
          }
        } else {
          console.error("Failed to track view:", response.error);
          setError(response.error || "Failed to track view");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error tracking view";
        console.error("Error tracking view:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Set up Intersection Observer to detect when the post is in view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !tracked) {
          // Post is visible in the viewport, track the view
          trackPostView();
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: "0px",
        threshold: 0.5, // 50% of the element must be visible
      }
    );

    // Start observing the element
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    // Check if we've already tracked this post for this user
    const existingViewerId = localStorage.getItem(`now-post-view-${postId}`);
    if (existingViewerId) {
      setViewerId(existingViewerId);
      setTracked(true);
    }

    // Clean up observer on unmount
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [postId, token, tracked]);

  // This is an invisible component, just for tracking
  return <div ref={elementRef} style={{ height: "1px", width: "100%" }} />;
}
