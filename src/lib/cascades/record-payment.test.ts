import { describe, expect, it } from "vitest";
import { applyRecordPaymentCascade, type RecordPaymentDeps } from "./record-payment";
import { createPaymentStore, type PaymentRecord } from "../stores/payment";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createShipmentStore } from "../stores/shipment";
import { createInventoryStore } from "../stores/inventory";
import { createMailQueue, type AutoMailEnabled } from "../mail/queue";
import { paymentStatusOf } from "../state-machines/payment";
import type { InventoryRecord } from "../state-machines/inventory";

const ALL_ENABLED: AutoMailEnabled = {
  thanks: true,
  "ship-notify": true,
  "payment-confirmed": true,
  "payment-reminder-3d": true,
  "payment-final-call-7d": true,
  "follow-up": true,
};

function payment(orderId: string, orderTotal: number, paidAmount: number): PaymentRecord {
  return {
    id: `PAY-${orderId}`,
    orderId,
    orderTotal,
    paidAmount,
    status: paymentStatusOf(orderTotal, paidAmount),
    overpaid: paidAmount > orderTotal,
  };
}

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ORD-1",
    status: "入金待ち",
    inventoryShortage: false,
    allocation: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2 }],
    customer: "テスト顧客",
    items: 2,
    amount: 10000,
    ...overrides,
  } as OrderRecord;
}

function inv(onHand: number, allocated = 0): InventoryRecord {
  return { sku: "SKU-1", warehouse: "本社倉庫", onHand, allocated, constant: 0, reorder: 0, lot: 1 };
}

function makeDeps(opts: {
  payments: PaymentRecord[];
  orders?: OrderRecord[];
  inventory?: InventoryRecord[];
  autoMailEnabled?: AutoMailEnabled;
}): RecordPaymentDeps {
  return {
    paymentStore: createPaymentStore(opts.payments),
    orderStore: createOrderStore(opts.orders ?? []),
    shipmentStore: createShipmentStore([]),
    inventoryStore: createInventoryStore(opts.inventory ?? []),
    mailQueue: createMailQueue(),
    autoMailEnabled: opts.autoMailEnabled ?? ALL_ENABLED,
  };
}

describe("applyRecordPaymentCascade — 完済で受注確定→出荷生成→在庫引当の全連鎖", () => {
  it("全額入金で payment 入金済み・受注確定・出荷指示作成・在庫引当まで連鎖する", () => {
    const deps = makeDeps({
      payments: [payment("ORD-1", 10000, 0)],
      orders: [order()],
      inventory: [inv(10)],
    });

    const result = applyRecordPaymentCascade("PAY-ORD-1", 10000, deps);

    expect(result.applied).toBe(true);
    expect(result.cascadeApplied).toBe(1);
    expect(result.shipmentsCreated).toBe(1);
    expect(result.allocated).toBe(1);
    expect(result.shortageMarked).toBe(0);

    // payment 完済
    expect(deps.paymentStore.getState()[0].status).toBe("入金済み");
    // 受注は confirmPayment で 引当待ち に到達（在庫引当は inventory 側で実施、
    // order の 印刷待ち への前進は別アクション）
    expect(deps.orderStore.getState()[0].status).toBe("引当待ち");
    // 出荷が生成された
    expect(deps.shipmentStore.getState()).toHaveLength(1);
    // 在庫の allocated が加算された
    expect(deps.inventoryStore.getState()[0].allocated).toBe(2);
    // payment-confirmed メールが enqueue された
    expect(result.enqueued).toBeGreaterThan(0);
  });

  it("payment-confirmed が無効化されている場合は enqueue されない", () => {
    const deps = makeDeps({
      payments: [payment("ORD-1", 10000, 0)],
      orders: [order()],
      inventory: [inv(10)],
      autoMailEnabled: { ...ALL_ENABLED, "payment-confirmed": false },
    });

    const result = applyRecordPaymentCascade("PAY-ORD-1", 10000, deps);
    expect(result.enqueued).toBe(0);
    expect(result.disabledSkipped).toBeGreaterThan(0);
  });
});

describe("applyRecordPaymentCascade — 在庫不足", () => {
  it("引当できる在庫が無いと markInventoryShortage が連鎖する", () => {
    const deps = makeDeps({
      payments: [payment("ORD-1", 10000, 0)],
      orders: [order()],
      inventory: [inv(0)], // onHand 0 → 引当不可
    });

    const result = applyRecordPaymentCascade("PAY-ORD-1", 10000, deps);
    expect(result.allocated).toBe(0);
    expect(result.shortageMarked).toBe(1);
    // order は 引当待ち で inventoryShortage バッジが立つ
    const o = deps.orderStore.getState()[0];
    expect(o.status).toBe("引当待ち");
    expect(o.inventoryShortage).toBe(true);
  });
});

describe("applyRecordPaymentCascade — 部分入金・冪等", () => {
  it("一部入金（完済しない）では受注確定は起きない", () => {
    const deps = makeDeps({
      payments: [payment("ORD-1", 10000, 0)],
      orders: [order()],
      inventory: [inv(10)],
    });

    const result = applyRecordPaymentCascade("PAY-ORD-1", 4000, deps);
    expect(result.applied).toBe(true);
    expect(result.cascadeApplied).toBe(0);
    expect(result.shipmentsCreated).toBe(0);
    expect(deps.paymentStore.getState()[0].status).toBe("一部入金");
    expect(deps.orderStore.getState()[0].status).toBe("入金待ち");
  });

  it("amount<=0 は applied=false で連鎖なし", () => {
    const deps = makeDeps({
      payments: [payment("ORD-1", 10000, 0)],
      orders: [order()],
      inventory: [inv(10)],
    });
    const result = applyRecordPaymentCascade("PAY-ORD-1", 0, deps);
    expect(result.applied).toBe(false);
    expect(result.cascadeApplied).toBe(0);
  });

  it("存在しない payment は applied=false", () => {
    const deps = makeDeps({ payments: [payment("ORD-1", 10000, 0)], orders: [order()] });
    expect(applyRecordPaymentCascade("PAY-NOPE", 10000, deps).applied).toBe(false);
  });

  it("入金済みへの追加入金（過剰）では受注確定が再発火せず出荷を重複作成しない", () => {
    const deps = makeDeps({
      payments: [payment("ORD-1", 10000, 10000)],
      orders: [order({ status: "引当待ち" })],
      inventory: [inv(10)],
    });
    const result = applyRecordPaymentCascade("PAY-ORD-1", 5000, deps);
    // paidAmount は増えるので applied=true だが、入金済みへの新規到達ではないので
    // confirmPayment は再発火しない（冪等）
    expect(result.applied).toBe(true);
    expect(result.cascadeApplied).toBe(0);
    expect(deps.shipmentStore.getState()).toHaveLength(0);
    expect(deps.paymentStore.getState()[0].overpaid).toBe(true);
  });
});
