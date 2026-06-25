/**
 * 一括注文完了の状態機械。
 *
 * 確認待ち・引当済・出荷待ち の受注を一括で「完了済」へ遷移させる。
 * 完了済は終端状態（以後の遷移なし）。
 *
 * ページ側で `{ ...row, status: "完了済" }` のように直書きしない。必ず
 * transitionBulkCompleteOrder(row, "complete") を経由して遷移後レコードを得る。
 *
 * 永続化ドメイン "bulk-complete-orders" の正規オーナーページは
 * src/app/orders/bulk-complete/page.tsx。
 */

export type BulkCompleteOrderStatus =
  | "確認待ち"
  | "引当済"
  | "出荷待ち"
  | "完了済";

export type BulkCompleteOrderAction = "complete";

export interface BulkCompleteOrderRecord {
  id: string;
  customer: string;
  status: BulkCompleteOrderStatus;
  amount: number;
  orderedAt: string;
  /** createMasterStore（MasterRecord）互換のためのインデックスシグネチャ。 */
  [extra: string]: unknown;
}

const TRANSITIONS: Record<
  BulkCompleteOrderStatus,
  Partial<Record<BulkCompleteOrderAction, BulkCompleteOrderStatus>>
> = {
  確認待ち: { complete: "完了済" },
  引当済: { complete: "完了済" },
  出荷待ち: { complete: "完了済" },
  完了済: {},
};

export function nextBulkCompleteOrderStatus(
  status: BulkCompleteOrderStatus,
  action: BulkCompleteOrderAction,
): BulkCompleteOrderStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransitionBulkCompleteOrder(
  status: BulkCompleteOrderStatus,
  action: BulkCompleteOrderAction,
): boolean {
  return nextBulkCompleteOrderStatus(status, action) !== null;
}

/**
 * 遷移を適用した新レコードを返す。
 * 不正遷移（ガード不成立）の場合は同一参照をそのまま返す（no-op）。
 */
export function transitionBulkCompleteOrder(
  record: BulkCompleteOrderRecord,
  action: BulkCompleteOrderAction,
): BulkCompleteOrderRecord {
  const target = nextBulkCompleteOrderStatus(record.status, action);
  if (target === null) return record;
  return { ...record, status: target };
}
