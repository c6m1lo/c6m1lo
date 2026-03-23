import type { ActiveSession, TimeSession } from "./types";

const SESSIONS_STORAGE_KEY = "camilo777-scheduler-sessions";
const ACTIVE_STORAGE_KEY = "camilo777-scheduler-active";

function canUseWindow() {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isTimeSession(value: unknown): value is TimeSession {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.activity === "string" &&
    typeof value.startedAt === "string" &&
    typeof value.endedAt === "string"
  );
}

function isActiveSession(value: unknown): value is ActiveSession {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.activity === "string" &&
    typeof value.startedAt === "string"
  );
}

export function getSessions(): TimeSession[] {
  if (!canUseWindow()) return [];
  const parsed = safeParse<unknown[]>(window.localStorage.getItem(SESSIONS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isTimeSession);
}

export function getActiveSession(): ActiveSession | null {
  if (!canUseWindow()) return null;
  const parsed = safeParse<unknown>(window.localStorage.getItem(ACTIVE_STORAGE_KEY));
  return isActiveSession(parsed) ? parsed : null;
}

