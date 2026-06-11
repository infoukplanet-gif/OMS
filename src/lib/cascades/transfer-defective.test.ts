import { describe, it, expect } from "vitest";
import { executeDefectiveTransfer } from "./transfer-defective";
import { createDefectiveStore } from "../stores/defective";
import { createInventoryStore } from "../stores/inventory";
import type { DefectiveRecord } from "../state-machines/defective";
import type { InventoryRecord } from "../state-machines/inventory";

const inv = (over: Partial<InventoryRecord> = {}): InventoryRecord => ({
  sku: "TS-WH-M",
  warehouse: "九州物流センター",
  onHand: 30,
  allocated: 4,
  constant: 10,
  reorder: 5,
  lot: 1,
  ...over,
});

const rec = (over: Partial<DefectiveRecord> = {}): DefectiveRecord => ({
  id: "DF-001",
  order: "—",
  product: "Tシャツ",
  sku: "TS-WH-M",
  warehouse: "九州物流センター",
  qty: 2,
  reason: "破損",
  route: "返品倉庫",
  source: "manual",
  registeredAt: "2026/06/11 10:00",
  registeredBy: "佐藤 健",
  status: "振替待ち",
  ...over,
});

describe("executeDefectiveTransfer", () => {
  it("振替待ち → 振替完了 にし、良品 onHand を qty 分だけ実減算する（allocated は不変）", () => {
    const defectiveStore = createDefectiveStore([rec()]);
    const inventoryStore = createInventoryStore([inv()]);

    const r = executeDefectiveTransfer(
      { defectiveStore, inventoryStore },
      { id: "DF-001" },
    );

    expect(r.applied).toBe(true);
    expect(r.decremented).toBe(1);
    expect(r.unknownInventory).toBe(false);
    expect(r.qty).toBe(2);
    expect(defectiveStore.getState()[0].status).toBe("振替完了");
    const after = inventoryStore.getState()[0];
    expect(after.onHand).toBe(28);
    expect(after.allocated).toBe(4);
  });

  it("冪等: 既に振替完了なら再実行しても onHand を二重減算しない", () => {
    const defectiveStore = createDefectiveStore([rec({ status: "振替完了" })]);
    const inventoryStore = createInventoryStore([inv()]);

    const r = executeDefectiveTransfer(
      { defectiveStore, inventoryStore },
      { id: "DF-001" },
    );

    expect(r.applied).toBe(false);
    expect(r.decremented).toBe(0);
    expect(inventoryStore.getState()[0].onHand).toBe(30);
  });

  it("承認待ち（未承認）には execute できず在庫も触らない", () => {
    const defectiveStore = createDefectiveStore([rec({ status: "承認待ち" })]);
    const inventoryStore = createInventoryStore([inv()]);

    const r = executeDefectiveTransfer(
      { defectiveStore, inventoryStore },
      { id: "DF-001" },
    );

    expect(r.applied).toBe(false);
    expect(inventoryStore.getState()[0].onHand).toBe(30);
  });

  it("在庫 record にマッチしない (sku,warehouse) は遷移は成立するが unknownInventory=true", () => {
    const defectiveStore = createDefectiveStore([
      rec({ warehouse: "存在しない倉庫" }),
    ]);
    const inventoryStore = createInventoryStore([inv()]);

    const r = executeDefectiveTransfer(
      { defectiveStore, inventoryStore },
      { id: "DF-001" },
    );

    expect(r.applied).toBe(true);
    expect(r.decremented).toBe(0);
    expect(r.unknownInventory).toBe(true);
    expect(defectiveStore.getState()[0].status).toBe("振替完了");
  });

  it("存在しない id は no-op", () => {
    const defectiveStore = createDefectiveStore([rec()]);
    const inventoryStore = createInventoryStore([inv()]);

    const r = executeDefectiveTransfer(
      { defectiveStore, inventoryStore },
      { id: "DF-999" },
    );

    expect(r.applied).toBe(false);
    expect(r.decremented).toBe(0);
    expect(inventoryStore.getState()[0].onHand).toBe(30);
  });
});
