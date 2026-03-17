export type HomeScene = "book" | "timer" | "calendar" | "gear" | "speaker";

export type Project = {
  title: string;
  description: string;
  href: string;
  cta: string;
  homeQuote?: string;
  homeScene?: HomeScene;
  showInHomeFeed?: boolean;
};

export const projects: Project[] = [
  {
    title: "Bible App",
    description: "A simple Bible reading app built with React and Next.js.",
    href: "/bible",
    cta: "Open app",
    showInHomeFeed: false,
  },
  {
    title: "Text to Speech",
    description: "Paste text and have it read back using your browser’s built-in speech engine.",
    href: "/tts",
    cta: "Open app",
    homeQuote: "`Hear it out loud to catch what your eyes skip.`",
    homeScene: "speaker",
    showInHomeFeed: true,
  },
  {
    title: "Journal App",
    description: "Daily timestamped journal with local-only storage, search, filters, and weekly metrics.",
    href: "/journal",
    cta: "Open app",
    homeQuote: "`Write clearly enough to understand your own patterns over time.`",
    homeScene: "book",
    showInHomeFeed: true,
  },
  {
    title: "Millisecond Scheduler",
    description: "Real-time activity tracker with editable sessions synced to Journal and Calendar.",
    href: "/scheduler",
    cta: "Open app",
    homeQuote: "`What gets measured in minutes becomes visible in your life.`",
    homeScene: "timer",
    showInHomeFeed: true,
  },
  {
    title: "Calendar App",
    description: "Chronological planner that merges Journal entries, tracker sessions, and calendar events.",
    href: "/calendar",
    cta: "Open app",
    homeQuote: "`Order your day by time, not by intention alone.`",
    homeScene: "calendar",
    showInHomeFeed: true,
  },
  {
    title: "WebEdit",
    description: "Web-based editor for quickly creating and updating content in one place.",
    href: "/webedit",
    cta: "Open app",
    homeQuote: "`Edit faster so ideas ship sooner.`",
    homeScene: "gear",
    showInHomeFeed: true,
  },
];
