const experience = [
  { role: "Web Developer", company: "Freelance" },
];

const strengths = [
  "Bilingual English-Spanish communication at native fluency.",
  "Dataset annotation, transcription, and QA.",
  "Medical terminology, interpretation accuracy, and confidentiality.",
  "Prompt engineering and LLM training support workflows.",
  "TypeScript, React, Tailwind, Git, Bash/Zsh, AWS, Vercel, Linux, Node.js.",
];

const education = [
  "The Marcy Lab School, Brooklyn, NY — Software Engineering Fellowship",
];

export default function ResumePage() {
  return (
    <div>
      <header className="page-header">
        <span className="page-kicker">RESUME</span>
        <h1 className="page-title">Camilo Gomez</h1>
      </header>

      <div className="resume-grid">
        <aside className="resume-left">
          <div className="resume-tagline">BILINGUAL OPERATOR · AI · WEB · INTERPRETATION</div>
          <div className="divider" />

          <a className="terminal-cmd" href="mailto:c6m1lo@proton.me">
            c6m1lo@proton.me
          </a>
          <a
            className="terminal-cmd"
            href="https://github.com/fullstacknyc"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <div className="strengths-title">Core Strengths</div>
          {strengths.map((item) => (
            <div key={item} className="strength-item">
              {item}
            </div>
          ))}
        </aside>

        <section className="resume-right">
          <span className="page-kicker">Professional Experience</span>
          <div className="timeline">
            {experience.map((item, index) => (
              <div
                key={`${item.role}-${item.company}`}
                className={`timeline-item${index === 0 ? " is-latest" : ""}`}
              >
                <div className="role-title">{item.role}</div>
                <div className="role-company">{item.company}</div>
              </div>
            ))}
          </div>

          <div className="edu-block">
            <div className="edu-title">Education</div>
            {education.map((item) => (
              <div key={item} className="edu-item">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

