"use client";

import { useMemo, useRef, useState } from "react";
import {
  parseAppleHealthExportXmlFile,
  type AppleHealthDay,
  type AppleHealthParseSummary,
} from "@/lib/appleHealthExport";

type Status =
  | { state: "idle" }
  | { state: "parsing"; message: string; progressPct: number | null }
  | { state: "done"; message: string }
  | { state: "error"; message: string };

function formatNumber(value: number | null, suffix = "") {
  if (value == null) return "—";
  if (!Number.isFinite(value)) return "—";
  return `${value}${suffix}`;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AppleHealthImporter() {
  const [appleWatchOnly, setAppleWatchOnly] = useState(true);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [summary, setSummary] = useState<AppleHealthParseSummary | null>(null);
  const [days, setDays] = useState<AppleHealthDay[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const last30 = useMemo(() => {
    if (!days?.length) return [];
    return days.slice(-30);
  }, [days]);

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);

    if (file.name.toLowerCase().endsWith(".zip")) {
      setStatus({
        state: "error",
        message:
          "Zip exports aren’t supported yet — unzip it first and upload the `export.xml` inside `apple_health_export/`.",
      });
      return;
    }

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setStatus({ state: "parsing", message: "Parsing…", progressPct: 0 });
    setSummary(null);
    setDays(null);

    try {
      const result = await parseAppleHealthExportXmlFile(file, {
        appleWatchOnly,
        signal: abortController.signal,
        onProgress: (nextSummary) => {
          const pct =
            nextSummary.totalBytes > 0
              ? Math.round((nextSummary.bytesRead / nextSummary.totalBytes) * 100)
              : null;
          setSummary(nextSummary);
          setStatus({
            state: "parsing",
            message: `Parsing… ${nextSummary.recordsSeen.toLocaleString()} records scanned`,
            progressPct: pct,
          });
        },
      });

      setSummary(result.summary);
      setDays(result.days);
      setStatus({
        state: "done",
        message: `Imported ${result.summary.days.toLocaleString()} days.`,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus({ state: "idle" });
        return;
      }
      setStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Failed to parse export.xml",
      });
    }
  };

  const onCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const onClear = () => {
    onCancel();
    setStatus({ state: "idle" });
    setSummary(null);
    setDays(null);
    setFileName(null);
  };

  const exportData = () => {
    if (!days || !summary) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      source: "apple-health-export.xml",
      fileName: summary.fileName,
      appleWatchOnly,
      dateMin: summary.dateMin,
      dateMax: summary.dateMax,
      days,
    };
    downloadJson(`apple-health-${summary.dateMin ?? "export"}.json`, payload);
  };

  return (
    <div className="page-wrap">
      <section className="panel p-8 sm:p-10">
        <span className="kicker">Project</span>
        <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">Apple Watch Ultra Health Import</h1>
        <p className="muted mt-4 max-w-2xl">
          Import Apple Health data locally in your browser (no uploads) and export a clean JSON summary.
        </p>

        <div className="mt-8 grid gap-6 text-left">
          <div className="rounded-2xl border border-white/15 bg-black/20 p-5">
            <h2 className="text-lg font-semibold">How to export</h2>
            <ol className="muted mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>iPhone → Health → profile icon → Export All Health Data.</li>
              <li>Save the zip to your computer, unzip it.</li>
              <li>Upload the file at <span className="font-mono">apple_health_export/export.xml</span>.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Import</h2>
                <p className="muted mt-1 text-sm">
                  Supports: HRV (SDNN), resting HR, oxygen saturation, active energy, deep sleep, workouts.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="muted flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-white"
                    checked={appleWatchOnly}
                    onChange={(e) => setAppleWatchOnly(e.target.checked)}
                    disabled={status.state === "parsing"}
                  />
                  Apple Watch only
                </label>
                {status.state === "parsing" ? (
                  <button
                    type="button"
                    className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium transition hover:bg-black/35"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium transition hover:bg-black/35"
                    onClick={onClear}
                    disabled={!days?.length && status.state !== "error"}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <input
                type="file"
                accept=".xml,application/xml,text/xml,.zip,application/zip"
                className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                disabled={status.state === "parsing"}
              />
              {fileName ? <p className="muted mt-2 text-xs">Selected: {fileName}</p> : null}
            </div>

            {status.state !== "idle" ? (
              <div className="mt-4 rounded-xl border border-white/12 bg-black/30 p-4">
                <p className={`text-sm ${status.state === "error" ? "text-red-200" : "muted"}`}>
                  {status.message}
                </p>
                {status.state === "parsing" ? (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-white/60 transition-[width] duration-150"
                        style={{ width: `${status.progressPct ?? 0}%` }}
                      />
                    </div>
                    <div className="muted mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span>
                        {summary
                          ? `${Math.round((summary.bytesRead / Math.max(summary.totalBytes, 1)) * 100)}%`
                          : "…"}
                      </span>
                      {summary ? (
                        <span>
                          {summary.recordsMatched.toLocaleString()} matched ·{" "}
                          {summary.workoutsMatched.toLocaleString()} workouts ·{" "}
                          {summary.categorySamplesMatched.toLocaleString()} sleep samples
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {summary && days?.length ? (
            <div className="rounded-2xl border border-white/15 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Summary</h2>
                  <p className="muted mt-1 text-sm">
                    {summary.dateMin} → {summary.dateMax} · {summary.days.toLocaleString()} days
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
                    onClick={exportData}
                  >
                    Download JSON
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/12 bg-black/30 p-4">
                  <p className="muted text-xs">Records scanned</p>
                  <p className="mt-1 text-lg font-semibold">{summary.recordsSeen.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/30 p-4">
                  <p className="muted text-xs">Records matched</p>
                  <p className="mt-1 text-lg font-semibold">{summary.recordsMatched.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-black/30 p-4">
                  <p className="muted text-xs">Workouts</p>
                  <p className="mt-1 text-lg font-semibold">{summary.workoutsMatched.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/12">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <thead className="bg-black/40">
                    <tr className="text-xs uppercase tracking-wide text-neutral-300">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">HRV</th>
                      <th className="px-4 py-3 font-medium">Resting HR</th>
                      <th className="px-4 py-3 font-medium">Blood O₂</th>
                      <th className="px-4 py-3 font-medium">Active kcal</th>
                      <th className="px-4 py-3 font-medium">Deep sleep</th>
                      <th className="px-4 py-3 font-medium">Workouts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last30.map((day) => (
                      <tr key={day.date} className="border-t border-white/10">
                        <td className="px-4 py-3 font-mono text-xs text-neutral-200">{day.date}</td>
                        <td className="px-4 py-3">{formatNumber(day.hrvMs, " ms")}</td>
                        <td className="px-4 py-3">{formatNumber(day.restingHrBpm, " bpm")}</td>
                        <td className="px-4 py-3">{formatNumber(day.oxygenSaturationPct, "%")}</td>
                        <td className="px-4 py-3">{formatNumber(day.activeEnergyKcal, "")}</td>
                        <td className="px-4 py-3">{formatNumber(day.deepSleepMin, " min")}</td>
                        <td className="px-4 py-3">
                          {day.workouts == null ? (
                            "—"
                          ) : (
                            <span className="muted">
                              {day.workouts}
                              {day.workoutMinutes != null ? ` · ${day.workoutMinutes} min` : ""}
                              {day.workoutDistanceKm != null ? ` · ${day.workoutDistanceKm} km` : ""}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="muted mt-3 text-xs">
                Tip: If parsing is slow, try a desktop browser (Chrome/Edge) and keep the tab focused.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

