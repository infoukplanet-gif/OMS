import { describe, expect, it } from "vitest";
import { planOrderAllocation } from "./plan";
import type { AllocationRules } from "./rules";
import type { InventoryRecord } from "../state-machines/inventory";

const rules = (over: Partial<AllocationRules> = {}): AllocationRules => ({
  warehousePriority: ["本社", "大阪", "九州"],
  allowSplit: true,
  orderBy: "受注日昇順",
  ...over,
});

function inv(sku: string, warehouse: string, onHand: number, allocated = 0): InventoryRecord {
  return { sku, warehouse, onHand, allocated, constant: 0, reorder: 0, lot: 1 };
}

describe("planOrderAllocation — 倉庫優先順", () => {
  it("優先順位の高い倉庫から引き当てる", () => {
    const result = planOrderAllocation(
      "ORD-1",
      [{ sku: "SKU-1", warehouse: "どこでも", qty: 2 }],
      [inv("SKU-1", "大阪", 10), inv("SKU-1", "本社", 10)],
      rules(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      // 本社が優先（priority[0]）なので本社から取る
      expect(result.allocation.lines).toEqual([{ sku: "SKU-1", warehouse: "本社", qty: 2 }]);
    }
  });

  it("優先リストにない倉庫は後回し", () => {
    const result = planOrderAllocation(
      "ORD-1",
      [{ sku: "SKU-1", warehouse: "x", qty: 1 }],
      [inv("SKU-1", "謎倉庫", 10), inv("SKU-1", "九州", 10)],
      rules(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.allocation.lines[0].warehouse).toBe("九州");
  });
});

describe("planOrderAllocation — 分割可否", () => {
  it("allowSplit=true: 優先順に複数倉庫から合計で充足", () => {
    const result = planOrderAllocation(
      "ORD-1",
      [{ sku: "SKU-1", warehouse: "x", qty: 5 }],
      [inv("SKU-1", "本社", 3), inv("SKU-1", "大阪", 4)],
      rules({ allowSplit: true }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocation.lines).toEqual([
        { sku: "SKU-1", warehouse: "本社", qty: 3 },
        { sku: "SKU-1", warehouse: "大阪", qty: 2 },
      ]);
    }
  });

  it("allowSplit=false: 単一倉庫で full-cover できないと不足", () => {
    const result = planOrderAllocation(
      "ORD-1",
      [{ sku: "SKU-1", warehouse: "x", qty: 5 }],
      [inv("SKU-1", "本社", 3), inv("SKU-1", "大阪", 4)],
      rules({ allowSplit: false }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.shortages[0].sku).toBe("SKU-1");
  });

  it("allowSplit=false: full-cover できる倉庫があれば単一倉庫で引当", () => {
    const result = planOrderAllocation(
      "ORD-1",
      [{ sku: "SKU-1", warehouse: "x", qty: 4 }],
      [inv("SKU-1", "本社", 3), inv("SKU-1", "大阪", 5)],
      rules({ allowSplit: false }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.allocation.lines).toEqual([{ sku: "SKU-1", warehouse: "大阪", qty: 4 }]);
  });
});

describe("planOrderAllocation — 需要集約と在庫不足", () => {
  it("同一SKUの複数明細を集約してから引当てる", () => {
    const result = planOrderAllocation(
      "ORD-1",
      [
        { sku: "SKU-1", warehouse: "a", qty: 1 },
        { sku: "SKU-1", warehouse: "b", qty: 2 },
      ],
      [inv("SKU-1", "本社", 10)],
      rules(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.allocation.lines).toEqual([{ sku: "SKU-1", warehouse: "本社", qty: 3 }]);
  });

  it("在庫が全く足りなければ shortage（available は全倉庫合計）", () => {
    const result = planOrderAllocation(
      "ORD-1",
      [{ sku: "SKU-1", warehouse: "x", qty: 10 }],
      [inv("SKU-1", "本社", 2), inv("SKU-1", "大阪", 3)],
      rules({ allowSplit: true }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.shortages[0]).toEqual({ sku: "SKU-1", needed: 10, available: 5 });
    }
  });
});
