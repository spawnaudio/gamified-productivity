import { describe, expect, it } from "vitest";
import { writesAllowed } from "./writes";

describe("writesAllowed", () => {
  it("allows writes only when sync is ok", () => {
    expect(writesAllowed("ok")).toBe(true);
    expect(writesAllowed("syncing")).toBe(false);
    expect(writesAllowed("offline")).toBe(false);
  });
});
