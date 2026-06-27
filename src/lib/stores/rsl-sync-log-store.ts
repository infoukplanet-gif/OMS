/**
 * RSL 連携トップの同期履歴ストア。
 *
 * 「全件同期」実行のたびに 1 レコード追記する実行ログを保持する。
 * RSL トップページがオーナーで、usePersistentStore で "rsl-sync-log" ドメインへ永続化する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import { INITIAL_RSL_SYNC_LOGS, type RslSyncLog } from "../seeds/rsl-sync-log";

export type { RslSyncLog } from "../seeds/rsl-sync-log";

export const rslSyncLogStore: MasterStore<RslSyncLog> =
  createMasterStore<RslSyncLog>(INITIAL_RSL_SYNC_LOGS);
