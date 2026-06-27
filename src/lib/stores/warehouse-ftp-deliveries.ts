/**
 * 倉庫委託先への確定報告（FTP配信）の共有キュー（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/events-integration-v1.md（出荷確定の追加副作用）
 *
 * 出荷確定 cascade が、出庫元倉庫（委託先）への確定報告ファイルを FTP 配信キューへ
 * 1 件ずつ投入する。v1 は「キュー投入まで」で、実際の FTP 送信は行わない。
 *
 * - shipmentId を冪等キーにし、同一出荷の再確定でも二重投入しない
 * - subscribe / getState は useSyncExternalStore で消費する想定
 */

import { createKeyedLedgerStore, type KeyedLedgerStore } from "./keyed-ledger";

/** snapshot/restore の domain キー。 */
export const WAREHOUSE_FTP_DELIVERY_DOMAIN = "warehouse-ftp-deliveries" as const;

/** 倉庫委託先へ配信する確定報告 1 件。shipmentId が冪等キー。 */
export interface WarehouseFtpDelivery {
  /** 生成元の出荷伝票ID（冪等キー） */
  shipmentId: string;
  /** 生成元の受注ID */
  orderId: string;
  /** 配信先倉庫（委託先） */
  warehouse: string;
  /** 配信ファイル名 */
  fileName: string;
  /** 配信状態（v1 はキュー投入のみ・実送信しない） */
  status: "配信待ち";
  /** キュー投入日（YYYY/MM/DD） */
  queuedAt: string;
}

export type WarehouseFtpDeliveryStore = KeyedLedgerStore<WarehouseFtpDelivery>;

export function createWarehouseFtpDeliveryStore(
  initial: ReadonlyArray<WarehouseFtpDelivery> = [],
): WarehouseFtpDeliveryStore {
  return createKeyedLedgerStore<WarehouseFtpDelivery>((d) => d.shipmentId, initial);
}

/** クライアントセッション内で共有される単一インスタンス。 */
export const warehouseFtpDeliveryStore: WarehouseFtpDeliveryStore =
  createWarehouseFtpDeliveryStore();
