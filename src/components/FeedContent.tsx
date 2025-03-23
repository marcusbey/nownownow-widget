import { FunctionComponent } from "preact";

// Import noise texture SVG from OrganizationProfile component (ideally should be moved to a shared constants file)
const noiseSvgUrl = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <filter id="noise" x="0" y="0">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
  </filter>
  <rect width="200" height="200" filter="url(#noise)" opacity="0.3"/>
</svg>
`)}`;

interface FeedContentProps {
  isDark?: boolean;
}

export const FeedContent: FunctionComponent<FeedContentProps> = () => {
  // Always use dark theme for consistent design
  const isDark = true;

  return (
    <div
      className="nownownow-widget-feed-content"
      style={{
        padding: "24px 20px",
        background: "#111827", // Dark background consistently
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        fontFamily: "'Crimson Text', 'Noto Serif', Georgia, serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            marginBottom: "12px",
            color: "#e5e7eb",
            fontStyle: "italic",
            letterSpacing: "0.5px",
          }}
        >
          No posts available.
        </div>
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#9ca3af",
          }}
        >
          Journal entries will appear here once created.
        </p>

        {/* Journal decoration line */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            margin: "20px auto",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#4b5563",
              top: "-3px",
              left: "calc(50% - 3px)",
            }}
          />
        </div>

        {/* Journal paper texture lines for decoration */}
        <div
          style={{
            width: "100%",
            maxWidth: "260px",
            margin: "0 auto",
            padding: "15px 0",
            position: "relative",
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "100%",
                height: "1px",
                background: "rgba(255,255,255,0.06)",
                margin: "8px 0",
              }}
            />
          ))}

          {/* Pen icon */}
          <div
            style={{
              position: "absolute",
              bottom: "0px",
              right: "-10px",
              opacity: 0.15,
              width: "20px",
              height: "20px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: "rotate(15deg)" }}
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
