"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-wrap">
      <section className="panel p-8 sm:p-10">
        <span className="kicker">Error</span>
        <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">Something went wrong</h1>
        <p className="muted mt-4 max-w-2xl">
          Try again. If it keeps happening, reach out via the support page.
        </p>
        <div className="hero-actions mt-6">
          <button type="button" className="hero-btn hero-btn-primary" onClick={reset}>
            Retry
          </button>
          <Link className="hero-btn hero-btn-secondary" href="/support">
            Support
          </Link>
        </div>
      </section>
    </div>
  );
}
