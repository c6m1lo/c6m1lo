"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function WebEditPage() {
  
  const [customThemes, setCustomThemes] = useState<Record<string, CssTheme>>({});
  const [themeId, setThemeId] = useState<ThemeId>("midnight");

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
      </section>
    </div>
  );
}
