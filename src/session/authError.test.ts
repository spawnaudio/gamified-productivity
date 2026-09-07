import { describe, expect, it } from "vitest";
import { isAuthSessionError } from "./authError";

describe("isAuthSessionError", () => {
  it("is true for HTTP 401", () => {
    expect(isAuthSessionError({ status: 401, message: "Unauthorized" })).toBe(true);
  });

  it("is true when the message mentions JWT or auth", () => {
    expect(isAuthSessionError({ message: "JWT expired" })).toBe(true);
    expect(isAuthSessionError({ message: "invalid jwt" })).toBe(true);
    expect(isAuthSessionError({ message: "Auth session missing" })).toBe(true);
  });

  it("is false for generic network errors", () => {
    expect(isAuthSessionError({ message: "Failed to fetch" })).toBe(false);
    expect(isAuthSessionError(new Error("network"))).toBe(false);
  });
});
