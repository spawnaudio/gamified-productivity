import type { LayoutMode } from "./rules/types";

export function getLayoutMode(win: { __TAURI_INTERNALS__?: unknown }): LayoutMode {
  return "__TAURI_INTERNALS__" in win && win.__TAURI_INTERNALS__ !== undefined
    ? "home"
    : "companion";
}
