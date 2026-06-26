import { describe, expect, it } from "vitest";
import {
  type InspectionRecord,
  canTransitionInspection,
  isInspectionComplete,
  nextInspectionStatus,
  resolveScan,
  transitionInspection,
} from "./inspection";

function makeRecord(overrides: Partial<InspectionRecord> = {}): InspectionRecord {
  return {
    id: "ORD-TEST-001",
    status: "検品中",
    items: [
      { sku: "AAA-001", name: "商品A", required: 2, scanned: 0 },
      { sku: "BBB-002", name: "商品B", required: 1, scanned: 0 },
    ],
    ...overrides,
  };
}

describe("nextInspectionStatus", () => {
  it("検品中 → complete は 検品完了 を返す", () => {
    expect(nextInspectionStatus("検品中", "complete")).toBe("検品完了");
  });

  it("検品完了 は終端で complete を受け付けない", () => {
    expect(nextInspectionStatus("検品完了", "complete")).toBeNull();
  });
});

describe("canTransitionInspection", () => {
  it("検品中 は complete 可能", () => {
    expect(canTransitionInspection("検品中", "complete")).toBe(true);
  });

  it("検品完了 は complete 不可", () => {
    expect(canTransitionInspection("検品完了", "complete")).toBe(false);
  });
});

describe("isInspectionComplete", () => {
  it("全アイテムが必要数に達していれば true", () => {
    const record = makeRecord({
      items: [
        { sku: "AAA-001", name: "商品A", required: 2, scanned: 2 },
        { sku: "BBB-002", name: "商品B", required: 1, scanned: 1 },
      ],
    });
    expect(isInspectionComplete(record)).toBe(true);
  });

  it("未達アイテムがあれば false", () => {
    expect(isInspectionComplete(makeRecord())).toBe(false);
  });

  it("アイテム空なら false", () => {
    expect(isInspectionComplete(makeRecord({ items: [] }))).toBe(false);
  });
});

describe("transitionInspection", () => {
  it("全スキャン済みなら 検品完了 の新レコードを返す", () => {
    const record = makeRecord({
      items: [{ sku: "AAA-001", name: "商品A", required: 1, scanned: 1 }],
    });
    const next = transitionInspection(record, "complete");
    expect(next.status).toBe("検品完了");
    expect(next).not.toBe(record);
    expect(record.status).toBe("検品中");
  });

  it("未スキャンが残っていれば complete は no-op（同一参照）", () => {
    const record = makeRecord();
    expect(transitionInspection(record, "complete")).toBe(record);
  });

  it("検品完了 からの complete は no-op（同一参照）", () => {
    const record = makeRecord({
      status: "検品完了",
      items: [{ sku: "AAA-001", name: "商品A", required: 1, scanned: 1 }],
    });
    expect(transitionInspection(record, "complete")).toBe(record);
  });
});

describe("resolveScan", () => {
  it("受注内SKUを初回スキャンすると ok で scanned を1増やした新レコードを返す", () => {
    const record = makeRecord();
    const res = resolveScan(record, "aaa-001");
    expect(res.result).toBe("ok");
    expect(res.itemName).toBe("商品A");
    expect(res.record.items.find((i) => i.sku === "AAA-001")?.scanned).toBe(1);
    // 不変性: 元レコードは変わらない
    expect(record.items.find((i) => i.sku === "AAA-001")?.scanned).toBe(0);
    expect(res.record).not.toBe(record);
  });

  it("受注外SKUは ng で同一参照を返す", () => {
    const record = makeRecord();
    const res = resolveScan(record, "ZZZ-999");
    expect(res.result).toBe("ng");
    expect(res.record).toBe(record);
  });

  it("既定数を超えるスキャンは duplicate で同一参照を返す", () => {
    const record = makeRecord({
      items: [{ sku: "AAA-001", name: "商品A", required: 1, scanned: 1 }],
    });
    const res = resolveScan(record, "AAA-001");
    expect(res.result).toBe("duplicate");
    expect(res.record).toBe(record);
  });

  it("前後空白を除去し大文字化して照合する", () => {
    const record = makeRecord();
    const res = resolveScan(record, "  bbb-002  ");
    expect(res.result).toBe("ok");
    expect(res.itemName).toBe("商品B");
  });
});
