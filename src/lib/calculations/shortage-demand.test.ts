import { describe, it, expect } from "vitest";
import {
  computeShortageDemand,
  buildShortageReorderSuggestions,
  type ShortageOrderInput,
} from "./shortage-demand";
import type { InventoryRecord } from "../state-machines/inventory";

const rec = (overrides: Partial<InventoryRecord> = {}): InventoryRecord => ({
  sku: "SKU-A",
  warehouse: "本店",
  onHand: 3,
  allocated: 0,
  constant: 40,
  reorder: 20,
  lot: 10,
  ...overrides,
});

const order = (overrides: Partial<ShortageOrderInput> = {}): ShortageOrderInput => ({
  status: "引当待ち",
  inventoryShortage: true,
  allocation: [{ sku: "SKU-A", warehouse: "本店", qty: 10 }],
  ...overrides,
});

describe("computeShortageDemand", () => {
  it("returns the unfilled demand (demand − free) for a shortage order", () => {
    const result = computeShortageDemand([order()], [rec({ onHand: 3, allocated: 0 })]);
    expect(result).toEqual([{ sku: "SKU-A", warehouse: "本店", shortQty: 7 }]);
  });

  it("ignores orders that are not 引当待ち even if inventoryShortage is true", () => {
    const result = computeShortageDemand([order({ status: "印刷待ち" })], [rec()]);
    expect(result).toEqual([]);
  });

  it("ignores 引当待ち orders that are not in shortage", () => {
    const result = computeShortageDemand([order({ inventoryShortage: false })], [rec()]);
    expect(result).toEqual([]);
  });

  it("aggregates demand across multiple shortage orders for the same SKU×warehouse", () => {
    const result = computeShortageDemand(
      [order(), order()],
      [rec({ onHand: 3, allocated: 0 })],
    );
    // demand 10 + 10 = 20, free 3 → short 17
    expect(result).toEqual([{ sku: "SKU-A", warehouse: "本店", shortQty: 17 }]);
  });

  it("excludes lines where free stock already covers demand", () => {
    const result = computeShortageDemand([order()], [rec({ onHand: 50, allocated: 0 })]);
    expect(result).toEqual([]);
  });

  it("treats negative free stock (over-allocation) as zero available", () => {
    const result = computeShortageDemand([order()], [rec({ onHand: 2, allocated: 10 })]);
    // free = -8 → treated as 0 → short = full demand 10
    expect(result).toEqual([{ sku: "SKU-A", warehouse: "本店", shortQty: 10 }]);
  });

  it("keeps distinct warehouses as separate lines", () => {
    const result = computeShortageDemand(
      [
        order({ allocation: [{ sku: "SKU-A", warehouse: "本店", qty: 10 }] }),
        order({ allocation: [{ sku: "SKU-A", warehouse: "大阪", qty: 8 }] }),
      ],
      [
        rec({ warehouse: "本店", onHand: 3, allocated: 0 }),
        rec({ warehouse: "大阪", onHand: 1, allocated: 0 }),
      ],
    );
    expect(result).toEqual([
      { sku: "SKU-A", warehouse: "本店", shortQty: 7 },
      { sku: "SKU-A", warehouse: "大阪", shortQty: 7 },
    ]);
  });

  it("skips shortage orders with no allocation demand lines", () => {
    const result = computeShortageDemand([order({ allocation: [] })], [rec()]);
    expect(result).toEqual([]);
  });
});

describe("buildShortageReorderSuggestions", () => {
  it("takes the reorder-point qty when it exceeds the raw shortage (両方併用)", () => {
    // short 7, but reorder-point replenishment to constant 40 from free 3 = 40 lot-rounded
    const result = buildShortageReorderSuggestions(
      [order()],
      [rec({ onHand: 3, allocated: 0, constant: 40, reorder: 20, lot: 10 })],
    );
    expect(result).toEqual([
      { sku: "SKU-A", warehouse: "本店", currentFree: 3, suggestedQty: 40 },
    ]);
  });

  it("takes the raw shortage when it exceeds the reorder-point qty (両方併用)", () => {
    // demand 60 vs small reorder replenishment
    const result = buildShortageReorderSuggestions(
      [order({ allocation: [{ sku: "SKU-A", warehouse: "本店", qty: 60 }] })],
      [rec({ onHand: 3, allocated: 0, constant: 40, reorder: 20, lot: 10 })],
    );
    // short = 60 - 3 = 57; reorder qty = 40 → max = 57
    expect(result).toEqual([
      { sku: "SKU-A", warehouse: "本店", currentFree: 3, suggestedQty: 57 },
    ]);
  });

  it("falls back to the raw shortage when no inventory record exists", () => {
    const result = buildShortageReorderSuggestions(
      [order({ allocation: [{ sku: "SKU-Z", warehouse: "本店", qty: 5 }] })],
      [],
    );
    expect(result).toEqual([
      { sku: "SKU-Z", warehouse: "本店", currentFree: 0, suggestedQty: 5 },
    ]);
  });

  it("returns an empty list when there is no shortage", () => {
    const result = buildShortageReorderSuggestions([], [rec()]);
    expect(result).toEqual([]);
  });
});
