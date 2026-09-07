import type { AppState, CatalogId, FocusSession, Rotation } from "../rules/types";

export type TownRows = {
  tasks: {
    id: string;
    title: string;
    notes: string;
    created_at: string;
    completed_at: string | null;
  }[];
  habits: { id: string; title: string; archived_at: string | null }[];
  habit_ticks: { id: string; habit_id: string; ticked_at: string }[];
  focus_sessions: {
    id: string;
    planned_minutes: 15 | 25 | 50;
    started_at: string;
    ended_at: string | null;
    note: string | null;
    paid: boolean;
  }[];
  wallets: { balance: number }[];
  ledger: {
    id: string;
    delta: number;
    source: "task" | "habit" | "focus" | "purchase";
    source_id: string;
    created_at: string;
  }[];
  inventory: { catalog_id: string; count: number }[];
  board_pieces: {
    id: string;
    catalog_id: string;
    x: number;
    y: number;
    rotation: number;
  }[];
};

export function rowsToState(rows: TownRows): AppState {
  return {
    tasks: rows.tasks.map((row) => ({
      id: row.id,
      title: row.title,
      notes: row.notes,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    })),
    habits: rows.habits.map((row) => ({
      id: row.id,
      title: row.title,
      archivedAt: row.archived_at,
    })),
    habitTicks: rows.habit_ticks.map((row) => ({
      id: row.id,
      habitId: row.habit_id,
      tickedAt: row.ticked_at,
    })),
    focusSessions: rows.focus_sessions.map(
      (row) =>
        ({
          id: row.id,
          plannedMinutes: row.planned_minutes,
          startedAt: row.started_at,
          endedAt: row.ended_at,
          note: row.note,
          paid: row.paid,
        }) satisfies FocusSession,
    ),
    wallet: rows.wallets[0]?.balance ?? 0,
    ledger: rows.ledger.map((row) => ({
      id: row.id,
      delta: row.delta,
      source: row.source,
      sourceId: row.source_id,
      createdAt: row.created_at,
    })),
    inventory: rows.inventory.map((row) => ({
      catalogId: row.catalog_id as CatalogId,
      count: row.count,
    })),
    board: rows.board_pieces.map((row) => ({
      id: row.id,
      catalogId: row.catalog_id as CatalogId,
      x: row.x,
      y: row.y,
      rotation: row.rotation as Rotation,
    })),
  };
}
