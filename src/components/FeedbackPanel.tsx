import { FunctionComponent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../services/apiService";
import type { FeedbackItem } from "../types/api";

interface FeedbackPanelProps {
  theme?: "light" | "dark";
  orgId: string;
  token: string;
}

export const FeedbackPanel: FunctionComponent<FeedbackPanelProps> = ({
  theme = "light",
  orgId,
  token,
}) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({});
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = email === "" || emailRegex.test(email);
  const isContentValid = content.length > 0 && content.length <= 1000;
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const isDark = theme === "dark";

  // Load feedback on component mount and when page changes
  useEffect(() => {
    fetchFeedback();
  }, [currentPage]);

  const fetchFeedback = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getFeedback(
        token,
        orgId,
        currentPage,
        pageSize
      );

      if (response.success && response.data) {
        setFeedback(response.data.feedback || []);
        setTotalPages(response.data.pagination.pages || 1);
      } else {
        setError(response.error || "Failed to load feedback");
      }
    } catch (err) {
      setError("An error occurred while loading feedback");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!isContentValid) {
      setError("Please enter valid feedback (1-1000 characters)");
      return;
    }

    if (email && !isEmailValid) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.submitFeedback(token, {
        content,
        email: email || null,
        organizationId: orgId,
      });

      if (response.success) {
        setContent("");
        setEmail("");
        setSuccessMessage("Thank you for your feedback!");

        // Refresh feedback list
        fetchFeedback();

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
          setShowSubmitForm(false);
        }, 3000);
      } else {
        setError(response.error || "Failed to submit feedback");
      }
    } catch (err) {
      setError("An error occurred while submitting feedback");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (feedbackId: string) => {
    // Prevent double-clicking
    if (isVoting[feedbackId]) return;

    setIsVoting((prev) => ({ ...prev, [feedbackId]: true }));

    try {
      const response = await api.voteFeedback(token, {
        feedbackId,
        organizationId: orgId,
      });

      if (response.success) {
        // Update the feedback item with new vote count
        setFeedback((prev) =>
          prev.map((item) =>
            item.id === feedbackId
              ? {
                  ...item,
                  votes: response.data.feedback.votes,
                  hasVoted: true,
                }
              : item
          )
        );
      } else {
        setError(response.error || "Failed to vote on feedback");
      }
    } catch (err) {
      setError("An error occurred while voting");
      console.error(err);
    } finally {
      // Remove voting state after a short delay
      setTimeout(() => {
        setIsVoting((prev) => ({ ...prev, [feedbackId]: false }));
      }, 300);
    }
  };

  const statusColors: Record<string, string> = {
    NEW: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700",
    ACKNOWLEDGED: isDark
      ? "bg-blue-800 text-blue-200"
      : "bg-blue-100 text-blue-700",
    IN_PROGRESS: isDark
      ? "bg-yellow-800 text-yellow-200"
      : "bg-yellow-100 text-yellow-700",
    COMPLETED: isDark
      ? "bg-green-800 text-green-200"
      : "bg-green-100 text-green-700",
    REJECTED: isDark ? "bg-red-800 text-red-200" : "bg-red-100 text-red-700",
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleNewFeedbackClick = () => {
    setShowSubmitForm(true);
    // Focus the textarea after a small delay to allow rendering
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
      }
    }, 50);
  };

  const renderStatusBadge = (status: string) => (
    <span
      className={`text-xs px-2 py-1 rounded-full inline-block ${
        statusColors[status] || statusColors.NEW
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );

  return (
    <div
      className={`nownownow-widget-feedback-panel ${
        isDark ? "nownownow-widget-dark" : ""
      }`}
    >
      <div className="nownownow-widget-feedback-header">
        <h2 className="nownownow-widget-feedback-title">Feedback</h2>
        <button
          onClick={handleNewFeedbackClick}
          className={`nownownow-widget-feedback-new-btn ${
            isDark ? "nownownow-widget-btn-dark" : ""
          }`}
          disabled={isSubmitting}
        >
          {showSubmitForm ? "Cancel" : "Submit Feedback"}
        </button>
      </div>

      {error && (
        <div className="nownownow-widget-feedback-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nownownow-widget-feedback-error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="nownownow-widget-feedback-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nownownow-widget-feedback-success-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {successMessage}
        </div>
      )}

      {showSubmitForm && (
        <form
          className="nownownow-widget-feedback-form"
          onSubmit={handleSubmit}
        >
          <div className="nownownow-widget-feedback-form-field">
            <label className="nownownow-widget-feedback-label">
              Your Feedback (required)
            </label>
            <textarea
              ref={contentRef}
              className={`nownownow-widget-feedback-textarea ${
                content.length > 1000
                  ? "nownownow-widget-feedback-input-error"
                  : ""
              }`}
              value={content}
              onInput={(e) =>
                setContent((e.target as HTMLTextAreaElement).value)
              }
              rows={5}
              placeholder="Share your thoughts, suggestions, or report issues..."
            ></textarea>
            {content.length > 1000 && (
              <div className="nownownow-widget-feedback-input-error-text">
                Feedback is too long (max 1000 characters)
              </div>
            )}
            <div className="nownownow-widget-feedback-char-count">
              {content.length}/1000
            </div>
          </div>

          <div className="nownownow-widget-feedback-form-field">
            <label className="nownownow-widget-feedback-label">
              Email (optional)
            </label>
            <input
              type="email"
              className={`nownownow-widget-feedback-input ${
                !isEmailValid ? "nownownow-widget-feedback-input-error" : ""
              }`}
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              placeholder="Your email for follow-ups (optional)"
            />
            {!isEmailValid && (
              <div className="nownownow-widget-feedback-input-error-text">
                Please enter a valid email address
              </div>
            )}
          </div>

          <div className="nownownow-widget-feedback-form-actions">
            <button
              type="button"
              className="nownownow-widget-feedback-cancel-btn"
              onClick={() => {
                setShowSubmitForm(false);
                setContent("");
                setEmail("");
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="nownownow-widget-feedback-submit-btn"
              disabled={isSubmitting || !isContentValid || !isEmailValid}
            >
              {isSubmitting ? (
                <span className="nownownow-widget-feedback-submitting">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="nownownow-widget-feedback-spinner"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="nownownow-widget-feedback-spinner-circle"
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      strokeWidth="4"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      )}

      <div className="nownownow-widget-feedback-list">
        {isLoading ? (
          <div className="nownownow-widget-feedback-loading">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="nownownow-widget-feedback-loading-spinner"
              viewBox="0 0 24 24"
            >
              <circle
                className="nownownow-widget-feedback-loading-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="4"
              />
            </svg>
            Loading feedback...
          </div>
        ) : feedback.length === 0 ? (
          <div className="nownownow-widget-feedback-empty">
            No feedback yet. Be the first to share your thoughts!
          </div>
        ) : (
          <>
            {feedback.map((item) => (
              <div key={item.id} className="nownownow-widget-feedback-item">
                <div className="nownownow-widget-feedback-item-header">
                  <div>{renderStatusBadge(item.status)}</div>
                  <div className="nownownow-widget-feedback-item-date">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <div className="nownownow-widget-feedback-item-content">
                  {item.content}
                </div>
                <div className="nownownow-widget-feedback-item-footer">
                  <button
                    onClick={() => handleVote(item.id)}
                    className={`nownownow-widget-feedback-vote-btn ${
                      item.hasVoted || isVoting[item.id]
                        ? "nownownow-widget-feedback-voted"
                        : ""
                    }`}
                    disabled={item.hasVoted || isVoting[item.id]}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="nownownow-widget-feedback-vote-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    {item.hasVoted ? "Upvoted" : "Upvote"} (
                    {item._count?.votes || 0})
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="nownownow-widget-feedback-pagination">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage <= 1}
                  className={`nownownow-widget-feedback-page-btn ${
                    currentPage <= 1
                      ? "nownownow-widget-feedback-page-disabled"
                      : ""
                  }`}
                >
                  Previous
                </button>
                <span className="nownownow-widget-feedback-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className={`nownownow-widget-feedback-page-btn ${
                    currentPage >= totalPages
                      ? "nownownow-widget-feedback-page-disabled"
                      : ""
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
