import type { CalendarEvent } from "../calendar/types";
import type { JournalEntry } from "../journal/types";
import type { ActiveSession, TimeSession } from "../scheduler/types";

export type TimelineItem = {
  id: string;
  app: "journal" | "scheduler" | "calendar";
  title: string;
  detail: string;
  startsAt: string;
  endsAt?: string;
};

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function buildJournalItems(entries: JournalEntry[]): TimelineItem[] {
  return entries.map((entry) => ({
    id: `journal-${entry.id}`,
    app: "journal",
    title: entry.title?.trim() || "Journal Entry",
    detail: clean(entry.body.slice(0, 120)),
    startsAt: entry.timestamp,
  }));
}

export function buildSessionItems(sessions: TimeSession[], activeSession: ActiveSession | null): TimelineItem[] {
  const completed = sessions.map((session) => ({
    id: `scheduler-${session.id}`,
    app: "scheduler" as const,
    title: `Tracked: ${session.activity}`,
    detail: `${new Date(session.startedAt).toLocaleTimeString()} - ${new Date(session.endedAt).toLocaleTimeString()}`,
    startsAt: session.startedAt,
    endsAt: session.endedAt,
  }));

  if (!activeSession) return completed;

  return [
    {
      id: `scheduler-active-${activeSession.id}`,
      app: "scheduler",
      title: `Tracking now: ${activeSession.activity}`,
      detail: `Started ${new Date(activeSession.startedAt).toLocaleTimeString()}`,
      startsAt: activeSession.startedAt,
    },
    ...completed,
  ];
}

export function buildCalendarItems(events: CalendarEvent[]): TimelineItem[] {
  return events.map((event) => ({
    id: `calendar-${event.id}`,
    app: "calendar",
    title: event.title,
    detail: event.notes?.trim() || "Calendar event",
    startsAt: event.startsAt,
    endsAt: event.endsAt,
  }));
}

export function mergeTimelineChronologically(items: TimelineItem[]) {
  return [...items].sort((a, b) => {
    const aMs = new Date(a.startsAt).getTime();
    const bMs = new Date(b.startsAt).getTime();
    return aMs - bMs;
  });
}
