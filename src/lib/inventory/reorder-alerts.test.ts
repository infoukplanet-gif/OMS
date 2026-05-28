import { describe, expect, it } from "vitest";
import { extractReorderAlerts } from "./reorder-alerts";
import type { InventoryRecord } from "../state-machines/inventory";

function inv(overrides: Partial<InventoryRecord> = {}): InventoryRecord {
  return {
    sku: "SKU-1",
    warehouse: "本社倉庫",
    onHand: 50,
    allocated: 0,
    constant: 30,
    reorder: 10,
    lot: 10,
    ...overrides,
  };
}

describe("extractReorderAlerts — 発注点割れ在庫の抽出", () => {
  it("適正在庫はアラートに含まれない", () => {
    const result = extractReorderAlerts([inv()]);
    expect(result).toHaveLength(0);
  });

  it("発注点以下（free <= reorder）はアラート対象", () => {
    const result = extractReorderAlerts([inv({ onHand: 10, allocated: 0, reorder: 10, constant: 30, lot: 10 })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sku: "SKU-1",
      warehouse: "本社倉庫",
      currentFree: 10,
      reorderPoint: 10,
      constant: 30,
      suggestedQty: 20, // ceil((30-10)/10)*10
      danger: false,
    });
  });

  it("在庫切れ（onHand=0かつfree<=0）は danger=true", () => {
    const result = extractReorderAlerts([inv({ onHand: 0, allocated: 0, reorder: 10, constant: 30, lot: 10 })]);
    expect(result).toHaveLength(1);
    expect(result[0].danger).toBe(true);
  });

  it("引当により free が reorder を下回るケースも検出（過引当含む）", () => {
    const result = extractReorderAlerts([inv({ onHand: 20, allocated: 15, reorder: 10, constant: 30, lot: 10 })]);
    expect(result).toHaveLength(1);
    expect(result[0].currentFree).toBe(5);
    expect(result[0].suggestedQty).toBe(30); // ceil((30-5)/10)*10
  });

  it("複数件を danger 優先、free の少ない順でソートする", () => {
    const records = [
      inv({ sku: "A", onHand: 8, reorder: 10, constant: 30, lot: 10 }),   // free=8 注意
      inv({ sku: "B", onHand: 0, reorder: 10, constant: 30, lot: 10 }),   // free=0 danger
      inv({ sku: "C", onHand: 5, reorder: 10, constant: 30, lot: 10 }),   // free=5 注意
      inv({ sku: "D", onHand: 50, reorder: 10, constant: 30, lot: 10 }),  // 適正
    ];
    const result = extractReorderAlerts(records);
    expect(result.map((r) => r.sku)).toEqual(["B", "C", "A"]); // danger先頭、その後freeの少ない順
  });

  it("過剰在庫はアラートに含まれない", () => {
    const result = extractReorderAlerts([inv({ onHand: 200, constant: 30, reorder: 10 })]);
    expect(result).toHaveLength(0);
  });
});
