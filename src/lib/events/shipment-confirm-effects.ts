/**
 * 出荷確定の「追加副作用」を記述子として返す pure function 群。
 *
 * 仕様: docs/prd/events-integration-v1.md（出荷確定の連鎖）の拡張。
 *
 * shipments/page・shipments/confirm/page の出荷確定 cascade
 * （applyConfirmShipmentCascade）が、受注出荷登録・在庫消費・売上計上・出荷通知メール
 * に加えて実行する 3 つの追加副作用を記述子化する:
 *   1. モール出荷通知データの生成（楽天 / Yahoo! / Amazon）
 *   2. 倉庫委託先への確定報告（FTP配信キュー投入）
 *   3. 出荷確定ログ（監査用）の記録
 *
 * - db や外部APIには触らない（記述子＝データ生成・キュー投入の「指示」を返すだけ）
 * - 実際の外部送信は行わない（v1 はデータ生成 / キュー投入まで）
 * - 連鎖の実行（ストアへの反映）は呼び出し元（cascade）の責務
 * - shipmentId を冪等キーにするので、同一出荷の再実行でも二重生成されない（実行側で担保）
 */

/** 出荷通知の対象モール。 */
export type MallChannel = "rakuten" | "yahoo" | "amazon";

/** モール判定の結果（コード + 表示用ラベル）。 */
export interface MallChannelInfo {
  code: MallChannel;
  label: string;
}

/** 店舗名 → モールチャネル の対応表（部分一致で判定）。 */
const MALL_RULES: ReadonlyArray<{ match: RegExp; info: MallChannelInfo }> = [
  { match: /楽天/, info: { code: "rakuten", label: "楽天市場" } },
  { match: /yahoo/i, info: { code: "yahoo", label: "Yahoo!ショッピング" } },
  { match: /amazon/i, info: { code: "amazon", label: "Amazon" } },
];

/**
 * 店舗名からモールチャネルを判定する。
 * 自社店舗（本店 / 本社 / 自社 / Shopify など）はモール外として null。
 */
export function resolveMallChannel(shop: string): MallChannelInfo | null {
  for (const rule of MALL_RULES) {
    if (rule.match.test(shop)) return rule.info;
  }
  return null;
}

/** 出荷確定の追加副作用を組み立てるための入力コンテキスト。 */
export interface ShipmentConfirmContext {
  /** 出荷伝票ID（全副作用の冪等キー） */
  shipmentId: string;
  /** 紐づく受注ID（不明な場合は監査ログのみ生成） */
  orderId?: string;
  /** 受注の店舗（モール判定に使う） */
  shop: string;
  /** 顧客名 */
  customer: string;
  /** 配送業者 */
  carrier: string;
  /** 出庫元倉庫（FTP配信先の判定に使う。不明なら空文字） */
  warehouse: string;
  /** 追跡番号（未割当なら undefined） */
  trackingNumber?: string;
  /** 監査ログの実行者 */
  actor: string;
}

/** モール出荷通知データ生成の記述子。 */
export interface MallShipmentNotificationDescriptor {
  shipmentId: string;
  orderId: string;
  mall: MallChannel;
  mallLabel: string;
  customer: string;
  carrier: string;
  trackingNumber: string;
}

/** 倉庫委託先への確定報告（FTP配信）の記述子。 */
export interface WarehouseFtpDescriptor {
  shipmentId: string;
  orderId: string;
  warehouse: string;
  /** 配信ファイル名（決定的: 出荷伝票IDから導出） */
  fileName: string;
}

/** 出荷確定の監査ログ記述子。 */
export interface ShipmentConfirmAuditDescriptor {
  shipmentId: string;
  orderId: string;
  actor: string;
  detail: string;
}

/** 出荷確定で生成しうる追加副作用記述子の集合。 */
export interface ShipmentConfirmEffects {
  mallNotification?: MallShipmentNotificationDescriptor;
  warehouseFtp?: WarehouseFtpDescriptor;
  auditLog?: ShipmentConfirmAuditDescriptor;
}

/**
 * 出荷確定の追加副作用記述子を組み立てる。
 *
 * - モール出荷通知: 受注がモール店舗（楽天/Yahoo!/Amazon）かつ orderId 判明時のみ
 * - 倉庫FTP配信: 出庫元倉庫が判明している時のみ（委託先が特定できる場合）
 * - 監査ログ: 常に生成（出荷自体の確定は orderId 不明でも記録する）
 */
export function onShipmentConfirmed(ctx: ShipmentConfirmContext): ShipmentConfirmEffects {
  const effects: ShipmentConfirmEffects = {};
  const orderId = ctx.orderId ?? "";
  const tracking = ctx.trackingNumber ?? "";

  // 1. モール出荷通知データ生成（楽天 / Yahoo! / Amazon）
  const mall = resolveMallChannel(ctx.shop);
  if (mall && ctx.orderId) {
    effects.mallNotification = {
      shipmentId: ctx.shipmentId,
      orderId,
      mall: mall.code,
      mallLabel: mall.label,
      customer: ctx.customer,
      carrier: ctx.carrier,
      trackingNumber: tracking,
    };
  }

  // 2. 倉庫委託先への確定報告（FTP配信キュー）
  if (ctx.warehouse) {
    effects.warehouseFtp = {
      shipmentId: ctx.shipmentId,
      orderId,
      warehouse: ctx.warehouse,
      fileName: `出荷確定_${ctx.shipmentId}.csv`,
    };
  }

  // 3. 出荷確定ログ（監査用）— 常に残す
  effects.auditLog = {
    shipmentId: ctx.shipmentId,
    orderId,
    actor: ctx.actor,
    detail: `${ctx.customer} 宛の出荷を確定（${ctx.carrier} / 追跡 ${tracking || "未割当"}）`,
  };

  return effects;
}
