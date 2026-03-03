"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/resume", label: "Resume" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="site-nav">
      <div className="site-nav-inner mx-auto max-w-6xl px-5 py-3 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="site-nav-brand text-lg font-semibold tracking-tight">
            c6m1lo
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="site-nav-menu rounded-md px-2.5 py-1.5 text-xs sm:hidden"
          >
            Menu
          </button>
        </div>
        <ul className={`${isOpen ? "mt-3 flex" : "hidden"} flex-col gap-1 sm:mt-0 sm:flex sm:flex-row sm:items-center`}>
          {navLinks.map((item) => {
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`site-nav-link block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "is-active"
                      : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
