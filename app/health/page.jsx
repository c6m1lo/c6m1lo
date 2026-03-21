"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "c6m1lo_health_entries";
const JOURNAL_KEY = "journal_entries";

const COLORS = {
  bg: "#080808",
  panel: "#0d0d0d",
  border: "#1a1a1a",
  text: "#e0e0e0",
  muted: "#444",
  muted2: "#333",
  accent: "#00ff9d",
};

const METRICS = [
  { key: "hrv", label: "HRV", unit: "ms", color: COLORS.accent, min: 0, max: 200 },
  { key: "rhr", label: "Resting HR", unit: "bpm", color: "#ff6b6b", min: 30, max: 120 },
  { key: "spo2", label: "Blood O₂", unit: "%", color: "#4fc3f7", min: 90, max: 100 },
  { key: "deep_sleep", label: "Deep Sleep", unit: "min", color: "#9b59b6", min: 0, max: 240 },
  { key: "active_cal", label: "Active Cal", unit: "kcal", color: "#f39c12", min: 0, max: 2000 },
  { key: "sleep_eff", label: "Sleep Eff", unit: "%", color: "#1abc9c", min: 0, max: 100 },
];

const SNAPSHOT_METRICS = [
  { key: "sleep", label: "Sleep", color: "#9b59b6" },
  { key: "energy", label: "Energy", color: "#f39c12" },
  { key: "mood", label: "Mood", color: COLORS.accent },
  { key: "stress", label: "Stress", color: "#ff6b6b" },
  { key: "focus", label: "Focus", color: "#4fc3f7" },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function avg(entries, key) {
  const vals = entries.map((e) => e[key]).filter((v) => v != null && Number.isFinite(Number(v)));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + Number(b), 0) / vals.length);
}

function dateKeyFromAppleDate(value) {
  if (!value) return null;
  const idx = value.indexOf(" ");
  if (idx === -1) return value.slice(0, 10) || null;
  return value.slice(0, idx) || null;
}

function appleDateToMs(value) {
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
  const utcMs = Date.UTC(Number(yy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss));
  const offsetMinutes = (Number(tzh) * 60 + Number(tzm)) * (sign === "-" ? -1 : 1);
  return utcMs - offsetMinutes * 60_000;
}

function minutesBetweenAppleDates(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const startMs = appleDateToMs(startDate);
  const endMs = appleDateToMs(endDate);
  if (!startMs || !endMs) return null;
  const delta = endMs - startMs;
  if (!Number.isFinite(delta) || delta <= 0) return null;
  return delta / 60000;
}

function safeNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseAppleHealthXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  const perDay = {};

  const ensure = (date) => {
    if (!perDay[date]) {
      perDay[date] = {
        hrv: [],
        rhr: [],
        spo2: [],
        active_cal_sum: 0,
        deep_sleep_sum: 0,
      };
    }
    return perDay[date];
  };

  const records = Array.from(doc.querySelectorAll("Record"));
  records.forEach((r) => {
    const type = r.getAttribute("type") || "";
    const dateStr = dateKeyFromAppleDate(r.getAttribute("startDate") || "");
    if (!dateStr) return;

    const value = safeNumber(r.getAttribute("value"));
    if (value == null) return;

    const day = ensure(dateStr);

    if (type.includes("HeartRateVariabilitySDNN")) day.hrv.push(value);
    else if (type.includes("RestingHeartRate")) day.rhr.push(value);
    else if (type.includes("OxygenSaturation")) {
      const pct = value <= 1.1 ? value * 100 : value;
      day.spo2.push(clamp(pct, 0, 100));
    } else if (type.includes("ActiveEnergyBurned")) {
      day.active_cal_sum += value;
    }
  });

  const sleepSamples = Array.from(doc.querySelectorAll("CategorySample")).filter((s) =>
    (s.getAttribute("identifier") || "").includes("SleepAnalysis"),
  );
  sleepSamples.forEach((s) => {
    const value = s.getAttribute("value") || "";
    if (!value.includes("AsleepDeep")) return;
    const dateStr = dateKeyFromAppleDate(s.getAttribute("startDate") || "");
    if (!dateStr) return;
    const minutes = minutesBetweenAppleDates(s.getAttribute("startDate"), s.getAttribute("endDate"));
    if (minutes == null) return;
    const day = ensure(dateStr);
    day.deep_sleep_sum += minutes;
  });

  // Daily rollup: average for point samples, sum for additive metrics.
  const result = {};
  Object.entries(perDay).forEach(([date, day]) => {
    const averageList = (list) => {
      if (!list.length) return null;
      return Math.round(list.reduce((a, b) => a + b, 0) / list.length);
    };

    result[date] = {
      hrv: averageList(day.hrv),
      rhr: averageList(day.rhr),
      spo2: day.spo2.length ? Math.round((day.spo2.reduce((a, b) => a + b, 0) / day.spo2.length) * 10) / 10 : null,
      active_cal: day.active_cal_sum ? Math.round(day.active_cal_sum) : null,
      deep_sleep: day.deep_sleep_sum ? Math.round(day.deep_sleep_sum) : null,
    };
  });

  return result;
}

// ─── SVG Components ──────────────────────────────────────────────────────────

function RadialGauge({ value, max, color, size = 80 }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = value == null ? 0 : clamp(value / max, 0, 1);
  const dash = pct * circ;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Gauge">
      <circle cx="40" cy="40" r={r} fill="none" stroke={COLORS.border} strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x="40"
        y="45"
        textAnchor="middle"
        fill={color}
        style={{ fontSize: "13px", fontFamily: "monospace", fontWeight: 700 }}
      >
        {value ?? "–"}
      </text>
    </svg>
  );
}

function Sparkline({ data, color, height = 40, width = 120 }) {
  const cleaned = (data || []).filter((v) => v != null && Number.isFinite(Number(v))).map(Number);
  if (cleaned.length < 2) {
    return (
      <svg width={width} height={height} role="img" aria-label="Trend">
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={COLORS.muted2}
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  const range = max - min || 1;

  const pts = cleaned
    .map((v, i) => {
      const x = (i / (cleaned.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const lastX = width;
  const lastY = height - ((cleaned[cleaned.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} role="img" aria-label="Trend">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

function SnapshotBar({ value, max = 5, color }) {
  const pct = clamp((Number(value || 0) / max) * 100, 0, 100);
  return (
    <div
      style={{
        height: "6px",
        background: COLORS.border,
        borderRadius: "3px",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "3px",
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function MetricCard({ metric, entries7 }) {
  const vals = entries7.map((e) => e[metric.key]).filter((v) => v != null && Number.isFinite(Number(v))).map(Number);
  const value = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${metric.color}22`,
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: metric.color,
          opacity: 0.6,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            color: "#666",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "monospace",
          }}
        >
          {metric.label}
        </span>
        <span style={{ color: metric.color, fontSize: "11px", fontFamily: "monospace" }}>{metric.unit}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <RadialGauge value={value} max={metric.max} color={metric.color} size={70} />
        <Sparkline data={vals} color={metric.color} />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HealthPage() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    hrv: "",
    rhr: "",
    spo2: "",
    deep_sleep: "",
    active_cal: "",
    sleep_eff: "",
    notes: "",
  });
  const [journalEntries, setJournalEntries] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const fileRef = useRef(null);
  const xmlRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setEntries(Array.isArray(stored) ? stored : []);
    } catch {
      setEntries([]);
    }
    try {
      const j = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
      setJournalEntries(Array.isArray(j) ? j : []);
    } catch {
      setJournalEntries([]);
    }
  }, []);

  const save = (updated) => {
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const todayEntry = useMemo(() => entries.find((e) => e.date === todayISO()), [entries]);

  const last30 = useMemo(() => entries.slice(-30), [entries]);
  const last7 = useMemo(() => entries.slice(-7), [entries]);

  const combinedLast7 = useMemo(() => {
    const byDate = new Map();
    journalEntries.forEach((j) => {
      const dateKey = (j.timestamp || "").split("T")[0];
      if (dateKey) byDate.set(dateKey, j);
    });
    return last7.map((he) => ({ ...he, journal: byDate.get(he.date) || null }));
  }, [journalEntries, last7]);

  const handleLogToday = () => {
    const metrics = {};
    METRICS.forEach((m) => {
      const n = safeNumber(form[m.key]);
      metrics[m.key] = n;
    });

    const entry = {
      date: todayISO(),
      timestamp: new Date().toISOString(),
      ...metrics,
      notes: (form.notes || "").trim(),
    };

    const updated = entries.filter((e) => e.date !== todayISO());
    updated.push(entry);
    updated.sort((a, b) => a.date.localeCompare(b.date));
    save(updated);

    setImportStatus("✓ Today's biometrics saved.");
    setTimeout(() => setImportStatus(""), 3000);
  };

  const handleAppleHealthXML = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("Parsing Apple Health export…");
    try {
      const text = await file.text();
      const parsed = parseAppleHealthXML(text);
      const updated = [...entries];

      Object.entries(parsed).forEach(([date, data]) => {
        const idx = updated.findIndex((ent) => ent.date === date);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...data };
        } else {
          updated.push({ date, timestamp: `${date}T00:00:00.000Z`, ...data, notes: "" });
        }
      });

      updated.sort((a, b) => a.date.localeCompare(b.date));
      save(updated);
      setImportStatus(`✓ Imported ${Object.keys(parsed).length} days from Apple Health.`);
      setTimeout(() => setImportStatus(""), 4000);
    } catch {
      setImportStatus("✗ Failed to parse export.xml.");
      setTimeout(() => setImportStatus(""), 4000);
    } finally {
      if (xmlRef.current) xmlRef.current.value = "";
    }
  };

  const exportEnrichedJSON = () => {
    const merged = entries.map((he) => {
      const journalMatch = journalEntries.find((je) => (je.timestamp || "").split("T")[0] === he.date);
      return {
        ...he,
        journal: journalMatch
          ? {
              id: journalMatch.id,
              timestamp: journalMatch.timestamp,
              title: journalMatch.title,
              snapshot: journalMatch.snapshot,
              tags: journalMatch.snapshot?.tags || [],
            }
          : null,
      };
    });

    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            version: 2,
            health_entries: merged,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importHealthJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const incoming = data.health_entries || data;
      if (!Array.isArray(incoming)) throw new Error("Invalid format");

      const updated = [...entries];
      incoming.forEach((entry) => {
        if (!entry?.date) return;
        const idx = updated.findIndex((ent) => ent.date === entry.date);
        if (idx >= 0) updated[idx] = { ...updated[idx], ...entry };
        else updated.push(entry);
      });
      updated.sort((a, b) => a.date.localeCompare(b.date));
      save(updated);
      setImportStatus(`✓ Imported ${incoming.length} entries.`);
      setTimeout(() => setImportStatus(""), 3000);
    } catch {
      setImportStatus("✗ Invalid file format.");
      setTimeout(() => setImportStatus(""), 3000);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const history = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)), [entries]);

  const journalByDate = useMemo(() => {
    const map = new Map();
    journalEntries.forEach((j) => {
      const dateKey = (j.timestamp || "").split("T")[0];
      if (dateKey) map.set(dateKey, j);
    });
    return map;
  }, [journalEntries]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        padding: "0 0 80px 0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "24px 24px 0",
          background: "#0a0a0a",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px" }}>
            <span style={{ color: COLORS.accent, fontSize: "11px", letterSpacing: "0.2em" }}>C6M1LO</span>
            <span style={{ color: COLORS.muted2 }}>/</span>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>HEALTH OS</h1>
          </div>
          <p style={{ color: COLORS.muted, fontSize: "11px", margin: "0 0 20px", letterSpacing: "0.05em" }}>
            Biometric tracking · Journal integration · Apple Health import
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0" }}>
            {["dashboard", "log", "history", "import"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? COLORS.panel : "transparent",
                  border: "none",
                  borderTop: activeTab === tab ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  color: activeTab === tab ? COLORS.accent : COLORS.muted,
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        {/* Status */}
        {importStatus ? (
          <div
            style={{
              background: importStatus.startsWith("✓") ? `${COLORS.accent}11` : "#ff6b6b11",
              border: `1px solid ${importStatus.startsWith("✓") ? `${COLORS.accent}44` : "#ff6b6b44"}`,
              borderRadius: "8px",
              padding: "10px 16px",
              color: importStatus.startsWith("✓") ? COLORS.accent : "#ff6b6b",
              fontSize: "12px",
              marginBottom: "20px",
            }}
          >
            {importStatus}
          </div>
        ) : null}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Today summary */}
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#666", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Today · {formatDate(todayISO())}
                </span>
                {!todayEntry ? (
                  <button
                    onClick={() => setActiveTab("log")}
                    style={{
                      background: COLORS.accent,
                      color: "#000",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    + Log Today
                  </button>
                ) : null}
              </div>
              {todayEntry ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {METRICS.map((m) => (
                    <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ color: COLORS.muted, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {m.label}
                      </span>
                      <span style={{ color: m.color, fontSize: "20px", fontWeight: 700 }}>
                        {todayEntry[m.key] ?? <span style={{ color: COLORS.muted2 }}>—</span>}
                        <span style={{ fontSize: "10px", color: COLORS.muted, marginLeft: "4px" }}>
                          {todayEntry[m.key] != null ? m.unit : ""}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: COLORS.muted2, fontSize: "12px", margin: 0 }}>No biometrics logged yet today.</p>
              )}
            </div>

            {/* 7-day averages */}
            <div>
              <h2 style={{ color: COLORS.muted, fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px" }}>
                7-Day Biometric Averages
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {METRICS.map((m) => (
                  <MetricCard key={m.key} metric={m} entries7={last7} />
                ))}
              </div>
            </div>

            {/* Journal snapshot bars (last 7 days) */}
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "20px" }}>
              <h2 style={{ color: COLORS.muted, fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 16px" }}>
                Journal Snapshot · Last 7 Days
              </h2>
              {combinedLast7.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[...combinedLast7].reverse().map((d) => (
                    <div key={d.date} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "12px", alignItems: "center" }}>
                      <span style={{ color: COLORS.muted, fontSize: "10px" }}>{formatDate(d.date)}</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {SNAPSHOT_METRICS.map((m) => (
                          <div key={m.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1 }}>
                            <SnapshotBar value={d.journal?.snapshot?.[m.key] || 0} color={m.color} />
                            <span style={{ color: COLORS.muted2, fontSize: "9px" }}>{m.label[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: COLORS.muted2, fontSize: "12px", margin: 0 }}>No recent health entries yet.</p>
              )}
            </div>

            {/* 30-day trend lines */}
            {last30.length > 1 ? (
              <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "20px" }}>
                <h2 style={{ color: COLORS.muted, fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 16px" }}>
                  30-Day Trends
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {METRICS.map((m) => {
                    const vals = last30.map((e) => e[m.key]).filter((v) => v != null && Number.isFinite(Number(v))).map(Number);
                    if (!vals.length) return null;
                    return (
                      <div key={m.key} style={{ display: "grid", gridTemplateColumns: "110px 1fr 70px", alignItems: "center", gap: "12px" }}>
                        <span style={{ color: "#555", fontSize: "11px" }}>{m.label}</span>
                        <Sparkline data={vals} color={m.color} width={420} height={32} />
                        <span style={{ color: m.color, fontSize: "13px", fontWeight: 700, textAlign: "right" }}>
                          {avg(last30, m.key)}
                          <span style={{ color: COLORS.muted, fontSize: "9px" }}> {m.unit}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── LOG TAB ── */}
        {activeTab === "log" ? (
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "24px" }}>
            <h2 style={{ color: "#fff", fontSize: "14px", margin: "0 0 20px", fontWeight: 600 }}>
              Log Biometrics · {formatDate(todayISO())}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              {METRICS.map((m) => (
                <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#555", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {m.label} <span style={{ color: COLORS.muted2 }}>({m.unit})</span>
                  </label>
                  <input
                    type="number"
                    value={form[m.key]}
                    onChange={(ev) => setForm((f) => ({ ...f, [m.key]: ev.target.value }))}
                    placeholder={`${m.min}–${m.max}`}
                    style={{
                      background: "#111",
                      border: `1px solid ${m.color}33`,
                      borderRadius: "6px",
                      padding: "10px 12px",
                      color: m.color,
                      fontSize: "14px",
                      fontFamily: "monospace",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              <label style={{ color: "#555", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(ev) => setForm((f) => ({ ...f, notes: ev.target.value }))}
                placeholder="Anything notable today?"
                rows={4}
                style={{
                  background: "#111",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  padding: "10px 12px",
                  color: "#ddd",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleLogToday}
                style={{
                  background: COLORS.accent,
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 18px",
                  color: "#000",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Save Today
              </button>
              {todayEntry ? <span style={{ color: COLORS.muted, fontSize: "11px" }}>Overwrites today’s entry.</span> : null}
            </div>
          </div>
        ) : null}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.length ? (
              history.map((entry) => {
                const je = journalByDate.get(entry.date) || null;
                return (
                  <div
                    key={entry.date}
                    style={{
                      background: COLORS.panel,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "10px",
                      padding: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ color: COLORS.accent, fontSize: "12px", fontWeight: 700 }}>{formatDate(entry.date)}</span>
                      {je ? <span style={{ color: COLORS.muted, fontSize: "10px" }}>"{je.title}"</span> : null}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                      {METRICS.map((m) => (
                        <div key={m.key} style={{ textAlign: "center" }}>
                          <div style={{ color: m.color, fontSize: "14px", fontWeight: 700 }}>
                            {entry[m.key] ?? <span style={{ color: "#222" }}>—</span>}
                          </div>
                          <div style={{ color: COLORS.muted2, fontSize: "9px", marginTop: "2px" }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    {je?.snapshot ? (
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: `1px solid ${COLORS.border}`,
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        {SNAPSHOT_METRICS.map((m) => (
                          <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
                            <SnapshotBar value={je.snapshot[m.key] || 0} color={m.color} />
                            <span style={{ color: COLORS.muted2, fontSize: "9px", textAlign: "center" }}>{m.key[0].toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {entry.notes ? (
                      <p style={{ color: COLORS.muted, fontSize: "11px", margin: "10px 0 0", fontStyle: "italic" }}>{entry.notes}</p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "20px" }}>
                <p style={{ color: COLORS.muted2, fontSize: "12px", margin: 0 }}>No health entries yet.</p>
              </div>
            )}
          </div>
        ) : null}

        {/* ── IMPORT TAB ── */}
        {activeTab === "import" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Apple Health XML */}
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ color: "#fff", fontSize: "13px", margin: "0 0 8px" }}>Apple Health Export</h3>
              <p style={{ color: COLORS.muted, fontSize: "11px", margin: "0 0 16px", lineHeight: 1.6 }}>
                iPhone: Health → Profile → Export All Health Data → extract export.zip → upload export.xml here.
                Parses HRV SDNN, resting HR, oxygen saturation, active energy burned, and deep sleep.
              </p>
              <input ref={xmlRef} type="file" accept=".xml" onChange={handleAppleHealthXML} style={{ display: "none" }} />
              <button
                onClick={() => xmlRef.current?.click()}
                style={{
                  background: "#111",
                  border: "1px solid #4fc3f7",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  color: "#4fc3f7",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Upload export.xml
              </button>
            </div>

            {/* JSON import/export */}
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ color: "#fff", fontSize: "13px", margin: "0 0 8px" }}>JSON Import / Export</h3>
              <p style={{ color: COLORS.muted, fontSize: "11px", margin: "0 0 16px", lineHeight: 1.6 }}>
                Export produces enriched JSON merging health biometrics with matched journal snapshot data by date.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input ref={fileRef} type="file" accept=".json" onChange={importHealthJSON} style={{ display: "none" }} />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    background: "#111",
                    border: "1px solid #f39c12",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    color: "#f39c12",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Import JSON
                </button>
                <button
                  onClick={exportEnrichedJSON}
                  style={{
                    background: COLORS.accent,
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    color: "#000",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  Export Enriched JSON
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ color: "#555", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Storage
              </h3>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div>
                  <span style={{ color: COLORS.accent, fontSize: "24px", fontWeight: 800 }}>{entries.length}</span>
                  <span style={{ color: COLORS.muted, fontSize: "11px", marginLeft: "6px" }}>health entries</span>
                </div>
                <div>
                  <span style={{ color: "#4fc3f7", fontSize: "24px", fontWeight: 800 }}>{journalEntries.length}</span>
                  <span style={{ color: COLORS.muted, fontSize: "11px", marginLeft: "6px" }}>journal entries</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
