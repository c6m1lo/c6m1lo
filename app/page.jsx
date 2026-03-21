"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { projects } from "@/data/projects";

const SECTIONS = [
  { id: "boot", label: "Boot" },
  { id: "about", label: "About" },
  { id: "principles", label: "Principles" },
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

function useActiveSection(rootRef) {
  const [activeId, setActiveId] = useState(SECTIONS[0]?.id ?? "boot");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll("[data-home-section]"));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.getAttribute("id");
        if (id) setActiveId(id);
      },
      { threshold: [0.5, 0.65, 0.8] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [rootRef]);

  return activeId;
}

export default function HomePage() {
  const scrollerRef = useRef(null);
  const activeId = useActiveSection(scrollerRef);
  const featuredProjects = useMemo(() => projects.slice(0, 6), []);

  const scrollTo = (id) => {
    const root = scrollerRef.current;
    if (!root) return;
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-scroller" ref={scrollerRef}>
      <aside className="home-index" aria-label="Homepage sections">
        {SECTIONS.map((section, index) => (
          <button
            key={section.id}
            type="button"
            className={`home-index-btn${activeId === section.id ? " is-active" : ""}`}
            onClick={() => scrollTo(section.id)}
          >
            <span className="home-index-num">{String(index + 1).padStart(2, "0")}</span>
            <span className="home-index-label">{section.label}</span>
          </button>
        ))}
      </aside>

      <section id="boot" className="home-section" data-home-section aria-label="Boot">
        <div className="home-shell">
          <div className="terminal-block">
            <div className="terminal-quote">
              <span className="terminal-prompt">&gt;</span>
              <div>
                and thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind,
                and with all thy strength: this is the first commandment.
              </div>
            </div>
          </div>
          <div className="terminal-ref">
            KJV: Mark 12:30
            <a className="terminal-link" href="/bible">
              [Bible app]
            </a>
          </div>

          <div className="home-boot-meta">
            <div className="home-pill">Operator: Camilo Gomez</div>
            <div className="home-pill">Mode: Local-first</div>
            <div className="home-pill">Stack: Next.js · React · TS/JS</div>
          </div>

          <div className="home-next">
            <button type="button" className="terminal-link home-next-btn" onClick={() => scrollTo("about")}>
              [Continue →]
            </button>
          </div>
        </div>
      </section>

      <section id="about" className="home-section" data-home-section aria-label="About">
        <div className="home-shell">
          <span className="page-kicker">ABOUT</span>
          <h2 className="home-h2">I build small tools that make patterns obvious.</h2>
          <p className="home-p">
            I’m Camilo — bilingual operator and builder. I like software that feels fast, private by default, and honest
            about what it tracks.
          </p>
          <div className="home-two-col">
            <div className="home-panel">
              <div className="home-panel-title">What I optimize for</div>
              <ul className="home-list">
                <li>Clarity over complexity</li>
                <li>Local-first storage</li>
                <li>Strong defaults</li>
                <li>Measurable feedback loops</li>
              </ul>
            </div>
            <div className="home-panel">
              <div className="home-panel-title">What I’m exploring</div>
              <ul className="home-list">
                <li>Health + journaling merges</li>
                <li>Time tracking that doesn’t nag</li>
                <li>LLM workflows with safeguards</li>
                <li>Interfaces that feel “quiet”</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="principles" className="home-section" data-home-section aria-label="Principles">
        <div className="home-shell">
          <span className="page-kicker">PRINCIPLES</span>
          <h2 className="home-h2">The rules I keep returning to.</h2>
          <div className="home-panel home-panel-wide">
            <div className="home-rule">
              <span className="home-rule-prompt">&gt;</span>
              <div>
                <div className="home-rule-title">Start with the signal.</div>
                <div className="home-rule-body">If the metric doesn’t change behavior, it’s noise.</div>
              </div>
            </div>
            <div className="home-rule">
              <span className="home-rule-prompt">&gt;</span>
              <div>
                <div className="home-rule-title">Make it reversible.</div>
                <div className="home-rule-body">Exports, simple formats, and no lock-in.</div>
              </div>
            </div>
            <div className="home-rule">
              <span className="home-rule-prompt">&gt;</span>
              <div>
                <div className="home-rule-title">Respect attention.</div>
                <div className="home-rule-body">No dark patterns, no spam, no guilt.</div>
              </div>
            </div>
            <div className="home-rule">
              <span className="home-rule-prompt">&gt;</span>
              <div>
                <div className="home-rule-title">Keep it readable.</div>
                <div className="home-rule-body">Simple UI, sharp typography, predictable layouts.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="work" className="home-section" data-home-section aria-label="Work">
        <div className="home-shell">
          <span className="page-kicker">WORK</span>
          <h2 className="home-h2">Bilingual execution in high-trust contexts.</h2>
          <p className="home-p">
            I’ve worked across interpretation, transcription, and AI data workflows — environments where accuracy and
            confidentiality are non‑negotiable.
          </p>
          <div className="home-timeline">
            <div className="home-timeline-item is-latest">
              <div className="home-timeline-role">Spanish Medical Annotation Subject Matter Expert</div>
              <div className="home-timeline-company">Centific</div>
            </div>
            <div className="home-timeline-item">
              <div className="home-timeline-role">Certified Medical Interpreter</div>
              <div className="home-timeline-company">Propio · Kelly Services</div>
            </div>
            <div className="home-timeline-item">
              <div className="home-timeline-role">Transcriptionist</div>
              <div className="home-timeline-company">Uber · Uber AI Solutions</div>
            </div>
            <div className="home-timeline-item">
              <div className="home-timeline-role">Legal Interpreter</div>
              <div className="home-timeline-company">Kates Nussman Ellis Fahri &amp; Earle, LLP</div>
            </div>
          </div>
          <div className="home-next">
            <a className="terminal-link" href="/resume">
              [Open resume →]
            </a>
          </div>
        </div>
      </section>

      <section id="projects" className="home-section" data-home-section aria-label="Projects">
        <div className="home-shell">
          <span className="page-kicker">PROJECTS</span>
          <h2 className="home-h2">Apps that stay out of your way.</h2>
          <p className="home-p">A quick set of current deployments you can use right now.</p>
          <div className="card-grid">
            {featuredProjects.map((project) => (
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
          <div className="home-next">
            <a className="terminal-link" href="/projects">
              [See all projects →]
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="home-section" data-home-section aria-label="Contact">
        <div className="home-shell">
          <span className="page-kicker">CONTACT</span>
          <h2 className="home-h2">If you want to build something clean, talk to me.</h2>
          <div className="home-panel home-panel-wide">
            <a className="home-cmd" href="mailto:c6m1lo@proton.me">
              c6m1lo@proton.me
            </a>
            <a className="home-cmd" href="https://github.com/fullstacknyc" target="_blank" rel="noopener noreferrer">
              github.com/fullstacknyc
            </a>
            <a
              className="home-cmd"
              href="https://www.linkedin.com/in/camilogomezvalencia/"
              target="_blank"
              rel="noopener noreferrer"
            >
              linkedin.com/in/camilogomezvalencia
            </a>
          </div>
          <div className="home-next">
            <button type="button" className="terminal-link home-next-btn" onClick={() => scrollTo("boot")}>
              [Back to top ↑]
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
