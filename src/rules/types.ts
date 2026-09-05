export type CatalogId =
  | "well"
  | "path"
  | "flowerbox"
  | "bench"
  | "lamp"
  | "tree"
  | "cottage"
  | "workshop"
  | "library"
  | "garden";

export type Rotation = 0 | 90 | 180 | 270;

export type LedgerSource = "task" | "habit" | "focus" | "purchase";

export type SyncStatus = "ok" | "syncing" | "offline";

export type LayoutMode = "companion" | "home";

export type CatalogItem = {
  id: CatalogId;
  name: string;
  price: number | null;
  size: { w: number; h: number };
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
  completedAt: string | null;
};

export type Habit = {
  id: string;
  title: string;
  archivedAt: string | null;
};

export type HabitTick = {
  id: string;
  habitId: string;
  tickedAt: string;
};

export type FocusSession = {
  id: string;
  plannedMinutes: 15 | 25 | 50;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  paid: boolean;
};

export type LedgerEntry = {
  id: string;
  delta: number;
  source: LedgerSource;
  sourceId: string;
  createdAt: string;
};

export type InventoryItem = {
  catalogId: CatalogId;
  count: number;
};

export type BoardPiece = {
  id: string;
  catalogId: CatalogId;
  x: number;
  y: number;
  rotation: Rotation;
};

export type AppState = {
  tasks: Task[];
  habits: Habit[];
  habitTicks: HabitTick[];
  focusSessions: FocusSession[];
  wallet: number;
  ledger: LedgerEntry[];
  inventory: InventoryItem[];
  board: BoardPiece[];
};

export type ApplyContext = {
  layout: LayoutMode;
  sync: SyncStatus;
};

export type Action =
  | { type: "createTask"; id: string; title: string; notes: string; at: string }
  | { type: "completeTask"; id: string; at: string }
  | { type: "deleteTask"; id: string }
  | { type: "createHabit"; id: string; title: string }
  | { type: "tickHabit"; tickId: string; habitId: string; at: string }
  | { type: "archiveHabit"; id: string }
  | { type: "startFocus"; id: string; plannedMinutes: 15 | 25 | 50; at: string }
  | { type: "finishFocus"; id: string; note: string; at: string }
  | { type: "discardFocus"; id: string; at: string }
  | { type: "buy"; id: string; catalogId: CatalogId; at: string }
  | {
      type: "place";
      id: string;
      catalogId: CatalogId;
      x: number;
      y: number;
      rotation: Rotation;
      at: string;
    }
  | { type: "pickUp"; id: string };

export type MutationError =
  | "already_completed"
  | "not_found"
  | "insufficient_funds"
  | "unknown_catalog"
  | "empty_inventory"
  | "overlap"
  | "off_board"
  | "focus_already_open"
  | "focus_not_open"
  | "note_required"
  | "starter_not_for_sale"
  | "sync_blocked"
  | "companion_forbidden";

export type MutationResult =
  | { ok: true; state: AppState }
  | { ok: false; error: MutationError };
