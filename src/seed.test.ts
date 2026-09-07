import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";

describe("createSeedState", () => {
  it("starts with an empty task list, zero wallet, example habits, well and path", () => {
    const state = createSeedState();
    expect(state.tasks).toEqual([]);
    expect(state.wallet).toBe(0);
    expect(state.habits.map((habit) => habit.title)).toEqual([
      "Make the bed",
      "Write for ten minutes",
    ]);
    expect(state.board.find((piece) => piece.catalogId === "well")).toEqual({
      id: "seed-well",
      catalogId: "well",
      x: 7,
      y: 5,
      rotation: 0,
    });
    expect(state.board.filter((piece) => piece.catalogId === "path")).toHaveLength(3);
    expect(state.inventory).toEqual([]);
  });
});
