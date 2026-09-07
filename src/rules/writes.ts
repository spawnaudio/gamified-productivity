import type { SyncStatus } from "./types";

export function writesAllowed(sync: SyncStatus): boolean {
  switch (sync) {
    case "ok":
    case "syncing":
      return true;
    case "offline":
      return false;
    default: {
      const _exhaustive: never = sync;
      return _exhaustive;
    }
  }
}
