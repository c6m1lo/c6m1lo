export type AppleHealthDay = {
  date: string; // YYYY-MM-DD
  hrvMs: number | null;
  restingHrBpm: number | null;
  oxygenSaturationPct: number | null;
  activeEnergyKcal: number | null;
  deepSleepMin: number | null;
  workouts: number | null;
  workoutMinutes: number | null;
  workoutDistanceKm: number | null;
};

export type AppleHealthParseSummary = {
  fileName: string;
  totalBytes: number;
  bytesRead: number;
  recordsSeen: number;
  recordsMatched: number;
  workoutsMatched: number;
  categorySamplesMatched: number;
  days: number;
  dateMin: string | null;
  dateMax: string | null;
};

export type AppleHealthParseOptions = {
  appleWatchOnly?: boolean;
  signal?: AbortSignal;
  onProgress?: (summary: AppleHealthParseSummary) => void;
};

type DayAccumulator = {
  date: string;
  hrvSum: number;
  hrvCount: number;
  rhrSum: number;
  rhrCount: number;
  spo2Sum: number;
  spo2Count: number;
  activeEnergyKcalSum: number;
  deepSleepMinSum: number;
  workoutsCount: number;
  workoutMinutesSum: number;
  workoutDistanceKmSum: number;
};

const DEFAULT_OPTIONS: Required<Pick<AppleHealthParseOptions, "appleWatchOnly">> = {
  appleWatchOnly: true,
};

function parseXmlAttributes(line: string) {
  const attrs: Record<string, string> = {};
  const re = /([A-Za-z0-9_:-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null = null;
  while ((match = re.exec(line))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function dateKeyFromAppleDate(value: string | undefined) {
  if (!value) return null;
  const spaceIndex = value.indexOf(" ");
  if (spaceIndex === -1) return value.slice(0, 10) || null;
  return value.slice(0, spaceIndex) || null;
}

function parseAppleDateToMs(value: string | undefined) {
  if (!value) return null;
  // "YYYY-MM-DD HH:mm:ss -0400"
  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/,
  );
  if (!m) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback.getTime();
  }

  const [, yy, mm, dd, hh, mi, ss, sign, tzh, tzm] = m;
  const utcMs = Date.UTC(
    Number(yy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(mi),
    Number(ss),
  );
  const offsetMinutes = (Number(tzh) * 60 + Number(tzm)) * (sign === "-" ? -1 : 1);
  return utcMs - offsetMinutes * 60_000;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeWorkoutMinutes(value: string | undefined, unit: string | undefined) {
  const numeric = Number.parseFloat(value ?? "");
  if (!Number.isFinite(numeric)) return null;

  const normalizedUnit = (unit ?? "").toLowerCase();
  if (normalizedUnit === "min" || normalizedUnit === "mins" || normalizedUnit === "minute") return numeric;
  if (normalizedUnit === "hr" || normalizedUnit === "h" || normalizedUnit === "hour") return numeric * 60;
  if (normalizedUnit === "s" || normalizedUnit === "sec" || normalizedUnit === "second") return numeric / 60;
  return numeric;
}

function normalizeDistanceKm(value: string | undefined, unit: string | undefined) {
  const numeric = Number.parseFloat(value ?? "");
  if (!Number.isFinite(numeric)) return null;

  const normalizedUnit = (unit ?? "").toLowerCase();
  if (normalizedUnit === "km" || normalizedUnit === "kilometer" || normalizedUnit === "kilometers") return numeric;
  if (normalizedUnit === "mi" || normalizedUnit === "mile" || normalizedUnit === "miles") return numeric * 1.60934;
  if (normalizedUnit === "m" || normalizedUnit === "meter" || normalizedUnit === "meters") return numeric / 1000;
  if (normalizedUnit === "yd" || normalizedUnit === "yard" || normalizedUnit === "yards") return numeric * 0.0009144;
  return null;
}

function ensureAccumulator(map: Map<string, DayAccumulator>, date: string) {
  const existing = map.get(date);
  if (existing) return existing;
  const next: DayAccumulator = {
    date,
    hrvSum: 0,
    hrvCount: 0,
    rhrSum: 0,
    rhrCount: 0,
    spo2Sum: 0,
    spo2Count: 0,
    activeEnergyKcalSum: 0,
    deepSleepMinSum: 0,
    workoutsCount: 0,
    workoutMinutesSum: 0,
    workoutDistanceKmSum: 0,
  };
  map.set(date, next);
  return next;
}

function finalizeDay(acc: DayAccumulator): AppleHealthDay {
  const avg = (sum: number, count: number) => (count > 0 ? sum / count : null);

  const hrv = avg(acc.hrvSum, acc.hrvCount);
  const rhr = avg(acc.rhrSum, acc.rhrCount);
  const spo2 = avg(acc.spo2Sum, acc.spo2Count);

  return {
    date: acc.date,
    hrvMs: hrv == null ? null : Math.round(hrv),
    restingHrBpm: rhr == null ? null : Math.round(rhr),
    oxygenSaturationPct: spo2 == null ? null : Math.round(spo2 * 10) / 10,
    activeEnergyKcal: acc.activeEnergyKcalSum > 0 ? Math.round(acc.activeEnergyKcalSum) : null,
    deepSleepMin: acc.deepSleepMinSum > 0 ? Math.round(acc.deepSleepMinSum) : null,
    workouts: acc.workoutsCount > 0 ? acc.workoutsCount : null,
    workoutMinutes: acc.workoutMinutesSum > 0 ? Math.round(acc.workoutMinutesSum) : null,
    workoutDistanceKm:
      acc.workoutDistanceKmSum > 0 ? Math.round(acc.workoutDistanceKmSum * 100) / 100 : null,
  };
}

function isAppleWatchSource(attrs: Record<string, string>) {
  const sourceName = (attrs.sourceName ?? "").toLowerCase();
  const device = (attrs.device ?? "").toLowerCase();
  const deviceName = (attrs.deviceName ?? "").toLowerCase();

  return (
    sourceName.includes("apple watch") ||
    device.includes("apple watch") ||
    deviceName.includes("apple watch") ||
    device.includes("watch") ||
    sourceName.includes("watch")
  );
}

function updateDateRange(summary: AppleHealthParseSummary, date: string) {
  if (!summary.dateMin || date < summary.dateMin) summary.dateMin = date;
  if (!summary.dateMax || date > summary.dateMax) summary.dateMax = date;
}

function maybeAbort(options: AppleHealthParseOptions) {
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

export async function parseAppleHealthExportXmlFile(
  file: File,
  options: AppleHealthParseOptions = {},
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const map = new Map<string, DayAccumulator>();
  const decoder = new TextDecoder("utf-8");
  const reader = file.stream().getReader();

  const summary: AppleHealthParseSummary = {
    fileName: file.name,
    totalBytes: file.size,
    bytesRead: 0,
    recordsSeen: 0,
    recordsMatched: 0,
    workoutsMatched: 0,
    categorySamplesMatched: 0,
    days: 0,
    dateMin: null,
    dateMax: null,
  };

  let buffer = "";
  let lastProgressAt = 0;

  const reportProgress = () => {
    if (!mergedOptions.onProgress) return;
    mergedOptions.onProgress({ ...summary });
  };

  const processLine = (line: string) => {
    maybeAbort(mergedOptions);

    if (line.includes("<Record ")) {
      summary.recordsSeen += 1;
      const attrs = parseXmlAttributes(line);
      if (mergedOptions.appleWatchOnly && !isAppleWatchSource(attrs)) return;

      const type = attrs.type ?? "";
      const dateKey = dateKeyFromAppleDate(attrs.startDate);
      if (!dateKey) return;

      updateDateRange(summary, dateKey);
      const acc = ensureAccumulator(map, dateKey);

      const value = Number.parseFloat(attrs.value ?? "");
      if (!Number.isFinite(value)) return;

      if (type.includes("HeartRateVariabilitySDNN")) {
        acc.hrvSum += value;
        acc.hrvCount += 1;
        summary.recordsMatched += 1;
      } else if (type.includes("RestingHeartRate")) {
        acc.rhrSum += value;
        acc.rhrCount += 1;
        summary.recordsMatched += 1;
      } else if (type.includes("OxygenSaturation")) {
        // Export is 0..1; normalize to percent.
        const pct = clamp(value * 100, 0, 100);
        acc.spo2Sum += pct;
        acc.spo2Count += 1;
        summary.recordsMatched += 1;
      } else if (type.includes("ActiveEnergyBurned")) {
        acc.activeEnergyKcalSum += value;
        summary.recordsMatched += 1;
      }

      return;
    }

    if (line.includes("<CategorySample ")) {
      const attrs = parseXmlAttributes(line);
      if (mergedOptions.appleWatchOnly && !isAppleWatchSource(attrs)) return;

      const identifier = attrs.identifier ?? "";
      if (!identifier.includes("SleepAnalysis")) return;
      const value = attrs.value ?? "";
      if (!value.includes("AsleepDeep")) return;

      const dateKey = dateKeyFromAppleDate(attrs.startDate);
      if (!dateKey) return;

      const startMs = parseAppleDateToMs(attrs.startDate);
      const endMs = parseAppleDateToMs(attrs.endDate);
      if (!startMs || !endMs || endMs <= startMs) return;

      updateDateRange(summary, dateKey);
      const acc = ensureAccumulator(map, dateKey);
      acc.deepSleepMinSum += (endMs - startMs) / 60_000;
      summary.categorySamplesMatched += 1;
      return;
    }

    if (line.includes("<Workout ")) {
      const attrs = parseXmlAttributes(line);
      if (mergedOptions.appleWatchOnly && !isAppleWatchSource(attrs)) return;

      const dateKey = dateKeyFromAppleDate(attrs.startDate);
      if (!dateKey) return;

      updateDateRange(summary, dateKey);
      const acc = ensureAccumulator(map, dateKey);

      acc.workoutsCount += 1;
      const minutes = normalizeWorkoutMinutes(attrs.duration, attrs.durationUnit);
      if (minutes != null) acc.workoutMinutesSum += minutes;

      const distanceKm = normalizeDistanceKm(attrs.totalDistance, attrs.totalDistanceUnit);
      if (distanceKm != null) acc.workoutDistanceKmSum += distanceKm;

      summary.workoutsMatched += 1;
    }
  };

  try {
    let doneReading = false;
    while (!doneReading) {
      maybeAbort(mergedOptions);
      const { value, done } = await reader.read();
      doneReading = done;
      if (!value) continue;

      summary.bytesRead += value.byteLength;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) processLine(line);

      if (summary.bytesRead - lastProgressAt >= 1_250_000) {
        lastProgressAt = summary.bytesRead;
        reportProgress();
      }
    }
  } finally {
    reader.releaseLock();
  }

  buffer += decoder.decode();
  if (buffer.trim()) processLine(buffer);

  const days = Array.from(map.values())
    .map(finalizeDay)
    .sort((a, b) => a.date.localeCompare(b.date));

  summary.days = days.length;
  reportProgress();

  return { days, summary };
}
