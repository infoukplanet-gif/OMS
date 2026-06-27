import { describe, expect, it, vi } from "vitest";
import { createKeyedLedgerStore } from "./keyed-ledger";

interface Row {
  id: string;
  value: number;
}

describe("createKeyedLedgerStore — キー重複を弾く追記型台帳", () => {
  it("新規キーは追記され applied=true", () => {
    const store = createKeyedLedgerStore<Row>((r) => r.id);
    const res = store.add({ id: "A", value: 1 });
    expect(res).toEqual({ applied: true, duplicate: false });
    expect(store.getState()).toEqual([{ id: "A", value: 1 }]);
  });

  it("同一キーの再追記は no-op（duplicate=true・件数不変・元の行を保持）", () => {
    const store = createKeyedLedgerStore<Row>((r) => r.id, [{ id: "A", value: 1 }]);
    const res = store.add({ id: "A", value: 999 });
    expect(res).toEqual({ applied: false, duplicate: true });
    expect(store.getState()).toEqual([{ id: "A", value: 1 }]);
  });

  it("実追記時のみ subscribe リスナへ通知し、重複時は通知しない", () => {
    const store = createKeyedLedgerStore<Row>((r) => r.id);
    const listener = vi.fn();
    store.subscribe(listener);

    store.add({ id: "A", value: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    store.add({ id: "A", value: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("setItems で台帳全体を置換し通知する", () => {
    const store = createKeyedLedgerStore<Row>((r) => r.id, [{ id: "A", value: 1 }]);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setItems([{ id: "B", value: 2 }]);
    expect(store.getState()).toEqual([{ id: "B", value: 2 }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe 後は通知されない", () => {
    const store = createKeyedLedgerStore<Row>((r) => r.id);
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.add({ id: "A", value: 1 });
    expect(listener).not.toHaveBeenCalled();
  });
});
