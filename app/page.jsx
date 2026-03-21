"use client";

import { projects } from "@/data/projects";

export default function HomePage() {
  const portfolioProjects = projects.filter((project) => project.href?.startsWith("/"));

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
            fontSize: "clamp(48px, 6vw, 72px)",
            letterSpacing: "0.25em",
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
            fontSize: "clamp(48px, 6vw, 72px)",
            letterSpacing: "0.25em",
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
          href="/shop"
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
          VIEW COLLECTION
        </a>
      </section>

      {/* Product preview */}
      <section style={{ padding: "120px 24px", background: "#080808" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-valencia)",
              fontWeight: 300,
              fontSize: "11px",
              letterSpacing: "0.3em",
              color: "rgba(212, 201, 176, 0.3)",
              textAlign: "center",
              marginBottom: "64px",
            }}
          >
            CURRENT DROP
          </div>

          <div style={{ maxWidth: "360px", margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                aspectRatio: "4 / 5",
                background: "#0d0d0d",
                border: "1px solid #1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src="/creationOfAdam.png"
                alt="The Creation of Adam"
                loading="lazy"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.22,
                  filter: "grayscale(100%) contrast(105%)",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-valencia)",
                  fontWeight: 300,
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  color: "#444444",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                IMAGE
              </div>
            </div>

            <div
              style={{
                fontFamily: "var(--font-valencia)",
                fontWeight: 500,
                fontSize: "15px",
                letterSpacing: "0.15em",
                color: "#d4c9b0",
                marginTop: "24px",
              }}
            >
              THE CREATION OF ADAM
            </div>
            <div
              style={{
                fontFamily: "var(--font-valencia)",
                fontWeight: 300,
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: "rgba(212, 201, 176, 0.4)",
                marginTop: "8px",
              }}
            >
              VALENCIA COLLECTION · RENAISSANCE I
            </div>
            <div
              style={{
                fontFamily: "var(--font-valencia)",
                fontWeight: 300,
                fontSize: "14px",
                letterSpacing: "0.1em",
                color: "rgba(212, 201, 176, 0.7)",
                marginTop: "12px",
              }}
            >
              $999.00
            </div>
            <a
              href="/shop"
              style={{
                display: "inline-block",
                marginTop: "18px",
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
              ORDER NOW
            </a>
          </div>
        </div>
      </section>

      {/* Portfolio secondary */}
      <section style={{ padding: "80px 24px", background: "#080808", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div className="cv-portfolio-grid">
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em", color: "#444444", marginBottom: "16px" }}>
                OPERATOR
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#444444", lineHeight: 1.7 }}>
                Bilingual AI specialist, web engineer, and autodidact building at the intersection of technology and philosophy.
              </p>
              <a
                href="/projects"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  color: "#444444",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#888888";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#444444";
                }}
              >
                VIEW PROJECTS
              </a>
            </div>

            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em", color: "#444444", marginBottom: "16px" }}>
                TOOLS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {portfolioProjects.map((project) => (
                  <a
                    key={project.title}
                    href={project.href}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "#333333",
                      lineHeight: 2,
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#666666";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#333333";
                    }}
                  >
                    {project.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .cv-portfolio-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 48px;
          }
          @media (min-width: 860px) {
            .cv-portfolio-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </section>
    </div>
  );
}
