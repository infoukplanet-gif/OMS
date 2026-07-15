import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  autoMapColumns,
  missingRequiredKeys,
} from "./auto-map";
import { ORDER_IMPORT_FIELDS, type ImportFieldDef } from "./field-registry";

describe("normalizeHeader", () => {
  it("小文字化・前後空白除去する", () => {
    expect(normalizeHeader("  SKU  ")).toBe("sku");
  });

  it("全角英数字をNFKCで半角化する", () => {
    expect(normalizeHeader("ＳＫＵ")).toBe("sku");
  });

  it("括弧・記号・空白を除去して比較用に潰す", () => {
    expect(normalizeHeader("単価 (税込)")).toBe("単価税込");
    expect(normalizeHeader("e-mail")).toBe("email");
    expect(normalizeHeader("商品コード(SKU)")).toBe("商品コードsku");
  });

  it("全角スペースも除去する", () => {
    expect(normalizeHeader("配送　方法")).toBe("配送方法");
  });
});

describe("autoMapColumns", () => {
  it("キー完全一致で割り当てる", () => {
    const rows = autoMapColumns(["商品名", "数量"], ORDER_IMPORT_FIELDS);
    expect(rows.find((r) => r.csv === "商品名")?.system).toBe("商品名");
    expect(rows.find((r) => r.csv === "商品名")?.matched).toBe(true);
    expect(rows.find((r) => r.csv === "数量")?.system).toBe("数量");
  });

  it("別名一致で割り当てる（sku → 商品コード(SKU)）", () => {
    const rows = autoMapColumns(["SKU"], ORDER_IMPORT_FIELDS);
    expect(rows[0].system).toBe("商品コード(SKU)");
    expect(rows[0].matched).toBe(true);
  });

  it("別名一致で割り当てる（注文者 → 顧客名）", () => {
    const rows = autoMapColumns(["注文者"], ORDER_IMPORT_FIELDS);
    expect(rows[0].system).toBe("顧客名");
  });

  it("表記ゆれ(税込単価)も販売価格に割り当て、変換ヒントを載せる", () => {
    const rows = autoMapColumns(["単価(税込)"], ORDER_IMPORT_FIELDS);
    expect(rows[0].system).toBe("販売価格");
    expect(rows[0].transform).toBe("税抜計算");
  });

  it("同じシステム項目を2列に重複割り当てしない", () => {
    // "単価" と "価格" はどちらも販売価格の別名だが、最初の1列のみに割り当てる
    const rows = autoMapColumns(["単価", "価格"], ORDER_IMPORT_FIELDS);
    const assigned = rows.filter((r) => r.system === "販売価格");
    expect(assigned).toHaveLength(1);
    // 2列目は未設定のまま
    const unset = rows.find((r) => r.system === "");
    expect(unset).toBeTruthy();
  });

  it("未知の列は未設定のままにする", () => {
    const rows = autoMapColumns(["謎の列XYZ"], ORDER_IMPORT_FIELDS);
    expect(rows[0].system).toBe("");
    expect(rows[0].matched).toBe(false);
  });

  it("サンプル値を対応付けて保持する", () => {
    const rows = autoMapColumns(["商品名"], ORDER_IMPORT_FIELDS, {
      samples: { 商品名: "オーガニックコットンタオル" },
    });
    expect(rows[0].sample).toBe("オーガニックコットンタオル");
  });

  it("既に予約済みのシステム項目には割り当てない", () => {
    // 商品名 が予約済みなら、商品名列は未設定になる
    const rows = autoMapColumns(["商品名", "SKU"], ORDER_IMPORT_FIELDS, {
      reservedKeys: ["商品名"],
    });
    expect(rows.find((r) => r.csv === "商品名")?.system).toBe("");
    expect(rows.find((r) => r.csv === "SKU")?.system).toBe("商品コード(SKU)");
  });
});

describe("missingRequiredKeys", () => {
  const simpleFields: ImportFieldDef[] = [
    { key: "商品名", label: "商品名", required: true, aliases: [] },
    { key: "数量", label: "数量", required: true, aliases: [] },
    { key: "備考", label: "備考", aliases: [] },
  ];

  it("必須項目が未割当ならキーを返す", () => {
    const rows = [
      { csv: "A", sample: "", system: "商品名", matched: true },
    ];
    expect(missingRequiredKeys(simpleFields, rows)).toEqual(["数量"]);
  });

  it("必須項目が全て割当済みなら空配列", () => {
    const rows = [
      { csv: "A", sample: "", system: "商品名", matched: true },
      { csv: "B", sample: "", system: "数量", matched: true },
    ];
    expect(missingRequiredKeys(simpleFields, rows)).toEqual([]);
  });

  it("任意項目は不足として扱わない", () => {
    const rows = [
      { csv: "A", sample: "", system: "商品名", matched: true },
      { csv: "B", sample: "", system: "数量", matched: true },
    ];
    // 備考は required でないので不足に含めない
    expect(missingRequiredKeys(simpleFields, rows)).not.toContain("備考");
  });
});
