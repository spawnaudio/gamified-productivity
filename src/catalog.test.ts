import { describe, expect, it } from "vitest";
import { CATALOG, getCatalogItem, WORK_CREDIT } from "./catalog";

describe("catalog", () => {
  it("lists every v1 item with price and size", () => {
    expect(WORK_CREDIT).toBe(1);
    expect(getCatalogItem("well").price).toBeNull();
    expect(getCatalogItem("well").size).toEqual({ w: 1, h: 1 });
    expect(getCatalogItem("path").price).toBe(1);
    expect(getCatalogItem("flowerbox").price).toBe(2);
    expect(getCatalogItem("bench")).toEqual(
      expect.objectContaining({ price: 3, size: { w: 2, h: 1 } }),
    );
    expect(getCatalogItem("lamp").price).toBe(3);
    expect(getCatalogItem("tree").price).toBe(4);
    expect(getCatalogItem("garden").price).toBe(6);
    expect(getCatalogItem("cottage")).toEqual(
      expect.objectContaining({ price: 8, size: { w: 2, h: 2 } }),
    );
    expect(getCatalogItem("workshop").price).toBe(10);
    expect(getCatalogItem("library").price).toBe(12);
    expect(Object.keys(CATALOG)).toHaveLength(10);
  });
});
