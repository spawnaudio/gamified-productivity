import { describe, expect, it } from "vitest";
import { canWrite } from "./canWrite";

describe("canWrite", () => {
  it("stays writable during a routine refetch, and locks only when offline", () => {
    expect(canWrite("ok")).toBe(true);
    expect(canWrite("syncing")).toBe(true);
    expect(canWrite("offline")).toBe(false);
  });
});
