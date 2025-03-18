import { useEffect, useRef, useState } from "preact/hooks";
import "./App.css";
import { FeedbackPanel } from "./components/FeedbackPanel";
import "./components/IntegrationTutorial.css";
import { OrganizationProfile } from "./components/OrganizationProfile";
import { PostCard } from "./components/PostCard";
import { api } from "./services/apiService";
import "./styles/nowWidgetStyles.css";
import { type WidgetOrgInfo, type WidgetPost } from "./types/api";

interface Props {
  theme?: "light" | "dark";
  orgId: string;
  token: string;
}

export default function App({ theme = "light", orgId, token }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [orgInfo, setOrgInfo] = useState<WidgetOrgInfo | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<WidgetPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "feedback">("feed");
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const isDark = theme === "dark";
  const widgetThemeClass = isDark ? "nownownow-widget-dark" : "";

  useEffect(() => {
    async function fetchData() {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          api.getOrgInfo(token, orgId),
          api.getOrgPosts(token, orgId),
        ]);

        // Log the API responses for debugging
        console.log("Organization Info API Response:", userResponse);
        console.log("Posts API Response:", postsResponse);

        if (!userResponse.success) {
          throw new Error(userResponse.error || "Failed to fetch user info");
        }

        if (!postsResponse.success) {
          throw new Error(postsResponse.error || "Failed to fetch posts");
        }

        // Extract organization info from the response
        if (userResponse.data) {
          setOrgInfo(userResponse.data.organization);
          setUserData(userResponse.data); // Store the full response
        }

        // Extract posts from the response
        if (postsResponse.data) {
          console.log("Posts API Response Details:", {
            postsCount: postsResponse.data?.posts?.length || 0,
            firstPost:
              postsResponse.data?.posts && postsResponse.data?.posts.length > 0
                ? {
                    id: postsResponse.data.posts[0]?.id,
                    content:
                      postsResponse.data.posts[0]?.content?.substring(0, 50) +
                      "...", // Truncate for readability
                    authorInfo: {
                      user: postsResponse.data.posts[0]?.user,
                      author: postsResponse.data.posts[0]?.author,
                      userId: postsResponse.data.posts[0]?.userId,
                    },
                    hasMedia: !!postsResponse.data.posts[0]?.media?.length,
                    hasAttachments:
                      !!postsResponse.data.posts[0]?.attachments?.length,
                  }
                : null,
            nextCursor: postsResponse.data?.nextCursor,
            hasMore: postsResponse.data?.hasMore,
          });

          setPosts(postsResponse.data.posts || []);
          setNextCursor(postsResponse.data.nextCursor);
          setHasMore(postsResponse.data.hasMore || false);
        } else {
          setPosts([]);
          setHasMore(false);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load user data";
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [orgId, token]);

  // Reference for scroll area and loader using useRef
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Extract the loadMore function from the useEffect so it can be used directly
  const loadMore = async (): Promise<void> => {
    if (!hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const response = await api.getOrgPosts(token, orgId, nextCursor);
      console.log("Loading more posts - API Response:", response);

      if (response.success && response.data) {
        const newPosts = response.data.posts || [];

        // Log detailed information about the newly loaded posts
        console.log("Loading more posts - Detailed Response:", {
          newPostsCount: newPosts.length,
          firstNewPost:
            newPosts.length > 0
              ? {
                  id: newPosts[0]?.id,
                  content: newPosts[0]?.content?.substring(0, 50) + "...",
                  authorInfo: {
                    user: newPosts[0]?.user,
                    author: newPosts[0]?.author,
                    userId: newPosts[0]?.userId,
                  },
                }
              : null,
          nextCursor: response.data?.nextCursor,
          hasMore: response.data?.hasMore,
        });

        setPosts((prev) => [...prev, ...newPosts]);
        setNextCursor(response.data.nextCursor);
        setHasMore(
          response.data.hasMore !== undefined
            ? Boolean(response.data.hasMore)
            : false
        );
      }
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const loaderElement = loaderRef.current;
    if (!loaderElement || activeTab !== "feed") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          void loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderElement);

    return () => {
      observer.unobserve(loaderElement);
    };
  }, [hasMore, isLoadingMore, nextCursor, activeTab, token, orgId]);

  // Handle scroll event to show/hide scroll to top button
  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    setShowScrollTop(target.scrollTop > 300);
  };

  // Scroll to top function
  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll);
      return () => scrollArea.removeEventListener("scroll", handleScroll);
    }
    return undefined; // Explicit return for when scrollArea is null
  }, [activeTab]); // Re-add listener when tab changes

  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
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

  if (error) {
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
      <div className="nownownow-panel-header">
        <div className="nownownow-panel-title">Now</div>
        <button
          className="nownownow-close-button"
          onClick={() =>
            window.parent.postMessage({ type: "nownownow-close-panel" }, "*")
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <OrganizationProfile
        orgInfo={orgInfo}
        theme={theme}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      <div className="nownownow-widget-content-container">
        {activeTab === "feed" && (
          <div className="nownownow-widget-posts">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  content={post.content}
                  createdAt={post.createdAt}
                  likes={post._count?.likes ?? 0}
                  comments={post._count?.comments ?? 0}
                  theme={theme}
                />
              ))
            ) : (
              <div className="nownownow-widget-no-posts">
                <p>No posts available.</p>
              </div>
            )}
            {isLoadingMore && (
              <div className="nownownow-widget-loading-more">
                <div className="nownownow-widget-spinner"></div>
                <p>Loading more posts...</p>
              </div>
            )}
            {hasMore && !isLoadingMore && (
              <button
                className="nownownow-widget-load-more"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                Load More
              </button>
            )}
          </div>
        )}

        {activeTab === "feedback" && (
          <FeedbackPanel orgId={orgId} token={token} theme={theme} />
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          class={`nownownow-widget-scroll-top absolute bottom-2 right-2 rounded-full p-1.5 shadow-sm transition-opacity duration-300 hover:opacity-80 ${
            isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
          }`}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
