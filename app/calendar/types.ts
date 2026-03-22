export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
};

export type CalendarDraft = {
  title: string;
  startsAt: string;
  endsAt: string;
  notes: string;
};

export const DEFAULT_CALENDAR_DRAFT: CalendarDraft = {
  title: "",
  startsAt: "",
  endsAt: "",
  notes: "",
};
