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

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "theme";
}

function createUniqueCustomId(base: string, existing: Record<string, CssTheme>) {
  let id = toSlug(base);
  let suffix = 1;

  while (existing[id]) {
    id = `${toSlug(base)}-${suffix}`;
    suffix += 1;
  }

  return id;
}

export default function WebEditPage() {
  const [customThemes, setCustomThemes] = useState<Record<string, CssTheme>>({});
  const [themeId, setThemeId] = useState<ThemeId>("midnight");
  const [status, setStatus] = useState<string | null>(null);

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

  const applyTheme = (nextId: ThemeId, nextCustom = customThemes) => {
    setThemeId(nextId);
    persistAndApplyTheme(nextId, nextCustom);
  };

  const ensureEditableTheme = (): { editableId: ThemeId; editableThemes: Record<string, CssTheme> } => {
    if (themeId.startsWith("custom:")) {
      return { editableId: themeId, editableThemes: customThemes };
    }

    const base = resolveTheme(themeId, customThemes) ?? THEMES.midnight;
    const customId = createUniqueCustomId(`${base.name}-custom`, customThemes);
    const editableThemes = {
      ...customThemes,
      [customId]: {
        ...base,
        name: `${base.name} Custom`,
      },
    };

    return {
      editableId: `custom:${customId}`,
      editableThemes,
    };
  };

  const updateTheme = (mutate: (theme: CssTheme) => CssTheme) => {
    const { editableId, editableThemes } = ensureEditableTheme();
    const customId = editableId.slice(7);
    const existing = editableThemes[customId];

    if (!existing) return;

    const nextCustom = {
      ...editableThemes,
      [customId]: mutate(existing),
    };

    setCustomThemes(nextCustom);
    saveCustomThemes(nextCustom);
    setStatus(themeId.startsWith("custom:") ? null : "Auto-created editable custom theme.");
    applyTheme(editableId, nextCustom);
  };

  const presetKeys = Object.keys(THEMES) as ThemeKey[];
  const customEntries = Object.entries(customThemes);
  const headingStyle = { color: currentTheme.heading } as const;
  const textStyle = { color: currentTheme.text } as const;
  const mutedStyle = { color: currentTheme.muted } as const;

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

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <span className="kicker">WebEdit</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Theme Tokens Workbench</h1>
        <p className="muted mt-2 max-w-3xl text-sm sm:text-base">
          Editing tokens now auto-applies globally. If you edit a preset, it is automatically forked to a custom theme.
        </p>
        {status ? <p className="mt-3 text-xs" style={textStyle}>{status}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <aside className="panel p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Theme Library</h2>

          <p className="mt-3 text-xs uppercase tracking-wide" style={mutedStyle}>Presets</p>
          <div className="mt-2 space-y-2">
            {presetKeys.map((key) => (
              <button
                key={key}
                onClick={() => applyTheme(key)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  themeId === key ? "border-white/60 bg-white/15" : "border-white/15 bg-black/20 hover:bg-white/10"
                }`}
              >
                <p className="text-sm font-semibold" style={headingStyle}>{THEMES[key].name}</p>
                <p className="text-xs" style={mutedStyle}>{key}</p>
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs uppercase tracking-wide" style={mutedStyle}>Custom</p>
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
                    <p className="text-sm font-semibold" style={headingStyle}>{theme.name}</p>
                    <p className="text-xs" style={mutedStyle}>custom:{id}</p>
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-3 text-xs" style={mutedStyle}>
                No custom themes yet. Start editing any preset to create one automatically.
              </p>
            )}
          </div>
        </aside>

        <article className="space-y-4">
          <div className="p-3 sm:p-4" style={previewSurfaceStyle}>
            <div className="space-y-4">
              <div className="p-5 sm:p-6" style={panelStyle}>
                <h2 className="text-2xl font-semibold" style={headingStyle}>Live Global Preview</h2>
                <p className="mt-2 text-sm" style={mutedStyle}>
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

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs" style={textStyle}>
                Theme Name
                <input
                  value={currentTheme.name}
                  onChange={(event) => updateTheme((theme) => ({ ...theme, name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs" style={textStyle}>
                Radius ({currentTheme.radius}px)
                <input
                  type="range"
                  min={8}
                  max={28}
                  value={currentTheme.radius}
                  onChange={(event) => updateTheme((theme) => ({ ...theme, radius: Number(event.target.value) }))}
                  className="mt-2 w-full"
                />
              </label>
            </div>

            <div className="mt-3 rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={mutedStyle}>Layout & Typography</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs" style={textStyle}>
                  Text Align
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["left", "center", "right"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateTheme((theme) => ({ ...theme, textAlign: mode }))}
                        className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition ${
                          currentTheme.textAlign === mode
                            ? "border-white/60 bg-white/15"
                            : "border-white/20 bg-black/20 hover:bg-white/10"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="text-xs" style={textStyle}>
                  Section Gap ({currentTheme.sectionGap}px)
                  <input
                    type="range"
                    min={8}
                    max={48}
                    value={currentTheme.sectionGap}
                    onChange={(event) => updateTheme((theme) => ({ ...theme, sectionGap: Number(event.target.value) }))}
                    className="mt-2 w-full"
                  />
                </label>

                <label className="text-xs" style={textStyle}>
                  Section Offset ({currentTheme.sectionOffset}px)
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={currentTheme.sectionOffset}
                    onChange={(event) => updateTheme((theme) => ({ ...theme, sectionOffset: Number(event.target.value) }))}
                    className="mt-2 w-full"
                  />
                </label>

                <label className="text-xs" style={textStyle}>
                  Font Scale ({currentTheme.fontScale.toFixed(2)})
                  <input
                    type="range"
                    min={0.85}
                    max={1.2}
                    step={0.01}
                    value={currentTheme.fontScale}
                    onChange={(event) => updateTheme((theme) => ({ ...theme, fontScale: Number(event.target.value) }))}
                    className="mt-2 w-full"
                  />
                </label>

                <label className="text-xs" style={textStyle}>
                  Line Height ({currentTheme.lineHeight.toFixed(2)})
                  <input
                    type="range"
                    min={1.2}
                    max={2}
                    step={0.05}
                    value={currentTheme.lineHeight}
                    onChange={(event) => updateTheme((theme) => ({ ...theme, lineHeight: Number(event.target.value) }))}
                    className="mt-2 w-full"
                  />
                </label>

                <label className="text-xs" style={textStyle}>
                  Content Width ({currentTheme.contentWidth}rem)
                  <input
                    type="range"
                    min={56}
                    max={96}
                    step={1}
                    value={currentTheme.contentWidth}
                    onChange={(event) => updateTheme((theme) => ({ ...theme, contentWidth: Number(event.target.value) }))}
                    className="mt-2 w-full"
                  />
                </label>
              </div>
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
                <label key={key} className="text-xs" style={textStyle}>
                  {label}
                  <input
                    type="color"
                    value={currentTheme[key] as string}
                    onChange={(event) =>
                      updateTheme((theme) => ({
                        ...theme,
                        [key]: event.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-white/15 bg-transparent"
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
