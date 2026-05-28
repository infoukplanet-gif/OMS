import { describe, expect, it } from "vitest";
import { applyCancelOrderCascade, type CancelOrderDeps } from "./cancel-order";
import { createOrderStore, type OrderRecord } from "../stores/orders";
import { createPaymentStore, type PaymentRecord } from "../stores/payment";
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

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ORD-1",
    status: "印刷待ち",
    inventoryShortage: false,
    allocation: [{ sku: "SKU-1", warehouse: "本社倉庫", qty: 2 }],
    ...overrides,
  } as OrderRecord;
}

function payment(orderTotal: number, paidAmount: number, overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "P-1",
    orderId: "ORD-1",
    status: paymentStatusOf(orderTotal, paidAmount),
    orderTotal,
    paidAmount,
    overpaid: paidAmount > orderTotal,
    ...overrides,
  } as PaymentRecord;
}

function inv(onHand: number, allocated: number): InventoryRecord {
  return { sku: "SKU-1", warehouse: "本社倉庫", onHand, allocated, constant: 0, reorder: 0, lot: 1 };
}

function makeDeps(opts: {
  orders: OrderRecord[];
  payments?: PaymentRecord[];
  inventory?: InventoryRecord[];
  autoMailEnabled?: AutoMailEnabled;
}): CancelOrderDeps {
  return {
    orderStore: createOrderStore(opts.orders),
    paymentStore: createPaymentStore(opts.payments ?? []),
    inventoryStore: createInventoryStore(opts.inventory ?? []),
    mailQueue: createMailQueue(),
    autoMailEnabled: opts.autoMailEnabled ?? ALL_ENABLED,
  };
}

describe("applyCancelOrderCascade — 受注キャンセルの全連鎖", () => {
  it("引当済み・入金ありをキャンセルで引当解放＋全額返金する", () => {
    const deps = makeDeps({
      orders: [order({ status: "印刷待ち" })],
      payments: [payment(32_400, 32_400)],
      inventory: [inv(10, 2)],
    });

    const result = applyCancelOrderCascade("ORD-1", deps);

    expect(result.applied).toBe(true);
    expect(result.released).toBe(1);
    expect(result.refunded).toBe(true);
    expect(result.refundedAmount).toBe(32_400);

    expect(deps.orderStore.getState()[0].status).toBe("キャンセル");
    // 引当解放: allocated が戻る（onHand は据え置き）
    const rec = deps.inventoryStore.getState()[0];
    expect(rec.allocated).toBe(0);
    expect(rec.onHand).toBe(10);
  });

  it("入金ゼロなら返金は発生しない（引当解放のみ）", () => {
    const deps = makeDeps({
      orders: [order({ status: "引当待ち" })],
      payments: [payment(32_400, 0)],
      inventory: [inv(10, 2)],
    });

    const result = applyCancelOrderCascade("ORD-1", deps);

    expect(result.applied).toBe(true);
    expect(result.released).toBe(1);
    expect(result.refunded).toBe(false);
    expect(result.refundedAmount).toBe(0);
  });

  it("一部入金は入金済み分だけ返金する", () => {
    const deps = makeDeps({
      orders: [order({ status: "印刷待ち" })],
      payments: [payment(56_800, 30_000)],
      inventory: [inv(10, 2)],
    });

    const result = applyCancelOrderCascade("ORD-1", deps);

    expect(result.refunded).toBe(true);
    expect(result.refundedAmount).toBe(30_000);
  });

  it("引当前の状態（新規受付）は在庫解放しない", () => {
    const deps = makeDeps({
      orders: [order({ status: "新規受付" })],
      payments: [payment(32_400, 0)],
      inventory: [inv(10, 0)],
    });

    const result = applyCancelOrderCascade("ORD-1", deps);

    expect(result.applied).toBe(true);
    expect(result.released).toBe(0);
  });

  it("既に出荷済みはキャンセル不可（applied=false・連鎖なし）", () => {
    const deps = makeDeps({
      orders: [order({ status: "出荷済み" })],
      payments: [payment(32_400, 32_400)],
      inventory: [inv(8, 0)],
    });

    const result = applyCancelOrderCascade("ORD-1", deps);

    expect(result.applied).toBe(false);
    expect(result.released).toBe(0);
    expect(result.refunded).toBe(false);
    expect(deps.paymentStore.getState()[0].paidAmount).toBe(32_400);
  });

  it("存在しない受注は applied=false", () => {
    const deps = makeDeps({ orders: [order()] });
    expect(applyCancelOrderCascade("ORD-NOPE", deps).applied).toBe(false);
  });
});
