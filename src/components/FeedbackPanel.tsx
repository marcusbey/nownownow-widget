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
      className={`now-widget-feedback-panel ${isDark ? "now-widget-dark" : ""}`}
    >
      {/* Top bar with title and new feedback button */}
      <div className="now-widget-feedback-header">
        <h2 className="now-widget-feedback-title">Feedback</h2>
        <button
          className={`now-widget-feedback-new-btn ${
            isDark ? "now-widget-btn-dark" : ""
          }`}
          onClick={handleNewFeedbackClick}
          disabled={showSubmitForm}
        >
          {showSubmitForm ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="now-widget-feedback-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="now-widget-feedback-error-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="now-widget-feedback-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="now-widget-feedback-success-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Feedback submission form */}
      {showSubmitForm && (
        <form className="now-widget-feedback-form" onSubmit={handleSubmit}>
          <div className="now-widget-feedback-form-field">
            <label
              className="now-widget-feedback-label"
              htmlFor="feedback-content"
            >
              Your Feedback
            </label>
            <textarea
              id="feedback-content"
              ref={contentRef}
              className={`now-widget-feedback-textarea ${
                !isContentValid && content
                  ? "now-widget-feedback-input-error"
                  : ""
              }`}
              placeholder="What would you like to share? (1-1000 characters)"
              value={content}
              onInput={(e) =>
                setContent((e.target as HTMLTextAreaElement).value)
              }
              rows={4}
              maxLength={1000}
              required
            ></textarea>
            <div className="now-widget-feedback-char-count">
              {content.length}/1000
            </div>
          </div>

          <div className="now-widget-feedback-form-field">
            <label
              className="now-widget-feedback-label"
              htmlFor="feedback-email"
            >
              Email (optional)
            </label>
            <input
              type="email"
              id="feedback-email"
              className={`now-widget-feedback-input ${
                !isEmailValid ? "now-widget-feedback-input-error" : ""
              }`}
              placeholder="your@email.com (optional)"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            />
            {!isEmailValid && (
              <div className="now-widget-feedback-input-error-text">
                Please enter a valid email address
              </div>
            )}
          </div>

          <div className="now-widget-feedback-form-actions">
            <button
              type="button"
              className="now-widget-feedback-cancel-btn"
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
              className={`now-widget-feedback-submit-btn ${
                isDark ? "now-widget-btn-dark" : ""
              }`}
              disabled={
                isSubmitting ||
                !isContentValid ||
                !isEmailValid ||
                content.length === 0
              }
            >
              {isSubmitting ? (
                <span className="now-widget-feedback-submitting">
                  <svg
                    className="now-widget-feedback-spinner"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="now-widget-feedback-spinner-circle"
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      strokeWidth="3"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Feedback list */}
      <div className="now-widget-feedback-list">
        {isLoading ? (
          <div className="now-widget-feedback-loading">
            <svg
              className="now-widget-feedback-loading-spinner"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="now-widget-feedback-loading-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
              />
            </svg>
            Loading feedback...
          </div>
        ) : feedback.length === 0 ? (
          <div className="now-widget-feedback-empty">
            No feedback yet. Be the first to share your thoughts!
          </div>
        ) : (
          feedback.map((item) => (
            <div key={item.id} className="now-widget-feedback-item">
              <div className="now-widget-feedback-item-header">
                <div className="now-widget-feedback-item-date">
                  {formatDate(item.createdAt)}
                </div>
                {renderStatusBadge(item.status)}
              </div>
              <div className="now-widget-feedback-item-content">
                {item.content}
              </div>
              <div className="now-widget-feedback-item-footer">
                <button
                  className={`now-widget-feedback-vote-btn ${
                    item.hasVoted ? "now-widget-feedback-voted" : ""
                  } ${isDark ? "now-widget-btn-dark" : ""}`}
                  onClick={() => !item.hasVoted && handleVote(item.id)}
                  disabled={isVoting[item.id] || item.hasVoted}
                  aria-label={
                    item.hasVoted ? "Voted" : "Vote for this feedback"
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="now-widget-feedback-vote-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    {item.votes} {item.votes === 1 ? "vote" : "votes"}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="now-widget-feedback-pagination">
          <button
            className={`now-widget-feedback-page-btn ${
              currentPage === 1 ? "now-widget-feedback-page-disabled" : ""
            }`}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &larr; Previous
          </button>
          <div className="now-widget-feedback-page-info">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className={`now-widget-feedback-page-btn ${
              currentPage === totalPages
                ? "now-widget-feedback-page-disabled"
                : ""
            }`}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
