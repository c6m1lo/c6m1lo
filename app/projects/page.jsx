export default function ProjectsPage() {
  const projects = [
    {
      name: "Bible App",
      description: "A React and Next.js Bible reading interface. KJV. Offline capable.",
      href: "/bible",
    },
    {
      name: "Health OS",
      description: "Biometric tracking merged with Apple Health data and journal snapshots.",
      href: "/health",
    },
    {
      name: "Text to Speech",
      description: "Browser-native speech engine for reading text aloud.",
      href: "/tts",
    },
    {
      name: "Journal App",
      description: "Local-only daily journal with search, filters, and weekly metrics.",
      href: "/journal",
    },
    {
      name: "Millisecond Scheduler",
      description: "Real-time activity tracker synced with Journal and Calendar.",
      href: "/scheduler",
    },
    {
      name: "Calendar App",
      description: "Chronological planner merging journal entries and tracker sessions.",
      href: "/calendar",
    },
    {
      name: "WebEdit",
      description: "Web-based editor for fast content creation and updates.",
      href: "/webedit",
    },
  ];

  return (
    <div style={{ background: "#080808" }}>
      <header style={{ padding: "120px 24px 80px", textAlign: "center", background: "#080808" }}>
        <div
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "rgba(212, 201, 176, 0.3)",
          }}
        >
          PROJECTS
        </div>
        <h1
          style={{
            marginTop: "12px",
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "36px",
            letterSpacing: "0.1em",
            color: "#d4c9b0",
          }}
        >
          Current Deployments
        </h1>
        <div style={{ width: "48px", height: "1px", background: "rgba(212, 201, 176, 0.2)", margin: "24px auto 0" }} />
        <div
          style={{
            marginTop: "20px",
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "rgba(212, 201, 176, 0.3)",
          }}
        >
          07 ACTIVE TOOLS · C6M1LO
        </div>
      </header>

      <section style={{ padding: "0 24px 120px" }} aria-label="Projects grid">
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div className="cv-projects-grid">
            {projects.map((project) => (
              <article key={project.href} className="cv-project-card">
                <div
                  style={{
                    fontFamily: "var(--font-valencia)",
                    fontWeight: 500,
                    fontSize: "15px",
                    letterSpacing: "0.1em",
                    color: "#d4c9b0",
                  }}
                >
                  {project.name}
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontFamily: "var(--font-valencia)",
                    fontWeight: 300,
                    fontSize: "12px",
                    color: "rgba(212, 201, 176, 0.5)",
                    lineHeight: 1.7,
                  }}
                >
                  {project.description}
                </div>
                <a href={project.href} className="cv-project-link">
                  OPEN →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .cv-projects-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 32px;
        }

        @media (max-width: 860px) {
          .cv-projects-grid {
            grid-template-columns: 1fr;
          }
        }

        .cv-project-card {
          background: transparent;
          border-top: 1px solid #1a1a1a;
          padding-top: 24px;
          transition: border-color 0.3s ease;
        }

        .cv-project-card:hover {
          border-top-color: rgba(212, 201, 176, 0.2);
        }

        .cv-project-link {
          display: inline-block;
          margin-top: 16px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          color: rgba(212, 201, 176, 0.3);
          transition: color 0.3s ease;
          text-decoration: none;
        }

        .cv-project-link:hover {
          color: rgba(212, 201, 176, 0.7);
        }
      `}</style>
    </div>
  );
}
