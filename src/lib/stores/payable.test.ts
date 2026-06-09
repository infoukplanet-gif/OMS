import { describe, it, expect } from "vitest";
import { createPayableStore } from "./payable";

describe("createPayableStore - 計上（accrual）", () => {
  it("入荷の都度、買掛金を1行ずつ積む", () => {
    const store = createPayableStore();
    const r = store.recognize({
      poId: "PO-1",
      supplier: "A社",
      amount: 40000,
      cumulativeReceived: 4,
      accruedAt: "2026/06/09",
    });
    expect(r).toEqual({ applied: true, duplicate: false });
    expect(store.getState()).toHaveLength(1);
  });

  it("同一 (poId, cumulativeReceived) は二重計上しない（冪等）", () => {
    const store = createPayableStore();
    const entry = {
      poId: "PO-1",
      supplier: "A社",
      amount: 40000,
      cumulativeReceived: 4,
      accruedAt: "2026/06/09",
    };
    expect(store.recognize(entry).applied).toBe(true);
    const second = store.recognize(entry);
    expect(second).toEqual({ applied: false, duplicate: true });
    expect(store.getState()).toHaveLength(1);
  });

  it("同一 PO でも累計受領が進めば別計上として積む", () => {
    const store = createPayableStore();
    store.recognize({ poId: "PO-1", supplier: "A社", amount: 40000, cumulativeReceived: 4, accruedAt: "2026/06/09" });
    const second = store.recognize({ poId: "PO-1", supplier: "A社", amount: 60000, cumulativeReceived: 10, accruedAt: "2026/06/10" });
    expect(second.applied).toBe(true);
    expect(store.getState()).toHaveLength(2);
  });

  it("計上時のみ通知する（重複 recognize は通知しない）", () => {
    const store = createPayableStore();
    let count = 0;
    store.subscribe(() => count++);
    const entry = { poId: "PO-1", supplier: "A社", amount: 40000, cumulativeReceived: 4, accruedAt: "2026/06/09" };
    store.recognize(entry);
    store.recognize(entry);
    expect(count).toBe(1);
  });
});

describe("createPayableStore - 支払（payment）", () => {
  it("手動支払を記録し通知する", () => {
    const store = createPayableStore();
    let count = 0;
    store.subscribe(() => count++);
    store.recordPayment({ poId: "PO-1", amount: 30000, paidAt: "2026/06/09" });
    expect(store.getPayments()).toHaveLength(1);
    expect(count).toBe(1);
  });

  it("同一 PO へ複数回の支払を積める（按分入金）", () => {
    const store = createPayableStore();
    store.recordPayment({ poId: "PO-1", amount: 30000, paidAt: "2026/06/09" });
    store.recordPayment({ poId: "PO-1", amount: 20000, paidAt: "2026/06/10" });
    expect(store.getPayments()).toHaveLength(2);
  });
});

describe("createPayableStore - 初期化", () => {
  it("setItems / setPayments で台帳全体を置換し通知する", () => {
    const store = createPayableStore();
    let count = 0;
    store.subscribe(() => count++);
    store.setItems([{ poId: "PO-9", supplier: "Z社", amount: 1000, cumulativeReceived: 1, accruedAt: "2026/06/01" }]);
    store.setPayments([{ poId: "PO-9", amount: 500, paidAt: "2026/06/02" }]);
    expect(store.getState()).toHaveLength(1);
    expect(store.getPayments()).toHaveLength(1);
    expect(count).toBe(2);
  });

  it("初期シードを受け取れる", () => {
    const store = createPayableStore(
      [{ poId: "PO-1", supplier: "A社", amount: 40000, cumulativeReceived: 4, accruedAt: "2026/06/01" }],
      [{ poId: "PO-1", amount: 10000, paidAt: "2026/06/02" }],
    );
    expect(store.getState()).toHaveLength(1);
    expect(store.getPayments()).toHaveLength(1);
  });
});
