import type { JournalEntry } from "../journal/types";

export type TimelineItem = {
  id: string;
  app: "journal";
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

export function mergeTimelineChronologically(items: TimelineItem[]) {
  return [...items].sort((a, b) => {
    const aMs = new Date(a.startsAt).getTime();
    const bMs = new Date(b.startsAt).getTime();
    return aMs - bMs;
  });
}
