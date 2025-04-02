import DOMPurify from "dompurify";
import { Bookmark, Heart, MessageSquare } from "lucide-preact";
import * as markedLibrary from "marked";
import type { FunctionComponent } from "preact";
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";
import type { WidgetComment, WidgetPost } from "../types/api";
import { MediaDisplay, type MediaItem } from "./MediaDisplay";

// Initialize marked with options
markedLibrary.marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
  pedantic: false,
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

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return diffInMinutes === 1 ? "1m" : `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return diffInHours === 1 ? "1h" : `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1d";
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return diffInWeeks === 1 ? "1w" : `${diffInWeeks}w`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return diffInMonths === 1 ? "1mo" : `${diffInMonths}mo`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

function renderContent(content: string, isDark: boolean): h.JSX.Element {
  // First, check if content is already HTML (contains tags)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  
  let processedContent;
  if (isHtml) {
    // If it's already HTML, just sanitize it
    processedContent = sanitizeHtml(content);
  } else {
    // If it's markdown, parse it to HTML first
    const htmlContent = markedLibrary.marked.parse(content);
    processedContent = sanitizeHtml(htmlContent as string);
  }

  // For simple text without HTML tags, split by newlines and create paragraphs
  if (!isHtml && !processedContent.includes('<')) {
    return (
      <div className="space-y-2">
        {content
          .split("\n")
          .filter((line) => line.trim())
          .map((line, idx) => (
            <p
              key={idx}
              className={`text-sm mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {line.startsWith("-") || line.startsWith("•") ? (
                <span>
                  <span className="inline-block w-4">{line.charAt(0)}</span>
                  {line.substring(1)}
                </span>
              ) : (
                line
              )}
            </p>
          ))}
      </div>
    );
  }

  // For HTML content, use dangerouslySetInnerHTML
  return (
    <div 
      className={`prose prose-sm max-w-none ${
        isDark ? "prose-invert text-gray-300" : "text-gray-700"
      }`}
      style={{ 
        whiteSpace: "pre-wrap", 
        wordBreak: "break-word"
      }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

const formatImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (
    !imageUrl ||
    imageUrl === "" ||
    imageUrl === "null" ||
    imageUrl === "undefined"
  ) {
    return null;
  }
  
  // Handle already formatted URLs
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }
  
  // Handle protocol-relative URLs
  if (imageUrl.startsWith("//")) {
    return `https:${imageUrl}`;
  }
  
  // Handle relative and other URLs
  const apiBaseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://nownownow.io";
      
  return imageUrl.startsWith("/")
    ? `${apiBaseUrl}${imageUrl}`
    : `${apiBaseUrl}/${imageUrl}`;
};

const getInitial = (name?: string): string => {
  return name ? name.charAt(0).toUpperCase() : "U";
};

const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatTimelineDate = (
  dateString: string
): { month: string; day?: string } => {
  const date = new Date(dateString);
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate().toString();
  return { month, day };
};

export const PostCard: FunctionComponent<PostCardProps> = ({
  post,
  content,
  createdAt,
  likes = post?._count?.likes || 0,
  comments = post?._count?.comments || 0,
  theme = "light",
  token,
}) => {
  // Debug console log to track component rendering
  console.log('[DEBUG] PostCard rendering:', { postId: post?.id, content, createdAt });
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [postComments, setPostComments] = useState<WidgetComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [viewTracked, setViewTracked] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  /**
   * Track post views when the post becomes visible in the viewport
   * Using Intersection Observer API to detect visibility
   */
  useEffect(() => {
    // Skip if no post ID, already tracked, or no token
    if (!post?.id || viewTracked || !token) return;

    // Create an observer to detect when post is visible
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Only track view if post is visible and not already tracked
        if (entry?.isIntersecting && !viewTracked) {
          console.log(`Post ${post.id} is now visible, tracking view...`);
          
          // Call the API to track the view
          api
            .trackPostView(token, post.id)
            .then((response) => {
              if (response.success) {
                console.log(`View tracked successfully for post ${post.id}`);
                setViewTracked(true);
                // Unobserve after tracking to prevent duplicate views
                if (postRef.current) observer.unobserve(postRef.current);
              } else {
                console.error(`Failed to track view for post ${post.id}:`, response.error);
              }
            })
            .catch((error) => {
              console.error("Failed to track post view:", error);
            });
        }
      },
      { threshold: 0.5, rootMargin: "0px" } // 50% of post must be visible
    );

    // Start observing the post element
    if (postRef.current) {
      // Add data attribute for debugging
      postRef.current.setAttribute('data-post-id', post.id);
      observer.observe(postRef.current);
    }
    
    // Clean up observer when component unmounts
    return () => observer.disconnect();
  }, [post?.id, viewTracked, token]);

  useEffect(() => {
    setCurrentLikes(likes);
  }, [likes]);

  const loadCommentsFromPostData = () => {
    if (!post?.id) {
      setCommentError("Unable to identify the post");
      return;
    }
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      if (
        post.comments &&
        Array.isArray(post.comments) &&
        post.comments.length > 0
      ) {
        const formattedComments = post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.user?.id || "",
            name: comment.user?.name || "Anonymous",
            image: formatImageUrl(comment.user?.image),
          },
        }));
        setPostComments(formattedComments);
      } else if (post._count?.comments === 0) {
        setPostComments([]);
      } else if (!token) {
        setPostComments([]);
        setCommentError("Sign in to view comments");
      } else {
        fetchCommentsFromApi();
        return;
      }
    } catch (error) {
      console.error("Error loading comments from post data:", error);
      setCommentError("Unable to load comments");
    } finally {
      if (
        !token ||
        (post.comments && post.comments.length > 0) ||
        post._count?.comments === 0
      ) {
        setIsLoadingComments(false);
      }
    }
  };

  const fetchCommentsFromApi = async () => {
    if (!token || !post?.id) {
      setIsLoadingComments(false);
      setCommentError("Authentication required or Post ID missing");
      return;
    }

    console.log(`Making API request for comments for post ${post.id}`);
    setIsLoadingComments(true);
    setCommentError(null);

    try {
      const response = await api.getPostComments(token, post.id);
      if (response.success && response.data) {
        const responseData = response.data as any;
        let commentsData = [];
        if (Array.isArray(responseData)) commentsData = responseData;
        else if (responseData.data && Array.isArray(responseData.data))
          commentsData = responseData.data;
        else if (responseData.comments && Array.isArray(responseData.comments))
          commentsData = responseData.comments;

        const formattedComments = commentsData.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.user?.id || "",
            name: comment.user?.name || "Anonymous",
            image: formatImageUrl(comment.user?.image),
          },
        }));
        setPostComments(formattedComments);
      } else {
        console.error("API returned error loading comments:", response.error);
        setCommentError(
          response.error === "Unauthorized"
            ? "Sign in to view comments"
            : "No comments available"
        );
        setPostComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments from API:", error);
      setCommentError("Unable to load comments");
      setPostComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentsToggle = (e: MouseEvent) => {
    e.stopPropagation();
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    if (
      newShowComments &&
      post?.id &&
      postComments.length === 0 &&
      !isLoadingComments &&
      comments > 0
    ) {
      console.log(`Toggling comments for post ${post.id}, fetching if needed.`);
      loadCommentsFromPostData();
    }
  };

  const authorName = post?.user?.name || "Anonymous";
  const authorImage = formatImageUrl(post?.user?.image);
  const timelineDate = formatTimelineDate(createdAt);

  const hasMedia = post?.media && post?.media.length > 0;
  const hasAttachments = post?.attachments && post?.attachments.length > 0;
  // Process media items with proper type safety
  const mediaItems: MediaItem[] = hasMedia
    ? (post.media as MediaItem[])
    : hasAttachments && post.attachments
    ? (post.attachments.map((att) => ({
        id: att.url || '',
        url: att.url || '',
        type: att.type || 'unknown',
      })) as MediaItem[])
    : [];

  const handleImageError = (e: Event) => {
    const imgElement = e.currentTarget as HTMLImageElement;
    if (imgElement.dataset.retried === "true") {
      imgElement.style.display = "none";
      const parent = imgElement.parentElement;
      if (parent) {
        const initialSpan = parent.querySelector(
          ".avatar-initials"
        ) as HTMLElement;
        if (initialSpan) {
          initialSpan.style.display = "flex";
        } else {
          const span = document.createElement("span");
          span.textContent = getInitial(authorName);
          span.className =
            "avatar-initials w-full h-full flex items-center justify-center font-semibold";
          parent.appendChild(span);
        }
      }
      return;
    }

    // Try with a different URL format if the original fails
    if (imgElement.src.includes('?')) {
      // If URL already has parameters, try without them
      imgElement.src = imgElement.src.split('?')[0];
    } else if (authorImage) {
      // Type guard to ensure authorImage is a string
      const safeAuthorImage = typeof authorImage === 'string' ? authorImage : null;
      
      // Only proceed if we have a valid string
      if (safeAuthorImage && !imgElement.src.includes(safeAuthorImage)) {
        // Try the original authorImage if it's different and valid
        try {
          imgElement.src = safeAuthorImage;
        } catch (e) {
          console.error('Error setting image source:', e);
          imgElement.dataset.retried = "true";
        }
      } else {
        imgElement.dataset.retried = "true";
      }
    } else {
      // Mark as retried if all attempts fail
      imgElement.dataset.retried = "true";
      
      // Show initials instead
      imgElement.style.display = "none";
      const parent = imgElement.parentElement;
      if (parent) {
        const initialSpan = parent.querySelector(".avatar-initials") as HTMLElement;
        if (initialSpan) {
          initialSpan.style.display = "flex";
        } else {
          const span = document.createElement("span");
          span.textContent = getInitial(authorName);
          span.className = "avatar-initials w-full h-full flex items-center justify-center font-semibold";
          parent.appendChild(span);
        }
      }
    }
    
    console.warn(
      `Avatar image failed to load: ${imgElement.src}. Trying alternative or showing initials.`
    );
    imgElement.style.display = "none";
    const parent = imgElement.parentElement;
    if (parent) {
      const initialSpan = parent.querySelector(
        ".avatar-initials"
      ) as HTMLElement;
      if (initialSpan) initialSpan.style.display = "flex";
    }
  };

  const viewCount = post?._count?.views || 0;

  return (
    <div ref={postRef} className="flex mb-8 last:mb-0">
      <div
        className={`flex flex-col items-center mr-4 min-w-[40px] ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}
      >
        <div className="text-sm font-medium">{timelineDate.month}</div>
        {timelineDate.day && <div className="text-sm">{timelineDate.day}</div>}
        <div
          className="w-px flex-grow mt-2 relative overflow-hidden"
        >
          <div 
            className={`absolute inset-0 w-full h-full ${
              isDark 
                ? "bg-gradient-to-b from-gray-700 via-gray-600 to-transparent" 
                : "bg-gradient-to-b from-gray-300 via-gray-200 to-transparent"
            }`}
          ></div>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2 mb-1">
          <div
            className={`flex-shrink-0 w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold ${
              isDark ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-600"
            }`}
          >
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorName}
                className="w-full h-full object-cover"
                onError={handleImageError}
                crossOrigin="anonymous"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="avatar-initials flex items-center justify-center w-full h-full">
                {getInitial(authorName)}
              </span>
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {authorName}
          </span>
        </div>

        {post?.title && (
          <h3
            className={`text-base font-medium ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {post.title}
          </h3>
        )}

        {renderContent(content, isDark)}

        {(hasMedia || hasAttachments) && mediaItems.length > 0 && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <MediaDisplay media={mediaItems} isDark={isDark} />
          </div>
        )}

        <div
          className={`flex items-center justify-between text-xs pt-3 mt-1 ${
            isDark ? "text-gray-500" : "text-gray-500"
          }`}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCommentsToggle}
              className={`flex items-center space-x-1 transition-colors ${
                isDark 
                  ? `hover:text-gray-300 ${showComments ? "text-gray-300" : ""}` 
                  : `hover:text-gray-700 ${showComments ? "text-gray-700" : ""}`
              }`}
              aria-label="Show comments"
            >
              <MessageSquare size={12} className="w-3 h-3" />
              <span>{comments}</span>
            </button>
            <div className="flex items-center space-x-1">
              <Bookmark size={12} className="w-3 h-3" />
              {/* @ts-ignore: Property 'bookmarks' needs to be added to WidgetPost._count type definition */}
              <span>{post?._count?.bookmarks ?? 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart size={12} className="w-3 h-3" />
              <span>{currentLikes}</span>
            </div>
          </div>
          <div
            className="flex items-center space-x-1"
            title={`${viewCount} views`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-muted-foreground"
            >
              <rect x="3" y="12" width="4" height="8" fill="currentColor" />
              <rect x="10" y="8" width="4" height="12" fill="currentColor" />
              <rect x="17" y="16" width="4" height="4" fill="currentColor" />
            </svg>
            <span>{viewCount}</span>
          </div>
        </div>

        {showComments && (
          <div
            className={`mt-2 pt-2 border-t ${
              isDark ? "border-gray-800/50" : "border-gray-100/50"
            }`}
          >
            <h4
              className={`text-sm font-semibold mb-3 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Comments (
              {postComments.length > 0 ? postComments.length : comments})
            </h4>
            {isLoadingComments ? (
              <div
                className={`text-center py-4 text-sm ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Loading comments...
              </div>
            ) : commentError ? (
              <div
                className={`text-center py-4 text-sm ${
                  isDark ? "text-red-400" : "text-red-500"
                }`}
              >
                {commentError}
              </div>
            ) : postComments.length > 0 ? (
              <div className="space-y-3">
                {postComments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <div
                      className={`flex-shrink-0 w-7 h-7 rounded-md overflow-hidden flex items-center justify-center text-sm font-semibold ${
                        isDark
                          ? "bg-gray-700 text-gray-200"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {comment.user?.image ? (
                        <img
                          src={formatImageUrl(comment.user.image) ?? undefined}
                          alt={comment.user.name || "User"}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                          crossOrigin="anonymous"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="avatar-initials flex items-center justify-center w-full h-full">
                          {getInitial(comment.user?.name)}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex-1 p-2 rounded ${
                        isDark ? "bg-gray-900" : "bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            isDark ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {comment.user?.name || "User"}
                        </span>
                        <span
                          className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {formatCommentDate(comment.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments === 0 ? (
              <div
                className={`text-center py-4 text-sm ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                No comments yet.
              </div>
            ) : (
              <div
                className={`text-center py-4 text-sm ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Comments could not be loaded.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
