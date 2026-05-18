import { describe, it, expect } from "vitest";
import {
  paymentStatusOf,
  recordPayment,
  cancelPayment,
  paymentStatusBadge,
  PAYMENT_STATUSES,
  type PaymentState,
} from "./payment";

const payment = (overrides: Partial<PaymentState> = {}): PaymentState => ({
  status: "未入金",
  orderTotal: 10000,
  paidAmount: 0,
  overpaid: false,
  ...overrides,
});

describe("PAYMENT_STATUSES", () => {
  it("contains exactly the 3 canonical statuses from the reference material", () => {
    expect(PAYMENT_STATUSES).toEqual(["未入金", "一部入金", "入金済み"]);
  });

  it("provides a badge class for every status", () => {
    for (const status of PAYMENT_STATUSES) {
      expect(paymentStatusBadge[status]).toMatch(/^bg-/);
    }
  });
});

describe("paymentStatusOf", () => {
  it("returns 未入金 when nothing has been paid", () => {
    expect(paymentStatusOf(10000, 0)).toBe("未入金");
  });

  it("returns 未入金 for non-positive paid amounts", () => {
    expect(paymentStatusOf(10000, -500)).toBe("未入金");
  });

  it("returns 一部入金 when paid amount is between zero and the order total", () => {
    expect(paymentStatusOf(10000, 3000)).toBe("一部入金");
  });

  it("returns 入金済み when paid amount exactly matches the order total", () => {
    expect(paymentStatusOf(10000, 10000)).toBe("入金済み");
  });

  it("returns 入金済み when paid amount exceeds the order total (overpayment)", () => {
    expect(paymentStatusOf(10000, 12000)).toBe("入金済み");
  });
});

describe("recordPayment", () => {
  it("moves 未入金 → 一部入金 on a partial payment", () => {
    const after = recordPayment(payment(), 3000);

    expect(after.status).toBe("一部入金");
    expect(after.paidAmount).toBe(3000);
    expect(after.overpaid).toBe(false);
  });

  it("moves 未入金 → 入金済み on a full payment", () => {
    const after = recordPayment(payment(), 10000);

    expect(after.status).toBe("入金済み");
    expect(after.paidAmount).toBe(10000);
    expect(after.overpaid).toBe(false);
  });

  it("accumulates across multiple payments", () => {
    const once = recordPayment(payment(), 4000);
    const twice = recordPayment(once, 6000);

    expect(once.status).toBe("一部入金");
    expect(twice.status).toBe("入金済み");
    expect(twice.paidAmount).toBe(10000);
  });

  it("flags overpaid when the paid amount exceeds the order total", () => {
    const after = recordPayment(payment(), 13000);

    expect(after.status).toBe("入金済み");
    expect(after.overpaid).toBe(true);
  });

  it("never changes the orderTotal", () => {
    const after = recordPayment(payment({ orderTotal: 25000 }), 5000);

    expect(after.orderTotal).toBe(25000);
  });

  it("is a no-op for non-positive amounts (reference identity preserved)", () => {
    const before = payment({ paidAmount: 2000, status: "一部入金" });

    expect(recordPayment(before, 0)).toBe(before);
    expect(recordPayment(before, -1000)).toBe(before);
  });

  it("does not mutate the input", () => {
    const before = payment();
    const snapshot = { ...before };
    recordPayment(before, 5000);

    expect(before).toEqual(snapshot);
  });
});

describe("cancelPayment", () => {
  it("moves 入金済み → 一部入金 on a partial cancellation", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = cancelPayment(before, 4000);

    expect(after.status).toBe("一部入金");
    expect(after.paidAmount).toBe(6000);
  });

  it("moves 入金済み → 未入金 on a full cancellation", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const after = cancelPayment(before, 10000);

    expect(after.status).toBe("未入金");
    expect(after.paidAmount).toBe(0);
  });

  it("clears the overpaid flag once the paid amount drops below the order total", () => {
    const before = payment({ status: "入金済み", paidAmount: 13000, overpaid: true });
    const after = cancelPayment(before, 5000);

    expect(after.paidAmount).toBe(8000);
    expect(after.status).toBe("一部入金");
    expect(after.overpaid).toBe(false);
  });

  it("keeps overpaid true when a partial cancel still leaves an excess", () => {
    const before = payment({ status: "入金済み", paidAmount: 15000, overpaid: true });
    const after = cancelPayment(before, 2000);

    expect(after.paidAmount).toBe(13000);
    expect(after.status).toBe("入金済み");
    expect(after.overpaid).toBe(true);
  });

  it("is a no-op when cancelling more than the paid amount", () => {
    const before = payment({ status: "一部入金", paidAmount: 3000 });

    expect(cancelPayment(before, 5000)).toBe(before);
  });

  it("is a no-op for non-positive amounts (reference identity preserved)", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });

    expect(cancelPayment(before, 0)).toBe(before);
    expect(cancelPayment(before, -2000)).toBe(before);
  });

  it("does not mutate the input", () => {
    const before = payment({ status: "入金済み", paidAmount: 10000 });
    const snapshot = { ...before };
    cancelPayment(before, 3000);

    expect(before).toEqual(snapshot);
  });
});
