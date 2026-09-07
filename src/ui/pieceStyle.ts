import { occupiedCells } from "../rules/geometry";
import type { CatalogId, Rotation } from "../rules/types";

export function pieceStyle(
  catalogId: CatalogId,
  x: number,
  y: number,
  rotation: Rotation,
  cellPx: number,
): { left: number; top: number; width: number; height: number } {
  const cells = occupiedCells(catalogId, x, y, rotation);
  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX + 1;
  const height = Math.max(...ys) - minY + 1;
  return {
    left: minX * cellPx,
    top: minY * cellPx,
    width: width * cellPx,
    height: height * cellPx,
  };
}
