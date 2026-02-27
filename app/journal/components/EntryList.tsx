"use client";

import type { JournalEntry } from "../types";

type EntryListProps = {
  title: string;
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  emptyText: string;
};

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function EntryList({ title, entries, onEdit, onDelete, emptyText }: EntryListProps) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-neutral-400">{entries.length} entries</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-700 bg-neutral-950 p-4 text-sm text-neutral-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="info-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-neutral-400">{formatDate(entry.timestamp)}</p>
                  {entry.title ? <h3 className="mt-1 text-base font-semibold">{entry.title}</h3> : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-200 transition hover:bg-neutral-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry)}
                    className="rounded-md border border-red-900/70 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-950/50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm text-neutral-200">{entry.body}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {entry.snapshot.tags.map((tag) => (
                  <span
                    key={`${entry.id}-${tag}`}
                    className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400 sm:grid-cols-5">
                <span>Sleep: {entry.snapshot.sleep}</span>
                <span>Energy: {entry.snapshot.energy}</span>
                <span>Mood: {entry.snapshot.mood}</span>
                <span>Stress: {entry.snapshot.stress}</span>
                <span>Focus: {entry.snapshot.focus}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
