import { describe, expect, it, vi } from "vitest";
import { createProductStore, type ProductRecord } from "./product";

function product(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    code: "WEP-001",
    name: "ワイヤレスイヤホン Pro",
    category: "家電",
    price: 12_800,
    cost: 4_500,
    status: "販売中",
    ...overrides,
  };
}

describe("createProductStore — 商品マスタ共有ストア", () => {
  it("初期シードを保持し getState で返す", () => {
    const store = createProductStore([product()]);
    expect(store.getState()).toHaveLength(1);
    expect(store.getState()[0].name).toBe("ワイヤレスイヤホン Pro");
  });

  it("upsert で新規追加できる", () => {
    const store = createProductStore();
    const r = store.upsert(product());
    expect(r.created).toBe(true);
    expect(store.getState()).toHaveLength(1);
  });

  it("同一 code の upsert は更新（重複追加しない）", () => {
    const store = createProductStore([product()]);
    const r = store.upsert(product({ price: 14_000, name: "ワイヤレスイヤホン Pro v2" }));
    expect(r.created).toBe(false);
    expect(store.getState()).toHaveLength(1);
    expect(store.getState()[0].price).toBe(14_000);
    expect(store.getState()[0].name).toBe("ワイヤレスイヤホン Pro v2");
  });

  it("findByCode は code 一致のレコードを返す（無ければ undefined）", () => {
    const store = createProductStore([product()]);
    expect(store.findByCode("WEP-001")?.name).toBe("ワイヤレスイヤホン Pro");
    expect(store.findByCode("NOPE")).toBeUndefined();
  });

  it("subscribe は upsert で通知され unsubscribe で止まる", () => {
    const store = createProductStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    store.upsert(product());
    expect(listener).toHaveBeenCalledTimes(1);
    store.upsert(product({ price: 99 }));
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    store.upsert(product({ code: "NEW", price: 1 }));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("remove は code 一致のレコードを削除し true を返す", () => {
    const store = createProductStore([product(), product({ code: "UCB-002" })]);
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.remove("WEP-001")).toBe(true);
    expect(store.getState()).toHaveLength(1);
    expect(store.findByCode("WEP-001")).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("remove は存在しない code では false を返し通知しない", () => {
    const store = createProductStore([product()]);
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.remove("NOPE")).toBe(false);
    expect(store.getState()).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("setItems は台帳全体を置換し通知する", () => {
    const store = createProductStore([product()]);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setItems([product({ code: "ALT", price: 999 })]);
    expect(store.getState()).toHaveLength(1);
    expect(store.getState()[0].code).toBe("ALT");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
