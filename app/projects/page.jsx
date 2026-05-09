import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    {
      title: "Bible App",
      description: "A React + Next.js Bible reading interface (KJV). Offline capable.",
      href: "/bible",
      cta: "Open app",
    },
    {
      title: "Journal App",
      description: "Daily timestamped journal with local-only storage, search, filters, and weekly metrics.",
      href: "/journal",
      cta: "Open app",
    }
  ];

  return (
    <div>
      <header className="page-header">
        <span className="page-kicker">Projects</span>
        <h1 className="page-title">Active Deployments</h1>
        <div className="page-counter">{projects.length} live</div>
      </header>

      <section aria-label="Projects list">
        <div className="card-grid">
          {projects.map((project) => (
            <Link key={project.href} href={project.href} className="project-card">
              <div className="card-top">
                <span className="status-dot" aria-hidden="true" />
                <div className="card-title">{project.title}</div>
              </div>
              <div className="card-desc">{project.description}</div>
              <div className="card-bottom">
                <span className="card-link">{project.cta}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
