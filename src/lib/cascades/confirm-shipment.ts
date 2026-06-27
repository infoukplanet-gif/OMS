/**
 * 出荷確定 cascade（画面横断で共有する連鎖オーケストレーション）
 *
 * 仕様: docs/prd/shipment-state-machine.md / docs/prd/events-integration-v1.md
 *
 * shipments/page（出荷確定）から呼ばれる。shipmentStore.applyTransition(confirmShipment)
 * を起点に、受注の出荷登録（印刷済み→出荷済み）/ 在庫消費 / 出荷通知メールまでを適用する。
 *
 * - store 群は依存注入（fresh store でユニットテスト可能）
 * - 在庫消費は対応 Order の allocation を onHand+allocated 同時減算で確定する
 */

import type { AllocationLine } from "../state-machines/inventory";
import type { AutoMailEnabled, EnqueueResult, MailJob, MailQueue } from "../mail/queue";
import type { ShipmentStore } from "../stores/shipment";
import type { OrderStore } from "../stores/orders";
import type { InventoryStore } from "../stores/inventory";
import type { SalesStore } from "../stores/sales";
import type { MallShipmentNotificationStore } from "../stores/mall-shipment-notifications";
import type { WarehouseFtpDeliveryStore } from "../stores/warehouse-ftp-deliveries";
import type { ShipmentConfirmAuditLogStore } from "../stores/shipment-confirm-audit-log";
import { onShipmentConfirmed } from "../events/shipment-confirm-effects";

export interface ConfirmShipmentDeps {
  shipmentStore: ShipmentStore;
  orderStore: OrderStore;
  inventoryStore: InventoryStore;
  mailQueue: MailQueue;
  autoMailEnabled: AutoMailEnabled;
  /**
   * 確定売上台帳（任意）。渡された場合、出荷確定時に受注金額を出荷ベースの確定売上として計上する。
   * shipmentId が冪等キーなので、同一出荷の再確定でも二重計上されない。
   */
  salesStore?: SalesStore;
  /** モール出荷通知データ台帳（任意）。楽天/Yahoo!/Amazon 受注の出荷通知データを生成する。 */
  mallNotificationStore?: MallShipmentNotificationStore;
  /** 倉庫委託先 FTP 配信キュー（任意）。出庫元倉庫への確定報告ファイルを投入する。 */
  warehouseFtpDeliveryStore?: WarehouseFtpDeliveryStore;
  /** 出荷確定の監査ログ台帳（任意）。確定操作の証跡を残す。 */
  auditLogStore?: ShipmentConfirmAuditLogStore;
  /** 追加副作用に刻む確定日時（YYYY/MM/DD）。未指定は空文字。 */
  confirmedAt?: string;
  /** 監査ログの実行者。未指定は「システム」。 */
  actor?: string;
}

export interface ConfirmShipmentCascadeResult extends EnqueueResult {
  /** confirmShipment 遷移が実際に適用されたか（出荷待ち以外・未存在は false）。 */
  applied: boolean;
  /** 受注の registerShipment 連鎖が適用された件数（0 or 1）。 */
  cascadeApplied: number;
  /** 受注連鎖が打てなかった件数（対応 order が無い／状態不一致）。 */
  cascadeSkipped: number;
  /** 在庫消費が適用された SKU 数。 */
  consumed: number;
  /** 在庫消費が SM ガードで失敗した明細数。 */
  consumeFailed: number;
  /** 出荷ベースで台帳に計上された確定売上額（計上なしは 0）。 */
  revenueRecognized: number;
  /** モール出荷通知データを生成した件数（0 or 1）。 */
  mallNotified: number;
  /** 倉庫委託先 FTP 配信キューへ投入した件数（0 or 1）。 */
  ftpQueued: number;
  /** 出荷確定の監査ログを記録した件数（0 or 1）。 */
  auditLogged: number;
}

/**
 * 出荷を確定し、受注の出荷登録・在庫消費・出荷通知メールまで連鎖適用する。
 *
 * @param shipmentId 出荷伝票ID
 * @param deps 連鎖対象の共有ストア群
 */
export function applyConfirmShipmentCascade(
  shipmentId: string,
  deps: ConfirmShipmentDeps,
): ConfirmShipmentCascadeResult {
  const {
    shipmentStore,
    orderStore,
    inventoryStore,
    salesStore,
    mailQueue,
    autoMailEnabled,
    mallNotificationStore,
    warehouseFtpDeliveryStore,
    auditLogStore,
  } = deps;

  const shipmentRecord = shipmentStore.getState().find((s) => s.id === shipmentId);
  const tracking = shipmentRecord?.trackingNumber as string | undefined;
  const result = shipmentStore.applyTransition(shipmentId, "confirmShipment", {
    trackingNumber: tracking,
  });

  const mailJobs: MailJob[] = [];
  let cascadeApplied = 0;
  let cascadeSkipped = 0;
  let consumed = 0;
  let consumeFailed = 0;
  let revenueRecognized = 0;
  let mallNotified = 0;
  let ftpQueued = 0;
  let auditLogged = 0;

  if (!result.applied) {
    return {
      applied: false,
      ...mailQueue.enqueueAll([], autoMailEnabled),
      cascadeApplied,
      cascadeSkipped,
      consumed,
      consumeFailed,
      revenueRecognized,
      mallNotified,
      ftpQueued,
      auditLogged,
    };
  }

  if (result.effects.sendMail) mailJobs.push(result.effects.sendMail);

  // 受注の出荷登録（印刷済み → 出荷済み）
  if (result.effects.cascadeOrderAction) {
    const r = orderStore.applyTransition(
      result.effects.cascadeOrderAction.orderId,
      result.effects.cascadeOrderAction.action,
    );
    if (r.applied) cascadeApplied += 1;
    else cascadeSkipped += 1;
  }

  // 在庫消費: 対応 Order の allocation を onHand + allocated 同時減算で確定
  if (result.effects.consumeInventory) {
    const sharedOrder = orderStore
      .getState()
      .find((o) => o.id === result.effects.consumeInventory!.orderId);
    const allocation = sharedOrder?.allocation as AllocationLine[] | undefined;
    if (allocation && allocation.length > 0) {
      const cascade = inventoryStore.applyConsume(allocation);
      consumed += cascade.appliedCount;
      consumeFailed += cascade.failedLines.length;
    }
  }

  // 売上計上: 出荷確定で受注金額を出荷ベースの確定売上として台帳へ積む
  const recognizedOrderId =
    result.effects.cascadeOrderAction?.orderId ?? result.effects.consumeInventory?.orderId;
  if (salesStore && recognizedOrderId) {
    const order = orderStore.getState().find((o) => o.id === recognizedOrderId);
    const amount = Number(order?.amount ?? 0);
    if (order && amount > 0) {
      const recognizedAt = String(order.date ?? "").split(" ")[0];
      const recognized = salesStore.recognize({
        shipmentId,
        orderId: order.id,
        shop: String(order.shop ?? ""),
        customer: String(order.customer ?? ""),
        amount,
        recognizedAt,
      });
      if (recognized.applied) revenueRecognized += amount;
    }
  }

  // 追加副作用: モール出荷通知データ生成 / 倉庫委託先 FTP 配信 / 出荷確定の監査ログ。
  // 純粋関数 onShipmentConfirmed で記述子を組み立て、注入されたストアにのみ反映する
  // （shipmentId が冪等キーなので再確定でも二重生成されない）。
  if (mallNotificationStore || warehouseFtpDeliveryStore || auditLogStore) {
    const effectOrderId = result.effects.cascadeOrderAction?.orderId ?? result.effects.consumeInventory?.orderId;
    const effectOrder = effectOrderId
      ? orderStore.getState().find((o) => o.id === effectOrderId)
      : undefined;
    const effectAllocation = effectOrder?.allocation as AllocationLine[] | undefined;
    const confirmedAt = deps.confirmedAt ?? "";

    const effects = onShipmentConfirmed({
      shipmentId,
      orderId: effectOrderId,
      shop: String(effectOrder?.shop ?? shipmentRecord?.shop ?? ""),
      customer: String(effectOrder?.customer ?? shipmentRecord?.customer ?? ""),
      carrier: String(shipmentRecord?.carrier ?? ""),
      warehouse: String(effectAllocation?.[0]?.warehouse ?? ""),
      trackingNumber: tracking,
      actor: deps.actor ?? "システム",
    });

    if (effects.mallNotification && mallNotificationStore) {
      const d = effects.mallNotification;
      const r = mallNotificationStore.add({
        ...d,
        status: "生成済み",
        generatedAt: confirmedAt,
      });
      if (r.applied) mallNotified += 1;
    }

    if (effects.warehouseFtp && warehouseFtpDeliveryStore) {
      const d = effects.warehouseFtp;
      const r = warehouseFtpDeliveryStore.add({
        shipmentId: d.shipmentId,
        orderId: d.orderId,
        warehouse: d.warehouse,
        fileName: d.fileName,
        status: "配信待ち",
        queuedAt: confirmedAt,
      });
      if (r.applied) ftpQueued += 1;
    }

    if (effects.auditLog && auditLogStore) {
      const d = effects.auditLog;
      const r = auditLogStore.add({
        shipmentId: d.shipmentId,
        orderId: d.orderId,
        action: "出荷確定",
        actor: d.actor,
        detail: d.detail,
        recordedAt: confirmedAt,
      });
      if (r.applied) auditLogged += 1;
    }
  }

  return {
    applied: true,
    ...mailQueue.enqueueAll(mailJobs, autoMailEnabled),
    cascadeApplied,
    cascadeSkipped,
    consumed,
    consumeFailed,
    revenueRecognized,
    mallNotified,
    ftpQueued,
    auditLogged,
  };
}
