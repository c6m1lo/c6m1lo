"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getCachedThemeId,
  getCustomThemes,
  persistAndApplyTheme,
  resolveTheme,
  saveCustomThemes,
  THEMES,
  type CssTheme,
  type ThemeId,
  type ThemeKey,
} from "@/lib/webeditTheme";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "theme";
}

function isCssTheme(value: unknown): value is CssTheme {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CssTheme>;
  return (
    typeof item.name === "string" &&
    typeof item.pageTop === "string" &&
    typeof item.pageBottom === "string" &&
    typeof item.surface === "string" &&
    typeof item.surfaceMuted === "string" &&
    typeof item.heading === "string" &&
    typeof item.text === "string" &&
    typeof item.muted === "string" &&
    typeof item.accent === "string" &&
    typeof item.border === "string" &&
    typeof item.radius === "number"
  );
}

export default function WebEditPage() {
  const [customThemes, setCustomThemes] = useState<Record<string, CssTheme>>({});
  const [themeId, setThemeId] = useState<ThemeId>("midnight");
  const [status, setStatus] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadedCustom = getCustomThemes();
    const cached = getCachedThemeId() ?? "midnight";
    const resolved = resolveTheme(cached, loadedCustom);

    setCustomThemes(loadedCustom);
    setThemeId(resolved ? cached : "midnight");
  }, []);

  const currentTheme = useMemo(
    () => resolveTheme(themeId, customThemes) ?? THEMES.midnight,
    [customThemes, themeId],
  );

  const isCustomTheme = themeId.startsWith("custom:");

  const applyTheme = (nextId: ThemeId, nextCustom = customThemes) => {
    setThemeId(nextId);
    persistAndApplyTheme(nextId, nextCustom);
  };

  const updateCustomTheme = (mutate: (theme: CssTheme) => CssTheme) => {
    if (!isCustomTheme) return;

    const customId = themeId.slice(7);
    const existing = customThemes[customId];
    if (!existing) return;

    const nextCustom = {
      ...customThemes,
      [customId]: mutate(existing),
    };

    setCustomThemes(nextCustom);
    saveCustomThemes(nextCustom);
    persistAndApplyTheme(themeId, nextCustom);
  };

  const duplicateCurrentAsCustom = () => {
    const baseName = `${currentTheme.name} Copy`;
    let slug = toSlug(baseName);
    let count = 1;

    while (customThemes[slug]) {
      count += 1;
      slug = toSlug(`${baseName} ${count}`);
    }

    const nextCustom = {
      ...customThemes,
      [slug]: { ...currentTheme, name: `${currentTheme.name} Copy` },
    };

    setCustomThemes(nextCustom);
    saveCustomThemes(nextCustom);
    applyTheme(`custom:${slug}`, nextCustom);
    setStatus("Created editable custom theme.");
  };

  const deleteCurrentCustom = () => {
    if (!isCustomTheme) return;
    const customId = themeId.slice(7);

    const nextCustom = { ...customThemes };
    delete nextCustom[customId];

    setCustomThemes(nextCustom);
    saveCustomThemes(nextCustom);
    applyTheme("midnight", nextCustom);
    setStatus("Deleted custom theme and switched to Midnight.");
  };

  const exportCustomThemes = () => {
    const blob = new Blob([JSON.stringify(customThemes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "webedit-custom-themes.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importCustomThemes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const incoming: Record<string, CssTheme> = {};

      for (const [key, value] of Object.entries(parsed)) {
        if (isCssTheme(value)) incoming[toSlug(key)] = value;
      }

      if (!Object.keys(incoming).length) {
        setStatus("Import skipped: no valid custom themes found.");
        return;
      }

      const nextCustom = { ...customThemes, ...incoming };
      setCustomThemes(nextCustom);
      saveCustomThemes(nextCustom);
      setStatus(`Imported ${Object.keys(incoming).length} theme(s).`);
    } catch {
      setStatus("Import failed: invalid JSON file.");
    }
  };

  const panelStyle = {
    background: `${currentTheme.surface}e6`,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: currentTheme.radius,
  } as const;

  const previewSurfaceStyle = {
    background: `linear-gradient(180deg, ${currentTheme.pageTop}, ${currentTheme.pageBottom})`,
    borderRadius: currentTheme.radius + 4,
    color: currentTheme.text,
  } as const;

  const presetKeys = Object.keys(THEMES) as ThemeKey[];
  const customEntries = Object.entries(customThemes);
  const headingTextStyle = { color: currentTheme.heading } as const;
  const bodyTextStyle = { color: currentTheme.text } as const;
  const mutedTextStyle = { color: currentTheme.muted } as const;

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <span className="kicker">WebEdit</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Prototype Theme Workbench</h1>
        <p className="muted mt-2 max-w-3xl text-sm sm:text-base">
          Pick, edit, import, and export CSS themes. Selection and custom themes are cached and applied site-wide.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={duplicateCurrentAsCustom}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Duplicate To Custom
          </button>
          <button
            onClick={exportCustomThemes}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            Export Custom Themes
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            Import Custom Themes
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            onChange={(event) => void importCustomThemes(event)}
            className="hidden"
          />
          {isCustomTheme ? (
            <button
              onClick={deleteCurrentCustom}
              className="rounded-lg border border-red-900/70 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/40"
            >
              Delete Current Custom
            </button>
          ) : null}
        </div>
        {status ? <p className="mt-3 text-xs" style={bodyTextStyle}>{status}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <aside className="panel p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Theme Library</h2>

          <p className="mt-3 text-xs uppercase tracking-wide" style={mutedTextStyle}>Presets</p>
          <div className="mt-2 space-y-2">
            {presetKeys.map((key) => (
              <button
                key={key}
                onClick={() => applyTheme(key)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  themeId === key ? "border-white/60 bg-white/15" : "border-white/15 bg-black/20 hover:bg-white/10"
                }`}
              >
                <p className="text-sm font-semibold" style={headingTextStyle}>{THEMES[key].name}</p>
                <p className="text-xs" style={mutedTextStyle}>{key}</p>
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs uppercase tracking-wide" style={mutedTextStyle}>Custom</p>
          <div className="mt-2 space-y-2">
            {customEntries.length ? (
              customEntries.map(([id, theme]) => {
                const customThemeId = `custom:${id}` as ThemeId;
                return (
                  <button
                    key={id}
                    onClick={() => applyTheme(customThemeId)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                      themeId === customThemeId
                        ? "border-white/60 bg-white/15"
                        : "border-white/15 bg-black/20 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-sm font-semibold" style={headingTextStyle}>{theme.name}</p>
                    <p className="text-xs" style={mutedTextStyle}>custom:{id}</p>
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-3 text-xs" style={mutedTextStyle}>
                No custom themes yet.
              </p>
            )}
          </div>
        </aside>

        <article className="space-y-4">
          <div className="p-3 sm:p-4" style={previewSurfaceStyle}>
            <div className="space-y-4">
              <div className="p-5 sm:p-6" style={panelStyle}>
                <h2 className="text-2xl font-semibold" style={{ color: currentTheme.heading }}>
                  Live Global Theme Preview
                </h2>
                <p className="mt-2 text-sm" style={{ color: currentTheme.muted }}>
                  Current theme id: <span className="font-mono">{themeId}</span>
                </p>
                <button
                  className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-black"
                  style={{ backgroundColor: currentTheme.accent }}
                >
                  Accent Button
                </button>
              </div>
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Theme Tokens</h3>
            {!isCustomTheme ? (
              <p className="mt-2 text-sm" style={mutedTextStyle}>Duplicate a preset to custom before editing tokens.</p>
            ) : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs" style={bodyTextStyle}>
                Theme Name
                <input
                  value={currentTheme.name}
                  disabled={!isCustomTheme}
                  onChange={(event) => updateCustomTheme((theme) => ({ ...theme, name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm disabled:opacity-50"
                />
              </label>
              <label className="text-xs" style={bodyTextStyle}>
                Radius ({currentTheme.radius}px)
                <input
                  type="range"
                  min={8}
                  max={28}
                  value={currentTheme.radius}
                  disabled={!isCustomTheme}
                  onChange={(event) => updateCustomTheme((theme) => ({ ...theme, radius: Number(event.target.value) }))}
                  className="mt-2 w-full disabled:opacity-50"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["pageTop", "Page Top"],
                  ["pageBottom", "Page Bottom"],
                  ["surface", "Surface"],
                  ["surfaceMuted", "Surface Muted"],
                  ["heading", "Heading"],
                  ["text", "Text"],
                  ["muted", "Muted"],
                  ["accent", "Accent"],
                  ["border", "Border"],
                ] as Array<[keyof CssTheme, string]>
              ).map(([key, label]) => (
                <label key={key} className="text-xs" style={bodyTextStyle}>
                  {label}
                  <input
                    type="color"
                    value={currentTheme[key] as string}
                    disabled={!isCustomTheme}
                    onChange={(event) =>
                      updateCustomTheme((theme) => ({
                        ...theme,
                        [key]: event.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-white/15 bg-transparent disabled:opacity-50"
                  />
                </label>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
