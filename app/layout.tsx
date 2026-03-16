import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import AdSense from "@/components/AdSense";
import GlobalThemeSync from "@/components/GlobalThemeSync";
import ThemeInitScript from "@/components/ThemeInitScript";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.c6m1lo.com";

export const metadata: Metadata = {
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
  keywords: [
    "Camilo Gomez",
    "C6m1lo",
    "portfolio",
    "projects",
    "resume",
  ],
  openGraph: {
    title: "c6m1lo",
    description: "Portfolio and personal website of my projects, skills, and experience.",
    url: SITE_URL,
    siteName: "Camilo777",
    images: [
      {
        url: `${SITE_URL}/198.jpg`,
        width: 1200,
        height: 630,
        alt: "c6m1lo — Camilo Gomez",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "c6m1lo",
    description: "Portfolio and personal website of my projects, skills, and experience.",
    images: [`${SITE_URL}/198.jpg`],
  },
};

export const viewport = {
  themeColor: "#000000",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeInitScript />
        <AdSense pId="ca-pub-9659879669905345"></AdSense>
      </head>
      <body className="antialiased">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <GlobalThemeSync />
        <Navbar />
        <main id="main-content" className="min-h-screen" tabIndex={-1}>
          {children}
        </main>
        <footer className="mt-14 border-t border-neutral-800 bg-black/90">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-neutral-400 sm:px-8">
            <p>© {new Date().getFullYear()} Camilo Gomez. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <a className="transition hover:text-neutral-100" href="/privacy">
                Privacy Policy
              </a>
              <a className="transition hover:text-neutral-100" href="/support">
                Support
              </a>
              <a className="transition hover:text-neutral-100" href="/tos">
                Terms of Service
              </a>
              <a
                className="transition hover:text-neutral-100"
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
