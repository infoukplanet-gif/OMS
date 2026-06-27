/**
 * RSL（楽天スーパーロジスティクス）処理状況一覧のシード。
 *
 * 出荷・入荷・在庫・返品・棚卸の各バッチ実行ログ。失敗ジョブの再実行（再送）で
 * 状態が遷移するため、共有ストア（rsl-process-log-store）+ usePersistentStore で永続化する。
 * オーナーは warehouse-integration/rakuten-super-logi/process-status ページ。
 */

export type RslProcessType = "出荷" | "入荷" | "在庫" | "返品" | "棚卸";
export type RslProcessStatus = "完了" | "実行中" | "失敗" | "待機";

export interface RslProcessLog {
  id: string;
  job: string;
  type: RslProcessType;
  startAt: string;
  endAt: string;
  duration: string;
  total: number;
  done: number;
  failed: number;
  status: RslProcessStatus;
  detail: string;
  [extra: string]: unknown;
}

export const INITIAL_RSL_PROCESS_LOGS: RslProcessLog[] = [
  { id: "RSL-PROC-20260430-0125", job: "出荷指示送信バッチ", type: "出荷", startAt: "2026/04/30 10:00", endAt: "2026/04/30 10:08", duration: "8m 12s", total: 145, done: 145, failed: 0, status: "完了", detail: "全件正常終了" },
  { id: "RSL-PROC-20260430-0124", job: "在庫数取得バッチ", type: "在庫", startAt: "2026/04/30 09:30", endAt: "2026/04/30 09:32", duration: "2m 4s", total: 845, done: 845, failed: 0, status: "完了", detail: "SKU 845件更新" },
  { id: "RSL-PROC-20260430-0123", job: "出荷実績取込", type: "出荷", startAt: "2026/04/30 09:00", endAt: "2026/04/30 09:02", duration: "1m 48s", total: 132, done: 132, failed: 0, status: "完了", detail: "送り状番号反映" },
  { id: "RSL-PROC-20260430-0122", job: "入荷予定送信", type: "入荷", startAt: "2026/04/30 06:00", endAt: "2026/04/30 06:01", duration: "55s", total: 8, done: 8, failed: 0, status: "完了", detail: "RSL受領確認済" },
  { id: "RSL-PROC-20260430-0121", job: "返品入荷取込", type: "返品", startAt: "2026/04/30 11:00", endAt: "—", duration: "実行中", total: 12, done: 8, failed: 0, status: "実行中", detail: "進捗 8/12" },
  { id: "RSL-PROC-20260429-0418", job: "棚卸結果取込", type: "棚卸", startAt: "2026/04/29 22:00", endAt: "2026/04/29 22:18", duration: "18m 4s", total: 8423, done: 8420, failed: 3, status: "完了", detail: "3件 ロケーション不一致" },
  { id: "RSL-PROC-20260429-0417", job: "出荷指示送信バッチ", type: "出荷", startAt: "2026/04/29 17:00", endAt: "2026/04/29 17:01", duration: "1m 12s", total: 8, done: 5, failed: 3, status: "失敗", detail: "RSL側受信制限により一部失敗" },
];
