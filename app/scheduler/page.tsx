"use client";

import { useEffect, useMemo, useState } from "react";

import { getCalendarEvents } from "../calendar/storage";
import type { CalendarEvent } from "../calendar/types";
import { getAllEntries } from "../journal/storage";
import type { JournalEntry } from "../journal/types";
import {
  buildCalendarItems,
  buildJournalItems,
  buildSessionItems,
  mergeTimelineChronologically,
} from "../shared/timeline";
import { subscribeAppDataChanges } from "../shared/sync";
import { getActiveSession, getSessions, saveActiveSession, saveSessions } from "./storage";
import type { ActiveSession, TimeSession } from "./types";

type SessionDraft = {
  activity: string;
  startedAt: string;
  endedAt: string;
};

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatShortDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function startOfTodayMs() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function extractJournalSuggestions(entries: JournalEntry[]) {
  const tally = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.snapshot.tags) {
      const normalized = tag.trim().toLowerCase();
      if (!normalized) continue;
      tally.set(normalized, (tally.get(normalized) ?? 0) + 3);
    }

    if (entry.title) {
      const clean = entry.title.trim().toLowerCase();
      if (clean.length >= 3 && clean.length <= 36) {
        tally.set(clean, (tally.get(clean) ?? 0) + 1);
      }
    }
  }

  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([value]) => value);
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toLocalDateTimeInput(iso: string) {
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

export default function SchedulerPage() {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activityInput, setActivityInput] = useState("");
  const [journalSuggestions, setJournalSuggestions] = useState<string[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SessionDraft>({ activity: "", startedAt: "", endedAt: "" });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setError(null);
        const [entries] = await Promise.all([getAllEntries()]);

        const nextSessions = getSessions();
        const nextActive = getActiveSession();
        const nextCalendarEvents = getCalendarEvents();

        setSessions(nextSessions);
        setActiveSession(nextActive);
        setJournalEntries(entries);
        setJournalSuggestions(extractJournalSuggestions(entries));
        setCalendarEvents(nextCalendarEvents);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load scheduler data.");
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

  const todaySessions = useMemo(() => {
    const cutoff = startOfTodayMs();

    const completedToday = sessions.filter((session) => {
      const endedAtMs = new Date(session.endedAt).getTime();
      return Number.isFinite(endedAtMs) && endedAtMs >= cutoff;
    });

    if (!activeSession) return completedToday;

    return [
      {
        id: activeSession.id,
        activity: activeSession.activity,
        startedAt: activeSession.startedAt,
        endedAt: new Date(nowMs).toISOString(),
        source: activeSession.source,
      },
      ...completedToday,
    ];
  }, [activeSession, nowMs, sessions]);

  const activityTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const session of todaySessions) {
      const duration =
        Math.max(0, new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime());
      totals.set(session.activity, (totals.get(session.activity) ?? 0) + duration);
    }

    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [todaySessions]);

  const trackedTodayMs = useMemo(
    () => activityTotals.reduce((sum, [, duration]) => sum + duration, 0),
    [activityTotals],
  );

  const activeElapsedMs = activeSession
    ? Math.max(0, nowMs - new Date(activeSession.startedAt).getTime())
    : 0;

  const todayCalendarEvents = useMemo(() => {
    const cutoff = startOfTodayMs();
    const end = cutoff + 24 * 60 * 60 * 1000;

    return calendarEvents.filter((event) => {
      const startsAtMs = new Date(event.startsAt).getTime();
      return startsAtMs >= cutoff && startsAtMs < end;
    });
  }, [calendarEvents]);

  const unifiedTodayTimeline = useMemo(() => {
    const cutoff = startOfTodayMs();

    return mergeTimelineChronologically([
      ...buildJournalItems(journalEntries),
      ...buildSessionItems(sessions, activeSession),
      ...buildCalendarItems(calendarEvents),
    ]).filter((item) => new Date(item.startsAt).getTime() >= cutoff);
  }, [activeSession, calendarEvents, journalEntries, sessions]);

  const startTracking = (source: "manual" | "journal") => {
    const activity = activityInput.trim().toLowerCase();

    if (!activity || activeSession) return;

    const nextSession: ActiveSession = {
      id: makeId(),
      activity,
      startedAt: new Date().toISOString(),
      source,
    };

    setActiveSession(nextSession);
    saveActiveSession(nextSession);
    setActivityInput("");
  };

  const stopTracking = () => {
    if (!activeSession) return;

    const endedAt = new Date().toISOString();
    const finishedSession: TimeSession = {
      id: activeSession.id,
      activity: activeSession.activity,
      startedAt: activeSession.startedAt,
      endedAt,
      source: activeSession.source,
    };

    const next = [finishedSession, ...sessions].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    setSessions(next);
    saveSessions(next);

    setActiveSession(null);
    saveActiveSession(null);
  };

  const fillSuggestion = (suggestion: string) => {
    setActivityInput(suggestion);
  };

  const beginEditSession = (session: TimeSession) => {
    setEditingSessionId(session.id);
    setEditDraft({
      activity: session.activity,
      startedAt: toLocalDateTimeInput(session.startedAt),
      endedAt: toLocalDateTimeInput(session.endedAt),
    });
  };

  const saveEditedSession = () => {
    if (!editingSessionId) return;

    const nextActivity = editDraft.activity.trim().toLowerCase();
    const nextStart = parseLocalDateTime(editDraft.startedAt);
    const nextEnd = parseLocalDateTime(editDraft.endedAt);

    if (!nextActivity || !nextStart || !nextEnd) {
      setError("Session edits require a valid activity, start time, and end time.");
      return;
    }

    if (new Date(nextEnd).getTime() <= new Date(nextStart).getTime()) {
      setError("Session end time must be after the start time.");
      return;
    }

    const next = sessions.map((session) =>
      session.id === editingSessionId
        ? {
            ...session,
            activity: nextActivity,
            startedAt: nextStart,
            endedAt: nextEnd,
          }
        : session,
    );

    setSessions(next);
    saveSessions(next);
    setEditingSessionId(null);
    setEditDraft({ activity: "", startedAt: "", endedAt: "" });
    setError(null);
  };

  const removeSession = (sessionId: string) => {
    const next = sessions.filter((session) => session.id !== sessionId);
    setSessions(next);
    saveSessions(next);

    if (editingSessionId === sessionId) {
      setEditingSessionId(null);
      setEditDraft({ activity: "", startedAt: "", endedAt: "" });
    }
  };

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <span className="kicker">Scheduler</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Millisecond Scheduler</h1>
        <p className="muted mt-3 max-w-3xl text-sm sm:text-base">
          Live tracking with cross-app context from Journal and Calendar, ordered into one chronological day.
        </p>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Live Tracker</h2>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-neutral-300">
            {activeSession ? "Tracking now" : "Idle"}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <label className="block text-sm text-neutral-300" htmlFor="activity-input">
              What are you doing right now?
            </label>
            <input
              id="activity-input"
              value={activityInput}
              onChange={(event) => setActivityInput(event.target.value)}
              placeholder="deep work, meeting, planning, workout"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-500 focus:border-white/40"
              disabled={!!activeSession || isLoading}
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => startTracking("manual")}
                disabled={!activityInput.trim() || !!activeSession || isLoading}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition enabled:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start timer
              </button>
              <button
                onClick={stopTracking}
                disabled={!activeSession || isLoading}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:border-white/50 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Stop timer
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Current session</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {activeSession ? activeSession.activity : "No active session"}
            </p>
            <p className="mt-2 text-sm text-neutral-300">
              {activeSession ? formatDuration(activeElapsedMs) : "00:00:00"}
            </p>
            {activeSession && (
              <p className="mt-2 text-xs text-neutral-400">
                Started {new Date(activeSession.startedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Journal Suggestions</h2>
        <p className="muted mt-1 text-sm">Generated from your journal tags and titles.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {journalSuggestions.length ? (
            journalSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => fillSuggestion(suggestion)}
                disabled={!!activeSession || isLoading}
                className="rounded-full border border-white/18 bg-white/5 px-3 py-1.5 text-xs text-neutral-200 transition enabled:hover:border-white/40 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {suggestion}
              </button>
            ))
          ) : (
            <p className="text-sm text-neutral-400">
              Add tags in <a href="/journal" className="underline">Journal App</a> to unlock suggestions.
            </p>
          )}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Calendar Context</h2>
        <p className="muted mt-1 text-sm">Today&apos;s calendar blocks from the connected Calendar app.</p>
        <div className="mt-3 space-y-2">
          {todayCalendarEvents.length ? (
            todayCalendarEvents.map((event) => (
              <div key={event.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                <p className="font-medium text-white">{event.title}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(event.startsAt).toLocaleTimeString()} - {new Date(event.endsAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No calendar blocks for today yet.</p>
          )}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Today at a glance</h2>
        <p className="muted mt-1 text-sm">Real-time breakdown of your tracked time for {new Date().toLocaleDateString()}.</p>

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Tracked today</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatShortDuration(trackedTodayMs)}</p>
        </div>

        <div className="mt-4 space-y-2">
          {activityTotals.length ? (
            activityTotals.map(([activity, duration]) => {
              const pct = trackedTodayMs > 0 ? (duration / trackedTodayMs) * 100 : 0;

              return (
                <div key={activity} className="rounded-xl border border-white/12 bg-black/30 p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{activity}</span>
                    <span className="text-neutral-300">{formatShortDuration(duration)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-white/70" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-neutral-400">No tracked sessions yet today.</p>
          )}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Edit Tracked Sessions</h2>
          <p className="text-xs text-neutral-400">Rename, retime, or delete completed actions.</p>
        </div>

        {editingSessionId ? (
          <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-neutral-300">
                Activity
                <input
                  value={editDraft.activity}
                  onChange={(event) => setEditDraft((current) => ({ ...current, activity: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-neutral-300">
                Start
                <input
                  type="datetime-local"
                  value={editDraft.startedAt}
                  onChange={(event) => setEditDraft((current) => ({ ...current, startedAt: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-neutral-300">
                End
                <input
                  type="datetime-local"
                  value={editDraft.endedAt}
                  onChange={(event) => setEditDraft((current) => ({ ...current, endedAt: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={saveEditedSession}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Save edit
              </button>
              <button
                onClick={() => {
                  setEditingSessionId(null);
                  setEditDraft({ activity: "", startedAt: "", endedAt: "" });
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {sessions.length ? (
            sessions.slice(0, 20).map((session) => {
              const duration = Math.max(0, new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime());

              return (
                <article key={session.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{session.activity}</p>
                    <span className="text-neutral-300">{formatShortDuration(duration)}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(session.startedAt).toLocaleString()} - {new Date(session.endedAt).toLocaleTimeString()}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => beginEditSession(session)}
                      className="rounded-md border border-white/20 px-2.5 py-1 text-xs transition hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeSession(session.id)}
                      className="rounded-md border border-red-900/70 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-950/50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-neutral-400">No completed sessions yet. Start a timer above.</p>
          )}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Chronological Timeline (All Apps)</h2>
        <p className="muted mt-1 text-sm">Journal + Scheduler + Calendar merged by time.</p>
        <div className="mt-3 space-y-2">
          {unifiedTodayTimeline.length ? (
            unifiedTodayTimeline.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{item.title}</p>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase text-neutral-300">
                    {item.app}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">{new Date(item.startsAt).toLocaleString()}</p>
                <p className="mt-2 text-sm text-neutral-300">{item.detail}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No timeline events today yet.</p>
          )}
        </div>
      </section>

      {isLoading && <p className="text-sm text-neutral-400">Loading scheduler data...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
