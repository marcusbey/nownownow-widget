import { Fragment } from "preact";
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

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const loaderElement = loaderRef.current;
    if (!loaderElement || activeTab !== "feed") return;

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

  if (isLoading) {
    return (
      <div
        class={`nownownow-widget-loading-container w-full h-full flex flex-col items-center justify-center ${
          isDark ? "bg-slate-900 text-slate-200" : "bg-slate-50 text-slate-700"
        }`}
      >
        <div
          class={`nownownow-widget-loading-spinner w-8 h-8 border-2 rounded-full border-t-transparent animate-spin mb-4 ${
            isDark ? "border-slate-600" : "border-slate-300"
          }`}
        ></div>
        <p class="nownownow-widget-loading-text text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        class={`nownownow-widget-error-container w-full h-full flex flex-col items-center justify-center p-6 ${
          isDark ? "bg-slate-900 text-slate-200" : "bg-slate-50 text-slate-700"
        }`}
      >
        <div
          class={`nownownow-widget-error-icon mb-4 p-3 rounded-full ${
            isDark ? "bg-red-900/20" : "bg-red-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`nownownow-widget-error-svg w-6 h-6 ${
              isDark ? "text-red-400" : "text-red-500"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <p class="nownownow-widget-error-message text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className={widgetThemeClass}>
      <div className="nownownow-widget-tab-container flex border-b border-slate-200">
        <button
          className={`nownownow-widget-tab-button px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "feed"
              ? isDark
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-blue-600 border-b-2 border-blue-500"
              : isDark
              ? "text-slate-400 hover:text-slate-300"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("feed")}
        >
          Feed
        </button>
        <button
          className={`nownownow-widget-tab-button px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "feedback"
              ? isDark
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-blue-600 border-b-2 border-blue-500"
              : isDark
              ? "text-slate-400 hover:text-slate-300"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("feedback")}
        >
          Feedback
        </button>
      </div>

      {activeTab === "feed" ? (
        <Fragment>
          <OrganizationProfile orgInfo={orgInfo} theme={theme} />

          <div
            className="nownownow-widget-post-container overflow-auto h-[calc(100%-90px)]"
            ref={scrollAreaRef}
          >
            <div className="nownownow-widget-post-wrapper px-4 py-3">
              {posts.length > 0 ? (
                <Fragment>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      content={post.content}
                      createdAt={post.createdAt}
                      comments={post._count?.comments ?? 0}
                      likes={post._count?.likes ?? 0}
                      theme={theme}
                    />
                  ))}

                  {/* Infinite scroll loader */}
                  <div
                    ref={loaderRef}
                    className="nownownow-widget-loader py-4 flex justify-center"
                  >
                    {isLoadingMore && (
                      <div
                        className={`nownownow-widget-loader-spinner w-6 h-6 border-2 rounded-full border-t-transparent animate-spin ${
                          isDark ? "border-slate-600" : "border-slate-300"
                        }`}
                      ></div>
                    )}
                    {!isLoadingMore && hasMore && (
                      <div className="nownownow-widget-loader-spacer h-10"></div>
                    )}
                    {!hasMore && posts.length > 10 && (
                      <p className="nownownow-widget-no-more-posts text-xs text-slate-500">
                        No more updates
                      </p>
                    )}
                  </div>
                </Fragment>
              ) : (
                <p className="nownownow-widget-no-posts text-center py-6 text-sm text-slate-500">
                  No updates yet
                </p>
              )}
            </div>
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
        </Fragment>
      ) : (
        <FeedbackPanel theme={theme} orgId={orgId} token={token} />
      )}
    </div>
  );
}
