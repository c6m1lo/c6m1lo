"use client";

import { useEffect } from "react";

import {
  applyCachedThemeToDocument,
  applyThemeToDocument,
  getCustomThemes,
  resolveTheme,
  THEME_CACHE_KEY,
  THEME_EVENT_NAME,
  type ThemeId,
} from "@/lib/webeditTheme";

export default function GlobalThemeSync() {
  useEffect(() => {
    applyCachedThemeToDocument();

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_CACHE_KEY || !event.newValue) return;

      const resolved = resolveTheme(event.newValue as ThemeId, getCustomThemes());
      if (resolved) {
        applyThemeToDocument(resolved);
      }
    };

    const onThemeEvent = (event: Event) => {
      const custom = event as CustomEvent<ThemeId>;
      const key = custom.detail;
      if (!key) return;

      const resolved = resolveTheme(key, getCustomThemes());
      if (resolved) {
        applyThemeToDocument(resolved);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_EVENT_NAME, onThemeEvent);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_EVENT_NAME, onThemeEvent);
    };
  }, []);

  return null;
}
