"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

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
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const exportEntries = () => {
    const now = new Date();
    const pad2 = (value: number) => String(value).padStart(2, "0");
    const localDate = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const militaryTime = `${pad2(now.getHours())}${pad2(now.getMinutes())}`;
    const militaryTimeLabel = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

    const payload = {
      exportedAt: now.toISOString(),
      exportedAtLocal: `${militaryTimeLabel} ${localDate}`,
      version: 1,
      entries,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `journal-${militaryTime}-${localDate}.json`;
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
    </div>
  );
}
