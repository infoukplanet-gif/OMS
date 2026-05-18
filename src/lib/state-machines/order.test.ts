import { describe, it, expect } from "vitest";
import {
  transitionOrder,
  isCancellable,
  ORDER_STATUSES,
  orderStatusBadge,
  type OrderState,
  type OrderStatus,
} from "./order";

const order = (overrides: Partial<OrderState> = {}): OrderState => ({
  status: "新規受付",
  ...overrides,
});

describe("ORDER_STATUSES", () => {
  it("contains exactly the 9 canonical statuses defined in the PRD", () => {
    expect(ORDER_STATUSES).toEqual([
      "新規受付",
      "確認待ち",
      "発売日時待ち",
      "入金待ち",
      "引当待ち",
      "印刷待ち",
      "印刷済み",
      "出荷済み",
      "キャンセル",
    ]);
  });

  it("provides a badge class for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(orderStatusBadge[status]).toMatch(/^bg-/);
    }
  });
});

describe("transitionOrder — happy paths", () => {
  it("validates 新規受付 → 確認待ち and clears transient fields", () => {
    const before = order({ status: "新規受付", inventoryShortage: true, releaseAt: "2026-06-01T00:00:00Z" });
    const after = transitionOrder(before, "validate");

    expect(after.status).toBe("確認待ち");
    expect(after.inventoryShortage).toBeUndefined();
    expect(after.releaseAt).toBeUndefined();
  });

  it("places 確認待ち on hold with the supplied releaseAt", () => {
    const after = transitionOrder(order({ status: "確認待ち" }), "holdForReleaseDate", {
      releaseAt: "2026-06-15T12:00:00Z",
    });

    expect(after.status).toBe("発売日時待ち");
    expect(after.releaseAt).toBe("2026-06-15T12:00:00Z");
  });

  it("releases from 発売日時待ち back to 確認待ち and clears releaseAt", () => {
    const after = transitionOrder(order({ status: "発売日時待ち", releaseAt: "2026-06-15T12:00:00Z" }), "releaseFromHold");

    expect(after.status).toBe("確認待ち");
    expect(after.releaseAt).toBeUndefined();
  });

  it("walks the manual gate path: 入金待ち → 引当待ち → 印刷待ち → 印刷済み → 出荷済み", () => {
    const path: { from: OrderStatus; action: Parameters<typeof transitionOrder>[1]; to: OrderStatus }[] = [
      { from: "入金待ち", action: "confirmPayment", to: "引当待ち" },
      { from: "引当待ち", action: "allocateInventory", to: "印刷待ち" },
      { from: "印刷待ち", action: "markPrinted", to: "印刷済み" },
      { from: "印刷済み", action: "registerShipment", to: "出荷済み" },
    ];

    for (const step of path) {
      const after = transitionOrder(order({ status: step.from }), step.action);
      expect(after.status).toBe(step.to);
    }
  });
});

describe("transitionOrder — revertToPaymentWait", () => {
  it("reverts 引当待ち → 入金待ち when payment is cancelled", () => {
    const after = transitionOrder(order({ status: "引当待ち" }), "revertToPaymentWait");

    expect(after.status).toBe("入金待ち");
  });

  it("clears inventoryShortage when reverting", () => {
    const before = order({ status: "引当待ち", inventoryShortage: true });
    const after = transitionOrder(before, "revertToPaymentWait");

    expect(after.status).toBe("入金待ち");
    expect(after.inventoryShortage).toBeUndefined();
  });

  it("is a no-op from any status other than 引当待ち", () => {
    for (const status of ORDER_STATUSES) {
      if (status === "引当待ち") continue;
      const before = order({ status });
      expect(transitionOrder(before, "revertToPaymentWait")).toBe(before);
    }
  });
});

describe("transitionOrder — inventory shortage", () => {
  it("flips inventoryShortage on without changing status", () => {
    const before = order({ status: "引当待ち" });
    const after = transitionOrder(before, "markInventoryShortage");

    expect(after.status).toBe("引当待ち");
    expect(after.inventoryShortage).toBe(true);
  });

  it("clears inventoryShortage on retryAllocation", () => {
    const before = order({ status: "引当待ち", inventoryShortage: true });
    const after = transitionOrder(before, "retryAllocation");

    expect(after.status).toBe("引当待ち");
    expect(after.inventoryShortage).toBe(false);
  });
});

describe("transitionOrder — idempotency / guard violations", () => {
  it("returns the same reference when the action is not allowed from the current status", () => {
    const before = order({ status: "出荷済み" });
    const after = transitionOrder(before, "confirmPayment");

    expect(after).toBe(before); // reference identity preserved
  });

  it("returns the same reference when validate fires twice", () => {
    const start = order({ status: "新規受付" });
    const once = transitionOrder(start, "validate");
    const twice = transitionOrder(once, "validate");

    expect(once.status).toBe("確認待ち");
    expect(twice).toBe(once);
  });

  it("never throws for any (status, action) pair", () => {
    const actions: Parameters<typeof transitionOrder>[1][] = [
      "validate",
      "holdForReleaseDate",
      "releaseFromHold",
      "requestPayment",
      "confirmPayment",
      "allocateInventory",
      "markInventoryShortage",
      "retryAllocation",
      "markPrinted",
      "registerShipment",
      "cancel",
      "revertToPaymentWait",
    ];

    for (const status of ORDER_STATUSES) {
      for (const action of actions) {
        expect(() => transitionOrder(order({ status }), action)).not.toThrow();
      }
    }
  });
});

describe("transitionOrder — cancel", () => {
  it("moves cancellable statuses to キャンセル", () => {
    for (const status of ORDER_STATUSES) {
      const after = transitionOrder(order({ status }), "cancel");
      if (isCancellable(status)) {
        expect(after.status).toBe("キャンセル");
      } else {
        expect(after.status).toBe(status); // 出荷済み and キャンセル itself are not cancellable
      }
    }
  });
});

describe("transitionOrder — immutability", () => {
  it("does not mutate the input on a successful transition", () => {
    const before = order({ status: "印刷待ち" });
    const snapshot = { ...before };
    const after = transitionOrder(before, "markPrinted");

    expect(before).toEqual(snapshot);
    expect(after).not.toBe(before);
  });
});

describe("isCancellable", () => {
  it("returns true for every status except 出荷済み and キャンセル", () => {
    const expectedFalse: OrderStatus[] = ["出荷済み", "キャンセル"];

    for (const status of ORDER_STATUSES) {
      expect(isCancellable(status)).toBe(!expectedFalse.includes(status));
    }
  });
});
