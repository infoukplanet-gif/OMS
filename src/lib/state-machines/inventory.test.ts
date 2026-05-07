import { describe, it, expect } from "vitest";
import {
  allocate,
  release,
  consume,
  freeStock,
  inventoryHealth,
  type InventoryRecord,
  type OrderAllocation,
} from "./inventory";

const record = (overrides: Partial<InventoryRecord> = {}): InventoryRecord => ({
  sku: "WEP-001-BK",
  warehouse: "東京本社倉庫",
  onHand: 30,
  allocated: 5,
  constant: 10,
  reorder: 15,
  lot: 10,
  ...overrides,
});

describe("freeStock", () => {
  it("returns onHand minus allocated", () => {
    expect(freeStock(record({ onHand: 30, allocated: 5 }))).toBe(25);
  });

  it("can go to zero", () => {
    expect(freeStock(record({ onHand: 5, allocated: 5 }))).toBe(0);
  });

  it("can be negative when allocated exceeds onHand (over-allocation, surfaced for diagnostics)", () => {
    expect(freeStock(record({ onHand: 3, allocated: 5 }))).toBe(-2);
  });
});

describe("inventoryHealth", () => {
  it("returns 在庫切れ when onHand is 0", () => {
    expect(inventoryHealth(record({ onHand: 0, allocated: 0 }))).toBe("在庫切れ");
  });

  it("returns 在庫切れ when free stock is non-positive and onHand is non-positive", () => {
    expect(inventoryHealth(record({ onHand: 0, allocated: 0, reorder: 15 }))).toBe("在庫切れ");
  });

  it("returns 発注対象 when free stock is at or below the reorder threshold", () => {
    expect(inventoryHealth(record({ onHand: 20, allocated: 5, reorder: 15 }))).toBe("発注対象");
    expect(inventoryHealth(record({ onHand: 17, allocated: 2, reorder: 15 }))).toBe("発注対象");
  });

  it("returns 過剰 when onHand is at least 3x the constant level", () => {
    expect(inventoryHealth(record({ onHand: 100, allocated: 5, constant: 30, reorder: 15 }))).toBe("過剰");
  });

  it("returns 適正 in the normal middle band", () => {
    // free = 20 > reorder = 15 (適正), onHand = 25 < constant*3 = 30 (not 過剰), onHand > 0 (not 在庫切れ)
    expect(inventoryHealth(record({ onHand: 25, allocated: 5, constant: 10, reorder: 15 }))).toBe("適正");
  });

  it("treats 在庫切れ as the highest priority — even if reorder threshold also matches", () => {
    expect(inventoryHealth(record({ onHand: 0, allocated: 0, reorder: 15 }))).toBe("在庫切れ");
  });
});

describe("allocate", () => {
  it("increases allocated when free stock is sufficient", () => {
    const before = record({ onHand: 30, allocated: 5 });
    const after = allocate(before, 10);
    expect(after.allocated).toBe(15);
    expect(after.onHand).toBe(30);
  });

  it("returns the same reference when free stock is insufficient (guard: no-op)", () => {
    const before = record({ onHand: 10, allocated: 8 });
    const after = allocate(before, 5);
    expect(after).toBe(before);
  });

  it("returns the same reference when qty is zero or negative (guard: no-op)", () => {
    const before = record({ onHand: 30, allocated: 5 });
    expect(allocate(before, 0)).toBe(before);
    expect(allocate(before, -3)).toBe(before);
  });

  it("does not mutate the input on success", () => {
    const before = record({ onHand: 30, allocated: 5 });
    const snapshot = { ...before };
    allocate(before, 10);
    expect(before).toEqual(snapshot);
  });
});

describe("release", () => {
  it("decreases allocated when allocated stock is sufficient", () => {
    const before = record({ onHand: 30, allocated: 10 });
    const after = release(before, 4);
    expect(after.allocated).toBe(6);
    expect(after.onHand).toBe(30);
  });

  it("returns the same reference when releasing more than allocated (guard: no-op)", () => {
    const before = record({ onHand: 30, allocated: 5 });
    const after = release(before, 10);
    expect(after).toBe(before);
  });

  it("returns the same reference when qty is zero or negative (guard: no-op)", () => {
    const before = record({ onHand: 30, allocated: 5 });
    expect(release(before, 0)).toBe(before);
    expect(release(before, -1)).toBe(before);
  });

  it("is idempotent — releasing the same allocation twice is safe (second is no-op)", () => {
    const start = record({ onHand: 30, allocated: 4 });
    const once = release(start, 4);
    const twice = release(once, 4);
    expect(once.allocated).toBe(0);
    expect(twice).toBe(once);
  });
});

describe("consume", () => {
  it("decreases both onHand and allocated by qty when both are sufficient", () => {
    const before = record({ onHand: 30, allocated: 10 });
    const after = consume(before, 4);
    expect(after.onHand).toBe(26);
    expect(after.allocated).toBe(6);
  });

  it("returns the same reference when allocated is insufficient (guard: no-op)", () => {
    const before = record({ onHand: 30, allocated: 3 });
    const after = consume(before, 5);
    expect(after).toBe(before);
  });

  it("returns the same reference when onHand is insufficient (guard: no-op)", () => {
    // 物理整合エラー（allocated > onHand）で起きる病的ケース
    const before = record({ onHand: 2, allocated: 5 });
    const after = consume(before, 3);
    expect(after).toBe(before);
  });

  it("returns the same reference when qty is zero or negative (guard: no-op)", () => {
    const before = record({ onHand: 30, allocated: 5 });
    expect(consume(before, 0)).toBe(before);
    expect(consume(before, -2)).toBe(before);
  });
});

describe("type: OrderAllocation", () => {
  it("is exported as a TypeScript type and can be constructed with multi-line allocations", () => {
    const alloc: OrderAllocation = {
      orderId: "ORD-2026-08851",
      lines: [
        { sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 1 },
        { sku: "UCB-002", warehouse: "大阪倉庫", qty: 2 },
      ],
    };
    expect(alloc.lines.length).toBe(2);
    expect(alloc.lines[0].sku).toBe("WEP-001-BK");
  });
});
