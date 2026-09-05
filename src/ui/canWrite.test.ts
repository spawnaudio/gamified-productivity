import { describe, expect, it } from "vitest";
import { canWrite } from "./canWrite";

describe("canWrite", () => {
  it("is false unless sync is ok", () => {
    expect(canWrite("ok")).toBe(true);
    expect(canWrite("offline")).toBe(false);
    expect(canWrite("syncing")).toBe(false);
  });
});
