/**
 * 卸先マスタ一括登録の取込履歴シード。
 *
 * customers/wholesale/import ページが取込を確定するたびに 1 レコード追記される
 * （id をキーにした collection ストア）。
 */

export type WholesaleImportMode = "new" | "update" | "upsert";

export interface WholesaleImportBatch {
  id: string;
  filename: string;
  rows: number;
  success: number;
  error: number;
  mode: WholesaleImportMode;
  template: string;
  user: string;
  at: string;
  [extra: string]: unknown;
}

export const INITIAL_WHOLESALE_IMPORT_HISTORY: WholesaleImportBatch[] = [
  { id: "WHIMP-20260422-1014", filename: "wholesale_april_2026.csv", rows: 58, success: 57, error: 1, mode: "upsert", template: "自社CSV用", user: "佐藤 花子", at: "2026-04-22 10:14" },
  { id: "WHIMP-20260418-1548", filename: "credit_limit_update.csv", rows: 32, success: 32, error: 0, mode: "update", template: "MerchantSync連携用", user: "田中 太郎", at: "2026-04-18 15:48" },
  { id: "WHIMP-20260410-0922", filename: "new_wholesales_q2.csv", rows: 14, success: 14, error: 0, mode: "new", template: "自社CSV用", user: "鈴木 一郎", at: "2026-04-10 09:22" },
];
