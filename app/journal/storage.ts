import type { JournalEntry } from "./types";
import { publishAppDataChange } from "../shared/sync";

const DB_NAME = "camilo777-journal";
const DB_VERSION = 1;
const STORE_NAME = "entries";
const FALLBACK_KEY = "camilo777-journal-entries";

function hasIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

function readFallback(): JournalEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallback(entries: JournalEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(entries));
}

export async function getAllEntries(): Promise<JournalEntry[]> {
  if (!hasIndexedDb()) {
    return readFallback().sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }

  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const entries = (request.result as JournalEntry[]).sort((a, b) =>
        a.timestamp < b.timestamp ? 1 : -1,
      );
      resolve(entries);
    };
    request.onerror = () => reject(request.error ?? new Error("Failed to read entries"));
  });
}

export async function upsertEntry(entry: JournalEntry): Promise<void> {
  if (!hasIndexedDb()) {
    const existing = readFallback().filter((item) => item.id !== entry.id);
    writeFallback([entry, ...existing]);
    publishAppDataChange({ domain: "journal", action: "upsert" });
    return;
  }

  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Failed to save entry"));
  });
  publishAppDataChange({ domain: "journal", action: "upsert" });
}

export async function removeEntry(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    const next = readFallback().filter((item) => item.id !== id);
    writeFallback(next);
    publishAppDataChange({ domain: "journal", action: "delete" });
    return;
  }

  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Failed to delete entry"));
  });
  publishAppDataChange({ domain: "journal", action: "delete" });
}

export async function replaceAllEntries(entries: JournalEntry[]): Promise<void> {
  if (!hasIndexedDb()) {
    writeFallback(entries);
    publishAppDataChange({ domain: "journal", action: "replace" });
    return;
  }

  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    for (const entry of entries) {
      store.put(entry);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to replace entries"));
  });
  publishAppDataChange({ domain: "journal", action: "replace" });
}
