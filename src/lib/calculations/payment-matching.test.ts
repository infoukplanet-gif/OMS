import { describe, it, expect } from "vitest";
import { matchPayments, type ReceiptEntry } from "./payment-matching";
import type { PaymentState } from "../state-machines/payment";

const payment = (overrides: Partial<PaymentState> = {}): PaymentState => ({
  status: "未入金",
  orderTotal: 10000,
  paidAmount: 0,
  overpaid: false,
  ...overrides,
});

describe("matchPayments — basic matching", () => {
  it("records a full payment and reports the transition", () => {
    const payments = new Map([["ORD-1", payment({ orderTotal: 10000, paidAmount: 0 })]]);
    const receipts: ReceiptEntry[] = [{ orderId: "ORD-1", amount: 10000 }];

    const result = matchPayments(receipts, payments);

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].orderId).toBe("ORD-1");
    expect(result.matches[0].amount).toBe(10000);
    expect(result.matches[0].before.status).toBe("未入金");
    expect(result.matches[0].after.status).toBe("入金済み");
    expect(result.unmatched).toHaveLength(0);
  });

  it("matches multiple receipts to different orders independently", () => {
    const payments = new Map([
      ["ORD-1", payment({ orderTotal: 5000 })],
      ["ORD-2", payment({ orderTotal: 8000 })],
    ]);
    const receipts: ReceiptEntry[] = [
      { orderId: "ORD-1", amount: 5000 },
      { orderId: "ORD-2", amount: 8000 },
    ];

    const result = matchPayments(receipts, payments);

    expect(result.matches.map((m) => m.orderId)).toEqual(["ORD-1", "ORD-2"]);
    expect(result.matches.every((m) => m.after.status === "入金済み")).toBe(true);
  });
});

describe("matchPayments — cumulative receipts to the same order", () => {
  it("accumulates receipts for the same orderId so 'before' reflects prior matches", () => {
    const payments = new Map([["ORD-1", payment({ orderTotal: 10000 })]]);
    const receipts: ReceiptEntry[] = [
      { orderId: "ORD-1", amount: 3000 },
      { orderId: "ORD-1", amount: 7000 },
    ];

    const result = matchPayments(receipts, payments);

    expect(result.matches[0].before.paidAmount).toBe(0);
    expect(result.matches[0].after.paidAmount).toBe(3000);
    expect(result.matches[0].after.status).toBe("一部入金");

    expect(result.matches[1].before.paidAmount).toBe(3000);
    expect(result.matches[1].after.paidAmount).toBe(10000);
    expect(result.matches[1].after.status).toBe("入金済み");
  });

  it("flags overpayment by setting after.overpaid = true", () => {
    const payments = new Map([["ORD-1", payment({ orderTotal: 10000 })]]);
    const receipts: ReceiptEntry[] = [{ orderId: "ORD-1", amount: 12000 }];

    const result = matchPayments(receipts, payments);

    expect(result.matches[0].after.overpaid).toBe(true);
    expect(result.matches[0].after.status).toBe("入金済み");
  });
});

describe("matchPayments — unmatched receipts", () => {
  it("reports receipts whose orderId is not in the payments map", () => {
    const payments = new Map([["ORD-1", payment()]]);
    const receipts: ReceiptEntry[] = [{ orderId: "ORD-UNKNOWN", amount: 1000 }];

    const result = matchPayments(receipts, payments);

    expect(result.matches).toHaveLength(0);
    expect(result.unmatched).toEqual([
      { orderId: "ORD-UNKNOWN", amount: 1000, reason: "order-not-found" },
    ]);
  });

  it("reports non-positive amounts as unmatched", () => {
    const payments = new Map([["ORD-1", payment()]]);
    const receipts: ReceiptEntry[] = [
      { orderId: "ORD-1", amount: 0 },
      { orderId: "ORD-1", amount: -500 },
    ];

    const result = matchPayments(receipts, payments);

    expect(result.matches).toHaveLength(0);
    expect(result.unmatched).toEqual([
      { orderId: "ORD-1", amount: 0, reason: "non-positive-amount" },
      { orderId: "ORD-1", amount: -500, reason: "non-positive-amount" },
    ]);
  });

  it("mixes matched and unmatched in one pass", () => {
    const payments = new Map([["ORD-1", payment({ orderTotal: 5000 })]]);
    const receipts: ReceiptEntry[] = [
      { orderId: "ORD-1", amount: 5000 },
      { orderId: "ORD-GHOST", amount: 1000 },
    ];

    const result = matchPayments(receipts, payments);

    expect(result.matches.map((m) => m.orderId)).toEqual(["ORD-1"]);
    expect(result.unmatched.map((u) => u.orderId)).toEqual(["ORD-GHOST"]);
  });
});

describe("matchPayments — purity", () => {
  it("does not mutate the input payments map or its values", () => {
    const original = payment({ orderTotal: 5000 });
    const payments = new Map([["ORD-1", original]]);
    const snapshot = { ...original };

    matchPayments([{ orderId: "ORD-1", amount: 5000 }], payments);

    expect(payments.get("ORD-1")).toBe(original); // map untouched
    expect(original).toEqual(snapshot); // payment untouched
  });
});
