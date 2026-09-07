import { describe, expect, it } from "vitest";
import { rowsToState } from "./mapRow";

describe("rowsToState", () => {
  it("maps wallet, tasks, and board rows into AppState", () => {
    const state = rowsToState({
      tasks: [
        {
          id: "t1",
          title: "Invoice",
          notes: "",
          created_at: "2026-09-06T01:00:00.000Z",
          completed_at: null,
        },
      ],
      habits: [],
      habit_ticks: [],
      focus_sessions: [],
      wallets: [{ balance: 3 }],
      ledger: [],
      inventory: [{ catalog_id: "path", count: 2 }],
      board_pieces: [{ id: "p1", catalog_id: "well", x: 7, y: 5, rotation: 0 }],
    });
    expect(state.wallet).toBe(3);
    expect(state.tasks[0]?.id).toBe("t1");
    expect(state.inventory[0]).toEqual({ catalogId: "path", count: 2 });
    expect(state.board[0]?.catalogId).toBe("well");
  });
});
