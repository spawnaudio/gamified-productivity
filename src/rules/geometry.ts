import { BOARD_HEIGHT, BOARD_WIDTH, getCatalogItem } from "../catalog";
import type { CatalogId, Rotation } from "./types";

export type Cell = { x: number; y: number };

export function occupiedCells(
  catalogId: CatalogId,
  x: number,
  y: number,
  rotation: Rotation,
): Cell[] {
  const { w, h } = getCatalogItem(catalogId).size;
  const swapped = rotation === 90 || rotation === 270;
  const width = swapped ? h : w;
  const height = swapped ? w : h;
  const cells: Cell[] = [];
  for (let dx = 0; dx < width; dx += 1) {
    for (let dy = 0; dy < height; dy += 1) {
      cells.push({ x: x + dx, y: y + dy });
    }
  }
  return cells;
}

export function isOnBoard(cells: Cell[]): boolean {
  return cells.every(
    (cell) =>
      cell.x >= 0 && cell.y >= 0 && cell.x < BOARD_WIDTH && cell.y < BOARD_HEIGHT,
  );
}

export function rectanglesOverlap(a: Cell[], b: Cell[]): boolean {
  const keys = new Set(a.map((cell) => `${cell.x},${cell.y}`));
  return b.some((cell) => keys.has(`${cell.x},${cell.y}`));
}
