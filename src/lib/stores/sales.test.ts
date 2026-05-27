import { describe, expect, it, vi } from "vitest";
import { createSalesStore, type SalesEntry } from "./sales";

function entry(overrides: Partial<SalesEntry> = {}): SalesEntry {
  return {
    shipmentId: "SHP-2026-00001",
    orderId: "ORD-1",
    shop: "楽天市場",
    customer: "山田 太郎",
    amount: 32_400,
    recognizedAt: "2026/04/30",
    ...overrides,
  };
}

describe("createSalesStore — 確定売上台帳", () => {
  it("初期シードを保持し getState で返す", () => {
    const store = createSalesStore([entry()]);
    expect(store.getState()).toHaveLength(1);
    expect(store.getState()[0].amount).toBe(32_400);
  });

  it("recognize で売上計上し台帳に積む", () => {
    const store = createSalesStore();
    const r = store.recognize(entry());
    expect(r.applied).toBe(true);
    expect(r.duplicate).toBe(false);
    expect(store.getState()).toHaveLength(1);
  });

  it("同一 shipmentId は二重計上しない（冪等性）", () => {
    const store = createSalesStore();
    store.recognize(entry());
    const second = store.recognize(entry({ amount: 99_999 }));
    expect(second.applied).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(store.getState()).toHaveLength(1);
    expect(store.getState()[0].amount).toBe(32_400);
  });

  it("異なる shipmentId は別行として積む", () => {
    const store = createSalesStore();
    store.recognize(entry());
    store.recognize(entry({ shipmentId: "SHP-2026-00002", amount: 8_900 }));
    expect(store.getState()).toHaveLength(2);
  });

  it("subscribe は recognize で通知され、unsubscribe で止まる", () => {
    const store = createSalesStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    store.recognize(entry());
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    store.recognize(entry({ shipmentId: "SHP-2026-00099" }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("重複 recognize では通知しない", () => {
    const store = createSalesStore([entry()]);
    const listener = vi.fn();
    store.subscribe(listener);
    store.recognize(entry());
    expect(listener).not.toHaveBeenCalled();
  });

  it("setItems は台帳全体を置換し通知する", () => {
    const store = createSalesStore([entry()]);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setItems([entry({ shipmentId: "SHP-X", amount: 1_000 })]);
    expect(store.getState()).toHaveLength(1);
    expect(store.getState()[0].amount).toBe(1_000);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
