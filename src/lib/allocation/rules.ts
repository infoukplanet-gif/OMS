/**
 * 引当ルール設定（クライアントセッション内のモジュールレベル設定）
 *
 * 引当自動実行ページ（products/allocation/auto）で編集し、引当 cascade
 * （record-payment / allocate-orders）が参照する。mail/auto-settings.ts と同じ方式。
 *
 * - warehousePriority: 拠点の引当優先順（先頭から消費）。グローバル1リスト。
 * - allowSplit: 同一SKUを複数倉庫に分割して引当てるか（false なら単一倉庫 full-cover 優先）
 * - orderBy: バッチ引当時に受注を処理する順序（在庫が競合する時の取り合い順）
 *
 * v2 で server action + 設定テーブルに置き換えるまでの暫定。
 */

export type OrderByRule = "受注日昇順" | "金額降順" | "登録順";

export const ORDER_BY_RULES: readonly OrderByRule[] = ["受注日昇順", "金額降順", "登録順"];

export interface AllocationRules {
  /** 拠点の引当優先順（配列の先頭ほど優先）。 */
  warehousePriority: string[];
  /** 同一SKUの複数倉庫分割を許可するか。 */
  allowSplit: boolean;
  /** バッチ引当の受注処理順。 */
  orderBy: OrderByRule;
}

export const DEFAULT_ALLOCATION_RULES: AllocationRules = {
  warehousePriority: ["東京本社倉庫", "大阪倉庫", "九州物流センター"],
  allowSplit: true,
  orderBy: "受注日昇順",
};

let current: AllocationRules = {
  ...DEFAULT_ALLOCATION_RULES,
  warehousePriority: [...DEFAULT_ALLOCATION_RULES.warehousePriority],
};

export function getAllocationRules(): AllocationRules {
  return current;
}

export function setAllocationRules(next: AllocationRules): void {
  current = {
    ...next,
    warehousePriority: [...next.warehousePriority],
  };
}

/** テスト用: 既定値に戻す。 */
export function resetAllocationRules(): void {
  current = {
    ...DEFAULT_ALLOCATION_RULES,
    warehousePriority: [...DEFAULT_ALLOCATION_RULES.warehousePriority],
  };
}

/**
 * 倉庫の優先順位ランク。優先リストにない倉庫は最後尾（同順）に回す。
 * 配列ソートの比較関数で使う。
 */
export function warehouseRank(warehouse: string, priority: ReadonlyArray<string>): number {
  const i = priority.indexOf(warehouse);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}
