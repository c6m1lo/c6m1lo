import { projects } from "@/data/projects";

function pad2(value) {
  return String(value).padStart(2, "0");
}

export default function ProjectsPage() {
  const activeCount = projects.length;

  return (
    <div>
      <header className="page-header">
        <span className="page-kicker">PROJECTS</span>
        <h1 className="page-title">Current Deployments</h1>
        <div className="page-counter">
          {pad2(activeCount)} active
        </div>
      </header>

      <section aria-label="Project list">
        <div className="card-grid">
          {projects.map((project) => (
            <article key={project.title} className="project-card">
              <div className="card-top">
                <span className="status-dot" aria-hidden="true" />
                <div className="card-title">{project.title}</div>
              </div>
              <div className="card-desc">{project.description}</div>
              <div className="card-bottom">
                <a
                  className="card-link"
                  href={project.href}
                  target={project.href.startsWith("http") ? "_blank" : undefined}
                  rel={project.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  Open app
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

