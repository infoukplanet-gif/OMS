import { describe, it, expect } from "vitest";
import {
  recommendReorderQty,
  reorderSuggestions,
  type ReorderSuggestion,
} from "./reorder-calculation";
import type { InventoryRecord } from "../state-machines/inventory";

const inv = (overrides: Partial<InventoryRecord> = {}): InventoryRecord => ({
  sku: "SKU-1",
  warehouse: "本店",
  onHand: 10,
  allocated: 0,
  constant: 20,
  reorder: 5,
  lot: 10,
  ...overrides,
});

describe("recommendReorderQty — lot-rounded refill to constant", () => {
  it("returns 0 when freeStock is above the reorder point", () => {
    expect(recommendReorderQty(inv({ onHand: 20, allocated: 0, reorder: 5 }))).toBe(0);
  });

  it("rounds up to the nearest lot multiple to reach constant", () => {
    // free = 2, reorder = 5 (trigger) , constant = 20, lot = 10 → ceil(18/10)*10 = 20
    expect(
      recommendReorderQty(inv({ onHand: 2, allocated: 0, reorder: 5, constant: 20, lot: 10 })),
    ).toBe(20);
  });

  it("returns one lot when the gap is exactly one lot", () => {
    // free = 10, reorder = 12, constant = 20, lot = 10 → ceil(10/10)*10 = 10
    expect(
      recommendReorderQty(inv({ onHand: 10, allocated: 0, reorder: 12, constant: 20, lot: 10 })),
    ).toBe(10);
  });

  it("returns one lot when the gap is less than one lot but trigger is hit", () => {
    // free = 4, reorder = 5, constant = 10, lot = 10 → ceil(6/10)*10 = 10
    expect(
      recommendReorderQty(inv({ onHand: 4, allocated: 0, reorder: 5, constant: 10, lot: 10 })),
    ).toBe(10);
  });

  it("treats allocated stock as not available (uses freeStock, not onHand)", () => {
    // onHand = 12, allocated = 10 → free = 2 → triggers reorder
    expect(
      recommendReorderQty(inv({ onHand: 12, allocated: 10, reorder: 5, constant: 20, lot: 10 })),
    ).toBe(20);
  });

  it("returns 0 when constant equals or is below freeStock (no gap to fill)", () => {
    // free = 8, reorder = 10 → triggers, but constant = 8 → no gap
    expect(
      recommendReorderQty(inv({ onHand: 8, allocated: 0, reorder: 10, constant: 8, lot: 5 })),
    ).toBe(0);
  });

  it("handles over-allocated stock (negative freeStock) by ordering enough to recover and refill", () => {
    // onHand = 5, allocated = 8 → free = -3, reorder = 5, constant = 20, lot = 10
    // gap = 20 - (-3) = 23 → ceil(23/10)*10 = 30
    expect(
      recommendReorderQty(inv({ onHand: 5, allocated: 8, reorder: 5, constant: 20, lot: 10 })),
    ).toBe(30);
  });

  it("falls back to gap qty (no lot rounding) when lot <= 0", () => {
    // free = 2, reorder = 5, constant = 12, lot = 0 → fallback = 12 - 2 = 10
    expect(
      recommendReorderQty(inv({ onHand: 2, allocated: 0, reorder: 5, constant: 12, lot: 0 })),
    ).toBe(10);
  });
});

describe("reorderSuggestions — multi-record listing", () => {
  it("returns one suggestion per record that needs reordering", () => {
    const records = [
      inv({ sku: "A", warehouse: "本店", onHand: 2, allocated: 0, reorder: 5, constant: 20, lot: 10 }),
      inv({ sku: "B", warehouse: "本店", onHand: 30, allocated: 0, reorder: 5, constant: 20, lot: 10 }), // 在庫充足
      inv({ sku: "C", warehouse: "倉庫A", onHand: 4, allocated: 0, reorder: 5, constant: 30, lot: 10 }),
    ];

    const suggestions = reorderSuggestions(records);

    const expected: ReorderSuggestion[] = [
      { sku: "A", warehouse: "本店", currentFree: 2, suggestedQty: 20 },
      { sku: "C", warehouse: "倉庫A", currentFree: 4, suggestedQty: 30 },
    ];
    expect(suggestions).toEqual(expected);
  });

  it("returns an empty array when no record needs reordering", () => {
    const records = [
      inv({ sku: "A", onHand: 30, allocated: 0, reorder: 5, constant: 20 }),
      inv({ sku: "B", onHand: 50, allocated: 0, reorder: 10, constant: 30 }),
    ];

    expect(reorderSuggestions(records)).toEqual([]);
  });

  it("does not mutate the input records", () => {
    const records = [inv({ onHand: 2, allocated: 0, reorder: 5, constant: 20, lot: 10 })];
    const snapshot = JSON.parse(JSON.stringify(records));

    reorderSuggestions(records);

    expect(records).toEqual(snapshot);
  });
});
