import "./globals.css";

import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";

import AdSense from "@/components/AdSense";
import GlobalThemeSync from "@/components/GlobalThemeSync";
import ThemeInitScript from "@/components/ThemeInitScript";
import NavSearch from "@/components/NavSearch";
import { projects } from "@/data/projects";
import { Analytics } from "@vercel/analytics/next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.c6m1lo.com";

const valencia = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-valencia",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "c6m1lo",
    template: "%s | Camilo Gomez",
  },
  description: "Portfolio and personal website of my projects, skills, and experience.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  keywords: ["Camilo Gomez", "C6m1lo", "portfolio", "projects", "resume"],
  openGraph: {
    title: "c6m1lo",
    description: "Portfolio and personal website of my projects, skills, and experience.",
    url: SITE_URL,
    siteName: "c6m1lo",
    images: [
      {
        url: `${SITE_URL}/sistineChapel.jpg`,
        width: 1200,
        height: 630,
        alt: "c6m1lo — Sistine Chapel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "c6m1lo",
    description: "Portfolio and personal website of my projects, skills, and products for sale.",
    images: [`${SITE_URL}/sistineChapel.jpg`],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  const searchItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Projects", href: "/projects" },
    { label: "Resume", href: "/resume" },
    ...projects
      .map((project) => ({ label: project.title, href: project.href }))
      .filter((item) => item.href?.startsWith("/")),
    { label: "Support", href: "/support" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/tos" },
  ];

  return (
    <html lang="en" suppressHydrationWarning className={valencia.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <ThemeInitScript />
        <AdSense pId="ca-pub-9659879669905345" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <GlobalThemeSync />

        <nav className="top-nav" aria-label="Primary">
          <div className="content top-nav-inner">
            <div className="nav-left">
              <Link href="/" className="brand" aria-label="c6m1lo home">
                <span className="brand-prompt">&gt;</span>
                <span className="brand-name">c6m1lo</span>
                <span className="brand-cursor" aria-hidden="true">
                  █
                </span>
              </Link>
              <NavSearch items={searchItems} />
            </div>
            <div className="nav-links">
              <Link className="nav-link" href="/">
                Home
              </Link>
              <Link className="nav-link" href="/shop">
                Shop
              </Link>
              <Link className="nav-link" href="/projects">
                Projects
              </Link>
              <Link className="nav-link" href="/resume">
                Resume
              </Link>
            </div>
          </div>
        </nav>

        <main id="main-content" className="app-main" tabIndex={-1}>
          <div className="content">{children}</div>
        </main>

        <footer className="site-footer">
          <div className="content footer-row">
            <p>© {new Date().getFullYear()} CAMILO VALENCIA. All rights reserved.</p>
            <div className="footer-links">
              <a className="footer-link" href="/privacy">
                Privacy Policy
              </a>
              <a className="footer-link" href="/support">
                Support
              </a>
              <a className="footer-link" href="/tos">
                Terms of Service
              </a>
              <a
                className="footer-link"
                href="https://buy.stripe.com/dRm8wPh2Z2ZS1XB2XJ9oc09"
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
