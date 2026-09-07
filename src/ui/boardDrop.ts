import { parseCatalogId } from "../catalog";
import type { Action } from "../rules/types";

export function dropPlaceAction(
  rawId: string,
  x: number,
  y: number,
  pieceId: string,
  at: string,
): Extract<Action, { type: "place" }> | null {
  const catalogId = parseCatalogId(rawId);
  if (catalogId === undefined) return null;
  return {
    type: "place",
    id: pieceId,
    catalogId,
    x,
    y,
    rotation: 0,
    at,
  };
}
