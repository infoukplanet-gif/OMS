/**
 * 一括登録制限設定 共有マスタストア
 *
 * 「id 固定の1レコード配列」として createMasterStore に載せる。
 * 永続化（domain: "bulk-import-limit"）の正規オーナーページは
 * src/app/orders/bulk-limit/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface BulkImportLimitConfig {
  id: string;
  enabled: boolean;
  maxPerDay: number;
  maxPerSession: number;
  intervalSec: number;
  stopOnError: boolean;
  notifyOnLimit: boolean;
  autoPause: boolean;
  adminOnly: boolean;
  [extra: string]: unknown;
}

export const INITIAL_BULK_IMPORT_LIMIT: BulkImportLimitConfig[] = [
  {
    id: "config",
    enabled: true,
    maxPerDay: 500,
    maxPerSession: 100,
    intervalSec: 2,
    stopOnError: true,
    notifyOnLimit: true,
    autoPause: false,
    adminOnly: false,
  },
];

export const bulkImportLimitStore: MasterStore<BulkImportLimitConfig> =
  createMasterStore<BulkImportLimitConfig>(INITIAL_BULK_IMPORT_LIMIT);
