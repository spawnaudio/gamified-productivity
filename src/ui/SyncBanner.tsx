import type { SyncStatus } from "../rules/types";

export function SyncBanner({ sync }: { sync: SyncStatus }) {
  if (sync === "ok") return <p className="sync">Synced</p>;
  if (sync === "syncing") return <p className="sync">Syncing…</p>;
  return (
    <p className="sync" role="alert">
      Can't sync right now.
    </p>
  );
}
