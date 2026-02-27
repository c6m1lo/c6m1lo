export type TimeSession = {
  id: string;
  activity: string;
  startedAt: string;
  endedAt: string;
  source: "manual" | "journal";
};

export type ActiveSession = {
  id: string;
  activity: string;
  startedAt: string;
  source: "manual" | "journal";
};
