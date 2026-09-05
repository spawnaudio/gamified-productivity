import { describe, expect, it } from "vitest";
import { occupiedCells, isOnBoard, rectanglesOverlap } from "./geometry";

describe("occupiedCells", () => {
  it("keeps bench 2x1 at rotation 0 and 180", () => {
    expect(occupiedCells("bench", 3, 4, 0)).toEqual([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ]);
    expect(occupiedCells("bench", 3, 4, 180)).toEqual([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ]);
  });

  it("swaps bench to 1x2 at rotation 90 and 270", () => {
    expect(occupiedCells("bench", 3, 4, 90)).toEqual([
      { x: 3, y: 4 },
      { x: 3, y: 5 },
    ]);
  });
});

describe("isOnBoard", () => {
  it("rejects a cell past 16x12", () => {
    expect(isOnBoard([{ x: 15, y: 11 }])).toBe(true);
    expect(isOnBoard([{ x: 16, y: 11 }])).toBe(false);
    expect(isOnBoard([{ x: 0, y: -1 }])).toBe(false);
  });
});

describe("rectanglesOverlap", () => {
  it("detects a shared cell", () => {
    expect(
      rectanglesOverlap(
        [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
        [{ x: 2, y: 1 }],
      ),
    ).toBe(true);
    expect(rectanglesOverlap([{ x: 1, y: 1 }], [{ x: 2, y: 1 }])).toBe(false);
  });
});
