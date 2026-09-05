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
      <div className="town-side">
        <div className="tabs">
          <button
            type="button"
            className={tab === "catalog" ? "active" : ""}
            onClick={() => setTab("catalog")}
          >
            Catalog
          </button>
          <button
            type="button"
            className={tab === "inventory" ? "active" : ""}
            onClick={() => setTab("inventory")}
          >
            Inventory
          </button>
        </div>
        {tab === "catalog" ? (
          <CatalogPanel wallet={state.wallet} sync={sync} dispatch={dispatch} />
        ) : (
          <InventoryPanel inventory={state.inventory} sync={sync} />
        )}
      </div>
    </section>
  );
}
