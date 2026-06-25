/**
 * 引当自動実行スケジュールジョブ 共有ストア。
 *
 * 各スケジュールジョブ（有効/無効フラグ・スケジュール・最終実行結果）を
 * id をキーにした複数レコードとして createMasterStore に載せ、
 * ジョブの有効/無効切り替えをリロード後も復元する。
 *
 * 永続化（domain: "allocation-auto-jobs"）の正規オーナーページは
 * src/app/products/allocation/auto/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface AllocationAutoJobRecord {
  id: string;
  name: string;
  schedule: string;
  target: string;
  enabled: boolean;
  lastRun: string;
  result: "成功" | "失敗" | "—";
  count: number;
  [extra: string]: unknown;
}

// ストアは空配列で初期化する。
// 正規オーナーページ（src/app/products/allocation/auto/page.tsx）が
// usePersistentStore を通じて restore または INITIAL_ALLOCATION_AUTO_JOBS でシードする。
export const allocationAutoJobStore: MasterStore<AllocationAutoJobRecord> =
  createMasterStore<AllocationAutoJobRecord>([]);
