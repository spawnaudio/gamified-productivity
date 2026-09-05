import { writesAllowed } from "../rules/writes";
import type { SyncStatus } from "../rules/types";

export function canWrite(sync: SyncStatus): boolean {
  return writesAllowed(sync);
}
