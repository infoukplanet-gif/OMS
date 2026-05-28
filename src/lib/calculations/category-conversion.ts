/**
 * カテゴリ変換ルールの適用（pure function）。
 *
 * 仕様: docs/prd/events-integration-v1.md（カテゴリ変換ルール変更→取込済み商品の再計算）
 *
 * モールごとの外部カテゴリ表記（"レディース > トップス > Tシャツ" など）を
 * OMS 標準カテゴリ（"アパレル/トップス/Tシャツ"）に変換する。
 *
 * - 完全一致 / 前方一致 / 正規表現 の 3 種類のマッチ方式
 * - priority が小さいほど優先（同 priority は配列順）
 * - enabled=false のルールはスキップ
 * - マッチしなければ null（呼び出し元は category を維持）
 */

export type MatchType = "完全一致" | "前方一致" | "正規表現";

export interface ConversionRule {
  id: string;
  /** 外部カテゴリ表記（モール側の表記）。 */
  from: string;
  /** 入手元（楽天/Amazon/Yahoo!/自社EC/FAX手入力 等）。 */
  fromSource: string;
  /** 変換後の OMS 標準カテゴリ。 */
  to: string;
  matchType: MatchType;
  /** 1 が最優先、9 まで（小さいほど先勝ち）。 */
  priority: number;
  enabled: boolean;
}

/**
 * 1 件の外部カテゴリに変換ルール群を適用して、OMS 標準カテゴリを返す。
 *
 * @param externalCategory モール側のカテゴリ表記
 * @param fromSource モール識別子
 * @param rules 変換ルール群（任意順）
 * @returns 変換後のカテゴリ。マッチしなければ null。
 */
export function applyCategoryConversion(
  externalCategory: string,
  fromSource: string,
  rules: ReadonlyArray<ConversionRule>,
): string | null {
  // priority 昇順 + 配列順を維持する安定ソート
  const sorted = rules
    .map((r, idx) => ({ r, idx }))
    .sort((a, b) => a.r.priority - b.r.priority || a.idx - b.idx);

  for (const { r } of sorted) {
    if (!r.enabled) continue;
    if (r.fromSource !== fromSource) continue;
    if (matches(externalCategory, r.from, r.matchType)) {
      return r.to;
    }
  }
  return null;
}

function matches(value: string, pattern: string, type: MatchType): boolean {
  switch (type) {
    case "完全一致":
      return value === pattern;
    case "前方一致":
      return value.startsWith(pattern);
    case "正規表現":
      try {
        return new RegExp(pattern).test(value);
      } catch {
        // 不正な regex はマッチ無しとして扱う（UI 入力ミスで全件破壊しない）
        return false;
      }
  }
}

/** 再計算対象の商品の最小サブセット。 */
export interface ProductForRecalc {
  code: string;
  category: string;
  externalCategory?: string;
  fromSource?: string;
  [extra: string]: unknown;
}

export interface RecalcResult<T extends ProductForRecalc> {
  /** category を更新した（または据え置いた）商品の新配列。 */
  updated: T[];
  /** 実際に変更が走った件数。 */
  changedCount: number;
}

/**
 * 取込済み商品のカテゴリを変換ルールで再計算する。
 *
 * - externalCategory / fromSource が未設定の商品はスキップ（変更なし）
 * - マッチしない場合は category を維持
 * - 変換結果が既存値と一致するなら changedCount にカウントしない
 */
export function recalculateProductCategories<T extends ProductForRecalc>(
  products: ReadonlyArray<T>,
  rules: ReadonlyArray<ConversionRule>,
): RecalcResult<T> {
  let changedCount = 0;
  const updated = products.map((p) => {
    if (!p.externalCategory || !p.fromSource) return p;
    const next = applyCategoryConversion(p.externalCategory, p.fromSource, rules);
    if (next === null || next === p.category) return p;
    changedCount += 1;
    return { ...p, category: next };
  });
  return { updated, changedCount };
}
