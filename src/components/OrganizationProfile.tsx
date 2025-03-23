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

// Noise texture SVG for background
const noiseSvgUrl = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <filter id="noise" x="0" y="0">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
  </filter>
  <rect width="200" height="200" filter="url(#noise)" opacity="0.3"/>
</svg>
`)}`;

// Journal-themed decorative icons as SVG data URLs
const decorativeIcons = {
  paperclip: `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`
  )}`,
  pen: `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`
  )}`,
  bookmark: `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
  )}`,
  notebook: `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
  )}`,
};

export const OrganizationProfile: FunctionComponent<
  OrganizationProfileProps
> = ({ orgInfo, theme = "light", activeTab = "feed", onTabChange }) => {
  if (!orgInfo) return null;

  // Force dark theme
  const isDark = true;
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

  // Helper to detect mobile viewport for responsive design
  const getMobileStyles = () => {
    const mobileStyles = {
      bannerHeight: "80px",
      avatarSize: "60px",
      nameSize: "18px",
      bioSize: "13px",
      padding: "16px",
      leftPadding: "100px",
    };

    const desktopStyles = {
      bannerHeight: "100px",
      avatarSize: "70px",
      nameSize: "20px",
      bioSize: "14px",
      padding: "20px",
      leftPadding: "120px",
    };

    const mediaQuery = window.matchMedia("(max-width: 480px)");
    return mediaQuery.matches ? mobileStyles : desktopStyles;
  };

  // Get styles based on viewport
  const styles =
    typeof window !== "undefined"
      ? getMobileStyles()
      : {
          bannerHeight: "100px",
          avatarSize: "70px",
          nameSize: "20px",
          bioSize: "14px",
          padding: "20px",
          leftPadding: "120px",
        };

  // Mock stats (replace with actual data when available)
  const stats = {
    posts: 42,
    followers: followerCount,
    following: 125,
  };

  return (
    <div
      className={`nownownow-widget-org-profile nownownow-widget-dark`}
      style={{
        overflow: "hidden",
        background: "#111827",
        backgroundImage: `url(${noiseSvgUrl})`,
        fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
        position: "relative",
      }}
    >
      {/* Decorative icons */}
      <div
        style={{
          position: "absolute",
          right: "5%",
          top: "15%",
          width: "24px",
          height: "24px",
          opacity: 0.2,
          backgroundImage: `url(${decorativeIcons.paperclip})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "15%",
          bottom: "25%",
          width: "32px",
          height: "32px",
          opacity: 0.15,
          backgroundImage: `url(${decorativeIcons.pen})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          zIndex: 1,
          pointerEvents: "none",
          transform: "rotate(15deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "10%",
          bottom: "15%",
          width: "28px",
          height: "28px",
          opacity: 0.2,
          backgroundImage: `url(${decorativeIcons.bookmark})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Banner container */}
      <div
        className="nownownow-widget-banner-container"
        style={{
          position: "relative",
        }}
      >
        {/* Banner with overlay to ensure content visibility */}
        <div
          className="nownownow-widget-org-banner"
          style={{
            backgroundImage: `url(${bannerUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: styles.bannerHeight,
            position: "relative",
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
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(17, 24, 39, 0.98))",
              backdropFilter: "blur(1px)",
            }}
          ></div>
        </div>

        {/* Avatar - positioned to overlap banner and content */}
        <div
          className="nownownow-widget-org-avatar"
          style={{
            width: styles.avatarSize,
            height: styles.avatarSize,
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
            background: "#1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #111827",
            position: "absolute",
            left: "20px",
            bottom: `calc(-${styles.avatarSize} / 2)`,
            zIndex: 2,
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
                fontSize: styles.avatarSize === "60px" ? "22px" : "26px",
                fontWeight: "bold",
                color: "#e5e7eb",
              }}
            >
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Profile content - below banner with name/bio pushed right */}
      <div
        className="nownownow-widget-profile-content"
        style={{
          padding: styles.padding,
          paddingLeft: styles.leftPadding,
          background: "#111827",
          backgroundImage: `url(${noiseSvgUrl})`,
        }}
      >
        <h2
          className="nownownow-widget-org-name"
          style={{
            fontSize: styles.nameSize,
            fontWeight: "600",
            margin: "0 0 4px 0",
            color: "white",
            fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
            letterSpacing: "0.5px",
          }}
        >
          {orgInfo.name}
        </h2>

        {/* Bio with max height and overflow handling */}
        {orgInfo.bio && (
          <p
            className="nownownow-widget-org-bio"
            style={{
              fontSize: styles.bioSize,
              lineHeight: "1.5",
              margin: "4px 0 10px 0",
              color: "#a3aebf",
              maxHeight: "60px",
              overflow: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              msOverflowStyle: "-ms-autohiding-scrollbar",
              fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            {orgInfo.bio}
          </p>
        )}

        {/* Interaction stats */}
        <div
          className="nownownow-widget-org-stats"
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "13px",
            margin: "12px 0 8px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: "600",
                color: "white",
                fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
              }}
            >
              {stats.posts}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
              }}
            >
              Posts
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: "600",
                color: "white",
                fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
              }}
            >
              {stats.followers}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
              }}
            >
              Followers
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: "600",
                color: "white",
                fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
              }}
            >
              {stats.following}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
              }}
            >
              Following
            </span>
          </div>
        </div>

        {/* Website/URL and any other meta info */}
        <div
          className="nownownow-widget-org-meta"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "13px",
            alignItems: "center",
            marginTop: "8px",
            fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
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
                color: "#60a5fa",
                textDecoration: "none",
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
                style={{ width: "13px", height: "13px" }}
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              {formatWebsiteUrl(orgInfo.websiteUrl)}
            </a>
          )}
        </div>
      </div>

      {/* Modern minimal tab navigation */}
      <div
        className="nownownow-widget-tab-nav"
        style={{
          display: "flex",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "#111827",
          backgroundImage: `url(${noiseSvgUrl})`,
        }}
      >
        <div
          className={`nownownow-widget-tab ${
            activeTab === "feed" ? "active" : ""
          }`}
          onClick={() => handleTabChange("feed")}
          style={{
            flex: 1,
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: activeTab === "feed" ? "600" : "500",
            color: activeTab === "feed" ? "white" : "#9ca3af",
            borderBottom:
              activeTab === "feed"
                ? "2px solid #60a5fa"
                : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
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
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: activeTab === "feedback" ? "600" : "500",
            color: activeTab === "feedback" ? "white" : "#9ca3af",
            borderBottom:
              activeTab === "feedback"
                ? "2px solid #60a5fa"
                : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Feedback
        </div>
      </div>
    </div>
  );
};
