import { describe, it, expect } from "vitest";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createInventoryStore } from "../stores/inventory";
import { createPurchaseStore, type PurchaseOrderRecord } from "../stores/purchase";
import { runReorderOnShortage } from "./reorder-on-shortage";
import type { ReorderMasterMaps } from "../calculations/reorder-to-po";
import type { InventoryRecord } from "../state-machines/inventory";

const maps: ReorderMasterMaps = {
  supplier: { "SKU-A": "株式会社ABC電子" },
  unitCost: { "SKU-A": 500 },
};

const opts = { maps, today: "2026-07-15", year: 2026 };

const shortageOrder = (id: string, qty = 10): OrderRecord =>
  ({
    id,
    status: "引当待ち",
    inventoryShortage: true,
    allocation: [{ sku: "SKU-A", warehouse: "本店", qty }],
  }) as unknown as OrderRecord;

const invRec = (overrides: Partial<InventoryRecord> = {}): InventoryRecord => ({
  sku: "SKU-A",
  warehouse: "本店",
  onHand: 3,
  allocated: 0,
  constant: 40,
  reorder: 20,
  lot: 10,
  ...overrides,
});

const draftPo = (overrides: Partial<PurchaseOrderRecord> = {}): PurchaseOrderRecord =>
  ({
    id: "PO-2026-0001",
    supplier: "株式会社ABC電子",
    status: "未発行",
    lines: [{ sku: "SKU-A", warehouse: "本店", orderedQty: 10, receivedQty: 0 }],
    items: 10,
    amount: 5000,
    date: "2026-07-01",
    expected: "—",
    daysToArrive: 0,
    ...overrides,
  }) as unknown as PurchaseOrderRecord;

describe("runReorderOnShortage", () => {
  it("creates a 未発行 PO covering the shortage when none exists for the supplier", () => {
    const orderStore = createOrderStore([shortageOrder("ORD-1")]);
    const inventoryStore = createInventoryStore([invRec()]);
    const purchaseStore = createPurchaseStore([]);

    const result = runReorderOnShortage({ orderStore, inventoryStore, purchaseStore }, opts);

    expect(result.shortageSkus).toBe(1);
    expect(result.created).toBe(1);
    expect(result.merged).toBe(0);
    const pos = purchaseStore.getState();
    expect(pos).toHaveLength(1);
    expect(pos[0].status).toBe("未発行");
    // reorder-point replenishment (constant 40 from free 3 → 40) beats raw shortage (7)
    expect((pos[0].lines as { orderedQty: number }[])[0].orderedQty).toBe(40);
  });

  it("merges into an existing 未発行 PO instead of duplicating", () => {
    const orderStore = createOrderStore([shortageOrder("ORD-1", 100)]);
    const inventoryStore = createInventoryStore([invRec({ onHand: 3 })]);
    const purchaseStore = createPurchaseStore([draftPo()]);

    const result = runReorderOnShortage({ orderStore, inventoryStore, purchaseStore }, opts);

    expect(result.created).toBe(0);
    expect(result.merged).toBe(1);
    const pos = purchaseStore.getState();
    expect(pos).toHaveLength(1);
    // raw shortage 100 - 3 = 97 beats reorder qty 40 → max = 97
    expect((pos[0].lines as { orderedQty: number }[])[0].orderedQty).toBe(97);
  });

  it("is a no-op when there are no shortage orders", () => {
    const orderStore = createOrderStore([
      { id: "ORD-1", status: "引当待ち", inventoryShortage: false } as unknown as OrderRecord,
    ]);
    const inventoryStore = createInventoryStore([invRec()]);
    const purchaseStore = createPurchaseStore([]);

    const result = runReorderOnShortage({ orderStore, inventoryStore, purchaseStore }, opts);

    expect(result).toEqual({ shortageSkus: 0, created: 0, merged: 0, totalQty: 0 });
    expect(purchaseStore.getState()).toHaveLength(0);
  });

  it("is idempotent: a second run makes no further changes", () => {
    const orderStore = createOrderStore([shortageOrder("ORD-1")]);
    const inventoryStore = createInventoryStore([invRec()]);
    const purchaseStore = createPurchaseStore([]);

    runReorderOnShortage({ orderStore, inventoryStore, purchaseStore }, opts);
    const second = runReorderOnShortage({ orderStore, inventoryStore, purchaseStore }, opts);

    expect(second.created).toBe(0);
    expect(second.merged).toBe(0);
    expect(purchaseStore.getState()).toHaveLength(1);
  });

  it("reports the total suggested quantity", () => {
    const orderStore = createOrderStore([shortageOrder("ORD-1")]);
    const inventoryStore = createInventoryStore([invRec()]);
    const purchaseStore = createPurchaseStore([]);

    const result = runReorderOnShortage({ orderStore, inventoryStore, purchaseStore }, opts);
    expect(result.totalQty).toBe(40);
  });
});
