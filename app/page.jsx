"use client";

export default function HomePage() {
  return (
    <div style={{ background: "#080808" }}>
      {/* Brand hero */}
      <section
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: "16px",
          padding: "24px",
          background: "#080808",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "clamp(40px, 10vw, 72px)",
            letterSpacing: "clamp(0.12em, 1.2vw, 0.25em)",
            color: "#d4c9b0",
            lineHeight: 1.05,
          }}
        >
          CAMILO
        </div>
        <div
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "clamp(40px, 10vw, 72px)",
            letterSpacing: "clamp(0.12em, 1.2vw, 0.25em)",
            color: "#d4c9b0",
            lineHeight: 1.05,
          }}
        >
          VALENCIA
        </div>
        <div style={{ width: "48px", height: "1px", background: "rgba(212, 201, 176, 0.2)", margin: "0 auto" }} />
        <div
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "12px",
            letterSpacing: "0.3em",
            color: "rgba(212, 201, 176, 0.4)",
          }}
        >
          WEARABLE ART · EST. MMXXVI
        </div>
        <a
          href="/projects"
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 400,
            fontSize: "11px",
            letterSpacing: "0.25em",
            color: "rgba(212, 201, 176, 0.5)",
            border: "none",
            background: "transparent",
            padding: "10px 12px",
            transition: "opacity 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
          }}
        >
          VIEW PROJECTS
        </a>
      </section>
    </div>
  );
}
