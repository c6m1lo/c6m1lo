"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { projects } from "@/data/projects";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const beamFaces = ["front", "back", "left", "right", "top", "bottom"] as const;

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
  const lastScrollYRef = useRef(0);
  const pauseAutoScrollUntilRef = useRef(0);
  const ignoreUpScrollUntilRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const projectsToShow = useMemo(
    () => projects.filter((project) => project.showInHomeFeed !== false),
    [],
  );
  const totalSections = 1 + projectsToShow.length;

  const getHomeSections = () => {
    if (!homeRootRef.current) return [];
    return Array.from(homeRootRef.current.querySelectorAll<HTMLElement>("[data-home-section]"));
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      setAutoScrollEnabled(false);
      return;
    }

    const saved = window.localStorage.getItem("home:autoScroll");
    setAutoScrollEnabled(saved ? saved === "1" : true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("home:autoScroll", autoScrollEnabled ? "1" : "0");
  }, [autoScrollEnabled]);

  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      const currentY = window.scrollY;

      if (
        currentY < lastScrollYRef.current - 2 &&
        now > ignoreUpScrollUntilRef.current
      ) {
        pauseAutoScrollUntilRef.current = now + 15_000;
      }

      lastScrollYRef.current = currentY;

      const scrollable =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const nextProgress = scrollable > 0 ? (currentY / scrollable) * 100 : 0;
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
    if (!autoScrollEnabled || prefersReducedMotion) return;

    const intervalId = window.setInterval(() => {
      if (Date.now() < pauseAutoScrollUntilRef.current) {
        return;
      }

      const sections = getHomeSections();
      if (!sections.length) return;

      setActiveSection((current) => {
        const next = (current + 1) % sections.length;
        ignoreUpScrollUntilRef.current = Date.now() + 1200;
        sections[next]?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
        return next;
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoScrollEnabled, prefersReducedMotion]);

  return (
    <div className="home-page" ref={homeRootRef}>
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="home-controls">
        <button
          type="button"
          className="home-control-btn"
          onClick={() => setAutoScrollEnabled((current) => !current)}
          disabled={prefersReducedMotion}
          aria-pressed={autoScrollEnabled}
        >
          {prefersReducedMotion
            ? "Auto-scroll disabled (reduced motion)"
            : autoScrollEnabled
              ? "Auto-scroll: on"
              : "Auto-scroll: off"}
        </button>
      </div>

      <div className="home-feed-status" aria-hidden="true">
        {Array.from({ length: totalSections }, (_, index) => (
          <span key={index} className={index === activeSection ? "is-active" : ""} />
        ))}
      </div>

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
            <p className="project-quote">{project.homeQuote ?? "`Built with precision and intent.`"}</p>
            <p className="muted">{project.description}</p>
            <a href={project.href} className="project-showcase-btn hero-btn hero-btn-secondary">
              {project.cta}
            </a>
          </div>
          <div className="project-scene" aria-hidden="true">
            {project.homeScene === "book" ? (
              <div className="scene-book">
                <div className="scene-book-cover" />
                <div className="scene-book-pages" />
                <div className="scene-book-spine" />
              </div>
            ) : null}
            {project.homeScene === "timer" ? (
              <div className="scene-timer">
                <div className="scene-timer-ring" />
                <div className="scene-timer-hand scene-timer-hand-hour" />
                <div className="scene-timer-hand scene-timer-hand-minute" />
                <div className="scene-timer-knob" />
              </div>
            ) : null}
            {project.homeScene === "calendar" ? (
              <div className="scene-calendar">
                <div className="scene-calendar-top" />
                <div className="scene-calendar-grid">
                  {Array.from({ length: 12 }, (_, index) => (
                    <span key={index} />
                  ))}
                </div>
              </div>
            ) : null}
            {project.homeScene === "gear" ? (
              <div className="scene-gear">
                <div className="scene-gear-notches">
                  {Array.from({ length: 8 }, (_, index) => (
                    <span key={index} style={{ transform: `rotate(${index * 45}deg)` }} />
                  ))}
                </div>
                <div className="scene-gear-core" />
              </div>
            ) : null}
            {project.homeScene === "speaker" ? (
              <div className="scene-speaker">
                <div className="scene-speaker-body">
                  <div className="scene-speaker-driver" />
                  <div className="scene-speaker-driver scene-speaker-driver-small" />
                </div>
                <div className="scene-speaker-waves" aria-hidden="true">
                  {Array.from({ length: 3 }, (_, index) => (
                    <span key={index} style={{ animationDelay: `${index * 0.35}s` }} />
                  ))}
                </div>
              </div>
            ) : null}
            {!project.homeScene ? <div className="scene-generic" /> : null}
          </div>
        </section>
      ))}
    </div>
  );
}
