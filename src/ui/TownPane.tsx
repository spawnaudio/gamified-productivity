import { useState } from "react";
import type { Action, AppState, SyncStatus } from "../rules/types";
import { Board } from "./Board";
import { CatalogPanel } from "./CatalogPanel";
import { InventoryPanel } from "./InventoryPanel";

export function TownPane({
  state,
  sync,
  dispatch,
}: {
  state: AppState;
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  const [tab, setTab] = useState<"catalog" | "inventory">("catalog");
  return (
    <section className="town-pane">
      <Board pieces={state.board} sync={sync} dispatch={dispatch} />
      <div>
        <button type="button" onClick={() => setTab("catalog")}>
          Catalog
        </button>
        <button type="button" onClick={() => setTab("inventory")}>
          Inventory
        </button>
        {tab === "catalog" ? (
          <CatalogPanel wallet={state.wallet} sync={sync} dispatch={dispatch} />
        ) : (
          <InventoryPanel inventory={state.inventory} sync={sync} />
        )}
      </div>
    </section>
  );
}
