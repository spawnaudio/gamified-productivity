import { describe, expect, it } from "vitest";
import { dropPlaceAction } from "./boardDrop";

describe("dropPlaceAction", () => {
  it("ignores empty and unknown catalog ids", () => {
    expect(
      dropPlaceAction("", 1, 2, "piece-1", "2026-09-06T10:00:00.000Z"),
    ).toBeNull();
    expect(
      dropPlaceAction("not-a-piece", 1, 2, "piece-1", "2026-09-06T10:00:00.000Z"),
    ).toBeNull();
  });

  it("builds a place action for a known catalog id", () => {
    expect(dropPlaceAction("path", 3, 4, "piece-1", "2026-09-06T10:00:00.000Z")).toEqual({
      type: "place",
      id: "piece-1",
      catalogId: "path",
      x: 3,
      y: 4,
      rotation: 0,
      at: "2026-09-06T10:00:00.000Z",
    });
  });
});
