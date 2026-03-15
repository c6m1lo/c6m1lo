import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-wrap">
      <section className="panel p-8 sm:p-10">
        <span className="kicker">404</span>
        <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">Page not found</h1>
        <p className="muted mt-4 max-w-2xl">
          The page you’re looking for doesn’t exist (or it moved). Head back home or open the apps
          index.
        </p>
        <div className="hero-actions mt-6">
          <Link className="hero-btn hero-btn-primary" href="/">
            Go home
          </Link>
          <Link className="hero-btn hero-btn-secondary" href="/projects">
            Projects
          </Link>
        </div>
      </section>
    </div>
  );
}
