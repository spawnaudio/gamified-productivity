import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyState } from "./rules/state";
import type { LayoutMode } from "./rules/types";

const town = {
  session: { user: { id: "u1" } },
  state: emptyState(),
  sync: "ok" as const,
  layout: "home" as LayoutMode,
  error: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  dispatch: vi.fn(),
  reload: vi.fn(),
};

vi.mock("./session/useTownSession", () => ({
  useTownSession: () => town,
}));

afterEach(() => {
  cleanup();
  town.layout = "home";
});

describe("App home layout", () => {
  it("puts catalog in the side column and collapses to a single map column", async () => {
    const { App } = await import("./App");
    const user = userEvent.setup();
    render(<App />);

    const catalog = screen.getByRole("button", { name: "Catalog" });
    expect(catalog.closest(".side-pane")).not.toBeNull();
    expect(catalog.closest(".town-pane")).toBeNull();
    expect(document.querySelector("main")?.className).toBe("home");

    await user.click(screen.getByRole("button", { name: "Hide work" }));

    expect(screen.queryByRole("button", { name: "Catalog" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hide work" })).toBeNull();
    expect(screen.getByRole("button", { name: "Show work" })).toBeTruthy();
    expect(document.querySelector("main")?.className).toBe("home home--map-only");
    expect(document.querySelector(".town-pane")).not.toBeNull();
    expect(document.querySelector(".side-pane")).toBeNull();
  });
});
