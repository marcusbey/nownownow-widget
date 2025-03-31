import DOMPurify from "dompurify";
import * as markedLibrary from "marked";
import type { FunctionComponent } from "preact";
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";
import type { WidgetComment, WidgetPost } from "../types/api";
import { MediaDisplay, type MediaItem } from "./MediaDisplay";

// Initialize marked with options
markedLibrary.marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Add <br> on line breaks
  async: false, // Always use synchronous operation
  pedantic: false, // Conform to markdown.pl (false = better specs)
});

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

  // Less than a minute
  if (diffInSeconds < 60) {
    return "Just now";
  }

  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1m" : `${diffInMinutes}m`;
  }

  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1h" : `${diffInHours}h`;
  }

  // Days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1d";
  if (diffInDays < 7) return `${diffInDays}d`;
  
  // Weeks
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1w" : `${diffInWeeks}w`;
  }
  
  // Months
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1mo" : `${diffInMonths}mo`;
  }
  
  // Years and weeks
  const diffInYears = Math.floor(diffInDays / 365);
  const remainingWeeks = Math.floor((diffInDays % 365) / 7);
  
  if (diffInYears === 1) {
    return remainingWeeks > 0 ? `1y ${remainingWeeks}w` : "1y";
  }
  
  return `${diffInYears}y`;
}

function sanitizeHtml(html: string): string {
  // Use DOMPurify for more comprehensive sanitization
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
      "type", // Allow type attribute for lists (ol type="1", etc.)
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
  // Configure marked options for better consistency with the main app
  markedLibrary.marked.setOptions({
    gfm: true,
    breaks: true,
    async: false,
  });

  // Convert markdown to HTML
  const htmlContent = markedLibrary.marked.parse(content);

  // Log the HTML for debugging
  console.log("Raw HTML from marked:", htmlContent);

  // Enhanced sanitization with class preservation for styling
  const sanitizedHtml = sanitizeHtml(htmlContent as string);

  // Log after sanitization
  console.log("Sanitized HTML:", sanitizedHtml);

  return (
    <div
      className="nownownow-widget-post-content markdown-content"
      style={{
        fontSize: "15px",
        lineHeight: "1.6",
        color: isDark ? "#e5e7eb" : "#1f2937",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxWidth: "100%", // Ensure content doesn't overflow
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
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
  const [postComments, setPostComments] = useState<WidgetComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [hasPreloadedComments, setHasPreloadedComments] = useState(false);
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
            .then((response) => {
              if (response.success) {
                console.log(`View tracked for post ${post.id}`);
                setViewTracked(true);
                // If we want to update the view count in real-time, we could do it here
                // But for now we'll just mark it as viewed
              }
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

  // Check for preloaded comments on component mount
  useEffect(() => {
    // If post has comments property with data, preload them
    if (post?.comments && Array.isArray(post.comments) && post.comments.length > 0) {
      console.log(`Post ${post.id} has ${post.comments.length} preloaded comments`);
      setHasPreloadedComments(true); // Mark that we have preloaded comments
    }
  }, [post?.id, post?.comments]);
  
  const handleCommentsToggle = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent the click from bubbling up
    
    // Toggle comments section
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    
    // Only load comments if they haven't been loaded yet
    if (newShowComments && post?.id && postComments.length === 0) {
      console.log(`Toggling comments for post ${post.id}`);
      loadCommentsFromPostData();
    }
  };
  
  // Function to load comments with optimized approach
  const loadCommentsFromPostData = () => {
    if (!post?.id) {
      console.error('Cannot load comments: missing post ID');
      setCommentError('Unable to identify the post');
      return;
    }
    
    setIsLoadingComments(true);
    setCommentError(null);
    
    try {
      // Priority 1: Use preloaded comments from post data if available
      if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
        console.log(`Using ${post.comments.length} preloaded comments for post ${post.id}`);
        
        // Format comments according to our expected structure
        const formattedComments = post.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.user?.id || '',
            name: comment.user?.name || 'Anonymous',
            image: formatImageUrl(comment.user?.image)
          }
        }));
        
        setPostComments(formattedComments);
      } 
      // Priority 2: If we know there are no comments, show empty array
      else if (post._count?.comments === 0) {
        console.log(`Post ${post.id} has no comments according to count`);
        setPostComments([]);
      }
      // Priority 3: If token is missing but we still need to show comments
      else if (!token) {
        console.log('No authentication token available for comments');
        setPostComments([]);
        setCommentError('No comments available');
      }
      // Priority 4: Last resort - fetch from API if we have everything we need
      else {
        console.log(`Fetching comments for post: ${post.id} with token available`);
        fetchCommentsFromApi();
        return; // Early return to avoid setting isLoadingComments to false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error loading comments from post data:', errorMessage);
      setCommentError('Unable to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  // Fallback function to fetch comments from the API if needed
  const fetchCommentsFromApi = async () => {
    if (!token || !post?.id) return;
    
    try {
      console.log(`Making API request for comments for post ${post.id}`);
      const response = await api.getPostComments(token, post.id);
      
      if (response.success && response.data) {
        // Handle the nested data structure from the API response
        const responseData = response.data as any;
        
        // Check different possible response formats
        let commentsData;
        if (Array.isArray(responseData)) {
          commentsData = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // This matches the API response structure from the post-comments endpoint
          commentsData = responseData.data;
        } else if (responseData.comments && Array.isArray(responseData.comments)) {
          commentsData = responseData.comments;
        } else {
          commentsData = [];
        }
        
        // Format the comments to match our expected structure
        const formattedComments = commentsData.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.user?.id || '',
            name: comment.user?.name || 'Anonymous',
            image: formatImageUrl(comment.user?.image)
          }
        }));
        
        console.log(`Received ${formattedComments.length} comments from API for post ${post.id}`);
        setPostComments(formattedComments);
      } else {
        console.error('API returned error:', response.error);
        setCommentError('No comments available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error fetching comments from API:', errorMessage);
      setCommentError('Unable to load comments');
    } finally {
      setIsLoadingComments(false);
    }
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
  
  // Properly format the image URL to ensure it loads correctly
  const formatImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    
    // For empty strings or placeholder values, return null
    if (imageUrl === '' || imageUrl === 'null' || imageUrl === 'undefined') {
      return null;
    }
    
    // If it's already an absolute URL, return it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Handle special case for data URLs (base64 encoded images)
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    // For avatar URLs that might be from an external service
    if (imageUrl.includes('gravatar.com') || imageUrl.includes('avatar')) {
      return imageUrl;
    }
    
    // Get the API base URL from the config
    const apiBaseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://nownownow.io';
    
    // If it's a relative URL starting with /, append the base URL
    if (imageUrl.startsWith('/')) {
      return `${apiBaseUrl}${imageUrl}`;
    }
    
    // For other formats, ensure we have a leading slash
    return `${apiBaseUrl}/${imageUrl}`;
  };
  
  const authorImage = formatImageUrl(post?.user?.image);

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
                crossOrigin="anonymous"
                className="nownownow-widget-avatar-img"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  // Hide the image
                  const imgElement = e.currentTarget as HTMLImageElement;
                  imgElement.style.display = 'none';
                  
                  // Try multiple approaches if we haven't already
                  if (!imgElement.dataset.retried && post?.user?.image) {
                    const originalImage = post.user.image;
                    const retryCount = parseInt(imgElement.dataset.retryCount || '0');
                    imgElement.dataset.retryCount = (retryCount + 1).toString();
                    
                    // Try different approaches based on retry count
                    let newSrc = '';
                    
                    if (retryCount === 0) {
                      // First retry: Try with nownownow.io domain
                      const baseUrl = 'https://nownownow.io';
                      newSrc = originalImage.startsWith('http') 
                        ? originalImage 
                        : `${baseUrl}${originalImage.startsWith('/') ? originalImage : `/${originalImage}`}`;
                    } else if (retryCount === 1) {
                      // Second retry: Try with app.nownownow.io domain
                      const baseUrl = 'https://app.nownownow.io';
                      newSrc = originalImage.startsWith('http') 
                        ? originalImage 
                        : `${baseUrl}${originalImage.startsWith('/') ? originalImage : `/${originalImage}`}`;
                    } else if (retryCount === 2 && originalImage.includes('/')) {
                      // Third retry: Try with just the filename
                      const fileName = originalImage.split('/').pop() || '';
                      newSrc = `https://nownownow.io/uploads/${fileName}`;
                    } else {
                      // Mark as fully retried if we've tried all approaches
                      imgElement.dataset.retried = 'true';
                      showInitials();
                      return;
                    }
                    
                    // Try the new source
                    imgElement.src = newSrc;
                    imgElement.style.display = 'block';
                    return;
                  }
                  
                  // If all retries failed, show initials
                  showInitials();
                  
                  // Helper function to show initials
                  function showInitials() {
                    const parent = imgElement.parentElement;
                    if (!parent) return;
                    
                    // Create initials element
                    const initialSpan = document.createElement('span');
                    initialSpan.textContent = getInitial(authorName);
                    initialSpan.className = 'avatar-initials';
                    
                    // Apply styles
                    Object.assign(initialSpan.style, {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      borderRadius: '50%'
                    });
                    
                    // Clear existing fallback content
                    Array.from(parent.children)
                      .filter(child => child !== imgElement && child.tagName.toLowerCase() === 'span')
                      .forEach(child => parent.removeChild(child));
                    
                    parent.appendChild(initialSpan);
                  }
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
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isLiked ? "rgba(239, 68, 68, 0.2)" : "none"}
            stroke={isLiked ? "#ef4444" : "currentColor"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 0.2s ease",
              transform: isLiked ? "scale(1.15)" : "scale(1)",
              opacity: 0.9
            }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span style={{ fontSize: "13px" }}>
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
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={showComments ? "rgba(59, 130, 246, 0.1)" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.9 }}
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span style={{ fontSize: "13px" }}>{comments}</span>
        </button>

        <div
          className="nownownow-widget-post-stat nownownow-widget-post-views"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "auto",
            color: isDark ? "#9ca3af" : "#6b7280",
            padding: "6px 8px",
            fontSize: "13px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span>
            {viewTracked 
              ? (post?._count?.views 
                ? `${post._count.views} ${post._count.views === 1 ? 'view' : 'views'}` 
                : "Viewed")
              : ""}
          </span>
        </div>
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
            {isLoadingComments ? (
              // Loading state
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
                Loading comments...
              </div>
            ) : commentError ? (
              // Error state
              <div
                style={{
                  padding: "12px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                <p style={{
                  color: isDark ? "#9ca3af" : "#6b7280"
                }}>
                  {commentError.includes('Sign in') ? 'No comments available' : commentError}
                </p>
              </div>
            ) : postComments.length > 0 ? (
              // Comments loaded successfully
              postComments.map((comment: WidgetComment) => (
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
                      {comment.user?.image ? (
                        <img
                          src={comment.user.image}
                          alt={comment.user.name || 'User'}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span>{getInitial(comment.user?.name || 'User')}</span>
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
                        {comment.user?.name || 'User'}
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
              ))
            ) : (
              // No comments
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

          {/* Comment input section removed as widget users can only read comments */}
        </div>
      )}
    </div>
  );
};
