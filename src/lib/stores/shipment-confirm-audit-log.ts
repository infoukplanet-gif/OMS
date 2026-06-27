/**
 * 出荷確定ログ（監査用）の共有台帳（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/events-integration-v1.md（出荷確定の追加副作用）
 *
 * 出荷確定 cascade が、出荷確定のたびに監査用ログを 1 件記録する。
 * 「いつ・誰が・どの出荷を確定したか」を残し、後追い調査・証跡に使う。
 *
 * - shipmentId を冪等キーにし、同一出荷の再確定でも二重記録しない
 * - subscribe / getState は useSyncExternalStore で消費する想定
 */

import { createKeyedLedgerStore, type KeyedLedgerStore } from "./keyed-ledger";

/** snapshot/restore の domain キー。 */
export const SHIPMENT_CONFIRM_AUDIT_LOG_DOMAIN = "shipment-confirm-audit-log" as const;

/** 出荷確定の監査ログ 1 件。shipmentId が冪等キー。 */
export interface ShipmentConfirmAuditEntry {
  /** 確定された出荷伝票ID（冪等キー） */
  shipmentId: string;
  /** 紐づく受注ID（不明時は空文字） */
  orderId: string;
  /** 確定操作（固定値） */
  action: "出荷確定";
  /** 実行者 */
  actor: string;
  /** 監査用の詳細メモ */
  detail: string;
  /** 記録日時（YYYY/MM/DD） */
  recordedAt: string;
}

export type ShipmentConfirmAuditLogStore = KeyedLedgerStore<ShipmentConfirmAuditEntry>;

export function createShipmentConfirmAuditLogStore(
  initial: ReadonlyArray<ShipmentConfirmAuditEntry> = [],
): ShipmentConfirmAuditLogStore {
  return createKeyedLedgerStore<ShipmentConfirmAuditEntry>((e) => e.shipmentId, initial);
}

/** クライアントセッション内で共有される単一インスタンス。 */
export const shipmentConfirmAuditLogStore: ShipmentConfirmAuditLogStore =
  createShipmentConfirmAuditLogStore();
