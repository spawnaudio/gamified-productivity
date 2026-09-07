import type { AppState } from "./types";

export function emptyState(): AppState {
  return {
    tasks: [],
    habits: [],
    habitTicks: [],
    focusSessions: [],
    wallet: 0,
    ledger: [],
    inventory: [],
    board: [],
  };
}

export function cloneState(state: AppState): AppState {
  return structuredClone(state);
}
