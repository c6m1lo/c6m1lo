import { projects } from "@/data/projects";

export default function HomePage() {
  const featured = projects.filter((project) => project.showInHomeFeed !== false);
  const health = featured.find((project) => project.href === "/health");
  const otherFeatured = featured.filter((project) => project.href !== "/health");

  return (
    <div className="apple-home">
      <section className="apple-hero panel">
        <p className="apple-eyebrow">c6m1lo</p>
        <h1 className="apple-title">Clean software. Real life data.</h1>
        <p className="apple-subtitle">
          A small set of focused projects: local-first apps, time tracking, journaling, and now Apple Watch health imports.
        </p>
        <div className="apple-hero-actions">
          <a className="apple-btn apple-btn-primary" href="/projects">
            View projects
          </a>
          <a className="apple-btn apple-btn-secondary" href={health?.href ?? "/health"}>
            Import health data
          </a>
        </div>
      </section>

      {health ? (
        <section className="apple-feature">
          <a className="apple-feature-tile panel" href={health.href}>
            <div className="apple-feature-copy">
              <p className="apple-eyebrow">New</p>
              <h2 className="apple-feature-title">{health.title}</h2>
              <p className="apple-feature-quote">{health.homeQuote ?? "`Import locally. Export clean JSON.`"}</p>
              <p className="muted">{health.description}</p>
              <span className="apple-link">{health.cta} →</span>
            </div>
            <div className="apple-feature-visual" aria-hidden="true">
              <div className="apple-visual-slab" />
              <div className="apple-visual-glow" />
            </div>
          </a>
        </section>
      ) : null}

      <section className="apple-section">
        <div className="apple-section-head">
          <h2 className="apple-section-title">Featured</h2>
          <a className="apple-link" href="/projects">
            See all →
          </a>
        </div>
        <div className="apple-grid">
          {otherFeatured.map((project) => (
            <a key={project.title} className="apple-tile panel" href={project.href}>
              <p className="apple-eyebrow">Project</p>
              <h3 className="apple-tile-title">{project.title}</h3>
              <p className="apple-tile-quote">{project.homeQuote ?? "`Built with precision and intent.`"}</p>
              <p className="muted apple-tile-desc">{project.description}</p>
              <span className="apple-link">{project.cta} →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="apple-section">
        <div className="apple-section-head">
          <h2 className="apple-section-title">About</h2>
        </div>
        <div className="apple-about panel">
          <p className="muted">
            I like shipping small tools that feel fast, intentional, and private by default. Most of these projects store data locally in your browser.
          </p>
          <div className="apple-about-actions">
            <a className="apple-btn apple-btn-secondary" href="/resume">
              Resume
            </a>
            <a className="apple-btn apple-btn-secondary" href="/support">
              Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
