"use client";

import { useEffect, useMemo, useState } from "react";

import { getAllEntries } from "../journal/storage";
import type { JournalEntry } from "../journal/types";
import { getActiveSession, getSessions, saveActiveSession, saveSessions } from "./storage";
import type { ActiveSession, TimeSession } from "./types";

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

export default function SchedulerPage() {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activityInput, setActivityInput] = useState("");
  const [journalSuggestions, setJournalSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [storedEntries, journalEntries] = await Promise.all([Promise.resolve(getSessions()), getAllEntries()]);

        setSessions(storedEntries);
        setActiveSession(getActiveSession());
        setJournalSuggestions(extractJournalSuggestions(journalEntries));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load scheduler data.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
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

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <span className="kicker">Scheduler</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Millisecond Scheduler</h1>
        <p className="muted mt-3 max-w-3xl text-sm sm:text-base">
          Live time tracking that learns from your journal tags and topics so you can see where today is going.
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
        <p className="muted mt-1 text-sm">Generated from your journal tags and entry titles.</p>
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
              Add tags to journal entries in <a href="/journal" className="underline">Journal App</a> to unlock suggestions.
            </p>
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
        <h2 className="text-lg font-semibold">Recent Sessions</h2>
        <div className="mt-3 space-y-2">
          {sessions.length ? (
            sessions.slice(0, 12).map((session) => {
              const duration =
                Math.max(0, new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime());

              return (
                <article key={session.id} className="rounded-xl border border-white/12 bg-black/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{session.activity}</p>
                    <span className="text-neutral-300">{formatShortDuration(duration)}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(session.startedAt).toLocaleString()} - {new Date(session.endedAt).toLocaleTimeString()} ({session.source})
                  </p>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-neutral-400">No completed sessions yet. Start a timer above.</p>
          )}
        </div>
      </section>

      {isLoading && <p className="text-sm text-neutral-400">Loading scheduler data...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
