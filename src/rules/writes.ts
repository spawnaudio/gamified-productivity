import type { SyncStatus } from "./types";

export function writesAllowed(sync: SyncStatus): boolean {
  return sync === "ok";
}
