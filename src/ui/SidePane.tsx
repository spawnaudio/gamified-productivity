import { useState } from "react";
import type { Action, AppState, SyncStatus } from "../rules/types";
import { CatalogPanel } from "./CatalogPanel";
import { InventoryPanel } from "./InventoryPanel";
import { WorkPane } from "./WorkPane";

export function SidePane({
  state,
  sync,
  dispatch,
  showShop,
}: {
  state: AppState;
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
  showShop: boolean;
}) {
  const [tab, setTab] = useState<"catalog" | "inventory">("catalog");
  let shop = null;
  if (showShop) {
    switch (tab) {
      case "catalog":
        shop = <CatalogPanel wallet={state.wallet} sync={sync} dispatch={dispatch} />;
        break;
      case "inventory":
        shop = <InventoryPanel inventory={state.inventory} sync={sync} />;
        break;
      default: {
        const _exhaustive: never = tab;
        return _exhaustive;
      }
    }
  }
  return (
    <aside className="side-pane">
      {showShop ? (
        <div>
          <button type="button" onClick={() => setTab("catalog")}>
            Catalog
          </button>
          <button type="button" onClick={() => setTab("inventory")}>
            Inventory
          </button>
          {shop}
        </div>
      ) : null}
      <WorkPane state={state} sync={sync} dispatch={dispatch} />
    </aside>
  );
}
