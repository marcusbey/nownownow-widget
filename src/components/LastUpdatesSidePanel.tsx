"use client";

import DOMPurify from "dompurify";
import * as markedLibrary from "marked";
import type { FunctionComponent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";
import type { WidgetOrgInfo, WidgetPost } from "../types/api";

// Initialize marked with options
markedLibrary.marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Add <br> on line breaks
  async: false, // Always use synchronous operation
  pedantic: false, // Conform to markdown.pl (false = better specs)
});

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1m" : `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1h" : `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1d";
  if (diffInDays < 7) return `${diffInDays}d`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1mo" : `${diffInMonths}mo`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1y" : `${diffInYears}y`;
}

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

// Helper function to sanitize HTML
function sanitizeHtml(html: string): string {
  // Use DOMPurify for comprehensive sanitization
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "a",
      "em",
      "strong",
      "b",
      "i",
      "s",
      "strike",
      "del",
      "code",
      "pre",
      "blockquote",
      "span",
      "div",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "target",
      "rel",
      "class",
      "style",
      "id",
      "title",
      "width",
      "height",
      "type",
    ],
    ADD_ATTR: ["target"], // Add target="_blank" to links
    FORBID_ATTR: ["onclick", "onload", "onerror"],
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "canvas",
      "form",
      "input",
      "textarea",
    ],
    USE_PROFILES: {
      html: true, // Use HTML profile which includes list elements
    },
  });
}

// Function to render markdown content
function renderContent(content: string, isDark: boolean) {
  // Convert markdown to HTML
  const htmlContent = markedLibrary.marked.parse(content);

  // Sanitize HTML for security
  const sanitizedHtml = sanitizeHtml(htmlContent as string);

  // Process links to open in new tab (since we can't control marked renderer easily with types)
  const processedHtml = sanitizedHtml.replace(
    /<a\s+(?:[^>]*?\s+)?href=(["'])(https?:\/\/[^"']+)\1/gi,
    '<a href="$2" target="_blank" rel="noopener noreferrer"'
  );

  return (
    <div
      className="nownownow-widget-post-content markdown-content"
      style={{
        fontSize: "14px",
        lineHeight: "1.6",
        color: isDark ? "#e5e7eb" : "#1f2937",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxWidth: "100%", // Ensure content doesn't overflow
        marginBottom: "16px", // Add some space below content
      }}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

// Define comment interface for better type safety
interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    id?: string;
    name?: string;
    image?: string | null;
  };
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
  // UI state
  const [expandedFeedback, setExpandedFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Comments related state
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [commentsLoaded, setCommentsLoaded] = useState<Record<string, boolean>>(
    {}
  );
  const [postComments, setPostComments] = useState<
    Record<string, PostComment[]>
  >({});
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [submittingComment, setSubmittingComment] = useState<
    Record<string, boolean>
  >({});

  // Post interaction state
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [viewedPosts, setViewedPosts] = useState<Record<string, boolean>>({});

  const isDark = theme === "dark";

  // Initialize likes from posts data
  useEffect(() => {
    const initialLiked: Record<string, boolean> = {};

    posts.forEach((post) => {
      // Check if user has liked the post
      initialLiked[post.id] = post.hasLiked || false;
    });

    setLikedPosts(initialLiked);
  }, [posts]);

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
  const handleFeedbackSubmit = async (e: Event) => {
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
  };

  // Helper to highlight hashtags
  const highlightHashtags = (content: string) => {
    const words = content.split(/(\s+)/);

    return (
      <span>
        {words.map((word, index) => {
          if (word.match(/^#[\w-]+/)) {
            return (
              <a
                key={index}
                href="#"
                style={{
                  color: "#3b82f6",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                {word}
              </a>
            );
          }
          return <span key={index}>{word}</span>;
        })}
      </span>
    );
  };

  // Helper to get author info
  const getAuthorInfo = (post: WidgetPost) => {
    return {
      name: post.user?.name || "User",
      image: post.user?.image || null,
    };
  };

  // Helper to get avatar fallback (first letter of name)
  const getAvatarFallback = (name: string): string => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  // Helper to determine if post has image
  const hasImage = (post: WidgetPost) => {
    return (
      post.media &&
      post.media.length > 0 &&
      post.media.some((item) => item.type.toLowerCase() === "image")
    );
  };

  // Helper to get first image from post media
  const getPostImage = (post: WidgetPost) => {
    if (!post.media) return null;
    const imageMedia = post.media.find(
      (item) => item.type.toLowerCase() === "image"
    );
    return imageMedia?.url || null;
  };

  // Function to toggle comments visibility
  const toggleComments = (postId: string) => {
    setShowComments((prev) => {
      const newState = { ...prev, [postId]: !prev[postId] };

      // Load comments when showing them for the first time
      if (newState[postId] && !commentsLoaded[postId]) {
        loadComments(postId);
      }

      return newState;
    });
  };

  // Load comments for a post
  const loadComments = async (postId: string) => {
    if (
      showComments[postId] &&
      !commentsLoaded[postId] &&
      !loadingComments[postId]
    ) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));

      if (token) {
        try {
          const response = await api.getPostComments(token, postId);

          if (response.success && response.data) {
            // Type assertion for response.data
            const responseData = response.data as { comments: PostComment[] };
            setPostComments((prev) => ({
              ...prev,
              [postId]: responseData.comments || [],
            }));
          } else {
            console.error("Failed to load comments:", response.error);
          }
        } catch (error) {
          console.error("Error loading comments:", error);
        }
      }

      setCommentsLoaded((prev) => ({ ...prev, [postId]: true }));
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Handle comment input change
  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  // Submit a new comment
  const submitComment = async (postId: string) => {
    const commentText = getCommentInput(postId);
    if (!commentText.trim() || isSubmittingComment(postId) || !token || !orgId)
      return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await api.addComment(token, postId, commentText);

      if (response.success && response.data) {
        // Type assertion for response.data
        const responseData = response.data as { comment: PostComment };
        const newComment = responseData.comment;
        setPostComments((prev) => ({
          ...prev,
          [postId]: [...getComments(postId), newComment],
        }));

        // Clear the input field
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      } else {
        console.error("Failed to add comment:", response.error);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    }

    setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
  };

  // Handle like toggling
  const handleLikeToggle = async (postId: string) => {
    if (!token || !orgId) return;

    // Optimistic update
    const isCurrentlyLiked = likedPosts[postId] || false;
    setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));

    try {
      const response = await api.toggleLike(token, postId, !isCurrentlyLiked);

      if (!response.success) {
        // Revert on failure
        console.error("Failed to toggle like:", response.error);
        setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on exception
      setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
    }
  };

  // Format date for comments
  const formatCommentDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate if the comment button should be disabled
  const isCommentButtonDisabled = (postId: string): boolean => {
    const input = getCommentInput(postId);
    return isSubmittingComment(postId) || input.trim() === "";
  };

  // Helper function to safely get comments for a post
  const getComments = (postId: string): PostComment[] => {
    if (!postComments[postId]) {
      return [];
    }
    return postComments[postId];
  };

  // Helper function to safely get comment input for a post
  const getCommentInput = (postId: string): string => {
    return commentInputs[postId] || "";
  };

  // Helper function to check if a post's comment submission is in progress
  const isSubmittingComment = (postId: string): boolean => {
    return submittingComment[postId] || false;
  };

  const handleScroll = (e: Event) => {
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
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
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
            width="16"
            height="16"
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
        }}
      >
        <div
          style={{
            padding: "16px",
          }}
        >
          {posts.length > 0 ? (
            posts.map((post) => {
              const author = getAuthorInfo(post);
              const postImage = getPostImage(post);
              const isLiked = likedPosts[post.id] || false;

              return (
                <div
                  key={post.id}
                  className="nownownow-widget-post-item"
                  data-post-id={post.id}
                  style={{
                    marginBottom: "24px",
                    paddingBottom: "16px",
                    borderBottom: isDark
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Author and timestamp */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: isDark ? "#1e1e1e" : "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isDark ? "#e5e7eb" : "#4b5563",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      {author.image ? (
                        <img
                          src={author.image}
                          alt={author.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        getAvatarFallback(author.name)
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: isDark ? "white" : "black",
                      }}
                    >
                      {author.name}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: isDark ? "#9ca3af" : "#6b7280",
                      }}
                    >
                      • {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>

                  {/* Post content */}
                  {post.title && (
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        margin: "0 0 8px 0",
                        color: isDark ? "white" : "black",
                      }}
                    >
                      {post.title}
                    </h3>
                  )}

                  {/* Use renderContent for proper markdown rendering */}
                  {renderContent(post.content, isDark)}

                  {/* Post image if available */}
                  {postImage && (
                    <img
                      src={postImage}
                      alt="Post media"
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    />
                  )}

                  {/* Post engagement section */}
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", gap: "16px" }}>
                      {/* Comment button */}
                      <button
                        onClick={() => toggleComments(post.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "none",
                          border: "none",
                          padding: "0",
                          cursor: "pointer",
                          color: showComments[post.id]
                            ? "#3b82f6"
                            : isDark
                            ? "#9ca3af"
                            : "#6b7280",
                          fontSize: "12px",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={
                            showComments[post.id]
                              ? "rgba(59, 130, 246, 0.1)"
                              : "none"
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36074 14.891 4 16.1272V21L8.87279 20C9.99849 20.6177 10.9607 21 12 21Z" />
                        </svg>
                        {post._count?.comments || 0}
                      </button>

                      {/* Like button */}
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "none",
                          border: "none",
                          padding: "0",
                          cursor: "pointer",
                          color: likedPosts[post.id]
                            ? "#f43f5e"
                            : isDark
                            ? "#9ca3af"
                            : "#6b7280",
                          fontSize: "12px",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={likedPosts[post.id] ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {post._count?.likes || 0}
                      </button>

                      {/* View counter (not a button) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: isDark ? "#9ca3af" : "#6b7280",
                          fontSize: "12px",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        {post._count?.views || 0}
                      </div>
                    </div>
                  </div>

                  {/* Comments section */}
                  {showComments[post.id] && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px",
                        background: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.02)",
                        borderRadius: "8px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          margin: "0 0 12px 0",
                          color: isDark ? "#e5e7eb" : "#4b5563",
                        }}
                      >
                        Comments
                      </h4>

                      {/* Comments list */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        {loadingComments[post.id] ? (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: isDark ? "#9ca3af" : "#6b7280",
                            }}
                          >
                            Loading comments...
                          </div>
                        ) : getComments(post.id).length > 0 ? (
                          getComments(post.id).map((comment: PostComment) => {
                            const commentAuthor = comment.user?.name || "User";
                            const commentAuthorImage =
                              comment.user?.image || null;

                            return (
                              <div
                                key={comment.id}
                                style={{
                                  padding: "8px",
                                  borderRadius: "6px",
                                  background: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "white",
                                  border: isDark
                                    ? "1px solid rgba(255,255,255,0.03)"
                                    : "1px solid rgba(0,0,0,0.05)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "50%",
                                      overflow: "hidden",
                                      background: isDark
                                        ? "#1e1e1e"
                                        : "#f3f4f6",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: isDark ? "#e5e7eb" : "#4b5563",
                                      fontSize: "8px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {commentAuthorImage ? (
                                      <img
                                        src={commentAuthorImage}
                                        alt={commentAuthor}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      getAvatarFallback(commentAuthor)
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 500,
                                      color: isDark ? "white" : "black",
                                    }}
                                  >
                                    {commentAuthor}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: isDark ? "#9ca3af" : "#6b7280",
                                    }}
                                  >
                                    {formatCommentDate(comment.createdAt)}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: isDark ? "#e5e7eb" : "#4b5563",
                                    lineHeight: "1.4",
                                  }}
                                >
                                  {comment.content}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: isDark ? "#9ca3af" : "#6b7280",
                            }}
                          >
                            No comments yet. Be the first to comment!
                          </div>
                        )}
                      </div>

                      {/* Comment input */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          value={getCommentInput(post.id)}
                          onChange={(e) =>
                            handleCommentInputChange(
                              post.id,
                              e.currentTarget.value
                            )
                          }
                          placeholder="Add a comment..."
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid rgba(0,0,0,0.1)",
                            background: isDark
                              ? "rgba(255,255,255,0.05)"
                              : "white",
                            color: isDark ? "white" : "black",
                            fontSize: "12px",
                          }}
                        />
                        <button
                          onClick={() => submitComment(post.id)}
                          disabled={isCommentButtonDisabled(post.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#3b82f6",
                            color: "white",
                            fontSize: "12px",
                            cursor: isCommentButtonDisabled(post.id)
                              ? "not-allowed"
                              : "pointer",
                            opacity: isCommentButtonDisabled(post.id) ? 0.5 : 1,
                          }}
                        >
                          {isSubmittingComment(post.id) ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  )}
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
          padding: "12px",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(0,0,0,0.05)",
          background: isDark ? "#121212" : "white",
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
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                overflow: "hidden",
                background: isDark ? "#1e1e1e" : "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isDark ? "#e5e7eb" : "#4b5563",
                fontSize: "12px",
                fontWeight: "bold",
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
            <span
              style={{
                fontSize: "12px",
                color: isDark ? "white" : "black",
              }}
            >
              {orgInfo?.name || "Organization"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              {(orgInfo as any)?._count?.followers || 0} followers
            </div>
            <button
              onClick={() => setExpandedFeedback(!expandedFeedback)}
              style={{
                display: "flex",
                alignItems: "center",
                background: "transparent",
                border: "none",
                fontSize: "12px",
                color: "#3b82f6",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Feedback
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
        </div>

        {/* Feedback form */}
        {expandedFeedback && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              background: isDark ? "#1e1e1e" : "rgba(0,0,0,0.02)",
              borderRadius: "8px",
            }}
          >
            <form
              onSubmit={handleFeedbackSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
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
                  padding: "8px",
                  borderRadius: "6px",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(0,0,0,0.1)",
                  background: isDark ? "#2a2a2a" : "white",
                  color: isDark ? "white" : "black",
                  fontSize: "12px",
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
                    gap: "4px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    opacity: isSubmitting || !feedback.trim() ? 0.5 : 1,
                  }}
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
