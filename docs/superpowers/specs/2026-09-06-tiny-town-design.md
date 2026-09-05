# Tiny Town v1 design

**Date:** 2026-09-06  
**Status:** Draft for review  
**Product:** Tiny Town — a personal dollhouse earned by real work

## Purpose

Build a solo, calm productivity toy for one person. Completing real work earns a single currency. That currency buys buildings and furniture for a top-down town board. Missed days never erase the town, the wallet, or past completions.

Version 1 is a personal tool with a sign-in, not a public product. Phones are out of scope.

## Locked product decisions

- Concept: Tiny Town (not Boss Battle, Daily Deck, or the later surprise concepts).
- Audience: the owner only.
- Town job: a cozy sandbox. Work unlocks decorating and placing.
- Work inputs, all first-class: tasks, habits, and timed focus sessions.
- Economy: one currency. Any eligible completion can buy any catalog item. Placement is unrestricted.
- Play: dollhouse — look down on a grid, drag pieces into place. No walking character.
- Clients: desktop is home (full dollhouse). Web is a thin companion (work + wallet only). Phones later.
- Data: one cloud account; both clients stay in sync. No offline write queue in v1.

## Architecture

One TypeScript + React web app, built with Vite, hosted as a static SPA.

The same app has two layouts:

- **Companion (browser):** tasks, habits, focus timer, wallet, sync status.
- **Home (desktop):** those panes plus the dollhouse board, catalog, and inventory.

Desktop is the same UI wrapped in Tauri. The wrapper provides a real window and a sensible default size. It does not own a second renderer or a second data store.

A hosted backend (Supabase: Auth + Postgres + Row Level Security) is the only source of truth. Both clients talk to it over the network. If the network is down, the last-known state is visible and read-only.

The dollhouse is a 2D top-down grid in the web app (positioned DOM or canvas). Each placed piece is data: catalog id, grid x, grid y, optional rotation in 90-degree steps.

Visual tone: simple, readable 2D top-down sprites. Cozy and flat, not photorealistic, not a 3D engine.

## Core loop

1. Do one piece of real work (complete a task, tick a habit, or finish a focus session with a note).
2. The wallet increases by **1**.
3. On desktop, spend from a catalog into inventory, then drag from inventory onto the board.
4. A short credit animation and the new balance are the only celebration.

### Work rules

- **Task:** title, optional notes, created time, completed time. Completing pays 1. Completing the same task twice does not pay twice. No projects, tags, or due dates in v1.
- **Habit:** title, active or archived. Each tick is a timestamped event and pays 1. A habit may be ticked more than once per day. There are no streaks and no penalties for missed days.
- **Focus session:** planned duration (presets: 15, 25, 50 minutes), start time, end time, one line on what moved, and whether it paid. Ending early still pays if the note is present. A timer that reaches zero does not pay until the note is saved. Discarding a session pays nothing.

### Town rules

- Catalog items have a fixed integer price.
- Buy: if wallet >= price, subtract price, add one to inventory for that catalog id.
- Place: if inventory count > 0 and the item’s rectangle is fully on the board and does not overlap another piece, decrement inventory and add a board instance. A piece occupies the axis-aligned rectangle in the catalog. Pieces cannot overlap.
- Pick up: remove the board instance, increment inventory. Free, unlimited.
- Sell, delete-to-void, and gifts are out of scope. Hide unused pieces by picking them up.
- Wallet cannot go below zero.

### First-run defaults

- Task list starts empty.
- Two example habits, both deletable: “Make the bed”, “Write for ten minutes”.
- Board starts with a short path of tiles and one starter piece already placed: a well (catalog id `well`). The well is already owned; it is not purchased.
- Wallet starts at 0.

## Surfaces

### Desktop (home)

One window, two panes.

- Main pane: town board (grid, placed pieces, drag from inventory).
- Side pane: open tasks, habits, focus timer, wallet, and a toggle between catalog and inventory.
- The side pane can be collapsed so only the map is visible.
- Work and play stay in the same window. There is no separate game mode.

### Web (companion)

- Tasks, habits, focus timer, wallet, sign-in, sync status.
- No board. No buy. No place.
- No catalog peek in v1. Spending waits for desktop.

### Shared chrome

- Sign in and sign out (Supabase email magic link is enough for one user).
- Sync status: ok, syncing, or cannot reach server.
- Settings: preferred focus presets only. Theme can follow the OS.

### Not in v1

Phone app, public profile, friends, real-money shop, web town editor, onboarding carousel.

## Data

Single-user rows, all scoped to `user_id`.

| Entity | Fields |
| --- | --- |
| Profile | `user_id`, display name optional |
| Task | `id`, `user_id`, `title`, `notes`, `created_at`, `completed_at` (null if open) |
| Habit | `id`, `user_id`, `title`, `archived_at` (null if active) |
| Habit tick | `id`, `user_id`, `habit_id`, `ticked_at` |
| Focus session | `id`, `user_id`, `planned_minutes`, `started_at`, `ended_at`, `note`, `paid` |
| Wallet | `user_id`, `balance` (integer) |
| Ledger | `id`, `user_id`, `delta`, `source` (`task` \| `habit` \| `focus` \| `purchase`), `source_id`, `created_at` |
| Inventory | `user_id`, `catalog_id`, `count` |
| Board piece | `id`, `user_id`, `catalog_id`, `x`, `y`, `rotation` |

Catalog lives in app code, not the database:

| id | name | price | size (w×h cells) |
| --- | --- | --- | --- |
| `well` | Well | — (starter) | 1×1 |
| `path` | Path tile | 1 | 1×1 |
| `flowerbox` | Flower box | 2 | 1×1 |
| `bench` | Bench | 3 | 2×1 |
| `lamp` | Lamp post | 3 | 1×1 |
| `tree` | Tree | 4 | 1×1 |
| `cottage` | Cottage | 8 | 2×2 |
| `workshop` | Workshop | 10 | 2×2 |
| `library` | Library | 12 | 2×2 |
| `garden` | Garden plot | 6 | 2×2 |

Sprites ship with the app. Adding catalog items in v1 is a code change.

## Data flow

1. Client writes an intended action (complete task, tick habit, finish focus, buy, place, pick up) with a stable client-generated id.
2. Server authenticates, applies the rule in a transaction, writes ledger + mutated rows, returns the new wallet, inventory, and relevant entities.
3. After each successful write, the acting client applies the server payload. The other client refetches when its window gains focus. Desktop and web show the same wallet after that refresh. Realtime subscriptions are not required in v1.

Focus: at most one session with `ended_at` null per user. A second start is rejected until the open session is finished or discarded.

## Errors and edge cases

- **Expired session:** both clients return to sign-in. No guest town.
- **Offline or API down:** last-known tasks, habits, sessions, wallet, and board stay visible and read-only. Complete, tick, finish, buy, and place are disabled. Message: “Can’t sync right now.” No offline queue, so the wallet cannot fork.
- **Retries:** server mutations are idempotent on the stable id. The same completion cannot credit twice.
- **Races:** two devices completing the same task — one completion. Two devices buying — each checked against the current balance. Two devices placing — each checked against inventory; the board does not lock as a whole.
- **Focus crash:** reopening restores the open session. The user finishes with a note (pays) or discards (no pay).
- **Unknown catalog id, insufficient funds, empty inventory, off-board placement, or overlap:** server rejects; client drops optimistic UI and shows the server board and balance.
- **Deletes:** deleting a completed task or archiving a habit does not claw back currency. Old ticks remain.
- **Empty states:** no tasks, zero balance, or an empty-looking board (everything in inventory) are all valid.

## Testing

### Automated (shared rules)

- Eligible task / habit tick / noted focus each credit 1.
- A task cannot pay twice.
- Habit ticks each pay, including more than one per day.
- Focus does not pay on timer expiry alone, or when discarded.
- Wallet cannot go negative.
- Buy moves currency to inventory; place moves inventory to the board; pick up reverses place.
- Retries with the same id do not double-credit.
- Companion layout cannot buy or place; home layout can.
- “Can’t sync” disables complete, tick, finish, buy, and place.

### Manual before real use

1. Sign in on web and desktop.
2. Complete one task, one habit tick, and one noted focus session on the web.
3. Confirm the wallet matches on desktop.
4. Buy and place a piece. Pick it up. Reload both clients.
5. Expire the session and confirm earning is blocked.
6. Kill the network and confirm the board is visible but locked.

No visual snapshot suite, load test, or mobile lab in v1.

## Non-goals

- Other concepts from the ideation doc (Boss Battle, Daily Deck, Crew Quests, and the later surprise list).
- Streaks, decaying towns, typed materials, life-area placement locks.
- Walking, NPCs, seasons that punish absence.
- Offline-first writes, multiplayer, public towns, teams.
- Native iOS or Android.
- A game engine (Godot, Unity).
- Real-money purchases.
- Due dates, projects, tags, calendars, integrations with other todo apps.

## Implementation sketch

This is enough to plan, not an implementation checklist.

- Monorepo or single app folder: Vite + React + TypeScript.
- Tauri for the desktop window, loading the same built UI with a `desktop` layout flag.
- Supabase project: auth, tables above, RLS by `user_id`, RPC or transactional functions for complete / tick / finish / buy / place / pick up.
- Shared rule module used by tests and, where practical, by the server functions so credits and spends cannot drift.

## Success for v1

You can run a real week on it: capture tasks on the web, tick habits, finish a few noted focus sessions, then sit at the desktop and grow a small board without ever losing what you already built.
