type ExperienceItem = {
  role: string;
  company: string;
};

const experience: ExperienceItem[] = [
  { role: "Spanish-US Transcriptionist", company: "Uber" },
  { role: "Spanish Medical Annotation Subject Matter Expert", company: "Centific" },
  { role: "Air Traffic Control Transcriptionist", company: "Alignerr" },
  { role: "Certified Medical Interpreter", company: "Propio" },
  { role: "Certified Medical Interpreter", company: "Kelly Services" },
  { role: "Legal Interpreter", company: "Kates Nussman Ellis Fahri & Earle, LLP" },
  { role: "Transcriptionist", company: "Uber AI Solutions" },
  { role: "Cook", company: "KPot Korean BBQ & Hot Pot" },
  { role: "Cook & Crew Member", company: "Chipotle Mexican Grill" },
  { role: "Front & Back of House Crew Member", company: "Gong Cha Taiwan" },
];

const strengths = [
  "Bilingual English-Spanish communication at native fluency",
  "Sensitive NLP dataset annotation, transcription, and QA",
  "Medical terminology, interpretation accuracy, and confidentiality",
  "Prompt engineering and LLM training support workflows",
  "TypeScript, React, Tailwind, Git, and Bash/Zsh",
  "Cross-domain execution in AI, software, and security contexts",
];

const education = [
  "New Jersey City University - B.S. in Computer Science (in progress)",
  "Hudson County Community College - A.S. in Computer Science, Phi Theta Kappa Honor Society",
  "North Bergen High School - Spanish Honors",
];

export default function ResumePage() {
  return (
    <div className="page-wrap">
      <section className="panel p-8 sm:p-10">
        <span className="kicker">Resume</span>
        <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">Camilo Gomez</h1>
        <p className="muted mt-4 max-w-3xl text-lg">
          Bilingual operations and technical professional with hands-on experience in
          medical and legal interpretation, NLP annotation, transcription, and web
          engineering. Recognized for high-quality execution, fast adaptation, and
          consistent delivery in detail-heavy environments.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <article className="info-card">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="muted mt-2">Manhattan, NY 10012</p>
            <div className="mt-3 flex flex-col gap-2">
              <a className="primary-link" href="mailto:c6m1lo@proton.me">
                c6m1lo@proton.me
              </a>
              <a
                className="primary-link"
                href="https://www.linkedin.com/in/camilogomezvalencia/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
              <a
                className="primary-link"
                href="https://github.com/fullstacknyc"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                className="primary-link"
                href="https://www.discord.gg/Khd7HPUzRK"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
            </div>
          </article>

          <article className="info-card">
            <h2 className="text-xl font-semibold">Core Strengths</h2>
            <ul className="muted mt-2 space-y-1">
              {strengths.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        </div>

        <section className="mt-6 info-card">
          <h2 className="text-xl font-semibold">Professional Experience</h2>
          <ul className="mt-3 space-y-3">
            {experience.map((item) => (
              <li key={`${item.role}-${item.company}`}>
                <p className="font-semibold text-white">{item.role}</p>
                <p className="muted">{item.company}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 info-card">
          <h2 className="text-xl font-semibold">Education</h2>
          <ul className="muted mt-2 space-y-1">
            {education.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  );
}
