import { describe, it, expect } from "vitest";
import {
  buildShrinkageDefectives,
  type ShrinkageLine,
} from "./shrinkage-defective";

const meta = {
  registeredAt: "2026/06/11 10:00",
  registeredBy: "佐藤 健",
  idPrefix: "DFS-20260611",
};

describe("buildShrinkageDefectives", () => {
  it("負差異1行を 振替完了・source stocktake の監査レコードに変換する", () => {
    const lines: ShrinkageLine[] = [
      { sku: "TS-WH-M", warehouse: "九州物流センター", product: "Tシャツ", qty: 3 },
    ];
    const out = buildShrinkageDefectives(lines, meta);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      sku: "TS-WH-M",
      warehouse: "九州物流センター",
      product: "Tシャツ",
      qty: 3,
      status: "振替完了",
      source: "stocktake",
      route: "廃棄",
      reason: "棚卸減耗",
      order: "—",
      registeredAt: "2026/06/11 10:00",
      registeredBy: "佐藤 健",
    });
  });

  it("id は idPrefix + 連番で決定的に振る", () => {
    const lines: ShrinkageLine[] = [
      { sku: "A", warehouse: "倉庫1", product: "商品A", qty: 1 },
      { sku: "B", warehouse: "倉庫1", product: "商品B", qty: 2 },
    ];
    const out = buildShrinkageDefectives(lines, meta);
    expect(out.map((r) => r.id)).toEqual(["DFS-20260611-001", "DFS-20260611-002"]);
  });

  it("qty<=0 の行は除外する（減耗ではない）", () => {
    const lines: ShrinkageLine[] = [
      { sku: "A", warehouse: "倉庫1", product: "商品A", qty: 0 },
      { sku: "B", warehouse: "倉庫1", product: "商品B", qty: -2 },
      { sku: "C", warehouse: "倉庫1", product: "商品C", qty: 4 },
    ];
    const out = buildShrinkageDefectives(lines, meta);
    expect(out).toHaveLength(1);
    expect(out[0].sku).toBe("C");
    expect(out[0].id).toBe("DFS-20260611-001");
  });

  it("空入力では空配列を返す", () => {
    expect(buildShrinkageDefectives([], meta)).toEqual([]);
  });
});
