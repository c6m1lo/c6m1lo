import type { ActiveSession, TimeSession } from "./types";

const SESSIONS_KEY = "camilo777-scheduler-sessions";
const ACTIVE_SESSION_KEY = "camilo777-scheduler-active";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T | null) {
  if (typeof window === "undefined") return;

  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getSessions(): TimeSession[] {
  const parsed = readJson<TimeSession[]>(SESSIONS_KEY);
  if (!Array.isArray(parsed)) return [];

  return [...parsed].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export function saveSessions(sessions: TimeSession[]) {
  writeJson(SESSIONS_KEY, sessions);
}

export function getActiveSession(): ActiveSession | null {
  const parsed = readJson<ActiveSession>(ACTIVE_SESSION_KEY);
  if (!parsed) return null;
  if (!parsed.id || !parsed.activity || !parsed.startedAt || !parsed.source) return null;
  return parsed;
}

export function saveActiveSession(session: ActiveSession | null) {
  writeJson(ACTIVE_SESSION_KEY, session);
}
