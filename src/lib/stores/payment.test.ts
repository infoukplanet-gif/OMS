import { describe, it, expect, beforeEach } from "vitest";
import {
  createPaymentStore,
  type PaymentRecord,
  type PaymentStore,
} from "./payment";

const rec = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
  id: "P-001",
  orderId: "ORD-001",
  status: "未入金",
  orderTotal: 10000,
  paidAmount: 0,
  overpaid: false,
  ...overrides,
});

describe("createPaymentStore — getState / setItems", () => {
  it("starts empty by default", () => {
    const store = createPaymentStore();
    expect(store.getState()).toEqual([]);
  });

  it("accepts an initial seed", () => {
    const store = createPaymentStore([rec(), rec({ id: "P-002" })]);
    expect(store.getState()).toHaveLength(2);
  });

  it("setItems replaces the list and notifies subscribers", () => {
    const store = createPaymentStore([rec()]);
    let calls = 0;
    store.subscribe(() => calls++);
    store.setItems([rec({ id: "X" })]);
    expect(store.getState().map((p) => p.id)).toEqual(["X"]);
    expect(calls).toBe(1);
  });
});

describe("createPaymentStore — applyRecord", () => {
  let store: PaymentStore;
  beforeEach(() => {
    store = createPaymentStore([
      rec({ id: "P-A", orderTotal: 10000, paidAmount: 0 }),
      rec({ id: "P-B", orderTotal: 5000, paidAmount: 3000, status: "一部入金" }),
      rec({ id: "P-C", orderTotal: 5000, paidAmount: 5000, status: "入金済み" }),
    ]);
  });

  it("records a partial payment and updates derived status", () => {
    const result = store.applyRecord("P-A", 4000);
    expect(result.applied).toBe(true);
    expect(result.after?.paidAmount).toBe(4000);
    expect(result.after?.status).toBe("一部入金");
    expect(result.effects.cascadeOrderAction).toBeUndefined();
  });

  it("records a full payment, emits cascadeOrderAction(confirmPayment) + sendMail", () => {
    const result = store.applyRecord("P-A", 10000);
    expect(result.applied).toBe(true);
    expect(result.after?.status).toBe("入金済み");
    expect(result.effects.cascadeOrderAction).toEqual({
      orderId: "ORD-001",
      action: "confirmPayment",
    });
    expect(result.effects.sendMail?.triggerType).toBe("payment-confirmed");
  });

  it("partial→full: completing an existing partial payment also emits cascade", () => {
    const result = store.applyRecord("P-B", 2000);
    expect(result.after?.status).toBe("入金済み");
    expect(result.effects.cascadeOrderAction?.action).toBe("confirmPayment");
  });

  it("does NOT emit cascade when already 入金済み (no-status-change)", () => {
    const result = store.applyRecord("P-C", 500);
    expect(result.applied).toBe(true);
    expect(result.after?.overpaid).toBe(true);
    expect(result.effects.cascadeOrderAction).toBeUndefined();
    expect(result.effects.sendMail).toBeUndefined();
  });

  it("returns applied=false when amount <= 0 (SM no-op)", () => {
    const result = store.applyRecord("P-A", 0);
    expect(result.applied).toBe(false);
  });

  it("returns applied=false when id is unknown", () => {
    const result = store.applyRecord("MISSING", 100);
    expect(result.applied).toBe(false);
  });

  it("notifies subscribers only when the SM actually moved", () => {
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyRecord("P-A", 0); // no-op
    expect(calls).toBe(0);
    store.applyRecord("P-A", 1000);
    expect(calls).toBe(1);
  });
});

describe("createPaymentStore — applyCancel (revert cascade)", () => {
  let store: PaymentStore;
  beforeEach(() => {
    store = createPaymentStore([
      rec({ id: "P-A", orderTotal: 10000, paidAmount: 10000, status: "入金済み" }),
      rec({ id: "P-B", orderTotal: 5000, paidAmount: 3000, status: "一部入金" }),
    ]);
  });

  it("cancels a payment and emits revert cascade when order is still 引当待ち", () => {
    const result = store.applyCancel("P-A", 10000, { orderStatus: "引当待ち" });
    expect(result.applied).toBe(true);
    expect(result.after?.paidAmount).toBe(0);
    expect(result.after?.status).toBe("未入金");
    expect(result.effects.cascadeOrderAction).toEqual({
      orderId: "ORD-001",
      action: "revertToPaymentWait",
    });
  });

  it("does NOT emit revert cascade when order is already past 引当待ち (e.g. 印刷待ち)", () => {
    const result = store.applyCancel("P-A", 10000, { orderStatus: "印刷待ち" });
    expect(result.applied).toBe(true);
    expect(result.effects.cascadeOrderAction).toBeUndefined();
  });

  it("returns applied=false when amount > paidAmount (SM guard)", () => {
    const result = store.applyCancel("P-A", 99999);
    expect(result.applied).toBe(false);
  });

  it("returns applied=false when id is unknown", () => {
    const result = store.applyCancel("MISSING", 100);
    expect(result.applied).toBe(false);
  });
});

describe("createPaymentStore — immutability", () => {
  it("getState returns a stable reference until mutation", () => {
    const store = createPaymentStore([rec()]);
    expect(store.getState()).toBe(store.getState());
  });

  it("getState returns a new reference after applyRecord", () => {
    const store = createPaymentStore([rec()]);
    const before = store.getState();
    store.applyRecord("P-001", 1000);
    expect(store.getState()).not.toBe(before);
  });
});
