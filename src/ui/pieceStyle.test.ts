import { describe, expect, it } from "vitest";
import { pieceStyle } from "./pieceStyle";

describe("pieceStyle", () => {
  it("positions a 2x1 bench using cell size", () => {
    expect(pieceStyle("bench", 3, 4, 0, 40)).toEqual({
      left: 120,
      top: 160,
      width: 80,
      height: 40,
    });
    expect(pieceStyle("bench", 3, 4, 90, 40)).toEqual({
      left: 120,
      top: 160,
      width: 40,
      height: 80,
    });
  });
});
