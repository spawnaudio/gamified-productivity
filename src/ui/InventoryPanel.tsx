import { getCatalogItem } from "../catalog";
import type { InventoryItem, SyncStatus } from "../rules/types";
import { canWrite } from "./canWrite";

export function InventoryPanel({
  inventory,
  sync,
}: {
  inventory: InventoryItem[];
  sync: SyncStatus;
}) {
  const locked = !canWrite(sync);
  if (inventory.length === 0) {
    return <p className="empty">Buy a piece, then drag it onto the board.</p>;
  }
  return (
    <ul className="inventory">
      {inventory.map((item) => (
        <li
          key={item.catalogId}
          draggable={!locked}
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", item.catalogId);
          }}
        >
          {getCatalogItem(item.catalogId).name} × {item.count}
        </li>
      ))}
    </ul>
  );
}
