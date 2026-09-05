import { emptyState } from "./rules/state";
import type { AppState } from "./rules/types";

export function createSeedState(): AppState {
  const state = emptyState();
  state.habits = [
    { id: "seed-habit-bed", title: "Make the bed", archivedAt: null },
    { id: "seed-habit-write", title: "Write for ten minutes", archivedAt: null },
  ];
  state.board = [
    { id: "seed-well", catalogId: "well", x: 7, y: 5, rotation: 0 },
    { id: "seed-path-1", catalogId: "path", x: 7, y: 6, rotation: 0 },
    { id: "seed-path-2", catalogId: "path", x: 7, y: 7, rotation: 0 },
    { id: "seed-path-3", catalogId: "path", x: 7, y: 8, rotation: 0 },
  ];
  return state;
}
