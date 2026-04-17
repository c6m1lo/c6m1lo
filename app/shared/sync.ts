export type AppDomain = "journal";

export type AppDataChange = {
  domain: AppDomain;
  action: "upsert" | "delete" | "replace" | "start" | "stop";
  at: string;
};

const SYNC_STORAGE_KEY = "camilo777-app-sync";
const SYNC_EVENT_NAME = "camilo777:app-data-change";

function canUseWindow() {
  return typeof window !== "undefined";
}

export function publishAppDataChange(change: Omit<AppDataChange, "at">) {
  if (!canUseWindow()) return;

  const payload: AppDataChange = {
    ...change,
    at: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent<AppDataChange>(SYNC_EVENT_NAME, { detail: payload }));

  try {
    window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify({ ...payload, nonce: Math.random() }));
  } catch {
    // Intentionally ignored; local dispatch is enough for same-tab updates.
  }
}

export function subscribeAppDataChanges(onChange: (change: AppDataChange) => void) {
  if (!canUseWindow()) {
    return () => {};
  }

  const onWindowEvent = (event: Event) => {
    const custom = event as CustomEvent<AppDataChange>;
    if (custom.detail) {
      onChange(custom.detail);
    }
  };

  const onStorageEvent = (event: StorageEvent) => {
    if (event.key !== SYNC_STORAGE_KEY || !event.newValue) return;

    try {
      const parsed = JSON.parse(event.newValue) as AppDataChange;
      if (parsed?.domain && parsed?.action) {
        onChange(parsed);
      }
    } catch {
      // Ignore malformed payloads.
    }
  };

  window.addEventListener(SYNC_EVENT_NAME, onWindowEvent);
  window.addEventListener("storage", onStorageEvent);

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, onWindowEvent);
    window.removeEventListener("storage", onStorageEvent);
  };
}
