import { describe, it, expect } from "vitest";
import { allocateOrder, type AllocationDemand } from "./allocation";
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

const demand = (lines: AllocationDemand["lines"]): AllocationDemand => ({
  orderId: "ORD-1",
  lines,
});

describe("allocateOrder — single warehouse can fully cover", () => {
  it("succeeds when one warehouse has enough free stock", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 3 }]),
      [inv({ sku: "SKU-1", warehouse: "本店", onHand: 10, allocated: 2 })],
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation).toEqual({
        orderId: "ORD-1",
        lines: [{ sku: "SKU-1", warehouse: "本店", qty: 3 }],
      });
    }
  });

  it("uses freeStock (onHand - allocated), not onHand directly", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 4 }]),
      [inv({ sku: "SKU-1", warehouse: "本店", onHand: 10, allocated: 7 })],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.shortages).toEqual([{ sku: "SKU-1", needed: 4, available: 3 }]);
    }
  });
});

describe("allocateOrder — multi-warehouse split (allowMultiWarehouseSplit: true)", () => {
  it("draws from each warehouse in the given order until demand is met", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 7 }]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 4, allocated: 0 }),
        inv({ sku: "SKU-1", warehouse: "倉庫A", onHand: 5, allocated: 0 }),
      ],
      { allowMultiWarehouseSplit: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation.lines).toEqual([
        { sku: "SKU-1", warehouse: "本店", qty: 4 },
        { sku: "SKU-1", warehouse: "倉庫A", qty: 3 },
      ]);
    }
  });

  it("succeeds when split summed across warehouses meets demand", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 6 }]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 3 }),
        inv({ sku: "SKU-1", warehouse: "倉庫A", onHand: 2 }),
        inv({ sku: "SKU-1", warehouse: "倉庫B", onHand: 5 }),
      ],
      { allowMultiWarehouseSplit: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation.lines).toEqual([
        { sku: "SKU-1", warehouse: "本店", qty: 3 },
        { sku: "SKU-1", warehouse: "倉庫A", qty: 2 },
        { sku: "SKU-1", warehouse: "倉庫B", qty: 1 },
      ]);
    }
  });

  it("reports shortage when total across all warehouses is insufficient", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 10 }]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 3 }),
        inv({ sku: "SKU-1", warehouse: "倉庫A", onHand: 4 }),
      ],
      { allowMultiWarehouseSplit: true },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.shortages).toEqual([{ sku: "SKU-1", needed: 10, available: 7 }]);
    }
  });

  it("defaults to multi-warehouse split when options are omitted", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 7 }]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 4 }),
        inv({ sku: "SKU-1", warehouse: "倉庫A", onHand: 3 }),
      ],
    );

    expect(result.ok).toBe(true);
  });
});

describe("allocateOrder — single-warehouse mode (allowMultiWarehouseSplit: false)", () => {
  it("succeeds when at least one warehouse can fully cover demand", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 5 }]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 3 }),
        inv({ sku: "SKU-1", warehouse: "倉庫A", onHand: 8 }),
      ],
      { allowMultiWarehouseSplit: false },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation.lines).toEqual([
        { sku: "SKU-1", warehouse: "倉庫A", qty: 5 },
      ]);
    }
  });

  it("picks the first warehouse that can fully cover (in given order)", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 5 }]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 6 }),
        inv({ sku: "SKU-1", warehouse: "倉庫A", onHand: 10 }),
      ],
      { allowMultiWarehouseSplit: false },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation.lines).toEqual([
        { sku: "SKU-1", warehouse: "本店", qty: 5 },
      ]);
    }
  });

  it("reports shortage when no single warehouse can cover, even if total is enough", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 7 }]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 4 }),
        inv({ sku: "SKU-1", warehouse: "倉庫A", onHand: 5 }),
      ],
      { allowMultiWarehouseSplit: false },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // available reports the largest single-warehouse capacity, not the sum
      expect(result.shortages).toEqual([{ sku: "SKU-1", needed: 7, available: 5 }]);
    }
  });
});

describe("allocateOrder — multi-line orders (all-or-nothing)", () => {
  it("succeeds only when every line can be allocated", () => {
    const result = allocateOrder(
      demand([
        { sku: "SKU-1", qty: 2 },
        { sku: "SKU-2", qty: 3 },
      ]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 10 }),
        inv({ sku: "SKU-2", warehouse: "本店", onHand: 5 }),
      ],
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation.lines).toEqual([
        { sku: "SKU-1", warehouse: "本店", qty: 2 },
        { sku: "SKU-2", warehouse: "本店", qty: 3 },
      ]);
    }
  });

  it("fails the entire order if any line is short, and reports all shortages", () => {
    const result = allocateOrder(
      demand([
        { sku: "SKU-1", qty: 2 },
        { sku: "SKU-2", qty: 5 },
        { sku: "SKU-3", qty: 4 },
      ]),
      [
        inv({ sku: "SKU-1", warehouse: "本店", onHand: 10 }),
        inv({ sku: "SKU-2", warehouse: "本店", onHand: 3 }),
        inv({ sku: "SKU-3", warehouse: "本店", onHand: 1 }),
      ],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.shortages).toEqual([
        { sku: "SKU-2", needed: 5, available: 3 },
        { sku: "SKU-3", needed: 4, available: 1 },
      ]);
    }
  });

  it("reports shortage with available=0 when a SKU has no inventory at all", () => {
    const result = allocateOrder(
      demand([{ sku: "SKU-1", qty: 2 }]),
      [],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.shortages).toEqual([{ sku: "SKU-1", needed: 2, available: 0 }]);
    }
  });
});

describe("allocateOrder — edge cases", () => {
  it("skips lines with qty <= 0 and treats them as already satisfied", () => {
    const result = allocateOrder(
      demand([
        { sku: "SKU-1", qty: 0 },
        { sku: "SKU-2", qty: 3 },
      ]),
      [inv({ sku: "SKU-2", warehouse: "本店", onHand: 5 })],
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation.lines).toEqual([
        { sku: "SKU-2", warehouse: "本店", qty: 3 },
      ]);
    }
  });

  it("does not mutate the input inventory records", () => {
    const records = [inv({ sku: "SKU-1", onHand: 10, allocated: 2 })];
    const snapshot = JSON.parse(JSON.stringify(records));

    allocateOrder(demand([{ sku: "SKU-1", qty: 3 }]), records);

    expect(records).toEqual(snapshot);
  });
});
