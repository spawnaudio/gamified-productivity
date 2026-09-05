import type { CatalogId, CatalogItem } from "./rules/types";

export const WORK_CREDIT = 1;
export const BOARD_WIDTH = 16;
export const BOARD_HEIGHT = 12;
export const CELL_PX = 40;

export const CATALOG: Record<CatalogId, CatalogItem> = {
  well: { id: "well", name: "Well", price: null, size: { w: 1, h: 1 } },
  path: { id: "path", name: "Path tile", price: 1, size: { w: 1, h: 1 } },
  flowerbox: { id: "flowerbox", name: "Flower box", price: 2, size: { w: 1, h: 1 } },
  bench: { id: "bench", name: "Bench", price: 3, size: { w: 2, h: 1 } },
  lamp: { id: "lamp", name: "Lamp post", price: 3, size: { w: 1, h: 1 } },
  tree: { id: "tree", name: "Tree", price: 4, size: { w: 1, h: 1 } },
  garden: { id: "garden", name: "Garden plot", price: 6, size: { w: 2, h: 2 } },
  cottage: { id: "cottage", name: "Cottage", price: 8, size: { w: 2, h: 2 } },
  workshop: { id: "workshop", name: "Workshop", price: 10, size: { w: 2, h: 2 } },
  library: { id: "library", name: "Library", price: 12, size: { w: 2, h: 2 } },
};

export function getCatalogItem(id: CatalogId): CatalogItem {
  return CATALOG[id];
}
