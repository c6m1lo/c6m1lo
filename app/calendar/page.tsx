"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

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
import { getCalendarEvents, removeCalendarEvent, upsertCalendarEvent } from "./storage";
import { DEFAULT_CALENDAR_DRAFT, type CalendarDraft, type CalendarEvent } from "./types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DaySession = {
  id: string;
  activity: string;
  source: "manual" | "journal";
  startedAtMs: number;
  endedAtMs: number;
  isActive?: boolean;
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function minutesBetween(startMs: number, endMs: number) {
  const delta = endMs - startMs;
  if (!Number.isFinite(delta) || delta <= 0) return 0;
  return delta / 60000;
}

function formatDuration(totalMinutes: number) {
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function hueForString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

function toLocalDateTimeInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalDateOnlyInput(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
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

function toLocalDateKey(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function dateKeyFromDate(value: Date) {
  return toLocalDateKey(value);
}

function dateKeyFromIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : toLocalDateKey(date);
}

function buildMonthCells(anchor: Date) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);

    return {
      key: dateKeyFromDate(current),
      date: current,
      inMonth: current.getMonth() === month,
    };
  });
}

export default function CalendarPage() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [draft, setDraft] = useState<CalendarDraft>(DEFAULT_CALENDAR_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

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

  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);

  const timelineCountByDate = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const item of mergedTimeline) {
      const key = dateKeyFromIso(item.startsAt);
      byDate.set(key, (byDate.get(key) ?? 0) + 1);
    }
    return byDate;
  }, [mergedTimeline]);

  const eventCountByDate = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const event of events) {
      const key = dateKeyFromIso(event.startsAt);
      byDate.set(key, (byDate.get(key) ?? 0) + 1);
    }
    return byDate;
  }, [events]);

  const selectedDateKey = dateKeyFromDate(selectedDate);
  const selectedDayStart = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [selectedDate]);
  const selectedDayEnd = useMemo(() => {
    const end = new Date(selectedDayStart);
    end.setDate(end.getDate() + 1);
    return end;
  }, [selectedDayStart]);
  const selectedDayStartMs = selectedDayStart.getTime();
  const selectedDayEndMs = selectedDayEnd.getTime();

  const selectedDayCalendarEvents = useMemo(
    () =>
      events
        .filter((event) => dateKeyFromIso(event.startsAt) === selectedDateKey)
        .sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1)),
    [events, selectedDateKey],
  );

  const selectedDaySessions = useMemo(() => {
    const daySessions: DaySession[] = [];

    for (const session of sessions) {
      const startedAtMs = new Date(session.startedAt).getTime();
      const endedAtMs = new Date(session.endedAt).getTime();
      if (Number.isNaN(startedAtMs) || Number.isNaN(endedAtMs)) continue;

      const clippedStart = clamp(startedAtMs, selectedDayStartMs, selectedDayEndMs);
      const clippedEnd = clamp(endedAtMs, selectedDayStartMs, selectedDayEndMs);
      if (clippedEnd <= clippedStart) continue;

      daySessions.push({
        id: session.id,
        activity: session.activity,
        source: session.source,
        startedAtMs: clippedStart,
        endedAtMs: clippedEnd,
      });
    }

    if (activeSession) {
      const startedAtMs = new Date(activeSession.startedAt).getTime();
      if (!Number.isNaN(startedAtMs)) {
        const nowMs = Date.now();
        const clippedStart = clamp(startedAtMs, selectedDayStartMs, selectedDayEndMs);
        const clippedEnd = clamp(nowMs, selectedDayStartMs, selectedDayEndMs);

        if (clippedEnd > clippedStart) {
          daySessions.push({
            id: `active-${activeSession.id}`,
            activity: activeSession.activity,
            source: activeSession.source,
            startedAtMs: clippedStart,
            endedAtMs: clippedEnd,
            isActive: true,
          });
        }
      }
    }

    return daySessions.sort((a, b) => a.startedAtMs - b.startedAtMs);
  }, [activeSession, selectedDayEndMs, selectedDayStartMs, sessions]);

  const selectedDayTrackedMinutes = useMemo(
    () => selectedDaySessions.reduce((sum, session) => sum + minutesBetween(session.startedAtMs, session.endedAtMs), 0),
    [selectedDaySessions],
  );

  const selectedDayMinutesByActivity = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of selectedDaySessions) {
      const current = map.get(session.activity) ?? 0;
      map.set(session.activity, current + minutesBetween(session.startedAtMs, session.endedAtMs));
    }

    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [selectedDaySessions]);

  const selectedDayGaps = useMemo(() => {
    const gaps: Array<{ startMs: number; endMs: number }> = [];
    const sorted = selectedDaySessions;
    if (sorted.length < 2) return gaps;

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (!current || !next) continue;
      const gapMinutes = minutesBetween(current.endedAtMs, next.startedAtMs);
      if (gapMinutes >= 15) {
        gaps.push({ startMs: current.endedAtMs, endMs: next.startedAtMs });
      }
    }

    return gaps;
  }, [selectedDaySessions]);

  const selectedDayJournalEntries = useMemo(
    () =>
      journalEntries
        .filter((entry) => dateKeyFromIso(entry.timestamp) === selectedDateKey)
        .sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1)),
    [journalEntries, selectedDateKey],
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
    const date = new Date(event.startsAt);
    setSelectedDate(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
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

  const selectDay = (date: Date) => {
    setSelectedDate(date);

    if (!editingId && !draft.startsAt && !draft.endsAt) {
      const base = toLocalDateOnlyInput(date);
      setDraft((current) => ({
        ...current,
        startsAt: `${base}T09:00`,
        endsAt: `${base}T10:00`,
      }));
    }
  };

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const monthTitle = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const todayKey = dateKeyFromDate(new Date());
  const headingStyle = { color: "var(--accent-strong)" } as const;
  const textStyle = { color: "var(--foreground)" } as const;
  const mutedStyle = { color: "var(--foreground-soft)" } as const;

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <span className="kicker">Calendar</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Connected Calendar</h1>
        <p className="muted mt-3 max-w-3xl text-sm sm:text-base">
          Month view calendar with live signals from Journal, Millisecond Tracker, and Calendar events.
        </p>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Calendar Event" : "Create Calendar Event"}</h2>
          <p className="text-xs" style={mutedStyle}>Local and async-connected</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs" style={textStyle}>
            Title
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Deep work block"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs" style={textStyle}>
            Notes
            <input
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional details"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs" style={textStyle}>
            Starts at
            <input
              type="datetime-local"
              value={draft.startsAt}
              onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs" style={textStyle}>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{monthTitle}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-md border border-white/20 px-3 py-1.5 text-xs transition hover:bg-white/10"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
              className="rounded-md border border-white/20 px-3 py-1.5 text-xs transition hover:bg-white/10"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-md border border-white/20 px-3 py-1.5 text-xs transition hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-wide" style={mutedStyle}>
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {monthCells.map((cell) => {
            const isSelected = cell.key === selectedDateKey;
            const isToday = cell.key === todayKey;
            const eventCount = eventCountByDate.get(cell.key) ?? 0;
            const timelineCount = timelineCountByDate.get(cell.key) ?? 0;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => selectDay(cell.date)}
                className={`min-h-22 rounded-xl border p-2 text-left transition sm:min-h-28 ${
                  isSelected
                    ? "border-white/55 bg-white/12"
                    : "border-white/12 bg-black/35 hover:border-white/30 hover:bg-white/8"
                } ${cell.inMonth ? "" : "opacity-50"}`}
                style={cell.inMonth ? textStyle : mutedStyle}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`${isToday ? "rounded-full border border-emerald-400/60 px-1.5 py-0.5 text-emerald-200" : ""}`}>
                    {cell.date.getDate()}
                  </span>
                </div>

                {eventCount > 0 && (
                  <p className="mt-2 truncate rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-200">
                    {eventCount} calendar
                  </p>
                )}
                {timelineCount > eventCount && (
                  <p className="mt-1 truncate rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-200">
                    {timelineCount - eventCount} linked
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          Agenda for {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold" style={headingStyle}>
              Time used (Timer + Journal)
            </h3>
            <p className="mt-1 text-sm" style={mutedStyle}>
              Tracked today: <span style={headingStyle}>{formatDuration(selectedDayTrackedMinutes)}</span>
              {selectedDaySessions.some((s) => s.isActive) ? " (includes active session)" : ""}
            </p>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-white/12 bg-black/30 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={headingStyle}>
                    Day timeline
                  </p>
                  <p className="text-xs" style={mutedStyle}>
                    Local time
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[64px_1fr]">
                  <div className="hidden sm:grid sm:gap-6" aria-hidden="true">
                    {Array.from({ length: 7 }, (_, index) => (
                      <div key={index} className="text-[11px]" style={mutedStyle}>
                        {String(index * 4).padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>

                  <div className="relative h-[720px] overflow-hidden rounded-lg border border-white/12 bg-black/20">
                    <div className="pointer-events-none absolute inset-0">
                      {Array.from({ length: 24 }, (_, index) => (
                        <div
                          key={index}
                          className="absolute left-0 right-0 border-t border-white/10"
                          style={{ top: `${(index / 24) * 100}%` }}
                        />
                      ))}
                    </div>

                    {selectedDaySessions.map((session) => {
                      const minutesFromStart = minutesBetween(selectedDayStartMs, session.startedAtMs);
                      const durationMinutes = minutesBetween(session.startedAtMs, session.endedAtMs);
                      const topPercent = clamp((minutesFromStart / (24 * 60)) * 100, 0, 100);
                      const heightPercent = clamp((durationMinutes / (24 * 60)) * 100, 0.6, 100);
                      const hue = hueForString(session.activity);

                      return (
                        <div
                          key={session.id}
                          className="absolute left-2 right-2 rounded-md border px-2 py-1 text-[11px]"
                          style={{
                            top: `${topPercent}%`,
                            height: `${heightPercent}%`,
                            borderColor: `hsl(${hue} 80% 70% / 0.38)`,
                            background: `hsl(${hue} 80% 60% / 0.18)`,
                            color: "var(--foreground)",
                            minHeight: 18,
                          }}
                          title={`${session.activity} • ${new Date(session.startedAtMs).toLocaleTimeString()} - ${new Date(session.endedAtMs).toLocaleTimeString()}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold">
                              {session.activity}
                              {session.isActive ? " (active)" : ""}
                            </span>
                            <span className="opacity-80">
                              {formatDuration(durationMinutes)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {selectedDayJournalEntries.map((entry) => {
                      const entryMs = new Date(entry.timestamp).getTime();
                      if (Number.isNaN(entryMs)) return null;
                      const minutesFromStart = minutesBetween(selectedDayStartMs, entryMs);
                      const topPercent = clamp((minutesFromStart / (24 * 60)) * 100, 0, 100);
                      return (
                        <div
                          key={entry.id}
                          className="absolute left-2 right-2"
                          style={{ top: `${topPercent}%` }}
                          title={`${entry.title?.trim() || "Journal Entry"} • ${new Date(entry.timestamp).toLocaleTimeString()}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-white/70" aria-hidden="true" />
                            <span className="truncate text-[11px]" style={mutedStyle}>
                              {new Date(entry.timestamp).toLocaleTimeString()} — {entry.title?.trim() || "Journal"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/12 bg-black/30 p-3">
                <p className="text-sm font-semibold" style={headingStyle}>
                  Breakdown
                </p>

                <div className="mt-2 space-y-2">
                  {selectedDayMinutesByActivity.length ? (
                    selectedDayMinutesByActivity.map(([activity, minutes]) => (
                      <div key={activity} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{activity}</span>
                        <span className="font-semibold" style={headingStyle}>
                          {formatDuration(minutes)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={mutedStyle}>
                      No timer sessions tracked on this day yet.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold" style={headingStyle}>
                    Untracked gaps (15m+)
                  </p>
                  <div className="mt-2 space-y-1">
                    {selectedDayGaps.length ? (
                      selectedDayGaps.map((gap) => (
                        <p key={`${gap.startMs}-${gap.endMs}`} className="text-sm" style={mutedStyle}>
                          {new Date(gap.startMs).toLocaleTimeString()} → {new Date(gap.endMs).toLocaleTimeString()}{" "}
                          ({formatDuration(minutesBetween(gap.startMs, gap.endMs))})
                        </p>
                      ))
                    ) : (
                      <p className="text-sm" style={mutedStyle}>
                        No large gaps detected.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold" style={headingStyle}>Calendar Events</h3>
            <div className="mt-2 space-y-2">
              {selectedDayCalendarEvents.length ? (
                selectedDayCalendarEvents.map((event) => (
                  <article key={event.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium" style={headingStyle}>{event.title}</p>
                      <span style={mutedStyle}>
                        {new Date(event.startsAt).toLocaleTimeString()} - {new Date(event.endsAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.notes ? <p className="mt-2 text-sm" style={textStyle}>{event.notes}</p> : null}
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
                <p className="text-sm" style={mutedStyle}>No calendar events on this day.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold" style={headingStyle}>Journal Entries (Full)</h3>
            <div className="mt-2 space-y-2">
              {selectedDayJournalEntries.length ? (
                selectedDayJournalEntries.map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium" style={headingStyle}>{entry.title?.trim() || "Journal Entry"}</p>
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase" style={mutedStyle}>
                        journal
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={mutedStyle}>{new Date(entry.timestamp).toLocaleString()}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm" style={textStyle}>{entry.body}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm" style={mutedStyle}>No journal entries on this day.</p>
              )}
            </div>
          </div>

        </div>
      </section>

      {isLoading && <p className="text-sm" style={mutedStyle}>Loading connected timeline...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
