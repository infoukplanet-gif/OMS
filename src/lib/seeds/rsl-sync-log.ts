/**
 * RSL（楽天スーパーロジスティクス）連携トップの同期履歴シード。
 *
 * 「全件同期」「接続テスト」などの実行ログ。実行のたびに 1 レコード追記されるため、
 * 共有ストア（rsl-sync-log-store）+ usePersistentStore で永続化する。
 * オーナーは warehouse-integration/rakuten-super-logi トップページ。
 */

export interface RslSyncLog {
  id: string;
  time: string;
  action: string;
  count: number;
  result: string;
  [extra: string]: unknown;
}

export const INITIAL_RSL_SYNC_LOGS: RslSyncLog[] = [
  { id: "RSL-SYNC-20260430-1030", time: "2026/04/30 10:30", action: "出荷指示送信", count: 145, result: "成功" },
  { id: "RSL-SYNC-20260430-1000", time: "2026/04/30 10:00", action: "在庫数取得", count: 22130, result: "成功" },
  { id: "RSL-SYNC-20260430-0930", time: "2026/04/30 09:30", action: "出荷実績取込", count: 132, result: "成功" },
  { id: "RSL-SYNC-20260430-0600", time: "2026/04/30 06:00", action: "入荷予定送信", count: 8, result: "成功" },
];
