"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCalendarEvents } from "../calendar/storage";
import type { CalendarEvent } from "../calendar/types";
import { getActiveSession, getSessions } from "../scheduler/storage";
import type { ActiveSession, TimeSession } from "../scheduler/types";
import { subscribeAppDataChanges } from "../shared/sync";
import {
  buildCalendarItems,
  buildJournalItems,
  buildSessionItems,
  mergeTimelineChronologically,
} from "../shared/timeline";

import EntryEditor from "./components/EntryEditor";
import EntryList from "./components/EntryList";
import WeeklySummary from "./components/WeeklySummary";
import { getAllEntries, removeEntry, replaceAllEntries, upsertEntry } from "./storage";
import { DEFAULT_DRAFT, type JournalDraft, type JournalEntry } from "./types";

function toTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDraft(entry: JournalEntry): JournalDraft {
  return {
    title: entry.title ?? "",
    body: entry.body,
    tags: entry.snapshot.tags.join(", "),
    sleep: entry.snapshot.sleep,
    energy: entry.snapshot.energy,
    mood: entry.snapshot.mood,
    stress: entry.snapshot.stress,
    focus: entry.snapshot.focus,
  };
}

function toEntry(draft: JournalDraft, existing?: JournalEntry): JournalEntry {
  const id = existing?.id ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`);
  const timestamp = existing?.timestamp ?? new Date().toISOString();

  return {
    id,
    timestamp,
    title: draft.title.trim() || undefined,
    body: draft.body.trim(),
    snapshot: {
      sleep: draft.sleep,
      energy: draft.energy,
      mood: draft.mood,
      stress: draft.stress,
      focus: draft.focus,
      tags: toTags(draft.tags),
    },
  };
}

function toLocalDateKey(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function isSameDate(isoTimestamp: string, dateFilter: string) {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return false;
  return toLocalDateKey(date) === dateFilter;
}

function isToday(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return toLocalDateKey(date) === toLocalDateKey(new Date());
}

function isEntryShape(value: unknown): value is JournalEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<JournalEntry>;
  return !!entry.id && !!entry.timestamp && typeof entry.body === "string" && !!entry.snapshot;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState<JournalDraft>(DEFAULT_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const all = await getAllEntries();
        setEntries(all);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load journal entries.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const loadConnected = () => {
      setSessions(getSessions());
      setActiveSession(getActiveSession());
      setCalendarEvents(getCalendarEvents());
    };

    loadConnected();

    const unsubscribe = subscribeAppDataChanges(() => {
      loadConnected();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesDate = dateFilter ? isSameDate(entry.timestamp, dateFilter) : true;
      if (!matchesDate) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        entry.title ?? "",
        entry.body,
        entry.snapshot.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [dateFilter, entries, search]);

  const todaysEntries = useMemo(
    () => filteredEntries.filter((entry) => isToday(entry.timestamp)),
    [filteredEntries],
  );

  const previousEntries = useMemo(
    () => filteredEntries.filter((entry) => !isToday(entry.timestamp)),
    [filteredEntries],
  );

  const editingEntry = useMemo(
    () => (editingId ? entries.find((entry) => entry.id === editingId) ?? null : null),
    [editingId, entries],
  );

  const saveEntry = async () => {
    const target = editingEntry;
    const candidate = toEntry(draft, target ?? undefined);

    if (!candidate.body) {
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      await upsertEntry(candidate);

      setEntries((current) => {
        const next = [candidate, ...current.filter((item) => item.id !== candidate.id)];
        return next.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      });

      setDraft(DEFAULT_DRAFT);
      setEditingId(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save entry.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (entry: JournalEntry) => {
    const confirmed = window.confirm("Delete this journal entry permanently?");
    if (!confirmed) return;

    try {
      setError(null);
      await removeEntry(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));

      if (editingId === entry.id) {
        setEditingId(null);
        setDraft(DEFAULT_DRAFT);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete entry.");
    }
  };

  const beginEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setDraft(toDraft(entry));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportEntries = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      entries,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `journal-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const onImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setError(null);
      const text = await file.text();
      const parsed = JSON.parse(text) as { entries?: unknown };
      const incoming = Array.isArray(parsed.entries) ? parsed.entries.filter(isEntryShape) : [];

      if (!incoming.length) {
        throw new Error("No valid entries found in import file.");
      }

      const confirmed = window.confirm(
        `Import ${incoming.length} entries and replace current local journal data?`,
      );
      if (!confirmed) return;

      await replaceAllEntries(incoming);
      const sorted = [...incoming].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      setEntries(sorted);
      setEditingId(null);
      setDraft(DEFAULT_DRAFT);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to import entries.");
    }
  };

  const hasActiveFilters = !!search.trim() || !!dateFilter;

  const connectedTimeline = useMemo(
    () =>
      mergeTimelineChronologically([
        ...buildJournalItems(entries),
        ...buildSessionItems(sessions, activeSession),
        ...buildCalendarItems(calendarEvents),
      ]),
    [activeSession, calendarEvents, entries, sessions],
  );

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="kicker">Journal</span>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Journal App</h1>
            <p className="muted mt-3 max-w-3xl text-sm sm:text-base">
              Log-first daily journal for reflection and behavior tracking. Entirely local in this MVP.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-600/15 px-3 py-1 text-xs font-medium text-emerald-300">
            Local-only
          </span>
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingEntry ? "Edit Entry" : "Quick Capture"}</h2>
          <p className="text-xs text-neutral-400">Timestamp is created automatically</p>
        </div>

        <EntryEditor
          draft={draft}
          onChange={setDraft}
          onSubmit={() => void saveEntry()}
          submitLabel={editingEntry ? "Update Entry" : "Save Entry"}
          onCancel={editingEntry ? () => {
            setEditingId(null);
            setDraft(DEFAULT_DRAFT);
          } : undefined}
          disabled={isSaving}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportEntries}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 transition hover:bg-neutral-800"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={triggerImport}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 transition hover:bg-neutral-800"
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={(event) => void onImportFile(event)}
            className="hidden"
          />
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs">
            <span className="text-neutral-300">Search (title, body, tags)</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search entries"
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs">
            <span className="text-neutral-300">Date filter</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
          </label>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDateFilter("");
            }}
            className="mt-3 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 transition hover:bg-neutral-800"
          >
            Clear filters
          </button>
        ) : null}
      </section>

      <WeeklySummary entries={filteredEntries} />

      {error ? (
        <section className="panel p-5 sm:p-6">
          <p className="rounded-lg border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="panel p-5 sm:p-6">
          <p className="text-sm text-neutral-400">Loading journal entries...</p>
        </section>
      ) : (
        <>
          <EntryList
            title="Today"
            entries={todaysEntries}
            onEdit={beginEdit}
            onDelete={(entry) => void deleteEntry(entry)}
            emptyText="No entries logged today yet."
          />

          <EntryList
            title={hasActiveFilters ? "Filtered Results" : "Earlier Entries"}
            entries={hasActiveFilters ? filteredEntries.filter((entry) => !isToday(entry.timestamp)) : previousEntries}
            onEdit={beginEdit}
            onDelete={(entry) => void deleteEntry(entry)}
            emptyText={hasActiveFilters ? "No entries match your filters." : "No earlier entries yet."}
          />
        </>
      )}

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Connected Chronological Feed</h2>
        <p className="muted mt-1 text-sm">Journal + Millisecond Tracker + Calendar merged by time.</p>
        <div className="mt-3 space-y-2">
          {connectedTimeline.length ? (
            connectedTimeline.slice(-12).reverse().map((item) => (
              <article key={item.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{item.title}</p>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase text-neutral-300">
                    {item.app}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">{new Date(item.startsAt).toLocaleString()}</p>
                <p className="mt-2 text-sm text-neutral-300">{item.detail}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No cross-app timeline entries yet.</p>
          )}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Passphrase Lock (Optional)</h2>
        <p className="muted mt-2 text-sm">
          Planned feature. Journal data is local-only right now but not encrypted at rest in this MVP.
        </p>
        <div className="mt-3 rounded-lg border border-dashed border-neutral-700 bg-neutral-950 p-3 text-xs text-neutral-400">
          TODO: add passphrase-based encryption using Web Crypto (PBKDF2 + AES-GCM), then encrypt
          entry payloads before local storage writes.
        </div>
      </section>
    </div>
  );
}
