"use client";

import { useEffect, useMemo, useState } from "react";

import { getAllEntries } from "../journal/storage";
import type { JournalEntry } from "../journal/types";
import { getActiveSession, getSessions } from "../scheduler/storage";
import type { ActiveSession, TimeSession } from "../scheduler/types";
import {
  buildCalendarItems,
  buildJournalItems,
  buildSessionItems,
  mergeTimelineChronologically,
} from "../shared/timeline";
import { subscribeAppDataChanges } from "../shared/sync";
import {
  getCalendarEvents,
  removeCalendarEvent,
  upsertCalendarEvent,
} from "./storage";
import { DEFAULT_CALENDAR_DRAFT, type CalendarDraft, type CalendarEvent } from "./types";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toLocalDateTimeInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function toDraft(event: CalendarEvent): CalendarDraft {
  return {
    title: event.title,
    startsAt: toLocalDateTimeInput(event.startsAt),
    endsAt: toLocalDateTimeInput(event.endsAt),
    notes: event.notes ?? "",
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [draft, setDraft] = useState<CalendarDraft>(DEFAULT_CALENDAR_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setError(null);

        const [nextJournalEntries] = await Promise.all([getAllEntries()]);
        setJournalEntries(nextJournalEntries);
        setSessions(getSessions());
        setActiveSession(getActiveSession());
        setEvents(getCalendarEvents());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load calendar data.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadAll();

    const unsubscribe = subscribeAppDataChanges(() => {
      void loadAll();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const mergedTimeline = useMemo(
    () =>
      mergeTimelineChronologically([
        ...buildCalendarItems(events),
        ...buildJournalItems(journalEntries),
        ...buildSessionItems(sessions, activeSession),
      ]),
    [activeSession, events, journalEntries, sessions],
  );

  const saveEvent = () => {
    const title = draft.title.trim();
    const startsAt = parseLocalDateTime(draft.startsAt);
    const endsAt = parseLocalDateTime(draft.endsAt);

    if (!title || !startsAt || !endsAt) {
      setError("Calendar events require title, start, and end time.");
      return;
    }

    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setError("Calendar event end time must be after start time.");
      return;
    }

    const candidate: CalendarEvent = {
      id: editingId ?? makeId(),
      title,
      startsAt,
      endsAt,
      notes: draft.notes.trim() || undefined,
    };

    upsertCalendarEvent(candidate);
    setEvents(getCalendarEvents());
    setDraft(DEFAULT_CALENDAR_DRAFT);
    setEditingId(null);
    setError(null);
  };

  const beginEdit = (event: CalendarEvent) => {
    setEditingId(event.id);
    setDraft(toDraft(event));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEvent = (event: CalendarEvent) => {
    if (!window.confirm("Delete this calendar event?")) return;
    removeCalendarEvent(event.id);
    setEvents(getCalendarEvents());

    if (editingId === event.id) {
      setEditingId(null);
      setDraft(DEFAULT_CALENDAR_DRAFT);
    }
  };

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <span className="kicker">Calendar</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Connected Calendar</h1>
        <p className="muted mt-3 max-w-3xl text-sm sm:text-base">
          Chronological source of truth that merges Journal entries, Millisecond Tracker sessions, and Calendar blocks.
        </p>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Calendar Event" : "Create Calendar Event"}</h2>
          <p className="text-xs text-neutral-400">Local and async-connected</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-neutral-300">
            Title
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Deep work block"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-300">
            Notes
            <input
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional details"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-300">
            Starts at
            <input
              type="datetime-local"
              value={draft.startsAt}
              onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-300">
            Ends at
            <input
              type="datetime-local"
              value={draft.endsAt}
              onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={saveEvent}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            {editingId ? "Update Event" : "Save Event"}
          </button>
          {editingId ? (
            <button
              onClick={() => {
                setEditingId(null);
                setDraft(DEFAULT_CALENDAR_DRAFT);
              }}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Calendar Events</h2>
        <div className="mt-3 space-y-2">
          {events.length ? (
            events.map((event) => (
              <article key={event.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{event.title}</p>
                  <span className="text-neutral-300">
                    {new Date(event.startsAt).toLocaleTimeString()} - {new Date(event.endsAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">{new Date(event.startsAt).toLocaleString()}</p>
                {event.notes ? <p className="mt-2 text-sm text-neutral-300">{event.notes}</p> : null}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => beginEdit(event)}
                    className="rounded-md border border-white/20 px-2.5 py-1 text-xs transition hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEvent(event)}
                    className="rounded-md border border-red-900/70 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-950/50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No calendar events yet.</p>
          )}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Unified Chronological Timeline</h2>
        <p className="muted mt-1 text-sm">Asynchronous merge of Journal, Tracker, and Calendar entries.</p>
        <div className="mt-3 space-y-2">
          {mergedTimeline.length ? (
            mergedTimeline.map((item) => (
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
            <p className="text-sm text-neutral-400">No timeline items yet.</p>
          )}
        </div>
      </section>

      {isLoading && <p className="text-sm text-neutral-400">Loading connected timeline...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
