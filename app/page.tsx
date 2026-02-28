"use client";

import { useEffect, useState } from "react";

const beamFaces = ["front", "back", "left", "right", "top", "bottom"] as const;
const homeProjects = [
  {
    title: "Bible App",
    description: "Simple Bible reader built with Next.js and local KJV data.",
    href: "/bible",
  },
  {
    title: "Journal App",
    description: "Daily timestamped journal with local-first entries and summaries.",
    href: "/journal",
  },
  {
    title: "Millisecond Scheduler",
    description: "Real-time tracker for what you are doing throughout the day.",
    href: "/scheduler",
  },
  {
    title: "Calendar App",
    description: "Chronological calendar connected with journal and tracker data.",
    href: "/calendar",
  },
];

function CrossBeam({ className }: { className: string }) {
  return (
    <div className={`cross-beam ${className}`}>
      {beamFaces.map((face) => (
        <span key={face} className={`face face-${face}`} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const nextProgress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setProgress(Math.max(0, Math.min(100, nextProgress)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="home-page">
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="home-hero panel">
        <p className="kicker">Camilo Gomez</p>
        <h1>Portfolio</h1>
        <p className="muted hero-copy">
          Culmination of systems engineering combined with Next.js development.
        </p>
        <div className="hero-actions">
          <a href="/resume" className="hero-btn hero-btn-primary">
            View Resume
          </a>
          <a href="/projects" className="hero-btn hero-btn-secondary">
            Explore Projects
          </a>
        </div>
      </section>

      <section className="faith-panel panel">
        <div className="faith-copy">
          <p className="kicker">Reading</p>
          <h2>Jesus replied: `Love the Lord your God with all your heart and with all your soul and with all your mind.`</h2>
          <p className="muted">
            KJV: Mark 12:30
          </p>
          <a href="/bible" className="hero-btn hero-btn-secondary">
            Open Bible App
          </a>
        </div>

        <div className="cross-scene" aria-hidden="true">
          <div className="cross-rotor">
            <CrossBeam className="cross-beam-vertical" />
            <CrossBeam className="cross-beam-horizontal" />
            <div className="cross-halo" />
          </div>
        </div>
      </section>

      {homeProjects.slice(1).map((project) => (
        <section key={project.title} className="project-showcase panel p-6 sm:p-8">
          <p className="kicker">Project</p>
          <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">{project.title}</h2>
          <p className="muted mt-2 text-sm sm:text-base">{project.description}</p>
          <a href={project.href} className="project-showcase-btn hero-btn hero-btn-secondary mt-5 inline-flex">
            Open app
          </a>
        </section>
      ))}
    </div>
  );
}
