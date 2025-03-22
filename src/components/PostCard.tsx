import type { FunctionComponent } from "preact";
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";
import type { WidgetPost } from "../types/api";
import { MediaDisplay, type MediaItem } from "./MediaDisplay";

interface PostCardProps {
  post?: WidgetPost;
  content: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  theme?: "light" | "dark";
  onClick?: () => void;
  token?: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? "1 minute ago"
      : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sanitizeHtml(html: string): string {
  // Simple sanitization to prevent script injection
  return html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
}

function processHashtags(content: string): h.JSX.Element {
  const words = content.split(/(\s+)/);

  return (
    <span>
      {words.map((word, index) => {
        if (word.match(/^#[\w-]+/)) {
          return (
            <a
              key={index}
              href="#"
              className="nownownow-widget-hashtag"
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s ease",
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
}

function renderContent(content: string, isDark: boolean): h.JSX.Element {
  // If the content appears to be HTML, render it as HTML
  if (content.includes("<") && content.includes(">")) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        className="nownownow-widget-post-content"
        style={{
          fontSize: "15px",
          lineHeight: "1.5",
          color: isDark ? "white" : "black",
        }}
      />
    );
  }

  // Otherwise, handle it as plain text with hashtag formatting
  return (
    <div
      className="nownownow-widget-post-content"
      style={{
        fontSize: "15px",
        lineHeight: "1.5",
        color: isDark ? "white" : "black",
      }}
    >
      {processHashtags(content)}
    </div>
  );
}

export const PostCard: FunctionComponent<PostCardProps> = ({
  post,
  content,
  createdAt,
  likes = 0,
  comments = 0,
  theme = "light",
  token,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  // Set up intersection observer to track when post is viewed
  useEffect(() => {
    if (!post?.id || viewTracked || !token) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If post becomes visible and view hasn't been tracked yet
        if (entries[0]?.isIntersecting && !viewTracked) {
          // Track the post view
          api
            .trackPostView(token, post.id)
            .then(() => {
              console.log(`View tracked for post ${post.id}`);
              setViewTracked(true);
            })
            .catch((error) => {
              console.error("Failed to track post view:", error);
            });
        }
      },
      {
        threshold: 0.5, // Consider post viewed when 50% visible
        rootMargin: "0px",
      }
    );

    // Start observing the post element
    if (postRef.current) {
      observer.observe(postRef.current);
    }

    // Clean up observer on unmount
    return () => {
      observer.disconnect();
    };
  }, [post?.id, viewTracked, token]);

  // Check if the post has media
  const hasMedia = post?.media && post?.media.length > 0;

  // For backwards compatibility, also check attachments
  const hasAttachments = post?.attachments && post?.attachments.length > 0;

  // Convert attachments to media format if needed
  const mediaItems: MediaItem[] = hasMedia
    ? (post.media as MediaItem[])
    : hasAttachments
    ? (post.attachments?.map((att) => ({
        id: att.url, // Use URL as ID if no ID is available
        url: att.url,
        type: att.type,
      })) as MediaItem[]) || []
    : [];

  const handleCommentsToggle = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent the click from bubbling up
    setShowComments(!showComments);
  };

  const handleLikeToggle = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent the click from bubbling up
    setIsLiked(!isLiked);
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

  // Get author info - only use user field since author field doesn't exist in the database
  const authorName = post?.user?.name || "User";
  const authorImage = post?.user?.image || null;

  // Default avatar letter if no image is available
  const getInitial = (name?: string): string => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div
      ref={postRef}
      className={`nownownow-widget-post ${
        isDark ? "nownownow-widget-post-dark" : ""
      }`}
      style={{
        position: "relative",
        margin: "16px 0",
        padding: "16px",
        borderRadius: "12px",
        background: isDark ? "#121212" : "white",
        boxShadow: isDark
          ? "0 4px 12px rgba(0, 0, 0, 0.1)"
          : "0 4px 12px rgba(0, 0, 0, 0.05)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        border: isDark
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      <div
        className="nownownow-widget-post-header"
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          className="nownownow-widget-post-author"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            className="nownownow-widget-post-avatar"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isDark ? "#1e1e1e" : "#f3f4f6",
              color: isDark ? "#e5e7eb" : "#4b5563",
              fontWeight: "bold",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorName}
                className="nownownow-widget-avatar-img"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              getInitial(authorName)
            )}
          </div>
          <div className="nownownow-widget-post-author-info">
            <div
              className="nownownow-widget-post-author-name"
              style={{
                fontWeight: "600",
                fontSize: "15px",
                color: isDark ? "white" : "black",
                marginBottom: "2px",
              }}
            >
              {authorName}
            </div>
            <div
              className="nownownow-widget-post-time"
              style={{
                fontSize: "13px",
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              {formatTimeAgo(createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div
        className="nownownow-widget-post-body"
        style={{
          marginBottom: "16px",
        }}
      >
        {post?.title && (
          <h3
            className="nownownow-widget-post-title"
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "8px",
              color: isDark ? "white" : "black",
            }}
          >
            {post.title}
          </h3>
        )}

        {renderContent(content, isDark)}

        {/* If post has media */}
        {(hasMedia || hasAttachments) && (
          <div
            style={{
              marginTop: "12px",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <MediaDisplay media={mediaItems} isDark={isDark} />
          </div>
        )}
      </div>

      <div
        className="nownownow-widget-post-stats"
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          padding: "8px 0",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <button
          className="nownownow-widget-post-stat nownownow-widget-post-likes"
          onClick={handleLikeToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: isLiked ? "#f43f5e" : isDark ? "#9ca3af" : "#6b7280",
            background: "transparent",
            border: "none",
            padding: "6px 8px",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 0.2s ease",
              transform: isLiked ? "scale(1.15)" : "scale(1)",
            }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span style={{ fontSize: "14px" }}>
            {isLiked ? likes + 1 : likes}
          </span>
        </button>

        <button
          className="nownownow-widget-post-stat nownownow-widget-post-comments"
          onClick={handleCommentsToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: showComments ? "#3b82f6" : isDark ? "#9ca3af" : "#6b7280",
            background: "transparent",
            border: "none",
            padding: "6px 8px",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={showComments ? "rgba(59, 130, 246, 0.1)" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span style={{ fontSize: "14px" }}>{comments}</span>
        </button>

        <button
          className="nownownow-widget-post-stat"
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
            color: isDark ? "#9ca3af" : "#6b7280",
            background: "transparent",
            border: "none",
            padding: "6px 8px",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
      </div>

      {/* Comments section (expanded when clicked) */}
      {showComments && (
        <div
          className="nownownow-widget-post-comments-section"
          style={{
            marginTop: "12px",
            padding: "12px",
            background: isDark ? "#1e1e1e" : "rgba(0,0,0,0.02)",
            borderRadius: "8px",
          }}
        >
          <h3
            className="nownownow-widget-comments-header"
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              color: isDark ? "#e5e7eb" : "#4b5563",
            }}
          >
            Comments
          </h3>

          <div className="nownownow-widget-comments-list">
            {post?.comments && post.comments.length > 0 ? (
              post.comments.map((comment: any) => {
                // Get comment author info - only use user field
                const commentAuthorName = comment.user?.name || "User";
                const commentAuthorImage = comment.user?.image || null;

                return (
                  <div
                    key={comment.id}
                    className="nownownow-widget-comment"
                    style={{
                      padding: "10px",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      background: isDark ? "#2a2a2a" : "white",
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.03)"
                        : "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      className="nownownow-widget-comment-header"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        className="nownownow-widget-comment-avatar"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isDark ? "#1e1e1e" : "#f3f4f6",
                          color: isDark ? "#e5e7eb" : "#4b5563",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        {commentAuthorImage ? (
                          <img
                            src={commentAuthorImage}
                            alt={commentAuthorName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitial(commentAuthorName)
                        )}
                      </div>
                      <div>
                        <div
                          className="nownownow-widget-comment-author"
                          style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color: isDark ? "white" : "black",
                          }}
                        >
                          {commentAuthorName}
                        </div>
                        <div
                          className="nownownow-widget-comment-time"
                          style={{
                            fontSize: "12px",
                            color: isDark ? "#9ca3af" : "#6b7280",
                          }}
                        >
                          {formatCommentDate(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div
                      className="nownownow-widget-comment-content"
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.4",
                        color: isDark ? "#e5e7eb" : "#4b5563",
                      }}
                    >
                      {comment.content}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="nownownow-widget-no-comments"
                style={{
                  padding: "12px",
                  textAlign: "center",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  fontSize: "14px",
                }}
              >
                No comments yet.
              </div>
            )}
          </div>

          <div
            className="nownownow-widget-comment-input"
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Add a comment..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(0,0,0,0.1)",
                background: isDark ? "#2a2a2a" : "white",
                color: isDark ? "white" : "black",
                outline: "none",
                fontSize: "14px",
              }}
            />
            <button
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(to right, #3b82f6, #60a5fa)",
                color: "white",
                fontWeight: "500",
                cursor: "pointer",
                fontSize: "14px",
                transition: "opacity 0.2s ease",
              }}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
