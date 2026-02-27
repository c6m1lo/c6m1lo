const projects = [
  {
    title: "Bible App",
    description: "A simple Bible reading app built with React and Next.js.",
    href: "/bible",
    cta: "Open app",
  },
  {
    title: "Journal App",
    description: "Daily timestamped journal with local-only storage, search, filters, and weekly metrics.",
    href: "/journal",
    cta: "Open app",
  },
  {title: "Millisecond Scheduler",
    description: "Real-time activity tracker with editable sessions synced to Journal and Calendar.",
    href: "/scheduler",
    cta: "Open app",
  },
  {
    title: "Calendar App",
    description: "Chronological planner that merges Journal entries, tracker sessions, and calendar events.",
    href: "/calendar",
    cta: "Open app",
  }
];

export default function ProjectsPage() {
  return (
    <div className="page-wrap">
      <section className="panel p-8 sm:p-10">
        <span className="kicker">Projects</span>
        <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">Projects</h1>
        <p className="muted mt-4 max-w-2xl">
          A quick index of public-facing links that represent current work and profile details.
        </p>
        <div className="mt-8 grid-cards">
          {projects.map((project) => (
            <article key={project.title} className="info-card">
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <p className="muted mt-2">{project.description}</p>
              <a
                className="primary-link mt-4"
                href={project.href}
                target={project.href.startsWith("http") ? "_blank" : undefined}
                rel={project.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {project.cta} →
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
