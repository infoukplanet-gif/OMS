import { describe, it, expect } from "vitest";
import { recognizePayableOnReceipt } from "./recognize-payable";
import { createPayableStore } from "../stores/payable";
import type { PurchaseOrderState } from "../state-machines/purchase";

const po = (orderedQty: number, receivedQty: number): PurchaseOrderState => ({
  status: "発行済",
  lines: [{ sku: "SKU-1", warehouse: "東京本社倉庫", orderedQty, receivedQty }],
});

describe("recognizePayableOnReceipt", () => {
  it("入荷分だけ按分計上し、store に1行積む", () => {
    const payableStore = createPayableStore();
    const result = recognizePayableOnReceipt(
      { payableStore },
      {
        poId: "PO-1",
        supplier: "A社",
        poAmount: 100000,
        before: po(10, 0),
        after: po(10, 4),
        accruedAt: "2026/06/09",
      },
    );
    expect(result.accrued).toBe(40000);
    expect(result.applied).toBe(true);
    expect(payableStore.getState()).toHaveLength(1);
    expect(payableStore.getState()[0]).toMatchObject({
      poId: "PO-1",
      supplier: "A社",
      amount: 40000,
      cumulativeReceived: 4,
    });
  });

  it("受領が進んでいなければ計上しない", () => {
    const payableStore = createPayableStore();
    const result = recognizePayableOnReceipt(
      { payableStore },
      { poId: "PO-1", supplier: "A社", poAmount: 100000, before: po(10, 5), after: po(10, 5), accruedAt: "2026/06/09" },
    );
    expect(result.accrued).toBe(0);
    expect(result.applied).toBe(false);
    expect(payableStore.getState()).toHaveLength(0);
  });

  it("同一累計受領の再実行は冪等（二重計上しない）", () => {
    const payableStore = createPayableStore();
    const args = {
      poId: "PO-1",
      supplier: "A社",
      poAmount: 100000,
      before: po(10, 0),
      after: po(10, 4),
      accruedAt: "2026/06/09",
    };
    recognizePayableOnReceipt({ payableStore }, args);
    const second = recognizePayableOnReceipt({ payableStore }, args);
    expect(second.accrued).toBe(0);
    expect(second.applied).toBe(false);
    expect(payableStore.getState()).toHaveLength(1);
  });

  it("最終入荷で端数を true-up し累計が PO 総額に一致する", () => {
    const payableStore = createPayableStore();
    const first = recognizePayableOnReceipt(
      { payableStore },
      { poId: "PO-1", supplier: "A社", poAmount: 100000, before: po(7, 0), after: po(7, 3), accruedAt: "2026/06/09" },
    );
    const second = recognizePayableOnReceipt(
      { payableStore },
      { poId: "PO-1", supplier: "A社", poAmount: 100000, before: po(7, 3), after: po(7, 7), accruedAt: "2026/06/10" },
    );
    expect(first.accrued + second.accrued).toBe(100000);
  });
});
