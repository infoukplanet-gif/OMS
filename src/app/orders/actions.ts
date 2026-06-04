"use server";

/**
 * orderStore の snapshot / restore server action。
 *
 * v2 で全ドメイン共通の汎用永続化レイヤ（src/app/_actions/snapshots.ts）に統合した。
 * ここは既存呼び出し元（orders/page・mail/pending・dashboard）の API 互換を保つための
 * 薄い委譲ラッパで、domain="orders" を固定し OrderSeed[] 型を被せて返すだけ。
 *
 * 新規ドメインを永続化する時は snapshotDomain / restoreDomain を直接使う
 * （または usePersistentStore フックを使う）。
 */

import { snapshotDomain, restoreDomain } from "@/app/_actions/snapshots";
import type { SnapshotResult } from "@/lib/persistence/snapshot-domain";
import type { OrderSeed } from "@/lib/seeds/orders";

export type { SnapshotResult };

/** orderStore 全件を snapshot（domain="orders"）。 */
export async function snapshotOrders(
  orders: ReadonlyArray<OrderSeed>,
): Promise<SnapshotResult> {
  return snapshotDomain("orders", orders);
}

/** 保存済みの OrderSeed[] を restore（未接続/未保存時 null）。 */
export async function restoreOrders(): Promise<OrderSeed[] | null> {
  return restoreDomain<OrderSeed>("orders");
}
