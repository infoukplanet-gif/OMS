/**
 * モール出荷通知データの共有台帳（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/events-integration-v1.md（出荷確定の追加副作用）
 *
 * 出荷確定 cascade が、モール受注（楽天 / Yahoo! / Amazon）の出荷確定時に
 * 各モールへ送るための出荷通知データ（追跡番号・配送業者など）を 1 件ずつ生成する。
 * v1 は「データ生成まで」で、実際のモール API 送信は行わない。
 *
 * - shipmentId を冪等キーにし、同一出荷の再確定でも二重生成しない
 * - subscribe / getState は useSyncExternalStore で消費する想定
 */

import { createKeyedLedgerStore, type KeyedLedgerStore } from "./keyed-ledger";
import type { MallChannel } from "../events/shipment-confirm-effects";

/** snapshot/restore の domain キー。 */
export const MALL_SHIPMENT_NOTIFICATION_DOMAIN = "mall-shipment-notifications" as const;

/** モール向けに生成された出荷通知データ 1 件。shipmentId が冪等キー。 */
export interface MallShipmentNotification {
  /** 生成元の出荷伝票ID（冪等キー） */
  shipmentId: string;
  /** 生成元の受注ID */
  orderId: string;
  /** 対象モール */
  mall: MallChannel;
  /** 対象モールの表示ラベル */
  mallLabel: string;
  /** 顧客名 */
  customer: string;
  /** 配送業者 */
  carrier: string;
  /** 追跡番号（未割当は空文字） */
  trackingNumber: string;
  /** 通知状態（v1 は生成のみ・実送信しない） */
  status: "生成済み";
  /** 生成日（YYYY/MM/DD） */
  generatedAt: string;
}

export type MallShipmentNotificationStore = KeyedLedgerStore<MallShipmentNotification>;

export function createMallShipmentNotificationStore(
  initial: ReadonlyArray<MallShipmentNotification> = [],
): MallShipmentNotificationStore {
  return createKeyedLedgerStore<MallShipmentNotification>((n) => n.shipmentId, initial);
}

/** クライアントセッション内で共有される単一インスタンス。 */
export const mallShipmentNotificationStore: MallShipmentNotificationStore =
  createMallShipmentNotificationStore();
