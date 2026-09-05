import { CATALOG } from "../catalog";
import type { Action, SyncStatus } from "../rules/types";
import { canWrite } from "./canWrite";

export function CatalogPanel({
  wallet,
  sync,
  dispatch,
}: {
  wallet: number;
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  const locked = !canWrite(sync);
  return (
    <ul className="catalog">
      {Object.values(CATALOG)
        .filter((item) => item.price !== null)
        .map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={locked || wallet < (item.price ?? 0)}
              onClick={() =>
                void dispatch({
                  type: "buy",
                  id: crypto.randomUUID(),
                  catalogId: item.id,
                  at: new Date().toISOString(),
                })
              }
            >
              {item.name} — {item.price}
            </button>
          </li>
        ))}
    </ul>
  );
}
