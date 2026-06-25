/**
 * ロット不良（不良欠品処理）の状態機械。
 *
 * 入荷ロット単位で発覚した不良の対応状況を管理する。
 * 不良品振替台帳（defective.ts）とは別ドメイン: あちらは「振替の承認・実行」、
 * こちらは「ロット不良そのものの対応進捗」を表す。
 *
 * 5状態: 未対応 → メーカー連絡済 / 代替手配中 → 全件対応完了 → 終結。
 * - contactMaker: 未対応 → メーカー連絡済
 * - arrangeAlt  : 未対応 → 代替手配中
 * - complete    : メーカー連絡済 / 代替手配中 → 全件対応完了
 * - close       : 全件対応完了 → 終結
 *
 * ページ側で `{ ...row, status }` のように status を直書きしない。必ず
 * transitionLotDefect(row, action) を経由して遷移後レコードを得る。
 */

export type LotDefectStatus =
  | "未対応"
  | "メーカー連絡済"
  | "代替手配中"
  | "全件対応完了"
  | "終結";

export type LotDefectAction = "contactMaker" | "arrangeAlt" | "complete" | "close";

export type LotRootCause =
  | "メーカー由来"
  | "輸送中破損"
  | "倉庫保管不良"
  | "原因調査中";

export type LotResponsibility = "メーカー" | "配送業者" | "自社" | "未確定";

export interface LotDefectRecord {
  id: string;
  lot: string;
  sku: string;
  product: string;
  /** 不良品振替の振替元になる倉庫（INITIAL_INVENTORY の実在キーに揃える） */
  warehouse: string;
  /** 検出した不良数（台帳登録時の振替数量になる） */
  detected: number;
  /** 影響を受けた受注件数 */
  affected: number;
  rootCause: LotRootCause;
  reportedAt: string;
  status: LotDefectStatus;
  responsibility: LotResponsibility;
  /** 不良品振替台帳（defectiveStore）に登録済みの場合のレコードID */
  ledgerId?: string;
  /** createMasterStore（MasterRecord）互換のためのインデックスシグネチャ。 */
  [extra: string]: unknown;
}

const TRANSITIONS: Record<
  LotDefectStatus,
  Partial<Record<LotDefectAction, LotDefectStatus>>
> = {
  未対応: { contactMaker: "メーカー連絡済", arrangeAlt: "代替手配中" },
  メーカー連絡済: { complete: "全件対応完了" },
  代替手配中: { complete: "全件対応完了" },
  全件対応完了: { close: "終結" },
  終結: {},
};

export function nextLotStatus(
  status: LotDefectStatus,
  action: LotDefectAction,
): LotDefectStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransitionLot(
  status: LotDefectStatus,
  action: LotDefectAction,
): boolean {
  return nextLotStatus(status, action) !== null;
}

/**
 * 遷移を適用した新レコードを返す。
 * 不正遷移（ガード不成立）の場合は同一参照をそのまま返す（no-op）。
 */
export function transitionLotDefect(
  record: LotDefectRecord,
  action: LotDefectAction,
): LotDefectRecord {
  const target = nextLotStatus(record.status, action);
  if (target === null) return record;
  return { ...record, status: target };
}
