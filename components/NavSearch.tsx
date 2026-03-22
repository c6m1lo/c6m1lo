"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchItem = {
  label: string;
  href: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s._-]+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

export default function NavSearch({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const scored = items
      .map((item) => {
        const label = normalize(item.label);
        const href = normalize(item.href);
        const hay = `${label} ${href}`;
        const starts = label.startsWith(q) || href.startsWith(q);
        const includes = hay.includes(q);
        const score = starts ? 2 : includes ? 1 : 0;
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));

    return scored.slice(0, 7).map((entry) => entry.item);
  }, [items, query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="nav-search" ref={containerRef}>
      <input
        className="nav-search-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.currentTarget as HTMLInputElement).blur();
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            const first = results[0];
            if (first) go(first.href);
          }
        }}
        placeholder="search"
        aria-label="Search"
        autoComplete="off"
        spellCheck={false}
      />

      {open && results.length ? (
        <div className="nav-search-panel" role="listbox" aria-label="Search results">
          {results.map((item) => (
            <button
              key={`${item.href}:${item.label}`}
              type="button"
              className="nav-search-item"
              onClick={() => go(item.href)}
            >
              <span className="nav-search-label">{item.label}</span>
              <span className="nav-search-href">{item.href}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

