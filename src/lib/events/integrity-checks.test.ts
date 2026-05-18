import { describe, it, expect } from "vitest";
import {
  checkPaymentDrift,
  checkInventoryOverallocation,
  checkPurchaseDrift,
  checkOrderPaymentConsistency,
  runAllChecks,
  type IntegrityIssue,
} from "./integrity-checks";
import type { PaymentState } from "../state-machines/payment";
import type { InventoryRecord } from "../state-machines/inventory";
import type { PurchaseOrderState } from "../state-machines/purchase";
import type { OrderState } from "../state-machines/order";

const inv = (overrides: Partial<InventoryRecord> = {}): InventoryRecord => ({
  sku: "SKU-1",
  warehouse: "本店",
  onHand: 10,
  allocated: 0,
  constant: 20,
  reorder: 5,
  lot: 10,
  ...overrides,
});

const payment = (
  id: string,
  overrides: Partial<PaymentState> = {},
): [string, PaymentState] => [
  id,
  {
    status: "未入金",
    orderTotal: 10000,
    paidAmount: 0,
    overpaid: false,
    ...overrides,
  },
];

const order = (id: string, overrides: Partial<OrderState> = {}): [string, OrderState] => [
  id,
  {
    status: "新規受付",
    ...overrides,
  },
];

describe("checkPaymentDrift", () => {
  it("returns no issues when stored status matches the derived status", () => {
    const issues = checkPaymentDrift(
      new Map([
        payment("ORD-1", { status: "入金済み", orderTotal: 10000, paidAmount: 10000 }),
        payment("ORD-2", { status: "一部入金", orderTotal: 10000, paidAmount: 4000 }),
        payment("ORD-3", { status: "未入金" }),
      ]),
    );

    expect(issues).toHaveLength(0);
  });

  it("flags payments whose stored status drifts from the derived status", () => {
    const issues = checkPaymentDrift(
      new Map([
        // paid full but still 一部入金
        payment("ORD-1", { status: "一部入金", orderTotal: 10000, paidAmount: 10000 }),
      ]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("payment-status-drift");
    expect(issues[0].entity).toEqual({ domain: "payment", id: "ORD-1" });
    expect(issues[0].severity).toBe("error");
  });

  it("flags payments whose overpaid flag does not match the derived value", () => {
    const issues = checkPaymentDrift(
      new Map([
        // paidAmount > orderTotal but overpaid=false
        payment("ORD-1", { status: "入金済み", orderTotal: 10000, paidAmount: 12000, overpaid: false }),
      ]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("payment-overpaid-drift");
  });
});

describe("checkInventoryOverallocation", () => {
  it("returns no issues when allocated <= onHand for every record", () => {
    const issues = checkInventoryOverallocation([
      inv({ onHand: 10, allocated: 0 }),
      inv({ sku: "SKU-2", onHand: 5, allocated: 5 }),
    ]);

    expect(issues).toHaveLength(0);
  });

  it("flags records where allocated > onHand (physically impossible)", () => {
    const issues = checkInventoryOverallocation([
      inv({ sku: "SKU-1", warehouse: "本店", onHand: 3, allocated: 5 }),
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("inventory-overallocated");
    expect(issues[0].entity).toEqual({ domain: "inventory", id: "SKU-1@本店" });
    expect(issues[0].severity).toBe("error");
    expect(issues[0].detail).toContain("3");
    expect(issues[0].detail).toContain("5");
  });
});

describe("checkPurchaseDrift", () => {
  it("returns no issues when the receiving status matches what receivedQty implies", () => {
    const po1: PurchaseOrderState = {
      status: "発行済",
      lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 0 }],
    };
    const po2: PurchaseOrderState = {
      status: "注残あり",
      lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 5 }],
    };
    const po3: PurchaseOrderState = {
      status: "仕入完了",
      lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 10 }],
    };

    const issues = checkPurchaseDrift(
      new Map([
        ["PO-1", po1],
        ["PO-2", po2],
        ["PO-3", po3],
      ]),
    );

    expect(issues).toHaveLength(0);
  });

  it("skips PO that are not in receiving phase (条件未達成 / 未発行 / キャンセル)", () => {
    const issues = checkPurchaseDrift(
      new Map<string, PurchaseOrderState>([
        ["PO-1", { status: "条件未達成", lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 0 }] }],
        ["PO-2", { status: "未発行", lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 0 }] }],
        ["PO-3", { status: "キャンセル", lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 4 }] }],
      ]),
    );

    expect(issues).toHaveLength(0);
  });

  it("flags receiving-phase POs whose status drifts from derived status", () => {
    const issues = checkPurchaseDrift(
      new Map<string, PurchaseOrderState>([
        // received fully but still marked 注残あり
        ["PO-1", { status: "注残あり", lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 10 }] }],
      ]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("purchase-status-drift");
    expect(issues[0].entity).toEqual({ domain: "purchase", id: "PO-1" });
  });
});

describe("checkOrderPaymentConsistency", () => {
  it("returns no issues when allocated-and-beyond orders all have 入金済み payments", () => {
    const orders = new Map([
      order("ORD-1", { status: "引当待ち" }),
      order("ORD-2", { status: "印刷待ち" }),
      order("ORD-3", { status: "出荷済み" }),
    ]);
    const payments = new Map([
      payment("ORD-1", { status: "入金済み", paidAmount: 10000 }),
      payment("ORD-2", { status: "入金済み", paidAmount: 10000 }),
      payment("ORD-3", { status: "入金済み", paidAmount: 10000 }),
    ]);

    expect(checkOrderPaymentConsistency(orders, payments)).toHaveLength(0);
  });

  it("flags orders past 入金待ち whose payment is not 入金済み", () => {
    const orders = new Map([order("ORD-1", { status: "引当待ち" })]);
    const payments = new Map([payment("ORD-1", { status: "一部入金", paidAmount: 4000 })]);

    const issues = checkOrderPaymentConsistency(orders, payments);

    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("order-payment-mismatch");
    expect(issues[0].entity).toEqual({ domain: "order", id: "ORD-1" });
  });

  it("does not flag orders still in 入金待ち or earlier", () => {
    const orders = new Map([
      order("ORD-1", { status: "新規受付" }),
      order("ORD-2", { status: "入金待ち" }),
      order("ORD-3", { status: "確認待ち" }),
    ]);
    const payments = new Map([
      payment("ORD-1", { status: "未入金" }),
      payment("ORD-2", { status: "一部入金", paidAmount: 4000 }),
      payment("ORD-3", { status: "未入金" }),
    ]);

    expect(checkOrderPaymentConsistency(orders, payments)).toHaveLength(0);
  });

  it("does not flag cancelled orders even if no payment exists", () => {
    const orders = new Map([order("ORD-1", { status: "キャンセル" })]);
    const payments = new Map<string, PaymentState>();

    expect(checkOrderPaymentConsistency(orders, payments)).toHaveLength(0);
  });

  it("flags orders past 入金待ち that have no payment record at all", () => {
    const orders = new Map([order("ORD-1", { status: "引当待ち" })]);
    const payments = new Map<string, PaymentState>();

    const issues = checkOrderPaymentConsistency(orders, payments);

    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("order-payment-missing");
  });
});

describe("runAllChecks", () => {
  it("aggregates issues from every check", () => {
    const issues = runAllChecks({
      payments: new Map([
        payment("ORD-1", { status: "一部入金", orderTotal: 10000, paidAmount: 10000 }), // drift
      ]),
      inventory: [inv({ sku: "SKU-1", onHand: 3, allocated: 5 })], // overallocated
      purchases: new Map<string, PurchaseOrderState>([
        ["PO-1", { status: "注残あり", lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 10 }] }], // drift
      ]),
      orders: new Map([order("ORD-1", { status: "引当待ち" })]),
    });

    const kinds = issues.map((i: IntegrityIssue) => i.kind);
    expect(kinds).toContain("payment-status-drift");
    expect(kinds).toContain("inventory-overallocated");
    expect(kinds).toContain("purchase-status-drift");
  });

  it("returns an empty array when everything is consistent", () => {
    const issues = runAllChecks({
      payments: new Map([payment("ORD-1", { status: "入金済み", paidAmount: 10000 })]),
      inventory: [inv({ onHand: 10, allocated: 3 })],
      purchases: new Map<string, PurchaseOrderState>([
        ["PO-1", { status: "発行済", lines: [{ sku: "A", warehouse: "本店", orderedQty: 10, receivedQty: 0 }] }],
      ]),
      orders: new Map([order("ORD-1", { status: "引当待ち" })]),
    });

    expect(issues).toEqual([]);
  });
});
