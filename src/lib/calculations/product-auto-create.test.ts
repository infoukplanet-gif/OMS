import { describe, it, expect } from "vitest";
import {
  buildAutoCreatedProducts,
  type ImportProductRow,
  type ProductAutoCreateSettings,
} from "./product-auto-create";
import type { ConversionRule } from "./category-conversion";

const BASE_SETTINGS: ProductAutoCreateSettings = {
  autoDetect: true,
  skipConflict: true,
  autoCategorize: false,
  defaultMargin: 30,
  enabledSources: ["楽天市場", "Amazon"],
  defaultCategory: "未分類",
};

function row(over: Partial<ImportProductRow> = {}): ImportProductRow {
  return {
    skuCode: "NEW-001",
    productName: "新商品",
    price: 1000,
    source: "楽天市場",
    status: "ok",
    ...over,
  };
}

describe("buildAutoCreatedProducts", () => {
  it("autoDetect=false なら全行を『自動検出OFF』でスキップし1件も作成しない", () => {
    const result = buildAutoCreatedProducts(
      [row(), row({ skuCode: "NEW-002" })],
      { ...BASE_SETTINGS, autoDetect: false },
      [],
    );
    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.skipped).toEqual([
      { sku: "NEW-001", reason: "自動検出OFF" },
      { sku: "NEW-002", reason: "自動検出OFF" },
    ]);
  });

  it("未登録SKUの正常行を商品マスタとして作成する（販売中・原価=価格×(1-原価率)）", () => {
    const result = buildAutoCreatedProducts([row({ price: 2000 })], BASE_SETTINGS, []);
    expect(result.created).toHaveLength(1);
    expect(result.created[0]).toMatchObject({
      code: "NEW-001",
      name: "新商品",
      price: 2000,
      cost: 1400, // 2000 × (1 - 0.30)
      status: "販売中",
      category: "未分類",
    });
  });

  it("不正行（error ステータス・商品名空・価格0・SKU空）はスキップし正常行のみ作成する", () => {
    const rows = [
      row({ skuCode: "OK-1" }),
      row({ skuCode: "ERR-1", status: "error" }),
      row({ skuCode: "ERR-2", productName: "" }),
      row({ skuCode: "ERR-3", price: 0 }),
      row({ skuCode: "", productName: "SKU空" }),
    ];
    const result = buildAutoCreatedProducts(rows, BASE_SETTINGS, []);
    expect(result.created.map((p) => p.code)).toEqual(["OK-1"]);
    expect(result.skipped.every((s) => s.reason === "不正行")).toBe(true);
    expect(result.skipped).toHaveLength(4);
  });

  it("有効化されていないソースの行は『対象外ソース』でスキップする", () => {
    const result = buildAutoCreatedProducts(
      [row({ skuCode: "Y-1", source: "Yahoo!ショッピング" })],
      BASE_SETTINGS,
      [],
    );
    expect(result.created).toHaveLength(0);
    expect(result.skipped).toEqual([{ sku: "Y-1", reason: "対象外ソース" }]);
  });

  it("同一バッチ内の重複SKUは先頭のみ作成し、以降は『重複行』でスキップする", () => {
    const result = buildAutoCreatedProducts(
      [row({ skuCode: "DUP", productName: "先勝ち" }), row({ skuCode: "DUP", productName: "後負け" })],
      BASE_SETTINGS,
      [],
    );
    expect(result.created).toHaveLength(1);
    expect(result.created[0].name).toBe("先勝ち");
    expect(result.skipped).toEqual([{ sku: "DUP", reason: "重複行" }]);
  });

  it("既存SKU × skipConflict=ON は『既存スキップ』で作成しない", () => {
    const result = buildAutoCreatedProducts(
      [row({ skuCode: "EXIST" })],
      { ...BASE_SETTINGS, skipConflict: true },
      ["EXIST"],
    );
    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.skipped).toEqual([{ sku: "EXIST", reason: "既存スキップ" }]);
  });

  it("既存SKU × skipConflict=OFF は updated として上書き対象に積む", () => {
    const result = buildAutoCreatedProducts(
      [row({ skuCode: "EXIST", productName: "上書き名" })],
      { ...BASE_SETTINGS, skipConflict: false },
      ["EXIST"],
    );
    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(1);
    expect(result.updated[0]).toMatchObject({ code: "EXIST", name: "上書き名" });
  });

  it("autoCategorize=ON はカテゴリ変換ルールを適用し、未マッチは defaultCategory にフォールバックする", () => {
    const rules: ConversionRule[] = [
      { id: "CV-1", from: "イヤホン", fromSource: "楽天市場", to: "オーディオ", matchType: "正規表現", priority: 1, enabled: true },
    ];
    const matched = buildAutoCreatedProducts(
      [row({ skuCode: "C-1", source: "楽天市場", externalCategory: "ワイヤレスイヤホン" })],
      { ...BASE_SETTINGS, autoCategorize: true },
      [],
      rules,
    );
    expect(matched.created[0].category).toBe("オーディオ");

    const unmatched = buildAutoCreatedProducts(
      [row({ skuCode: "C-2", source: "楽天市場", externalCategory: "該当なし" })],
      { ...BASE_SETTINGS, autoCategorize: true },
      [],
      rules,
    );
    expect(unmatched.created[0].category).toBe("未分類");
  });

  it("冪等性: 同じ入力を2回流しても結果（作成対象SKU集合）は一致する", () => {
    const rows = [row({ skuCode: "A" }), row({ skuCode: "B" })];
    const first = buildAutoCreatedProducts(rows, BASE_SETTINGS, []);
    // 1回目で作成された分が既存になった状態で再実行
    const existingAfter = first.created.map((p) => p.code);
    const second = buildAutoCreatedProducts(rows, BASE_SETTINGS, existingAfter);
    expect(first.created.map((p) => p.code)).toEqual(["A", "B"]);
    expect(second.created).toHaveLength(0);
    expect(second.skipped.every((s) => s.reason === "既存スキップ")).toBe(true);
  });

  it("原価率は 0〜100% にクランプ（不正値は0%扱いで原価=価格）", () => {
    const over = buildAutoCreatedProducts([row({ price: 1000 })], { ...BASE_SETTINGS, defaultMargin: 150 }, []);
    expect(over.created[0].cost).toBe(0); // 100% → 原価0
    const nan = buildAutoCreatedProducts([row({ price: 1000 })], { ...BASE_SETTINGS, defaultMargin: NaN }, []);
    expect(nan.created[0].cost).toBe(1000); // 0% → 原価=価格
  });
});
