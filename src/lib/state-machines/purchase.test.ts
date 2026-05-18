import { describe, it, expect } from "vitest";
import {
  markConditionsMet,
  markConditionsUnmet,
  issue,
  receivePurchaseOrder,
  cancel,
  totalOrdered,
  totalReceived,
  isFullyReceived,
  purchaseStatusBadge,
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderState,
  type PurchaseOrderLine,
  type ReceiptLine,
} from "./purchase";

const line = (overrides: Partial<PurchaseOrderLine> = {}): PurchaseOrderLine => ({
  sku: "SKU-1",
  warehouse: "本店",
  orderedQty: 10,
  receivedQty: 0,
  ...overrides,
});

const po = (overrides: Partial<PurchaseOrderState> = {}): PurchaseOrderState => ({
  status: "条件未達成",
  lines: [line()],
  ...overrides,
});

describe("PURCHASE_ORDER_STATUSES", () => {
  it("contains the 6 canonical statuses (5 + キャンセル) from the reference material", () => {
    expect(PURCHASE_ORDER_STATUSES).toEqual([
      "条件未達成",
      "未発行",
      "発行済",
      "注残あり",
      "仕入完了",
      "キャンセル",
    ]);
  });

  it("provides a badge class for every status", () => {
    for (const status of PURCHASE_ORDER_STATUSES) {
      expect(purchaseStatusBadge[status]).toMatch(/^bg-/);
    }
  });
});

describe("markConditionsMet / markConditionsUnmet", () => {
  it("moves 条件未達成 → 未発行", () => {
    const after = markConditionsMet(po({ status: "条件未達成" }));
    expect(after.status).toBe("未発行");
  });

  it("is a no-op from any status other than 条件未達成", () => {
    for (const status of PURCHASE_ORDER_STATUSES) {
      if (status === "条件未達成") continue;
      const before = po({ status });
      expect(markConditionsMet(before)).toBe(before);
    }
  });

  it("moves 未発行 → 条件未達成 with markConditionsUnmet", () => {
    const after = markConditionsUnmet(po({ status: "未発行" }));
    expect(after.status).toBe("条件未達成");
  });

  it("markConditionsUnmet is a no-op from any status other than 未発行", () => {
    for (const status of PURCHASE_ORDER_STATUSES) {
      if (status === "未発行") continue;
      const before = po({ status });
      expect(markConditionsUnmet(before)).toBe(before);
    }
  });
});

describe("issue", () => {
  it("moves 未発行 → 発行済", () => {
    const after = issue(po({ status: "未発行" }));
    expect(after.status).toBe("発行済");
  });

  it("is a no-op from any status other than 未発行", () => {
    for (const status of PURCHASE_ORDER_STATUSES) {
      if (status === "未発行") continue;
      const before = po({ status });
      expect(issue(before)).toBe(before);
    }
  });
});

describe("receivePurchaseOrder — partial / full receipt", () => {
  it("moves 発行済 → 注残あり on a partial receipt", () => {
    const before = po({ status: "発行済", lines: [line({ orderedQty: 10, receivedQty: 0 })] });
    const receipts: ReceiptLine[] = [{ sku: "SKU-1", warehouse: "本店", qty: 4 }];
    const after = receivePurchaseOrder(before, receipts);

    expect(after.status).toBe("注残あり");
    expect(after.lines[0].receivedQty).toBe(4);
  });

  it("moves 発行済 → 仕入完了 when the full quantity is received at once", () => {
    const before = po({ status: "発行済", lines: [line({ orderedQty: 10, receivedQty: 0 })] });
    const after = receivePurchaseOrder(before, [{ sku: "SKU-1", warehouse: "本店", qty: 10 }]);

    expect(after.status).toBe("仕入完了");
    expect(after.lines[0].receivedQty).toBe(10);
  });

  it("moves 注残あり → 仕入完了 when the remaining quantity is received", () => {
    const before = po({
      status: "注残あり",
      lines: [line({ orderedQty: 10, receivedQty: 4 })],
    });
    const after = receivePurchaseOrder(before, [{ sku: "SKU-1", warehouse: "本店", qty: 6 }]);

    expect(after.status).toBe("仕入完了");
    expect(after.lines[0].receivedQty).toBe(10);
  });

  it("stays in 注残あり on successive partial receipts", () => {
    const start = po({ status: "発行済", lines: [line({ orderedQty: 10, receivedQty: 0 })] });
    const once = receivePurchaseOrder(start, [{ sku: "SKU-1", warehouse: "本店", qty: 3 }]);
    const twice = receivePurchaseOrder(once, [{ sku: "SKU-1", warehouse: "本店", qty: 4 }]);

    expect(twice.status).toBe("注残あり");
    expect(twice.lines[0].receivedQty).toBe(7);
  });

  it("counts a multi-line PO as 仕入完了 only when every line is fully received", () => {
    const before = po({
      status: "発行済",
      lines: [
        line({ sku: "SKU-1", orderedQty: 10, receivedQty: 0 }),
        line({ sku: "SKU-2", orderedQty: 5, receivedQty: 0 }),
      ],
    });
    const partial = receivePurchaseOrder(before, [
      { sku: "SKU-1", warehouse: "本店", qty: 10 },
    ]);
    expect(partial.status).toBe("注残あり");

    const full = receivePurchaseOrder(partial, [
      { sku: "SKU-2", warehouse: "本店", qty: 5 },
    ]);
    expect(full.status).toBe("仕入完了");
  });

  it("accepts over-delivery without capping the received quantity", () => {
    const before = po({ status: "発行済", lines: [line({ orderedQty: 10, receivedQty: 0 })] });
    const after = receivePurchaseOrder(before, [{ sku: "SKU-1", warehouse: "本店", qty: 12 }]);

    expect(after.status).toBe("仕入完了");
    expect(after.lines[0].receivedQty).toBe(12);
  });
});

describe("receivePurchaseOrder — guards and no-ops", () => {
  it("is a no-op when status is not 発行済 / 注残あり", () => {
    for (const status of PURCHASE_ORDER_STATUSES) {
      if (status === "発行済" || status === "注残あり") continue;
      const before = po({ status, lines: [line()] });
      expect(receivePurchaseOrder(before, [{ sku: "SKU-1", warehouse: "本店", qty: 3 }])).toBe(before);
    }
  });

  it("is a no-op when no receipt has a positive quantity", () => {
    const before = po({ status: "発行済", lines: [line()] });

    expect(receivePurchaseOrder(before, [])).toBe(before);
    expect(receivePurchaseOrder(before, [{ sku: "SKU-1", warehouse: "本店", qty: 0 }])).toBe(before);
    expect(receivePurchaseOrder(before, [{ sku: "SKU-1", warehouse: "本店", qty: -2 }])).toBe(before);
  });

  it("ignores receipts whose (sku, warehouse) does not match any line", () => {
    const before = po({ status: "発行済", lines: [line({ sku: "SKU-1", warehouse: "本店" })] });
    const after = receivePurchaseOrder(before, [{ sku: "UNKNOWN", warehouse: "本店", qty: 5 }]);

    expect(after).toBe(before); // nothing matched, reference identity preserved
  });

  it("does not mutate the input", () => {
    const before = po({ status: "発行済", lines: [line()] });
    const snapshot = JSON.parse(JSON.stringify(before));
    receivePurchaseOrder(before, [{ sku: "SKU-1", warehouse: "本店", qty: 3 }]);

    expect(before).toEqual(snapshot);
  });
});

describe("cancel", () => {
  it("moves cancellable statuses to キャンセル", () => {
    for (const status of ["条件未達成", "未発行", "発行済", "注残あり"] as const) {
      const after = cancel(po({ status }));
      expect(after.status).toBe("キャンセル");
    }
  });

  it("is a no-op from 仕入完了 or キャンセル", () => {
    for (const status of ["仕入完了", "キャンセル"] as const) {
      const before = po({ status });
      expect(cancel(before)).toBe(before);
    }
  });
});

describe("derived helpers", () => {
  it("totalOrdered sums the orderedQty across lines", () => {
    const subject = po({
      lines: [
        line({ sku: "A", orderedQty: 10 }),
        line({ sku: "B", orderedQty: 7 }),
      ],
    });

    expect(totalOrdered(subject)).toBe(17);
  });

  it("totalReceived sums the receivedQty across lines", () => {
    const subject = po({
      lines: [
        line({ sku: "A", orderedQty: 10, receivedQty: 4 }),
        line({ sku: "B", orderedQty: 7, receivedQty: 7 }),
      ],
    });

    expect(totalReceived(subject)).toBe(11);
  });

  it("isFullyReceived is true only when every line is fully received", () => {
    expect(isFullyReceived(po({ lines: [line({ orderedQty: 10, receivedQty: 10 })] }))).toBe(true);
    expect(isFullyReceived(po({ lines: [line({ orderedQty: 10, receivedQty: 9 })] }))).toBe(false);
    expect(isFullyReceived(po({ lines: [
      line({ sku: "A", orderedQty: 10, receivedQty: 10 }),
      line({ sku: "B", orderedQty: 5, receivedQty: 3 }),
    ] }))).toBe(false);
  });
});
