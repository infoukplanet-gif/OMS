import { describe, expect, it } from "vitest";
import {
  applyCategoryConversion,
  recalculateProductCategories,
  type ConversionRule,
  type ProductForRecalc,
} from "./category-conversion";

const rule = (overrides: Partial<ConversionRule> = {}): ConversionRule => ({
  id: "r1",
  from: "レディース > トップス > Tシャツ",
  fromSource: "楽天",
  to: "アパレル/トップス/Tシャツ",
  matchType: "完全一致",
  priority: 1,
  enabled: true,
  ...overrides,
});

describe("applyCategoryConversion — 単一カテゴリの変換", () => {
  it("完全一致で from/fromSource を満たせば to を返す", () => {
    expect(applyCategoryConversion("レディース > トップス > Tシャツ", "楽天", [rule()]))
      .toBe("アパレル/トップス/Tシャツ");
  });

  it("fromSource が違えばマッチしない", () => {
    expect(applyCategoryConversion("レディース > トップス > Tシャツ", "Amazon", [rule()]))
      .toBeNull();
  });

  it("完全一致は部分一致しない", () => {
    expect(applyCategoryConversion("レディース > トップス", "楽天", [rule()]))
      .toBeNull();
  });

  it("前方一致は prefix で判定", () => {
    expect(applyCategoryConversion(
      "メンズ > シャツ > ボタンダウン",
      "楽天",
      [rule({ from: "メンズ > ", matchType: "前方一致", to: "アパレル/メンズ" })],
    )).toBe("アパレル/メンズ");
  });

  it("正規表現で部分マッチを許す", () => {
    expect(applyCategoryConversion(
      "ファッション > レディース > ワンピース",
      "Yahoo!",
      [rule({ from: "ファッション > レディース.*", fromSource: "Yahoo!", matchType: "正規表現", to: "アパレル/レディース" })],
    )).toBe("アパレル/レディース");
  });

  it("priority が小さいルールが先勝ち、同 priority なら配列順", () => {
    const rules = [
      rule({ id: "low", from: "X", fromSource: "楽天", matchType: "前方一致", priority: 9, to: "汎用カテゴリ" }),
      rule({ id: "high", from: "X", fromSource: "楽天", matchType: "完全一致", priority: 1, to: "厳密カテゴリ" }),
    ];
    expect(applyCategoryConversion("X", "楽天", rules)).toBe("厳密カテゴリ");
  });

  it("disabled なルールはスキップ", () => {
    expect(applyCategoryConversion(
      "レディース > トップス > Tシャツ",
      "楽天",
      [rule({ enabled: false })],
    )).toBeNull();
  });

  it("どのルールにもマッチしなければ null", () => {
    expect(applyCategoryConversion("謎カテゴリ", "楽天", [rule()])).toBeNull();
  });
});

describe("recalculateProductCategories — 取込済み商品のカテゴリ再計算", () => {
  const p = (overrides: Partial<ProductForRecalc> = {}): ProductForRecalc => ({
    code: "P-1",
    category: "未分類",
    externalCategory: "レディース > トップス > Tシャツ",
    fromSource: "楽天",
    ...overrides,
  });

  it("外部カテゴリがマッチすると category を更新する", () => {
    const result = recalculateProductCategories([p()], [rule()]);
    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].category).toBe("アパレル/トップス/Tシャツ");
    expect(result.changedCount).toBe(1);
  });

  it("変換結果が現在の category と同じなら未変更カウントに含めない", () => {
    const result = recalculateProductCategories(
      [p({ category: "アパレル/トップス/Tシャツ" })],
      [rule()],
    );
    expect(result.changedCount).toBe(0);
    expect(result.updated[0].category).toBe("アパレル/トップス/Tシャツ");
  });

  it("externalCategory / fromSource が無い商品はスキップ（B2C 受注由来等）", () => {
    const result = recalculateProductCategories(
      [p({ externalCategory: undefined, fromSource: undefined, category: "雑貨" })],
      [rule()],
    );
    expect(result.changedCount).toBe(0);
    expect(result.updated[0].category).toBe("雑貨");
  });

  it("マッチしない場合は category を維持（強制で 未分類 にはしない）", () => {
    const result = recalculateProductCategories(
      [p({ category: "雑貨", externalCategory: "謎カテゴリ" })],
      [rule()],
    );
    expect(result.changedCount).toBe(0);
    expect(result.updated[0].category).toBe("雑貨");
  });
});
