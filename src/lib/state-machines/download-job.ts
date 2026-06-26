/**
 * ダウンロードジョブのライフサイクル状態機械。
 *
 * 各種CSV/Excelダウンロードジョブの実行状態を管理する。失敗したジョブの再実行
 * （failed→running→success/failed）を遷移として表現する。期限切れ（expired）と
 * 成功（success）は終端状態。
 *
 * 操作:
 * - start  : failed → running（失敗ジョブの再実行）
 * - succeed: running → success（実行成功）
 * - fail   : running → failed（実行失敗）
 *
 * ページ側で `{ ...job, status }` のように status を直書きしない。必ず
 * transitionDownloadJob(job, action) を経由して遷移後レコードを得る。
 */

export type DownloadJobStatus = "success" | "running" | "failed" | "expired";

export type DownloadJobAction = "start" | "succeed" | "fail";

export interface DownloadJobRecord {
  id: string;
  category: string;
  filename: string;
  /** 対象期間 */
  range: string;
  /** 実行者 */
  user: string;
  format: string;
  records: number;
  size: string;
  startedAt: string;
  /** 所要時間 */
  duration: string;
  status: DownloadJobStatus;
  /** createMasterStore（MasterRecord）互換のためのインデックスシグネチャ。 */
  [extra: string]: unknown;
}

const TRANSITIONS: Record<
  DownloadJobStatus,
  Partial<Record<DownloadJobAction, DownloadJobStatus>>
> = {
  success: {},
  running: { succeed: "success", fail: "failed" },
  failed: { start: "running" },
  expired: {},
};

export function nextDownloadJobStatus(
  status: DownloadJobStatus,
  action: DownloadJobAction,
): DownloadJobStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransitionDownloadJob(
  status: DownloadJobStatus,
  action: DownloadJobAction,
): boolean {
  return nextDownloadJobStatus(status, action) !== null;
}

/**
 * 遷移を適用した新レコードを返す。
 * 不正遷移（ガード不成立）の場合は同一参照をそのまま返す（no-op）。
 */
export function transitionDownloadJob(
  record: DownloadJobRecord,
  action: DownloadJobAction,
): DownloadJobRecord {
  const target = nextDownloadJobStatus(record.status, action);
  if (target === null) return record;
  return { ...record, status: target };
}
