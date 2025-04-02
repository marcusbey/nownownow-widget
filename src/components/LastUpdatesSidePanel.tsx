"use client";

import type { FunctionComponent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";
import type { WidgetOrgInfo, WidgetPost } from "../types/api";
import { PostCard } from "./PostCard";

interface LastUpdatesSidePanelProps {
  posts: WidgetPost[];
  orgInfo: WidgetOrgInfo | null;
  theme?: "light" | "dark";
  onClose: () => void;
  token: string;
  orgId: string;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const LastUpdatesSidePanel: FunctionComponent<
  LastUpdatesSidePanelProps
> = ({
  posts = [],
  orgInfo,
  theme = "light",
  onClose,
  token,
  orgId,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  // Debug console log to track component rendering
  console.log("[DEBUG] LastUpdatesSidePanel rendering:", {
    postsCount: posts.length,
    orgId,
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const isDark = theme === "dark";

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    if (!feedback.trim()) return;

    try {
      setIsSubmitting(true);

      const response = await api.submitFeedback(token, {
        content: feedback,
        email: null,
        organizationId: orgId,
      });

      if (response.success) {
        setFeedback("");

        // Auto-hide form after success
        setTimeout(() => {
          setExpandedFeedback(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
    return;
  };

  // Helper to get avatar fallback (first letter of name)
  const getAvatarFallback = (name: string): string => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const handleScroll = (e: Event): void => {
    const target = e.target as HTMLDivElement;
    const currentScrollTop = target.scrollTop;

    setShowScrollTop(currentScrollTop > 300);

    // Hide footer menu when scrolling down
    if (currentScrollTop > lastScrollTop.current) {
      setShowFooterMenu(false);
    }

    lastScrollTop.current = currentScrollTop;
  };

  // Set up scroll event listener for the main container
  useEffect(() => {
    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll);
      return () => mainElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleFooterMenu = () => {
    setShowFooterMenu(!showFooterMenu);
  };

  // Format post content into paragraphs
  const formatPostContent = (content: string): string[] => {
    if (!content) return [];
    return content.split("\n").filter((line) => line.trim() !== "");
  };

  // Render loading indicator at the bottom of the posts list
  const renderLoadingMore = () => {
    if (!isLoadingMore) return null;

    return (
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          color: isDark ? "#9ca3af" : "#6b7280",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <svg
          className="nownownow-widget-spinner"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          style={{ opacity: 0.8 }}
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="40"
            strokeDashoffset="0"
          />
        </svg>
        Loading more posts...
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateString: string): { month: string; day?: string } => {
    const date = new Date(dateString);
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate().toString();

    // Return month and day
    return {
      month,
      day,
    };
  };

  return (
    <div className="w-full h-screen bg-background relative flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between">
          <h1 className="font-medium">Last Updates</h1>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted hover:text-destructive"
            aria-label="Close panel"
            title="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-7 py-5" ref={mainRef}>
        {posts.length > 0 ? (
          <div className="space-y-16">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                content={post.content}
                createdAt={post.createdAt}
                token={token}
                theme={theme}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-6 text-muted-foreground">
            <p>No updates available</p>
          </div>
        )}

        {/* After posts list, before footer */}
        {renderLoadingMore()}

        {!isLoadingMore && hasMore && onLoadMore && (
          <div className="text-center py-2">
            <button
              onClick={onLoadMore}
              className="text-primary text-sm font-medium py-2 px-4 rounded-md hover:bg-primary/5"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-background pt-2">
        {/* Collapsible menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showFooterMenu ? "max-h-24" : "max-h-0"
          }`}
        >
          <div className="p-3 space-y-2">
            <button className="w-full text-xs h-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Subscribe for Updates
            </button>
            <button
              className="w-full text-xs h-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
              onClick={() => setExpandedFeedback(!expandedFeedback)}
            >
              Send Feedback
            </button>
          </div>
        </div>

        {/* Feedback form */}
        {expandedFeedback && (
          <div className="p-3 border-t">
            <form
              onSubmit={handleFeedbackSubmit}
              className="flex flex-col gap-2"
            >
              <textarea
                value={feedback}
                onInput={(e) =>
                  setFeedback((e.target as HTMLTextAreaElement).value)
                }
                placeholder="Share your thoughts or suggestions..."
                className="w-full p-2 text-sm rounded-md border resize-none min-h-[80px] bg-background"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className="flex items-center gap-1 bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main footer */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-muted">
                {orgInfo?.image ? (
                  <img
                    src={orgInfo.image}
                    alt={orgInfo.name || "Organization"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getAvatarFallback(orgInfo?.name || "")
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">
                  {orgInfo?.name || "Organization"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {(orgInfo as any)?._count?.followers || 0} followers
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="h-7 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3">
                Follow
              </button>
              <button
                onClick={toggleFooterMenu}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted"
                aria-label="Toggle menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${
                    showFooterMenu ? "" : "rotate-180"
                  }`}
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-1 text-center">
            <span className="text-[10px] text-muted-foreground">
              powered by nownownow.io
            </span>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-20 right-4 bg-primary text-primary-foreground rounded-full p-2 shadow-lg transition-opacity duration-300 hover:opacity-80"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
          >
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};
