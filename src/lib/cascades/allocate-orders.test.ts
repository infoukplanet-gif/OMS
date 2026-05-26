import { describe, expect, it } from "vitest";
import { allocatePendingOrders, type AllocateOrdersDeps } from "./allocate-orders";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createInventoryStore } from "../stores/inventory";
import type { InventoryRecord } from "../state-machines/inventory";
import type { OrderStatus } from "../state-machines/order";

function order(id: string, status: OrderStatus, qty: number): OrderRecord {
  return {
    id,
    status,
    inventoryShortage: false,
    allocation: [{ sku: "SKU-1", warehouse: "本社倉庫", qty }],
  } as OrderRecord;
}

function inv(onHand: number, allocated = 0): InventoryRecord {
  return { sku: "SKU-1", warehouse: "本社倉庫", onHand, allocated, constant: 0, reorder: 0, lot: 1 };
}

function makeDeps(orders: OrderRecord[], inventory: InventoryRecord[]): AllocateOrdersDeps {
  return {
    orderStore: createOrderStore(orders),
    inventoryStore: createInventoryStore(inventory),
  };
}

describe("allocatePendingOrders — 引当待ち受注の一括引当", () => {
  it("在庫が足りる引当待ちを印刷待ちへ進める", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", 2)], [inv(10)]);
    const result = allocatePendingOrders(deps);

    expect(result.processed).toBe(1);
    expect(result.allocated).toBe(1);
    expect(result.shortage).toBe(0);
    expect(deps.orderStore.getState()[0].status).toBe("印刷待ち");
    expect(deps.inventoryStore.getState()[0].allocated).toBe(2);
  });

  it("在庫不足の引当待ちは markInventoryShortage（引当待ちのまま・バッジ）", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", 5)], [inv(0)]);
    const result = allocatePendingOrders(deps);

    expect(result.allocated).toBe(0);
    expect(result.shortage).toBe(1);
    const o = deps.orderStore.getState()[0];
    expect(o.status).toBe("引当待ち");
    expect(o.inventoryShortage).toBe(true);
  });

  it("引当待ち以外（入金待ち・印刷待ち等）は処理対象にしない", () => {
    const deps = makeDeps(
      [order("ORD-1", "入金待ち", 1), order("ORD-2", "印刷待ち", 1)],
      [inv(10)],
    );
    const result = allocatePendingOrders(deps);
    expect(result.processed).toBe(0);
    expect(result.allocated).toBe(0);
  });

  it("成功と不足が混在する場合、それぞれ集計する", () => {
    const deps = makeDeps(
      [order("ORD-1", "引当待ち", 3), order("ORD-2", "引当待ち", 100)],
      [inv(5)], // ORD-1(3) は通る、残2では ORD-2(100) は不足
    );
    const result = allocatePendingOrders(deps);
    expect(result.processed).toBe(2);
    expect(result.allocated).toBe(1);
    expect(result.shortage).toBe(1);
  });

  it("allocation が空の受注はスキップ（processed に数えない）", () => {
    const empty = { id: "ORD-1", status: "引当待ち", inventoryShortage: false, allocation: [] } as unknown as OrderRecord;
    const deps = makeDeps([empty], [inv(10)]);
    const result = allocatePendingOrders(deps);
    expect(result.processed).toBe(0);
  });

  it("orderIds 指定で対象を限定できる", () => {
    const deps = makeDeps(
      [order("ORD-1", "引当待ち", 1), order("ORD-2", "引当待ち", 1)],
      [inv(10)],
    );
    const result = allocatePendingOrders(deps, { orderIds: ["ORD-2"] });
    expect(result.processed).toBe(1);
    expect(deps.orderStore.getState().find((o) => o.id === "ORD-1")?.status).toBe("引当待ち");
    expect(deps.orderStore.getState().find((o) => o.id === "ORD-2")?.status).toBe("印刷待ち");
  });

  it("対象が無ければ全て 0（冪等：二度目の実行は何もしない）", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", 2)], [inv(10)]);
    allocatePendingOrders(deps); // 1回目で印刷待ちへ
    const second = allocatePendingOrders(deps); // 2回目は対象なし
    expect(second.processed).toBe(0);
    expect(second.allocated).toBe(0);
  });
});
