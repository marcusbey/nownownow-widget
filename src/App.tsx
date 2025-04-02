import { useEffect, useRef, useState } from "preact/hooks";
import "./App.css";
import { LastUpdatesSidePanel } from "./components/LastUpdatesSidePanel";
import { api } from "./services/apiService";
import "./styles/markdown.css";
import "./styles/nowWidgetStyles.css";
import { type WidgetOrgInfo, type WidgetPost } from "./types/api";

interface Props {
  theme?: "light" | "dark";
  orgId: string;
  token: string;
  preloadData?: boolean;
  onToggle?: () => void;
}

export default function App({
  theme = "light",
  orgId,
  token,
  preloadData = false,
  onToggle,
}: Props) {
  // Debug console log to track App component rendering and build version
  console.log('[DEBUG] App component rendering:', { 
    buildTime: new Date().toISOString(),
    orgId,
    theme
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [orgInfo, setOrgInfo] = useState<WidgetOrgInfo | null>(null);
  const [posts, setPosts] = useState<WidgetPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const isDark = theme === "dark";
  const widgetThemeClass = isDark ? "nownownow-widget-dark" : "";
  const containerRef = useRef<HTMLDivElement>(null);
  const INITIAL_PAGE_SIZE = 5; // Smaller initial page size for faster loading
  const SUBSEQUENT_PAGE_SIZE = 10;

  // Function to fetch organization info
  const fetchOrgInfo = async () => {
    try {
      const userResponse = await api.getOrgInfo(token, orgId);

      if (!userResponse.success) {
        throw new Error(userResponse.error || "Failed to fetch user info");
      }

      // Extract organization info from the response
      if (userResponse.data) {
        setOrgInfo(userResponse.data.organization);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load organization data";
      setError(errorMessage);
      console.error("Error fetching organization data:", err);
    }
  };

  // Helper function to determine which posts should include comments
  const determineCommentLoadingStrategy = (cursor?: string) => {
    // If this is the initial load (no cursor), include comments for the first few posts
    if (!cursor) {
      return { includeComments: true }; // For initial posts, include comments
    }
    
    // For subsequent loads, don't include comments by default
    // They will be loaded on demand when a user expands the comments section
    return {};
  };

  // Function to fetch posts with pagination using hybrid comment loading
  const fetchPosts = async (
    cursor?: string,
    limit: number = SUBSEQUENT_PAGE_SIZE
  ) => {
    if (cursor) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Determine which posts should include comments
      const options = determineCommentLoadingStrategy(cursor);
      
      // Fetch posts with the appropriate comment loading strategy
      const postsResponse = await api.getOrgPosts(token, orgId, cursor, limit, options);

      if (!postsResponse.success) {
        throw new Error(postsResponse.error || "Failed to fetch posts");
      }

      // Extract posts and pagination info from the response
      if (postsResponse.data) {
        const responseData = postsResponse.data;

        if (cursor) {
          // Append new posts to existing ones
          setPosts((prev) => [...prev, ...(responseData.posts || [])]);
        } else {
          // Replace posts on initial load
          setPosts(responseData.posts || []);
        }

        setNextCursor(responseData.nextCursor);
        setHasMore(responseData.hasMore);
      } else {
        if (!cursor) {
          setPosts([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load posts";
      setError(errorMessage);
      console.error("Error fetching posts:", err);
    } finally {
      if (cursor) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    }
  };

  // Handle scroll events for infinite loading
  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;

    // Check if we're near the bottom and not already loading more posts
    const isNearBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight * 1.5;

    if (isNearBottom && !isLoadingMore && hasMore && nextCursor) {
      loadMorePosts();
    }
  };

  // Function to load more posts
  const loadMorePosts = () => {
    if (hasMore && nextCursor && !isLoadingMore) {
      fetchPosts(nextCursor);
    }
  };

  // Handle initial data loading
  useEffect(() => {
    if (preloadData || initialLoadComplete) {
      console.log("Loading data for Now panel...");

      // Fetch org info and initial posts in parallel
      Promise.all([
        fetchOrgInfo(),
        fetchPosts(undefined, INITIAL_PAGE_SIZE),
      ]).catch((err) => {
        console.error("Error initializing widget:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, token]); // Re-fetch when org or token changes

  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [nextCursor, isLoadingMore, hasMore]);

  if (isLoading && !initialLoadComplete) {
    return (
      <div
        ref={containerRef}
        className={`nownownow-widget-container ${widgetThemeClass}`}
      >
        <div className="nownownow-widget-loading">
          <div className="nownownow-widget-spinner"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (error && !initialLoadComplete) {
    return (
      <div
        ref={containerRef}
        className={`nownownow-widget-container ${widgetThemeClass}`}
      >
        <div className="nownownow-widget-error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`nownownow-widget-container ${widgetThemeClass}`}
    >
      <LastUpdatesSidePanel
        posts={posts}
        orgInfo={orgInfo}
        theme={theme}
        onClose={onToggle || (() => {})}
        token={token}
        orgId={orgId}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMorePosts}
      />
    </div>
  );
}
