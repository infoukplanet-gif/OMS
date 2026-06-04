import { describe, it, expect } from "vitest";
import { createMasterStore } from "./create-master-store";

interface Row {
  id: string;
  name: string;
  [extra: string]: unknown;
}

const seed: Row[] = [
  { id: "A", name: "Alpha" },
  { id: "B", name: "Beta" },
];

describe("createMasterStore", () => {
  it("初期データを getState で返す（コピーされ元配列と非同一）", () => {
    const store = createMasterStore<Row>(seed);
    expect(store.getState()).toEqual(seed);
    expect(store.getState()).not.toBe(seed);
  });

  it("findById で 1 件取得、無ければ undefined", () => {
    const store = createMasterStore<Row>(seed);
    expect(store.findById("A")).toEqual({ id: "A", name: "Alpha" });
    expect(store.findById("zzz")).toBeUndefined();
  });

  it("upsert: 新規 id は追加して created=true", () => {
    const store = createMasterStore<Row>(seed);
    const r = store.upsert({ id: "C", name: "Gamma" });
    expect(r).toEqual({ created: true });
    expect(store.getState()).toHaveLength(3);
    expect(store.findById("C")).toEqual({ id: "C", name: "Gamma" });
  });

  it("upsert: 既存 id は浅マージで上書きして created=false", () => {
    const store = createMasterStore<Row>(seed);
    const r = store.upsert({ id: "A", name: "Alpha2", note: "x" });
    expect(r).toEqual({ created: false });
    expect(store.getState()).toHaveLength(2);
    expect(store.findById("A")).toEqual({ id: "A", name: "Alpha2", note: "x" });
  });

  it("remove: 該当 id を削除して removed=true、無ければ false", () => {
    const store = createMasterStore<Row>(seed);
    expect(store.remove("B")).toEqual({ removed: true });
    expect(store.getState()).toHaveLength(1);
    expect(store.findById("B")).toBeUndefined();
    expect(store.remove("nope")).toEqual({ removed: false });
  });

  it("setItems で全置換", () => {
    const store = createMasterStore<Row>(seed);
    store.setItems([{ id: "Z", name: "Zeta" }]);
    expect(store.getState()).toEqual([{ id: "Z", name: "Zeta" }]);
  });

  it("subscribe: 変更で listener が呼ばれ、unsubscribe で止まる", () => {
    const store = createMasterStore<Row>(seed);
    let count = 0;
    const unsub = store.subscribe(() => {
      count += 1;
    });
    store.upsert({ id: "C", name: "Gamma" });
    store.remove("A");
    store.setItems([]);
    expect(count).toBe(3);
    unsub();
    store.upsert({ id: "D", name: "Delta" });
    expect(count).toBe(3);
  });

  it("getState は不変参照を返す（upsert ごとに新しい配列）", () => {
    const store = createMasterStore<Row>(seed);
    const before = store.getState();
    store.upsert({ id: "C", name: "Gamma" });
    expect(store.getState()).not.toBe(before);
    expect(before).toHaveLength(2);
  });
});
