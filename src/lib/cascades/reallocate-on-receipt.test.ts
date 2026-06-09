import { describe, expect, it } from "vitest";
import { reallocateOnReceipt } from "./reallocate-on-receipt";
import type { AllocateOrdersDeps } from "./allocate-orders";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createInventoryStore } from "../stores/inventory";
import type { AllocationLine, InventoryRecord } from "../state-machines/inventory";
import type { OrderStatus } from "../state-machines/order";

function order(
  id: string,
  status: OrderStatus,
  sku: string,
  qty: number,
  inventoryShortage = false,
): OrderRecord {
  return {
    id,
    status,
    inventoryShortage,
    allocation: [{ sku, warehouse: "本社倉庫", qty }],
  } as OrderRecord;
}

function inv(sku: string, onHand: number, allocated = 0): InventoryRecord {
  return { sku, warehouse: "本社倉庫", onHand, allocated, constant: 0, reorder: 0, lot: 1 };
}

function makeDeps(orders: OrderRecord[], inventory: InventoryRecord[]): AllocateOrdersDeps {
  return {
    orderStore: createOrderStore(orders),
    inventoryStore: createInventoryStore(inventory),
  };
}

function received(sku: string, qty: number): AllocationLine[] {
  return [{ sku, warehouse: "本社倉庫", qty }];
}

describe("reallocateOnReceipt — 入荷→欠品受注の自動再引当", () => {
  it("入荷SKUで欠品していた受注を再引当し印刷待ちへ前進させる", () => {
    // SKU-1 を欠品（shortage）で引当待ちに滞留。入荷で onHand が 5 になった想定。
    const deps = makeDeps([order("ORD-1", "引当待ち", "SKU-1", 2, true)], [inv("SKU-1", 5, 0)]);
    const result = reallocateOnReceipt(deps, received("SKU-1", 5));

    expect(result.processed).toBe(1);
    expect(result.allocated).toBe(1);
    expect(result.shortage).toBe(0);
    expect(deps.orderStore.getState()[0].status).toBe("印刷待ち");
    expect(deps.inventoryStore.getState()[0].allocated).toBe(2);
  });

  it("入荷SKUに無関係な欠品受注は対象にしない（スコープ=入荷SKU関連のみ）", () => {
    // SKU-2 が入荷したが、欠品しているのは SKU-1 の受注 → 触らない
    const deps = makeDeps(
      [order("ORD-1", "引当待ち", "SKU-1", 2, true)],
      [inv("SKU-1", 0, 0), inv("SKU-2", 5, 0)],
    );
    const result = reallocateOnReceipt(deps, received("SKU-2", 5));

    expect(result.processed).toBe(0);
    expect(result.allocated).toBe(0);
    expect(deps.orderStore.getState()[0].status).toBe("引当待ち");
  });

  it("入荷しても在庫がまだ足りなければ引当待ちのまま・shortage計上", () => {
    // 需要 10 に対し入荷後 onHand は 3 だけ → リトライ失敗
    const deps = makeDeps([order("ORD-1", "引当待ち", "SKU-1", 10, true)], [inv("SKU-1", 3, 0)]);
    const result = reallocateOnReceipt(deps, received("SKU-1", 3));

    expect(result.allocated).toBe(0);
    expect(result.shortage).toBe(1);
    expect(deps.orderStore.getState()[0].status).toBe("引当待ち");
  });

  it("shortage=false の引当待ち（引当済みで前進待ち）は入荷では動かさない", () => {
    // 既に引当済みで前進を待つだけの受注は、入荷イベントの責務外（手動バッチの役割）
    const deps = makeDeps([order("ORD-1", "引当待ち", "SKU-1", 2, false)], [inv("SKU-1", 10, 2)]);
    const result = reallocateOnReceipt(deps, received("SKU-1", 5));

    expect(result.processed).toBe(0);
    expect(deps.orderStore.getState()[0].status).toBe("引当待ち");
  });

  it("冪等: 再引当で前進済みの受注は2回目の入荷で再処理されない", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", "SKU-1", 2, true)], [inv("SKU-1", 5, 0)]);
    reallocateOnReceipt(deps, received("SKU-1", 5));
    const second = reallocateOnReceipt(deps, received("SKU-1", 5));

    expect(second.processed).toBe(0);
    expect(second.allocated).toBe(0);
    expect(deps.orderStore.getState()[0].status).toBe("印刷待ち");
  });

  it("空の入荷明細は no-op", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", "SKU-1", 2, true)], [inv("SKU-1", 5, 0)]);
    const result = reallocateOnReceipt(deps, []);

    expect(result).toEqual({ processed: 0, allocated: 0, shortage: 0 });
    expect(deps.orderStore.getState()[0].status).toBe("引当待ち");
  });

  it("複数欠品受注のうち入荷SKUに関係するものだけ再引当する", () => {
    const deps = makeDeps(
      [
        order("ORD-1", "引当待ち", "SKU-1", 2, true),
        order("ORD-2", "引当待ち", "SKU-2", 2, true),
        order("ORD-3", "引当待ち", "SKU-1", 3, true),
      ],
      [inv("SKU-1", 5, 0), inv("SKU-2", 0, 0)],
    );
    const result = reallocateOnReceipt(deps, received("SKU-1", 5));

    expect(result.processed).toBe(2); // ORD-1, ORD-3
    expect(result.allocated).toBe(2);
    const byId = Object.fromEntries(deps.orderStore.getState().map((o) => [o.id, o.status]));
    expect(byId["ORD-1"]).toBe("印刷待ち");
    expect(byId["ORD-3"]).toBe("印刷待ち");
    expect(byId["ORD-2"]).toBe("引当待ち"); // 無関係
  });
});
