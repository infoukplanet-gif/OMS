import { describe, it, expect } from "vitest";
import { createDefectiveStore } from "./defective";
import type { DefectiveRecord } from "../state-machines/defective";

const rec = (over: Partial<DefectiveRecord> = {}): DefectiveRecord => ({
  id: "DF-001",
  order: "—",
  product: "テスト商品",
  sku: "TS-WH-M",
  warehouse: "九州物流センター",
  qty: 2,
  reason: "破損",
  route: "返品倉庫",
  source: "manual",
  registeredAt: "2026/06/11 10:00",
  registeredBy: "佐藤 健",
  status: "承認待ち",
  ...over,
});

describe("createDefectiveStore - register", () => {
  it("新規レコードを追加し通知する", () => {
    const store = createDefectiveStore();
    let count = 0;
    store.subscribe(() => count++);
    const r = store.register(rec());
    expect(r).toEqual({ applied: true, duplicate: false });
    expect(store.getState()).toHaveLength(1);
    expect(count).toBe(1);
  });

  it("同一 id は二重登録しない（冪等・通知しない）", () => {
    const store = createDefectiveStore();
    let count = 0;
    store.subscribe(() => count++);
    store.register(rec());
    const second = store.register(rec({ reason: "別の理由" }));
    expect(second).toEqual({ applied: false, duplicate: true });
    expect(store.getState()).toHaveLength(1);
    expect(count).toBe(1);
  });
});

describe("createDefectiveStore - applyTransition", () => {
  it("approve で 承認待ち → 振替待ち に進め通知する", () => {
    const store = createDefectiveStore([rec()]);
    let count = 0;
    store.subscribe(() => count++);
    const r = store.applyTransition("DF-001", "approve");
    expect(r.applied).toBe(true);
    expect(r.record?.status).toBe("振替待ち");
    expect(store.getState()[0].status).toBe("振替待ち");
    expect(count).toBe(1);
  });

  it("不正遷移は applied=false・通知しない", () => {
    const store = createDefectiveStore([rec()]);
    let count = 0;
    store.subscribe(() => count++);
    const r = store.applyTransition("DF-001", "execute"); // 承認待ちに execute は不可
    expect(r.applied).toBe(false);
    expect(store.getState()[0].status).toBe("承認待ち");
    expect(count).toBe(0);
  });

  it("存在しない id は applied=false・record=null", () => {
    const store = createDefectiveStore([rec()]);
    const r = store.applyTransition("DF-999", "approve");
    expect(r).toEqual({ applied: false, record: null });
  });
});

describe("createDefectiveStore - setItems / シード", () => {
  it("setItems で台帳全体を置換し通知する", () => {
    const store = createDefectiveStore();
    let count = 0;
    store.subscribe(() => count++);
    store.setItems([rec({ id: "DF-A" }), rec({ id: "DF-B" })]);
    expect(store.getState()).toHaveLength(2);
    expect(count).toBe(1);
  });

  it("初期シードを受け取れる", () => {
    const store = createDefectiveStore([rec(), rec({ id: "DF-002" })]);
    expect(store.getState()).toHaveLength(2);
  });
});
