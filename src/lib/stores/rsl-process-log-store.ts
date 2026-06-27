/**
 * RSL 処理状況一覧の共有ストア。
 *
 * 失敗ジョブの再実行（再送）で status / done / detail などが遷移する実行ログを保持する。
 * process-status ページがオーナーで、usePersistentStore で "rsl-process-log" ドメインへ永続化する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import { INITIAL_RSL_PROCESS_LOGS, type RslProcessLog } from "../seeds/rsl-process-log";

export type {
  RslProcessLog,
  RslProcessType,
  RslProcessStatus,
} from "../seeds/rsl-process-log";

export const rslProcessLogStore: MasterStore<RslProcessLog> =
  createMasterStore<RslProcessLog>(INITIAL_RSL_PROCESS_LOGS);
