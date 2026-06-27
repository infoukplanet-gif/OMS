/**
 * 自動引当の実行ログシード。
 *
 * 引当実行（手動・スケジュール）のたびに 1 レコード追記される実行履歴。
 * リロードしても消えないよう共有ストア（allocation-run-log-store）+
 * usePersistentStore で永続化する。オーナーは products/allocation/auto ページ。
 */

export interface AllocationRunLog {
  id: string;
  at: string;
  job: string;
  success: number;
  partial: number;
  failed: number;
  [extra: string]: unknown;
}

export const INITIAL_ALLOCATION_RUN_LOGS: AllocationRunLog[] = [
  { id: "ALC-RUN-20260425-1300", at: "2026-04-25 13:00", job: "昼次自動引当", success: 58, partial: 0, failed: 0 },
  { id: "ALC-RUN-20260425-0900", at: "2026-04-25 09:00", job: "朝次自動引当", success: 140, partial: 2, failed: 0 },
  { id: "ALC-RUN-20260425-0830", at: "2026-04-25 08:30", job: "卸先優先引当", success: 28, partial: 0, failed: 0 },
  { id: "ALC-RUN-20260424-1700", at: "2026-04-24 17:00", job: "夕次自動引当", success: 71, partial: 1, failed: 1 },
];
