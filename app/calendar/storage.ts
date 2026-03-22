import { publishAppDataChange } from "../shared/sync";

import type { CalendarEvent } from "./types";

const STORAGE_KEY = "camilo777-calendar-events";

function canUseWindow() {
  return typeof window !== "undefined";
}

export function getCalendarEvents(): CalendarEvent[] {
  if (!canUseWindow()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CalendarEvent[];
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1));
  } catch {
    return [];
  }
}

export function saveCalendarEvents(events: CalendarEvent[]) {
  if (!canUseWindow()) return;

  const sorted = [...events].sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

export function upsertCalendarEvent(event: CalendarEvent) {
  const next = [event, ...getCalendarEvents().filter((item) => item.id !== event.id)];
  saveCalendarEvents(next);
  publishAppDataChange({ domain: "calendar", action: "upsert" });
}

export function removeCalendarEvent(id: string) {
  const next = getCalendarEvents().filter((item) => item.id !== id);
  saveCalendarEvents(next);
  publishAppDataChange({ domain: "calendar", action: "delete" });
}
