import type { InventoryItem, SyncStatus } from "../rules/types";
import { getCatalogItem } from "../catalog";
import { canWrite } from "./canWrite";

export function InventoryPanel({
  inventory,
  sync,
}: {
  inventory: InventoryItem[];
  sync: SyncStatus;
}) {
  const locked = !canWrite(sync);
  return (
    <ul>
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
