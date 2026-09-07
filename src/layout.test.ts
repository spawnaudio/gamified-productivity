import { describe, expect, it } from "vitest";
import { getLayoutMode } from "./layout";

describe("getLayoutMode", () => {
  it("is home when Tauri internals exist, otherwise companion", () => {
    expect(getLayoutMode({})).toBe("companion");
    expect(getLayoutMode({ __TAURI_INTERNALS__: {} })).toBe("home");
  });
});
