import { describe, expect, it } from "vitest";
import { writesAllowed } from "./writes";

describe("writesAllowed", () => {
  it("allows writes when ok or syncing, and blocks only when offline", () => {
    expect(writesAllowed("ok")).toBe(true);
    expect(writesAllowed("syncing")).toBe(true);
    expect(writesAllowed("offline")).toBe(false);
  });
});
