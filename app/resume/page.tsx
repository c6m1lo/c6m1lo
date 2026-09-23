const links = [
  {
    label: "LinkedIn",
    detail: "Professional profile",
    href: "https://www.linkedin.com/in/camilogomezvalencia",
  },
  {
    label: "GitHub",
    detail: "Code and projects",
    href: "https://github.com/c6m1lo",
  },
];

const languages = ["HTML", "CSS", "JavaScript", "TypeScript", "Node.js"];
const skills = [
  "Networking",
  "Git",
  "React",
  "Linux/Bash",
  "Microsoft/Powershell",
  "MacOS/Zsh",
  "Prettier",
  "Electron",
  "Vim / Nano",
  "AWS",
  "Vercel",
  "DNS",
  "Prompt Engineering",
];

export const metadata = {
  title: "Résumé",
  description: "Technical skills and profile links for recruiters and potential employers.",
};

export default function Resume() {
  return (
    <article className="resume-page">
      <header className="resume-hero">
        <div className="resume-arch" aria-hidden="true" />
        <div className="resume-hero-content">
          <p className="resume-eyebrow">CAMILO VALENCIA · MMXXVI</p>
          <h1>Résumé</h1>
          <div className="resume-rule" aria-hidden="true"><span>✦</span></div>
          <p className="resume-intro">A foundation in software engineering, front-end development, and devOps.</p>
        </div>
      </header>

      <div className="resume-body">
        <section className="resume-section" aria-labelledby="profiles-heading">
          <div className="resume-section-heading">
            <span className="resume-index">I</span>
            <h2 id="profiles-heading">Profiles</h2>
          </div>
          <div className="resume-links">
            {links.map(({ label, detail, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="resume-link">
                <span><strong>{label}</strong><small>{detail}</small></span>
                <span className="resume-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section className="resume-section" aria-labelledby="education-heading">
          <div className="resume-section-heading">
            <span className="resume-index">II</span>
            <h2 id="education-heading">Education</h2>
          </div>
          <div className="resume-education">
            <div>
              <h3>Marcy Labs</h3>
              <p>Software Engineering Fellowship</p>
            </div>
            <span className="resume-date">2026–2027</span>
          </div>
        </section>

        <section className="resume-section" aria-labelledby="languages-heading">
          <div className="resume-section-heading">
            <span className="resume-index">III</span>
            <h2 id="languages-heading">Languages &amp; runtime</h2>
          </div>
          <ul className="resume-tags">
            {languages.map((language) => <li key={language}>{language}</li>)}
          </ul>
        </section>

        <section className="resume-section" aria-labelledby="skills-heading">
          <div className="resume-section-heading">
            <span className="resume-index">IV</span>
            <h2 id="skills-heading">Tools &amp; disciplines</h2>
          </div>
          <ul className="resume-tags">
            {skills.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </section>
      </div>

      <style>{`
        .resume-page {
          --stone: #d4c9b0;
          --muted: rgba(212, 201, 176, .55);
          --hairline: rgba(212, 201, 176, .2);
          background: #080808;
          color: var(--stone);
          font-family: var(--font-valencia), Georgia, serif;
          min-height: 100svh;
          padding: clamp(36px, 7vw, 88px) clamp(20px, 5vw, 64px) 100px;
        }
        .resume-page *, .resume-page *::before, .resume-page *::after { box-sizing: border-box; }
        .resume-hero { position: relative; min-height: 410px; display: grid; place-items: center; text-align: center; overflow: hidden; }
        .resume-arch {
          position: absolute; top: 0; width: min(400px, 86%); height: 460px;
          border: 1px solid var(--hairline); border-bottom: 0;
          border-radius: 50% 50% 0 0 / 29% 29% 0 0;
          clip-path: polygon(50% 0, 100% 24%, 100% 100%, 0 100%, 0 24%);
          opacity: .8;
        }
        .resume-arch::before, .resume-arch::after {
          content: ""; position: absolute; top: 29%; bottom: 0;
          border-left: 1px solid var(--hairline);
        }
        .resume-arch::before { left: 14%; } .resume-arch::after { right: 14%; }
        .resume-hero-content { position: relative; z-index: 1; padding: 50px 16px 20px; }
        .resume-eyebrow, .resume-index {
          color: var(--muted); font: 400 11px/1.5 "JetBrains Mono", monospace;
          letter-spacing: .22em;
        }
        .resume-hero h1 { margin: 22px 0 14px; font-size: clamp(64px, 11vw, 118px); font-weight: 300; line-height: .9; letter-spacing: -.045em; }
        .resume-rule { display: flex; align-items: center; gap: 15px; margin: 36px auto 28px; width: min(220px, 70vw); color: var(--muted); font-size: 11px; }
        .resume-rule::before, .resume-rule::after { content: ""; height: 1px; flex: 1; background: var(--hairline); }
        .resume-intro { max-width: 380px; margin: 0 auto; color: var(--muted); font-size: clamp(17px, 2vw, 20px); line-height: 1.5; }
        .resume-body { max-width: 850px; margin: 56px auto 0; border-top: 1px solid var(--hairline); }
        .resume-section { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(0, 2fr); gap: 32px; padding: 38px 0 46px; border-bottom: 1px solid var(--hairline); }
        .resume-section-heading { display: flex; align-items: baseline; gap: 20px; }
        .resume-index { min-width: 23px; }
        .resume-section h2 { margin: 0; font-size: clamp(22px, 3vw, 30px); font-weight: 300; line-height: 1.1; }
        .resume-links { display: grid; gap: 10px; }
        .resume-link { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 17px 18px; border: 1px solid var(--hairline); color: var(--stone); text-decoration: none; transition: border-color .2s ease, background .2s ease; }
        .resume-link:hover, .resume-link:focus-visible { background: rgba(212, 201, 176, .06); border-color: rgba(212, 201, 176, .55); }
        .resume-link:focus-visible { outline: 2px solid var(--stone); outline-offset: 3px; }
        .resume-link strong { display: block; font-size: 23px; font-weight: 400; }
        .resume-link small { display: block; margin-top: 2px; color: var(--muted); font: 400 10px/1.5 "JetBrains Mono", monospace; letter-spacing: .04em; }
        .resume-arrow { font-size: 23px; font-weight: 300; }
        .resume-education { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 10px 24px; padding: 18px 0; border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); }
        .resume-education h3 { margin: 0; font-size: 27px; font-weight: 400; line-height: 1.1; }
        .resume-education p { margin: 7px 0 0; color: var(--muted); font-size: 18px; }
        .resume-date { color: var(--muted); font: 400 11px/1.5 "JetBrains Mono", monospace; letter-spacing: .08em; white-space: nowrap; }
        .resume-tags { display: flex; flex-wrap: wrap; gap: 9px; padding: 0; margin: 0; list-style: none; }
        .resume-tags li { border: 1px solid var(--hairline); padding: 9px 13px; font-size: 18px; line-height: 1.2; }
        @media (max-width: 640px) {
          .resume-hero { min-height: 360px; }
          .resume-arch { height: 380px; }
          .resume-body { margin-top: 28px; }
          .resume-section { grid-template-columns: 1fr; gap: 23px; padding: 30px 0 34px; }
        }
      `}</style>
    </article>
  );
}
