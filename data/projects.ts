export type HomeScene = "book" | "timer" | "gear" | "speaker";

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
    description: "Real-time activity tracker with editable sessions synced to Journal.",
    href: "/scheduler",
    cta: "Open app",
    homeQuote: "`What gets measured in minutes becomes visible in your life.`",
    homeScene: "timer",
    showInHomeFeed: true,
  },
];
