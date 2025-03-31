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

// Note: sanitizeHtml function removed as it's now handled by PostCard component

// Note: renderContent function removed as it's now handled by PostCard component

// Note: PostComment interface removed as it's now handled by PostCard component

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
  // UI state
  const [expandedFeedback, setExpandedFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Post interaction state
  const [viewedPosts, setViewedPosts] = useState<Record<string, boolean>>({});

  const isDark = theme === "dark";

  // Note: Removed initialization of likes as it's now handled by PostCard component

  // Set up intersection observer to track post views
  useEffect(() => {
    if (!posts.length || !token) return;

    const observers: IntersectionObserver[] = [];
    const postElements = document.querySelectorAll(
      ".nownownow-widget-post-item"
    );

    const observerCallback = (
      entries: IntersectionObserverEntry[],
      postId: string
    ) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !viewedPosts[postId]) {
          // Track post view
          api
            .trackPostView(token, postId)
            .then(() => {
              console.log(`View tracked for post ${postId}`);
              setViewedPosts((prev) => ({ ...prev, [postId]: true }));
            })
            .catch((error) => {
              console.error(`Failed to track view for post ${postId}:`, error);
            });
        }
      });
    };

    // Set up observers for each post
    postElements.forEach((element) => {
      const postId = element.getAttribute("data-post-id");
      if (postId && !viewedPosts[postId]) {
        const observer = new IntersectionObserver(
          (entries) => observerCallback(entries, postId),
          { threshold: 0.5 }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    // Clean up observers
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [posts, token, viewedPosts]);

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

  // Note: highlightHashtags function removed as it's now handled by PostCard component

  // Note: getAuthorInfo function removed as it's now handled by PostCard component

  // Helper to get avatar fallback (first letter of name)
  const getAvatarFallback = (name: string): string => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  // Note: hasImage and getPostImage functions removed as they're now handled by PostCard component

  // Note: toggleComments function removed as it's now handled by PostCard component

  // Note: loadComments function removed as it's now handled by PostCard component

  // Note: handleCommentInputChange function removed as it's now handled by PostCard component

  // Note: submitComment function removed as it's now handled by PostCard component

  // Note: handleLikeToggle function removed as it's now handled by PostCard component

  // Note: formatCommentDate function removed as it's now handled by PostCard component

  // Note: isCommentButtonDisabled function removed as it's now handled by PostCard component

  // Note: Helper functions for comments removed as they're now handled by PostCard component

  const handleScroll = (e: Event): void => {
    const target = e.target as HTMLDivElement;
    setShowScrollToTop(target.scrollTop > 300);
  };

  // Set up scroll event listener for the main container
  useEffect(() => {
    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll);
      return () => mainElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

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

  return (
    <div
      className="nownownow-widget-last-updates"
      style={{
        width: "100%",
        height: "100vh",
        background: isDark ? "#121212" : "white",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: isDark ? "#121212" : "white",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: "16px",
            fontWeight: 500,
            margin: 0,
            color: isDark ? "white" : "black",
          }}
        >
          Last Updates
        </h1>
        <button
          onClick={onClose}
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: isDark ? "#9ca3af" : "#6b7280",
          }}
          aria-label="Close panel"
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

      {/* Posts */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 16px", // Increased padding
        }}
        ref={mainRef}
      >
        <div>
          {posts.length > 0 ? (
            posts.map((post) => {
              return (
                <div
                  key={post.id}
                  data-post-id={post.id}
                  className="nownownow-widget-post-item"
                >
                  <PostCard
                    post={post}
                    content={post.content}
                    createdAt={post.createdAt}
                    likes={post._count?.likes || 0}
                    comments={post._count?.comments || 0}
                    theme={theme}
                    token={token}
                  />
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              <p>No updates available</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with feedback form */}
      <div
        style={{
          padding: "16px",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(0,0,0,0.05)",
          background: isDark ? "#121212" : "white",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                overflow: "hidden",
                background: isDark ? "#1e1e1e" : "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isDark ? "#e5e7eb" : "#4b5563",
                fontSize: "14px",
                fontWeight: "bold",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(0,0,0,0.05)",
              }}
            >
              {orgInfo?.image ? (
                <img
                  src={orgInfo.image}
                  alt={orgInfo.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                getAvatarFallback(orgInfo?.name || "")
              )}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: isDark ? "white" : "black",
                }}
              >
                {orgInfo?.name || "Organization"}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                {(orgInfo as any)?._count?.followers || 0} followers
              </span>
            </div>
          </div>
          <button
            onClick={() => setExpandedFeedback(!expandedFeedback)}
            style={{
              display: "flex",
              alignItems: "center",
              background: "transparent",
              border: "none",
              fontSize: "14px",
              color: "#3b82f6",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "6px",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = isDark
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(59, 130, 246, 0.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Feedback
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
              style={{ marginLeft: "4px" }}
            >
              {expandedFeedback ? (
                <polyline points="6 9 12 15 18 9"></polyline>
              ) : (
                <polyline points="9 18 15 12 9 6"></polyline>
              )}
            </svg>
          </button>
        </div>

        {/* Feedback form */}
        {expandedFeedback && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: isDark ? "#1e1e1e" : "#f8fafc",
              borderRadius: "10px",
            }}
          >
            <form
              onSubmit={handleFeedbackSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <textarea
                value={feedback}
                onInput={(e) =>
                  setFeedback((e.target as HTMLTextAreaElement).value)
                }
                placeholder="Share your thoughts or suggestions..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.08)",
                  background: isDark ? "#2a2a2a" : "white",
                  color: isDark ? "#e5e7eb" : "#1f2937",
                  fontSize: "14px",
                  resize: "none",
                  minHeight: "80px",
                }}
                required
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    opacity: isSubmitting || !feedback.trim() ? 0.5 : 1,
                  }}
                >
                  {isSubmitting ? "Sending..." : "Send"}
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
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Powered by sticker - only show when user is not basic or promember */}
        {(!orgInfo?.subscription ||
          (orgInfo.subscription !== "basic" &&
            orgInfo.subscription !== "promember")) && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              fontSize: "12px",
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>powered by</span>
            <a
              href="https://nownownow.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                textDecoration: "none",
                fontWeight: "500",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = isDark
                  ? "rgba(255,255,255,0.8)"
                  : "rgba(0,0,0,0.8)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = isDark
                  ? "rgba(255,255,255,0.6)"
                  : "rgba(0,0,0,0.6)";
              }}
            >
              nownownow.io
            </a>
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      {showScrollToTop && (
        <button
          onClick={() => {
            if (mainRef.current) {
              mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          style={{
            position: "absolute",
            bottom: "64px",
            right: "16px",
            background: "#3b82f6",
            color: "white",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            cursor: "pointer",
            transition: "opacity 0.2s ease",
          }}
          aria-label="Scroll to top"
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
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      )}

      {/* After posts list, before footer */}
      {renderLoadingMore()}

      {!isLoadingMore && hasMore && onLoadMore && (
        <div
          style={{
            textAlign: "center",
            padding: "8px 0 16px",
          }}
        >
          <button
            onClick={onLoadMore}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontSize: "14px",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};
