import { describe, it, expect } from "vitest";
import { onPaymentTransitioned } from "./payment-handlers";
import type { PaymentState } from "../state-machines/payment";

const payment = (overrides: Partial<PaymentState> = {}): PaymentState => ({
  status: "未入金",
  orderTotal: 10000,
  paidAmount: 0,
  overpaid: false,
  ...overrides,
});

describe("onPaymentTransitioned — 入金済み到達", () => {
  it("returns confirmPayment when payment reaches 入金済み from 未入金", () => {
    const before = payment({ status: "未入金", paidAmount: 0 });
    const after = payment({ status: "入金済み", paidAmount: 10000 });

    const effects = onPaymentTransitioned(before, after, "ORD-1");

    expect(effects.cascadeOrderAction).toEqual({
      orderId: "ORD-1",
      action: "confirmPayment",
    });
  });

  it("returns confirmPayment when payment reaches 入金済み from 一部入金", () => {
    const before = payment({ status: "一部入金", paidAmount: 4000 });
    const after = payment({ status: "入金済み", paidAmount: 10000 });

    const effects = onPaymentTransitioned(before, after, "ORD-2");

    expect(effects.cascadeOrderAction).toEqual({
      orderId: "ORD-2",
      action: "confirmPayment",
    });
  });

  it("does not depend on orderStatus when confirming payment", () => {
    const before = payment({ status: "未入金" });
    const after = payment({ status: "入金済み", paidAmount: 10000 });

    const effects = onPaymentTransitioned(before, after, "ORD-3", {
      orderStatus: "入金待ち",
    });

    expect(effects.cascadeOrderAction?.action).toBe("confirmPayment");
  });
});

describe("onPaymentTransitioned — 入金済みからの巻き戻り", () => {
  it("returns revertToPaymentWait when reverting and the order is still 引当待ち", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = payment({ status: "一部入金", paidAmount: 6000 });

    const effects = onPaymentTransitioned(before, after, "ORD-4", {
      orderStatus: "引当待ち",
    });

    expect(effects.cascadeOrderAction).toEqual({
      orderId: "ORD-4",
      action: "revertToPaymentWait",
    });
  });

  it("returns revertToPaymentWait when reverting fully to 未入金 and the order is 引当待ち", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = payment({ status: "未入金", paidAmount: 0 });

    const effects = onPaymentTransitioned(before, after, "ORD-5", {
      orderStatus: "引当待ち",
    });

    expect(effects.cascadeOrderAction?.action).toBe("revertToPaymentWait");
  });

  it("does not revert when the order has already progressed past 引当待ち", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = payment({ status: "一部入金", paidAmount: 6000 });

    for (const orderStatus of ["印刷待ち", "印刷済み", "出荷済み"] as const) {
      const effects = onPaymentTransitioned(before, after, "ORD-6", { orderStatus });
      expect(effects.cascadeOrderAction).toBeUndefined();
    }
  });

  it("does not revert when orderStatus is not supplied", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = payment({ status: "一部入金", paidAmount: 6000 });

    const effects = onPaymentTransitioned(before, after, "ORD-7");

    expect(effects.cascadeOrderAction).toBeUndefined();
  });
});

describe("onPaymentTransitioned — payment-confirmed mail trigger", () => {
  it("returns sendMail(payment-confirmed) when payment reaches 入金済み from 未入金", () => {
    const before = payment({ status: "未入金" });
    const after = payment({ status: "入金済み", paidAmount: 10000 });

    const effects = onPaymentTransitioned(before, after, "ORD-1");

    expect(effects.sendMail).toEqual({
      orderId: "ORD-1",
      triggerType: "payment-confirmed",
      dedupeKey: "ORD-1:payment-confirmed",
    });
  });

  it("returns sendMail when payment reaches 入金済み from 一部入金", () => {
    const before = payment({ status: "一部入金", paidAmount: 4000 });
    const after = payment({ status: "入金済み", paidAmount: 10000 });

    const effects = onPaymentTransitioned(before, after, "ORD-2");

    expect(effects.sendMail?.triggerType).toBe("payment-confirmed");
  });

  it("does NOT return sendMail when payment was already 入金済み (overpayment etc.)", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = payment({ status: "入金済み", paidAmount: 12000, overpaid: true });

    const effects = onPaymentTransitioned(before, after, "ORD-3");

    expect(effects.sendMail).toBeUndefined();
  });

  it("does NOT return sendMail on revert away from 入金済み", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = payment({ status: "一部入金", paidAmount: 6000 });

    const effects = onPaymentTransitioned(before, after, "ORD-4", {
      orderStatus: "引当待ち",
    });

    expect(effects.sendMail).toBeUndefined();
  });
});

describe("onPaymentTransitioned — 変化なし", () => {
  it("returns no effects when status does not change", () => {
    const before = payment({ status: "一部入金", paidAmount: 3000 });
    const after = payment({ status: "一部入金", paidAmount: 5000 });

    expect(onPaymentTransitioned(before, after, "ORD-8")).toEqual({});
  });

  it("returns no effects when payment stays 入金済み (e.g. overpayment recorded)", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = payment({ status: "入金済み", paidAmount: 12000, overpaid: true });

    expect(onPaymentTransitioned(before, after, "ORD-9")).toEqual({});
  });

  it("returns no effects for a partial payment that stays below the order total", () => {
    const before = payment({ status: "未入金", paidAmount: 0 });
    const after = payment({ status: "一部入金", paidAmount: 4000 });

    expect(onPaymentTransitioned(before, after, "ORD-10")).toEqual({});
  });
});
