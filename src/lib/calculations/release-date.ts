/**
 * 発売日時待ち判定
 *
 * 仕様: docs/prd/order-state-machine.md §6（連動先ドメイン表の発売日時待ち項）
 *
 * 「発売日時待ち」状態の order について、現在時刻が `releaseAt` を過ぎていれば
 * `releaseFromHold` 遷移の対象（解放準備済み）と判定する pure function。
 * スケジューラ・cron・SSR の loader 等から呼ばれ、得られた結果に対して呼び出し元が
 * `transitionOrder(order, "releaseFromHold")` を順次叩く。
 */

import type { OrderStatus } from "../state-machines/order";

/**
 * 発売日時待ち判定に必要な最小フィールド集合。
 * 実 Order は他にも商品・金額・顧客等を持つが、解放判定はこれだけに依存する。
 */
export interface ReleaseCandidate {
  status: OrderStatus;
  /** 解放予定時刻（ISO 8601）。発売日時待ち以外では undefined。 */
  releaseAt?: string;
}

/**
 * 単一 order が解放準備済みか判定する。
 *
 * 条件（すべて満たす場合のみ true）:
 *   1. status === "発売日時待ち"
 *   2. releaseAt が有効な ISO 8601 文字列
 *   3. releaseAt の時刻が現在以下（now >= releaseAt）
 */
export function isReadyForRelease(order: ReleaseCandidate, now: Date): boolean {
  if (order.status !== "発売日時待ち") return false;
  if (order.releaseAt === undefined) return false;
  const releaseAt = new Date(order.releaseAt).getTime();
  if (Number.isNaN(releaseAt)) return false;
  return releaseAt <= now.getTime();
}

/**
 * orders から解放準備済みのものだけを抽出する。
 * マッチした要素の参照同一性は保たれる（呼び出し元で diff チェックできるように）。
 */
export function ordersReadyForRelease<T extends ReleaseCandidate>(orders: T[], now: Date): T[] {
  return orders.filter((o) => isReadyForRelease(o, now));
}
