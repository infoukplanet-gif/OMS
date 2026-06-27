import { describe, it, expect } from "vitest";
import { parseMallCsv } from "./mall-import";

describe("parseMallCsv", () => {
  it("空・ヘッダーのみのテキストは空結果を返す", () => {
    expect(parseMallCsv("rakuten", "")).toEqual({ rows: [], errorRows: 0, totalRows: 0 });
    expect(parseMallCsv("rakuten", "商品番号,商品名,販売価格,在庫数")).toEqual({
      rows: [],
      errorRows: 0,
      totalRows: 0,
    });
  });

  it("楽天CSVを列名でマッピングして取り込む", () => {
    const csv = [
      "商品管理番号（商品URL）,商品番号,商品名,販売価格,在庫数,ジャンルID",
      "url-a,SKU-001,オーガニックT 黒,2980,48,120832",
      "url-b,SKU-002,リネンシャツ 白,4980,12,120833",
    ].join("\n");
    const result = parseMallCsv("rakuten", csv);
    expect(result.totalRows).toBe(2);
    expect(result.errorRows).toBe(0);
    expect(result.rows).toEqual([
      { code: "SKU-001", name: "オーガニックT 黒", price: 2980, stock: 48, jan: "" },
      { code: "SKU-002", name: "リネンシャツ 白", price: 4980, stock: 12, jan: "" },
    ]);
  });

  it("コードが空の行は errorRows として数え、取り込まない", () => {
    const csv = ["code,name,price,quantity,jan", "Y-1,商品A,1000,5,4580000000001", ",商品B,2000,3,"].join(
      "\n",
    );
    const result = parseMallCsv("yahoo", csv);
    expect(result.totalRows).toBe(2);
    expect(result.errorRows).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ code: "Y-1", name: "商品A", price: 1000, stock: 5, jan: "4580000000001" });
  });

  it("タブ区切り（Amazon在庫ファイル）を自動判定する", () => {
    const csv = ["sku\tproduct-id\tproduct-id-type\tprice\tquantity", "AMZ-1\t4580000000002\tEAN\t3500\t20"].join(
      "\n",
    );
    const result = parseMallCsv("amazon", csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].code).toBe("AMZ-1");
    expect(result.rows[0].price).toBe(3500);
    expect(result.rows[0].stock).toBe(20);
  });

  it("¥・カンマ・円付きの金額からも数値を取り出す", () => {
    const csv = ["商品コード,商品名,販売価格,在庫数", "G-1,汎用商品,\"¥12,800\",在庫7"].join("\n");
    const result = parseMallCsv("base", csv);
    expect(result.rows[0].price).toBe(12800);
    expect(result.rows[0].stock).toBe(7);
  });

  it("商品名が無ければコードを名称にフォールバックする", () => {
    const csv = ["sku,price,quantity", "ONLY-CODE,500,3"].join("\n");
    const result = parseMallCsv("amazon", csv);
    expect(result.rows[0].name).toBe("ONLY-CODE");
  });
});
