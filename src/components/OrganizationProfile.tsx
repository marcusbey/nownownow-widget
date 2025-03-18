import { FunctionComponent } from "preact";

type Theme = "light" | "dark";

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
}

// No longer needed as we're using initials from the name split

const getFollowerCount = (
  count: { followers: number } | null | undefined
): number => count?.followers ?? 0;

// Default banner images for fallback
const DEFAULT_BANNERS = [
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1605106702734-205df224ecce?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1000&auto=format&fit=crop",
];

export const OrganizationProfile: FunctionComponent<
  OrganizationProfileProps
> = ({ orgInfo, theme = "light" }) => {
  if (!orgInfo) return null;

  const isDark = theme === "dark";
  const initials = orgInfo.name
    .split(" ")
    .map((n) => n[0])
    .join("");
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

  return (
    <div
      className={`now-widget-org-profile ${isDark ? "now-widget-dark" : ""}`}
    >
      <div
        className="now-widget-org-banner"
        style={{ backgroundImage: `url(${bannerUrl})` }}
      >
        <div className="now-widget-org-banner-overlay"></div>
      </div>
      <div className="now-widget-org-header">
        <div className="now-widget-org-avatar">
          {orgInfo.image ? (
            <img src={orgInfo.image} alt={orgInfo.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="now-widget-org-info">
          <h2 className="now-widget-org-name">{orgInfo.name}</h2>
          {orgInfo.bio && <p className="now-widget-org-bio">{orgInfo.bio}</p>}

          <div className="now-widget-org-meta">
            {orgInfo.websiteUrl && (
              <a
                href={orgInfo.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="now-widget-org-website"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                {formatWebsiteUrl(orgInfo.websiteUrl)}
              </a>
            )}

            {followerCount > 0 && (
              <div className="now-widget-org-followers">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {followerCount} followers
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
