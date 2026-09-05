import { applyAction } from "../rules/apply";
import { createSeedState } from "../seed";
import type { AppState } from "../rules/types";
import type { TownRows } from "../session/mapRow";
import type { ActionWithLayout, TownBackend, TownSession } from "./backend";

const STATE_KEY = "tiny-town:local-state";
const SESSION_KEY = "tiny-town:local-session";
const LOCAL_USER = "local-user";

function loadState(): AppState {
  const raw = localStorage.getItem(STATE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AppState;
    } catch {
      // fall through to a fresh seed
    }
  }
  const seeded = createSeedState();
  localStorage.setItem(STATE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveState(state: AppState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function stateToRows(state: AppState): TownRows {
  return {
    tasks: state.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      created_at: task.createdAt,
      completed_at: task.completedAt,
    })),
    habits: state.habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      archived_at: habit.archivedAt,
    })),
    habit_ticks: state.habitTicks.map((tick) => ({
      id: tick.id,
      habit_id: tick.habitId,
      ticked_at: tick.tickedAt,
    })),
    focus_sessions: state.focusSessions.map((session) => ({
      id: session.id,
      planned_minutes: session.plannedMinutes,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      note: session.note,
      paid: session.paid,
    })),
    wallets: [{ balance: state.wallet }],
    ledger: state.ledger.map((entry) => ({
      id: entry.id,
      delta: entry.delta,
      source: entry.source,
      source_id: entry.sourceId,
      created_at: entry.createdAt,
    })),
    inventory: state.inventory.map((item) => ({
      catalog_id: item.catalogId,
      count: item.count,
    })),
    board_pieces: state.board.map((piece) => ({
      id: piece.id,
      catalog_id: piece.catalogId,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation,
    })),
  };
}

/**
 * A dev-only backend used when Supabase env vars are absent. It persists a
 * single seeded town in localStorage and enforces the same rules as the
 * server RPC via the shared `applyAction`. "Send link" signs you in
 * immediately since there is no mail server locally.
 */
export function createLocalBackend(): TownBackend {
  const listeners = new Set<(session: TownSession | null) => void>();

  function notify(session: TownSession | null): void {
    for (const listener of listeners) listener(session);
  }

  return {
    isLocal: true,
    async getSession() {
      return localStorage.getItem(SESSION_KEY) ? { userId: LOCAL_USER } : null;
    },
    onAuthStateChange(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    async signIn() {
      localStorage.setItem(SESSION_KEY, LOCAL_USER);
      loadState();
      notify({ userId: LOCAL_USER });
      return { error: null };
    },
    async signOut() {
      localStorage.removeItem(SESSION_KEY);
      notify(null);
    },
    async fetchRows() {
      return stateToRows(loadState());
    },
    async applyAction(action: ActionWithLayout) {
      const result = applyAction(loadState(), action, {
        layout: action.layout,
        sync: "ok",
      });
      if (!result.ok) return { error: result.error };
      saveState(result.state);
      return { error: null };
    },
  };
}
