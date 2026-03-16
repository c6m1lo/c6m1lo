# Camilo777 Portfolio

This is a Next.js App Router project with multiple personal apps and portfolio pages.

## Getting Started

Run the development server:

```bash
npm run dev
```

If Turbopack is preferred (faster but can be less stable on some machines):

```bash
npm run dev:turbopack
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Journal MVP (`/journal`)

The Journal app is a local-first, client-side daily logging tool built for fast capture and future AI-loop expansion.

### Storage model

- Primary storage: `IndexedDB` (`camilo777-journal`, store: `entries`)
- Fallback storage: `localStorage` (used only if IndexedDB is unavailable)
- No journal data is sent to external services in this MVP

Each entry stores:

- `id`
- `timestamp` (ISO string)
- optional `title`
- `body`
- `snapshot` object:
  - `sleep`
  - `energy`
  - `mood`
  - `stress`
  - `focus`
  - `tags` (string array)

### Export / Import

- Export button downloads one JSON file containing all entries and metadata.
- Import button restores entries from that JSON file and replaces local journal data.
- IDs and timestamps are preserved as imported.

### Extend later (auth + server persistence)

To move beyond local-only storage, add:

1. Authentication (Supabase/Firebase/Auth.js)
2. Server persistence API routes
3. Per-user encryption and/or passphrase lock with Web Crypto
4. Sync conflict handling between local cache and server records
