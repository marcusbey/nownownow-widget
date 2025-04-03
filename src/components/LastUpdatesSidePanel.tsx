"use client";

import type { FunctionComponent } from "preact";
import { Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";
import type { WidgetOrgInfo, WidgetPost, WidgetSubscriptionRequest } from "../types/api";
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
  const [expandedSubscribe, setExpandedSubscribe] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
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
        email: email.trim() || null,
        organizationId: orgId,
      });

      if (response.success) {
        setFeedback("");
        setFeedbackSuccess(true);

        // Auto-hide form after success
        setTimeout(() => {
          setExpandedFeedback(false);
          setFeedbackSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
    return;
  };

  // Handle subscription submission
  const handleSubscribeSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) return;

    try {
      setIsSubscribing(true);

      const request: WidgetSubscriptionRequest = {
        email: email.trim(),
        organizationId: orgId,
      };

      const response = await api.subscribeToWidget(token, request);

      if (response.success) {
        setEmail("");
        setSubscribeSuccess(true);

        // Auto-hide form after success
        setTimeout(() => {
          setExpandedSubscribe(false);
          setSubscribeSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
    } finally {
      setIsSubscribing(false);
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

  // Define responsive styles for the panel
  const panelStyles = `
    .panel-container {
      width: 100%;
      height: 100vh;
      background-color: var(--background);
      position: relative;
      display: flex;
      flex-direction: column;
      max-width: 600px;
      transition: max-width 0.3s ease;
    }
    
    @media (max-width: 768px) {
      .panel-container {
        max-width: 80vw;
      }
    }
    
    @media (max-width: 480px) {
      .panel-container {
        max-width: 80vw;
      }
    }
  `;

  return (
    <>
      <style>{panelStyles}</style>
      <div className="panel-container">
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

      {/* Footer - Enhanced Styling with Improved Padding and Margins */}
      <div className={`border-t border-border p-6 ${isDark ? 'bg-gray-900/95' : 'bg-gray-50/95'}`}>
        <div className="space-y-4">

          {/* Collapsible Subscribe Form */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedSubscribe ? "max-h-96 border-t pt-3 mt-3 border-border" : "max-h-0"
            }`}
          >
            {expandedSubscribe && (
              <div className="p-3">
                {subscribeSuccess ? (
                  <div className={`flex items-center justify-center p-4 ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'} rounded-lg`}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium">Thanks for subscribing!</span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubscribeSubmit}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onInput={(e) =>
                          setEmail((e.target as HTMLInputElement).value)
                        }
                        placeholder="Your email address"
                        className={`w-full px-3 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'} border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                        required
                      />
                      {/* Custom "Primary" Style Button */}
                      <button
                        type="submit"
                        disabled={isSubscribing || !email.trim() || !email.includes('@')}
                        className={`flex-shrink-0 h-9 px-3 flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isDark ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      >
                        {isSubscribing ? (
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          "Subscribe"
                        )}
                      </button>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} px-1`}>We'll send you updates about new posts and features.</p>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Feedback Form */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedFeedback ? "max-h-96 border-t pt-3 mt-3 border-border" : "max-h-0"
            }`}
          >
            {expandedFeedback && (
              <div className="p-3">
                {feedbackSuccess ? (
                  <div className={`flex items-center justify-center p-4 ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'} rounded-lg`}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium">Thanks for your feedback!</span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleFeedbackSubmit}
                    className="flex flex-col gap-4"
                  >
                    <div className={`flex items-center mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="text-xs font-medium">We value your feedback</span>
                    </div>
                    
                    {/* Email input field */}
                    <input
                      type="email"
                      value={email}
                      onInput={(e) =>
                        setEmail((e.target as HTMLInputElement).value)
                      }
                      placeholder="Your email address (optional)"
                      className={`w-full px-3 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-800/90 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'} border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                    />
                    
                    <textarea
                      value={feedback}
                      onInput={(e) =>
                        setFeedback((e.target as HTMLTextAreaElement).value)
                      }
                      placeholder="Share your thoughts or suggestions..."
                      className={`w-full px-3 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-800/90 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'} border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none min-h-[100px]`}
                      required
                      maxLength={500}
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{feedback.length} / 500 characters</span>
                      {/* Custom "Primary" Style Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !feedback.trim()}
                        className={`flex-shrink-0 h-9 px-3 flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isDark ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      >
                        {isSubmitting ? (
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ) : (
                          <Fragment>
                            Send Feedback
                            <svg
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
                          </Fragment>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Main footer - Enhanced spacing and borders */}
        <div className={`my-2 ${isDark ? 'border-t border-gray-800/80' : 'border-t full-h border-gray-200/80'}`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <img
                src={orgInfo?.image || (window.location.hostname === 'localhost' ? 'http://localhost:3000/logo.png' : 'https://nownownow.io/logo.png')}
                alt={orgInfo?.name || "Organization"}
                className="h-5 w-5 object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = isDark ? "/nownownow-logo-light.svg" : "/nownownow-logo-dark.svg";
                }}
              />
              <div className="text-xs">
                <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} font-medium`}>
                  {orgInfo?.name || "Updates"}
                </p>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Powered by{" "}
                  <a
                    href="https://nownownow.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    nownownow.io
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Follow on button with link to main app */}
              <a
                href={window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://nownownow.io'}
                target="_blank"
                rel="noopener noreferrer"
                className={`h-8 px-3 flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground ${isDark ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                Follow on
                <img
                  src={window.location.hostname === 'localhost' ? 'http://localhost:3000/logo.png' : 'https://nownownow.io/logo.png'}
                  alt="nownownow.io logo"
                  className="h-3.5 w-auto"
                />
              </a>
              {/* Enhanced Toggle Menu Button */}
              <button
                type="button"
                onClick={toggleFooterMenu}
                className={`h-8 w-8 flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isDark ? 
                  showFooterMenu ? 'bg-indigo-600/80 text-white border-indigo-700' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-indigo-600/50' : 
                  showFooterMenu ? 'bg-indigo-500/80 text-white border-indigo-400' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-indigo-100'} border shadow-sm`}
                aria-label="Toggle menu"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${
                    showFooterMenu ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Collapsible Footer Menu */}
          <div
            className={`overflow-hidden transition-all duration-300 ${showFooterMenu ? "max-h-96 mt-4" : "max-h-0"}`}
          >
            <div className={`space-y-3 p-4 rounded-lg ${isDark ? 'bg-gray-800/70' : 'bg-gray-100/70'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex space-x-3">
                {/* Subscribe Button */}
                <button
                  type="button"
                  className={`flex-1 h-9 px-3 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${expandedSubscribe ? 
                    (isDark ? 'bg-indigo-600/80 text-white border-indigo-700' : 'bg-indigo-500 text-white border-indigo-400') : 
                    (isDark ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300')}`}
                  onClick={() => {
                    setExpandedSubscribe(prev => !prev);
                    if (!expandedSubscribe) setExpandedFeedback(false);
                  }}
                >
                  {expandedSubscribe ? 'Close Subscribe' : 'Subscribe for Updates'}
                </button>
                
                {/* Feedback Button */}
                <button
                  type="button"
                  className={`flex-1 h-9 px-3 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${expandedFeedback ? 
                    (isDark ? 'bg-indigo-600/80 text-white border-indigo-700' : 'bg-indigo-500 text-white border-indigo-400') : 
                    (isDark ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300')}`}
                  onClick={() => {
                    setExpandedFeedback(prev => !prev);
                    if (!expandedFeedback) setExpandedSubscribe(false);
                  }}
                >
                  {expandedFeedback ? 'Close Feedback' : 'Send Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className={`absolute bottom-20 right-4 h-10 w-10 inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg ${isDark ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
    </div>
    </>
  );
};
