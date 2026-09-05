# Tiny Town

A personal dollhouse you earn by finishing real work. Completing a task,
ticking a habit, or finishing a focus session with a note each credit **1**.
On the desktop you spend that wallet on a synced 2D town board.

One Vite + React + TypeScript SPA with two layouts: a **companion** layout in
the browser (work + wallet) and a **home** layout inside Tauri (adds the
dollhouse board, catalog, and inventory). A pure `applyAction` rule module is
the tested source of truth for credits, spends, placement, and guards, and the
same rules are mirrored by a Supabase `apply_action` RPC.

## Requirements

- Node 20+ (developed on Node 22)
- npm

## Setup

```bash
npm install
```

### Backend

Production uses Supabase (Auth + Postgres + RLS):

1. Copy `.env.example` to `.env` and add your Supabase URL and anon key.
2. Run `supabase/migrations/20260906000000_init.sql` in the Supabase SQL editor
   (or `supabase db push`).
3. Enable email magic-link auth.

**Dev mode without Supabase:** if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
are not set, the app falls back to an in-browser backend that persists a single
seeded town in `localStorage` and enforces the same rules via the shared
`applyAction`. "Send link" signs you straight in. This makes the app runnable
for development and demos without provisioning a cloud project. Production
builds (`npm run build`) still require the env vars.

## Run

- Web companion: `npm run dev` (open the printed URL)
- Preview the full dollhouse in the browser (dev only): add `?layout=home`
- Tests: `npm test`
- Type-check + production build: `npm run build`
- Desktop home: `npm run tauri dev` (requires the Rust toolchain and Tauri
  system dependencies)

Complete a task, tick a habit, or finish a focus session with a note to earn 1.
Buy and place pieces only on the desktop (home) layout.
