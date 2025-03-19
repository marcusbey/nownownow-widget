import type { FunctionComponent } from "preact";
import { h } from "preact";
import { useState } from "preact/hooks";
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
            <a key={index} href="#" className="nownownow-widget-hashtag">
              {word}
            </a>
          );
        }
        return <span key={index}>{word}</span>;
      })}
    </span>
  );
}

function renderContent(content: string): h.JSX.Element {
  // If the content appears to be HTML, render it as HTML
  if (content.includes("<") && content.includes(">")) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        className="nownownow-widget-post-content"
      />
    );
  }

  // Otherwise, handle it as plain text with hashtag formatting
  return (
    <div className="nownownow-widget-post-content">
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
}) => {
  const [showComments, setShowComments] = useState(false);
  const isDark = theme === "dark";

  // Log the entire post object for debugging
  console.log("PostCard rendering with post data:", post);
  console.log("User information from post:", {
    userId: post?.userId,
    user: post?.user,
    userImage: post?.user?.image,
    userName: post?.user?.name,
    userImagePresent: !!post?.user?.image,
  });

  // Check if the post has media
  const hasMedia = post?.media && post?.media.length > 0;
  
  // For backwards compatibility, also check attachments
  const hasAttachments = post?.attachments && post?.attachments.length > 0;
  
  // Convert attachments to media format if needed
  const mediaItems: MediaItem[] = hasMedia 
    ? post.media as MediaItem[] 
    : hasAttachments 
      ? post.attachments?.map((att) => ({
          id: att.url, // Use URL as ID if no ID is available
          url: att.url,
          type: att.type
        })) as MediaItem[] || [] 
      : [];

  const handleCommentsToggle = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent the click from bubbling up
    setShowComments(!showComments);
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
      className={`nownownow-widget-post ${
        isDark ? "nownownow-widget-post-dark" : ""
      }`}
    >
      <div className="nownownow-widget-post-header">
        <div className="nownownow-widget-post-author">
          <div className="nownownow-widget-post-avatar">
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorName}
                className="nownownow-widget-avatar-img"
              />
            ) : (
              getInitial(authorName)
            )}
          </div>
          <div className="nownownow-widget-post-author-info">
            <div className="nownownow-widget-post-author-name">
              {authorName}
            </div>
            <div className="nownownow-widget-post-time">
              {formatTimeAgo(createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="nownownow-widget-post-body">
        {post?.title && (
          <h3 className="nownownow-widget-post-title">{post.title}</h3>
        )}

        {renderContent(content)}

        {/* If post has media */}
        {(hasMedia || hasAttachments) && (
          <MediaDisplay 
            media={mediaItems} 
            isDark={isDark} 
          />
        )}
      </div>

      <div className="nownownow-widget-post-stats">
        <div className="nownownow-widget-post-stat nownownow-widget-post-likes">
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
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{likes}</span>
        </div>

        <div
          className="nownownow-widget-post-stat nownownow-widget-post-comments"
          onClick={handleCommentsToggle}
          style={{ cursor: "pointer" }}
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
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span>{comments}</span>
        </div>
      </div>

      {/* Comments section (expanded when clicked) */}
      {showComments && (
        <div className="nownownow-widget-post-comments-section">
          <h3 className="nownownow-widget-comments-header">Comments</h3>
          <div className="nownownow-widget-comments-list">
            {post?.comments && post.comments.length > 0 ? (
              post.comments.map((comment: any) => {
                // Get comment author info - only use user field
                const commentAuthorName = comment.user?.name || "User";
                const commentAuthorImage = comment.user?.image || null;

                return (
                  <div key={comment.id} className="nownownow-widget-comment">
                    <div className="nownownow-widget-comment-header">
                      <div className="nownownow-widget-comment-avatar">
                        {commentAuthorImage ? (
                          <img
                            src={commentAuthorImage}
                            alt={commentAuthorName}
                            className="nownownow-widget-avatar-img"
                          />
                        ) : (
                          commentAuthorName.charAt(0) || "U"
                        )}
                      </div>
                      <div className="nownownow-widget-comment-author">
                        {commentAuthorName}
                      </div>
                      <div className="nownownow-widget-comment-time">
                        {formatCommentDate(comment.createdAt)}
                      </div>
                    </div>
                    <div className="nownownow-widget-comment-content">
                      {comment.content}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="nownownow-widget-no-comments">No comments yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
