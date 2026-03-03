export type ThemeKey = "midnight" | "paper" | "sunset" | "neon";
export type ThemeId = ThemeKey | `custom:${string}`;

export type CssTheme = {
  name: string;
  pageTop: string;
  pageBottom: string;
  surface: string;
  surfaceMuted: string;
  heading: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  radius: number;
  textAlign: "left" | "center" | "right";
  sectionGap: number;
  sectionOffset: number;
  fontScale: number;
  lineHeight: number;
  contentWidth: number;
};

export const THEME_CACHE_KEY = "webedit-css-theme-v1";
export const CUSTOM_THEMES_KEY = "webedit-css-custom-themes-v1";
export const THEME_EVENT_NAME = "webedit-theme-change";

export const THEMES: Record<ThemeKey, CssTheme> = {
  midnight: {
    name: "Midnight",
    pageTop: "#0f172a",
    pageBottom: "#020617",
    surface: "#0b1220",
    surfaceMuted: "#121b2d",
    heading: "#f8fafc",
    text: "#dbe7ff",
    muted: "#8ca0c5",
    accent: "#38bdf8",
    border: "#263246",
    radius: 18,
    textAlign: "left",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    lineHeight: 1.6,
    contentWidth: 72,
  },
  paper: {
    name: "Paper",
    pageTop: "#f8fafc",
    pageBottom: "#e2e8f0",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    heading: "#000000",
    text: "#000000",
    muted: "#000000",
    accent: "#0ea5e9",
    border: "#cbd5e1",
    radius: 14,
    textAlign: "left",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    lineHeight: 1.6,
    contentWidth: 72,
  },
  sunset: {
    name: "Sunset",
    pageTop: "#2d132c",
    pageBottom: "#120f2b",
    surface: "#3d1a34",
    surfaceMuted: "#4a1f3e",
    heading: "#fff7ed",
    text: "#ffe7d4",
    muted: "#f9b997",
    accent: "#fb7185",
    border: "#69395f",
    radius: 20,
    textAlign: "left",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    lineHeight: 1.6,
    contentWidth: 72,
  },
  neon: {
    name: "Neon Grid",
    pageTop: "#07121b",
    pageBottom: "#02070f",
    surface: "#0b1d2a",
    surfaceMuted: "#12283a",
    heading: "#ecfeff",
    text: "#bae6fd",
    muted: "#67e8f9",
    accent: "#22d3ee",
    border: "#1f4862",
    radius: 16,
    textAlign: "left",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    lineHeight: 1.6,
    contentWidth: 72,
  },
};

function isCssTheme(value: unknown): value is CssTheme {
  if (!value || typeof value !== "object") return false;
  const theme = value as Partial<CssTheme>;

  return (
    typeof theme.name === "string" &&
    typeof theme.pageTop === "string" &&
    typeof theme.pageBottom === "string" &&
    typeof theme.surface === "string" &&
    typeof theme.surfaceMuted === "string" &&
    typeof theme.heading === "string" &&
    typeof theme.text === "string" &&
    typeof theme.muted === "string" &&
    typeof theme.accent === "string" &&
    typeof theme.border === "string" &&
    typeof theme.radius === "number" &&
    (theme.textAlign === "left" || theme.textAlign === "center" || theme.textAlign === "right") &&
    typeof theme.sectionGap === "number" &&
    typeof theme.sectionOffset === "number" &&
    typeof theme.fontScale === "number" &&
    typeof theme.lineHeight === "number" &&
    typeof theme.contentWidth === "number"
  );
}

export function isThemeKey(value: string): value is ThemeKey {
  return value in THEMES;
}

export function getCachedThemeId(): ThemeId | null {
  if (typeof window === "undefined") return null;

  const cached = window.localStorage.getItem(THEME_CACHE_KEY);
  if (!cached) return null;
  if (isThemeKey(cached) || cached.startsWith("custom:")) return cached as ThemeId;
  return null;
}

export function getCustomThemes(): Record<string, CssTheme> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, CssTheme> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (isCssTheme(value)) {
        next[key] = value;
      }
    }

    return next;
  } catch {
    return {};
  }
}

export function saveCustomThemes(themes: Record<string, CssTheme>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}

export function resolveTheme(themeId: ThemeId, customThemes: Record<string, CssTheme>): CssTheme | null {
  if (isThemeKey(themeId)) return THEMES[themeId];

  if (themeId.startsWith("custom:")) {
    const id = themeId.slice(7);
    return customThemes[id] ?? null;
  }

  return null;
}

export function applyThemeToDocument(theme: CssTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-text-align", theme.textAlign);

  root.style.setProperty("--page-top", theme.pageTop);
  root.style.setProperty("--page-bottom", theme.pageBottom);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-muted", theme.surfaceMuted);
  root.style.setProperty("--foreground", theme.text);
  root.style.setProperty("--foreground-soft", theme.muted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-strong", theme.heading);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--radius", `${theme.radius}px`);
  root.style.setProperty("--text-align", theme.textAlign);
  root.style.setProperty("--section-gap", `${theme.sectionGap}px`);
  root.style.setProperty("--section-offset", `${theme.sectionOffset}px`);
  root.style.setProperty("--font-scale", `${theme.fontScale}`);
  root.style.setProperty("--line-height", `${theme.lineHeight}`);
  root.style.setProperty("--content-width", `${theme.contentWidth}rem`);
}

export function persistAndApplyTheme(themeId: ThemeId, customThemes: Record<string, CssTheme>) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(THEME_CACHE_KEY, themeId);

  const resolved = resolveTheme(themeId, customThemes);
  if (resolved) {
    applyThemeToDocument(resolved);
  }

  window.dispatchEvent(new CustomEvent<ThemeId>(THEME_EVENT_NAME, { detail: themeId }));
}

export function applyCachedThemeToDocument() {
  const themeId = getCachedThemeId();
  if (!themeId) return;

  const resolved = resolveTheme(themeId, getCustomThemes());
  if (resolved) {
    applyThemeToDocument(resolved);
  }
}
