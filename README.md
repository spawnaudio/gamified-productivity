# Tiny Town

A personal dollhouse you earn by finishing real work.

## Setup

1. Copy `.env.example` to `.env` and add your Supabase URL and anon key.
2. Run `supabase/migrations/20260906000000_init.sql` in the Supabase SQL editor.
3. Enable email magic-link auth.

## Run

- Web companion: `npm install && npm run dev`
- Tests: `npm test`
- Desktop home: `npm run tauri dev` (requires a Rust/Cargo toolchain)

Magic-link email typically opens the system browser. First sign-in on web is expected until a desktop deep link exists.

Complete a task, tick a habit, or finish a focus session with a note to earn 1. Buy and place only on desktop.
