"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const beamFaces = ["front", "back", "left", "right", "top", "bottom"] as const;
const homeProjects = [
  {
    title: "Bible App",
    description: "Simple Bible reader built with Next.js and local KJV data.",
    href: "/bible",
    quote: "`Search the scriptures; for in them ye think ye have eternal life.`",
  },
  {
    title: "Journal App",
    description: "Daily timestamped journal with local-first entries and summaries.",
    href: "/journal",
    quote: "`Write clearly enough to understand your own patterns over time.`",
    scene: "book",
  },
  {
    title: "Millisecond Scheduler",
    description: "Real-time tracker for what you are doing throughout the day.",
    href: "/scheduler",
    quote: "`What gets measured in minutes becomes visible in your life.`",
    scene: "timer",
  },
  {
    title: "Calendar App",
    description: "Chronological calendar connected with journal and tracker data.",
    href: "/calendar",
    quote: "`Order your day by time, not by intention alone.`",
    scene: "calendar",
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
  const homeRootRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const projectsToShow = useMemo(() => homeProjects.slice(1), []);
  const totalSections = 2 + projectsToShow.length;

  const getHomeSections = () => {
    if (!homeRootRef.current) return [];
    return Array.from(homeRootRef.current.querySelectorAll<HTMLElement>("[data-home-section]"));
  };

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

  useEffect(() => {
    const sections = getHomeSections();
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const index = sections.findIndex((section) => section === visible.target);
        if (index >= 0) setActiveSection(index);
      },
      { threshold: [0.55, 0.75] },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [totalSections]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const sections = getHomeSections();
      if (!sections.length) return;

      setActiveSection((current) => {
        const next = (current + 1) % sections.length;
        sections[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
        return next;
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="home-page" ref={homeRootRef}>
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="home-feed-status" aria-hidden="true">
        {Array.from({ length: totalSections }, (_, index) => (
          <span key={index} className={index === activeSection ? "is-active" : ""} />
        ))}
      </div>

      <section className="home-feed-section home-hero panel" data-home-section>
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

      <section className="home-feed-section faith-panel panel" data-home-section>
        <div className="faith-copy">
          <p className="kicker">Reading</p>
          <h2>`and thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength: this is the first commandment.`</h2>
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

      {projectsToShow.map((project) => (
        <section key={project.title} className="home-feed-section project-showcase panel" data-home-section>
          <div className="project-copy">
            <p className="kicker">Project</p>
            <h2>{project.title}</h2>
            <p className="project-quote">{project.quote}</p>
            <p className="muted">{project.description}</p>
            <a href={project.href} className="project-showcase-btn hero-btn hero-btn-secondary">
              Open app
            </a>
          </div>
          <div className="project-scene" aria-hidden="true">
            {project.scene === "book" ? (
              <div className="scene-book">
                <div className="scene-book-cover" />
                <div className="scene-book-pages" />
                <div className="scene-book-spine" />
              </div>
            ) : null}
            {project.scene === "timer" ? (
              <div className="scene-timer">
                <div className="scene-timer-ring" />
                <div className="scene-timer-hand scene-timer-hand-hour" />
                <div className="scene-timer-hand scene-timer-hand-minute" />
                <div className="scene-timer-knob" />
              </div>
            ) : null}
            {project.scene === "calendar" ? (
              <div className="scene-calendar">
                <div className="scene-calendar-top" />
                <div className="scene-calendar-grid">
                  {Array.from({ length: 12 }, (_, index) => (
                    <span key={index} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
