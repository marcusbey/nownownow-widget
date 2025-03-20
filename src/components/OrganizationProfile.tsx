import { FunctionComponent } from "preact";

type Theme = "light" | "dark";
type ActiveTab = "feed" | "feedback";

interface OrgInfo {
  id: string;
  name: string;
  image?: string | null;
  bannerImage?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
  _count?: {
    followers: number;
  } | null;
}

interface OrganizationProfileProps {
  orgInfo: OrgInfo | null;
  theme?: Theme;
  activeTab?: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
}

// No longer needed as we're using initials from the name split

const getFollowerCount = (
  count: { followers: number } | null | undefined
): number => count?.followers ?? 0;

// Updated gradient banner images for a more elegant and modern look
const DEFAULT_BANNERS = [
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?q=80&w=2000&auto=format&fit=crop",
];

export const OrganizationProfile: FunctionComponent<
  OrganizationProfileProps
> = ({ orgInfo, theme = "light", activeTab = "feed", onTabChange }) => {
  if (!orgInfo) return null;

  const isDark = theme === "dark";
  const initials = orgInfo.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const followerCount = getFollowerCount(orgInfo._count);

  // Get a random default banner based on org ID for consistent display
  const getDefaultBanner = () => {
    // Use the org ID to generate a consistent index for the org
    const charSum = orgInfo.id
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const index = charSum % DEFAULT_BANNERS.length;
    return DEFAULT_BANNERS[index];
  };

  const bannerUrl = orgInfo.bannerImage || getDefaultBanner();

  // Format website URL for display
  const formatWebsiteUrl = (url: string): string => {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div
      className={`nownownow-widget-org-profile ${
        isDark ? "nownownow-widget-dark" : ""
      }`}
      style={{
        borderRadius: "16px 16px 0 0",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 4px 20px rgba(0, 0, 0, 0.2)"
          : "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Gradient banner with subtle animation */}
      <div
        className="nownownow-widget-org-banner"
        style={{
          backgroundImage: `url(${bannerUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          height: "160px",
          position: "relative",
          transition: "transform 0.3s ease-out",
        }}
      >
        <div
          className="nownownow-widget-org-banner-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark
              ? "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(18, 18, 18, 0.85))"
              : "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.7))",
            backdropFilter: "blur(2px)",
          }}
        ></div>
      </div>

      {/* Profile header with improved layout */}
      <div
        className="nownownow-widget-org-header"
        style={{
          padding: "0 20px 20px",
          marginTop: "-60px",
          position: "relative",
          zIndex: 2,
          background: isDark ? "#121212" : "white",
        }}
      >
        <div
          className="nownownow-widget-org-avatar"
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            background: isDark ? "#1e1e1e" : "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: isDark ? "3px solid #121212" : "3px solid white",
            transition: "transform 0.2s ease",
          }}
        >
          {orgInfo.image ? (
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
            <span
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: isDark ? "#e5e7eb" : "#4b5563",
              }}
            >
              {initials}
            </span>
          )}
        </div>
        <div className="nownownow-widget-org-info">
          <h2
            className="nownownow-widget-org-name"
            style={{
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "4px",
              color: isDark ? "white" : "black",
            }}
          >
            {orgInfo.name}
          </h2>
          {orgInfo.bio && (
            <p
              className="nownownow-widget-org-bio"
              style={{
                fontSize: "14px",
                lineHeight: "1.4",
                marginBottom: "12px",
                color: isDark ? "#9ca3af" : "#4b5563",
              }}
            >
              {orgInfo.bio}
            </p>
          )}

          <div
            className="nownownow-widget-org-meta"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              fontSize: "13px",
            }}
          >
            {orgInfo.websiteUrl && (
              <a
                href={orgInfo.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nownownow-widget-org-website"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: isDark ? "#60a5fa" : "#2563eb",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: "14px", height: "14px" }}
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                {formatWebsiteUrl(orgInfo.websiteUrl)}
              </a>
            )}

            {followerCount > 0 && (
              <div
                className="nownownow-widget-org-followers"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: "14px", height: "14px" }}
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {followerCount.toLocaleString()} followers
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Redesigned tab navigation */}
      <div
        className="nownownow-widget-tab-nav"
        style={{
          display: "flex",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.05)",
          background: isDark ? "#121212" : "white",
        }}
      >
        <div
          className={`nownownow-widget-tab ${
            activeTab === "feed" ? "active" : ""
          }`}
          onClick={() => handleTabChange("feed")}
          style={{
            flex: 1,
            padding: "14px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: activeTab === "feed" ? "600" : "500",
            color:
              activeTab === "feed"
                ? isDark
                  ? "white"
                  : "black"
                : isDark
                ? "#9ca3af"
                : "#6b7280",
            borderBottom:
              activeTab === "feed"
                ? isDark
                  ? "2px solid #60a5fa"
                  : "2px solid #3b82f6"
                : "2px solid transparent",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "16px", height: "16px" }}
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Feed
        </div>
        <div
          className={`nownownow-widget-tab ${
            activeTab === "feedback" ? "active" : ""
          }`}
          onClick={() => handleTabChange("feedback")}
          style={{
            flex: 1,
            padding: "14px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: activeTab === "feedback" ? "600" : "500",
            color:
              activeTab === "feedback"
                ? isDark
                  ? "white"
                  : "black"
                : isDark
                ? "#9ca3af"
                : "#6b7280",
            borderBottom:
              activeTab === "feedback"
                ? isDark
                  ? "2px solid #60a5fa"
                  : "2px solid #3b82f6"
                : "2px solid transparent",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "16px", height: "16px" }}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Feedback
        </div>
      </div>
    </div>
  );
};
