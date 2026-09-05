import { getCatalogItem, WORK_CREDIT } from "../catalog";
import { isOnBoard, occupiedCells, rectanglesOverlap } from "./geometry";
import { cloneState } from "./state";
import type {
  Action,
  ApplyContext,
  AppState,
  CatalogId,
  InventoryItem,
  LedgerEntry,
  MutationResult,
} from "./types";
import { writesAllowed } from "./writes";

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

function hasLedger(
  state: AppState,
  source: LedgerEntry["source"],
  sourceId: string,
): boolean {
  return state.ledger.some(
    (row) => row.source === source && row.sourceId === sourceId,
  );
}

function addInventory(state: AppState, catalogId: CatalogId, delta: number): void {
  const row = state.inventory.find((item) => item.catalogId === catalogId);
  if (row) {
    row.count += delta;
    if (row.count <= 0) {
      state.inventory = state.inventory.filter(
        (item) => item.catalogId !== catalogId,
      );
    }
    return;
  }
  if (delta > 0) {
    const item: InventoryItem = { catalogId, count: delta };
    state.inventory.push(item);
  }
}

function inventoryCount(state: AppState, catalogId: CatalogId): number {
  return state.inventory.find((item) => item.catalogId === catalogId)?.count ?? 0;
}

export function applyAction(
  state: AppState,
  action: Action,
  context: ApplyContext,
): MutationResult {
  if (!writesAllowed(context.sync)) {
    return { ok: false, error: "sync_blocked" };
  }
  if (
    context.layout === "companion" &&
    (action.type === "buy" || action.type === "place" || action.type === "pickUp")
  ) {
    return { ok: false, error: "companion_forbidden" };
  }

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
    case "buy": {
      if (hasLedger(next, "purchase", action.id)) return { ok: true, state };
      const item = getCatalogItem(action.catalogId);
      if (item.price === null) return { ok: false, error: "starter_not_for_sale" };
      if (next.wallet < item.price) return { ok: false, error: "insufficient_funds" };
      next.wallet -= item.price;
      addInventory(next, action.catalogId, 1);
      next.ledger.push({
        id: `purchase:${action.id}`,
        delta: -item.price,
        source: "purchase",
        sourceId: action.id,
        createdAt: action.at,
      });
      return { ok: true, state: next };
    }
    case "place": {
      if (next.board.some((piece) => piece.id === action.id)) return { ok: true, state };
      if (inventoryCount(next, action.catalogId) < 1) {
        return { ok: false, error: "empty_inventory" };
      }
      const cells = occupiedCells(action.catalogId, action.x, action.y, action.rotation);
      if (!isOnBoard(cells)) return { ok: false, error: "off_board" };
      for (const piece of next.board) {
        const taken = occupiedCells(piece.catalogId, piece.x, piece.y, piece.rotation);
        if (rectanglesOverlap(cells, taken)) return { ok: false, error: "overlap" };
      }
      addInventory(next, action.catalogId, -1);
      next.board.push({
        id: action.id,
        catalogId: action.catalogId,
        x: action.x,
        y: action.y,
        rotation: action.rotation,
      });
      return { ok: true, state: next };
    }
    case "pickUp": {
      const piece = next.board.find((row) => row.id === action.id);
      if (!piece) return { ok: false, error: "not_found" };
      next.board = next.board.filter((row) => row.id !== action.id);
      addInventory(next, piece.catalogId, 1);
      return { ok: true, state: next };
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
