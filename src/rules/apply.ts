import { WORK_CREDIT } from "../catalog";
import { cloneState } from "./state";
import type {
  Action,
  ApplyContext,
  AppState,
  LedgerEntry,
  MutationResult,
} from "./types";

function credit(
  state: AppState,
  source: LedgerEntry["source"],
  sourceId: string,
  at: string,
): void {
  state.wallet += WORK_CREDIT;
  state.ledger.push({
    id: `${source}:${sourceId}`,
    delta: WORK_CREDIT,
    source,
    sourceId,
    createdAt: at,
  });
}

function hasLedger(state: AppState, source: LedgerEntry["source"], sourceId: string): boolean {
  return state.ledger.some((row) => row.source === source && row.sourceId === sourceId);
}

export function applyAction(
  state: AppState,
  action: Action,
  context: ApplyContext,
): MutationResult {
  void context;
  const next = cloneState(state);

  switch (action.type) {
    case "createTask": {
      if (next.tasks.some((task) => task.id === action.id)) {
        return { ok: true, state };
      }
      next.tasks.push({
        id: action.id,
        title: action.title.trim(),
        notes: action.notes,
        createdAt: action.at,
        completedAt: null,
      });
      return { ok: true, state: next };
    }
    case "completeTask": {
      const task = next.tasks.find((row) => row.id === action.id);
      if (!task) return { ok: false, error: "not_found" };
      if (task.completedAt) return { ok: true, state };
      task.completedAt = action.at;
      if (!hasLedger(next, "task", task.id)) {
        credit(next, "task", task.id, action.at);
      }
      return { ok: true, state: next };
    }
    case "deleteTask": {
      const exists = next.tasks.some((row) => row.id === action.id);
      if (!exists) return { ok: false, error: "not_found" };
      next.tasks = next.tasks.filter((row) => row.id !== action.id);
      return { ok: true, state: next };
    }
    case "createHabit": {
      if (next.habits.some((habit) => habit.id === action.id)) {
        return { ok: true, state };
      }
      next.habits.push({ id: action.id, title: action.title.trim(), archivedAt: null });
      return { ok: true, state: next };
    }
    case "tickHabit": {
      const habit = next.habits.find((row) => row.id === action.habitId);
      if (!habit || habit.archivedAt) return { ok: false, error: "not_found" };
      if (next.habitTicks.some((tick) => tick.id === action.tickId)) {
        return { ok: true, state };
      }
      next.habitTicks.push({
        id: action.tickId,
        habitId: action.habitId,
        tickedAt: action.at,
      });
      if (!hasLedger(next, "habit", action.tickId)) {
        credit(next, "habit", action.tickId, action.at);
      }
      return { ok: true, state: next };
    }
    case "archiveHabit": {
      const habit = next.habits.find((row) => row.id === action.id);
      if (!habit) return { ok: false, error: "not_found" };
      if (habit.archivedAt) return { ok: true, state };
      habit.archivedAt = new Date().toISOString();
      return { ok: true, state: next };
    }
    case "startFocus": {
      if (next.focusSessions.some((row) => row.endedAt === null)) {
        return { ok: false, error: "focus_already_open" };
      }
      if (next.focusSessions.some((row) => row.id === action.id)) {
        return { ok: true, state };
      }
      next.focusSessions.push({
        id: action.id,
        plannedMinutes: action.plannedMinutes,
        startedAt: action.at,
        endedAt: null,
        note: null,
        paid: false,
      });
      return { ok: true, state: next };
    }
    case "finishFocus": {
      const session = next.focusSessions.find((row) => row.id === action.id);
      if (!session) return { ok: false, error: "not_found" };
      if (session.paid) return { ok: true, state };
      if (session.endedAt && !session.paid) return { ok: false, error: "focus_not_open" };
      const note = action.note.trim();
      if (!note) return { ok: false, error: "note_required" };
      session.endedAt = action.at;
      session.note = note;
      session.paid = true;
      if (!hasLedger(next, "focus", session.id)) {
        credit(next, "focus", session.id, action.at);
      }
      return { ok: true, state: next };
    }
    case "discardFocus": {
      const session = next.focusSessions.find((row) => row.id === action.id);
      if (!session) return { ok: false, error: "not_found" };
      if (session.endedAt) return { ok: true, state };
      session.endedAt = action.at;
      session.paid = false;
      return { ok: true, state: next };
    }
    case "buy":
    case "place":
    case "pickUp":
      return { ok: false, error: "not_found" };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
