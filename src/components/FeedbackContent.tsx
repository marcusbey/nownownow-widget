import { FunctionComponent } from "preact";

// Import noise texture SVG from OrganizationProfile component
const noiseSvgUrl = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <filter id="noise" x="0" y="0">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
  </filter>
  <rect width="200" height="200" filter="url(#noise)" opacity="0.3"/>
</svg>
`)}`;

interface FeedbackContentProps {
  isDark?: boolean;
}

export const FeedbackContent: FunctionComponent<FeedbackContentProps> = () => {
  // Always use dark theme for consistent design
  const isDark = true;

  return (
    <div
      className="nownownow-widget-feedback-content"
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
          No feedback available.
        </div>
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#9ca3af",
          }}
        >
          Leave your thoughts and reflections in the journal.
        </p>

        {/* Notebook icon */}
        <div
          style={{
            margin: "24px auto 12px",
            width: "36px",
            height: "36px",
            opacity: 0.2,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
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
        </div>

        {/* Decorative corner mark */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            opacity: 0.1,
            width: "40px",
            height: "40px",
            borderRight: "2px solid rgba(255,255,255,0.3)",
            borderBottom: "2px solid rgba(255,255,255,0.3)",
            borderRadius: "0 0 5px 0",
          }}
        />
      </div>
    </div>
  );
};
