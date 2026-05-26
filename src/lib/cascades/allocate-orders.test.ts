import { describe, expect, it } from "vitest";
import { allocatePendingOrders, type AllocateOrdersDeps } from "./allocate-orders";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createInventoryStore } from "../stores/inventory";
import type { InventoryRecord } from "../state-machines/inventory";
import type { OrderStatus } from "../state-machines/order";

function order(
  id: string,
  status: OrderStatus,
  qty: number,
  inventoryShortage = false,
): OrderRecord {
  return {
    id,
    status,
    inventoryShortage,
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
  it("引当済み（shortageなし）の引当待ちは在庫を触らず印刷待ちへ前進する", () => {
    // 到達時に既に引当済みの想定。inventory.allocated は事前に 2 押さえてある。
    const deps = makeDeps([order("ORD-1", "引当待ち", 2)], [inv(10, 2)]);
    const result = allocatePendingOrders(deps);

    expect(result.processed).toBe(1);
    expect(result.allocated).toBe(1);
    expect(result.shortage).toBe(0);
    expect(deps.orderStore.getState()[0].status).toBe("印刷待ち");
    // 二重引当しない（allocated は 2 のまま）
    expect(deps.inventoryStore.getState()[0].allocated).toBe(2);
  });

  it("在庫不足(shortage)のリトライ成功で在庫を引当て印刷待ちへ進む", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", 2, true)], [inv(10, 0)]);
    const result = allocatePendingOrders(deps);

    expect(result.allocated).toBe(1);
    expect(result.shortage).toBe(0);
    expect(deps.orderStore.getState()[0].status).toBe("印刷待ち");
    expect(deps.inventoryStore.getState()[0].allocated).toBe(2);
  });

  it("在庫不足(shortage)のリトライも失敗なら引当待ちのまま・shortage計上", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", 5, true)], [inv(0, 0)]);
    const result = allocatePendingOrders(deps);

    expect(result.allocated).toBe(0);
    expect(result.shortage).toBe(1);
    expect(deps.orderStore.getState()[0].status).toBe("引当待ち");
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

  it("前進と不足リトライ失敗が混在する場合、それぞれ集計する", () => {
    const deps = makeDeps(
      [order("ORD-1", "引当待ち", 3), order("ORD-2", "引当待ち", 100, true)],
      [inv(5, 3)], // ORD-1 は引当済み前進、ORD-2(shortage,100) は残2で失敗
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
      [inv(10, 2)],
    );
    const result = allocatePendingOrders(deps, { orderIds: ["ORD-2"] });
    expect(result.processed).toBe(1);
    expect(deps.orderStore.getState().find((o) => o.id === "ORD-1")?.status).toBe("引当待ち");
    expect(deps.orderStore.getState().find((o) => o.id === "ORD-2")?.status).toBe("印刷待ち");
  });

  it("対象が無ければ全て 0（冪等：二度目の実行は何もしない）", () => {
    const deps = makeDeps([order("ORD-1", "引当待ち", 2)], [inv(10, 2)]);
    allocatePendingOrders(deps); // 1回目で印刷待ちへ
    const second = allocatePendingOrders(deps); // 2回目は対象なし
    expect(second.processed).toBe(0);
    expect(second.allocated).toBe(0);
  });
});

describe("allocatePendingOrders — 引当ルール反映", () => {
  const rules = (over: Partial<import("../allocation/rules").AllocationRules> = {}) => ({
    warehousePriority: ["本社", "大阪"],
    allowSplit: true,
    orderBy: "受注日昇順" as const,
    ...over,
  });

  it("拠点優先順に従って shortage リトライの引当先倉庫を選ぶ", () => {
    // 同一 SKU が大阪と本社にある。優先は本社。
    const o = { id: "ORD-1", status: "引当待ち", inventoryShortage: true, allocation: [{ sku: "SKU-1", warehouse: "どこか", qty: 2 }] } as unknown as OrderRecord;
    const deps: AllocateOrdersDeps = {
      orderStore: createOrderStore([o]),
      inventoryStore: createInventoryStore([
        { sku: "SKU-1", warehouse: "大阪", onHand: 10, allocated: 0, constant: 0, reorder: 0, lot: 1 },
        { sku: "SKU-1", warehouse: "本社", onHand: 10, allocated: 0, constant: 0, reorder: 0, lot: 1 },
      ]),
    };
    const result = allocatePendingOrders(deps, { rules: rules() });
    expect(result.allocated).toBe(1);
    // 本社（優先）の allocated が増え、大阪は据え置き
    const inv = deps.inventoryStore.getState();
    expect(inv.find((r) => r.warehouse === "本社")?.allocated).toBe(2);
    expect(inv.find((r) => r.warehouse === "大阪")?.allocated).toBe(0);
    // order に確定ラインが書き戻される
    expect((deps.orderStore.getState()[0].allocation as { warehouse: string }[])[0].warehouse).toBe("本社");
  });

  it("orderBy=金額降順: 在庫が競合する時、高額受注が先に引き当てる", () => {
    const small = { id: "SMALL", status: "引当待ち", inventoryShortage: true, amount: 1000, allocation: [{ sku: "SKU-1", warehouse: "x", qty: 2 }] } as unknown as OrderRecord;
    const big = { id: "BIG", status: "引当待ち", inventoryShortage: true, amount: 99000, allocation: [{ sku: "SKU-1", warehouse: "x", qty: 2 }] } as unknown as OrderRecord;
    const deps: AllocateOrdersDeps = {
      orderStore: createOrderStore([small, big]),
      inventoryStore: createInventoryStore([
        { sku: "SKU-1", warehouse: "本社", onHand: 2, allocated: 0, constant: 0, reorder: 0, lot: 1 }, // 2個しかない
      ]),
    };
    const result = allocatePendingOrders(deps, { rules: rules({ orderBy: "金額降順" }) });
    expect(result.allocated).toBe(1);
    expect(result.shortage).toBe(1);
    // 高額の BIG が印刷待ち、SMALL は引当待ちのまま
    expect(deps.orderStore.getState().find((o) => o.id === "BIG")?.status).toBe("印刷待ち");
    expect(deps.orderStore.getState().find((o) => o.id === "SMALL")?.status).toBe("引当待ち");
  });
});
