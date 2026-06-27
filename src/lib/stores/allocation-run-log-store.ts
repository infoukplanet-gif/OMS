/**
 * 自動引当の実行ログストア。
 *
 * 引当実行のたびに 1 レコード追記する実行履歴を保持する。
 * products/allocation/auto ページがオーナーで、usePersistentStore で
 * "allocation-run-log" ドメインへ永続化する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import { INITIAL_ALLOCATION_RUN_LOGS, type AllocationRunLog } from "../seeds/allocation-run-log";

export type { AllocationRunLog } from "../seeds/allocation-run-log";

export const allocationRunLogStore: MasterStore<AllocationRunLog> =
  createMasterStore<AllocationRunLog>(INITIAL_ALLOCATION_RUN_LOGS);
